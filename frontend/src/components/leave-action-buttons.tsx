"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Check, X, Loader2 } from "lucide-react"

interface LeaveActionButtonsProps {
  requestId: string
  userId: string
}

export function LeaveActionButtons({ requestId, userId }: LeaveActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAction = async (action: "approved" | "denied") => {
    setIsLoading(true)

    try {
      // First get the leave request details
      const { data: leaveRequest, error: fetchError } = await supabase
        .from("leave_requests")
        .select("*, employees!inner(id, profile_id)")
        .eq("id", requestId)
        .single()

      if (fetchError) throw fetchError

      // Update leave request status
      const { error: updateError } = await supabase
        .from("leave_requests")
        .update({
          status: action,
          approved_by: userId,
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (updateError) throw updateError

      // If approved, update leave balance
      if (action === "approved" && leaveRequest) {
        const { data: leaveBalance, error: balanceError } = await supabase
          .from("employee_leave_balances")
          .select("*")
          .eq("employee_id", leaveRequest.employee_id)
          .eq("leave_period_id", leaveRequest.leave_period_id)
          .single()

        if (balanceError) throw balanceError

        if (leaveBalance) {
          const newLeavesTaken = (leaveBalance.leaves_taken || 0) + (leaveRequest.days_requested || 0)
          
          await supabase
            .from("employee_leave_balances")
            .update({ leaves_taken: newLeavesTaken })
            .eq("id", leaveBalance.id)
        }
      }

      router.refresh()
    } catch (error) {
      console.error("Failed to update leave request:", error)
      alert("Failed to update leave request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="text-green-600"
        onClick={() => handleAction("approved")}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Check className="mr-2 h-4 w-4" />
        )}
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-red-600"
        onClick={() => handleAction("denied")}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <X className="mr-2 h-4 w-4" />
        )}
        Deny
      </Button>
    </div>
  )
}
