"""
Payroll analysis endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import (
    PayrollAnalysisRequest,
    PayrollAnalysisResponse,
    AnomalyDetail
)
from app.services.gemini_service import gemini_service
from app.core.security import require_admin
from app.core.supabase import get_supabase_admin_client
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


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
