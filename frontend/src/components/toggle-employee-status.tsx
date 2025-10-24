"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface ToggleEmployeeStatusProps {
  employeeId: string
  isActive: boolean
}

export function ToggleEmployeeStatus({ employeeId, isActive }: ToggleEmployeeStatusProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleToggle = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("employees")
        .update({ is_active: !isActive })
        .eq("id", employeeId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Failed to update employee status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  )
}
