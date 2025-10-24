import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, FileText, TrendingUp } from 'lucide-react'
import { DashboardAIHelper } from '@/components/dashboard-ai-helper'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  if (isAdmin) {
    // Fetch admin dashboard data
    const { data: employees, count: employeeCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .eq('company_id', profile.company_id)
      .eq('is_active', true)

    const { data: payrolls, count: payrollCount } = await supabase
      .from('payrolls')
      .select('*', { count: 'exact' })
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .limit(1)

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your organization's payroll
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
              <div className="text-2xl font-bold">{employeeCount || 0}</div>
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
              <div className="text-2xl font-bold">{payrollCount || 0}</div>
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
              <div className="text-2xl font-bold">
                {payrolls?.[0]?.status || 'N/A'}
              </div>
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
              {employees && employees.length > 0 ? (
                <div className="space-y-4">
                  {employees.slice(0, 5).map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{employee.designation}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(employee.join_date).toLocaleDateString()}
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
  } else {
    // Employee dashboard
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    const { data: payslips } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', employee?.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: leaveBalance } = await supabase
      .from('employee_leave_balances')
      .select('*')
      .eq('employee_id', employee?.id)
      .single()

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Your personal payroll information
          </p>
        </div>

        {/* AI Helper Card */}
        <DashboardAIHelper
          employeeId={employee?.id}
          latestPayslip={payslips?.[0] ? {
            net_pay: payslips[0].net_pay,
            gross_pay: payslips[0].gross_pay,
            created_at: payslips[0].created_at,
          } : undefined}
          leaveBalance={leaveBalance ? {
            remaining_leaves: leaveBalance.remaining_leaves,
            leaves_taken: leaveBalance.leaves_taken,
          } : undefined}
        />

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
              <div className="text-2xl font-bold">
                ₹{payslips?.[0]?.net_pay?.toFixed(2) || '0.00'}
              </div>
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
              <div className="text-2xl font-bold">
                {leaveBalance?.remaining_leaves || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Days remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Designation
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employee?.designation || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Your role
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
            {payslips && payslips.length > 0 ? (
              <div className="space-y-4">
                {payslips.map((payslip) => (
                  <div
                    key={payslip.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        ₹{payslip.net_pay.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payslip.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={`/app/payslips/${payslip.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Details
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payslips available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
}
