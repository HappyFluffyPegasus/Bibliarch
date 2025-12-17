'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

interface ThemeToggleProps {
  onTooltipEnter?: (text: string, x: number, y: number) => void
  onTooltipLeave?: () => void
}

export function ThemeToggle({ onTooltipEnter, onTooltipLeave }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div
      className="relative"
      onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); onTooltipEnter?.(theme === 'dark' ? 'Light Mode' : 'Dark Mode', r.left, r.bottom) }}
      onMouseLeave={() => onTooltipLeave?.()}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="w-9 h-9 p-0"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  )
}