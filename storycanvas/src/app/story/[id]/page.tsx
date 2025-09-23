'use client'

import React, { useEffect, useState, use, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Edit2, Check, X, Sparkles, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { storyTemplates, subCanvasTemplates } from '@/lib/templates'

// Use the HTML canvas instead to avoid Jest worker issues completely
const StoryCanvas = dynamic(
  () => import('@/components/canvas/HTMLCanvas'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-purple-600 animate-pulse mx-auto mb-4" />
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
  const [story, setStory] = useState<any>(null)
  const [canvasData, setCanvasData] = useState<any>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentCanvasId, setCurrentCanvasId] = useState('main')
  const [canvasPath, setCanvasPath] = useState<{id: string, title: string}[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Store the latest canvas state from StoryCanvas component
  const latestCanvasData = useRef<{ nodes: any[], connections: any[] }>({ nodes: [], connections: [] })

  // Apply canvas-page class to body to prevent scrolling
  useEffect(() => {
    document.body.classList.add('canvas-page')
    return () => {
      document.body.classList.remove('canvas-page')
    }
  }, [])
  
  // Check if this is a new story with a template
  const isNewStory = searchParams.get('isNew') === 'true'
  const templateId = searchParams.get('template')

  useEffect(() => {
    // CRITICAL: Clear canvas data when changing canvases to prevent data mixing
    setCanvasData({ nodes: [], connections: [] })
    latestCanvasData.current = { nodes: [], connections: [] }

    loadStory()
  }, [resolvedParams.id, currentCanvasId])

  async function loadStory() {
    console.log('loadStory called:', {
      storyId: resolvedParams.id,
      currentCanvasId,
      isNewStory,
      templateId
    })
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error:', authError)
        toast.error(`Authentication error: ${authError.message}`)
        router.push('/login')
        return
      }
      
      if (!user) {
        console.log('No user found, redirecting to login')
        router.push('/login')
        return
      }

      console.log('User authenticated:', user.id)

      // Load story details
      console.log('Loading story from database...', {
        storyId: resolvedParams.id,
        userId: user.id
      })
      
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()

      console.log('Story query result:', {
        data: storyData,
        error: storyError,
        errorCode: storyError?.code,
        errorMessage: storyError?.message
      })

      if (storyError) {
        console.error('Story loading error:', storyError)
        
        if (storyError.code === 'PGRST116') {
          toast.error('Story not found or access denied')
        } else if (storyError.message?.includes('relation') || storyError.message?.includes('does not exist')) {
          toast.error('Database tables not set up. Please run the setup script.')
        } else {
          toast.error(`Database error: ${storyError.message}`)
        }
        
        router.push('/dashboard')
        return
      }

      if (!storyData) {
        console.error('No story data returned')
        toast.error('Story not found')
        router.push('/dashboard')
        return
      }

      console.log('Story loaded successfully:', storyData)

      setStory(storyData)
      setEditedTitle((storyData as any)?.title || '')

    // For new stories with templates, show a welcome message
    if (isNewStory && templateId && currentCanvasId === 'main') {
      const template = storyTemplates.find(t => t.id === templateId)
      if (template) {
        // Show a welcome message
        toast.success(`${template.name} template loaded!`, {
          description: 'Start building your story by editing the nodes',
          duration: 4000,
          icon: '✨'
        })
        
        // Clear the URL params after loading
        router.replace(`/story/${resolvedParams.id}`)
        // Don't return - continue to load from database
      }
    }

    // Load canvas data for current canvas
    // Use canvas_type for navigation (main canvas or folder-specific canvases)
    console.log('Loading canvas from database:', {
      story_id: resolvedParams.id,
      canvas_type: currentCanvasId
    })
    
    const { data: canvas, error: canvasError } = await supabase
      .from('canvas_data')
      .select('*')
      .eq('story_id', resolvedParams.id)
      .eq('canvas_type', currentCanvasId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    // PGRST116 means no rows found, which is normal for new canvases
    if (canvasError && canvasError.code !== 'PGRST116') {
      console.error('Error loading canvas:', canvasError.message || canvasError)
      console.error('Full error:', JSON.stringify(canvasError))
    }

    if (canvas) {
      console.log('Canvas loaded:', {
        id: (canvas as any)?.id,
        canvas_type: (canvas as any)?.canvas_type,
        nodeCount: (canvas as any)?.nodes?.length,
        nodes: (canvas as any)?.nodes
      })
      const loadedData = {
        nodes: (canvas as any)?.nodes || [],
        connections: (canvas as any)?.connections || []
      }

      // CRITICAL: Only apply template if canvas exists but is EMPTY
      if (loadedData.nodes.length === 0 && currentCanvasId.includes('characters-folder') && subCanvasTemplates['characters-folder']) {
        console.log('✅ Applying Characters & Relationships folder template to empty canvas')
        const timestamp = Date.now()

        // Create ID mapping for updating references
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

        // Save template immediately
        setTimeout(() => {
          handleSaveCanvas(templateData.nodes, templateData.connections)
        }, 1000)
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
        setTimeout(() => {
          handleSaveCanvas(templateData.nodes, templateData.connections)
        }, 1000)
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
          templateData = {
            nodes: subCanvasTemplates.character.nodes.map(node => ({
              ...node,
              id: `${node.id}-${Date.now()}`
            })),
            connections: subCanvasTemplates.character.connections.map(conn => ({
              ...conn,
              id: `${conn.id}-${Date.now()}`,
              from: `${conn.from}-${Date.now()}`,
              to: `${conn.to}-${Date.now()}`
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
        }

        console.log('Initializing canvas with template data:', templateData)
        setCanvasData(templateData)
        latestCanvasData.current = templateData

        // If we applied a template, save it immediately so it persists
        if (templateData.nodes.length > 0) {
          setTimeout(() => {
            handleSaveCanvas(templateData.nodes, templateData.connections)
          }, 1000) // Save after component loads
        }
      }
    }

    setIsLoading(false)
    } catch (error) {
      console.error('Unexpected error in loadStory:', error)
      toast.error(`Unexpected error: ${error}`)
      setIsLoading(false)
    }
  }

  async function handleSaveCanvas(nodes: any[], connections: any[] = []) {
    console.log('handleSaveCanvas called:', {
      storyId: resolvedParams.id,
      canvasId: currentCanvasId,
      nodeCount: nodes.length,
      connectionCount: connections.length,
      nodes
    })
    
    // Update the ref with latest data
    latestCanvasData.current = { nodes, connections }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('No user, cannot save')
      return
    }

    const canvasPayload = {
      story_id: resolvedParams.id,
      nodes: nodes,
      connections: connections,
      canvas_type: currentCanvasId // This will be 'main' or the folder's linkedCanvasId
    }

    // Check if canvas data exists
    const { data: existing, error: checkError } = await supabase
      .from('canvas_data')
      .select('id')
      .eq('story_id', resolvedParams.id)
      .eq('canvas_type', currentCanvasId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing canvas:', checkError)
    }

    if (existing) {
      // Update existing
      console.log('Updating existing canvas:', (existing as any)?.id)
      const { error: updateError } = await supabase
        .from('canvas_data')
        .update({
          nodes: nodes,
          connections: connections,
          updated_at: new Date().toISOString()
        })
        .eq('id', (existing as any)?.id)
      
      if (updateError) {
        console.error('Error updating canvas:', updateError)
      } else {
        console.log('Canvas updated successfully')
      }
    } else {
      // Create new - this happens when first entering a folder
      console.log('Creating new canvas record')
      const { error: insertError } = await supabase
        .from('canvas_data')
        .insert(canvasPayload)
      
      if (insertError) {
        console.error('Error inserting canvas:', insertError)
      } else {
        console.log('Canvas created successfully')
      }
    }

    // Update story's updated_at
    await supabase
      .from('stories')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', resolvedParams.id)

    // No toast for auto-save - too spammy
  }

  async function handleUpdateTitle() {
    if (!editedTitle.trim() || editedTitle === story.title) {
      setIsEditingTitle(false)
      return
    }

    const { error } = await supabase
      .from('stories')
      .update({ 
        title: editedTitle.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)

    if (!error) {
      setStory({ ...story, title: editedTitle.trim() })
      toast.success('Title updated')
    }
    setIsEditingTitle(false)
  }

  // Navigate to nested canvas (max 3 levels)
  async function handleNavigateToCanvas(canvasId: string, nodeTitle: string) {
    if (canvasPath.length >= 3) {
      toast.error('Maximum nesting level reached (3 levels)')
      return
    }
    
    // SAVE CURRENT CANVAS FIRST! Use the latest data from the ref
    if (latestCanvasData.current.nodes.length > 0 || latestCanvasData.current.connections.length > 0) {
      await handleSaveCanvas(latestCanvasData.current.nodes, latestCanvasData.current.connections)
      console.log('Saved canvas before navigation:', currentCanvasId, latestCanvasData.current)
    }
    
    // VISUAL FEEDBACK - User sees something is happening!
    setIsLoading(true)
    
    // Add fade-out effect to the entire canvas
    const canvasContainer = document.querySelector('.konvajs-content')
    if (canvasContainer) {
      (canvasContainer as HTMLElement).style.transition = 'opacity 0.2s ease-out'
      ;(canvasContainer as HTMLElement).style.opacity = '0'
    }
    
    // Clear the canvas after animation
    setTimeout(() => {
      // Reset canvas opacity for when new content loads
      if (canvasContainer) {
        (canvasContainer as HTMLElement).style.opacity = '1'
      }
      
      // Add to path: just append where we're going (not where we came from)
      const newPath = [...canvasPath, { id: canvasId, title: nodeTitle }]
      setCanvasPath(newPath)

      // CRITICAL: Clear canvas data before changing ID to prevent contamination
      // This ensures the old canvas nodes don't get auto-saved to the new canvas
      setCanvasData({ nodes: [], connections: [] })
      latestCanvasData.current = { nodes: [], connections: [] }

      // Update to the new canvas ID (the linkedCanvasId from the folder node)
      setCurrentCanvasId(canvasId)
      
      // Show feedback with animation
      toast.success(`Entering: ${nodeTitle}`, {
        icon: '📂',
        duration: 2000,
        style: {
          background: '#10b981',
          color: 'white'
        }
      })
      
      // Force reload to get new canvas data
      setTimeout(() => {
        loadStory()
      }, 100) // Small delay for visual transition
    }, 200)
  }

  // Navigate to a specific breadcrumb level
  async function navigateToLevel(targetLevel: number) {
    // If clicking on current level, do nothing
    if (targetLevel === canvasPath.length) return
    
    // SAVE CURRENT CANVAS FIRST!
    if (canvasData && (canvasData.nodes?.length > 0 || canvasData.connections?.length > 0)) {
      await handleSaveCanvas(canvasData.nodes, canvasData.connections)
      console.log('Saved canvas before breadcrumb navigation:', currentCanvasId, canvasData)
    }
    
    // Visual feedback
    setIsLoading(true)
    
    // Add fade-out effect to the entire canvas
    const canvasContainer = document.querySelector('.konvajs-content')
    if (canvasContainer) {
      (canvasContainer as HTMLElement).style.transition = 'opacity 0.2s ease-out'
      ;(canvasContainer as HTMLElement).style.opacity = '0'
    }
    
    setTimeout(() => {
      // Reset canvas opacity for when new content loads
      if (canvasContainer) {
        (canvasContainer as HTMLElement).style.opacity = '1'
      }
      if (targetLevel === 0) {
        // Navigate to main canvas
        setCanvasPath([])
        setCurrentCanvasId('main')
        // Don't clear data here - let loadStory handle it
        toast.success('Returning to Main Canvas', {
          icon: '🏠',
          duration: 2000,
          style: {
            background: '#3b82f6',
            color: 'white'
          }
        })
      } else {
        // Navigate to a specific level
        const newPath = canvasPath.slice(0, targetLevel)
        const targetCanvas = canvasPath[targetLevel - 1]
        setCanvasPath(newPath)
        setCurrentCanvasId(targetCanvas.id)
        // Don't clear data here - let loadStory handle it
        toast.success(`Returning to: ${targetCanvas.title}`, {
          icon: '📁',
          duration: 2000,
          style: {
            background: '#3b82f6',
            color: 'white'
          }
        })
      }
      
      // Force reload with animation
      setTimeout(() => {
        loadStory()
      }, 100)
    }, 200)
  }

  // Navigate back
  async function handleNavigateBack() {
    if (canvasPath.length === 0) return

    // SAVE CURRENT CANVAS FIRST!
    if (canvasData && (canvasData.nodes?.length > 0 || canvasData.connections?.length > 0)) {
      await handleSaveCanvas(canvasData.nodes, canvasData.connections)
      console.log('Saved canvas before navigating back:', currentCanvasId, canvasData)
    }

    // Visual feedback first
    setIsLoading(true)

    // Add fade-out effect to the entire canvas
    const canvasContainer = document.querySelector('.konvajs-content')
    if (canvasContainer) {
      (canvasContainer as HTMLElement).style.transition = 'opacity 0.2s ease-out'
      ;(canvasContainer as HTMLElement).style.opacity = '0'
    }

    setTimeout(() => {
      // Reset canvas opacity for when new content loads
      if (canvasContainer) {
        (canvasContainer as HTMLElement).style.opacity = '1'
      }

      const newPath = [...canvasPath]
      const currentLocation = newPath.pop() // Remove current location from path
      setCanvasPath(newPath)

      // Navigate to the previous location (last item in the new path, or main if empty)
      const previousLocation = newPath.length > 0 ? newPath[newPath.length - 1] : null
      setCurrentCanvasId(previousLocation?.id || 'main')

      // Don't clear data here - let loadStory handle it

      toast.success(`Returning to: ${previousLocation?.title || 'Main Canvas'}`, {
        icon: '↩️',
        duration: 2000,
        style: {
          background: '#3b82f6',
          color: 'white'
        }
      })

      // Force reload with animation
      setTimeout(() => {
        loadStory()
      }, 100)
    }, 200)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your story...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-900 px-4 py-3">
        {/* Breadcrumb navigation */}
        {canvasPath.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleNavigateBack}
              className="h-6 px-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Back
            </Button>
            <ChevronRight className="w-4 h-4" />
            {/* Main canvas - clickable to go back to root */}
            <button
              onClick={() => navigateToLevel(0)}
              className="font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:underline cursor-pointer transition-colors"
            >
              {story.title}
            </button>
            {/* Show intermediate breadcrumb levels (all except last which is current) */}
            {canvasPath.slice(0, -1).map((item, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-4 h-4" />
                <button
                  onClick={() => navigateToLevel(index + 1)}
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:underline cursor-pointer transition-colors"
                >
                  {item.title}
                </button>
              </React.Fragment>
            ))}
            {/* Show current location (last item in path) */}
            {currentCanvasId !== 'main' && canvasPath.length > 0 && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                  {canvasPath[canvasPath.length - 1]?.title}
                </span>
              </>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {canvasPath.length === 0 && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            )}
            
            {/* Editable title - only on main canvas */}
            {currentCanvasId === 'main' && isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateTitle()
                  if (e.key === 'Escape') {
                    setEditedTitle(story.title)
                    setIsEditingTitle(false)
                  }
                }}
              />
              <Button size="sm" variant="ghost" onClick={handleUpdateTitle}>
                <Check className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setEditedTitle(story.title)
                  setIsEditingTitle(false)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : currentCanvasId === 'main' ? (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors"
            >
              <h1 className="text-lg font-semibold">{story.title}</h1>
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
          ) : (
            <h1 className="text-lg font-semibold px-2 py-1">
              {canvasPath[canvasPath.length - 1]?.title || 'Section'}
            </h1>
          )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Auto-save enabled
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <StoryCanvas
          storyId={resolvedParams.id}
          initialNodes={canvasData?.nodes || []}
          initialConnections={canvasData?.connections || []}
          onSave={handleSaveCanvas}
          onNavigateToCanvas={handleNavigateToCanvas}
        />
      </div>
    </div>
  )
}