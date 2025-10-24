"""
Session management utilities for cookie-based authentication
"""

from fastapi import Request, Response, HTTPException
from typing import Optional
import secrets
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

ACCESS_COOKIE_NAME = "access_token"
REFRESH_COOKIE_NAME = "refresh_token"
CSRF_COOKIE_NAME = "csrf_token"


def generate_csrf_token() -> str:
    """Generate a secure CSRF token"""
    return secrets.token_urlsafe(32)


def set_session_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    csrf_token: str,
    expires_in: int
):
    """
    Set session cookies (access, refresh, CSRF) with security flags
    """
    cookie_domain = settings.COOKIE_DOMAIN if settings.COOKIE_DOMAIN else None
    secure = settings.COOKIE_SECURE
    
    # For localhost development, don't set domain to allow cross-port cookies
    # In production, this should be set to your domain (e.g., ".yourdomain.com")
    logger.info(f"Setting cookies with domain={cookie_domain}, secure={secure}")
    
    # Access token cookie (HttpOnly)
    response.set_cookie(
        ACCESS_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=expires_in,
        domain=cookie_domain,
        path="/"
    )
    
    # Refresh token cookie (HttpOnly, longer expiry)
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=60*60*24*30,  # 30 days
        domain=cookie_domain,
        path="/"
    )
    
    # CSRF token cookie (NOT HttpOnly — JS needs to read it)
    response.set_cookie(
        CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=secure,
        samesite="lax",
        max_age=expires_in,
        domain=cookie_domain,
        path="/"
    )
    
    logger.info(f"Session cookies set: access_token={access_token[:20]}..., csrf_token={csrf_token}")


def clear_session_cookies(response: Response):
    """Clear all session cookies"""
    cookie_domain = settings.COOKIE_DOMAIN if settings.COOKIE_DOMAIN else None
    response.delete_cookie(ACCESS_COOKIE_NAME, domain=cookie_domain, path="/")
    response.delete_cookie(REFRESH_COOKIE_NAME, domain=cookie_domain, path="/")
    response.delete_cookie(CSRF_COOKIE_NAME, domain=cookie_domain, path="/")
    logger.info("Session cookies cleared")


def read_access_token_from_request(request: Request) -> Optional[str]:
    """Read access token from HttpOnly cookie"""
    return request.cookies.get(ACCESS_COOKIE_NAME)


def read_csrf_from_cookie(request: Request) -> Optional[str]:
    """Read CSRF token from cookie"""
    return request.cookies.get(CSRF_COOKIE_NAME)


async def validate_csrf_header(request: Request):
    """
    Validate CSRF token using double-submit pattern
    Cookie value must match header value
    """
    cookie_val = request.cookies.get(CSRF_COOKIE_NAME)
    header_val = request.headers.get("x-csrf-token")
    
    if not cookie_val or not header_val or cookie_val != header_val:
        logger.warning("CSRF validation failed")
        raise HTTPException(status_code=403, detail="Invalid or missing CSRF token")
    
    logger.debug("CSRF token validated successfully")
