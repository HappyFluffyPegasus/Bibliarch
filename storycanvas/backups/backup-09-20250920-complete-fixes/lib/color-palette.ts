// Enhanced Color Palette System based on color theory
export interface ColorPalette {
  id: string
  name: string
  description: string
  theme: 'light' | 'dark'
  scope: 'global' | 'project' | 'folder' // Hierarchical color system
  colors: {
    // Primary colors
    primary: string           // Main background/surface color
    primaryText: string      // Text on primary surfaces
    secondary: string        // Secondary surfaces (cards, panels)
    accent: string          // Accent color for highlights and details
    
    // UI Elements
    border: string          // Borders and dividers
    hover: string          // Hover states
    selected: string       // Selected/active states
    
    // Canvas specific
    canvasBackground: string
    nodeDefault: string
    nodeText: string
    connectionDefault: string
    
    // Semantic colors (maintain good contrast in both themes)
    success: string
    warning: string
    error: string
    info: string
  }
  isDefault?: boolean
}

// Simple color palette for legacy compatibility
export interface SimpleColorPalette {
  id: string
  name: string
  colors: string[]
  isDefault?: boolean
}

// Base color templates for generating palettes
export interface ColorTemplate {
  baseHue: number        // 0-360
  saturation: number     // 0-100
  lightness: number      // 0-100
  complementaryOffset: 'purple' | 'green' // Which side of complementary
}

// Utility functions for color manipulation
export class ColorUtils {
  // Convert HSL to RGB
  static hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h /= 360
    s /= 100
    l /= 100

    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
    const m = l - c / 2
    
    let r = 0, g = 0, b = 0

    if (0 <= h && h < 1/6) { r = c; g = x; b = 0 }
    else if (1/6 <= h && h < 2/6) { r = x; g = c; b = 0 }
    else if (2/6 <= h && h < 3/6) { r = 0; g = c; b = x }
    else if (3/6 <= h && h < 4/6) { r = 0; g = x; b = c }
    else if (4/6 <= h && h < 5/6) { r = x; g = 0; b = c }
    else if (5/6 <= h && h < 1) { r = c; g = 0; b = x }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ]
  }

  // Convert RGB to hex
  static rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  // Convert HSL to hex
  static hslToHex(h: number, s: number, l: number): string {
    const [r, g, b] = this.hslToRgb(h, s, l)
    return this.rgbToHex(r, g, b)
  }

  // Get complementary hue
  static getComplementaryHue(hue: number, offset: 'purple' | 'green'): number {
    const complementary = (hue + 180) % 360
    // Adjust slightly for purple or green bias
    return offset === 'purple' 
      ? (complementary - 20 + 360) % 360 
      : (complementary + 20) % 360
  }

  // Get accent color - positioned like yellow (opposite side of color wheel)
  static getAccentHue(baseHue: number): number {
    // For light blue (200°), yellow is at ~60°, which is about 140° offset
    // This creates a nice complementary contrast
    return (baseHue + 140) % 360  // 140° offset for yellow-like accent
  }

  // Adjust hue while maintaining relationships
  static adjustHue(baseHue: number, adjustment: number): number {
    return (baseHue + adjustment + 360) % 360
  }
}

