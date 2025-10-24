import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RunPayrollDialog } from '@/components/run-payroll-dialog'
import { PayrollStatusEditor } from '@/components/payroll-status-editor'
import { ViewPayrollDetailsDialog } from '@/components/view-payroll-details-dialog'

export default async function PayrollPage() {
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

  if (profile?.role !== 'admin') {
    redirect('/app/dashboard')
  }

  const { data: payrolls } = await supabase
    .from('payrolls')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payroll</h2>
          <p className="text-muted-foreground">
            Manage and process payroll runs
          </p>
        </div>
        <RunPayrollDialog companyId={profile.company_id!} userId={user.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
          <CardDescription>
            All payroll runs for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrolls && payrolls.length > 0 ? (
            <div className="space-y-4">
              {payrolls.map((payroll) => (
                <div
                  key={payroll.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(payroll.pay_period_start).toLocaleDateString()} -{' '}
                      {new Date(payroll.pay_period_end).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(payroll.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PayrollStatusEditor 
                      payrollId={payroll.id} 
                      currentStatus={payroll.status}
                    />
                    <ViewPayrollDetailsDialog payroll={payroll} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No payroll runs yet. Create your first payroll run.
              </p>
              <RunPayrollDialog companyId={profile.company_id!} userId={user.id} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
