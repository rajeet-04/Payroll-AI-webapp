"""
Pydantic schemas for proxy requests
"""

from pydantic import BaseModel
from enum import Enum
from typing import Optional, Dict, Any


class ResourceEnum(str, Enum):
    employees = "employees"
    profiles = "profiles"
    leave = "leave"
    leave_periods = "leave_periods"
    payrolls = "payrolls"
    payslips = "payslips"


class ActionEnum(str, Enum):
    list = "list"
    get = "get"
    create = "create"
    update = "update"
    delete = "delete"
    approve = "approve"
    deny = "deny"
    me = "me"


class ProxyRequest(BaseModel):
    resource: ResourceEnum
    action: ActionEnum
    params: Optional[Dict[str, Any]] = None
    data: Optional[Dict[str, Any]] = None


class ProxyResponse(BaseModel):
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[str] = None
