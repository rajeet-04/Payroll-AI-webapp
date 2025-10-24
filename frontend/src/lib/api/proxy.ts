/**
 * API proxy helper for calling backend endpoints
 * Handles cookies, CSRF tokens, and error handling
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Use same-origin for API calls (Next.js will rewrite to backend)
// This ensures cookies work properly across frontend and backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Make a proxy request to the backend
 */
export async function proxyRequest<T = any>(
  resource: string,
  action: string,
  params?: Record<string, any>,
  data?: Record<string, any>
): Promise<T> {
  const isStateChanging = ['create', 'update', 'delete', 'approve', 'deny'].includes(action);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add CSRF token for state-changing operations
  if (isStateChanging) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers['x-csrf-token'] = csrf;
    }
  }
  
  const response = await fetch(`${API_URL}/api/v1/proxy`, {
    method: 'POST',
    credentials: 'include', // Important: send cookies
    headers,
    body: JSON.stringify({
      resource,
      action,
      params,
      data,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `Request failed with status ${response.status}`);
  }
  
  const result = await response.json();
  return result.data;
}

/**
 * Login user
 */
export async function login(email: string, password: string): Promise<{ csrf_token: string; user: any }> {
  console.log('Attempting login with:', { email });
  
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  console.log('Login response status:', response.status);
  console.log('Login response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(error.detail || 'Login failed');
  }
  
  const data = await response.json();
  console.log('Login response data:', data);
  
  return data;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Logout failed');
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<any> {
  return proxyRequest('profiles', 'me');
}

/**
 * List employees
 */
export async function listEmployees(companyId?: string, active?: boolean): Promise<any[]> {
  return proxyRequest('employees', 'list', { company_id: companyId, active });
}

/**
 * Create employee
 */
export async function createEmployee(data: any): Promise<any> {
  return proxyRequest('employees', 'create', undefined, data);
}

/**
 * Update employee
 */
export async function updateEmployee(employeeId: string, data: any): Promise<any> {
  return proxyRequest('employees', 'update', { employee_id: employeeId }, data);
}

/**
 * List leave periods
 */
export async function listLeavePeriods(companyId?: string): Promise<any[]> {
  return proxyRequest('leave_periods', 'list', { company_id: companyId });
}

/**
 * Create leave period
 */
export async function createLeavePeriod(data: any): Promise<any> {
  return proxyRequest('leave_periods', 'create', undefined, data);
}

/**
 * List leave requests
 */
export async function listLeaveRequests(employeeId?: string): Promise<any[]> {
  return proxyRequest('leave', 'list', { employee_id: employeeId });
}

/**
 * Create leave request
 */
export async function createLeaveRequest(data: any): Promise<any> {
  return proxyRequest('leave', 'create', undefined, data);
}

/**
 * Approve leave request
 */
export async function approveLeaveRequest(requestId: string): Promise<any> {
  return proxyRequest('leave', 'approve', { request_id: requestId });
}

/**
 * Deny leave request
 */
export async function denyLeaveRequest(requestId: string): Promise<any> {
  return proxyRequest('leave', 'deny', { request_id: requestId });
}

/**
 * List payslips
 */
export async function listPayslips(employeeId?: string, payrollId?: string): Promise<any[]> {
  return proxyRequest('payslips', 'list', { employee_id: employeeId, payroll_id: payrollId });
}
