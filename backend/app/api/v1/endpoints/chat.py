"""
Chat endpoint for AI assistant (extended)

- Reuses existing /chat route for synchronous responses
- Adds /chat/stream route to stream model output via Server-Sent Events (SSE)
- Enriches context for 'payslip_explain' with up to 12 months (fiscal Apr 1 -> current)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse, PayslipExplainRequest
from app.services.gemini_service import gemini_service
from app.services.ai_templates import sanitize_context
from app.core.security import get_current_user
from app.core.supabase import get_supabase_admin_client
from typing import Dict, Optional, AsyncGenerator
import logging
from datetime import datetime, date
import json

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Optional[Dict] = Depends(get_current_user)
):
    """
    AI chat endpoint with context awareness and intent support (synchronous)
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
        
        # Handle intent-based context fetching
        if request.intent and current_user:
            enriched_context = await _enrich_context_by_intent(
                request.intent,
                request.context or {},
                current_user
            )
        else:
            enriched_context = request.context
        
        # Sanitize context data before sending to AI (use gemini_service's sanitize_and_mask)
        sanitized_context = gemini_service.sanitize_and_mask_context(enriched_context) if enriched_context else None
        
        # Build conversation history if provided
        conversation_context = _build_conversation_context(request.chat_history, sanitized_context)
        
        # Generate AI response
        response_text = await gemini_service.generate_response(
            query=request.query,
            context=conversation_context,
            intent=request.intent
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


@router.post("/chat/stream")
async def chat_stream(
    request: PayslipExplainRequest,
    current_user: Optional[Dict] = Depends(get_current_user)
):
    """
    Stream AI responses via Server-Sent Events (SSE).
    Body expects: { "intent": "payslip_explain", "payslip_id": "...", "query": "..." }
    """
    # For streaming we require auth if context is private
    if (request.intent and request.payslip_id) and not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for contextual streaming queries"
        )

    # Build context object (keep minimal)
    context = {}
    if request.intent == "payslip_explain" and request.payslip_id:
        context = {"payslip_id": request.payslip_id}

    # Enrich & sanitize context server-side
    enriched_context = await _enrich_context_by_intent(
        request.intent, 
        context, 
        current_user
    ) if request.intent and current_user else context
    
    sanitized_context = gemini_service.sanitize_and_mask_context(enriched_context) if enriched_context else None

    # Build conversation context with chat history
    conversation_context = _build_conversation_context(request.chat_history, sanitized_context)

    async def event_generator() -> AsyncGenerator[bytes, None]:
        try:
            # Stream chunks from the service
            async for chunk in gemini_service.generate_response_chunks(
                query=request.query or "Please explain the provided payslip",
                context=conversation_context,
                intent=request.intent,
                system_instruction=request.system_instruction
            ):
                # SSE format: data: <payload>\n\n
                yield f"data: {chunk}\n\n".encode("utf-8")
        except Exception as e:
            logger.exception("Error during streaming response")
            error_payload = json.dumps({"error": "Streaming terminated due to server error."})
            yield f"data: {error_payload}\n\n".encode("utf-8")

    return StreamingResponse(event_generator(), media_type="text/event-stream")


