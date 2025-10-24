"""
Consolidated proxy endpoint for Supabase operations
"""

from fastapi import APIRouter, Request, HTTPException, status
from app.schemas.proxy_schemas import ProxyRequest, ProxyResponse, ResourceEnum, ActionEnum
from app.services.session_manager import read_access_token_from_request, validate_csrf_header
from app.services.supabase_admin import get_user_client, get_admin_client, get_user_profile, create_employee_with_auth
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_current_user_from_cookie(request: Request) -> dict:
    """
    Extract and validate user from access token cookie
    """
    token = read_access_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Verify token and get user
    admin = get_admin_client()
    try:
        user_response = admin.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user = user_response.user
        profile = await get_user_profile(user.id)
        
        return {
            "user_id": user.id,
            "email": user.email,
            "role": profile.get("role"),
            "company_id": profile.get("company_id")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


@router.post("/", response_model=ProxyResponse)
async def proxy(request: Request, payload: ProxyRequest):
    """
    Consolidated proxy endpoint for all Supabase operations
    Routes requests based on resource and action
    """
    # Validate CSRF for state-changing operations
    state_changing_actions = {
        ActionEnum.create,
        ActionEnum.update,
        ActionEnum.delete,
        ActionEnum.approve,
        ActionEnum.deny
    }
    
    if payload.action in state_changing_actions:
        await validate_csrf_header(request)
    
    # Get authenticated user
    current_user = await get_current_user_from_cookie(request)
    token = read_access_token_from_request(request)
    
    # Get clients
    user_client = get_user_client(token)
    admin_client = get_admin_client()
    
    try:
        # Route to handlers based on resource
        if payload.resource == ResourceEnum.profiles:
            return await handle_profiles(payload, current_user, user_client, admin_client)
        elif payload.resource == ResourceEnum.employees:
            return await handle_employees(payload, current_user, user_client, admin_client)
        elif payload.resource == ResourceEnum.leave:
            return await handle_leave(payload, current_user, user_client, admin_client)
        elif payload.resource == ResourceEnum.leave_periods:
            return await handle_leave_periods(payload, current_user, user_client, admin_client)
        elif payload.resource == ResourceEnum.payslips:
            return await handle_payslips(payload, current_user, user_client, admin_client)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported resource: {payload.resource}"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Proxy request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Operation failed: {str(e)}"
        )


async def handle_profiles(payload: ProxyRequest, current_user: dict, user_client, admin_client):
    """Handle profile operations"""
    if payload.action == ActionEnum.me:
        profile = await get_user_profile(current_user["user_id"])
        return ProxyResponse(data=profile)
    
    elif payload.action == ActionEnum.get:
        user_id = (payload.params or {}).get("user_id")
        if not user_id:
            raise HTTPException(400, "user_id required")
        profile = await get_user_profile(user_id)
        return ProxyResponse(data=profile)
    
    raise HTTPException(400, f"Unsupported action for profiles: {payload.action}")


