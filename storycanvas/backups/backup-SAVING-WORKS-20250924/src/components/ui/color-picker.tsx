'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface ColorPickerProps {
  color?: string
  onColorChange: (color: string) => void
  className?: string
}

const defaultColors = [
  '#ffffff', // White
  '#f8f9fa', // Light gray
  '#e9ecef', // Gray 100
  '#dee2e6', // Gray 200
  '#ced4da', // Gray 300
  '#adb5bd', // Gray 400
  '#6c757d', // Gray 500
  '#495057', // Gray 600
  '#343a40', // Gray 700
  '#212529', // Gray 800
  '#000000', // Black
  '#ff6b6b', // Red
  '#ffa07a', // Light red
  '#ff8c00', // Orange  
  '#ffd700', // Gold
  '#ffff00', // Yellow
  '#adff2f', // Green yellow
  '#32cd32', // Lime green
  '#00ff00', // Green
  '#00fa9a', // Medium spring green
  '#40e0d0', // Turquoise
  '#00bfff', // Deep sky blue
  '#0080ff', // Blue
  '#4169e1', // Royal blue
  '#8a2be2', // Blue violet
  '#9370db', // Medium purple
  '#ff69b4', // Hot pink
  '#ff1493', // Deep pink
  '#dc143c', // Crimson
  '#b22222', // Fire brick
  '#8b4513', // Saddle brown
  '#d2691e', // Chocolate
]

export function ColorPicker({ color = '#ffffff', onColorChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customColor, setCustomColor] = useState(color)

  const handleColorSelect = (selectedColor: string) => {
    onColorChange(selectedColor)
    setCustomColor(selectedColor)
    setIsOpen(false)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCustomColor(newColor)
    onColorChange(newColor)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`w-8 h-8 p-0 border-2 ${className}`}
          style={{ backgroundColor: color }}
          title="Change color"
        >
          <span className="sr-only">Color picker</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="top">
        <div className="space-y-3">
          {/* Default color palette */}
          <div>
            <h4 className="text-sm font-medium mb-2">Preset Colors</h4>
            <div className="grid grid-cols-8 gap-1">
              {defaultColors.map((presetColor) => (
                <button
                  key={presetColor}
                  className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                    color === presetColor ? 'border-primary' : 'border-border'
                  }`}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => handleColorSelect(presetColor)}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          {/* Custom color input */}
          <div>
            <h4 className="text-sm font-medium mb-2">Custom Color</h4>
            <div className="flex gap-2">
              <Input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-12 h-8 p-0 border-0"
              />
              <Input
                type="text"
                value={customColor}
                onChange={handleCustomColorChange}
                className="flex-1 h-8"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}