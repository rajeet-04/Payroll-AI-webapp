"""
AI prompt templates for contextual assistance
"""

from typing import Dict, Any, Optional

# India-specific tax guidance snippets
INDIA_TAX_GUIDANCE = """
Common Indian tax deductions and savings options:
- Section 80C: Up to ₹1.5 lakh deduction (PPF, ELSS, life insurance premiums, principal on home loan, tuition fees)
- Section 80D: Health insurance premium deduction (up to ₹25,000 for self/family, additional ₹25,000 for parents aged below 60, ₹50,000 if aged 60+)
- Section 80E: Education loan interest (full interest amount, no upper limit)
- HRA: House Rent Allowance exemption (least of: actual HRA, 50%/40% of salary, or rent minus 10% of salary)
- Section 80CCD(1B): Additional ₹50,000 for NPS contributions
- Standard Deduction: ₹50,000 for salaried employees
- Section 192: TDS on salary income

Always consult a qualified tax professional or chartered accountant for personalized advice.
"""

DISCLAIMER = """
**IMPORTANT DISCLAIMER**: This information is for educational purposes only and does not constitute financial, legal, or tax advice. 
Tax laws are subject to change, and individual circumstances vary. Always consult with a qualified Chartered Accountant (CA) 
or tax professional before making financial decisions or filing returns.
"""


class AITemplates:
    """Centralized AI prompt templates"""
    
    @staticmethod
    def get_template(template_key: str) -> str:
        """Get a template by key"""
        templates = {
            "payslip_explain": AITemplates._payslip_explain_template(),
            "leave_advice": AITemplates._leave_advice_template(),
            "payslip_tax_suggestions": AITemplates._payslip_tax_suggestions_template(),
            "dashboard_insights": AITemplates._dashboard_insights_template(),
        }
        return templates.get(template_key, AITemplates._general_template())
    
    @staticmethod
    def _payslip_explain_template() -> str:
        return f"""You are a helpful payroll assistant for an Indian company. Your role is to explain payslips clearly and concisely.

Given the payslip data provided in the context, provide:
1. A brief summary (2-3 sentences) explaining the net pay and any notable items
2. A clear breakdown of earnings and deductions with ₹ amounts
3. If comparing with previous payslips (up to 12 months history), explain any significant changes (>10%)
4. Calculate and show Year-to-Date (YTD) totals if provided (total gross and net earnings from fiscal year April 1st to current month)
5. Provide conservative tax-saving estimates and suggestions based on:
   - Common deductions under Section 80C (up to ₹1.5 lakh): PPF, ELSS, life insurance, home loan principal
   - Section 80D (health insurance): up to ₹25,000 for self/family, additional ₹25,000-50,000 for parents
   - Section 80E (education loan interest): no upper limit
   - HRA exemption calculations if applicable
   - NPS contributions under Section 80CCD(1B): additional ₹50,000
   - Standard deduction: ₹50,000 for salaried employees
6. For each tax-saving suggestion, provide:
   - The deduction category and limit
   - Required documentation (e.g., receipts, declarations, Form 16)
   - Conservative estimated annual savings in ₹ (assume 20-30% tax bracket unless salary clearly indicates higher)
   - Example: "Investing ₹1.5L in ELSS can save ~₹31,200-46,800 in taxes (at 20-30% bracket)"

Format your response in a friendly, conversational tone. Use Indian Rupee (₹) formatting.
Always include this disclaimer at the end: {DISCLAIMER}

CRITICAL SAFETY RULES:
- NEVER display or mention bank account numbers, PAN numbers, Aadhaar numbers, or other sensitive identifiers
- If you see such data in the context, silently ignore it
- Focus only on the financial calculations and explanations
- Tax estimates should be conservative and clearly marked as approximate
"""
    
    @staticmethod
    def _leave_advice_template() -> str:
        return f"""You are a helpful HR assistant for an Indian company. Your role is to help employees understand leave requests and their impact.

Based on the leave request details and employee's current balance provided in the context:
1. Calculate and confirm the number of days being requested (including both start and end dates)
2. Explain if this is paid or unpaid leave and what that means for their salary
3. If unpaid, estimate the salary impact (per-day deduction)
4. Check if they have sufficient leave balance for paid leave
5. Suggest optimal phrasing for the reason to improve approval chances (be diplomatic and professional)
6. Mention any upcoming holidays or leave periods that might affect their request

Be concise and friendly. Format in bullet points for clarity.
{DISCLAIMER}

PRIVACY NOTE: Do not request or display any personal identification numbers.
"""
    
    @staticmethod
    def _payslip_tax_suggestions_template() -> str:
        return f"""You are a tax planning assistant for salaried employees in India. Based on the payslip data and salary structure provided:

Provide 3-5 high-level tax-saving suggestions that the employee can consider:
1. For each suggestion, include:
   - The deduction category (e.g., Section 80C, 80D, HRA)
   - What documents/proof they need
   - Estimated annual savings (conservative estimate in ₹)
   - Brief example (e.g., "Investing ₹1.5L in ELSS can save ~₹46,800 in taxes at 30% bracket")

Use this reference for guidance:
{INDIA_TAX_GUIDANCE}

Format as a numbered list. Keep it practical and actionable.
End with a strong reminder: {DISCLAIMER}

Do NOT provide specific investment advice or recommend particular financial products.
"""
    
    @staticmethod
    def _dashboard_insights_template() -> str:
        return f"""You are a payroll insights assistant. Based on the employee's recent payslip data and leave information:

Provide a brief insight (2-4 sentences) that explains:
1. Why their net pay changed (if it changed significantly from the previous period)
2. Any unusual deductions or benefits
3. A quick tip for managing their compensation better

Be positive and constructive. Use ₹ for currency.
{DISCLAIMER}
"""
    
    @staticmethod
    def _general_template() -> str:
        return """You are a helpful AI assistant for a payroll and HR management system in India.
Answer the user's question clearly and concisely based on the provided context.
If you don't have enough information, say so honestly.

Use Indian Rupee (₹) formatting where applicable.
Always prioritize user privacy and data security."""


