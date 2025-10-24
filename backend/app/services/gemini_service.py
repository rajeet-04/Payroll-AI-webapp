"""
Gemini AI service for intelligent features (updated to gemini-2.5-flash)

Provides:
- deterministic generation configuration (low temperature)
- helper: sanitize_and_mask_context()
- generate_response(...) -> full text
- generate_response_chunks(...) -> async generator that yields text chunks (for SSE)
"""

from google import genai
from app.core.config import settings
from app.services.ai_templates import (
    AITemplates,
    sanitize_context,
    format_context_for_prompt
)
import logging
from typing import Dict, Any, Optional, AsyncGenerator
import json
import re
import asyncio

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Gemini AI (gemini-2.5-flash)"""

    def __init__(self):
        # Use the new google-genai SDK client
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-2.5-flash"

        # Deterministic / structured output settings (low temperature for accuracy)
        self.generation_config = {
            "temperature": 0.15,
            "top_p": 0.9,
            "max_output_tokens": 8192,
        }

        # chunk size used by server-side chunked streaming (characters)
        self._stream_chunk_size = 200
        
        # Store active chat sessions per request (in-memory, consider Redis for production)
        self._chat_sessions = {}

    def _mask_email(self, email: str) -> str:
        """Simple email masking: keep first character of local and domain root, mask rest"""
        try:
            local, domain = email.split("@", 1)
            local_masked = (local[0] + "***") if len(local) > 1 else "***"
            domain_parts = domain.split(".")
            domain_root = domain_parts[0]
            domain_masked = (domain_root[0] + "***") if len(domain_root) > 1 else "***"
            rest = "." + ".".join(domain_parts[1:]) if len(domain_parts) > 1 else ""
            return f"{local_masked}@{domain_masked}{rest}"
        except Exception:
            return "***@***.***"

    def _mask_phone(self, phone: str) -> str:
        """Mask phone numbers leaving country code and first 2 digits, mask rest"""
        digits = re.sub(r"\D", "", phone)
        if len(digits) <= 4:
            return "****"
        if digits.startswith("91") and len(digits) >= 10:
            # India: +91XXXXXXXXXX -> +91-98****
            return f"+91-{digits[2:4]}****"
        return digits[:2] + "****"

    def _mask_string_values(self, data: Any) -> Any:
        """Recursively mask email/phone occurrences in strings in the sanitized context"""
        if isinstance(data, dict):
            masked = {}
            for k, v in data.items():
                masked[k] = self._mask_string_values(v)
            return masked
        if isinstance(data, list):
            return [self._mask_string_values(i) for i in data]
        if isinstance(data, str):
            # mask emails
            if "@" in data and re.match(r".+@.+\..+", data):
                return self._mask_email(data)
            # mask phone-like strings
            if re.search(r"\d{6,}", data):
                return self._mask_phone(data)
            return data
        return data

    def sanitize_and_mask_context(self, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Sanitize using existing template helper, then mask contact-like strings.
        Removes all sensitive fields (PAN, Aadhaar, bank numbers etc.) and masks emails/phones.
        """
        if not context:
            return {}
        sanitized = sanitize_context(context)
        masked = self._mask_string_values(sanitized)
        return masked

    def _compact_payslip_context(self, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Reduce and normalize the sanitized context to only the essential fields
        that the model needs. This avoids sending large or duplicated structures
        which can increase token usage and trigger MAX_TOKENS or safety filters.
        """
        if not context or not isinstance(context, dict):
            return {}

        data = context.get("data") if "data" in context else context
        compact = {}

        # Current payslip summary
        cur = data.get("current_payslip") if isinstance(data, dict) else None
        if cur:
            cps = {}
            pay_snapshot = cur.get("pay_data_snapshot", {}) or {}
            cps["base_pay"] = pay_snapshot.get("base_pay")
            # keep allowances as-is but limit keys
            allowances = pay_snapshot.get("allowances") or {}
            cps["allowances"] = {k: allowances.get(k) for k in ("hra", "meal", "transport", "other") if k in allowances}
            cps["gross_pay"] = cur.get("gross_pay")
            cps["total_deductions"] = cur.get("total_deductions") or pay_snapshot.get("total_deductions")
            cps["net_pay"] = cur.get("net_pay")
            # payroll period
            payrolls = cur.get("payrolls") or {}
            cps["pay_period_start"] = payrolls.get("pay_period_start")
            cps["pay_period_end"] = payrolls.get("pay_period_end")
            compact["current_payslip"] = cps

        # Previous payslips: include up to last 12, but only compact summary fields
        prev = data.get("previous_payslips") if isinstance(data, dict) else None
        if prev and isinstance(prev, list):
            summarized = []
            for p in prev[:12]:
                psnap = p.get("pay_data_snapshot", {}) or {}
                summarized.append({
                    "created_at": p.get("created_at"),
                    "gross_pay": p.get("gross_pay"),
                    "net_pay": p.get("net_pay"),
                    "leave_deduction": psnap.get("leave_deduction"),
                    "total_deductions": p.get("total_deductions") or psnap.get("total_deductions")
                })
            compact["previous_payslips"] = summarized

        # YTD totals
        ytd = data.get("ytd_totals") if isinstance(data, dict) else None
        if ytd:
            compact["ytd_totals"] = {
                "gross_ytd": ytd.get("gross_ytd"),
                "net_ytd": ytd.get("net_ytd"),
                "months_included": ytd.get("months_included")
            }

        # Pass along minimal intent/page info if present
        if isinstance(data, dict) and data.get("intent"):
            compact["intent"] = data.get("intent")
        if isinstance(data, dict) and data.get("page_view"):
            compact["page_view"] = data.get("page_view")

        return {"data": compact}

    def _build_prompt_with_template(self, query: str, context: Dict[str, Any], intent: Optional[str]) -> str:
        """
        Build prompt using templates and formatted context
        """
        if intent:
            template = AITemplates.get_template(intent)
        else:
            template = AITemplates._general_template()  # fallback
        context_str = format_context_for_prompt(context or {}, intent)
        prompt = f"""{template}

Context Information:
{context_str}

User Question: {query}

Please provide a helpful, accurate response based on the context provided. Return a human-friendly response, and where possible return a short structured JSON snippet summarizing key fields (summary, earnings, deductions, comparisons, advice)."""
        return prompt
    
    async def generate_response(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None,
        intent: Optional[str] = None,
        system_instruction: Optional[str] = None
    ) -> str:
        """
        Generate AI response for a query
        
        Args:
            query: User's question
            context: Optional context data (will be sanitized)
            intent: Optional intent key (e.g., 'payslip_explain', 'leave_advice')
            system_instruction: Optional custom system instruction
        
        Returns:
            AI-generated response
        """
        try:
            # Sanitize and mask context
            safe_context = self.sanitize_and_mask_context(context) if context else {}
            # Compact context to essential fields to avoid duplicated/oversized prompts
            safe_context = self._compact_payslip_context(safe_context) if safe_context else {}
            
            # Build prompt with template if intent provided
            prompt = self._build_prompt_with_template(query, safe_context, intent)
            
            # Prepend custom system instruction if provided
            if system_instruction:
                prompt = f"SYSTEM INSTRUCTION: {system_instruction}\n\n{prompt}"
            
            # VERBOSE: Print the full prompt being sent to AI
            # print(f"VERBOSE: Sending prompt to AI:\n{prompt}\n")  # Commented out for production
            
            # Generate response using new SDK
            config = genai.types.GenerateContentConfig(
                temperature=self.generation_config["temperature"],
                top_p=self.generation_config["top_p"],
                max_output_tokens=self.generation_config["max_output_tokens"]
            )
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )

            # Inspect prompt feedback for an explicit block (prompt blocked)
            prompt_feedback = getattr(response, 'prompt_feedback', None)
            if prompt_feedback is not None and getattr(prompt_feedback, 'block_reason', None):
                block = getattr(prompt_feedback, 'block_reason')
                logger.warning(f"Prompt was blocked by content filters. Block reason: {block}")
                return (
                    "I apologize; the query or context appears to be blocked by the content filters. "
                    "Please remove any sensitive identifiers or rephrase your question and try again."
                )

            # If the API returned no candidates, advise rephrasing
            candidates = getattr(response, 'candidates', None)
            if not candidates:
                logger.warning("No candidates returned by model. Check promptFeedback for block reasons.")
                return (
                    "I apologize, but I couldn't generate a response. Please try rephrasing your question "
                    "or provide less sensitive context."
                )

            # Try to extract usable text from candidates in a robust way
            for idx, cand in enumerate(candidates):
                finish_reason = getattr(cand, 'finish_reason', getattr(cand, 'finishReason', None))
                logger.debug(f"Candidate {idx} finish_reason={finish_reason}")
                # Attempt a few extraction strategies (SDK shapes vary)
                try:
                    # 1) Quick accessor on overall response (if available and valid)
                    try:
                        txt = response.text
                        if txt:
                            return txt
                    except Exception:
                        pass

                    # 2) Try candidate.content which may hold parts/segments
                    content = getattr(cand, 'content', None)
                    if content:
                        parts = None
                        # content may be a list-like or an object with 'parts' or 'segments'
                        if isinstance(content, (list, tuple)):
                            parts = content
                        else:
                            parts = getattr(content, 'parts', None) or getattr(content, 'segments', None) or [content]

                        texts = []
                        for p in parts:
                            t = getattr(p, 'text', None)
                            if t is None and isinstance(p, dict):
                                t = p.get('text')
                            if t:
                                texts.append(t)

                        joined = "".join(texts).strip()
                        if joined:
                            return joined

                    # 3) Some SDKs present candidate.message or candidate.output_text
                    for attr in ('message', 'output_text', 'text'):
                        val = getattr(cand, attr, None)
                        if val and isinstance(val, str) and val.strip():
                            return val.strip()
                except Exception as e:
                    logger.warning(f"Failed to extract text from candidate {idx}: {e}")

            # If we got here, no candidate contained usable text. Log finish reasons and give helpful guidance.
            fr_reasons = [getattr(c, 'finish_reason', getattr(c, 'finishReason', None)) for c in candidates]
            logger.warning(f"No usable text found in any candidate. finish_reasons={fr_reasons}")

            # If any finish reason indicates safety or sensitive PII, return a specific message
            unsafe_indicators = {"SAFETY", "SPII", "BLOCKLIST", "PROHIBITED_CONTENT"}
            if any(str(fr).upper() in unsafe_indicators for fr in fr_reasons if fr):
                return (
                    "I apologize, the model blocked generation due to safety or privacy concerns. "
                    "Please remove any sensitive data (IDs, account numbers) and try again."
                )

            return (
                "I apologize, but I couldn't generate a proper response. Please try rephrasing your question "
                "or provide different context."
            )
            
        except AttributeError as e:
            logger.error(f"Response format error: {e}")
            return "I apologize, but the response format was unexpected. Please try again."
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return "I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists."
    
    async def generate_response_chunks(
        self, 
        query: str, 
        context: Optional[Dict[str, Any]] = None, 
        intent: Optional[str] = None, 
        system_instruction: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Real-time streaming generator using the new google-genai SDK with chat sessions.
        Yields text chunks as they are generated by the model.
        """
        try:
            # Sanitize and mask context
            safe_context = self.sanitize_and_mask_context(context) if context else {}
            
            # Extract conversation history from context if present
            chat_history = safe_context.get("conversation_history", [])
            
            # Remove conversation history from context to avoid duplication
            if "conversation_history" in safe_context:
                safe_context = {k: v for k, v in safe_context.items() if k != "conversation_history"}
            
            # Compact context to essential fields
            safe_context = self._compact_payslip_context(safe_context) if safe_context else {}
            
            # Build prompt with template
            prompt = self._build_prompt_with_template(query, safe_context, intent)
            
            # Prepend custom system instruction if provided
            if system_instruction:
                prompt = f"SYSTEM INSTRUCTION: {system_instruction}\n\n{prompt}"
            
            # Create or get chat session
            # For stateless API, we create a new chat session each time with history
            config = genai.types.GenerateContentConfig(
                temperature=self.generation_config["temperature"],
                top_p=self.generation_config["top_p"],
                max_output_tokens=self.generation_config["max_output_tokens"]
            )
            
            # If we have chat history, create a chat with history
            if chat_history and len(chat_history) > 0:
                # Create a chat session
                chat = self.client.chats.create(
                    model=self.model_name,
                    config=config
                )
                
                # Manually build history by sending previous messages
                # Note: In production, you'd want to replay history more efficiently
                # For now, we'll just use the context in the prompt
                
                # Add history context to prompt
                history_context = "\n\nPrevious conversation:\n"
                for msg in chat_history[-8:]:  # Keep last 8 messages
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_context += f"{role.upper()}: {content}\n"
                
                full_prompt = history_context + "\n" + prompt
                
                # Send message with streaming
                response_stream = chat.send_message_stream(full_prompt)
            else:
                # No history, create a fresh chat session
                chat = self.client.chats.create(
                    model=self.model_name,
                    config=config
                )
                
                # Send message with streaming
                response_stream = chat.send_message_stream(prompt)
            
            # Track if we got any content
            has_content = False
            
            # Yield chunks as they arrive from the model
            for chunk in response_stream:
                if hasattr(chunk, 'text') and chunk.text:
                    has_content = True
                    yield chunk.text
                elif hasattr(chunk, 'parts'):
                    for part in chunk.parts:
                        if hasattr(part, 'text') and part.text:
                            has_content = True
                            yield part.text
            
            # If no content was streamed, yield error message
            if not has_content:
                logger.warning("No content received from streaming response")
                yield "I apologize, but I couldn't generate a response. Please try rephrasing your question."
                
        except Exception as e:
            logger.error(f"Error in streaming response: {e}")
            yield f"I apologize, but I encountered an error: {str(e)}"
    
    def _build_prompt(self, query: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Build a prompt with context and safety guidelines
        
        Args:
            query: User's question
            context: Optional context data
        
        Returns:
            Formatted prompt
        """
        base_prompt = f"""You are an AI assistant for a payroll and HR management system in India. 
Your role is to help employees and admins understand their payroll data, compensation, leave policies, and related queries.

Be concise, accurate, and professional. Always prioritize data privacy and security.
If you're unsure about specific calculations or data, acknowledge the limitation.
Use Indian Rupee (₹) formatting for currency values.

User Query: {query}
"""
        
        if context:
            # Add context information
            context_str = format_context_for_prompt(context)
            base_prompt += f"\n\nContext:\n{context_str}"
        
        return base_prompt
    
    async def analyze_payroll_data(
        self,
        current_payroll: Dict[str, Any],
        previous_payroll: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze payroll data for anomalies
        
        Args:
            current_payroll: Current payroll run data
            previous_payroll: Previous payroll run data for comparison
        
        Returns:
            Analysis results with detected anomalies
        """
        try:
            # Sanitize payroll data
            safe_current = self.sanitize_and_mask_context({"data": current_payroll})
            safe_previous = self.sanitize_and_mask_context({"data": previous_payroll}) if previous_payroll else None
            
            prompt = self._build_analysis_prompt(safe_current["data"], safe_previous["data"] if safe_previous else None)
            
            config = genai.types.GenerateContentConfig(
                temperature=self.generation_config["temperature"],
                top_p=self.generation_config["top_p"],
                max_output_tokens=self.generation_config["max_output_tokens"]
            )
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            
            # Return structured response
            return {
                "summary": response.text,
                "anomalies": []  # Populated by statistical detection in endpoint
            }
            
        except Exception as e:
            logger.error(f"Error analyzing payroll: {e}")
            return {
                "summary": "Analysis unavailable due to an error. Please review payroll data manually.",
                "anomalies": []
            }
    
    def _build_analysis_prompt(
        self,
        current_payroll: Dict[str, Any],
        previous_payroll: Optional[Dict[str, Any]]
    ) -> str:
        """Build prompt for payroll analysis"""
        prompt = """Analyze the following payroll data and identify any anomalies or unusual patterns.
Focus on:
- Significant changes in compensation
- Unusual deductions
- Potential calculation errors

Provide a brief summary and list any concerns.

Current Payroll Data:
"""
        prompt += str(current_payroll)
        
        if previous_payroll:
            prompt += "\n\nPrevious Payroll Data:\n"
            prompt += str(previous_payroll)
        
        return prompt


# Singleton instance
gemini_service = GeminiService()
