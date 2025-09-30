'use client'

import React from 'react'
import { Square, Circle, Eye, EyeOff, Sun, Moon, Bold, AlignLeft, AlignCenter, Minimize, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NodeStylePreferences {
  corners: 'sharp' | 'rounded'
  outlines: 'visible' | 'hidden'
  textWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center'
}

interface StyleToggleProps {
  label: string
  options: [string, string]
  current: string
  onChange: (value: string) => void
  icons?: [React.ReactNode, React.ReactNode]
}

function StyleToggle({ label, options, current, onChange, icons }: StyleToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant={current === options[0] ? "default" : "outline"}
          onClick={() => onChange(options[0])}
          className="h-6 w-6 p-0"
          title={`${label}: ${options[0]}`}
        >
          {icons ? icons[0] : options[0].charAt(0).toUpperCase()}
        </Button>
        <Button
          size="sm"
          variant={current === options[1] ? "default" : "outline"}
          onClick={() => onChange(options[1])}
          className="h-6 w-6 p-0"
          title={`${label}: ${options[1]}`}
        >
          {icons ? icons[1] : options[1].charAt(0).toUpperCase()}
        </Button>
      </div>
    </div>
  )
}

interface NodeStylePanelProps {
  preferences: NodeStylePreferences
  onUpdate: (key: keyof NodeStylePreferences, value: string) => void
}

export function NodeStylePanel({ preferences, onUpdate }: NodeStylePanelProps) {
  return (
    <div className="space-y-1">
        <StyleToggle
          label="Corners"
          options={['sharp', 'rounded']}
          current={preferences.corners}
          onChange={(value) => onUpdate('corners', value)}
          icons={[
            <Square className="w-3 h-3" />,
            <Circle className="w-3 h-3" />
          ]}
        />

        <StyleToggle
          label="Outline"
          options={['visible', 'hidden']}
          current={preferences.outlines}
          onChange={(value) => onUpdate('outlines', value)}
          icons={[
            <Eye className="w-3 h-3" />,
            <EyeOff className="w-3 h-3" />
          ]}
        />


        <StyleToggle
          label="Text"
          options={['normal', 'bold']}
          current={preferences.textWeight}
          onChange={(value) => onUpdate('textWeight', value)}
          icons={[
            <span className="text-xs font-normal">A</span>,
            <Bold className="w-3 h-3" />
          ]}
        />

        <StyleToggle
          label="Align"
          options={['left', 'center']}
          current={preferences.textAlign}
          onChange={(value) => onUpdate('textAlign', value)}
          icons={[
            <AlignLeft className="w-3 h-3" />,
            <AlignCenter className="w-3 h-3" />
          ]}
        />
    </div>
  )
}