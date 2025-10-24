import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Sparkles } from 'lucide-react'
import { DownloadPayslipButton } from '@/components/download-payslip-button'
import { PayslipsAIHelper } from '@/components/payslips-ai-helper'

export default async function PayslipsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  if (!employee) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Payslips</h2>
          <p className="text-muted-foreground">
            View your payment history
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

  const { data: payslips } = await supabase
    .from('payslips')
    .select('*, payrolls(*)')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Payslips</h2>
        <p className="text-muted-foreground">
          View and download your payment history
        </p>
      </div>

      {/* AI Helper Info */}
      <PayslipsAIHelper employeeId={employee.id} />

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            All your payslips
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payslips && payslips.length > 0 ? (
            <div className="space-y-4">
              {payslips.map((payslip) => (
                <div
                  key={payslip.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {new Date(payslip.payrolls?.pay_period_start || payslip.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Net Pay: ₹{payslip.net_pay.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="text-sm font-medium">
                        ₹{payslip.gross_pay.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gross Pay
                      </p>
                    </div>
                    <DownloadPayslipButton 
                      payslipId={payslip.id}
                      payPeriodStart={payslip.payrolls?.pay_period_start}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No payslips available yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