// Generate palette from template
export class PaletteGenerator {
  static generateFromTemplate(template: ColorTemplate, theme: 'light' | 'dark', scope: 'global' | 'project' | 'folder' = 'global'): ColorPalette {
    const { baseHue, saturation, lightness, complementaryOffset } = template
    const complementaryHue = ColorUtils.getComplementaryHue(baseHue, complementaryOffset)
    const accentHue = ColorUtils.getAccentHue(baseHue)
    
    // 3-color system: yellow main, dark purplish-blue complementary, light blue accent  
    const mainColor = ColorUtils.hslToHex(accentHue, 80, 60)                       // Yellow main color (swapped)
    const complementaryColor = ColorUtils.hslToHex(complementaryHue, saturation + 20, theme === 'light' ? 20 : 80)  // Dark purplish-blue complementary
    const accentColor = ColorUtils.hslToHex(baseHue, saturation, lightness)        // Light blue accent color (swapped)
    
    if (theme === 'light') {
      return {
        id: `${scope}-${theme}-${baseHue}-${complementaryOffset}`,
        name: `Light ${Math.round(baseHue)}° Palette`,
        description: `3-color harmony: Main, Contrast, Accent`,
        theme,
        scope,
        colors: {
          // Light theme: Yellow main color for nodes, complementary for text, light blue accent for background
          primary: ColorUtils.hslToHex(accentHue, 60, 95),                  // Very light yellow main color
          primaryText: complementaryColor,                                   // Complementary for text
          secondary: ColorUtils.hslToHex(accentHue, 70, 90),                // Light yellow main variation
          accent: accentColor,                                               // Light blue accent color
          
          border: complementaryColor,                                        // Complementary for borders
          hover: ColorUtils.hslToHex(accentHue, 80, 85),                    // Slightly darker yellow main
          selected: ColorUtils.hslToHex(accentHue, 90, 80),                 // More saturated yellow main
          
          canvasBackground: ColorUtils.hslToHex(baseHue, saturation * 0.3, 85), // Light blue accent for background
          nodeDefault: ColorUtils.hslToHex(accentHue, 60, 85),              // Lighter yellow for nodes in light theme
          nodeText: complementaryColor,                                      // Complementary for node text
          connectionDefault: complementaryColor,                             // Complementary for connections
          
          success: ColorUtils.hslToHex(120, 60, 50),
          warning: ColorUtils.hslToHex(45, 85, 55),
          error: ColorUtils.hslToHex(0, 70, 55),
          info: accentColor                                                  // Light blue accent for info
        }
      }
    } else {
      return {
        id: `${scope}-${theme}-${baseHue}-${complementaryOffset}`,
        name: `Dark ${Math.round(baseHue)}° Palette`,
        description: `3-color harmony: Main, Contrast, Accent`,
        theme,
        scope,
        colors: {
          // Dark theme: Dark complementary background, yellow main for nodes, light blue accent
          primary: ColorUtils.hslToHex(complementaryHue, saturation * 0.3, 15),  // Dark complementary as background
          primaryText: mainColor,                                                 // Yellow main color for text
          secondary: ColorUtils.hslToHex(complementaryHue, saturation * 0.4, 20), // Darker complementary variation
          accent: accentColor,                                                    // Light blue accent color
          
          border: mainColor,                                                      // Yellow main for borders
          hover: ColorUtils.hslToHex(complementaryHue, saturation * 0.5, 25),    // Lighter complementary
          selected: ColorUtils.hslToHex(complementaryHue, saturation * 0.6, 30), // More saturated complementary
          
          canvasBackground: accentColor,                                          // Light blue accent for background
          nodeDefault: ColorUtils.hslToHex(accentHue, 70, 40),                   // Darker yellow for nodes in dark theme  
          nodeText: complementaryColor,                                           // Complementary for node text
          connectionDefault: accentColor,                                         // Light blue accent for connections
          
          success: ColorUtils.hslToHex(120, 50, 65),
          warning: ColorUtils.hslToHex(45, 80, 70),
          error: ColorUtils.hslToHex(0, 60, 70),
          info: accentColor                                                       // Light blue accent for info
        }
      }
    }
  }

  // Generate palette with hue adjustment (for the slider system)
  static generateWithHueAdjustment(basePalette: ColorPalette, hueAdjustment: number): ColorPalette {
    const template = this.extractTemplateFromPalette(basePalette)
    const adjustedTemplate = {
      ...template,
      baseHue: ColorUtils.adjustHue(template.baseHue, hueAdjustment)
    }
    
    return this.generateFromTemplate(adjustedTemplate, basePalette.theme, basePalette.scope)
  }

  // Extract template from existing palette (for adjustments)
  private static extractTemplateFromPalette(palette: ColorPalette): ColorTemplate {
    // This would reverse-engineer the template from the palette
    // For now, return a default template
    return {
      baseHue: 200,
      saturation: 70,
      lightness: 60,
      complementaryOffset: 'purple'
    }
  }
}

