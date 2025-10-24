"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Plus, Loader2, Sparkles } from "lucide-react"
import { AIAssistant } from "@/components/ai/ai-assistant"

interface RequestLeaveDialogProps {
  employeeId: string
  canRequest?: boolean
}

export function RequestLeaveDialog({ employeeId, canRequest = true }: RequestLeaveDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [aiOpen, setAiOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    leaveType: "paid",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validate end date is after start date
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        throw new Error("End date must be after start date")
      }

      // Check if there's an active leave period (should not be able to request during company leave)
      const { data: activePeriods } = await supabase
        .from("leave_periods")
        .select("id, name")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle()
      
      if (activePeriods) {
        throw new Error(`Cannot submit leave request during active leave period: ${activePeriods.name}`)
      }

      // Get any leave period for reference (required by database)
      const { data: anyPeriod, error: periodError } = await supabase
        .from("leave_periods")
        .select("id")
        .eq("is_active", false)
        .limit(1)
        .maybeSingle()

      if (periodError || !anyPeriod) {
        // If no inactive period exists, get or create a default one
        const { data: existingPeriods } = await supabase
          .from("leave_periods")
          .select("id")
          .limit(1)
          .maybeSingle()
        
        if (!existingPeriods) {
          throw new Error("No leave period found. Please contact your administrator to set up leave periods.")
        }
      }

      const periodId = anyPeriod?.id

      if (!periodId) {
        throw new Error("Unable to find a leave period. Please contact your administrator.")
      }

      // Calculate number of leave days
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end dates

      const { error: requestError } = await supabase
        .from("leave_requests")
        .insert({
          employee_id: employeeId,
          leave_period_id: periodId,
          start_date: formData.startDate,
          end_date: formData.endDate,
          days_requested: leaveDays,
          reason: formData.reason,
          leave_type: formData.leaveType,
          status: "pending",
        })

      if (requestError) throw requestError

      setOpen(false)
      setFormData({ startDate: "", endDate: "", reason: "", leaveType: "paid" })
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit leave request")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button disabled={!canRequest} title={!canRequest ? "Cannot request leave during company leave period" : "Request leave for approval"}>
            <Plus className="mr-2 h-4 w-4" />
            Request Leave
          </Button>
        </DialogTrigger>
        <DialogContent className="h-full sm:h-auto sm:max-w-[500px] overflow-y-auto backdrop-blur-md bg-white/70 dark:bg-gray-800/70">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
              <DialogDescription>
                Submit a leave request for approval. Paid leaves don&apos;t affect salary, unpaid leaves will be deducted.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="leaveType">Leave Type</Label>
                <select
                  id="leaveType"
                  title="Select leave type"
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isLoading}
                >
                  <option value="paid">Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Unpaid leaves will reduce your salary for the pay period
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Reason for leave request..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
              
              {/* AI Helper Button */}
              {formData.startDate && formData.endDate && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Need help with your leave request?
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ask AI about the impact on your balance and salary
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAiOpen(true)}
                      disabled={isLoading}
                    >
                      Ask AI
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Assistant for Leave Advice */}
      <AIAssistant
        open={aiOpen}
        onOpenChange={setAiOpen}
        intent="leave_advice"
        context={{
          page_view: "leave_request",
          data: {
            employee_id: employeeId,
            start_date: formData.startDate,
            end_date: formData.endDate,
            leave_type: formData.leaveType,
          },
        }}
        suggestedPrompts={[
          "How will this leave request affect my balance?",
          "Will this be deducted from my salary?",
          "How many days will this request use?",
          "Are there any holidays during these dates?",
          "Suggest a better reason for approval",
        ]}
        title="Leave Request Assistant"
        description="Get advice about your leave request and its impact"
      />
    </>
  )
}
