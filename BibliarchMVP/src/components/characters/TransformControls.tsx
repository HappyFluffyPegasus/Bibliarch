'use client'

import { useState } from 'react'
import { RotateCcw, Check, Lightbulb, X } from 'lucide-react'

interface Transform {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

interface TransformControlsProps {
  meshName: string
  currentTransform: Transform
  onTransformChange: (transform: Transform) => void
  onClose: () => void
  onReset: () => void
}

export default function TransformControls({
  meshName,
  currentTransform,
  onTransformChange,
  onClose,
  onReset
}: TransformControlsProps) {
  const [mode, setMode] = useState<'move' | 'rotate' | 'scale'>('move')
  const [uniformScale, setUniformScale] = useState(true)

  const handlePositionChange = (axis: number, value: number) => {
    const newPosition: [number, number, number] = [...currentTransform.position]
    newPosition[axis] = value
    onTransformChange({ ...currentTransform, position: newPosition })
  }

  const handleRotationChange = (axis: number, value: number) => {
    const newRotation: [number, number, number] = [...currentTransform.rotation]
    newRotation[axis] = value
    onTransformChange({ ...currentTransform, rotation: newRotation })
  }

  const handleScaleChange = (axis: number, value: number) => {
    if (uniformScale) {
      const newScale: [number, number, number] = [value, value, value]
      onTransformChange({ ...currentTransform, scale: newScale })
    } else {
      const newScale: [number, number, number] = [...currentTransform.scale]
      newScale[axis] = value
      onTransformChange({ ...currentTransform, scale: newScale })
    }
  }

  return (
    <div className="absolute right-0 top-0 w-80 h-full overflow-y-auto p-4 bg-card border-l border-border">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-foreground">Transform</h3>
          <button
            onClick={onClose}
            className="leading-none text-foreground hover:text-muted-foreground"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{meshName}</p>
      </div>

      {/* Mode Toggle */}
      <div className="mb-4">
        <div className="text-xs font-semibold mb-2 text-foreground">Gizmo Mode</div>
        <div className="flex gap-2">
          {(['move', 'rotate', 'scale'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border-2 ${
                mode === m
                  ? 'bg-sky-500 text-white border-sky-600'
                  : 'bg-muted text-foreground border-border hover:bg-muted/80'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Position Controls */}
      <div className="mb-4 p-3 rounded-xl bg-muted/50">
        <h4 className="text-sm font-semibold mb-3 text-foreground">Position</h4>
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="mb-3">
            <div className="flex justify-between text-xs mb-1 text-muted-foreground">
              <span>{axis}</span>
              <span>{currentTransform.position[i].toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.1"
              value={currentTransform.position[i]}
              onChange={(e) => handlePositionChange(i, parseFloat(e.target.value))}
              className="w-full accent-sky-500"
            />
          </div>
        ))}
      </div>

      {/* Rotation Controls */}
      <div className="mb-4 p-3 rounded-xl bg-muted/50">
        <h4 className="text-sm font-semibold mb-3 text-foreground">Rotation</h4>
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="mb-3">
            <div className="flex justify-between text-xs mb-1 text-muted-foreground">
              <span>{axis}</span>
              <span>{currentTransform.rotation[i].toFixed(0)}deg</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={currentTransform.rotation[i]}
              onChange={(e) => handleRotationChange(i, parseFloat(e.target.value))}
              className="w-full accent-sky-500"
            />
          </div>
        ))}
      </div>

      {/* Scale Controls */}
      <div className="mb-4 p-3 rounded-xl bg-muted/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground">Scale</h4>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={uniformScale}
              onChange={(e) => setUniformScale(e.target.checked)}
              className="accent-sky-500"
            />
            Uniform
          </label>
        </div>

        {uniformScale ? (
          <div>
            <div className="flex justify-between text-xs mb-1 text-muted-foreground">
              <span>All Axes</span>
              <span>{currentTransform.scale[0].toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={currentTransform.scale[0]}
              onChange={(e) => handleScaleChange(0, parseFloat(e.target.value))}
              className="w-full accent-sky-500"
            />
          </div>
        ) : (
          ['X', 'Y', 'Z'].map((axis, i) => (
            <div key={axis} className="mb-3">
              <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                <span>{axis}</span>
                <span>{currentTransform.scale[i].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={currentTransform.scale[i]}
                onChange={(e) => handleScaleChange(i, parseFloat(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onReset}
          className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600"
        >
          <RotateCcw size={14} strokeWidth={2.5} />
          Reset
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 bg-sky-500 text-white hover:bg-sky-600"
        >
          <Check size={14} strokeWidth={2.5} />
          Done
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 p-2 rounded-lg text-xs flex items-start gap-2 bg-sky-500/20 text-foreground">
        <Lightbulb size={14} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
        <span>Tip: Use the gizmo mode buttons to switch between Move, Rotate, and Scale</span>
      </div>
    </div>
  )
}
