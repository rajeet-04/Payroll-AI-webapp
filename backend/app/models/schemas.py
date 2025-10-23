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
