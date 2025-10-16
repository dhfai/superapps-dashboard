"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <Sun className="h-[1.2rem] w-[1.2rem] text-muted-foreground/30" />
        <Switch disabled aria-label="Toggle theme" />
        <Moon className="h-[1.2rem] w-[1.2rem] text-muted-foreground/30" />
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Sun
        className={`h-[1.2rem] w-[1.2rem] transition-all duration-500 ease-in-out ${
          theme === "light"
            ? "text-yellow-500 scale-100 rotate-0 opacity-100"
            : "text-muted-foreground/30 scale-75 -rotate-90 opacity-40"
        }`}
      />
      <Switch
        checked={theme === "dark"}
        onCheckedChange={toggleTheme}
        aria-label="Toggle theme"
        className="transition-all duration-300 ease-in-out hover:scale-105"
      />
      <Moon
        className={`h-[1.2rem] w-[1.2rem] transition-all duration-500 ease-in-out ${
          theme === "dark"
            ? "text-blue-400 scale-100 rotate-0 opacity-100"
            : "text-muted-foreground/30 scale-75 rotate-90 opacity-40"
        }`}
      />
    </div>
  )
}
