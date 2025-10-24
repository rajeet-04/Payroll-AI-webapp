import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
import { LeaveActionButtons } from '@/components/leave-action-buttons'
import { CreateLeavePeriodDialog } from '@/components/create-leave-period-dialog'

export default async function LeaveManagementPage() {
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

  console.log('Profile:', profile)
  console.log('Company ID:', profile?.company_id)

  if (profile?.role !== 'admin') {
    redirect('/app/dashboard')
  }

  // Fetch active leave periods
  const { data: leavePeriods } = await supabase
    .from('leave_periods')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('is_active', { ascending: false })
    .order('start_date', { ascending: false })

  // Fetch employee IDs for the company
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id')
    .eq('company_id', profile.company_id)

  console.log('Employees error:', employeesError)
  console.log('Employees data:', employees)

  const employeeIds = employees?.map(emp => emp.id) || []
  console.log('Employee IDs:', employeeIds)

  let leaveRequests = []
  let requestsError = null

  if (employeeIds.length > 0) {
    const result = await supabase
      .from('leave_requests')
      .select(`
        *,
        employees (
          id,
          designation,
          company_id,
          profiles (
            full_name,
            email
          )
        ),
        leave_periods (
          name
        )
      `)
      .in('employee_id', employeeIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    leaveRequests = result.data || []
    requestsError = result.error
  }

  console.log('Leave requests error:', requestsError)
  console.log('Leave requests data:', leaveRequests)

  if (requestsError) {
    console.error('Error fetching leave requests:', requestsError)
    
  }

  // Fetch all leave requests for debugging/history
  let allRequests = []

  if (employeeIds.length > 0) {
    const result = await supabase
      .from('leave_requests')
      .select(`
        *,
        employees (
          id,
          designation,
          company_id,
          profiles (
            full_name,
            email
          )
        ),
        leave_periods (
          name
        )
      `)
      .in('employee_id', employeeIds)
      .order('created_at', { ascending: false })
      .limit(20)

    allRequests = result.data || []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-muted-foreground">
            Review and manage employee leave requests
          </p>
        </div>
        <CreateLeavePeriodDialog companyId={profile.company_id!} />
      </div>

      {/* Leave Periods Card */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Periods</CardTitle>
          <CardDescription>
            Company-wide leave periods (holidays, shutdowns) when employees cannot submit individual requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leavePeriods && leavePeriods.length > 0 ? (
            <div className="space-y-3">
              {leavePeriods.map((period) => (
                <div
                  key={period.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{period.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(period.start_date).toLocaleDateString()} -{' '}
                      {new Date(period.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    period.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {period.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-3">
                No leave periods created. When active, everyone is on leave. When inactive, employees can request individual leaves.
              </p>
              <CreateLeavePeriodDialog companyId={profile.company_id!} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>
            Leave requests awaiting your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaveRequests && leaveRequests.length > 0 ? (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {request.employees?.profiles?.full_name || 'Unknown Employee'}
                      </p>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        request.leave_type === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                      }`}>
                        {request.leave_type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.employees?.designation || 'No designation'}
                      {request.leave_periods?.name && (
                        <span className="ml-2">• {request.leave_periods.name}</span>
                      )}
                    </p>
                    <p className="text-sm font-medium mt-2">
                      {new Date(request.start_date).toLocaleDateString()} -{' '}
                      {new Date(request.end_date).toLocaleDateString()}
                      <span className="ml-2 text-muted-foreground">
                        ({request.days_requested || 0} days)
                      </span>
                    </p>
                    {request.reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                    )}
                  </div>
                  <LeaveActionButtons requestId={request.id} userId={user.id} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No pending leave requests at the moment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leave Requests</CardTitle>
          <CardDescription>
            All recent leave requests from your employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allRequests && allRequests.length > 0 ? (
            <div className="space-y-4">
              {allRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {request.employees?.profiles?.full_name || 'Unknown Employee'}
                      </p>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        request.leave_type === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                      }`}>
                        {request.leave_type}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        request.status === 'approved'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : request.status === 'denied'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.employees?.designation || 'No designation'}
                      {request.leave_periods?.name && (
                        <span className="ml-2">• {request.leave_periods.name}</span>
                      )}
                    </p>
                    <p className="text-sm font-medium mt-2">
                      {new Date(request.start_date).toLocaleDateString()} -{' '}
                      {new Date(request.end_date).toLocaleDateString()}
                      <span className="ml-2 text-muted-foreground">
                        ({request.days_requested || 0} days)
                      </span>
                    </p>
                    {request.reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                    )}
                  </div>
                  {request.status === 'pending' && (
                    <LeaveActionButtons requestId={request.id} userId={user.id} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No leave requests found.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
