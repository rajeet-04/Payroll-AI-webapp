"""
Gemini AI service for intelligent features
"""

import google.generativeai as genai
from app.core.config import settings
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)


class GeminiService:
    """Service for interacting with Gemini AI"""
    
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-pro')
    
    async def generate_response(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate AI response for a query
        
        Args:
            query: User's question
            context: Optional context data (sanitized)
        
        Returns:
            AI-generated response
        """
        try:
            # Build prompt with context if provided
            prompt = self._build_prompt(query, context)
            
            # Generate response
            response = self.model.generate_content(prompt)
            
            return response.text
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return "I apologize, but I encountered an error processing your request. Please try again."
    
    def _build_prompt(self, query: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Build a prompt with context and safety guidelines
        
        Args:
            query: User's question
            context: Optional context data
        
        Returns:
            Formatted prompt
        """
        base_prompt = f"""You are an AI assistant for a payroll and accounting system. 
Your role is to help users understand their payroll data, compensation, and related queries.

Be concise, accurate, and professional. Always prioritize data privacy and security.
If you're unsure about specific calculations or data, acknowledge the limitation.

User Query: {query}
"""
        
        if context:
            # Add context information (already sanitized by caller)
            context_str = self._format_context(context)
            base_prompt += f"\n\nContext:\n{context_str}"
        
        return base_prompt
    
    def _format_context(self, context: Dict[str, Any]) -> str:
        """Format context data for the prompt"""
        formatted = []
        
        if "page_view" in context:
            formatted.append(f"Current page: {context['page_view']}")
        
        if "data" in context:
            data = context["data"]
            if isinstance(data, dict):
                for key, value in data.items():
                    # Only include non-sensitive data
                    if key not in ["bank_account", "ssn", "tax_id"]:
                        formatted.append(f"{key}: {value}")
        
        return "\n".join(formatted)
    
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
            prompt = self._build_analysis_prompt(current_payroll, previous_payroll)
            response = self.model.generate_content(prompt)
            
            # Parse response (in production, use structured output)
            return {
                "summary": response.text,
                "anomalies": []  # Would parse structured data in production
            }
            
        except Exception as e:
            logger.error(f"Error analyzing payroll: {e}")
            return {
                "summary": "Analysis unavailable",
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
