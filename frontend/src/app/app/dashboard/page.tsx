'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, FileText, TrendingUp } from 'lucide-react'
import { getCurrentUser, listEmployees } from '@/lib/api/proxy'

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
  company_id: string
}

interface Employee {
  id: string
  designation: string
  join_date: string
  is_active: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Get current user profile via backend
        const profileData = await getCurrentUser()
        
        if (!profileData) {
          router.push('/login')
          return
        }
        
        setProfile(profileData)
        
        // If admin, load employees
        if (profileData.role === 'admin') {
          const employeesData = await listEmployees(profileData.company_id, true)
          setEmployees(employeesData || [])
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboard()
  }, [router])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  
  if (!profile) {
    return null
  }

  const isAdmin = profile.role === 'admin'

  if (isAdmin) {
    const employeeCount = employees.length

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your organization&apos;s payroll
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeCount}</div>
              <p className="text-xs text-muted-foreground">
                Active employees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Payroll Runs
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Total processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Last Payroll
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">N/A</div>
              <p className="text-xs text-muted-foreground">
                Current status
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Trend
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12%</div>
              <p className="text-xs text-muted-foreground">
                From last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Employees</CardTitle>
              <CardDescription>
                Recently added employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employees.length > 0 ? (
                <div className="space-y-4">
                  {employees.slice(0, 5).map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{employee.designation || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {employee.join_date ? new Date(employee.join_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No employees yet. Add your first employee to get started.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <a
                  href="/app/employees"
                  className="block rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <p className="font-medium">Manage Employees</p>
                  <p className="text-xs text-muted-foreground">
                    Add, edit, or remove employees
                  </p>
                </a>
                <a
                  href="/app/payroll"
                  className="block rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <p className="font-medium">Run Payroll</p>
                  <p className="text-xs text-muted-foreground">
                    Process payroll for this period
                  </p>
                </a>
                <a
                  href="/app/leave-management"
                  className="block rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <p className="font-medium">Review Leave Requests</p>
                  <p className="text-xs text-muted-foreground">
                    Approve or deny pending requests
                  </p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  // Employee dashboard (simplified for now - TODO: implement employee-specific data fetching)
  return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Your personal payroll information
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Latest Payslip
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹0.00</div>
              <p className="text-xs text-muted-foreground">
                Net pay this period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Leave Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Days remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Your Role
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.role}</div>
              <p className="text-xs text-muted-foreground">
                Your designation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Payslips */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payslips</CardTitle>
            <CardDescription>
              Your recent payment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No payslips available yet.
            </p>
          </CardContent>
        </Card>
      </div>
    )
}
