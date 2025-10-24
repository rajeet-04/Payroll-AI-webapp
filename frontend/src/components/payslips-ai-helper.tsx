"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

interface PayslipsAIHelperProps {
  employeeId?: string
}

export function PayslipsAIHelper({ employeeId }: PayslipsAIHelperProps) {
  if (!employeeId) return null

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold text-primary">AI-Powered Payslip Analysis</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click the <Sparkles className="h-3 w-3 inline" /> icon next to any payslip to get AI-powered explanations, 
              tax-saving suggestions, and comparisons with previous months.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
