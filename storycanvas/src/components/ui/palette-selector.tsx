'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Palette, Plus, Trash2, Sun, Moon, Save, Sliders } from 'lucide-react'
import {
  ColorPalette,
  ColorPaletteManager,
  PaletteGenerator,
  ColorUtils,
  ColorTemplate
} from '@/lib/color-palette'

// Helper functions for describing colors
const getColorName = (hue: number): string => {
  if (hue >= 0 && hue < 30) return 'Red'
  if (hue >= 30 && hue < 60) return 'Orange'
  if (hue >= 60 && hue < 90) return 'Yellow'
  if (hue >= 90 && hue < 150) return 'Green'
  if (hue >= 150 && hue < 210) return 'Cyan/Teal'
  if (hue >= 210 && hue < 270) return 'Blue'
  if (hue >= 270 && hue < 330) return 'Purple'
  return 'Pink/Magenta'
}

const getSaturationDescription = (saturation: number): string => {
  if (saturation < 30) return 'Muted'
  if (saturation < 60) return 'Moderate'
  if (saturation < 80) return 'Vibrant'
  return 'Very Vibrant'
}

const getLightnessDescription = (lightness: number): string => {
  if (lightness < 30) return 'Dark'
  if (lightness < 50) return 'Medium'
  if (lightness < 70) return 'Light'
  return 'Very Light'
}

interface PaletteSelectorProps {
  onColorSelect?: (color: string) => void
  onPaletteChange?: (palette: ColorPalette) => void
  currentPalette?: ColorPalette
  scope?: 'global' | 'project' | 'folder'
  contextId?: string
  className?: string
  mode?: 'simple' | 'advanced' // Simple for single colors, advanced for full palettes
}

