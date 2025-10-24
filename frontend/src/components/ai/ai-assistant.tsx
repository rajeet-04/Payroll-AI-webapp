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
import { Sparkles, Send, Loader2, X, Copy, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import systemInstructions from "@/config/system-instructions.json"

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

// Helper to format message content with special tags
function formatMessageContent(content: string): React.ReactNode {
  const parts: React.ReactNode[] = []

  // Process the content in order: code blocks, inline code, bold, headers, line breaks
  const lines = content.split('\n')
  
  lines.forEach((line, lineIndex) => {
    // Check for headers (##)
    const headerMatch = line.match(/^##\s+(.+)$/)
    if (headerMatch) {
      parts.push(
        <h3 key={`header-${lineIndex}`} className="text-base font-semibold mt-3 mb-2">
          {headerMatch[1]}
        </h3>
      )
      return
    }

    // Check for code blocks (```)
    if (line.trim().startsWith('```')) {
      const codeBlockMatch = content.substring(content.indexOf(line)).match(/```(\w+)?\n([\s\S]*?)```/)
      if (codeBlockMatch) {
        const [, language, code] = codeBlockMatch
        parts.push(
          <CodeBlock key={`code-${lineIndex}`} code={code.trim()} language={language} />
        )
        return
      }
    }

    // Process inline formatting within the line
    const processedLine = processInlineFormatting(line, `line-${lineIndex}`)
    parts.push(
      <span key={`line-${lineIndex}`}>
        {processedLine}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    )
  })

  return <div className="space-y-1">{parts}</div>
}

// Process inline formatting (bold, inline code, etc.)
function processInlineFormatting(text: string, baseKey: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Check for inline code (`code`)
    const inlineCodeMatch = remaining.match(/`([^`]+)`/)
    if (inlineCodeMatch) {
      const beforeCode = remaining.substring(0, inlineCodeMatch.index)
      if (beforeCode) {
        parts.push(...processBoldAndText(beforeCode, `${baseKey}-${key++}`))
      }
      parts.push(
        <code key={`${baseKey}-code-${key++}`} className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
          {inlineCodeMatch[1]}
        </code>
      )
      remaining = remaining.substring(inlineCodeMatch.index! + inlineCodeMatch[0].length)
      continue
    }

    // No more inline code, process bold and remaining text
    parts.push(...processBoldAndText(remaining, `${baseKey}-${key++}`))
    break
  }

  return <>{parts}</>
}

// Process bold formatting
function processBoldAndText(text: string, baseKey: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Check for bold (**text**)
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    if (boldMatch) {
      const beforeBold = remaining.substring(0, boldMatch.index)
      if (beforeBold) {
        parts.push(<span key={`${baseKey}-text-${key++}`}>{beforeBold}</span>)
      }
      parts.push(
        <strong key={`${baseKey}-bold-${key++}`} className="font-semibold">
          {boldMatch[1]}
        </strong>
      )
      remaining = remaining.substring(boldMatch.index! + boldMatch[0].length)
      continue
    }

    // No more bold, add remaining text
    if (remaining) {
      parts.push(<span key={`${baseKey}-text-${key++}`}>{remaining}</span>)
    }
    break
  }

  return parts
}

// Code block component with copy functionality
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <div className="relative group my-3">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="bg-muted/50 border rounded-lg p-4 overflow-x-auto">
        <code className="text-sm font-mono block">
          {code}
        </code>
      </pre>
      {language && (
        <div className="absolute left-3 top-2 text-xs text-muted-foreground">
          {language}
        </div>
      )}
    </div>
  )
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

      // Get system instruction for the intent
      const systemInstruction = intent 
        ? systemInstructions[intent as keyof typeof systemInstructions] || systemInstructions.default
        : systemInstructions.default

      // Use streaming for better UX
      await streamResponse(query, session.access_token, chatHistory, systemInstruction)

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

  const streamResponse = async (
    query: string,
    accessToken: string,
    chatHistory: { role: string; content: string }[],
    systemInstruction: string
  ) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      // Build request body based on whether we have a payslip context
      const requestBody: Record<string, unknown> = {
        intent: intent || "default",
        query,
        system_instruction: systemInstruction,
        chat_history: chatHistory,  // Include chat history for multi-turn conversations
      }

      // Add payslip_id if available for payslip_explain intent
      if (intent === "payslip_explain" && context?.payslip_id) {
        requestBody.payslip_id = context.payslip_id
      }

      const response = await fetch(`${apiUrl}/api/v1/chat/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
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
          const lines = chunk.split(/\n/)

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const payload = line.substring(6) // Remove "data: " prefix
              
              if (payload.trim()) {
                // Try to parse as JSON (for error messages)
                try {
                  const parsed = JSON.parse(payload)
                  if (parsed.error) {
                    throw new Error(parsed.error)
                  }
                  // If it's a valid JSON but not an error, treat as text
                  streamedContent += JSON.stringify(parsed)
                } catch {
                  // Plain text chunk - append directly
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
      }

      // Ensure final message is set
      if (streamedContent) {
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
      <DialogContent className="h-full sm:h-[600px] sm:max-w-[600px] flex flex-col p-0 backdrop-blur-md bg-white/50 dark:bg-gray-900/50">
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
                <div className="text-sm">
                  {message.role === "user" ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    formatMessageContent(message.content)
                  )}
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
