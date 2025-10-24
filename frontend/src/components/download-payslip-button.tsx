"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AIAssistant } from "@/components/ai/ai-assistant"

interface DownloadPayslipButtonProps {
  payslipId: string
  payPeriodStart?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function DownloadPayslipButton({ 
  payslipId, 
  payPeriodStart,
  variant = "outline",
  size = "sm"
}: DownloadPayslipButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const supabase = createClient()

  const handleDownload = async () => {
    setIsDownloading(true)
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error("No active session")
      }

      // Call backend API to download payslip
      const response = await fetch(`http://localhost:8000/api/v1/payroll/payslip/${payslipId}/download`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to download payslip" }))
        throw new Error(errorData.detail || "Failed to download payslip")
      }

      // Get the PDF blob
      const blob = await response.blob()
      
      // Generate filename
      let filename = "payslip.pdf"
      if (payPeriodStart) {
        const date = new Date(payPeriodStart)
        filename = `payslip_${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}.pdf`
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (err) {
      console.error("Payslip download error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to download payslip"
      alert(errorMessage)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button 
          variant={variant} 
          size={size} 
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size={size}
          onClick={() => setAiOpen(true)}
          title="Explain this payslip with AI"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>

      {/* AI Assistant for Payslip Explanation */}
      <AIAssistant
        open={aiOpen}
        onOpenChange={setAiOpen}
        intent="payslip_explain"
        context={{
          page_view: "payslip",
          payslip_id: payslipId,
        }}
        suggestedPrompts={[
          "Explain this payslip in simple terms",
          "Why is my net pay different from last month?",
          "Break down my deductions",
          "How can I reduce my tax liability?",
          "What documents do I need for ITR filing?",
        ]}
        title="Payslip Assistant"
        description="Get detailed explanations about your payslip and tax-saving tips"
      />
    </>
  )
}