// Base templates for generating palettes
const colorTemplates: ColorTemplate[] = [
  // Blue-based palettes
  { baseHue: 200, saturation: 70, lightness: 60, complementaryOffset: 'purple' },
  { baseHue: 200, saturation: 70, lightness: 60, complementaryOffset: 'green' },
  
  // Teal-based palettes
  { baseHue: 180, saturation: 65, lightness: 55, complementaryOffset: 'purple' },
  { baseHue: 180, saturation: 65, lightness: 55, complementaryOffset: 'green' },
  
  // Purple-based palettes
  { baseHue: 260, saturation: 60, lightness: 50, complementaryOffset: 'purple' },
  { baseHue: 260, saturation: 60, lightness: 50, complementaryOffset: 'green' },
  
  // Green-based palettes
  { baseHue: 150, saturation: 55, lightness: 45, complementaryOffset: 'purple' },
  { baseHue: 150, saturation: 55, lightness: 45, complementaryOffset: 'green' },
]

// Generate default palettes using color theory
export const defaultPalettes: ColorPalette[] = (() => {
  const palettes: ColorPalette[] = []
  
  // Create light and dark versions of each template
  colorTemplates.forEach(template => {
    palettes.push(PaletteGenerator.generateFromTemplate(template, 'light', 'global'))
    palettes.push(PaletteGenerator.generateFromTemplate(template, 'dark', 'global'))
  })
  
  // Mark the first light and dark palettes as default
  if (palettes.length > 0) {
    palettes[0].isDefault = true // First light theme
    const firstDark = palettes.find(p => p.theme === 'dark')
    if (firstDark) firstDark.isDefault = true
  }
  
  return palettes
})()

// Legacy simple palettes for backward compatibility
export const simplePalettes: SimpleColorPalette[] = [
  {
    id: 'story-default',
    name: 'Story Default',
    colors: ['#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd'],
    isDefault: true
  },
  {
    id: 'character-theme',
    name: 'Character Theme',
    colors: ['#ffd700', '#ff8c00', '#ff6b6b', '#ff1493', '#9370db', '#4169e1']
  },
  {
    id: 'nature-theme',
    name: 'Nature Theme',
    colors: ['#32cd32', '#00ff00', '#00fa9a', '#40e0d0', '#00bfff', '#8b4513']
  }
]

export class ColorPaletteManager {
  private static STORAGE_KEY = 'storycanvas-color-palettes'
  private static THEME_KEY = 'storycanvas-theme-preference'
  private static PROJECT_PALETTE_KEY = 'storycanvas-project-palette'
  private static FOLDER_PALETTE_KEY = 'storycanvas-folder-palettes'

