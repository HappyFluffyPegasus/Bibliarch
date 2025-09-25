"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  id?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, onValueChange, min = 0, max = 100, step = 1, disabled, className, id, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value)
      onValueChange([newValue])
    }

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
        <input
          ref={ref}
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0] || 0}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "relative h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Webkit styles
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:bg-blue-700",
            // Firefox styles  
            "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:shadow-lg",
            "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-lg [&::-moz-range-track]:bg-gray-200 [&::-moz-range-track]:border-none"
          )}
          {...props}
        />
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }