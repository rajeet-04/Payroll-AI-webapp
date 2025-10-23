import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'

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
                        Net Pay: ${payslip.net_pay.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="text-sm font-medium">
                        ${payslip.gross_pay.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gross Pay
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
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
