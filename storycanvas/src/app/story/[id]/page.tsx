'use client'

import React, { useEffect, useState, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Sparkles, ChevronRight, Settings, LogOut, Home as HomeIcon, ChevronLeft, Plus, Minus, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useColorContext } from '@/components/providers/color-provider'
import { subCanvasTemplates } from '@/lib/templates'
import FeedbackButton from '@/components/feedback/FeedbackButton'
import { signOut } from '@/lib/auth/actions'
import { useUser, useProfile, useStory, useCanvas, useUpdateStory, useSaveCanvas } from '@/lib/hooks/useSupabaseQuery'

// Use the HTML canvas instead to avoid Jest worker issues completely
const Bibliarch = dynamic(
  () => import('@/components/canvas/HTMLCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-sky-600 dark:text-blue-400 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading canvas...</p>
        </div>
      </div>
    )
  }
)

interface PageProps {
  params: Promise<{ id: string }>
}

export default function StoryPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const colorContext = useColorContext()
  const router = useRouter()
  const supabase = createClient()

  // State must come before conditional hooks
  const [currentCanvasId, setCurrentCanvasId] = useState('main')
  const [canvasData, setCanvasData] = useState<any>(null)
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false)
  const [canvasPath, setCanvasPath] = useState<{id: string, title: string}[]>([])
  const [showCanvasSettings, setShowCanvasSettings] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedBio, setEditedBio] = useState('')
  const [zoom, setZoom] = useState(1)

  // Use cached queries - all called unconditionally
  const { data: user, isLoading: isUserLoading } = useUser()
  const { data: profile } = useProfile(user?.id)
  const { data: story, isLoading: isStoryLoading } = useStory(resolvedParams.id, user?.id)
  const { data: canvasDataFromQuery, isLoading: isCanvasLoading } = useCanvas(resolvedParams.id, currentCanvasId)
  const updateStoryMutation = useUpdateStory()
  const saveCanvasMutation = useSaveCanvas()

  const username = profile?.username || 'Storyteller'
  const isLoading = isUserLoading || isStoryLoading

  // Store the latest canvas state from Bibliarch component
  const latestCanvasData = useRef<{ nodes: any[], connections: any[] }>({ nodes: [], connections: [] })

  // Set project context for color palette persistence
  useEffect(() => {
    colorContext.setCurrentProjectId(resolvedParams.id)
  }, [resolvedParams.id])

  // Track current canvas ID to prevent stale closures
  const currentCanvasIdRef = useRef(currentCanvasId)
  useEffect(() => {
    currentCanvasIdRef.current = currentCanvasId
  }, [currentCanvasId])

  // Handle authentication redirects
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router])

  // Update document title and form fields when story loads
  useEffect(() => {
    if (story?.title) {
      document.title = `${story.title} - Bibliarch`
      setEditedTitle(story.title)
      setEditedBio(story.bio || '')
    }
  }, [story?.title, story?.bio])

  // Apply canvas-page class to body to prevent scrolling
  useEffect(() => {
    document.body.classList.add('canvas-page')
    return () => {
      document.body.classList.remove('canvas-page')
    }
  }, [])

  // Track if we have unsaved changes
  const hasUnsavedChanges = useRef(false)
  const isSaving = useRef(false)
  const isInternalNavigation = useRef(false) // Track if navigation is internal (home button, etc.)

  // Handle canvas data loading from cache
  useEffect(() => {
    if (isCanvasLoading) {
      setIsLoadingCanvas(true)
      return
    }

    // Clear old data
    latestCanvasData.current = { nodes: [], connections: [] }

    const canvas = canvasDataFromQuery

    if (canvas) {
      const loadedData = {
        nodes: canvas.nodes || [],
        connections: canvas.connections || []
      }

      // CRITICAL: Only apply template if canvas exists but is EMPTY
      if (loadedData.nodes.length === 0) {
        // Check for characters-folder template
        if (currentCanvasId.includes('characters-folder') && subCanvasTemplates['characters-folder']) {
          console.log('✅ Applying Characters & Relationships folder template to empty canvas')
          const timestamp = Date.now()

          const idMap: Record<string, string> = {}
          subCanvasTemplates['characters-folder'].nodes.forEach(node => {
            idMap[node.id] = `${node.id}-${timestamp}`
          })

          const templateData = {
            nodes: subCanvasTemplates['characters-folder'].nodes.map(node => ({
              ...node,
              id: idMap[node.id],
              ...(node.childIds ? { childIds: node.childIds.map(childId => idMap[childId]) } : {}),
              ...(node.parentId ? { parentId: idMap[node.parentId] } : {})
            })),
            connections: subCanvasTemplates['characters-folder'].connections.map(conn => ({
              ...conn,
              id: `${conn.id}-${timestamp}`,
              from: idMap[conn.from] || conn.from,
              to: idMap[conn.to] || conn.to
            }))
          }

          setCanvasData(templateData)
          latestCanvasData.current = templateData

          // Save template immediately to prevent data loss
          handleSaveCanvas(templateData.nodes, templateData.connections)
        }
        // Check for character node template
        else if (currentCanvasId.includes('character-') && subCanvasTemplates.character) {
          console.log('✅ Applying character template to empty canvas')
          const timestamp = Date.now()

          const idMap: Record<string, string> = {}
          subCanvasTemplates.character.nodes.forEach(node => {
            idMap[node.id] = `${node.id}-${timestamp}`
          })

          const templateData = {
            nodes: subCanvasTemplates.character.nodes.map(node => ({
              ...node,
              id: idMap[node.id],
              ...(node.childIds ? { childIds: node.childIds.map(childId => idMap[childId]) } : {}),
              ...(node.parentId ? { parentId: idMap[node.parentId] } : {})
            })),
            connections: subCanvasTemplates.character.connections.map(conn => ({
              ...conn,
              id: `${conn.id}-${timestamp}`,
              from: idMap[conn.from] || conn.from,
              to: idMap[conn.to] || conn.to
            }))
          }

          setCanvasData(templateData)
          latestCanvasData.current = templateData

          // Save template immediately to prevent data loss
          handleSaveCanvas(templateData.nodes, templateData.connections)
        } else {
          setCanvasData(loadedData)
          latestCanvasData.current = loadedData
        }
      } else {
        setCanvasData(loadedData)
        latestCanvasData.current = loadedData
      }
    } else {
      // No existing canvas data - this is expected for new folder canvases
      console.log('No canvas data found for canvas:', currentCanvasId)

      // Check if this is a folder canvas that needs a template
      let templateData: { nodes: any[], connections: any[] } = { nodes: [], connections: [] }

      // Detect if this is a specific folder canvas by checking the canvas ID pattern
      console.log('🔍 Checking canvas ID for template:', currentCanvasId)
      console.log('🔍 Has characters-folder template?', !!subCanvasTemplates['characters-folder'])

      // For folder canvases, check if it needs a template FIRST
      if (currentCanvasId.includes('characters-folder') && subCanvasTemplates['characters-folder']) {
        console.log('✅ Applying Characters & Relationships folder template')
        const timestamp = Date.now()

        // Create ID mapping for updating references
        const idMap: Record<string, string> = {}
        subCanvasTemplates['characters-folder'].nodes.forEach(node => {
          idMap[node.id] = `${node.id}-${timestamp}`
        })

        templateData = {
          nodes: subCanvasTemplates['characters-folder'].nodes.map(node => ({
            ...node,
            id: idMap[node.id],
            // Update childIds to use new IDs
            ...(node.childIds ? { childIds: node.childIds.map(childId => idMap[childId]) } : {}),
            // Update parentId to use new ID
            ...(node.parentId ? { parentId: idMap[node.parentId] } : {})
          })),
          connections: subCanvasTemplates['characters-folder'].connections.map(conn => ({
            ...conn,
            id: `${conn.id}-${timestamp}`,
            from: idMap[conn.from] || conn.from,
            to: idMap[conn.to] || conn.to
          }))
        }
        console.log('📦 Template nodes created:', templateData.nodes.length)
        setCanvasData(templateData)
        latestCanvasData.current = templateData

        // Save template immediately
        handleSaveCanvas(templateData.nodes, templateData.connections)
      } else if (currentCanvasId.includes('plot-folder') && subCanvasTemplates['plot-folder']) {
        console.log('✅ Applying Plot Structure & Events folder template')
        const timestamp = Date.now()

        // Create ID mapping for updating references
        const idMap: Record<string, string> = {}
        subCanvasTemplates['plot-folder'].nodes.forEach(node => {
          idMap[node.id] = `${node.id}-${timestamp}`
        })

        templateData = {
          nodes: subCanvasTemplates['plot-folder'].nodes.map(node => ({
            ...node,
            id: idMap[node.id],
            // Update childIds to use new IDs
            ...(node.childIds ? { childIds: node.childIds.map(childId => idMap[childId]) } : {}),
            // Update parentId to use new ID
            ...(node.parentId ? { parentId: idMap[node.parentId] } : {}),
            // Update linkedCanvasId for folder nodes
            ...(node.linkedCanvasId ? { linkedCanvasId: `${node.linkedCanvasId}-${timestamp}` } : {})
          })),
          connections: subCanvasTemplates['plot-folder'].connections.map(conn => ({
            ...conn,
            id: `${conn.id}-${timestamp}`,
            from: idMap[conn.from] || conn.from,
            to: idMap[conn.to] || conn.to
          }))
        }
        console.log('📦 Template nodes created:', templateData.nodes.length)
        setCanvasData(templateData)
        latestCanvasData.current = templateData

        // Save template immediately
        handleSaveCanvas(templateData.nodes, templateData.connections)
      } else if (currentCanvasId.includes('world-folder') && subCanvasTemplates['world-folder']) {
        console.log('✅ Applying World & Settings folder template', currentCanvasId)
        const timestamp = Date.now()

        // Create ID mapping for updating references
        const idMap: Record<string, string> = {}
        subCanvasTemplates['world-folder'].nodes.forEach(node => {
          idMap[node.id] = `${node.id}-${timestamp}`
        })

        templateData = {
          nodes: subCanvasTemplates['world-folder'].nodes.map(node => ({
            ...node,
            id: idMap[node.id],
            // Update childIds to use new IDs
            ...(node.childIds ? { childIds: node.childIds.map(childId => idMap[childId]) } : {}),
            // Update parentId to use new ID
            ...(node.parentId ? { parentId: idMap[node.parentId] } : {}),
            // Update linkedCanvasId for folder nodes
            ...(node.linkedCanvasId ? { linkedCanvasId: `${node.linkedCanvasId}-${timestamp}` } : {})
          })),
          connections: subCanvasTemplates['world-folder'].connections.map(conn => ({
            ...conn,
            id: `${conn.id}-${timestamp}`,
            from: idMap[conn.from] || conn.from,
            to: idMap[conn.to] || conn.to
          }))
        }
        console.log('📦 Template nodes created:', templateData.nodes.length)
        setCanvasData(templateData)
        latestCanvasData.current = templateData

        // Save template immediately
        handleSaveCanvas(templateData.nodes, templateData.connections)
      } else if (currentCanvasId.includes('timeline-folder') && subCanvasTemplates['folder-canvas-timeline-folder']) {
        console.log('✅ Applying Timeline folder template')
        const timestamp = Date.now()

        // Create ID mapping for updating references
        const idMap: Record<string, string> = {}
        subCanvasTemplates['folder-canvas-timeline-folder'].nodes.forEach(node => {
          idMap[node.id] = `${node.id}-${timestamp}`
        })

        templateData = {
          nodes: subCanvasTemplates['folder-canvas-timeline-folder'].nodes.map(node => ({
            ...node,
            id: idMap[node.id],
            // Update childIds to use new IDs
            ...(node.childIds ? { childIds: node.childIds.map(childId => idMap[childId]) } : {}),
            // Update parentId to use new ID
            ...(node.parentId ? { parentId: idMap[node.parentId] } : {})
          })),
          connections: subCanvasTemplates['folder-canvas-timeline-folder'].connections.map(conn => ({
            ...conn,
            id: `${conn.id}-${timestamp}`,
            from: idMap[conn.from] || conn.from,
            to: idMap[conn.to] || conn.to
          }))
        }
        console.log('📦 Timeline template nodes created:', templateData.nodes.length)
        setCanvasData(templateData)
        latestCanvasData.current = templateData

        // Save template immediately
        handleSaveCanvas(templateData.nodes, templateData.connections)
      } else if (currentCanvasId.includes('country-') && subCanvasTemplates['country']) {
        console.log('✅ Applying Country template')
        const timestamp = Date.now()

        // Create ID mapping for updating references
        const idMap: Record<string, string> = {}
        subCanvasTemplates['country'].nodes.forEach(node => {
          idMap[node.id] = `${node.id}-${timestamp}`
        })

        templateData = {
          nodes: subCanvasTemplates['country'].nodes.map(node => ({
            ...node,
            id: idMap[node.id],
            // Update childIds to use new IDs
            ...(node.childIds ? { childIds: node.childIds.map(childId => idMap[childId]) } : {}),
            // Update parentId to use new ID
            ...(node.parentId ? { parentId: idMap[node.parentId] } : {})
          })),
          connections: subCanvasTemplates['country'].connections.map(conn => ({
            ...conn,
            id: `${conn.id}-${timestamp}`,
            from: idMap[conn.from] || conn.from,
            to: idMap[conn.to] || conn.to
          }))
        }
        console.log('📦 Template nodes created:', templateData.nodes.length)
        setCanvasData(templateData)
        latestCanvasData.current = templateData

        // Save template immediately
        handleSaveCanvas(templateData.nodes, templateData.connections)
      } else if (currentCanvasId.startsWith('folder-canvas-')) {
        console.log('Creating empty folder canvas (no template match)')
        const emptyData = { nodes: [], connections: [] }
        setCanvasData(emptyData)
        latestCanvasData.current = emptyData
      } else {
        // For main canvas only, check for other sub-canvas templates
        console.log('Checking for other templates...')

        if (currentCanvasId.includes('character-') && subCanvasTemplates.character) {
          console.log('Applying character sub-canvas template')
          const timestamp = Date.now()

          // Create ID mapping for updating references
          const idMap: Record<string, string> = {}
          subCanvasTemplates.character.nodes.forEach(node => {
            idMap[node.id] = `${node.id}-${timestamp}`
          })

          templateData = {
            nodes: subCanvasTemplates.character.nodes.map(node => ({
              ...node,
              id: idMap[node.id],
              ...(node.childIds ? { childIds: node.childIds.map(childId => idMap[childId]) } : {}),
              ...(node.parentId ? { parentId: idMap[node.parentId] } : {})
            })),
            connections: subCanvasTemplates.character.connections.map(conn => ({
              ...conn,
              id: `${conn.id}-${timestamp}`,
              from: idMap[conn.from] || conn.from,
              to: idMap[conn.to] || conn.to
            }))
          }
        } else if (currentCanvasId.includes('location-') && subCanvasTemplates.location) {
          console.log('Applying location sub-canvas template')
          templateData = {
            nodes: subCanvasTemplates.location.nodes.map(node => ({
              ...node,
              id: `${node.id}-${Date.now()}`
            })),
            connections: subCanvasTemplates.location.connections.map(conn => ({
              ...conn,
              id: `${conn.id}-${Date.now()}`,
              from: `${conn.from}-${Date.now()}`,
              to: `${conn.to}-${Date.now()}`
            }))
          }
        } else if (currentCanvasId.includes('event-canvas-') && subCanvasTemplates.event) {
          console.log('Applying event sub-canvas template')
          const timestamp = Date.now()

          // Create ID mapping for updating references
          const idMap: Record<string, string> = {}
          subCanvasTemplates.event.nodes.forEach(node => {
            idMap[node.id] = `${node.id}-${timestamp}`
          })

          templateData = {
            nodes: subCanvasTemplates.event.nodes.map(node => ({
              ...node,
              id: idMap[node.id],
              ...(node.childIds ? { childIds: node.childIds.map(childId => idMap[childId]) } : {}),
              ...(node.parentId ? { parentId: idMap[node.parentId] } : {})
            })),
            connections: subCanvasTemplates.event.connections.map(conn => ({
              ...conn,
              id: `${conn.id}-${timestamp}`,
              from: idMap[conn.from] || conn.from,
              to: idMap[conn.to] || conn.to
            }))
          }
        }

        console.log('Initializing canvas with template data:', templateData)
        setCanvasData(templateData)
        latestCanvasData.current = templateData

        // If we applied a template, save it immediately so it persists
        if (templateData.nodes.length > 0) {
          handleSaveCanvas(templateData.nodes, templateData.connections)
        }
      }
    }

    setIsLoadingCanvas(false)
  }, [canvasDataFromQuery, isCanvasLoading, currentCanvasId])

  const handleSaveCanvas = useCallback(async (nodes: any[], connections: any[] = []) => {
    const saveToCanvasId = currentCanvasIdRef.current

    // Update the ref with latest data
    latestCanvasData.current = { nodes, connections }

    if (!user?.id) {
      console.warn('No user found, skipping save')
      return
    }

    // Use mutateAsync to actually wait for save to complete before navigation
    await saveCanvasMutation.mutateAsync({
      storyId: resolvedParams.id,
      canvasType: saveToCanvasId,
      nodes,
      connections
    })
  }, [resolvedParams.id, user?.id, saveCanvasMutation])

  // Save function that can be called synchronously for browser navigation
  const saveBeforeUnload = useCallback(async () => {
    // Prevent concurrent saves
    if (isSaving.current) return
    if (!hasUnsavedChanges.current) return
    if (!user?.id) return

    isSaving.current = true

    try {
      const { nodes, connections } = latestCanvasData.current
      if (nodes.length > 0 || connections.length > 0) {
        console.log('💾 Browser navigation save triggered:', currentCanvasIdRef.current)
        await handleSaveCanvas(nodes, connections)
        hasUnsavedChanges.current = false
        console.log('✅ Browser navigation save completed')
      }
    } catch (error) {
      console.error('❌ Browser navigation save failed:', error)
    } finally {
      isSaving.current = false
    }
  }, [user?.id, handleSaveCanvas])

  // Handle browser back/forward/refresh/close
  useEffect(() => {
    // Save when page is about to unload (refresh, close, navigate away)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't interfere with internal navigation (home button, etc.)
      if (isInternalNavigation.current) {
        return
      }

      if (hasUnsavedChanges.current && !isSaving.current) {
        // Trigger save
        saveBeforeUnload()

        // Show browser warning for unsaved changes
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    // Save when tab becomes hidden (tab switch, minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveBeforeUnload()
      }
    }

    // Handle browser back/forward button (Milanote's "2 clicks" trick)
    const handlePopState = (e: PopStateEvent) => {
      // Don't interfere with internal navigation (home button, etc.)
      if (isInternalNavigation.current) {
        isInternalNavigation.current = false
        return
      }

      // If we have unsaved changes, save them first
      if (hasUnsavedChanges.current) {
        e.preventDefault()

        // Save the data
        saveBeforeUnload().then(() => {
          // After save completes, allow navigation
          console.log('✅ Saved before browser navigation')
        })

        // Push the state back so user needs to click back again
        window.history.pushState({ bibliarch: true }, '', window.location.href)
      }
    }

    // Push initial state to catch first back button click
    window.history.pushState({ bibliarch: true }, '', window.location.href)

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('popstate', handlePopState)

    return () => {
      // Cleanup
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [saveBeforeUnload])

  async function handleSaveCanvasSettings() {
    if (!editedTitle.trim()) {
      alert('Project name cannot be empty')
      return
    }

    updateStoryMutation.mutate(
      {
        storyId: resolvedParams.id,
        title: editedTitle.trim(),
        bio: editedBio.trim()
      },
      {
        onSuccess: () => {
          setShowCanvasSettings(false)
        },
        onError: (error: any) => {
          console.error('Error saving canvas settings:', error)
          if (error.message?.includes('column') && error.message?.includes('bio')) {
            alert('The bio field needs to be added to your database. Please add a "bio" column (type: text) to the "stories" table in Supabase.')
          } else {
            alert(`Failed to save settings: ${error.message || 'Unknown error'}`)
          }
        }
      }
    )
  }


  // Navigate to nested canvas (max 3 levels)
  async function handleNavigateToCanvas(canvasId: string, nodeTitle: string) {
    if (canvasPath.length >= 3) {
      return
    }

    // Check if already at this canvas (prevent duplicates)
    if (currentCanvasId === canvasId) {
      return
    }

    // SAVE CURRENT CANVAS FIRST! Use the latest data from the ref
    if (latestCanvasData.current.nodes.length > 0 || latestCanvasData.current.connections.length > 0) {
      await handleSaveCanvas(latestCanvasData.current.nodes, latestCanvasData.current.connections)
      hasUnsavedChanges.current = false // Reset flag after successful save
      console.log('Saved canvas before navigation:', currentCanvasId, latestCanvasData.current)
    }

    // Add to path for breadcrumbs (only if not already in path)
    const alreadyInPath = canvasPath.some(item => item.id === canvasId)
    const newPath = alreadyInPath ? canvasPath : [...canvasPath, { id: canvasId, title: nodeTitle }]
    setCanvasPath(newPath)

    // Update canvas ID IMMEDIATELY (no clearing, no delays)
    setCurrentCanvasId(canvasId)
  }


  // Navigate back
  async function handleNavigateBack() {
    if (canvasPath.length === 0) return

    // SAVE CURRENT CANVAS FIRST!
    if (latestCanvasData.current.nodes.length > 0 || latestCanvasData.current.connections.length > 0) {
      await handleSaveCanvas(latestCanvasData.current.nodes, latestCanvasData.current.connections)
      hasUnsavedChanges.current = false // Reset flag after successful save
      console.log('Saved canvas before navigating back:', currentCanvasId, latestCanvasData.current)
    }

    const newPath = [...canvasPath]
    newPath.pop() // Remove current location from path
    setCanvasPath(newPath)

    // Navigate to the previous location (last item in the new path, or main if empty)
    const previousLocation = newPath.length > 0 ? newPath[newPath.length - 1] : null
    setCurrentCanvasId(previousLocation?.id || 'main')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-sky-600 dark:text-blue-400 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your story...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header - Always visible */}
      <header className="border-b border-gray-600 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 md:px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Logo Icon - Desktop only */}
            <Sparkles className="hidden md:block w-6 h-6 text-sky-600 dark:text-blue-400" />

            {/* Mobile Navigation - Icon only */}
            <div className="flex md:hidden items-center gap-1">
              {/* Home button */}
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={async (e) => {
                    e.preventDefault()
                    // Mark as internal navigation to prevent popstate and beforeunload interference
                    isInternalNavigation.current = true
                    hasUnsavedChanges.current = false // Clear unsaved changes flag
                    // Save current canvas before navigating to dashboard
                    if (latestCanvasData.current.nodes.length > 0 || latestCanvasData.current.connections.length > 0) {
                      await handleSaveCanvas(latestCanvasData.current.nodes, latestCanvasData.current.connections)
                    }
                    // Use window.location for guaranteed navigation
                    window.location.href = '/dashboard'
                  }}
                >
                  <HomeIcon className="w-4 h-4" />
                </Button>
              </Link>

              {/* Back button - only show if in a folder */}
              {canvasPath.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={async () => {
                    // Save current canvas
                    if (latestCanvasData.current.nodes.length > 0 || latestCanvasData.current.connections.length > 0) {
                      await handleSaveCanvas(latestCanvasData.current.nodes, latestCanvasData.current.connections)
                    }

                    const newPath = [...canvasPath]
                    newPath.pop()
                    setCanvasPath(newPath)

                    const previousLocation = newPath.length > 0 ? newPath[newPath.length - 1] : null
                    if (!previousLocation) {
                      colorContext.setCurrentFolderId(null)
                    }
                    setCurrentCanvasId(previousLocation?.id || 'main')
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}

              {/* Zoom controls - Mobile only */}
              <div className="flex items-center gap-0.5 ml-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                  title="Zoom out"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setZoom(1)}
                  title="Reset zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  title="Zoom in"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Desktop Breadcrumb navigation */}
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              {/* Dashboard link */}
              <button
                onClick={async (e) => {
                  e.preventDefault()
                  // Mark as internal navigation to prevent popstate and beforeunload interference
                  isInternalNavigation.current = true
                  hasUnsavedChanges.current = false // Clear unsaved changes flag
                  // Save current canvas before navigating to dashboard
                  if (latestCanvasData.current.nodes.length > 0 || latestCanvasData.current.connections.length > 0) {
                    await handleSaveCanvas(latestCanvasData.current.nodes, latestCanvasData.current.connections)
                  }
                  // Use window.location for guaranteed navigation
                  window.location.href = '/dashboard'
                }}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Home
              </button>

              <ChevronRight className="w-4 h-4" />

              {/* Story title - clickable to go to main canvas */}
              <button
                onClick={async () => {
                  if (canvasPath.length === 0) return // Already on main canvas

                  // Save current canvas
                  if (latestCanvasData.current.nodes.length > 0 || latestCanvasData.current.connections.length > 0) {
                    await handleSaveCanvas(latestCanvasData.current.nodes, latestCanvasData.current.connections)
                  }
                  // Reset folder context and navigate to main
                  colorContext.setCurrentFolderId(null)
                  setCanvasPath([])
                  setCurrentCanvasId('main')
                }}
                className={`transition-colors ${
                  canvasPath.length === 0
                    ? "text-foreground font-medium cursor-default"
                    : "hover:text-foreground cursor-pointer"
                }`}
              >
                {story?.title || 'Loading...'}
              </button>

              {/* Folder path */}
              {canvasPath.map((pathItem, index) => (
                <React.Fragment key={`breadcrumb-${index}-${pathItem.id}`}>
                  <ChevronRight className="w-4 h-4" />
                  <button
                    onClick={async () => {
                      if (index === canvasPath.length - 1) return // Already at this location

                      // Save current canvas
                      if (latestCanvasData.current.nodes.length > 0 || latestCanvasData.current.connections.length > 0) {
                        await handleSaveCanvas(latestCanvasData.current.nodes, latestCanvasData.current.connections)
                      }

                      // Navigate to clicked path level
                      const newPath = canvasPath.slice(0, index + 1)

                      // Extract folder ID from the canvas ID (remove prefixes like 'folder-canvas-')
                      const folderId = pathItem.id.replace(/^(folder-canvas-|character-canvas-|location-canvas-)/, '')
                      colorContext.setCurrentFolderId(folderId)

                      setCanvasPath(newPath)
                      setCurrentCanvasId(pathItem.id)
                    }}
                    className={`transition-colors ${
                      index === canvasPath.length - 1
                        ? "text-foreground font-medium cursor-default"
                        : "hover:text-foreground cursor-pointer"
                    }`}
                  >
                    {pathItem.title}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <FeedbackButton />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCanvasSettings(true)}
              title="Canvas Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <Bibliarch
          key={currentCanvasId}
          storyId={resolvedParams.id}
          currentCanvasId={currentCanvasId}
          initialNodes={canvasData?.nodes || []}
          initialConnections={canvasData?.connections || []}
          onSave={handleSaveCanvas}
          onNavigateToCanvas={handleNavigateToCanvas}
          onStateChange={(nodes, connections) => {
            // Update ref when state changes (for navigation saves, without triggering saves)
            latestCanvasData.current = { nodes, connections }
            // Mark as having unsaved changes
            hasUnsavedChanges.current = true
          }}
          canvasWidth={3000}
          canvasHeight={2000}
          zoom={zoom}
          onZoomChange={setZoom}
        />

        {/* Loading overlay when switching canvases */}
        {isLoadingCanvas && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-sky-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading canvas...</p>
            </div>
          </div>
        )}
      </div>

      {/* Canvas Settings Dialog */}
      <Dialog open={showCanvasSettings} onOpenChange={setShowCanvasSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Canvas Settings</DialogTitle>
            <DialogDescription>
              Update your project name and description
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium">
                Project Name
              </label>
              <Input
                id="project-name"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Enter project name"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="project-bio" className="text-sm font-medium">
                  Project Description
                </label>
                <span className="text-xs text-muted-foreground">
                  {editedBio.length}/150
                </span>
              </div>
              <Textarea
                id="project-bio"
                value={editedBio}
                onChange={(e) => {
                  if (e.target.value.length <= 150) {
                    setEditedBio(e.target.value)
                  }
                }}
                placeholder="Describe your story project..."
                rows={5}
                maxLength={150}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditedTitle(story.title)
                setEditedBio(story.bio || '')
                setShowCanvasSettings(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCanvasSettings}
              className="bg-gradient-to-r from-sky-500 to-blue-600 dark:from-blue-500 dark:to-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}