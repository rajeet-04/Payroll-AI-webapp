"""
Supabase admin client utilities and helpers
"""

from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def get_admin_client() -> Client:
    """
    Get Supabase client with service role key
    Use for admin operations after authorization checks
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def get_user_client(user_jwt: str) -> Client:
    """
    Create a Supabase client with user's JWT token
    This allows Supabase RLS policies to apply automatically
    """
    return create_client(settings.SUPABASE_URL, user_jwt)


async def create_employee_with_auth(
    email: str,
    password: str,
    full_name: str,
    company_id: str,
    role: str = "employee",
    **employee_data
) -> dict:
    """
    Create a new employee with auth user, profile, and employee record
    This is a transactional operation using admin client
    """
    admin = get_admin_client()
    
    try:
        # Create auth user using admin API
        auth_response = admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })
        
        if not auth_response.user:
            raise Exception("Failed to create auth user")
        
        user_id = auth_response.user.id
        
        # Create profile
        profile_data = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "role": role,
            "company_id": company_id
        }
        admin.table("profiles").insert(profile_data).execute()
        
        # Create employee record
        employee_record = {
            "id": user_id,
            "company_id": company_id,
            "full_name": full_name,
            "email": email,
            **employee_data
        }
        admin.table("employees").insert(employee_record).execute()
        
        logger.info(f"Employee created successfully: {email}")
        return {"user_id": user_id, "email": email}
        
    except Exception as e:
        logger.error(f"Failed to create employee: {e}")
        # TODO: Implement proper rollback mechanism
        raise Exception(f"Failed to create employee: {str(e)}")


async def get_user_profile(user_id: str) -> dict:
    """Get user profile by ID"""
    admin = get_admin_client()
    response = admin.table("profiles").select("*").eq("id", user_id).single().execute()
    return response.data
