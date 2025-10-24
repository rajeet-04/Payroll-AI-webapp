"""
Authentication endpoints for session management
"""

from fastapi import APIRouter, HTTPException, Response, Request, status
from pydantic import BaseModel, EmailStr
from app.services.session_manager import (
    set_session_cookies,
    clear_session_cookies,
    generate_csrf_token,
)
from app.services.supabase_admin import get_admin_client
from app.core.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    message: str
    csrf_token: str
    user: dict


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, response: Response):
    """
    Authenticate user and set session cookies
    Returns CSRF token for subsequent requests
    """
    supabase = get_admin_client()
    
    try:
        # Sign in with email/password via Supabase
        auth_resp = supabase.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
        
        if not auth_resp or not auth_resp.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        session = auth_resp.session
        user = auth_resp.user
        access_token = session.access_token
        refresh_token = session.refresh_token
        expires_in = session.expires_in or 3600
        
        # Generate CSRF token
        csrf = generate_csrf_token()
        
        # Set secure cookies
        set_session_cookies(
            response,
            access_token=access_token,
            refresh_token=refresh_token,
            csrf_token=csrf,
            expires_in=expires_in
        )
        
        logger.info(f"User logged in: {payload.email}")
        
        return {
            "message": "logged_in",
            "csrf_token": csrf,
            "user": {
                "id": user.id,
                "email": user.email
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Login failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Login failed"
        )


@router.post("/logout")
async def logout(response: Response):
    """
    Clear session cookies and log out user
    """
    clear_session_cookies(response)
    logger.info("User logged out")
    return {"message": "logged_out"}


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """
    Refresh access token using refresh token from cookie
    """
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token"
        )
    
    supabase = get_admin_client()
    
    try:
        # Refresh session
        auth_resp = supabase.auth.refresh_session(refresh_token)
        
        if not auth_resp or not auth_resp.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        session = auth_resp.session
        access_token = session.access_token
        new_refresh_token = session.refresh_token
        expires_in = session.expires_in or 3600
        
        # Generate new CSRF token
        csrf = generate_csrf_token()
        
        # Set new cookies
        set_session_cookies(
            response,
            access_token=access_token,
            refresh_token=new_refresh_token,
            csrf_token=csrf,
            expires_in=expires_in
        )
        
        logger.info("Token refreshed successfully")
        return {"message": "token_refreshed", "csrf_token": csrf}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Token refresh failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token refresh failed"
        )
