"""
Pydantic models for API requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import date


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    query: str = Field(..., description="User's question or query")
    context: Optional[Dict[str, Any]] = Field(None, description="Context data for the query")
    intent: Optional[str] = Field(None, description="Intent/purpose: 'payslip_explain', 'leave_advice', 'payslip_tax_suggestions', 'dashboard_insights'")
    chat_history: Optional[List[Dict[str, str]]] = Field(None, description="Previous conversation messages for context continuity")


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    response: str = Field(..., description="AI-generated response")
    context_used: bool = Field(False, description="Whether context data was used")


class PayrollAnalysisRequest(BaseModel):
    """Request model for payroll analysis"""
    payroll_id: str = Field(..., description="UUID of the payroll run to analyze")


class AnomalyDetail(BaseModel):
    """Details of a detected anomaly"""
    employee_id: str
    metric: str
    previous_value: Optional[float]
    current_value: float
    percent_change: Optional[float]
    severity: str = Field(..., description="low, medium, or high")
    suggested_action: str


class PayrollAnalysisResponse(BaseModel):
    """Response model for payroll analysis"""
    payroll_id: str
    anomalies: List[AnomalyDetail]
    summary: str


class PayslipExplainRequest(BaseModel):
    """Request model for payslip explanation (streaming or sync)"""
    intent: Optional[str] = Field("payslip_explain", description="Intent (e.g., 'payslip_explain')")
    payslip_id: Optional[str] = Field(None, description="UUID of the payslip to explain")
    query: Optional[str] = Field("Please explain the provided payslip", description="Query to send to AI")
    system_instruction: Optional[str] = Field(None, description="Optional custom system instruction for the AI")
    chat_history: Optional[List[Dict[str, str]]] = Field(None, description="Previous conversation messages for context continuity")


class PayslipExplainResponse(BaseModel):
    """Response model for structured payslip explanation"""
    summary: Optional[str] = Field(None, description="Brief summary of the payslip")
    earnings: Optional[List[Dict[str, Any]]] = Field(None, description="Earnings breakdown")
    deductions: Optional[List[Dict[str, Any]]] = Field(None, description="Deductions breakdown")
    comparisons: Optional[List[Dict[str, Any]]] = Field(None, description="Comparison with previous months")
    advice: Optional[str] = Field(None, description="Tax-saving and optimization advice")
    raw_ai_text: Optional[str] = Field(None, description="Raw AI response text")