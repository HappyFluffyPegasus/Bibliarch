'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { ColorPalette, ColorPaletteManager } from '@/lib/color-palette'

interface ColorContextValue {
  // Global theme (light/dark)
  globalTheme: 'light' | 'dark'
  setGlobalTheme: (theme: 'light' | 'dark') => void
  
  // Project-level palette
  projectPalette: ColorPalette | null
  setProjectPalette: (projectId: string, palette: ColorPalette | null) => void

  // Update current project context
  setCurrentProjectId: (projectId: string | null) => void
  
  // Current folder context for hierarchical colors
  currentFolderId: string | null
  setCurrentFolderId: (folderId: string | null) => void
  
  // Get effective palette for current context
  getCurrentPalette: () => ColorPalette | null
  
  // Folder palette management
  getFolderPalette: (folderId: string) => ColorPalette | null
  setFolderPalette: (folderId: string, palette: ColorPalette | null) => void
  
  // Apply palette to DOM
  applyPalette: (palette: ColorPalette) => void
}

const ColorContext = createContext<ColorContextValue | undefined>(undefined)

export function useColorContext() {
  const context = useContext(ColorContext)
  if (!context) {
    throw new Error('useColorContext must be used within a ColorProvider')
  }
  return context
}

interface ColorProviderProps {
  children: React.ReactNode
  projectId?: string // Current project ID for project-level palettes
}

export function ColorProvider({ children, projectId }: ColorProviderProps) {
  const [globalTheme, setGlobalTheme] = useState<'light' | 'dark'>('light')
  const [projectPalette, setProjectPaletteState] = useState<ColorPalette | null>(null)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId || null)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderPalettes, setFolderPalettes] = useState<Record<string, ColorPalette>>({})

  // Initialize color system
  useEffect(() => {
    // Load theme preference but DON'T apply default palette yet
    const savedTheme = ColorPaletteManager.getGlobalTheme()
    setGlobalTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)

    // Load saved project palette first
    if (currentProjectId) {
      const savedProjectPalette = ColorPaletteManager.getProjectPalette(currentProjectId)
      setProjectPaletteState(savedProjectPalette)

      // Apply the saved palette immediately if it exists
      if (savedProjectPalette) {
        ColorPaletteManager.applyPalette(savedProjectPalette)
      } else {
        // No saved palette - apply default for current theme
        const defaultPalette = ColorPaletteManager.getAllPalettes().find(p =>
          p.theme === savedTheme && p.isDefault
        )
        if (defaultPalette) {
          ColorPaletteManager.applyPalette(defaultPalette)
        }
      }
    } else {
      setProjectPaletteState(null)
    }
  }, [currentProjectId])

  // Update project ID when prop changes
  useEffect(() => {
    if (projectId !== currentProjectId) {
      setCurrentProjectId(projectId || null)
    }
  }, [projectId, currentProjectId])

  const handleSetGlobalTheme = useCallback((theme: 'light' | 'dark') => {
    setGlobalTheme(theme)
    ColorPaletteManager.setGlobalTheme(theme)
  }, [])

  const handleSetProjectPalette = useCallback((projectId: string, palette: ColorPalette | null) => {
    setProjectPaletteState(palette)
    if (palette) {
      ColorPaletteManager.setProjectPalette(projectId, palette)
    }
  }, [])

  const getFolderPalette = useCallback((folderId: string): ColorPalette | null => {
    return folderPalettes[folderId] || ColorPaletteManager.getFolderPalette(folderId)
  }, [folderPalettes])

  const setFolderPalette = useCallback((folderId: string, palette: ColorPalette | null) => {
    if (palette) {
      setFolderPalettes(prev => ({ ...prev, [folderId]: palette }))
      ColorPaletteManager.setFolderPalette(folderId, palette)
    } else {
      setFolderPalettes(prev => {
        const { [folderId]: _, ...rest } = prev
        return rest
      })
    }
  }, [])

  // Get the effective palette for the current context (global only - no folder-specific palettes)
  const getCurrentPalette = useCallback((): ColorPalette | null => {
    // 1. Use project palette if set
    if (projectPalette) return projectPalette

    // 2. Fall back to global theme default palette
    return ColorPaletteManager.getAllPalettes().find(p =>
      p.theme === globalTheme && p.isDefault
    ) || null
  }, [projectPalette, globalTheme])

  const applyPalette = useCallback((palette: ColorPalette) => {
    ColorPaletteManager.applyPalette(palette)
  }, [])

  // DISABLED: Palette is now applied in the initialization useEffect above
  // This useEffect was causing the default palette to override the saved palette
  // useEffect(() => {
  //   const currentPalette = getCurrentPalette()
  //   if (currentPalette) {
  //     applyPalette(currentPalette)
  //   }
  // }, [globalTheme, projectPalette, getCurrentPalette, applyPalette])

  const contextValue: ColorContextValue = useMemo(() => ({
    globalTheme,
    setGlobalTheme: handleSetGlobalTheme,
    projectPalette,
    setProjectPalette: handleSetProjectPalette,
    setCurrentProjectId,
    currentFolderId,
    setCurrentFolderId,
    getCurrentPalette,
    getFolderPalette,
    setFolderPalette,
    applyPalette
  }), [
    globalTheme,
    handleSetGlobalTheme,
    projectPalette,
    handleSetProjectPalette,
    setCurrentProjectId,
    currentFolderId,
    setCurrentFolderId,
    getCurrentPalette,
    getFolderPalette,
    setFolderPalette,
    applyPalette
  ])

  return (
    <ColorContext.Provider value={contextValue}>
      {children}
    </ColorContext.Provider>
  )
}