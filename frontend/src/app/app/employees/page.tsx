"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AddEmployeeDialog } from '@/components/add-employee-dialog'
import { ToggleEmployeeStatus } from '@/components/toggle-employee-status'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SalaryStructure {
  base_pay: number
  allowances: Record<string, number>
  deductions_fixed: Record<string, number>
  deductions_percent: Record<string, number>
}

interface Employee {
  id: string
  designation: string
  join_date: string
  is_active: boolean
  profiles: {
    full_name: string
  }
  salary_structures: SalaryStructure[]
  employee_leave_balances: Array<{
    total_granted: number
    leaves_taken: number
  }>
}

interface Profile {
  role: string
  company_id: string
}

export default function EmployeesPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData?.role !== 'admin') {
        router.push('/app/dashboard')
        return
      }
      
      setProfile(profileData)

      const { data: employeesData } = await supabase
        .from('employees')
        .select('*, profiles(*), salary_structures!salary_structures_employee_id_fkey(*), employee_leave_balances(total_granted, leaves_taken)')
        .eq('company_id', profileData.company_id)
        .order('created_at', { ascending: false })

      setEmployees(employeesData || [])
      setLoading(false)
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const calculateTotalCompensation = (salaryStructure: SalaryStructure) => {
    const basePay = salaryStructure.base_pay || 0
    const totalAllowances = Object.values(salaryStructure.allowances || {}).reduce((sum, val) => sum + (val || 0), 0)
    return basePay + totalAllowances
  }

  const calculateDeductions = (salaryStructure: SalaryStructure) => {
    const basePay = salaryStructure.base_pay || 0
    const totalAllowances = Object.values(salaryStructure.allowances || {}).reduce((sum, val) => sum + (val || 0), 0)
    const grossPay = basePay + totalAllowances
    
    const totalFixed = Object.values(salaryStructure.deductions_fixed || {}).reduce((sum, val) => sum + (val || 0), 0)
    const totalPercent = Object.values(salaryStructure.deductions_percent || {}).reduce(
      (sum, val) => sum + (grossPay * (val || 0) / 100), 0
    )
    
    return totalFixed + totalPercent
  }

  if (loading || !profile) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
          <p className="text-muted-foreground">
            Manage your organization&apos;s employees
          </p>
        </div>
        <AddEmployeeDialog companyId={profile.company_id!} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>
            All employees in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees && employees.length > 0 ? (
            <div className="space-y-4">
              {employees.map((employee) => {
                const salaryStructure = employee.salary_structures?.[0]
                const isExpanded = expandedEmployee === employee.id
                
                return (
                  <div
                    key={employee.id}
                    className="rounded-lg border overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 hover:bg-accent transition-colors gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                          {employee.profiles?.full_name?.[0]?.toUpperCase() || 'E'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{employee.profiles?.full_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {employee.designation} • Joined {new Date(employee.join_date).toLocaleDateString()}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 mt-1">
                            {salaryStructure && (
                              <p className="text-sm text-muted-foreground truncate">
                                <span className="font-medium">Base Pay:</span> ₹{salaryStructure.base_pay?.toLocaleString()}
                              </p>
                            )}
                            {employee.employee_leave_balances?.[0] && (
                              <p className="text-sm text-muted-foreground truncate">
                                <span className="font-medium">Leaves:</span>{' '}
                                {(employee.employee_leave_balances[0].total_granted || 0) - (employee.employee_leave_balances[0].leaves_taken || 0)}/{employee.employee_leave_balances[0].total_granted || 0} available
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${
                          employee.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <ToggleEmployeeStatus employeeId={employee.id} isActive={employee.is_active} />
                        {salaryStructure && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedEmployee(isExpanded ? null : employee.id)}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {isExpanded && salaryStructure && (
                      <div className="border-t bg-muted/50 p-4">
                        <h4 className="font-semibold mb-3">Salary Breakdown</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Base Pay */}
                          <div>
                            <p className="text-sm font-medium mb-2">Base Pay</p>
                            <p className="text-2xl font-bold">₹{salaryStructure.base_pay?.toLocaleString()}</p>
                          </div>
                          
                          {/* Allowances */}
                          <div>
                            <p className="text-sm font-medium mb-2">Allowances</p>
                            <div className="space-y-1">
                              {Object.entries(salaryStructure.allowances || {}).map(([key, value]) => (
                                value > 0 && (
                                  <p key={key} className="text-sm text-muted-foreground">
                                    {key.charAt(0).toUpperCase() + key.slice(1)}: ₹{value?.toLocaleString()}
                                  </p>
                                )
                              ))}
                              <p className="text-sm font-semibold pt-1 border-t">
                                Total: ₹{Object.values(salaryStructure.allowances || {}).reduce((sum, val) => sum + (val || 0), 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Deductions */}
                          <div>
                            <p className="text-sm font-medium mb-2">Deductions</p>
                            <div className="space-y-1">
                              {Object.entries(salaryStructure.deductions_fixed || {}).map(([key, value]) => (
                                value > 0 && (
                                  <p key={key} className="text-sm text-muted-foreground">
                                    {key.replace('_', ' ').charAt(0).toUpperCase() + key.slice(1)}: ₹{value?.toLocaleString()}
                                  </p>
                                )
                              ))}
                              {Object.entries(salaryStructure.deductions_percent || {}).map(([key, value]) => (
                                value > 0 && (
                                  <p key={key} className="text-sm text-muted-foreground">
                                    {key.charAt(0).toUpperCase() + key.slice(1)}: {value}%
                                  </p>
                                )
                              ))}
                              <p className="text-sm font-semibold pt-1 border-t text-destructive">
                                Total: -₹{calculateDeductions(salaryStructure).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">Gross Pay (before tax)</span>
                            <span className="text-2xl font-bold text-primary">
                              ₹{calculateTotalCompensation(salaryStructure).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No employees found. Add your first employee to get started.
              </p>
              <AddEmployeeDialog companyId={profile.company_id!} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
