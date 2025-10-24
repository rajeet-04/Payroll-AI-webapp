"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const cycleTheme = () => {
    const themes = ["light", "dark", "system"]
    const currentIndex = themes.indexOf(theme || "system")
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  const getTooltip = () => {
    switch (theme) {
      case "light":
        return "Light Mode"
      case "dark":
        return "Dark Mode"
      default:
        return "System Mode"
    }
  }

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="h-9 w-9" disabled />
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 relative"
      onClick={cycleTheme}
      title={getTooltip()}
    >
      <Sun className={`h-4 w-4 ${theme === "light" ? "block" : "hidden"}`} />
      <Moon className={`h-4 w-4 ${theme === "dark" ? "block" : "hidden"}`} />
      <Monitor className={`h-4 w-4 ${theme === "system" ? "block" : "hidden"}`} />
    </Button>
  )
}
