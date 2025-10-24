"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface Payroll {
  id: string
  pay_period_start: string
  pay_period_end: string
  status: string
  created_at: string
  company_id: string
  created_by: string
}

interface Payslip {
  id: string
  employee_id: string
  gross_pay: number
  net_pay: number
  total_deductions: number
  employees?: {
    profile?: {
      full_name: string
    }
  }
}

interface ViewPayrollDetailsDialogProps {
  payroll: Payroll
}

export function ViewPayrollDetailsDialog({ payroll }: ViewPayrollDetailsDialogProps) {
  const [open, setOpen] = useState(false)
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loading, setLoading] = useState(false)

  const loadPayslips = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('payslips')
      .select(`
        id,
        employee_id,
        gross_pay,
        net_pay,
        total_deductions,
        employees!payslips_employee_id_fkey (
          profile:profiles!employees_profile_id_fkey (
            full_name
          )
        )
      `)
      .eq('payroll_id', payroll.id)

    if (error) {
      console.error('Error loading payslips:', error)
    } else {
      setPayslips((data as any) || [])
    }
    setLoading(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && payslips.length === 0) {
      loadPayslips()
    }
  }

  const totalGrossPay = payslips.reduce((sum, p) => sum + (p.gross_pay || 0), 0)
  const totalDeductions = payslips.reduce((sum, p) => sum + (p.total_deductions || 0), 0)
  const totalNetPay = payslips.reduce((sum, p) => sum + (p.net_pay || 0), 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payroll Details</DialogTitle>
          <DialogDescription>
            Pay Period: {new Date(payroll.pay_period_start).toLocaleDateString()} -{' '}
            {new Date(payroll.pay_period_end).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Gross Pay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalGrossPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalNetPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
          </div>

          {/* Payslips Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payslips ({payslips.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : payslips.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Employee</th>
                        <th className="text-right py-3 px-4 font-medium">Gross Pay</th>
                        <th className="text-right py-3 px-4 font-medium">Deductions</th>
                        <th className="text-right py-3 px-4 font-medium">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payslips.map((payslip) => (
                        <tr key={payslip.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            {payslip.employees?.profile?.full_name || 'Unknown'}
                          </td>
                          <td className="text-right py-3 px-4">
                            ₹{payslip.gross_pay?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="text-right py-3 px-4">
                            ₹{payslip.total_deductions?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="text-right py-3 px-4 font-medium">
                            ₹{payslip.net_pay?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No payslips found for this payroll run.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
