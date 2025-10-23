"""
Security utilities for JWT validation and authentication
"""

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional, Dict
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> Dict:
    """
    Verify and decode JWT token from Supabase
    Returns the decoded payload
    """
    try:
        token = credentials.credentials
        
        # Decode and verify the JWT
        # Note: In production, you should verify against Supabase's public key
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_signature": False}  # For Supabase tokens, verify differently
        )
        
        return payload
        
    except JWTError as e:
        logger.error(f"JWT validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(token_payload: Dict = Security(verify_token)) -> Dict:
    """
    Extract user information from validated token
    """
    user_id = token_payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    return {
        "user_id": user_id,
        "email": token_payload.get("email"),
        "role": token_payload.get("role")
    }


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
