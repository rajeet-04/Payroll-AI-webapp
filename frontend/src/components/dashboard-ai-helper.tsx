"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { AIAssistant } from "@/components/ai/ai-assistant"

interface DashboardAIHelperProps {
  employeeId?: string
  latestPayslip?: {
    net_pay: number
    gross_pay: number
    created_at: string
  }
  leaveBalance?: {
    remaining_leaves: number
    leaves_taken: number
  }
}

export function DashboardAIHelper({ 
  employeeId,
  latestPayslip,
  leaveBalance 
}: DashboardAIHelperProps) {
  const [aiOpen, setAiOpen] = useState(false)

  if (!employeeId) return null

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary mb-1">AI Insights</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get personalized insights about your pay, leaves, and tax-saving tips
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiOpen(true)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Ask AI Assistant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant */}
      <AIAssistant
        open={aiOpen}
        onOpenChange={setAiOpen}
        intent="dashboard_insights"
        context={{
          page_view: "dashboard",
          data: {
            employee_id: employeeId,
            latest_payslip: latestPayslip,
            leave_balance: leaveBalance,
          },
        }}
        suggestedPrompts={[
          "Explain my latest payslip",
          "Why did my net pay change?",
          "How can I save on taxes?",
          "What are my leave balances?",
          "Show me my year-to-date earnings",
        ]}
        title="Dashboard Assistant"
        description="Get insights about your compensation and benefits"
      />
    </>
  )
}