  // Enhanced palette management
  static getSavedPalettes(): ColorPalette[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Failed to load saved palettes:', error)
      return []
    }
  }

  static getAllPalettes(): ColorPalette[] {
    const saved = this.getSavedPalettes()
    return [...defaultPalettes, ...saved]
  }

  static savePalette(palette: ColorPalette): void {
    try {
      const saved = this.getSavedPalettes()
      const existingIndex = saved.findIndex(p => p.id === palette.id)
      
      if (existingIndex >= 0) {
        saved[existingIndex] = palette
      } else {
        saved.push(palette)
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved))
    } catch (error) {
      console.error('Failed to save palette:', error)
    }
  }

  static deletePalette(paletteId: string): void {
    try {
      const saved = this.getSavedPalettes()
      const filtered = saved.filter(p => p.id !== paletteId)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to delete palette:', error)
    }
  }

  // Hierarchical palette system
  static getGlobalTheme(): 'light' | 'dark' {
    try {
      return (localStorage.getItem(this.THEME_KEY) as 'light' | 'dark') || 'light'
    } catch {
      return 'light'
    }
  }

  static setGlobalTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(this.THEME_KEY, theme)
      this.applyGlobalTheme(theme)
    } catch (error) {
      console.error('Failed to save theme preference:', error)
    }
  }

  static getProjectPalette(projectId: string): ColorPalette | null {
    try {
      const saved = localStorage.getItem(`${this.PROJECT_PALETTE_KEY}-${projectId}`)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }

  static setProjectPalette(projectId: string, palette: ColorPalette): void {
    try {
      localStorage.setItem(`${this.PROJECT_PALETTE_KEY}-${projectId}`, JSON.stringify(palette))
      this.applyProjectPalette(palette)
    } catch (error) {
      console.error('Failed to save project palette:', error)
    }
  }

  static getFolderPalette(folderId: string): ColorPalette | null {
    try {
      const saved = localStorage.getItem(`${this.FOLDER_PALETTE_KEY}-${folderId}`)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }

  static setFolderPalette(folderId: string, palette: ColorPalette): void {
    try {
      localStorage.setItem(`${this.FOLDER_PALETTE_KEY}-${folderId}`, JSON.stringify(palette))
      this.applyFolderPalette(palette)
    } catch (error) {
      console.error('Failed to save folder palette:', error)
    }
  }

  // Palette application functions
  static applyGlobalTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme)
    
    // Apply basic theme colors
    const defaultPalette = defaultPalettes.find(p => p.theme === theme && p.isDefault)
    if (defaultPalette) {
      this.applyPaletteToDOM(defaultPalette)
    }
  }

  static applyProjectPalette(palette: ColorPalette): void {
    this.applyPaletteToDOM(palette)
    document.documentElement.setAttribute('data-project-palette', palette.id)
  }

  static applyFolderPalette(palette: ColorPalette): void {
    this.applyPaletteToDOM(palette)
    document.documentElement.setAttribute('data-folder-palette', palette.id)
  }

  // Public method to apply palette - this was missing!
  static applyPalette(palette: ColorPalette): void {
    this.applyPaletteToDOM(palette)
    document.documentElement.setAttribute('data-current-palette', palette.id)
    
    // Trigger a custom event to notify components of palette change
    window.dispatchEvent(new CustomEvent('paletteChanged', { 
      detail: { palette } 
    }))
  }

  private static applyPaletteToDOM(palette: ColorPalette): void {
    const root = document.documentElement
    
    // Extract hue from the palette ID for dynamic node colors
    const matches = palette.id.match(/(\d+)/)
    const hue = matches ? matches[1] : '200'
    
    // Apply CSS custom properties
    root.style.setProperty('--color-primary', palette.colors.primary)
    root.style.setProperty('--color-primary-text', palette.colors.primaryText)
    root.style.setProperty('--color-secondary', palette.colors.secondary)
    root.style.setProperty('--color-accent', palette.colors.accent)
    root.style.setProperty('--color-border', palette.colors.border)
    root.style.setProperty('--color-hover', palette.colors.hover)
    root.style.setProperty('--color-selected', palette.colors.selected)
    root.style.setProperty('--color-canvas-bg', palette.colors.canvasBackground)
    root.style.setProperty('--color-node-default', palette.colors.nodeDefault)
    root.style.setProperty('--color-node-text', palette.colors.nodeText)
    root.style.setProperty('--color-connection-default', palette.colors.connectionDefault)
    root.style.setProperty('--color-success', palette.colors.success)
    root.style.setProperty('--color-warning', palette.colors.warning)
    root.style.setProperty('--color-error', palette.colors.error)
    root.style.setProperty('--color-info', palette.colors.info)
    
    // Add the hue for dynamic node coloring
    root.style.setProperty('--color-primary-hue', hue)
  }

  // Generate palette with hue slider
  static createAdjustablePalette(basePalette: ColorPalette, hueShift: number = 0): ColorPalette {
    return PaletteGenerator.generateWithHueAdjustment(basePalette, hueShift)
  }

  // Legacy compatibility
  static createPaletteFromNodes(nodes: Array<{color?: string}>, name: string): SimpleColorPalette {
    const colors = nodes
      .map(node => node.color)
      .filter((color): color is string => !!color)
      .filter((color, index, self) => self.indexOf(color) === index)
      .slice(0, 12)

    return {
      id: `custom-${Date.now()}`,
      name,
      colors
    }
  }

  // Initialize theme on app start
  static initialize(): void {
    const savedTheme = this.getGlobalTheme()
    this.applyGlobalTheme(savedTheme)
  }
}