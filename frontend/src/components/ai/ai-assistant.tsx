"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Sparkles, Send, Loader2, X } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AIAssistantProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  intent?: "payslip_explain" | "leave_advice" | "payslip_tax_suggestions" | "dashboard_insights"
  context?: Record<string, unknown>
  suggestedPrompts?: string[]
  title?: string
  description?: string
}

export function AIAssistant({
  open,
  onOpenChange,
  intent,
  context,
  suggestedPrompts = [],
  title = "AI Assistant",
  description = "Ask me anything about your payroll, leaves, or compensation",
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Reset messages when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setMessages([])
      setInput("")
      setError("")
    }
  }, [open])

  const sendMessage = async (query: string) => {
    if (!query.trim() || isLoading) return

    setError("")
    setIsLoading(true)

    // Add user message
    const userMessage: Message = { role: "user", content: query }
    setMessages((prev) => [...prev, userMessage])
    setInput("")

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("No active session. Please log in again.")
      }

      // Build chat history for context continuity
      const chatHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Use streaming for payslip_explain intent if available
      if (intent === "payslip_explain" && context?.payslip_id) {
        await streamPayslipExplanation(query, session.access_token, chatHistory)
      } else {
        // Use regular chat endpoint for other intents
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/v1/chat/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            query,
            context,
            intent,
            chat_history: chatHistory,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            detail: "Failed to get response",
          }))
          throw new Error(errorData.detail || "Failed to get AI response")
        }

        const data = await response.json()

        // Add assistant message
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (err) {
      console.error("AI assistant error:", err)
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get AI response"
      setError(errorMessage)

      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorMessage}`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const streamPayslipExplanation = async (
    query: string,
    accessToken: string,
    _chatHistory: { role: string; content: string }[]
  ) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/v1/chat/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: "payslip_explain",
          payslip_id: context?.payslip_id,
          query,
          system_instruction: "You are a helpful payroll assistant for Indian employees. Provide clear explanations with INR formatting and tax-saving suggestions.",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to start streaming")
      }

      // Create placeholder message that we'll update with streaming content
      let streamedContent = ""
      const messageIndex = messages.length + 1 // user message was already added

      // Read the stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder("utf-8")

      if (!reader) {
        throw new Error("No response stream available")
      }

      let done = false
      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading

        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          
          // Parse SSE format: "data: <payload>\n\n"
          const lines = chunk.split(/\n\n/).filter(Boolean)
          
          for (const line of lines) {
            const dataMatch = line.match(/^data:\s*(.*)$/)
            if (dataMatch) {
              const payload = dataMatch[1]
              
              // Try to parse as JSON (for metadata or structured chunks)
              try {
                const parsed = JSON.parse(payload)
                if (parsed && parsed.type === "metadata") {
                  // Metadata chunk - skip or use for UI hints
                  console.log("Stream metadata:", parsed)
                } else if (parsed && parsed.error) {
                  throw new Error(parsed.error)
                } else {
                  // Structured JSON chunk - append as text
                  streamedContent += JSON.stringify(parsed) + " "
                }
              } catch {
                // Plain text chunk
                streamedContent += payload
              }

              // Update the message in real-time
              setMessages((prev) => {
                const updated = [...prev]
                if (updated[messageIndex]) {
                  updated[messageIndex] = {
                    role: "assistant",
                    content: streamedContent,
                  }
                } else {
                  updated.push({
                    role: "assistant",
                    content: streamedContent,
                  })
                }
                return updated
              })
            }
          }
        }
      }

      // Ensure final message is set
      if (streamedContent) {
        setMessages((prev) => {
          const updated = [...prev]
          const existing = updated.find((m, i) => i === messageIndex)
          if (!existing || existing.content !== streamedContent) {
            if (updated[messageIndex]) {
              updated[messageIndex] = {
                role: "assistant",
                content: streamedContent,
              }
            } else {
              updated.push({
                role: "assistant",
                content: streamedContent,
              })
            }
          }
          return updated
        })
      }
    } catch (err) {
      console.error("Streaming error:", err)
      throw err
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0 backdrop-blur-md bg-white/50 dark:bg-gray-900/50">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && suggestedPrompts.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Try asking me:
              </p>
              <div className="grid gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start text-left h-auto py-3 px-4"
                    onClick={() => handlePromptClick(prompt)}
                    disabled={isLoading}
                  >
                    <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{prompt}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <Card
                className={`max-w-[85%] p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <Card className="max-w-[85%] p-4 bg-muted">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="px-6 py-2">
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError("")}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 pt-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="min-h-[60px] max-h-[120px]"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="h-[60px] w-[60px] flex-shrink-0"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
