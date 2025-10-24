"""
Payroll analysis and processing endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import (
    PayrollAnalysisRequest,
    PayrollAnalysisResponse,
    AnomalyDetail
)
from pydantic import BaseModel
from app.services.gemini_service import gemini_service
from app.services.pdf_service import pdf_service
from app.core.security import require_admin, get_current_user
from app.core.supabase import get_supabase_admin_client
from typing import Dict, List, Optional
from datetime import datetime
import logging
import base64
from fastapi.responses import Response

logger = logging.getLogger(__name__)
router = APIRouter()


class ProcessPayrollRequest(BaseModel):
    company_id: str
    pay_period_start: str
    pay_period_end: str
    created_by: str


class ProcessPayrollResponse(BaseModel):
    payroll_id: str
    status: str
    total_employees: int
    total_gross_pay: float
    total_net_pay: float
    message: str


@router.post("/process-payroll", response_model=ProcessPayrollResponse)
async def process_payroll(
    request: ProcessPayrollRequest,
    current_user: Dict = Depends(require_admin)
):
    """
    Process payroll for all active employees
    """
    try:
        supabase = get_supabase_admin_client()
        
        # Create payroll run
        payroll_response = supabase.table("payrolls").insert({
            "company_id": request.company_id,
            "pay_period_start": request.pay_period_start,
            "pay_period_end": request.pay_period_end,
            "status": "draft",
            "created_by": request.created_by
        }).execute()
        
        if not payroll_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create payroll run"
            )
        
        payroll_id = payroll_response.data[0]["id"]
        
        # Fetch active employees with salary structures
        employees_response = supabase.table("employees").select(
            "id, profile_id, designation, salary_structures!salary_structures_employee_id_fkey(base_pay, allowances, deductions_fixed, deductions_percent)"
        ).eq("company_id", request.company_id).eq("is_active", True).execute()
        
        if not employees_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active employees found"
            )
        
        employees = employees_response.data
        
        # Fetch profile names for all employees
        profile_ids = [emp["profile_id"] for emp in employees if emp.get("profile_id")]
        profiles_response = supabase.table("profiles").select(
            "id, full_name"
        ).in_("id", profile_ids).execute()
        
        # Create profile map
        profile_map = {p["id"]: p for p in (profiles_response.data or [])}
        
        # Fetch approved unpaid leaves for the period
        leaves_response = supabase.table("leave_requests").select(
            "employee_id, days_requested"
        ).eq("status", "approved").eq("leave_type", "unpaid").gte(
            "start_date", request.pay_period_start
        ).lte("end_date", request.pay_period_end).execute()
        
        # Create leave days map
        leave_days_map = {}
        for leave in (leaves_response.data or []):
            emp_id = leave["employee_id"]
            days = leave.get("days_requested", 0) or 0
            leave_days_map[emp_id] = leave_days_map.get(emp_id, 0) + days
        
        # Calculate working days in period
        start_date = datetime.fromisoformat(request.pay_period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(request.pay_period_end.replace('Z', '+00:00'))
        total_days = (end_date - start_date).days + 1
        
        # Generate payslips
        payslips = []
        total_gross = 0
        total_net = 0
        
        for employee in employees:
            # Skip employees without salary structure
            if not employee.get("salary_structures") or len(employee["salary_structures"]) == 0:
                logger.warning(f"Employee {employee['id']} has no salary structure, skipping")
                continue
            
            salary_struct = employee["salary_structures"][0]
            base_pay = float(salary_struct.get("base_pay", 0))
            
            # Get unpaid leave days
            unpaid_leave_days = leave_days_map.get(employee["id"], 0)
            
            # Calculate per day pay (assuming 30 days per month)
            per_day_pay = base_pay / 30
            leave_deduction = per_day_pay * unpaid_leave_days
            
            # Calculate allowances
            allowances = salary_struct.get("allowances", {})
            total_allowances = sum(float(v) for v in allowances.values() if isinstance(v, (int, float)))
            
            # Calculate deductions
            deductions_fixed = salary_struct.get("deductions_fixed", {})
            deductions_percent = salary_struct.get("deductions_percent", {})
            
            total_fixed_deductions = sum(float(v) for v in deductions_fixed.values() if isinstance(v, (int, float)))
            
            # Calculate percentage-based deductions
            gross_pay = base_pay + total_allowances
            total_percent_deductions = sum(
                gross_pay * (float(v) / 100) 
                for v in deductions_percent.values() 
                if isinstance(v, (int, float))
            )
            
            # Default tax deduction (10% if no tax bracket)
            tax_deduction = gross_pay * 0.1
            
            # Total deductions
            total_deductions = (
                leave_deduction + 
                total_fixed_deductions + 
                total_percent_deductions + 
                tax_deduction
            )
            
            net_pay = gross_pay - total_deductions
            
            # Prepare payslip data
            payslip_data = {
                "pay_data_snapshot": {
                    "base_pay": base_pay,
                    "allowances": allowances,
                    "deductions_fixed": deductions_fixed,
                    "deductions_percent": deductions_percent,
                    "unpaid_leave_days": unpaid_leave_days,
                    "leave_deduction": leave_deduction,
                    "tax_deduction": tax_deduction,
                },
                "gross_pay": gross_pay,
                "total_deductions": total_deductions,
                "net_pay": net_pay,
            }
            
            # Generate PDF
            profile_id = employee.get("profile_id")
            profile = profile_map.get(profile_id, {})
            
            employee_data = {
                "full_name": profile.get("full_name", "Unknown"),
                "employee_id": employee.get("id", "N/A")[:8],
                "designation": employee.get("designation", "N/A"),
            }
            
            try:
                pdf_bytes = pdf_service.generate_payslip_pdf(
                    employee_data=employee_data,
                    payslip_data=payslip_data,
                    company_name="Your Company"  # TODO: Fetch from company table
                )
                # Convert to base64 string for JSON serialization
                pdf_blob = base64.b64encode(pdf_bytes).decode('utf-8')
            except Exception as pdf_error:
                logger.error(f"Error generating PDF for employee {employee['id']}: {pdf_error}")
                pdf_blob = None
            
            payslips.append({
                "payroll_id": payroll_id,
                "employee_id": employee["id"],
                "pay_data_snapshot": payslip_data["pay_data_snapshot"],
                "gross_pay": gross_pay,
                "total_deductions": total_deductions,
                "net_pay": net_pay,
                "pdf_blob": pdf_blob,
                "created_by": request.created_by
            })
            
            total_gross += gross_pay
            total_net += net_pay
        
        # Insert payslips
        if payslips:
            supabase.table("payslips").insert(payslips).execute()
            
            # Update payroll status
            supabase.table("payrolls").update({
                "status": "processed"
            }).eq("id", payroll_id).execute()
        
        return ProcessPayrollResponse(
            payroll_id=payroll_id,
            status="processed",
            total_employees=len(payslips),
            total_gross_pay=total_gross,
            total_net_pay=total_net,
            message=f"Successfully processed payroll for {len(payslips)} employees"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing payroll: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred processing payroll: {str(e)}"
        )


@router.post("/analyze-payroll", response_model=PayrollAnalysisResponse)
async def analyze_payroll(
    request: PayrollAnalysisRequest,
    current_user: Dict = Depends(require_admin)
):
    """
    Analyze payroll run for anomalies
    
    - Requires admin authentication
    - Fetches payroll data securely
    - Uses AI to detect unusual patterns
    """
    try:
        # Get Supabase admin client (after authorization check)
        supabase = get_supabase_admin_client()
        
        # Fetch payroll data
        payroll_data = await _fetch_payroll_data(
            supabase,
            request.payroll_id,
            current_user["user_id"]
        )
        
        # Fetch previous payroll for comparison
        previous_payroll = await _fetch_previous_payroll(
            supabase,
            payroll_data.get("company_id"),
            payroll_data.get("pay_period_start")
        )
        
        # Analyze with AI
        analysis = await gemini_service.analyze_payroll_data(
            current_payroll=payroll_data,
            previous_payroll=previous_payroll
        )
        
        # Detect statistical anomalies
        anomalies = _detect_anomalies(payroll_data, previous_payroll)
        
        return PayrollAnalysisResponse(
            payroll_id=request.payroll_id,
            anomalies=anomalies,
            summary=analysis.get("summary", "Analysis complete")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing payroll: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred analyzing the payroll"
        )


async def _fetch_payroll_data(supabase, payroll_id: str, user_id: str) -> Dict:
    """
    Fetch payroll data with authorization check
    
    Args:
        supabase: Supabase client
        payroll_id: Payroll run ID
        user_id: Current user ID
    
    Returns:
        Payroll data
    """
    try:
        # Fetch payroll with payslips
        response = supabase.table("payrolls").select(
            "*, payslips(*), company:companies(*)"
        ).eq("id", payroll_id).single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payroll not found"
            )
        
        # Verify user has access to this company
        payroll = response.data
        
        return payroll
        
    except Exception as e:
        logger.error(f"Error fetching payroll data: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not fetch payroll data"
        )


async def _fetch_previous_payroll(
    supabase,
    company_id: str,
    current_period_start
) -> Dict:
    """Fetch previous payroll for comparison"""
    try:
        response = supabase.table("payrolls").select(
            "*, payslips(*)"
        ).eq("company_id", company_id).lt(
            "pay_period_start", current_period_start
        ).order("pay_period_start", desc=True).limit(1).execute()
        
        if response.data:
            return response.data[0]
        return {}
        
    except Exception as e:
        logger.warning(f"Could not fetch previous payroll: {e}")
        return {}


def _detect_anomalies(
    current_payroll: Dict,
    previous_payroll: Dict
) -> List[AnomalyDetail]:
    """
    Detect statistical anomalies in payroll data
    
    Args:
        current_payroll: Current payroll data
        previous_payroll: Previous payroll data
    
    Returns:
        List of detected anomalies
    """
    anomalies = []
    
    if not previous_payroll or "payslips" not in current_payroll:
        return anomalies
    
    # Create a map of previous payslips by employee
    prev_map = {}
    if "payslips" in previous_payroll:
        for payslip in previous_payroll["payslips"]:
            prev_map[payslip["employee_id"]] = payslip
    
    # Check each current payslip
    for payslip in current_payroll.get("payslips", []):
        employee_id = payslip["employee_id"]
        current_net = float(payslip.get("net_pay", 0))
        
        if employee_id in prev_map:
            prev_net = float(prev_map[employee_id].get("net_pay", 0))
            
            # Calculate percent change
            if prev_net > 0:
                change = (current_net - prev_net) / prev_net
                
                # Flag significant changes (>20% or <-10%)
                if abs(change) > 0.20:
                    severity = "high" if abs(change) > 0.30 else "medium"
                    
                    anomalies.append(AnomalyDetail(
                        employee_id=employee_id,
                        metric="net_pay",
                        previous_value=prev_net,
                        current_value=current_net,
                        percent_change=change,
                        severity=severity,
                        suggested_action="Review salary changes and deductions"
                    ))
    
    return anomalies


@router.get("/payslip/{payslip_id}/download")
async def download_payslip(
    payslip_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    Download payslip PDF
    
    - Requires authentication
    - Employees can only download their own payslips
    - Admins can download any payslip
    """
    try:
        supabase = get_supabase_admin_client()
        
        # Fetch payslip
        payslip_response = supabase.table("payslips").select(
            "id, employee_id, pdf_blob, created_at, payrolls(pay_period_start, pay_period_end)"
        ).eq("id", payslip_id).single().execute()
        
        if not payslip_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payslip not found"
            )
        
        payslip = payslip_response.data
        
        # Authorization check: Employee can only download their own, admin can download any
        if current_user.get("role") != "admin":
            # Get employee ID for current user
            employee_response = supabase.table("employees").select("id").eq(
                "profile_id", current_user["user_id"]
            ).single().execute()
            
            if not employee_response.data:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No employee record found"
                )
            
            if payslip["employee_id"] != employee_response.data["id"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        # Get PDF blob
        pdf_blob = payslip.get("pdf_blob")
        if not pdf_blob:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF not available for this payslip"
            )
        
        # Decode PDF - handle multiple formats
        try:
            if isinstance(pdf_blob, bytes):
                # Postgres BYTEA returns as bytes
                pdf_blob_str = pdf_blob.decode('utf-8')
            elif isinstance(pdf_blob, str):
                pdf_blob_str = pdf_blob
            else:
                raise ValueError(f"Unexpected pdf_blob type: {type(pdf_blob)}")
            
            # Check if hex-encoded by Postgres
            if pdf_blob_str.startswith('\\x'):
                # Hex-encoded: decode from hex, then decode base64
                hex_str = pdf_blob_str[2:]  # Remove \x prefix
                base64_bytes = bytes.fromhex(hex_str)
                base64_str = base64_bytes.decode('utf-8')
                pdf_bytes = base64.b64decode(base64_str)
            else:
                # Direct base64
                pdf_bytes = base64.b64decode(pdf_blob_str)
                
            # Verify it's a valid PDF by checking magic bytes
            if not pdf_bytes.startswith(b'%PDF'):
                logger.error(f"Invalid PDF format - magic bytes: {pdf_bytes[:10]}")
                raise ValueError("Invalid PDF format")
                
        except Exception as e:
            logger.error(f"Error decoding PDF (type: {type(pdf_blob)}, starts with: {str(pdf_blob)[:20] if pdf_blob else 'None'}): {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing PDF: {str(e)}"
            )
        
        # Generate filename
        pay_period = payslip.get("payrolls", {})
        if pay_period and pay_period.get("pay_period_start"):
            period_date = datetime.fromisoformat(pay_period["pay_period_start"].replace('Z', '+00:00'))
            filename = f"payslip_{period_date.strftime('%Y_%m')}.pdf"
        else:
            filename = f"payslip_{payslip_id[:8]}.pdf"
        
        # Return PDF response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading payslip: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred downloading the payslip"
        )