async def _enrich_context_by_intent(
    intent: str,
    context: Dict,
    current_user: Dict
) -> Dict:
    """
    Fetch additional context from database based on intent.
    
    For payslip_explain: fetch payslips for the last 12 months (fiscal year Apr 1 -> current month).
    
    Args:
        intent: The intent type (payslip_explain, leave_advice, etc.)
        context: Existing context from request
        current_user: Current authenticated user
    
    Returns:
        Enriched context with fetched data
    """
    supabase = get_supabase_admin_client()
    enriched = context.copy()
    
    try:
        # Get employee record for current user
        employee_response = supabase.table("employees").select(
            "id, company_id, designation, profile_id"
        ).eq("profile_id", current_user["user_id"]).single().execute()
        
        if not employee_response.data:
            return enriched
        
        employee = employee_response.data
        employee_id = employee["id"]
        
        # Fetch employee name/email/phone (will be masked later)
        try:
            profile_response = supabase.table("profiles").select(
                "full_name, email, phone"
            ).eq("id", current_user["user_id"]).single().execute()
            
            if profile_response.data:
                enriched["meta"] = enriched.get("meta", {})
                enriched["meta"]["employee_name"] = profile_response.data.get("full_name")
                enriched["meta"]["employee_email"] = profile_response.data.get("email")
                enriched["meta"]["employee_phone"] = profile_response.data.get("phone")
        except Exception:
            # OK to proceed without profile details
            pass
        
        if intent == "payslip_explain":
            # Compute fiscal year start (April 1st of fiscal year covering last 12 months)
            now = datetime.utcnow().date()
            if now.month >= 4:
                fiscal_start = date(now.year, 4, 1)
            else:
                # If current month before April, fiscal year started Apr 1 of previous year
                fiscal_start = date(now.year - 1, 4, 1)
            
            # Fetch payslips from fiscal_start to now (12 months)
            payslips_response = supabase.table("payslips").select(
                "*, payrolls(pay_period_start, pay_period_end)"
            ).eq("employee_id", employee_id).gte(
                "created_at", fiscal_start.isoformat()
            ).order("created_at", desc=True).limit(12).execute()
            
            if payslips_response.data:
                enriched["data"] = enriched.get("data", {})
                
                # Find the specific payslip if payslip_id provided
                payslip_id = context.get("payslip_id") or context.get("data", {}).get("payslip_id")
                if payslip_id:
                    # Find among fetched results or fetch single
                    found = next((p for p in payslips_response.data if p.get("id") == payslip_id), None)
                    if found:
                        enriched["data"]["current_payslip"] = found
                    else:
                        # Fallback: fetch single for accuracy
                        single = supabase.table("payslips").select(
                            "*, payrolls(pay_period_start, pay_period_end)"
                        ).eq("id", payslip_id).eq("employee_id", employee_id).single().execute()
                        if single.data:
                            enriched["data"]["current_payslip"] = single.data
                else:
                    # Use latest payslip
                    enriched["data"]["current_payslip"] = payslips_response.data[0]
                
                # Previous payslips: include up to 11 prior months for comparisons
                enriched["data"]["previous_payslips"] = payslips_response.data[1:12] if len(payslips_response.data) > 1 else []
                
                # Calculate YTD totals (sum gross/net across fetched payslips)
                try:
                    total_gross = 0.0
                    total_net = 0.0
                    for p in payslips_response.data:
                        pay_snapshot = p.get("pay_data_snapshot") or {}
                        gross = pay_snapshot.get("gross_pay") or p.get("gross_pay") or 0
                        net = pay_snapshot.get("net_pay") or p.get("net_pay") or 0
                        total_gross += float(gross or 0)
                        total_net += float(net or 0)
                    enriched["data"]["ytd_totals"] = {
                        "gross_ytd": total_gross,
                        "net_ytd": total_net,
                        "months_included": len(payslips_response.data)
                    }
                except Exception:
                    # Ignore arithmetic issues
                    pass
        

        elif intent == "leave_advice":
            # Fetch all leave balances for the employee
            balances_response = supabase.table("employee_leave_balances").select("*").eq("employee_id", employee_id).execute()
            if balances_response.data:
                enriched["data"] = enriched.get("data", {})
                enriched["data"]["leave_balances"] = balances_response.data

            # Fetch all leave requests for the employee (no limit)
            all_requests_response = supabase.table("leave_requests").select("*").eq("employee_id", employee_id).order("created_at", desc=True).execute()
            if all_requests_response.data:
                requests = all_requests_response.data
                # Group by status
                enriched["data"]["approved_leaves"] = [r for r in requests if r.get("status") == "approved"]
                enriched["data"]["pending_leaves"] = [r for r in requests if r.get("status") == "pending"]
                enriched["data"]["revoked_leaves"] = [r for r in requests if r.get("status") in ("revoked", "cancelled", "canceled")]
                enriched["data"]["rejected_leaves"] = [r for r in requests if r.get("status") == "rejected"]
                enriched["data"]["all_leaves"] = requests

                # Leaves taken: count of all approved + revoked/cancelled
                enriched["data"]["leaves_taken"] = len([r for r in requests if r.get("status") in ("approved", "revoked", "cancelled", "canceled")])

            # Fetch full salary structure for the employee (all fields/components)
            salary_response = supabase.table("salary_structures").select("*").eq("employee_id", employee_id).order("created_at", desc=True).execute()
            if salary_response.data:
                enriched["data"]["salary_structure"] = salary_response.data[0] if len(salary_response.data) > 0 else None

            # Fetch all active and upcoming leave periods/holidays for the company (no limit)
            periods_response = supabase.table("leave_periods").select("*").eq("company_id", employee["company_id"]).order("start_date", desc=False).execute()
            if periods_response.data:
                enriched["data"]["upcoming_holidays"] = [p for p in periods_response.data if not p.get("end_date") or p["end_date"] >= datetime.utcnow().date().isoformat()]
        
        elif intent in ["payslip_tax_suggestions", "dashboard_insights"]:
            # Fetch recent payslips for analysis (12 months)
            payslips_response = supabase.table("payslips").select(
                "*, payrolls(pay_period_start, pay_period_end)"
            ).eq("employee_id", employee_id).order(
                "created_at", desc=True
            ).limit(12).execute()
            
            if payslips_response.data:
                enriched["data"] = enriched.get("data", {})
                enriched["data"]["recent_payslips"] = payslips_response.data
            
            # Fetch leave balance for holistic view
            balance_response = supabase.table("employee_leave_balances").select(
                "*"
            ).eq("employee_id", employee_id).single().execute()
            
            if balance_response.data:
                enriched["data"]["leave_balance"] = balance_response.data
        
        enriched["page_view"] = intent
        
    except Exception as e:
        logger.warning(f"Could not enrich context for intent {intent}: {e}")
        # Return original context if enrichment fails
    
    return enriched


def _build_conversation_context(
    chat_history: Optional[list],
    current_context: Optional[Dict]
) -> Dict:
    """
    Merge chat history with current context
    
    Args:
        chat_history: Previous messages in conversation
        current_context: Current context data
    
    Returns:
        Combined context
    """
    combined = current_context.copy() if current_context else {}
    
    if chat_history and len(chat_history) > 0:
        # Add recent conversation for continuity (keep last 8 messages)
        combined["conversation_history"] = chat_history[-8:]
    
    return combined

