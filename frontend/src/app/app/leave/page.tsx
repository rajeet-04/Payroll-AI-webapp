"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestLeaveDialog } from '@/components/request-leave-dialog'
import { Calendar, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIAssistant } from '@/components/ai/ai-assistant'

interface LeavePeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

interface LeaveRequest {
  id: string
  start_date: string
  end_date: string
  reason: string
  status: string
  leave_type: string
  days_requested: number
}

interface LeaveBalance {
  total_granted: number
  leaves_taken: number
  remaining_leaves: number
}

export default function LeavePage() {
  const [employee, setEmployee] = useState<{ id: string; company_id: string } | null>(null)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null)
  const [leavePeriods, setLeavePeriods] = useState<LeavePeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [aiOpen, setAiOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: employeeData } = await supabase
        .from('employees')
        .select('*')
        .eq('profile_id', user.id)
        .single()

      if (!employeeData) {
        setLoading(false)
        return
      }

      setEmployee(employeeData)

      const { data: requestsData } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeData.id)
        .order('created_at', { ascending: false })

      setLeaveRequests(requestsData || [])

      const { data: balanceData } = await supabase
        .from('employee_leave_balances')
        .select('*')
        .eq('employee_id', employeeData.id)
        .single()

      setLeaveBalance(balanceData)

      // Fetch leave periods for the company
      const { data: periodsData } = await supabase
        .from('leave_periods')
        .select('*')
        .eq('company_id', employeeData.company_id)
        .order('is_active', { ascending: false })
        .order('start_date', { ascending: false })

      setLeavePeriods(periodsData || [])
      setLoading(false)
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Requests</h2>
          <p className="text-muted-foreground">
            Manage your leave requests
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No employee record found. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activePeriod = leavePeriods.find(p => p.is_active)
  const canRequestLeave = !activePeriod // Can request when NO active leave period

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Requests</h2>
          <p className="text-muted-foreground">
            Manage your leave requests and balance
          </p>
        </div>
        <RequestLeaveDialog 
          employeeId={employee.id} 
          canRequest={canRequestLeave}
        />
      </div>

      {/* Leave Period Status Info */}
      {activePeriod ? (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-600 dark:text-orange-400">Leave Period Active: {activePeriod.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  From{' '}
                  <span className="font-medium">
                    {new Date(activePeriod.start_date).toLocaleDateString()}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {new Date(activePeriod.end_date).toLocaleDateString()}
                  </span>
                  {' '}everyone is on leave. You cannot submit new leave requests during this period.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-primary">Working Period - Request Leave Available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You can submit leave requests for approval. Paid leaves won&apos;t affect your salary, unpaid leaves will be deducted from your pay.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Leave Periods */}
      {leavePeriods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Periods</CardTitle>
            <CardDescription>
              Scheduled leave periods when everyone is off (holidays, company shutdowns)
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Leave Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Balance</CardTitle>
          <CardDescription>
            Your current leave allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{leaveBalance?.total_granted || 0}</p>
              <p className="text-sm text-muted-foreground">Total Granted</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{leaveBalance?.leaves_taken || 0}</p>
              <p className="text-sm text-muted-foreground">Taken</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {leaveBalance?.remaining_leaves || 0}
              </p>
              <p className="text-sm text-muted-foreground">Remaining</p>
            </div>
          </div>
          
          {/* AI Helper */}
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiOpen(true)}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Ask AI about my leaves
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant for Leave Management */}
      <AIAssistant
        open={aiOpen}
        onOpenChange={setAiOpen}
        intent="leave_advice"
        context={{
          page_view: "leave_management",
          data: {
            employee_id: employee?.id,
            leave_balance: leaveBalance,
            recent_leaves: leaveRequests.slice(0, 5),
            leave_periods: leavePeriods,
          },
        }}
        suggestedPrompts={[
          "When is the best time to take leave?",
          "How many leaves do I have remaining?",
          "What are the upcoming holidays?",
          "Explain my leave balance",
          "Will my next leave request be approved?",
        ]}
        title="Leave Management Assistant"
        description="Get advice about your leave planning and balance"
      />

      {/* Leave Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>
            All your leave requests
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
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {new Date(request.start_date).toLocaleDateString()} -{' '}
                          {new Date(request.end_date).toLocaleDateString()}
                        </p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          request.leave_type === 'paid'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                        }`}>
                          {request.leave_type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.days_requested} {request.days_requested === 1 ? 'day' : 'days'} • {request.reason || 'No reason provided'}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    request.status === 'approved'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : request.status === 'denied'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No leave requests yet. Submit your first request.
              </p>
              <RequestLeaveDialog 
                employeeId={employee.id} 
                canRequest={canRequestLeave}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