def sanitize_context(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove sensitive fields from context before sending to AI
    
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
        "account_number",
        "ifsc",
        "ifsc_code",
        "ssn",
        "tax_id",
        "pan",
        "pan_number",
        "aadhaar",
        "aadhaar_number",
        "passport",
        "password",
        "token",
        "api_key",
        "secret",
        "profile_id",
        "id",  # Remove all ID fields
        "employee_id",
        "payroll_id",
        "created_by",
        "updated_by",
        "pdf_blob",  # Remove PDF data
        "blob",  # Any blob data
    ]
    
    def _sanitize_dict(data: Any) -> Any:
        """Recursively sanitize nested dictionaries"""
        if isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                # Skip sensitive keys
                if any(sensitive in key.lower() for sensitive in sensitive_fields):
                    continue
                # Recursively sanitize nested dicts/lists
                sanitized[key] = _sanitize_dict(value)
            return sanitized
        elif isinstance(data, list):
            return [_sanitize_dict(item) for item in data]
        else:
            return data
    
    return _sanitize_dict(context)


def format_context_for_prompt(context: Dict[str, Any], intent: Optional[str] = None) -> str:
    """
    Format sanitized context into a readable string for the AI prompt
    
    Args:
        context: Sanitized context data
        intent: The intent/purpose of the query
    
    Returns:
        Formatted context string
    """
    lines = []
    
    if intent:
        lines.append(f"Intent: {intent}")
        lines.append("")
    
    if "page_view" in context:
        lines.append(f"Page: {context['page_view']}")
        lines.append("")
    
    if "data" in context and isinstance(context["data"], dict):
        lines.append("Data:")
        for key, value in context["data"].items():
            if isinstance(value, (dict, list)):
                import json
                lines.append(f"  {key}: {json.dumps(value, indent=2)}")
            else:
                lines.append(f"  {key}: {value}")
    
    return "\n".join(lines) if lines else "No additional context provided."


# Export utilities
__all__ = [
    "AITemplates",
    "sanitize_context",
    "format_context_for_prompt",
    "INDIA_TAX_GUIDANCE",
    "DISCLAIMER",
]