async def handle_employees(payload: ProxyRequest, current_user: dict, user_client, admin_client):
    """Handle employee operations"""
    if payload.action == ActionEnum.list:
        company_id = (payload.params or {}).get("company_id") or current_user.get("company_id")
        if not company_id:
            raise HTTPException(400, "company_id required")
        
        # Use admin client for listing (with company filter)
        query = admin_client.table("employees").select(
            "*, salary_structures!salary_structures_employee_id_fkey(*)"
        ).eq("company_id", company_id)
        
        # Optional filter by active status
        active = (payload.params or {}).get("active")
        if active is not None:
            query = query.eq("is_active", active)
        
        result = query.execute()
        return ProxyResponse(data=result.data)
    
    elif payload.action == ActionEnum.create:
        # Admin only
        if current_user.get("role") != "admin":
            raise HTTPException(403, "Admin access required")
        
        data = payload.data or {}
        required_fields = ["email", "password", "full_name"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(400, f"Missing required field: {field}")
        
        # Create employee with auth
        result = await create_employee_with_auth(
            email=data["email"],
            password=data["password"],
            full_name=data["full_name"],
            company_id=data.get("company_id") or current_user.get("company_id"),
            role=data.get("role", "employee"),
            designation=data.get("designation"),
            join_date=data.get("join_date"),
            is_active=data.get("is_active", True)
        )
        
        # Create salary structure if provided
        if "salary_structure" in data:
            salary_data = data["salary_structure"]
            salary_data["employee_id"] = result["user_id"]
            admin_client.table("salary_structures").insert(salary_data).execute()
        
        return ProxyResponse(data=result, message="Employee created successfully")
    
    elif payload.action == ActionEnum.update:
        # Admin only
        if current_user.get("role") != "admin":
            raise HTTPException(403, "Admin access required")
        
        employee_id = (payload.params or {}).get("employee_id")
        if not employee_id:
            raise HTTPException(400, "employee_id required")
        
        data = payload.data or {}
        result = admin_client.table("employees").update(data).eq("id", employee_id).execute()
        return ProxyResponse(data=result.data, message="Employee updated")
    
    raise HTTPException(400, f"Unsupported action for employees: {payload.action}")


async def handle_leave(payload: ProxyRequest, current_user: dict, user_client, admin_client):
    """Handle leave request operations"""
    if payload.action == ActionEnum.list:
        # List leave requests
        employee_id = (payload.params or {}).get("employee_id")
        
        query = admin_client.table("leave_requests").select(
            "*, leave_periods(*)"
        )
        
        if employee_id:
            query = query.eq("employee_id", employee_id)
        elif current_user.get("role") != "admin":
            # Non-admin can only see their own
            query = query.eq("employee_id", current_user["user_id"])
        else:
            # Admin sees all for their company
            query = query.eq("company_id", current_user.get("company_id"))
        
        result = query.execute()
        return ProxyResponse(data=result.data)
    
    elif payload.action == ActionEnum.create:
        data = payload.data or {}
        required_fields = ["leave_period_id", "start_date", "end_date", "reason", "leave_type"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(400, f"Missing required field: {field}")
        
        # Create leave request
        request_data = {
            "employee_id": data.get("employee_id") or current_user["user_id"],
            "leave_period_id": data["leave_period_id"],
            "start_date": data["start_date"],
            "end_date": data["end_date"],
            "days_requested": data.get("days_requested", 1),
            "reason": data["reason"],
            "leave_type": data["leave_type"],
            "status": "pending"
        }
        
        result = admin_client.table("leave_requests").insert(request_data).execute()
        return ProxyResponse(data=result.data, message="Leave request created")
    
    elif payload.action == ActionEnum.approve or payload.action == ActionEnum.deny:
        # Admin only
        if current_user.get("role") != "admin":
            raise HTTPException(403, "Admin access required")
        
        request_id = (payload.params or {}).get("request_id")
        if not request_id:
            raise HTTPException(400, "request_id required")
        
        new_status = "approved" if payload.action == ActionEnum.approve else "denied"
        
        # Update leave request
        result = admin_client.table("leave_requests").update({
            "status": new_status,
            "approved_by": current_user["user_id"]
        }).eq("id", request_id).execute()
        
        # TODO: Update leave balance if approved
        
        return ProxyResponse(data=result.data, message=f"Leave request {new_status}")
    
    raise HTTPException(400, f"Unsupported action for leave: {payload.action}")


async def handle_leave_periods(payload: ProxyRequest, current_user: dict, user_client, admin_client):
    """Handle leave period operations"""
    if payload.action == ActionEnum.list:
        company_id = (payload.params or {}).get("company_id") or current_user.get("company_id")
        result = admin_client.table("leave_periods").select("*").eq("company_id", company_id).execute()
        return ProxyResponse(data=result.data)
    
    elif payload.action == ActionEnum.create:
        # Admin only
        if current_user.get("role") != "admin":
            raise HTTPException(403, "Admin access required")
        
        data = payload.data or {}
        data["company_id"] = data.get("company_id") or current_user.get("company_id")
        
        result = admin_client.table("leave_periods").insert(data).execute()
        return ProxyResponse(data=result.data, message="Leave period created")
    
    raise HTTPException(400, f"Unsupported action for leave_periods: {payload.action}")


async def handle_payslips(payload: ProxyRequest, current_user: dict, user_client, admin_client):
    """Handle payslip operations"""
    if payload.action == ActionEnum.list:
        query = admin_client.table("payslips").select("*")
        
        employee_id = (payload.params or {}).get("employee_id")
        payroll_id = (payload.params or {}).get("payroll_id")
        
        if employee_id:
            query = query.eq("employee_id", employee_id)
        elif payroll_id:
            query = query.eq("payroll_id", payroll_id)
        elif current_user.get("role") != "admin":
            # Non-admin can only see their own
            query = query.eq("employee_id", current_user["user_id"])
        
        result = query.execute()
        return ProxyResponse(data=result.data)
    
    raise HTTPException(400, f"Unsupported action for payslips: {payload.action}")
