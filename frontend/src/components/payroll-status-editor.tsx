"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'

type PayrollStatus = 'draft' | 'processed' | 'paid'

interface PayrollStatusEditorProps {
  payrollId: string
  currentStatus: PayrollStatus
}

export function PayrollStatusEditor({ payrollId, currentStatus }: PayrollStatusEditorProps) {
  const [status, setStatus] = useState<PayrollStatus>(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleStatusChange = async (newStatus: PayrollStatus) => {
    setIsUpdating(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('payrolls')
      .update({ status: newStatus })
      .eq('id', payrollId)

    if (error) {
      console.error('Error updating payroll status:', error)
      setIsUpdating(false)
      return
    }

    setStatus(newStatus)
    setIsUpdating(false)
    router.refresh()
  }

  return (
    <Select
      value={status}
      onValueChange={(value: string) => handleStatusChange(value as PayrollStatus)}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="processed">Processed</SelectItem>
        <SelectItem value="paid">Paid</SelectItem>
      </SelectContent>
    </Select>
  )
}