export function PaletteSelector({ 
  onColorSelect, 
  onPaletteChange, 
  currentPalette,
  scope = 'global',
  contextId,
  className,
  mode = 'advanced' // Default to advanced mode for slider-based system
}: PaletteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'custom'>('light')
  const [customPalette, setCustomPalette] = useState<ColorPalette | null>(null)
  const [hueAdjustment, setHueAdjustment] = useState([0])
  const [hasShownInitialToast, setHasShownInitialToast] = useState(false)

  // Custom color states for the custom color picker (only 3 main colors)
  const [customColors, setCustomColors] = useState({
    main: '#FFB6C1',        // Soft pink - Main/primary color
    complementary: '#3F3F46', // Charcoal gray - Complementary color
    accent: '#93C5FD'       // Sky blue - Accent color
  })
  
  // Base template for custom palette generation - this is your main color slider
  const [baseTemplate, setBaseTemplate] = useState<ColorTemplate>({
    baseHue: 200, // Light blue base
    saturation: 60, // Moderate saturation for pleasant colors
    lightness: 75, // Lighter for the main color
    complementaryOffset: 'purple' // Purple direction for dark purplish-blue complementary
  })

  // Apply palette when it changes (for real-time preview)
  const applyCurrentPalette = () => {
    if (customPalette && onPaletteChange) {
      onPaletteChange(customPalette)
    }
  }

  useEffect(() => {
    // Set initial theme based on current palette or default to light
    if (currentPalette && currentPalette.theme === 'light') {
      setSelectedTheme('light')
    } else {
      setSelectedTheme('light') // Always default to light since we removed dark mode
    }
  }, [currentPalette])

  useEffect(() => {
    if (selectedTheme === 'custom') {
      // Create custom palette from user-selected 3 colors and generate the full palette
      const customPaletteFromColors: ColorPalette = {
        id: `custom-${Date.now()}`,
        name: 'Custom Color Palette',
        description: 'User-defined 3-color system',
        theme: 'light',
        scope,
        colors: {
          // Use the 3 main colors to derive all palette colors
          primary: customColors.accent,           // Light blue accent for primary
          primaryText: customColors.complementary, // Dark complementary for text
          secondary: customColors.main,           // Main yellow for secondary
          accent: customColors.accent,            // Light blue accent

          border: customColors.complementary,     // Dark complementary for borders
          hover: customColors.main,               // Main yellow for hover
          selected: customColors.main,            // Main yellow for selected

          canvasBackground: customColors.accent,  // Light blue for canvas
          nodeDefault: customColors.main,         // Main yellow for nodes
          nodeText: customColors.complementary,   // Dark complementary for node text
          connectionDefault: customColors.complementary, // Dark complementary for connections

          success: '#27ae60',
          warning: '#f39c12',
          error: '#e74c3c',
          info: customColors.accent               // Light blue accent for info
        }
      }
      setCustomPalette(customPaletteFromColors)
    } else {
      // Generate palette using slider system for light theme
      const adjustedTemplate = {
        ...baseTemplate,
        baseHue: ColorUtils.adjustHue(baseTemplate.baseHue, hueAdjustment[0])
      }
      const generated = PaletteGenerator.generateFromTemplate(adjustedTemplate, selectedTheme, scope)
      setCustomPalette(generated)
    }
  }, [baseTemplate, hueAdjustment, selectedTheme, scope, customColors])
  
  // Show welcome toast when dialog opens and apply initial palette
  useEffect(() => {
    if (isOpen && customPalette) {
      // Apply the current palette when dialog opens
      applyCurrentPalette()
      
      if (!hasShownInitialToast) {

        setHasShownInitialToast(true)
      }
    }
  }, [isOpen, hasShownInitialToast, customPalette])

  const handleColorClick = (color: string) => {
    if (onColorSelect) {
      onColorSelect(color)
    }
    setIsOpen(false)
  }

  const handlePaletteSelect = (palette: ColorPalette) => {
    if (onPaletteChange) {
      onPaletteChange(palette)
    }
    setIsOpen(false)
  }

  const handleThemeToggle = (theme: 'light' | 'custom') => {
    setSelectedTheme(theme)
    if (scope === 'global' && theme === 'light') {
      ColorPaletteManager.setGlobalTheme(theme)
    }
    // Apply palette after theme change
    setTimeout(() => applyCurrentPalette(), 0)
  }

  const handleSaveCustomPalette = () => {
    if (customPalette) {
      const namedPalette = {
        ...customPalette,
        name: `Custom ${selectedTheme === 'light' ? 'Light' : selectedTheme === 'custom' ? 'Color' : 'Light'} Palette`,
        id: `custom-${Date.now()}`
      }
      ColorPaletteManager.savePalette(namedPalette)

    }
  }

  const ColorPreview = ({ colors }: { colors: ColorPalette['colors'] }) => (
    <div className="p-3 rounded-lg border">
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="aspect-square rounded border" style={{ backgroundColor: colors.nodeDefault }} />
        <div className="aspect-square rounded border" style={{ backgroundColor: colors.nodeText }} />
        <div className="aspect-square rounded border" style={{ backgroundColor: colors.canvasBackground }} />
      </div>
      <div className="text-xs text-gray-600 grid grid-cols-3 gap-2 text-center">
        <span>Main</span>
        <span>Complementary</span>
        <span>Accent</span>
      </div>
    </div>
  )

  const PaletteCard = ({ palette }: { palette: ColorPalette }) => (
    <div
      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      onClick={() => handlePaletteSelect(palette)}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium truncate">{palette.name}</h4>
        {palette.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
      </div>
      {mode === 'advanced' ? (
        <ColorPreview colors={palette.colors} />
      ) : (
        <div className="grid grid-cols-8 gap-1">
          {Object.values(palette.colors).map((color: string, index: number) => (
            <button
              key={`${palette.id}-${index}`}
              className="w-8 h-8 rounded border-2 border-border hover:border-primary hover:scale-110 transition-all"
              style={{ backgroundColor: color }}
              onClick={(e) => {
                e.stopPropagation()
                handleColorClick(color)
              }}
              title={color}
            />
          ))}
        </div>
      )}
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 truncate">{palette.description}</p>
    </div>
  )


  // Slider-based color palette system
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${className}`}
          title="Color Palette"
          onClick={() => setIsOpen(true)}
        >
          <Palette className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Color Palette System
            <Badge variant="outline" className="ml-2">
              {scope === 'global' ? '🌐 Website' : 
               scope === 'project' ? '📁 Project' : '📂 Folder'} Colors
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[600px]">
          {/* Custom Color Picker Mode Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 border-b">
            <Button
              variant={selectedTheme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleThemeToggle('light')}
              className="flex items-center gap-2"
            >
              <Sun className="w-4 h-4" />
              Complementary Palette
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTheme('custom')}
              className="flex items-center gap-2"
            >
              <Sliders className="w-4 h-4" />
              Custom Colors
            </Button>
          </div>

          {/* Color Designer */}
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {selectedTheme === 'custom' ? (
                /* Custom Color Picker */
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold">🎨 Custom Color Picker</Label>
                    <p className="text-sm text-gray-500 mb-4">Choose your 3 main colors - the system will create a complete palette from these</p>

                    <div className="space-y-4">
                      {Object.entries(customColors).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <Input
                            type="color"
                            value={value}
                            onChange={(e) => {
                              setCustomColors(prev => ({
                                ...prev,
                                [key]: e.target.value
                              }))
                              setTimeout(() => applyCurrentPalette(), 0)
                            }}
                            className="w-16 h-12 p-0 border-2 rounded cursor-pointer"
                          />
                          <div className="flex-1">
                            <Label className="text-base font-medium capitalize">
                              {key === 'main' ? 'Main Color' :
                               key === 'complementary' ? 'Complementary Color' :
                               'Accent Color'}
                            </Label>
                            <Input
                              type="text"
                              value={value}
                              onChange={(e) => {
                                setCustomColors(prev => ({
                                  ...prev,
                                  [key]: e.target.value
                                }))
                                setTimeout(() => applyCurrentPalette(), 0)
                              }}
                              className="text-sm h-8 mt-1"
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Single Main Color Slider */
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="hue-adjustment" className="text-base font-semibold">🎨 Main Color Slider</Label>
                    <p className="text-sm text-gray-500 mb-3">Slide to change the overall color theme while keeping perfect harmony</p>
                    <div className="mt-2 space-y-3">
                      <Slider
                        id="hue-adjustment"
                        value={hueAdjustment}
                        onValueChange={(value) => {
                          setHueAdjustment(value)
                          setTimeout(() => applyCurrentPalette(), 0)
                        }}
                        min={-180}
                        max={180}
                        step={5}
                        className="w-full h-3"
                      />
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="font-medium text-lg leading-tight">{getColorName(ColorUtils.adjustHue(baseTemplate.baseHue, hueAdjustment[0]))}</div>
                        {hueAdjustment[0] !== 0 && (
                          <div className="text-xs text-gray-500 leading-tight">({hueAdjustment[0] > 0 ? '+' : ''}{hueAdjustment[0]}° from base blue)</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        if (customPalette) {
                          // Apply palette to DOM (CSS variables)
                          ColorPaletteManager.applyPalette(customPalette)

                          // Also notify parent component if provided
                          if (onPaletteChange) {
                            onPaletteChange(customPalette)
                          }


                          setIsOpen(false)
                        }
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Palette className="w-4 h-4 mr-2" />
                      Apply Palette to Project
                    </Button>

                    <Button
                      onClick={handleSaveCustomPalette}
                      variant="outline"
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save This Palette
                    </Button>
                  </div>
                </div>
              )}

              {/* Live Preview */}
              <div className="space-y-4">
                <div>
                  <Label>🎨 Live Preview</Label>
                  {customPalette && (
                    <div className="mt-2 p-4 border rounded-lg">
                      <h4 className="font-medium mb-3">{customPalette.name}</h4>
                      <ColorPreview colors={customPalette.colors} />
                      <div className="mt-4 text-xs text-gray-600 space-y-1">
                        <p><strong>Main:</strong> Nodes & Cards</p>
                        <p><strong>Complementary:</strong> Text & Borders</p>
                        <p><strong>Accent:</strong> Canvas Background</p>
                        <p className="mt-2 text-xs italic text-gray-500">Dark mode swaps Main ↔ Complementary</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600">
                  <h5 className="font-medium mb-2">✨ How It Works:</h5>
                  {selectedTheme === 'custom' ? (
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Full Control:</strong> Pick exact colors for every element</li>
                      <li>• <strong>Live Preview:</strong> See changes instantly as you pick colors</li>
                      <li>• <strong>Precise Colors:</strong> Use color picker or enter hex codes directly</li>
                      <li>• <strong>Complete Freedom:</strong> No automatic harmony - you choose everything</li>
                    </ul>
                  ) : (
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Magic Slider:</strong> Changes all colors together while keeping perfect harmony</li>
                      <li>• <strong>3-Color System:</strong> Main + Complementary + Accent</li>
                      <li>• <strong>Smart Relationships:</strong> Colors always work well together</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="ml-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
