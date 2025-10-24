"""
Security utilities for JWT validation and authentication
"""

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict
from app.core.supabase import get_supabase_admin_client
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> Dict:
    """
    Verify JWT token using Supabase auth
    Returns the user data from the token
    """
    try:
        token = credentials.credentials
        supabase = get_supabase_admin_client()
        
        # Verify the token using Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = user_response.user
        
        # Fetch user profile to get role
        profile_response = supabase.table("profiles").select("role, company_id").eq(
            "id", user.id
        ).single().execute()
        
        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found"
            )
        
        return {
            "user_id": user.id,
            "email": user.email,
            "role": profile_response.data.get("role"),
            "company_id": profile_response.data.get("company_id")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(token_payload: Dict = Security(verify_token)) -> Dict:
    """
    Get current authenticated user
    """
    return token_payload


async def require_admin(current_user: Dict = Security(get_current_user)) -> Dict:
    """
    Require admin role for the endpoint
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
