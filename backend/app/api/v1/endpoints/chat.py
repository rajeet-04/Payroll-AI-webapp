"""
Chat endpoint for AI assistant
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import ChatRequest, ChatResponse
from app.services.gemini_service import gemini_service
from app.core.security import get_current_user
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Optional[Dict] = Depends(get_current_user)
):
    """
    AI chat endpoint with context awareness
    
    - Optional authentication for public queries
    - Required authentication for queries with private context
    """
    try:
        # Check if authentication is required
        has_private_context = (
            request.context and
            "data" in request.context and
            request.context["data"]
        )
        
        if has_private_context and not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required for contextual queries"
            )
        
        # Sanitize context data before sending to AI
        sanitized_context = _sanitize_context(request.context) if request.context else None
        
        # Generate AI response
        response_text = await gemini_service.generate_response(
            query=request.query,
            context=sanitized_context
        )
        
        return ChatResponse(
            response=response_text,
            context_used=bool(sanitized_context)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your request"
        )


def _sanitize_context(context: Dict) -> Dict:
    """
    Remove sensitive data from context before sending to AI
    
    Args:
        context: Raw context data
    
    Returns:
        Sanitized context
    """
    if not context:
        return {}
    
    # List of sensitive fields to remove
    sensitive_fields = [
        "bank_account",
        "bank_account_number",
        "ssn",
        "tax_id",
        "passport",
        "password",
        "token"
    ]
    
    sanitized = context.copy()
    
    # Remove sensitive fields from data
    if "data" in sanitized and isinstance(sanitized["data"], dict):
        data = sanitized["data"].copy()
        for field in sensitive_fields:
            data.pop(field, None)
        sanitized["data"] = data
    
    return sanitized
