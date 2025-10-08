'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Minus, MousePointer, Hand, Type, Folder, User, MapPin, Calendar, Undo, Redo, X, List, Move, Image as ImageIcon, ArrowUp, ArrowDown, Table, Heart, Settings, TextCursor } from 'lucide-react'
import { toast } from 'sonner'
import { PaletteSelector } from '@/components/ui/palette-selector'
import { ColorFilter } from '@/components/ui/color-filter'
import { NodeStylePanel } from '@/components/ui/node-style-panel'
import { PerformanceOptimizer } from '@/lib/performance-utils'
import { useColorContext } from '@/components/providers/color-provider'
import { NodeContextMenu } from './NodeContextMenu'

interface Node {
  id: string
  x: number
  y: number
  text: string
  content?: string
  width: number
  height: number
  type?: 'text' | 'character' | 'event' | 'location' | 'folder' | 'list' | 'image' | 'table' | 'relationship-canvas'
  color?: string
  linkedCanvasId?: string
  imageUrl?: string
  profileImageUrl?: string // For character nodes profile pictures
  attributes?: any
  tableData?: { col1: string; col2: string; col3: string }[] // For table nodes
  // Event node properties
  title?: string // Event title (for event nodes)
  summary?: string // Event summary/description (for event nodes)
  durationText?: string // Free form duration text (for event nodes)
  sequenceOrder?: number // Optional sequence ordering (for event nodes)
  // Container properties for list nodes
  parentId?: string // If this node is inside a container
  childIds?: string[] // If this node is a container (for list nodes)
  layoutMode?: 'single-column' | 'two-columns' | 'grid' // Layout for list containers
  // Relationship canvas properties
  relationshipData?: {
    selectedCharacters: Array<{
      id: string
      name: string
      profileImageUrl?: string
      position: { x: number; y: number }
    }>
    relationships: RelationshipConnection[]
  }
  // Layer control
  zIndex?: number // Layer ordering (higher = on top)
  // Node settings
  settings?: {
    // Global settings (all nodes)
    locked?: boolean
    // Image node settings
    show_header?: boolean
    show_caption?: boolean
    image_fit?: 'contain' | 'cover' | 'fill'
    // Character node settings
    show_profile_picture?: boolean
    picture_shape?: 'circle' | 'square' | 'rounded'
    // Event node settings
    show_duration?: boolean
    expand_summary?: boolean
    // Folder node settings
    icon?: 'folder' | 'book' | 'archive' | 'box'
    expand_by_default?: boolean
    // List node settings
    auto_sort?: 'manual' | 'alphabetical' | 'by-type'
    // Table node settings
    show_header_row?: boolean
    alternate_row_colors?: boolean
  }
}

interface Connection {
  id: string
  from: string
  to: string
  type?: 'leads-to' | 'conflicts-with' | 'relates-to' | 'relationship'
}

interface RelationshipConnection {
  id: string
  fromCharacterId: string
  toCharacterId: string
  relationshipType: 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other'
  strength: 1 | 2 | 3  // weak, medium, strong
  label: string        // "married", "siblings", "best friends", etc.
  notes?: string       // additional details
  isBidirectional: boolean  // true for mutual relationships
  // Two-way relationship support
  reverseRelationshipType?: 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other'
  reverseStrength?: 1 | 2 | 3
  reverseLabel?: string
}

interface NodeStylePreferences {
  corners: 'sharp' | 'rounded' | 'very-rounded'
  outlines: 'dark' | 'light' | 'mixed'
  textColor: 'dark' | 'mixed' | 'light'
  textAlign: 'left' | 'center' | 'right'
}

interface HTMLCanvasProps {
  storyId: string
  initialNodes?: Node[]
  initialConnections?: Connection[]
  onSave?: (nodes: Node[], connections: Connection[]) => void
  onNavigateToCanvas?: (canvasId: string, nodeTitle: string) => void
}

// Updated with smaller sidebar and trackpad support
export default function HTMLCanvas({ 
  storyId, 
  initialNodes = [], 
  initialConnections = [], 
  onSave, 
  onNavigateToCanvas 
}: HTMLCanvasProps) {
  const colorContext = useColorContext()
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tool, setTool] = useState<'pan' | 'select' | 'text' | 'character' | 'event' | 'location' | 'folder' | 'list' | 'image' | 'table' | 'connect' | 'relationship-canvas'>('select')
  const [editingField, setEditingField] = useState<{nodeId: string, field: string} | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [showHelp, setShowHelp] = useState(true)
  const [showStylePanel, setShowStylePanel] = useState(false)
  const [visibleNodeIds, setVisibleNodeIds] = useState<string[]>([])
  const [viewportNodes, setViewportNodes] = useState<Node[]>([])
  const [isMoving, setIsMoving] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)

  // Mode tracking: 'moving' (default) or 'typing' (when text is focused)
  const [interactionMode, setInteractionMode] = useState<'moving' | 'typing'>('moving')

  // Node style preferences state
  const [nodeStylePreferences, setNodeStylePreferences] = useState<NodeStylePreferences>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('storycanvas-node-styles')
    return saved ? JSON.parse(saved) : {
      corners: 'rounded',
      outlines: 'mixed',
      textColor: 'mixed',
      textAlign: 'left'
    }
  })
  const [paletteRefresh, setPaletteRefresh] = useState(0) // Force re-render when palette changes
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [isDragReady, setIsDragReady] = useState<string | null>(null)
  const [isResizeReady, setIsResizeReady] = useState<string | null>(null)
  const [resizingNode, setResizingNode] = useState<string | null>(null)
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 })
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [zoomCenter, setZoomCenter] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 })

  // Image cropping state
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean
    nodeId: string
    imageUrl: string
    imageWidth?: number
    imageHeight?: number
  } | null>(null)
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100
  })
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)

  // Relationship canvas modal state
  const [relationshipCanvasModal, setRelationshipCanvasModal] = useState<{
    isOpen: boolean
    nodeId: string
    node: Node
  } | null>(null)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    node: Node
    position: { x: number; y: number }
  } | null>(null)

  // Relationship connection state
  const [isConnectingMode, setIsConnectingMode] = useState(false)
  const [selectedCharacterForConnection, setSelectedCharacterForConnection] = useState<string | null>(null)
  const [isDraggingCharacter, setIsDraggingCharacter] = useState(false)
  const [draggingCharacter, setDraggingCharacter] = useState<string | null>(null)
  const [dragCharacterOffset, setDragCharacterOffset] = useState({ x: 0, y: 0 })
  const [relationshipModal, setRelationshipModal] = useState<{
    isOpen: boolean
    fromCharacter: { id: string, name: string }
    toCharacter: { id: string, name: string }
    editingRelationship?: {
      id: string
      relationshipType: 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other'
      strength: 1 | 2 | 3
      label: string
      notes?: string
      reverseRelationshipType?: 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other'
      reverseStrength?: 1 | 2 | 3
      reverseLabel?: string
    }
  } | null>(null)

  const [isResizingCrop, setIsResizingCrop] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null)
  const [dragStartCrop, setDragStartCrop] = useState({ x: 0, y: 0 })
  const cropImageRef = useRef<HTMLImageElement>(null)

  // Undo/Redo system
  const [history, setHistory] = useState<{ nodes: Node[], connections: Connection[] }[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const maxHistorySize = 50

  // Function to preserve cursor position during content updates
  const preserveCursorPosition = useCallback((element: HTMLElement, newContent: string) => {
    const selection = window.getSelection()
    const range = selection?.getRangeAt(0)
    const offset = range?.startOffset || 0
    const textLength = element.textContent?.length || 0

    // Only update if content is actually different
    if (element.textContent !== newContent) {
      element.textContent = newContent

      // Restore cursor position
      try {
        const newRange = document.createRange()
        const textNode = element.firstChild || element
        const newOffset = Math.min(offset, newContent.length)

        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          newRange.setStart(textNode, newOffset)
          newRange.setEnd(textNode, newOffset)
        } else {
          newRange.selectNodeContents(element)
          newRange.collapse(false)
        }

        selection?.removeAllRanges()
        selection?.addRange(newRange)
      } catch (error) {
        // Fallback: place cursor at end
        const newRange = document.createRange()
        newRange.selectNodeContents(element)
        newRange.collapse(false)
        selection?.removeAllRanges()
        selection?.addRange(newRange)
      }
    }
  }, [])

  // Real-time auto-resize function for content elements
  const autoResizeNode = useCallback((nodeId: string, element: HTMLElement | null, isTitle = false) => {
    try {
      if (!element || !element.isConnected) {
        return
      }

      // Skip auto-resize if user is actively resizing this node manually
      if (resizingNode === nodeId) {
        return
      }

      // Skip auto-resize for image nodes - they maintain their aspect ratio based on the image
      const currentNode = nodes.find(n => n.id === nodeId)
      if (currentNode?.type === 'image') {
        return
      }

      // Force a reflow to get accurate measurements
      // Store the current height before resetting
      const currentHeight = element.style.height
      element.style.height = 'auto'
      const scrollHeight = element.scrollHeight
      // Restore height immediately to prevent visual flash
      element.style.height = currentHeight

      let newHeight
      if (currentNode?.type === 'event') {
        // Special handling for event nodes with their 3-section layout
        if (isTitle) {
          // For event title - get title height and add other sections
          const titleHeight = Math.max(24, scrollHeight)
          const titleSectionHeight = titleHeight + 16 // title + padding
          const summaryMinHeight = 100 // minimum summary area
          const durationSectionHeight = 40 // duration input area
          newHeight = Math.max(280, titleSectionHeight + summaryMinHeight + durationSectionHeight)
        } else {
          // For event summary - calculate based on content size
          const contentHeight = Math.max(64, scrollHeight)
          const titleSectionHeight = 50 // title area with icon
          const durationSectionHeight = 40 // duration input area
          const padding = 20
          newHeight = Math.max(280, titleSectionHeight + contentHeight + durationSectionHeight + padding)
        }
      } else if (isTitle) {
        // For title elements - just add minimal padding
        const titleHeight = Math.max(24, scrollHeight)
        newHeight = Math.max(120, titleHeight + 96) // Title + content area minimum
      } else {
        // For content elements - use scroll height plus header
        const contentHeight = Math.max(64, scrollHeight)
        const headerHeight = 50 // Icon + title area
        const padding = 20
        newHeight = Math.max(140, headerHeight + padding + contentHeight)
      }

      // Update node height (only if difference is significant to prevent flickering)
      setNodes(prevNodes => {
        const currentNode = prevNodes.find(n => n.id === nodeId)
        if (!currentNode || Math.abs(currentNode.height - newHeight) < 5) {
          return prevNodes
        }
        // Don't auto-resize list nodes - they should maintain user-set dimensions
        if (currentNode.type === 'list') {
          return prevNodes
        }

        // For event nodes, enforce absolute minimum dimensions to prevent scaling down below preset size
        if (currentNode.type === 'event') {
          const safeHeight = Math.max(280, newHeight, currentNode.height) // Never go smaller than 280px OR current size
          const safeWidth = Math.max(220, currentNode.width) // Never go smaller than 220px
          return prevNodes.map(n =>
            n.id === nodeId ? { ...n, height: safeHeight, width: safeWidth } : n
          )
        }

        return prevNodes.map(n =>
          n.id === nodeId ? { ...n, height: newHeight } : n
        )
      })
    } catch (error) {
      console.error('Auto-resize error for node', nodeId, ':', error)
    }
  }, [resizingNode])

  // Debounced resize function to prevent conflicts and race conditions
  const debouncedResizeRef = useRef<Record<string, NodeJS.Timeout>>({})
  const debouncedAutoResize = useCallback((nodeId: string, element: HTMLElement | null, isTitle = false, delay = 0) => {
    // Clear any existing timeout for this node
    if (debouncedResizeRef.current[nodeId]) {
      clearTimeout(debouncedResizeRef.current[nodeId])
    }

    // Set new timeout (0 for immediate, but still async to avoid blocking)
    debouncedResizeRef.current[nodeId] = setTimeout(() => {
      autoResizeNode(nodeId, element, isTitle)
      delete debouncedResizeRef.current[nodeId]
    }, delay)
  }, [autoResizeNode])

  // Auto-resize only newly created nodes (not existing ones)
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    if (!hasInitialized && nodes.length > 0) {
      // Initial load - auto-size all nodes once
      const timer = setTimeout(() => {
        nodes.forEach(node => {
          // Skip auto-resize for image, character, and location nodes - they maintain their fixed sizes
          if (node.type === 'image' || node.type === 'character' || node.type === 'location') {
            return
          }

          // Find the content elements for each node
          const titleElement = document.querySelector(`[data-node-id="${node.id}"] [contenteditable]`)
          const contentElement = document.querySelector(`[data-node-id="${node.id}"] [contenteditable]:not(:first-of-type)`)

          if (titleElement && node.text && node.type !== 'list') {
            autoResizeNode(node.id, titleElement as HTMLElement, true)
          }
          if (contentElement && node.content && (node.type === 'text' || !node.type)) {
            autoResizeNode(node.id, contentElement as HTMLElement, false)
          }
        })
        setHasInitialized(true)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [nodes.length, autoResizeNode, hasInitialized]) // Only on initial load

  // Set canvas dot color using same transformation as child node borders
  useEffect(() => {
    const currentPalette = colorContext.getCurrentPalette()
    let canvasBackgroundColor = '#e0f2fe' // fallback

    if (currentPalette && currentPalette.colors && currentPalette.colors.canvasBackground) {
      canvasBackgroundColor = currentPalette.colors.canvasBackground
    } else {
      const paletteCanvasBg = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-canvas-background')
        .trim()
      if (paletteCanvasBg && paletteCanvasBg !== '#ffffff' && paletteCanvasBg !== 'white' && paletteCanvasBg !== '') {
        canvasBackgroundColor = paletteCanvasBg
      }
    }

    // Apply transformation: darken by 30%, fully saturated
    const dotColor = darkenColor(canvasBackgroundColor, 0.3)
    document.documentElement.style.setProperty('--canvas-dot-color', dotColor)
  }, [colorContext])

  // Handle crop dragging and resizing with global mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cropModal?.imageWidth && cropModal?.imageHeight && cropImageRef.current) {
        e.preventDefault()
        const img = cropImageRef.current
        const rect = img.getBoundingClientRect()
        const scaleX = cropModal.imageWidth / rect.width
        const scaleY = cropModal.imageHeight / rect.height

        if (isDraggingCrop) {
          // Calculate new position relative to image
          const newX = Math.max(0, Math.min(
            cropModal.imageWidth - cropData.width,
            (e.clientX - rect.left - dragStartCrop.x) * scaleX
          ))
          const newY = Math.max(0, Math.min(
            cropModal.imageHeight - cropData.height,
            (e.clientY - rect.top - dragStartCrop.y) * scaleY
          ))

          setCropData(prev => ({ ...prev, x: newX, y: newY }))
        } else if (isResizingCrop && resizeDirection) {
          // Calculate mouse position relative to image
          const mouseX = (e.clientX - rect.left) * scaleX
          const mouseY = (e.clientY - rect.top) * scaleY

          let newX = cropData.x
          let newY = cropData.y
          let newWidth = cropData.width
          let newHeight = cropData.height

          // Handle resizing based on direction
          if (resizeDirection.includes('e')) {
            // East - resize right
            newWidth = Math.max(50, Math.min(cropModal.imageWidth - newX, mouseX - newX))
          }
          if (resizeDirection.includes('w')) {
            // West - resize left
            const rightEdge = newX + newWidth
            newX = Math.max(0, Math.min(rightEdge - 50, mouseX))
            newWidth = rightEdge - newX
          }
          if (resizeDirection.includes('s')) {
            // South - resize down
            newHeight = Math.max(50, Math.min(cropModal.imageHeight - newY, mouseY - newY))
          }
          if (resizeDirection.includes('n')) {
            // North - resize up
            const bottomEdge = newY + newHeight
            newY = Math.max(0, Math.min(bottomEdge - 50, mouseY))
            newHeight = bottomEdge - newY
          }

          // Keep it square by using the smaller dimension
          const size = Math.min(newWidth, newHeight)
          setCropData({ x: newX, y: newY, width: size, height: size })
        }
      }
    }

    const handleMouseUp = () => {
      setIsDraggingCrop(false)
      setIsResizingCrop(false)
      setResizeDirection(null)
    }

    if (isDraggingCrop || isResizingCrop) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = isDraggingCrop ? 'move' : 'nw-resize'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
    }
  }, [isDraggingCrop, isResizingCrop, resizeDirection, cropModal, cropData, dragStartCrop])

  // Auto-save when nodes change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSave && (nodes.length > 0 || connections.length > 0)) {
        onSave(nodes, connections)
        toast.success('Auto-saved', { duration: 1000 })
      }
    }, 2000) // Give users more time between saves
    return () => clearTimeout(timeoutId)
  }, [nodes, connections, onSave])

  // Listen for palette changes and force re-render
  useEffect(() => {
    const handlePaletteChange = () => {
      setPaletteRefresh(prev => prev + 1)
    }
    
    window.addEventListener('paletteChanged', handlePaletteChange)
    return () => window.removeEventListener('paletteChanged', handlePaletteChange)
  }, [])

  // Initialize nodes from props
  useEffect(() => {
    setNodes(initialNodes)
    setConnections(initialConnections)
    setVisibleNodeIds(initialNodes.map(node => node.id))
    // Initialize history with the first state
    if (initialNodes.length > 0 || initialConnections.length > 0) {
      setHistory([{ nodes: initialNodes, connections: initialConnections }])
      setHistoryIndex(0)
    }
  }, [initialNodes, initialConnections])

  // Update visible nodes when nodes change - memoized to prevent infinite loops
  const nodeIdsSnapshot = useMemo(() =>
    nodes.map(node => node.id).join(','),
    [nodes]
  )

  useEffect(() => {
    if (visibleNodeIds.length === 0 || visibleNodeIds.length === nodes.length) {
      setVisibleNodeIds(nodes.map(node => node.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeIdsSnapshot])

  // Sync node content with DOM elements to preserve cursor position
  // DISABLED: This was causing cursor jumping issues during typing
  // useEffect(() => {
  //   nodes.forEach(node => {
  //     // Update title content
  //     const titleElement = document.querySelector(`[data-node-id="${node.id}"] [data-content-type="title"]`) as HTMLElement
  //     if (titleElement && node.text !== undefined) {
  //       preserveCursorPosition(titleElement, node.text)
  //     }

  //     // Update content
  //     const contentElement = document.querySelector(`[data-node-id="${node.id}"] [data-content-type="content"]`) as HTMLElement
  //     if (contentElement && node.content !== undefined) {
  //       preserveCursorPosition(contentElement, node.content || '')
  //     }
  //   })
  // }, [nodes, preserveCursorPosition])

  // Initialize content when component mounts or new nodes are added
  useEffect(() => {
    // Use a small timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      nodes.forEach(node => {
        // Initialize title content if empty
        const titleElement = document.querySelector(`[data-node-id="${node.id}"] [data-content-type="title"]`) as HTMLElement
        if (titleElement && !titleElement.textContent && node.text) {
          titleElement.textContent = node.text
        }

        // Initialize content if empty
        const contentElement = document.querySelector(`[data-node-id="${node.id}"] [data-content-type="content"]`) as HTMLElement
        if (contentElement && !contentElement.textContent && node.content) {
          contentElement.textContent = node.content
        }

        // Initialize event node title if empty
        if (node.type === 'event') {
          const eventTitleElement = document.querySelector(`[data-node-id="${node.id}"] [data-content-type="title"]`) as HTMLElement
          if (eventTitleElement && !eventTitleElement.textContent && node.title) {
            eventTitleElement.textContent = node.title
          }

          // Initialize event node summary if empty
          const eventSummaryElement = document.querySelector(`[data-node-id="${node.id}"] [data-content-type="summary"]`) as HTMLElement
          if (eventSummaryElement && !eventSummaryElement.textContent && node.summary) {
            eventSummaryElement.textContent = node.summary
          }
        }
      })
    }, 50)

    return () => clearTimeout(timer)
  }, [nodes.length]) // Only run when nodes are added/removed

  // Performance-optimized viewport calculation
  const updateViewportNodes = useCallback(
    PerformanceOptimizer.throttle(() => {
      // With fixed canvas size, show all visible nodes without viewport optimization
      setViewportNodes(nodes.filter(node => visibleNodeIds.includes(node.id)))
    }, 16), // Limit to 60fps
    [nodes, visibleNodeIds, paletteRefresh]
  )

  // Update viewport nodes when pan, scale, or visible nodes change
  useEffect(() => {
    updateViewportNodes()
  }, [updateViewportNodes])

  // Save state to history
  const saveToHistory = useCallback((newNodes: Node[], newConnections: Connection[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push({ nodes: [...newNodes], connections: [...newConnections] })
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
        setHistoryIndex(prev => prev - 1)
      }
      
      return newHistory
    })
    setHistoryIndex(prev => {
      const newIndex = Math.min(prev + 1, maxHistorySize - 1)
      return newIndex
    })
  }, [historyIndex, maxHistorySize])

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const prevState = history[newIndex]
      setNodes(prevState.nodes)
      setConnections(prevState.connections)
      setHistoryIndex(newIndex)
      toast.success('Undone')
    }
  }, [history, historyIndex])

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const nextState = history[newIndex]
      setNodes(nextState.nodes)
      setConnections(nextState.connections)
      setHistoryIndex(newIndex)
      toast.success('Redone')
    }
  }, [history, historyIndex])

  // Node style preferences update function
  const updateNodeStylePreference = useCallback((key: keyof NodeStylePreferences, value: string) => {
    setNodeStylePreferences(prev => {
      const newPrefs = { ...prev, [key]: value }
      // Save to localStorage
      localStorage.setItem('storycanvas-node-styles', JSON.stringify(newPrefs))
      return newPrefs
    })
  }, [])

  // Generate CSS classes based on current style preferences
  const getNodeStyleClasses = useCallback(() => {
    const classes = []

    // Add corner style class
    if (nodeStylePreferences.corners === 'sharp') {
      classes.push('nodes-sharp')
    } else if (nodeStylePreferences.corners === 'very-rounded') {
      classes.push('nodes-very-rounded')
    } else {
      classes.push('nodes-rounded')
    }

    // Add outline style class
    if (nodeStylePreferences.outlines === 'dark') {
      classes.push('nodes-outlines-dark')
    } else if (nodeStylePreferences.outlines === 'light') {
      classes.push('nodes-outlines-light')
    } else {
      classes.push('nodes-outlines-mixed')
    }

    // Add text alignment class
    if (nodeStylePreferences.textAlign === 'center') {
      classes.push('nodes-align-center')
    } else if (nodeStylePreferences.textAlign === 'right') {
      classes.push('nodes-align-right')
    } else {
      classes.push('nodes-align-left')
    }

    return classes.join(' ')
  }, [nodeStylePreferences])

  // Helper function to get node position during drag (supports multi-select)
  const getNodeDragPosition = useCallback((node: Node) => {
    if (draggingNode && (draggingNode === node.id || selectedIds.includes(node.id))) {
      // Calculate delta for the dragged node
      const draggedNode = nodes.find(n => n.id === draggingNode)
      if (draggedNode) {
        let deltaX = dragPosition.x - draggedNode.x
        let deltaY = dragPosition.y - draggedNode.y

        // If multiple nodes selected, constrain delta so ALL nodes stay on canvas
        if (selectedIds.length > 1) {
          let minDeltaX = -Infinity
          let minDeltaY = -Infinity

          // Include the dragged node in constraint calculation
          if (draggedNode) {
            minDeltaX = Math.max(minDeltaX, -draggedNode.x)
            minDeltaY = Math.max(minDeltaY, -draggedNode.y)
          }

          // Check all selected nodes
          selectedIds.forEach(nodeId => {
            const n = nodes.find(nd => nd.id === nodeId)
            if (n && n.id !== draggingNode) {
              minDeltaX = Math.max(minDeltaX, -n.x)
              minDeltaY = Math.max(minDeltaY, -n.y)
            }
          })

          deltaX = Math.max(minDeltaX, deltaX)
          deltaY = Math.max(minDeltaY, deltaY)
        }

        // Apply the constrained delta to both the dragged node and other selected nodes
        return {
          x: node.x + deltaX,
          y: node.y + deltaY
        }
      }
    }
    // Not being dragged
    return { x: node.x, y: node.y }
  }, [draggingNode, dragPosition, selectedIds, nodes])

  // Keyboard shortcuts for undo/redo and delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts while user is typing in contentEditable or input/textarea
      if (document.activeElement?.getAttribute('contenteditable') === 'true') return
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return

      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        handleDeleteNode(selectedId)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setSelectedId(null)
        setConnectingFrom(null) // Cancel any pending connections
        setTool('pan')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedId])

  // Cancel connecting mode when tool changes
  useEffect(() => {
    setConnectingFrom(null)
  }, [tool])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Select tool: deselect nodes when clicking empty canvas, switch to moving mode
    if (tool === 'select') {
      // Save before exiting edit mode
      if (editingField) {
        console.log('🔵 handleCanvasClick: editingField detected, forcing blur', editingField)
        const activeElement = document.activeElement as HTMLElement
        if (activeElement && activeElement.getAttribute('contenteditable') === 'true') {
          console.log('🔵 handleCanvasClick: calling blur on active element')
          activeElement.blur() // Trigger blur event which will save
        } else {
          console.log('🔴 handleCanvasClick: no active contenteditable element found')
        }
      }
      setSelectedId(null)
      setEditingField(null) // Exit edit mode when clicking canvas background
      setInteractionMode('moving')
      return
    }

    // Don't create nodes while panning
    if (isPanning) return
    
    // Only create nodes when a creation tool is selected
    if (!['text', 'character', 'event', 'location', 'folder', 'list', 'image', 'table', 'relationship-canvas'].includes(tool)) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newNode: Node = {
      id: `${tool}-${Date.now()}`,
      x: Math.max(0, x - 100),
      y: Math.max(0, y - 60),
      text: getDefaultText(tool),
      content: getDefaultContent(tool),
      width: tool === 'list' ? 320 : tool === 'image' ? 300 : tool === 'character' ? 320 : tool === 'location' ? 320 : tool === 'event' ? 220 : tool === 'table' ? 280 : tool === 'relationship-canvas' ? 600 : 200,  // Event nodes portrait: 220px wide
      height: tool === 'list' ? 240 : tool === 'image' ? 200 : tool === 'character' ? 72 : tool === 'location' ? 72 : tool === 'event' ? 280 : tool === 'table' ? 200 : tool === 'relationship-canvas' ? 400 : 120, // Event nodes portrait: 280px tall
      type: tool,
      // Don't set color - let it use dynamic theme colors
      ...(tool === 'list' ? { childIds: [], layoutMode: 'single-column' as const } : {}),
      ...(tool === 'table' ? { tableData: getDefaultTableData() } : {}),
      ...(tool === 'relationship-canvas' ? { relationshipData: { selectedCharacters: [], relationships: [] } } : {}),
      ...(tool === 'event' ? { title: 'New Event', summary: 'Describe what happens in this event...', durationText: '' } : {})
    }

    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    setSelectedId(newNode.id)  // Select the newly created node
    setTool('select')  // Switch to select tool after creating node for immediate interaction
    toast.success(`Created ${tool} node`)
  }, [tool, isPanning, nodes, connections, saveToHistory])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse (button 1) or right mouse (button 2) always pans
    if ((e.button === 1 || e.button === 2) && e.target === canvasRef.current) {
      e.preventDefault() // Prevent context menu on right click
      setIsPanning(true)
      setIsMoving(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      return
    }

    // Left click (button 0) in select mode on empty canvas
    if (tool === 'select' && e.button === 0 && e.target === canvasRef.current && !isDraggingCharacter) {
      // Start selection box if not shift-clicking
      if (!e.shiftKey) {
        // Clear existing selection
        setSelectedIds([])
        setSelectedId(null)
      }

      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setSelectionStart({ x, y })
        setSelectionBox({ x, y, width: 0, height: 0 })
        setIsSelecting(true)
      }

      setIsPanning(true)
      setIsMoving(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [tool, isDraggingCharacter])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    // Update selection box if selecting
    if (isSelecting && tool === 'select') {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const currentX = e.clientX - rect.left
        const currentY = e.clientY - rect.top

        const x = Math.min(selectionStart.x, currentX)
        const y = Math.min(selectionStart.y, currentY)
        const width = Math.abs(currentX - selectionStart.x)
        const height = Math.abs(currentY - selectionStart.y)

        setSelectionBox({ x, y, width, height })

        // Find nodes within selection box
        const selectedNodes = nodes.filter(node => {
          const nodeRight = node.x + (node.width || 240)
          const nodeBottom = node.y + (node.height || 120)

          return (
            node.x < x + width &&
            nodeRight > x &&
            node.y < y + height &&
            nodeBottom > y
          )
        })

        const selectedNodeIds = selectedNodes.map(n => n.id)
        setSelectedIds(selectedNodeIds)
        if (selectedNodeIds.length > 0) {
          setSelectedId(selectedNodeIds[0])
        }
      }
    }

    if (isPanning && !isDraggingCharacter && !isSelecting) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y

      // Use the parent container for scrolling instead of transform
      const canvasContainer = canvasRef.current?.parentElement
      if (canvasContainer) {
        canvasContainer.scrollLeft -= deltaX
        canvasContainer.scrollTop -= deltaY
      }

      setLastPanPoint({ x: e.clientX, y: e.clientY })
    } else if (isDragReady && !draggingNode && !isDraggingCharacter) {
      // In typing mode, disable node dragging completely - only allow text selection
      if (interactionMode === 'typing') {
        setIsDragReady(null)
        return
      }

      // Check if user is currently selecting text - if so, don't start dragging
      const selection = window.getSelection()
      const hasTextSelection = selection && selection.toString().length > 0

      if (hasTextSelection) {
        // User is selecting text, cancel drag ready state
        setIsDragReady(null)
        return
      }

      // Check if mouse moved enough to start dragging (smaller threshold in moving mode)
      const deltaX = e.clientX - dragStartPos.x
      const deltaY = e.clientY - dragStartPos.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // In moving mode, use a responsive threshold
      const dragThreshold = 3

      if (distance > dragThreshold) {
        // Start dragging the node
        setDraggingNode(isDragReady)
        setIsDragReady(null)
        setIsMoving(true)
      }
    }

    if (isResizeReady) {
      // Check if mouse moved enough to start resizing
      const deltaX = e.clientX - resizeStartPos.x
      const deltaY = e.clientY - resizeStartPos.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      const resizeThreshold = 3

      if (distance > resizeThreshold) {
        // Start resizing the node
        setResizingNode(isResizeReady)
        setIsResizeReady(null)
        setIsMoving(true)
        // Disable text selection during resize
        document.body.style.userSelect = 'none'
      }
    }

    if (draggingNode) {
      // Handle node dragging - just update position state, don't re-render nodes
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left - dragOffset.x
        const y = e.clientY - rect.top - dragOffset.y

        setDragPosition({ x: Math.max(0, x), y: Math.max(0, y) })
        setIsMoving(true)
      }
    }

    if (resizingNode) {
      // Handle node resizing
      const deltaX = e.clientX - resizeStartPos.x
      const deltaY = e.clientY - resizeStartPos.y

      const resizingNodeObj = nodes.find(n => n.id === resizingNode)
      if (!resizingNodeObj) return

      // Set minimum dimensions based on node type
      let minWidth = 120
      let minHeight = 80

      if (resizingNodeObj.type === 'event') {
        minWidth = 220  // Event nodes minimum width
        minHeight = 280 // Event nodes minimum height
      } else if (resizingNodeObj.type === 'character') {
        minWidth = 320  // Character nodes minimum width
        minHeight = 72  // Character nodes minimum height
      }

      let newWidth = Math.max(minWidth, resizeStartSize.width + deltaX)
      let newHeight = Math.max(minHeight, resizeStartSize.height + deltaY)

      // Apply node-type specific resize behavior
      if (resizingNodeObj.type === 'image') {
        // Image nodes: maintain the uploaded photo's aspect ratio at ALL times
        const originalWidth = resizingNodeObj.attributes?.originalWidth || 300
        const originalHeight = resizingNodeObj.attributes?.originalHeight || 200
        const photoAspectRatio = originalWidth / originalHeight

        // Always maintain the photo's aspect ratio regardless of resize direction
        const resizeVector = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        const resizeDirection = deltaX + deltaY > 0 ? 1 : -1
        const scaleFactor = 1 + (resizeDirection * resizeVector) / 200

        const baseWidth = resizeStartSize.width
        const baseHeight = resizeStartSize.height

        // Scale proportionally maintaining photo aspect ratio
        if (photoAspectRatio > 1) {
          // Landscape photo - width dominates
          newWidth = Math.max(200, baseWidth * scaleFactor)
          newHeight = newWidth / photoAspectRatio
        } else {
          // Portrait photo - height dominates
          newHeight = Math.max(200, baseHeight * scaleFactor)
          newWidth = newHeight * photoAspectRatio
        }

        // Ensure minimum sizes
        newWidth = Math.max(200, newWidth)
        newHeight = Math.max(200, newHeight)
      } else if (resizingNodeObj.type === 'table') {
        // Table nodes: resize rows/columns based on direction
        const rowHeight = 40 // Approximate height per row
        const colWidth = 100 // Approximate width per column

        const currentRows = resizingNodeObj.tableData?.length || 3
        const currentCols = resizingNodeObj.tableData?.[0] ? Object.keys(resizingNodeObj.tableData[0]).length : 3

        // Calculate new row and column counts based on resize
        const newRowCount = Math.max(1, Math.round(newHeight / rowHeight))
        const newColCount = Math.max(1, Math.round(newWidth / colWidth))

        // Update table data if row/column count changed
        let updatedTableData = [...(resizingNodeObj.tableData || [])]

        // Adjust rows
        if (newRowCount > currentRows) {
          // Add rows
          for (let i = currentRows; i < newRowCount; i++) {
            const newRow: any = {}
            for (let j = 1; j <= currentCols; j++) {
              newRow[`col${j}`] = ''
            }
            updatedTableData.push(newRow)
          }
        } else if (newRowCount < currentRows) {
          // Remove rows
          updatedTableData = updatedTableData.slice(0, newRowCount)
        }

        // Adjust columns
        if (newColCount !== currentCols) {
          updatedTableData = updatedTableData.map(row => {
            const newRow: any = {}
            for (let i = 1; i <= newColCount; i++) {
              newRow[`col${i}`] = (row as any)[`col${i}`] || ''
            }
            return newRow
          })
        }

        // Set minimum sizes based on content
        newWidth = Math.max(150, newColCount * colWidth)
        newHeight = Math.max(60, newRowCount * rowHeight)

        // Update the node with new tableData
        setNodes(prevNodes =>
          prevNodes.map(node =>
            node.id === resizingNode
              ? { ...node, width: newWidth, height: newHeight, tableData: updatedTableData }
              : node
          )
        )
        return // Early return since we've already updated nodes
      } else if (resizingNodeObj.type === 'list') {
        // List nodes: scale proportionally and update child nodes
        const childCount = resizingNodeObj.childIds?.length || 0
        const minListWidth = 320
        const minListHeight = Math.max(200, 80 + (childCount * 32) + 40)

        newWidth = Math.max(minListWidth, newWidth)
        newHeight = Math.max(minListHeight, newHeight)

        // Calculate scale factors for child nodes within the list
        const widthScale = newWidth / resizeStartSize.width
        const heightScale = newHeight / resizeStartSize.height

        // Update child nodes proportionally and update the list container size
        const updatedNodes = nodes.map(node => {
          if (node.id === resizingNode) {
            // Update the list container size
            return { ...node, width: newWidth, height: newHeight }
          } else if (resizingNodeObj.childIds?.includes(node.id)) {
            // Scale child nodes proportionally to the list container
            return {
              ...node,
              // Child nodes scale with container but maintain relative positions
              width: Math.max(80, node.width * widthScale),
              height: Math.max(60, node.height * heightScale)
            }
          }
          return node
        })
        setNodes(updatedNodes)
        return // Early return since we've already updated nodes
      }
      // Text, character, event, location, folder nodes: freely scalable width and height
      // (no special restrictions)

      // Update resize current size for real-time visual feedback during resize

      // Also update the nodes for final state
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === resizingNode
            ? resizingNodeObj.type === 'image'
              ? {
                  ...node,
                  width: newWidth,
                  height: newHeight,
                  attributes: {
                    ...node.attributes,
                    // Keep original dimensions for aspect ratio reference
                    // The Polaroid frame scales with the entire node
                  }
                }
              : { ...node, width: newWidth, height: newHeight }
            : node
        )
      )
    }
  }, [isPanning, lastPanPoint, draggingNode, isDragReady, dragOffset, dragStartPos, resizingNode, resizeStartPos, resizeStartSize, isDraggingCharacter, isSelecting, tool, selectionStart, nodes])

  const handleCanvasMouseUp = useCallback((e?: React.MouseEvent) => {
    setIsPanning(false)
    setIsSelecting(false)

    // Handle node selection on click (when isDragReady is set but no drag occurred)
    if (isDragReady && tool === 'select') {
      const nodeToSelect = nodes.find(n => n.id === isDragReady)
      if (nodeToSelect && e) {
        if (e.shiftKey) {
          // Shift-click: toggle node in selection
          if (selectedIds.includes(isDragReady)) {
            const newSelection = selectedIds.filter(id => id !== isDragReady)
            setSelectedIds(newSelection)
            setSelectedId(newSelection.length > 0 ? newSelection[0] : null)
          } else {
            const newSelection = [...selectedIds, isDragReady]
            setSelectedIds(newSelection)
            setSelectedId(isDragReady)
          }
        } else {
          // Normal click: select only this node
          setSelectedIds([isDragReady])
          setSelectedId(isDragReady)
        }
      }
      setIsDragReady(null)
    }

    // Clear resize ready state if mouse up without resizing
    if (isResizeReady) {
      setIsResizeReady(null)
      document.body.style.userSelect = ''
    }

    if (draggingNode) {
      // Check if the dragged node was dropped onto a list container
      const draggedNodeObj = nodes.find(n => n.id === draggingNode)
      let droppedIntoList = false

      if (draggedNodeObj && (draggedNodeObj.type === 'folder' || draggedNodeObj.type === 'character' || draggedNodeObj.type === 'location' || draggedNodeObj.type === 'event') && !draggedNodeObj.parentId) {
        // Find if dropped onto any list container
        const listContainers = nodes.filter(n => n.type === 'list')
        for (const listNode of listContainers) {
          // Check if dragged node overlaps with list bounds (AABB collision detection)
          // Get dragged node bounds
          const draggedRight = dragPosition.x + draggedNodeObj.width
          const draggedBottom = dragPosition.y + draggedNodeObj.height
          const listRight = listNode.x + listNode.width
          const listBottom = listNode.y + listNode.height

          // Check for overlap (not just point-in-box)
          const isOverlapping = !(
            dragPosition.x > listRight ||  // dragged is to the right of list
            draggedRight < listNode.x ||   // dragged is to the left of list
            dragPosition.y > listBottom || // dragged is below list
            draggedBottom < listNode.y     // dragged is above list
          )

          if (isOverlapping) {
            // Add the node to the list container
            const newChildIds = [...(listNode.childIds || []), draggingNode]
            const newListSize = calculateAutoSize({...listNode, childIds: newChildIds}, '')

            const updatedNodes = nodes.map(node => {
              if (node.id === listNode.id) {
                return {
                  ...node,
                  childIds: newChildIds,
                  width: newListSize.width,
                  height: newListSize.height
                }
              }
              if (node.id === draggingNode) {
                return {
                  ...node,
                  parentId: listNode.id
                }
              }
              return node
            })

            setNodes(updatedNodes)
            saveToHistory(updatedNodes, connections)
            toast.success(`Added ${draggedNodeObj.type} "${draggedNodeObj.text}" to ${listNode.text}`)
            droppedIntoList = true
            break
          }
        }
      }

      if (!droppedIntoList) {
        // Update positions when dragging ends (normal canvas drop)
        // If multiple nodes are selected, move them all together while maintaining relative positions
        let deltaX = dragPosition.x - (draggedNodeObj?.x || 0)
        let deltaY = dragPosition.y - (draggedNodeObj?.y || 0)

        // If moving multiple nodes, constrain delta so ALL nodes stay on canvas
        if (selectedIds.length > 1) {
          // Find the minimum allowed delta based on all selected nodes (including the dragged node)
          let minDeltaX = -Infinity
          let minDeltaY = -Infinity

          // Include the dragged node in constraint calculation
          if (draggedNodeObj) {
            minDeltaX = Math.max(minDeltaX, -draggedNodeObj.x)
            minDeltaY = Math.max(minDeltaY, -draggedNodeObj.y)
          }

          // Check all other selected nodes
          selectedIds.forEach(nodeId => {
            const node = nodes.find(n => n.id === nodeId)
            if (node && node.id !== draggingNode) {
              // Calculate the minimum delta that keeps this node at x >= 0, y >= 0
              minDeltaX = Math.max(minDeltaX, -node.x)
              minDeltaY = Math.max(minDeltaY, -node.y)
            }
          })

          // Constrain the delta to prevent any node from going below 0
          deltaX = Math.max(minDeltaX, deltaX)
          deltaY = Math.max(minDeltaY, deltaY)
        }

        const updatedNodes = nodes.map(node => {
          // Move the dragged node using the constrained delta
          if (node.id === draggingNode) {
            return {
              ...node,
              x: (draggedNodeObj?.x || 0) + deltaX,
              y: (draggedNodeObj?.y || 0) + deltaY
            }
          }
          // Move all other selected nodes by the same constrained delta
          if (selectedIds.includes(node.id) && node.id !== draggingNode) {
            return {
              ...node,
              x: node.x + deltaX,
              y: node.y + deltaY
            }
          }
          return node
        })
        setNodes(updatedNodes)
        saveToHistory(updatedNodes, connections)
      }

      setDraggingNode(null)
      setDragOffset({ x: 0, y: 0 })
      setDragPosition({ x: 0, y: 0 })
    }
    
    if (resizingNode) {
      // Save resize changes to history when resizing ends
      saveToHistory(nodes, connections)
      setResizingNode(null)
      setResizeStartSize({ width: 0, height: 0 })
      setResizeStartPos({ x: 0, y: 0 })
      // Re-enable text selection after resize
      document.body.style.userSelect = ''
      toast.success('Node resized')
    }
    
    if (isMoving) {
      // Delay to allow final render with high quality after movement stops
      setTimeout(() => setIsMoving(false), 100)
    }
  }, [isMoving, draggingNode, isDragReady, isResizeReady, resizingNode, nodes, connections, saveToHistory, dragPosition, tool, selectedIds])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Check if Ctrl key is pressed for zoom, otherwise allow normal scrolling
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      // Calculate zoom center relative to canvas
      const centerX = e.clientX - rect.left
      const centerY = e.clientY - rect.top

      // Zoom delta
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(3, zoom * zoomDelta))

      setZoom(newZoom)
      setZoomCenter({ x: centerX, y: centerY })
    }
    // Allow normal scrolling when Ctrl is not pressed
  }, [zoom])

  const getDefaultText = (nodeType: string) => {
    switch (nodeType) {
      case 'character': return 'New Character'
      case 'event': return 'New Event'
      case 'location': return 'New Location'
      case 'folder': return 'New Section'
      case 'list': return 'New List'
      case 'image': return 'New Image'
      case 'table': return ''
      case 'relationship-canvas': return 'Relationship Map'
      default: return 'New Text Node'
    }
  }

  const getDefaultContent = (nodeType: string) => {
    switch (nodeType) {
      case 'character': return '' // No body text for character nodes
      case 'event': return 'What happens in this event?'
      case 'location': return 'What is this place like?'
      case 'folder': return 'What does this section contain?'
      case 'list': return ''  // List containers show their children, no default content needed
      case 'image': return 'Image caption or paste URL here...'
      case 'table': return '' // Tables use tableData instead of content
      case 'relationship-canvas': return '' // Relationship canvas uses relationshipData instead of content
      default: return 'What would you like to write about?'
    }
  }

  // Character detection system - finds all character nodes for relationship canvas
  const getAllCharacters = useCallback(() => {
    return nodes
      .filter(node => node.type === 'character')
      .map(node => ({
        id: node.id,
        name: node.text,
        profileImageUrl: node.profileImageUrl
      }))
  }, [nodes])

  // Real-time sync: Function to update relationship canvas when character profile pictures change
  const syncRelationshipCanvases = useCallback((updatedNodes: Node[]) => {
    let hasUpdates = false
    const syncedNodes = [...updatedNodes]

    // Find all relationship canvas nodes and sync them
    updatedNodes.forEach((node, nodeIndex) => {
      if (node.type !== 'relationship-canvas' || !node.relationshipData?.selectedCharacters) {
        return
      }

      const updatedSelectedCharacters = node.relationshipData.selectedCharacters.map(selectedChar => {
        // Find the current character node to sync profile picture and name
        const currentCharacterNode = updatedNodes.find(n => n.id === selectedChar.id && n.type === 'character')
        if (currentCharacterNode) {
          const needsUpdate =
            selectedChar.profileImageUrl !== currentCharacterNode.profileImageUrl ||
            selectedChar.name !== currentCharacterNode.text

          if (needsUpdate) {
            hasUpdates = true
            return {
              ...selectedChar,
              name: currentCharacterNode.text,
              profileImageUrl: currentCharacterNode.profileImageUrl
            }
          }
        }
        return selectedChar
      })

      // Only update if there were actual changes
      if (hasUpdates) {
        syncedNodes[nodeIndex] = {
          ...node,
          relationshipData: {
            ...node.relationshipData,
            selectedCharacters: updatedSelectedCharacters
          }
        }
      }
    })

    return hasUpdates ? syncedNodes : updatedNodes
  }, [])

  // Also sync when character nodes change (for text updates)
  const prevNodesRef = useRef<Node[]>([])
  useEffect(() => {
    const prevNodes = prevNodesRef.current

    // Check if any character nodes have changed text or profile pictures
    const characterNodesChanged = nodes.some(node => {
      if (node.type !== 'character') return false

      const prevNode = prevNodes.find(n => n.id === node.id)
      if (!prevNode) return true // new character node

      return prevNode.text !== node.text || prevNode.profileImageUrl !== node.profileImageUrl
    })

    if (characterNodesChanged && prevNodes.length > 0) {
      const syncedNodes = syncRelationshipCanvases(nodes)
      if (syncedNodes !== nodes) {
        setNodes(syncedNodes)
      }
    }

    prevNodesRef.current = nodes
  }, [nodes, syncRelationshipCanvases])

  // Auto-populate relationship canvas from character list on template load
  useEffect(() => {
    let hasUpdates = false
    const updatedNodes = [...nodes]

    nodes.forEach((node, nodeIndex) => {
      if (
        node.type === 'relationship-canvas' &&
        node.relationshipData?.autoPopulateFromList &&
        node.relationshipData.selectedCharacters.length === 0
      ) {
        // Find all character nodes that have parentId matching characters-list
        const characterListNodes = nodes.filter(n =>
          n.type === 'character' && n.parentId === 'characters-list'
        )

        if (characterListNodes.length > 0) {
          const defaultPositions = node.relationshipData.defaultPositions || []

          const selectedCharacters = characterListNodes.map((charNode, index) => ({
            id: charNode.id,
            name: charNode.text,
            profileImageUrl: charNode.profileImageUrl,
            position: defaultPositions[index] || { x: 100 + (index * 80), y: 100 + (index * 60) }
          }))

          updatedNodes[nodeIndex] = {
            ...node,
            relationshipData: {
              ...node.relationshipData,
              selectedCharacters,
              autoPopulateFromList: false // Disable after first population
            }
          }
          hasUpdates = true
        }
      }
    })

    if (hasUpdates) {
      setNodes(updatedNodes)
    }
  }, [nodes])

  const getDefaultTableData = () => {
    return [
      { col1: '', col2: '', col3: '' },
      { col1: '', col2: '', col3: '' },
      { col1: '', col2: '', col3: '' }
    ]
  }

  // Helper function to lighten a color
  const lightenColor = (color: string, amount: number = 0.3): string => {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }

    const rgb = hexToRgb(color)
    if (!rgb) return color

    // Lighten by mixing with white
    const r = Math.round(rgb.r + (255 - rgb.r) * amount)
    const g = Math.round(rgb.g + (255 - rgb.g) * amount)
    const b = Math.round(rgb.b + (255 - rgb.b) * amount)

    // Convert back to hex
    const toHex = (n: number) => {
      const hex = n.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  // Helper function to darken a color and increase saturation
  const darkenColor = (color: string, amount: number = 0.3): string => {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }

    const rgb = hexToRgb(color)
    if (!rgb) return color

    // Convert RGB to HSL
    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }

    // Apply transformations based on usage
    if (amount === 0.3) {
      // For dots: Use adaptive darkening based on original lightness
      // Very light colors (>90% lightness) need more aggressive darkening
      // Target a consistent mid-tone for visibility
      if (l > 0.9) {
        // Very light backgrounds: darken to ~50% lightness for good contrast
        l = 0.5
      } else if (l > 0.8) {
        // Light backgrounds: darken to ~45% lightness
        l = 0.45
      } else {
        // Normal backgrounds: use standard 30% darkening
        l = l * 0.7
      }
      // High saturation for vibrancy, but not overpowering
      s = Math.min(1.0, s * 2.5) // Boost saturation significantly but cap at 100%
    } else {
      // For borders (amount=0.2): desaturate by 15%
      s = s * 0.85
      l = l * (1 - amount)
    }

    // Convert back to RGB
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    let r2, g2, b2
    if (s === 0) {
      r2 = g2 = b2 = l
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r2 = hue2rgb(p, q, h + 1/3)
      g2 = hue2rgb(p, q, h)
      b2 = hue2rgb(p, q, h - 1/3)
    }

    // Convert back to hex
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`
  }

  const getNodeColor = (nodeType: string, customColor?: string, nodeId?: string, isChildInList: boolean = false) => {
    // Get the current active palette from color context
    const currentPalette = colorContext.getCurrentPalette()

    let baseColor: string

    if (currentPalette && currentPalette.colors && currentPalette.colors.nodeDefault) {
      baseColor = currentPalette.colors.nodeDefault
    } else {
      // Try getting the color from CSS variables (applied by palette system)
      const paletteBase = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-node-default')
        .trim()

      if (paletteBase && paletteBase !== '#ffffff' && paletteBase !== 'white' && paletteBase !== '') {
        baseColor = paletteBase
      } else {
        // Hard fallback - use a nice blue color instead of white
        baseColor = '#e0f2fe' // Light blue instead of white
      }
    }

    // If this is a child node inside a list container, lighten the color
    if (isChildInList) {
      return lightenColor(baseColor, 0.2)
    }

    return baseColor
  }

  // ====================
  // BORDER COLOR SYSTEM - Two distinct colors for clarity
  // ====================

  // DARK BORDER: Strong, prominent border from the color palette
  const getDarkBorderColor = () => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--color-border')
      .trim() || 'hsl(var(--border))'
  }

  // LIGHT BORDER: Subtle, colored border derived from node's background color
  // Note: "darkenColor" with 0.2 actually darkens/saturates the node color to create a visible border
  const getLightBorderColor = (nodeType: string) => {
    const nodeColor = getNodeColor(nodeType, undefined, undefined, false)
    const borderColor = darkenColor(nodeColor, 0.2)
    console.log(`Light border for ${nodeType}: node=${nodeColor}, border=${borderColor}`)
    return borderColor
  }

  // ====================
  // NODE BORDER COLOR - Uses dark or light based on outline mode
  // ====================
  const getNodeBorderColor = (nodeType: string, isChildInList: boolean = false) => {
    const outlineMode = nodeStylePreferences.outlines

    // Dark mode: always use DARK border
    if (outlineMode === 'dark') {
      return getDarkBorderColor()
    }

    // Light mode: always use LIGHT border
    if (outlineMode === 'light') {
      return getLightBorderColor(nodeType)
    }

    // Mixed mode: child nodes use LIGHT, standalone use DARK
    if (outlineMode === 'mixed') {
      return isChildInList ? getLightBorderColor(nodeType) : getDarkBorderColor()
    }

    return getDarkBorderColor()
  }

  // ====================
  // RESIZE HANDLE COLOR - Uses OPPOSITE of node border for contrast
  // ====================
  const getResizeHandleColor = (nodeType: string) => {
    const outlineMode = nodeStylePreferences.outlines

    // Light mode: nodes use LIGHT borders, so handles use DARK
    if (outlineMode === 'light') {
      return getDarkBorderColor()
    }

    // Dark mode: nodes use DARK borders, so handles use LIGHT
    // Mixed mode: nodes use DARK borders, so handles use LIGHT
    if (outlineMode === 'dark' || outlineMode === 'mixed') {
      return getLightBorderColor(nodeType)
    }

    return getDarkBorderColor()
  }

  // Helper function to get text color from palette with text weight mode support
  const getTextColor = (backgroundColor: string, isChildInList: boolean = false) => {
    // Use palette text color as base
    const paletteTextColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-node-text')
      .trim()

    let baseTextColor = paletteTextColor || '#000000'

    // Fallback to luminance calculation if no palette text color
    if (!paletteTextColor) {
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null
      }

      const getLuminance = (r: number, g: number, b: number) => {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        })
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
      }

      if (backgroundColor.startsWith('#')) {
        const rgb = hexToRgb(backgroundColor)
        if (rgb) {
          const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
          baseTextColor = luminance > 0.5 ? '#000000' : '#ffffff'
        }
      }
    }

    // Apply text color mode logic (similar to outline modes)
    const textColorMode = nodeStylePreferences.textColor

    // Dark mode: always use default dark palette text color
    if (textColorMode === 'dark') {
      return baseTextColor
    }

    // Light mode: always use lighter text (same as light borders)
    if (textColorMode === 'light') {
      const nodeColor = getNodeColor('text', undefined, undefined, false)
      return darkenColor(nodeColor, 0.2)
    }

    // Mixed mode: child nodes use light text, standalone use dark
    if (textColorMode === 'mixed') {
      if (isChildInList) {
        const nodeColor = getNodeColor('text', undefined, undefined, false)
        return darkenColor(nodeColor, 0.2)
      } else {
        return baseTextColor
      }
    }

    return baseTextColor
  }

  // Helper function to get icon color - matches text color logic
  const getIconColor = (nodeType: string, backgroundColor: string, isChildInList: boolean = false) => {
    return getTextColor(backgroundColor, isChildInList)
  }

  const handleNodeClick = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation()

    // Handle double-click on relationship-canvas nodes
    if (e.detail === 2 && node.type === 'relationship-canvas') {
      setRelationshipCanvasModal({
        isOpen: true,
        nodeId: node.id,
        node: node
      })
      return
    }

    // Handle timeline connections when event tool is selected
    if (tool === 'event' && node.type === 'event') {
      if (!connectingFrom) {
        // First click: start timeline connection
        setConnectingFrom(node.id)
        toast.info(`Click another event to create timeline connection`)
        return
      } else if (connectingFrom === node.id) {
        // Same node: cancel connection
        setConnectingFrom(null)
        toast.info('Timeline connection cancelled')
        return
      } else {
        // Second click: create timeline connection between events
        const newConnection: Connection = {
          id: `timeline-${Date.now()}`,
          from: connectingFrom,
          to: node.id,
          type: 'leads-to' // Timeline sequence connection
        }
        const newConnections = [...connections, newConnection]
        setConnections(newConnections)
        saveToHistory(nodes, newConnections)
        setConnectingFrom(null)
        toast.success('Timeline connection created!')
        return
      }
    }

    // Handle connection tool
    if (tool === 'connect') {
      if (!connectingFrom) {
        // First click: start connection
        setConnectingFrom(node.id)
        toast.info(`Click another node to connect to ${node.text}`)
        return
      } else if (connectingFrom === node.id) {
        // Same node: cancel connection
        setConnectingFrom(null)
        toast.info('Connection cancelled')
        return
      } else {
        // Second click: create connection
        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          from: connectingFrom,
          to: node.id,
          type: 'leads-to'
        }
        const newConnections = [...connections, newConnection]
        setConnections(newConnections)
        saveToHistory(nodes, newConnections)
        setConnectingFrom(null)
        toast.success('Connection created!')
        return
      }
    }

    // Only allow node interactions with select tool for other functions
    if (tool !== 'select') return

    // Handle shift-click for multi-select
    if (e.shiftKey) {
      if (selectedIds.includes(node.id)) {
        // Remove from selection
        setSelectedIds(selectedIds.filter(id => id !== node.id))
        setSelectedId(null)
      } else {
        // Add to selection
        setSelectedIds([...selectedIds, node.id])
      }
    } else {
      // Normal click - single selection
      setSelectedIds([node.id])
      setSelectedId(node.id)
    }
  }




  const calculateAutoSize = (node: Node, content: string) => {
    // Auto-sizing logic based on node type and content
    const baseWidth = 240
    const baseHeight = 120
    const minWidth = 180
    const minHeight = 100
    const maxWidth = 800
    const maxHeight = 1200

    if (node.type === 'text' || !node.type) {
      // Text nodes: start with few lines worth of space, auto-grow downward based on content
      const minLines = 3
      const lineHeight = 22 // Increased for better readability
      const headerHeight = 40 // Space for icon and title
      const padding = 16 // Internal padding

      // Calculate required lines based on content and current width
      const effectiveWidth = (node.width || baseWidth) - padding * 2
      const avgCharsPerLine = Math.max(1, Math.floor(effectiveWidth / 8)) // ~8px per character
      const contentLength = content.length
      const requiredLines = Math.max(minLines, Math.ceil(contentLength / avgCharsPerLine))

      const newHeight = Math.min(maxHeight, headerHeight + padding + (requiredLines * lineHeight))

      return {
        width: node.width || baseWidth, // Keep current width - user can resize manually
        height: newHeight
      }
    } else if (node.type === 'image') {
      // Image nodes: maintain aspect ratio with Polaroid frame proportions
      if (node.imageUrl && node.attributes?.originalWidth && node.attributes?.originalHeight) {
        const imageWidth = node.attributes.imageWidth || node.attributes.originalWidth
        const imageHeight = node.attributes.imageHeight || node.attributes.originalHeight
        const aspectRatio = imageWidth / imageHeight

        // Calculate Polaroid frame dimensions (same as upload logic)
        const frameWidth = imageWidth + 40  // 20px padding each side
        const frameHeight = imageHeight + 120 // 40px top for header, 80px bottom for caption

        // If user manually resized, maintain aspect ratio with frame proportions
        if (node.width && node.width !== baseWidth) {
          const userFrameWidth = Math.min(maxWidth, Math.max(minWidth, node.width))
          const userImageWidth = userFrameWidth - 40 // Account for padding
          const userImageHeight = userImageWidth / aspectRatio
          const userFrameHeight = userImageHeight + 120 // Account for header + caption

          return {
            width: userFrameWidth,
            height: Math.min(maxHeight, Math.max(minHeight, userFrameHeight))
          }
        }

        // Auto-scale maintaining frame proportions
        return {
          width: Math.min(maxWidth, Math.max(minWidth, frameWidth)),
          height: Math.min(maxHeight, Math.max(minHeight, frameHeight))
        }
      } else {
        // No image URL or dimensions, use current size or larger default for better appearance
        return {
          width: node.width || 300,
          height: node.height || 200
        }
      }
    } else if (node.type === 'list') {
      // List nodes: uniform spacing between nodes and edges
      const childCount = node.childIds?.length || 0
      const headerHeight = 40 // Header space for title
      const uniformSpacing = 15 // Consistent spacing: top, between nodes, and bottom
      const emptyStateHeight = 120 // Height when empty

      const minListWidth = 380 // Width to accommodate full folder nodes

      // Calculate total height based on actual child node types
      let totalChildHeight = 0
      if (childCount > 0 && node.childIds) {
        const childNodes = nodes.filter(n => node.childIds?.includes(n.id))
        totalChildHeight = childNodes.reduce((sum, childNode) => {
          const nodeHeight = childNode.type === 'character' ? 72 : childNode.type === 'event' ? 280 : 140 // Character=72px, Event=280px, Folder=140px
          return sum + nodeHeight + uniformSpacing
        }, 0)
      }

      // Calculate height with uniform spacing
      const requiredHeight = childCount > 0
        ? headerHeight + uniformSpacing + totalChildHeight
        : emptyStateHeight

      // Always use the calculated height for proper sizing
      const currentWidth = node.width || minListWidth

      return {
        width: Math.min(maxWidth, Math.max(minListWidth, currentWidth)),
        height: Math.min(maxHeight, requiredHeight)
      }
    } else if (node.type === 'folder') {
      // Folder nodes: scalable both horizontally and vertically like text nodes
      return {
        width: node.width || baseWidth,
        height: node.height || baseHeight
      }
    } else if (node.type === 'character') {
      // Character nodes: compact height for profile picture + name only
      // Width should accommodate longer character names - make it much wider like the top example
      const characterHeight = 72 // Height for square profile picture + name
      const characterWidth = node.width || 600 // Much wider default to match the top example image

      return {
        width: characterWidth,
        height: characterHeight
      }
    } else if (node.type === 'location') {
      // Location nodes: same compact height as character nodes but with location icon
      const locationHeight = 72 // Height for icon + name (same as character)
      const locationWidth = node.width || 600 // Much wider default to match character nodes

      return {
        width: locationWidth,
        height: locationHeight
      }
    } else if (node.type === 'event') {
      // Event nodes: portrait storyboard-style layout with minimum dimensions
      const eventWidth = Math.max(220, node.width || 220) // Minimum 220px width
      const eventHeight = Math.max(280, node.height || 280) // Minimum 280px height

      return {
        width: eventWidth,
        height: eventHeight
      }
    }

    // Default: return current size or base size
    return {
      width: node.width || baseWidth,
      height: node.height || baseHeight
    }
  }

  // Stable callback for ColorFilter to prevent re-render loops
  const handleFilterChange = useCallback((visibleIds: string[]) => {
    setVisibleNodeIds(visibleIds)
  }, [])

  const handleDeleteNode = (nodeId: string) => {
    const newNodes = nodes.filter(node => node.id !== nodeId)
    const newConnections = connections.filter(conn => conn.from !== nodeId && conn.to !== nodeId)
    setNodes(newNodes)
    setConnections(newConnections)
    saveToHistory(newNodes, newConnections)
    setSelectedId(null)
    toast.success('Node deleted')
  }

  const handleColorChange = (nodeId: string, color: string) => {
    const newNodes = nodes.map(node =>
      node.id === nodeId
        ? { ...node, color }
        : node
    )
    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    toast.success('Node color updated')
  }

  // Context menu handlers
  const handleSettingChange = (nodeId: string, setting: string, value: any) => {
    const newNodes = nodes.map(node => {
      if (node.id === nodeId) {
        // Special case for layoutMode which is a direct property
        if (setting === 'layout') {
          return { ...node, layoutMode: value }
        }
        // All other settings go in the settings object
        return {
          ...node,
          settings: {
            ...node.settings,
            [setting]: value
          }
        }
      }
      return node
    })
    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    toast.success('Setting updated')
  }

  const handleDuplicateNode = (nodeId: string) => {
    const nodeToDuplicate = nodes.find(n => n.id === nodeId)
    if (!nodeToDuplicate) return

    const newNode: Node = {
      ...nodeToDuplicate,
      id: `${nodeToDuplicate.type}-${Date.now()}`,
      x: nodeToDuplicate.x + 20,
      y: nodeToDuplicate.y + 20,
      linkedCanvasId: undefined, // Don't copy canvas links
      childIds: [], // Don't copy children
      parentId: undefined // Don't copy parent
    }

    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    setSelectedId(newNode.id)
    toast.success('Node duplicated')
  }

  const handleBringToFront = (nodeId: string) => {
    const maxZIndex = Math.max(...nodes.map(n => n.zIndex || 0), 0)
    const newNodes = nodes.map(node =>
      node.id === nodeId
        ? { ...node, zIndex: maxZIndex + 1 }
        : node
    )
    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    toast.success('Brought to front')
  }

  const handleSendToBack = (nodeId: string) => {
    const minZIndex = Math.min(...nodes.map(n => n.zIndex || 0), 0)
    const newNodes = nodes.map(node =>
      node.id === nodeId
        ? { ...node, zIndex: minZIndex - 1 }
        : node
    )
    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    toast.success('Sent to back')
  }

  const resetNodeToThemeColor = (nodeId: string) => {
    const newNodes = nodes.map(node => 
      node.id === nodeId 
        ? { ...node, color: undefined }  // Remove custom color to use theme color
        : node
    )
    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    toast.success('Reset to theme color')
  }

  const resetAllNodesToThemeColors = () => {
    const newNodes = nodes.map(node => ({ ...node, color: undefined }))
    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    toast.success('All nodes reset to theme colors')
  }

  // Drag and drop handlers for list containers
  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggedNode(nodeId)
    e.dataTransfer.setData('text/plain', nodeId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetNodeId: string) => {
    const targetNode = nodes.find(n => n.id === targetNodeId)
    const draggedNodeObj = nodes.find(n => n.id === draggedNode)
    
    // List nodes only accept folder nodes
    if (targetNode?.type === 'list' && draggedNode !== targetNodeId && draggedNodeObj?.type === 'folder') {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDropTarget(targetNodeId)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropTarget(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetNodeId: string) => {
    e.preventDefault()
    const draggedNodeId = draggedNode
    const targetNode = nodes.find(n => n.id === targetNodeId)
    const draggedNodeObj = nodes.find(n => n.id === draggedNodeId)
    
    // Only allow folder, character, location, and event nodes to be added to list containers
    if (targetNode?.type === 'list' && draggedNodeObj && draggedNodeId !== targetNodeId && !draggedNodeObj.parentId) {
      if (draggedNodeObj.type !== 'folder' && draggedNodeObj.type !== 'character' && draggedNodeObj.type !== 'location' && draggedNodeObj.type !== 'event') {
        toast.error('Lists can only contain folder, character, location, and event nodes.')
        setDraggedNode(null)
        setDropTarget(null)
        return
      }
      
      // Add folder node to list container and auto-resize the list
      const newChildIds = [...(targetNode.childIds || []), draggedNodeId]
      const newChildCount = newChildIds.length
      
      // Calculate new list size based on children
      const newListSize = calculateAutoSize({...targetNode, childIds: newChildIds}, '')
      
      const newNodes = nodes.map(node => {
        if (node.id === targetNodeId) {
          return {
            ...node,
            childIds: newChildIds,
            width: newListSize.width,
            height: newListSize.height
          }
        }
        if (node.id === draggedNodeId) {
          return {
            ...node,
            parentId: targetNodeId
          }
        }
        return node
      })
      
      setNodes(newNodes)
      saveToHistory(newNodes, connections)
      toast.success(`Added folder "${draggedNodeObj.text}" to ${targetNode.text} (${newChildCount} folders)`)
    }
    
    setDraggedNode(null)
    setDropTarget(null)
  }

  const removeFromContainer = (nodeId: string) => {
    const nodeToRemove = nodes.find(n => n.id === nodeId)
    if (!nodeToRemove?.parentId) return

    const parentNode = nodes.find(n => n.id === nodeToRemove.parentId)
    if (!parentNode) return

    const newChildIds = (parentNode.childIds || []).filter(id => id !== nodeId)
    
    // Auto-resize the parent list container
    const newListSize = parentNode.type === 'list' 
      ? calculateAutoSize({...parentNode, childIds: newChildIds}, '')
      : { width: parentNode.width, height: parentNode.height }

    const newNodes = nodes.map(node => {
      if (node.id === nodeToRemove.parentId) {
        return {
          ...node,
          childIds: newChildIds,
          ...(node.type === 'list' ? { width: newListSize.width, height: newListSize.height } : {})
        }
      }
      if (node.id === nodeId) {
        const { parentId, ...nodeWithoutParent } = node
        return nodeWithoutParent
      }
      return node
    })

    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    toast.success(`Removed from container (${newChildIds.length} items remaining)`)
  }

  const handleApplyTemplate = (templateNodes: Node[], templateConnections: Connection[]) => {
    // Find an empty area on the canvas to place the template
    const findEmptyPosition = () => {
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) return { x: 100, y: 100 }

      // Start from canvas center
      const centerX = canvasRect.width / 2
      const centerY = canvasRect.height / 2
      
      // Check if this position overlaps with existing nodes
      const minNodeWidth = Math.min(...templateNodes.map(n => n.width))
      const minNodeHeight = Math.min(...templateNodes.map(n => n.height))
      
      for (let offsetX = 0; offsetX <= 400; offsetX += 50) {
        for (let offsetY = 0; offsetY <= 400; offsetY += 50) {
          const testX = centerX + offsetX
          const testY = centerY + offsetY
          
          // Check if any existing node overlaps with this position
          const hasOverlap = nodes.some(existingNode => {
            return !(testX + minNodeWidth < existingNode.x || 
                    testX > existingNode.x + existingNode.width ||
                    testY + minNodeHeight < existingNode.y || 
                    testY > existingNode.y + existingNode.height)
          })
          
          if (!hasOverlap) {
            return { x: testX, y: testY }
          }
        }
      }
      
      // Fallback: place at bottom right of existing nodes
      const maxX = Math.max(0, ...nodes.map(n => n.x + n.width))
      const maxY = Math.max(0, ...nodes.map(n => n.y + n.height))
      return { x: maxX + 50, y: maxY + 50 }
    }

    const { x: offsetX, y: offsetY } = findEmptyPosition()
    
    // Calculate the offset needed to move template to the target position
    const templateBounds = {
      minX: Math.min(...templateNodes.map(n => n.x)),
      minY: Math.min(...templateNodes.map(n => n.y))
    }
    
    const deltaX = offsetX - templateBounds.minX
    const deltaY = offsetY - templateBounds.minY

    // Offset template nodes to avoid overlaps and apply current palette colors
    const offsetTemplateNodes = templateNodes.map(node => {
      const { color: originalColor, ...nodeWithoutColor } = node // Remove hardcoded color
      const newColor = getNodeColor(node.type || 'text') || '#3b82f6'
      
      return {
        ...nodeWithoutColor,
        id: `template-${Date.now()}-${node.id}`, // Ensure unique IDs
        x: node.x + deltaX,
        y: node.y + deltaY,
        color: newColor // Explicitly set to current palette color with fallback
      }
    })
    
    // Update connections with new node IDs
    const nodeIdMap = new Map()
    templateNodes.forEach((oldNode, index) => {
      nodeIdMap.set(oldNode.id, offsetTemplateNodes[index].id)
    })
    
    const offsetTemplateConnections = templateConnections.map(conn => ({
      ...conn,
      id: `template-conn-${Date.now()}-${conn.id}`,
      from: nodeIdMap.get(conn.from) || conn.from,
      to: nodeIdMap.get(conn.to) || conn.to
    }))

    // Add to existing nodes and connections instead of replacing
    const newNodes = [...nodes, ...offsetTemplateNodes]
    const newConnections = [...connections, ...offsetTemplateConnections]
    
    setNodes(newNodes)
    setConnections(newConnections)
    setVisibleNodeIds([...visibleNodeIds, ...offsetTemplateNodes.map(node => node.id)])
    saveToHistory(newNodes, newConnections)
    setSelectedId(null)
    setTool('select')
    
    // Force a palette refresh to ensure template nodes get proper colors
    setTimeout(() => {
      const currentPalette = colorContext.getCurrentPalette()
      if (currentPalette) {
        colorContext.applyPalette(currentPalette)
      }
      setPaletteRefresh(prev => prev + 1)
    }, 100)
    
    toast.success(`Template added with ${templateNodes.length} nodes`)
  }

  const resizeCanvasAndRepositionNodes = (newWidth: number, newHeight: number, centerNodeText?: string) => {
    if (nodes.length === 0) return

    // Find the center reference node (plot structure node or similar)
    let centerNode = centerNodeText 
      ? nodes.find(node => node.text.toLowerCase().includes(centerNodeText.toLowerCase()))
      : null

    // If no specific center node found, use the node closest to current canvas center
    if (!centerNode) {
      // Calculate rough current canvas bounds
      const currentBounds = {
        minX: Math.min(...nodes.map(n => n.x)),
        maxX: Math.max(...nodes.map(n => n.x + n.width)),
        minY: Math.min(...nodes.map(n => n.y)),
        maxY: Math.max(...nodes.map(n => n.y + n.height))
      }
      const currentCenterX = (currentBounds.minX + currentBounds.maxX) / 2
      const currentCenterY = (currentBounds.minY + currentBounds.maxY) / 2

      // Find node closest to current center
      centerNode = nodes.reduce((closest, node) => {
        const nodeCenterX = node.x + node.width / 2
        const nodeCenterY = node.y + node.height / 2
        const distToCenter = Math.sqrt(
          Math.pow(nodeCenterX - currentCenterX, 2) + 
          Math.pow(nodeCenterY - currentCenterY, 2)
        )
        
        const closestCenterX = closest.x + closest.width / 2
        const closestCenterY = closest.y + closest.height / 2
        const closestDistToCenter = Math.sqrt(
          Math.pow(closestCenterX - currentCenterX, 2) + 
          Math.pow(closestCenterY - currentCenterY, 2)
        )
        
        return distToCenter < closestDistToCenter ? node : closest
      })
    }

    // Calculate new center position
    const newCenterX = newWidth / 2
    const newCenterY = newHeight / 2

    // Get reference node's current center
    const refNodeCenterX = centerNode.x + centerNode.width / 2
    const refNodeCenterY = centerNode.y + centerNode.height / 2

    // Calculate offset to move reference node to new center
    const offsetX = newCenterX - refNodeCenterX
    const offsetY = newCenterY - refNodeCenterY

    // Apply offset to all nodes
    const repositionedNodes = nodes.map(node => ({
      ...node,
      x: Math.max(0, Math.min(newWidth - node.width, node.x + offsetX)),
      y: Math.max(0, Math.min(newHeight - node.height, node.y + offsetY))
    }))

    setNodes(repositionedNodes)
    saveToHistory(repositionedNodes, connections)
    
    toast.success(`Canvas resized to ${newWidth}x${newHeight}px and nodes repositioned around "${centerNode.text}"`)
  }

  // Function to crop image using canvas
  const cropImage = useCallback((imageUrl: string, cropData: { x: number, y: number, width: number, height: number }) => {
    return new Promise<string>((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Set canvas size to crop size
        canvas.width = cropData.width
        canvas.height = cropData.height

        if (ctx) {
          // Draw the cropped portion
          ctx.drawImage(
            img,
            cropData.x, cropData.y, cropData.width, cropData.height, // source
            0, 0, cropData.width, cropData.height // destination
          )

          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
      }
      img.src = imageUrl
    })
  }, [])

  const getNodeIcon = (type?: string, node?: Node) => {
    switch (type) {
      case 'character': return <User className="w-5 h-5" />
      case 'event': return <Calendar className="w-5 h-5" />
      case 'location': return <MapPin className="w-5 h-5" />
      case 'folder': {
        const icon = node?.settings?.icon || 'folder'
        if (icon === 'book') return <span className="text-base">📚</span>
        if (icon === 'archive') return <span className="text-base">📦</span>
        if (icon === 'box') return <span className="text-base">📦</span>
        return <Folder className="w-5 h-5" />
      }
      case 'list': return <List className="w-5 h-5" />
      case 'image': return <ImageIcon className="w-5 h-5" />
      case 'table': return <Table className="w-5 h-5" />
      case 'relationship-canvas': return <Heart className="w-5 h-5" />
      default: return <Type className="w-5 h-5" />
    }
  }

  return (
    <div className="w-full h-full overflow-hidden flex bg-background">
      {/* Left Sidebar */}
      <div className="w-20 bg-card border-r border-gray-600 dark:border-gray-600 flex flex-col items-center py-4 gap-3 z-20 max-h-screen hover-scrollable">
        {/* Navigation Tools */}
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant={tool === 'select' ? 'default' : 'outline'}
            onClick={() => setTool('select')}
            className={`h-12 w-14 p-0 ${tool === 'select' ? 'bg-green-600 text-white' : ''}`}
            title="Select Tool - Move nodes, multi-select with drag or shift-click"
          >
            <MousePointer className="w-7 h-7" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-border my-2" />

        {/* Creation Tools */}
        <div className="flex flex-col gap-1">
          <Button 
            size="sm" 
            variant={tool === 'text' ? 'default' : 'outline'}
            onClick={() => setTool('text')}
            className={`h-12 w-14 p-0 ${tool === 'text' ? 'bg-gray-600 text-white' : ''}`}
            title="Add Text Node - Click canvas to create"
          >
            <Type className="w-7 h-7" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'character' ? 'default' : 'outline'}
            onClick={() => setTool('character')}
            className={`h-12 w-14 p-0 ${tool === 'character' ? 'bg-amber-600 text-white' : ''}`}
            title="Add Character - Click canvas to create"
          >
            <User className="w-7 h-7" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'event' ? 'default' : 'outline'}
            onClick={() => setTool('event')}
            className={`h-12 w-14 p-0 ${tool === 'event' ? 'bg-pink-600 text-white' : ''}`}
            title="Add Event - Click canvas to create | Click events to connect timeline"
          >
            <Calendar className="w-7 h-7" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'location' ? 'default' : 'outline'}
            onClick={() => setTool('location')}
            className={`h-12 w-14 p-0 ${tool === 'location' ? 'bg-green-600 text-white' : ''}`}
            title="Add Location - Click canvas to create"
          >
            <MapPin className="w-7 h-7" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'folder' ? 'default' : 'outline'}
            onClick={() => setTool('folder')}
            className={`h-12 w-14 p-0 ${tool === 'folder' ? 'bg-indigo-600 text-white' : ''}`}
            title="Add Section/Folder - Click canvas to create"
          >
            <Folder className="w-7 h-7" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'list' ? 'default' : 'outline'}
            onClick={() => setTool('list')}
            className={`h-12 w-14 p-0 ${tool === 'list' ? 'bg-purple-600 text-white' : ''}`}
            title="Add List - Click canvas to create"
          >
            <List className="w-7 h-7" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'image' ? 'default' : 'outline'}
            onClick={() => setTool('image')}
            className={`h-12 w-14 p-0 ${tool === 'image' ? 'bg-teal-600 text-white' : ''}`}
            title="Add Image - Click canvas to create"
          >
            <ImageIcon className="w-7 h-7" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'table' ? 'default' : 'outline'}
            onClick={() => setTool('table')}
            className={`h-12 w-14 p-0 ${tool === 'table' ? 'bg-teal-600 text-white' : ''}`}
            title="Add Table - Click canvas to create"
          >
            <Table className="w-7 h-7" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'relationship-canvas' ? 'default' : 'outline'}
            onClick={() => setTool('relationship-canvas')}
            className={`h-12 w-14 p-0 ${tool === 'relationship-canvas' ? 'bg-red-600 text-white' : ''}`}
            title="Add Relationship Canvas - Click canvas to create"
          >
            <Heart className="w-7 h-7" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-border my-2" />

        {/* Undo/Redo Controls */}
        <div className="flex flex-col gap-1">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={undo}
            disabled={historyIndex <= 0}
            className="h-11 w-14 p-0"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-7 h-7" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="h-11 w-14 p-0"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-7 h-7" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-border my-2" />

        {/* Zoom Controls */}
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newZoom = Math.min(3, zoom * 1.2)
              setZoom(newZoom)
            }}
            className="h-11 w-14 p-0"
            title="Zoom In (Ctrl + Mouse Wheel)"
          >
            <Plus className="w-7 h-7" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newZoom = Math.max(0.1, zoom * 0.8)
              setZoom(newZoom)
            }}
            className="h-11 w-14 p-0"
            title="Zoom Out (Ctrl + Mouse Wheel)"
          >
            <Minus className="w-7 h-7" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(1)}
            className="h-11 w-14 p-0 text-xs font-bold"
            title="Reset Zoom (100%)"
          >
            {Math.round(zoom * 100)}%
          </Button>
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-border my-2" />

        {/* Canvas Controls */}
        {/* Layer Controls */}
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (!selectedId) {
                toast.info('Select a node first')
                return
              }
              const selectedNode = nodes.find(n => n.id === selectedId)
              if (!selectedNode) return

              const currentZ = selectedNode.zIndex ?? 0
              const updatedNodes = nodes.map(n =>
                n.id === selectedId ? { ...n, zIndex: currentZ + 1 } : n
              )
              setNodes(updatedNodes)
              saveToHistory(updatedNodes, connections)
              toast.success('Moved layer up')
            }}
            disabled={!selectedId}
            className="h-11 w-14 p-0"
            title="Move Layer Up (bring forward)"
          >
            <ArrowUp className="w-6 h-6" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (!selectedId) {
                toast.info('Select a node first')
                return
              }
              const selectedNode = nodes.find(n => n.id === selectedId)
              if (!selectedNode) return

              const currentZ = selectedNode.zIndex ?? 0
              const updatedNodes = nodes.map(n =>
                n.id === selectedId ? { ...n, zIndex: currentZ - 1 } : n
              )
              setNodes(updatedNodes)
              saveToHistory(updatedNodes, connections)
              toast.success('Moved layer down')
            }}
            disabled={!selectedId}
            className="h-11 w-14 p-0"
            title="Move Layer Down (send backward)"
          >
            <ArrowDown className="w-6 h-6" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-border my-2" />

        {/* Color Tools */}
        <div className="flex flex-col items-center gap-1">
          <PaletteSelector
            mode="advanced"
            scope="project"
            contextId={storyId}
            onColorSelect={(color) => {
              if (selectedId) {
                handleColorChange(selectedId, color)
              } else {
                toast.info('Select a node first to apply color')
              }
            }}
            onPaletteChange={(palette) => {
              // Apply palette globally to entire project (all sections)
              colorContext.setProjectPalette(storyId, palette)

              // Apply the palette immediately to all sections
              colorContext.applyPalette(palette)

              // Reset all nodes to use the new theme colors
              resetAllNodesToThemeColors()

              // Force re-render to update node colors
              setPaletteRefresh(prev => prev + 1)
            }}
          />
          <ColorFilter
            nodes={nodes}
            onFilterChange={handleFilterChange}
          />

        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-auto" style={{ backgroundColor: 'var(--color-canvas-bg, hsl(var(--background)))' }}>
        {/* Top-right buttons when help is shown */}
        {showHelp && (
          <div className="fixed top-16 right-4 z-50 flex gap-2 items-start">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStylePanel(!showStylePanel)}
              className="h-8 w-8 p-0 text-xs shadow-lg flex-shrink-0"
              title="Node Style Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Card className="p-3 bg-card/95 backdrop-blur-sm border border-border text-xs sm:text-sm shadow-lg max-w-xs sm:max-w-sm">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-xs sm:text-sm text-card-foreground">How to use:</h4>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowHelp(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div><strong>Pan:</strong> Click & drag, or use trackpad/scroll</div>
                <div><strong>Zoom:</strong> Ctrl + scroll wheel</div>
                <div><strong>Select:</strong> Only tool for editing text - click nodes to select and edit</div>
                <div><strong>Move:</strong> Drag selected nodes to reposition them</div>
                <div><strong>Create:</strong> Select a tool then click on canvas</div>
                {tool === 'event' && (
                  <div><strong>Timeline:</strong> Click events to connect them in sequence</div>
                )}
                <div><strong>Navigate:</strong> Click arrow (→) on folder/character nodes to enter</div>
                <div><strong>Organize:</strong> Drag nodes into list containers</div>
                <div><strong>Delete:</strong> Select node and press Delete or Backspace</div>
                <div><strong>Undo/Redo:</strong> Ctrl+Z / Ctrl+Y</div>
                <div><strong>Cancel:</strong> Press Escape to deselect</div>
              </div>
              <div className="mt-2 pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Current tool: <span className="font-medium text-primary">{tool}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* Top-right buttons when help is hidden */}
        {!showHelp && (
          <div className="fixed top-16 right-4 z-50 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStylePanel(!showStylePanel)}
              className="h-8 w-8 p-0 text-xs shadow-lg"
              title="Node Style Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowHelp(true)}
              className="h-8 w-8 p-0 text-xs shadow-lg"
              title="Show help"
            >
              ?
            </Button>
          </div>
        )}

        {/* Style Panel Popup */}
        {showStylePanel && (
          <div className={`fixed top-16 z-50 w-64 ${showHelp ? 'right-80 sm:right-96' : 'right-[calc(3rem+2px)]'}`}>
            <Card className="p-3 bg-card/95 backdrop-blur-sm border border-border text-xs shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-foreground flex items-center gap-2">
                  🎨 Node Style
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowStylePanel(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <NodeStylePanel
                preferences={nodeStylePreferences}
                onUpdate={updateNodeStylePreference}
              />
            </Card>
          </div>
        )}

        <div
          ref={canvasRef}
          className={`canvas-grid relative ${
            tool === 'select' ? 'cursor-default' :
            tool === 'relationships' ? 'cursor-pointer' :
            'cursor-crosshair'
          } ${isPanning ? 'cursor-grabbing' : ''} ${getNodeStyleClasses()}`}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={(e) => handleCanvasMouseUp(e)}
          onMouseLeave={() => handleCanvasMouseUp()}
          onContextMenu={(e) => e.preventDefault()}
          onWheel={handleWheel}
          style={{
            width: '2000px',
            height: '1500px',
            minWidth: '2000px',
            minHeight: '1500px',
            transform: `scale(${zoom})`,
            transformOrigin: zoom !== 1 ? `${zoomCenter.x}px ${zoomCenter.y}px` : 'center center',
            transition: 'transform 0.1s ease-out'
          }}
        >
          {/* Render nodes - list nodes first (bottom layer), then others */}
          {viewportNodes
            .filter(node => !node.parentId)
            .sort((a, b) => {
              // List nodes render first (bottom layer)
              if (a.type === 'list' && b.type !== 'list') return -1
              if (a.type !== 'list' && b.type === 'list') return 1
              // Then sort by zIndex if it exists, otherwise maintain order
              const aZ = a.zIndex ?? 0
              const bZ = b.zIndex ?? 0
              return aZ - bZ
            })
            .map(node => {
            const renderSettings = PerformanceOptimizer.getOptimalRenderSettings(nodes.length, isMoving)
            const nodeDetails = { showTitle: true, showContent: true } // Always show all details in fixed canvas
            const isDropTarget = dropTarget === node.id
            const childNodes = node.childIds ? nodes.filter(n => node.childIds?.includes(n.id)) : []
            
            // Render image nodes with NO container styling
            if (node.type === 'image') {
              return (
                <div
                  key={node.id}
                  data-node-id={node.id}
                  className={`absolute cursor-move ${
                    connectingFrom === node.id ? 'ring-2 ring-orange-500' : ''
                  }`}
                  style={{
                    left: getNodeDragPosition(node).x,
                    top: getNodeDragPosition(node).y,
                    width: node.width || 240,
                    height: node.height || 120,
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '0',
                    margin: '0',
                    userSelect: 'none',
                    outline: (selectedId === node.id || selectedIds.includes(node.id)) ? `3px solid ${getResizeHandleColor(node.type || 'image')}` : 'none',
                    outlineOffset: '-1px'
                  }}
                  onMouseDown={(e) => {
                    // Right click on selected node opens context menu
                    if (e.button === 2 && (selectedId === node.id || selectedIds.includes(node.id))) {
                      e.preventDefault()
                      e.stopPropagation()
                      setContextMenu({
                        node,
                        position: { x: e.clientX, y: e.clientY }
                      })
                      return
                    }

                    // Middle mouse button pans
                    if (e.button === 1) {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsPanning(true)
                      setIsMoving(true)
                      setLastPanPoint({ x: e.clientX, y: e.clientY })
                      return
                    }

                    // Only enable dragging in select mode with left click
                    if (tool === 'select' && e.button === 0) {
                      e.stopPropagation()
                      setDragStartPos({ x: e.clientX, y: e.clientY })
                      setIsDragReady(node.id)

                      const rect = canvasRef.current?.getBoundingClientRect()
                      if (rect) {
                        const mouseX = e.clientX - rect.left
                        const mouseY = e.clientY - rect.top
                        setDragOffset({
                          x: mouseX - node.x,
                          y: mouseY - node.y
                        })
                      }
                    }
                  }}
                >
                  <div className="w-full h-full flex flex-col">
                    {/* Header */}
                    {(node.settings?.show_header ?? false) && (
                      <div
                        key={`${node.id}-header`}
                        contentEditable={editingField?.nodeId === node.id && editingField?.field === 'header'}
                        suppressContentEditableWarning
                        data-content-type="header"
                        className={`px-2 py-1 text-sm font-medium border-b bg-black/10 dark:bg-white/10 ${(editingField?.nodeId === node.id && editingField?.field === 'header') ? 'cursor-text' : 'cursor-move'}`}
                        style={{
                          borderColor: getNodeBorderColor('image'),
                          color: getTextColor(getNodeColor('image', node.color, node.id)),
                          outline: 'none',
                          userSelect: (editingField?.nodeId === node.id && editingField?.field === 'header') ? 'text' : 'none'
                        }}
                        onBlur={(e) => {
                          const newTitle = e.currentTarget.textContent || ''
                          const updatedNodes = nodes.map(n =>
                            n.id === node.id ? { ...n, title: newTitle } : n
                          )
                          setNodes(updatedNodes)
                          saveToHistory(updatedNodes, connections)
                          setEditingField(null)
                          if (onSave) {
                            onSave(updatedNodes, connections)
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (editingField?.nodeId === node.id && editingField?.field === 'header') {
                            e.preventDefault()
                            e.currentTarget.focus()
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          const target = e.currentTarget
                          if (editingField?.nodeId === node.id && editingField?.field === 'header') {
                            // Already editing, just focus
                            target.focus()
                          } else {
                            // Start editing
                            setEditingField({ nodeId: node.id, field: 'header' })
                            setTimeout(() => target.focus(), 0)
                          }
                        }}
                        ref={(el) => {
                          if (el && !(editingField?.nodeId === node.id && editingField?.field === 'header')) {
                            if (el.textContent !== (node.title || 'Image Title')) {
                              el.textContent = node.title || 'Image Title'
                            }
                          }
                        }}
                      />
                    )}

                    {/* Image */}
                    {node.imageUrl ? (
                      <img
                        src={node.imageUrl}
                        alt="Image"
                        className="cursor-move flex-1"
                        style={{
                          display: 'block',
                          width: '100%',
                          objectFit: node.settings?.image_fit || 'contain',
                          border: 'none',
                          outline: 'none',
                          userSelect: 'none',
                          pointerEvents: 'none',
                          minHeight: 0
                        }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        const fileInput = document.createElement('input')
                        fileInput.type = 'file'
                        fileInput.accept = 'image/*'
                        fileInput.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              const imageUrl = event.target?.result as string
                              const updatedNodes = nodes.map(n =>
                                n.id === node.id ? { ...n, imageUrl } : n
                              )
                              setNodes(updatedNodes)
                              const tempImg = new Image()
                              tempImg.onload = () => {
                                const naturalWidth = tempImg.naturalWidth
                                const naturalHeight = tempImg.naturalHeight

                                // Implement reasonable size limits (max 400px)
                                const maxSize = 400
                                let imageWidth = naturalWidth
                                let imageHeight = naturalHeight

                                // Scale down if either dimension exceeds max size
                                if (imageWidth > maxSize || imageHeight > maxSize) {
                                  const scale = Math.min(maxSize / imageWidth, maxSize / imageHeight)
                                  imageWidth = Math.round(imageWidth * scale)
                                  imageHeight = Math.round(imageHeight * scale)
                                }
                                const resizedNodes = updatedNodes.map(n =>
                                  n.id === node.id ? {
                                    ...n,
                                    width: Math.round(imageWidth),
                                    height: Math.round(imageHeight),
                                    attributes: {
                                      ...n.attributes,
                                      originalWidth: naturalWidth,
                                      originalHeight: naturalHeight,
                                      imageWidth: imageWidth,
                                      imageHeight: imageHeight
                                    }
                                  } : n
                                )
                                setNodes(resizedNodes)
                                saveToHistory(resizedNodes, connections)

                                // Force immediate DOM update for proper sizing
                                setTimeout(() => {
                                  const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement
                                  if (nodeElement) {
                                    nodeElement.style.width = `${Math.round(imageWidth)}px`
                                    nodeElement.style.height = `${Math.round(imageHeight)}px`
                                  }
                                }, 10)
                              }
                              tempImg.src = imageUrl
                            }
                            reader.readAsDataURL(file)
                          }
                        }
                        fileInput.click()
                      }}
                    />
                  ) : (
                    <div
                      className={`flex-1 cursor-pointer flex items-center justify-center text-sm node-background ${getNodeStyleClasses()}`}
                      style={{
                        backgroundColor: getNodeColor('image', node.color, node.id),
                        border: `2px solid ${getNodeBorderColor('image')}`,
                        color: getTextColor(getNodeColor('image', node.color, node.id)),
                        userSelect: 'none',
                        minHeight: 0
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        const fileInput = document.createElement('input')
                        fileInput.type = 'file'
                        fileInput.accept = 'image/*'
                        fileInput.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              const imageUrl = event.target?.result as string
                              const updatedNodes = nodes.map(n =>
                                n.id === node.id ? { ...n, imageUrl } : n
                              )
                              setNodes(updatedNodes)
                              const tempImg = new Image()
                              tempImg.onload = () => {
                                const naturalWidth = tempImg.naturalWidth
                                const naturalHeight = tempImg.naturalHeight

                                // Implement reasonable size limits (max 400px)
                                const maxSize = 400
                                let imageWidth = naturalWidth
                                let imageHeight = naturalHeight

                                // Scale down if either dimension exceeds max size
                                if (imageWidth > maxSize || imageHeight > maxSize) {
                                  const scale = Math.min(maxSize / imageWidth, maxSize / imageHeight)
                                  imageWidth = Math.round(imageWidth * scale)
                                  imageHeight = Math.round(imageHeight * scale)
                                }
                                const resizedNodes = updatedNodes.map(n =>
                                  n.id === node.id ? {
                                    ...n,
                                    width: Math.round(imageWidth),
                                    height: Math.round(imageHeight),
                                    attributes: {
                                      ...n.attributes,
                                      originalWidth: naturalWidth,
                                      originalHeight: naturalHeight,
                                      imageWidth: imageWidth,
                                      imageHeight: imageHeight
                                    }
                                  } : n
                                )
                                setNodes(resizedNodes)
                                saveToHistory(resizedNodes, connections)

                                // Force immediate DOM update for proper sizing
                                setTimeout(() => {
                                  const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement
                                  if (nodeElement) {
                                    nodeElement.style.width = `${Math.round(imageWidth)}px`
                                    nodeElement.style.height = `${Math.round(imageHeight)}px`
                                  }
                                }, 10)
                              }
                              tempImg.src = imageUrl
                            }
                            reader.readAsDataURL(file)
                          }
                        }
                        fileInput.click()
                      }}
                    >
                      Double-click to add image
                    </div>
                  )}

                    {/* Caption */}
                    {(node.settings?.show_caption ?? false) && (
                      <div
                        key={`${node.id}-caption`}
                        contentEditable={editingField?.nodeId === node.id && editingField?.field === 'caption'}
                        suppressContentEditableWarning
                        data-content-type="caption"
                        className={`px-2 py-1 text-xs italic border-t bg-black/10 dark:bg-white/10 ${(editingField?.nodeId === node.id && editingField?.field === 'caption') ? 'cursor-text' : 'cursor-move'}`}
                        style={{
                          borderColor: getNodeBorderColor('image'),
                          color: getTextColor(getNodeColor('image', node.color, node.id)),
                          outline: 'none',
                          userSelect: (editingField?.nodeId === node.id && editingField?.field === 'caption') ? 'text' : 'none'
                        }}
                        onBlur={(e) => {
                          const newCaption = e.currentTarget.textContent || ''
                          const updatedNodes = nodes.map(n =>
                            n.id === node.id ? { ...n, content: newCaption } : n
                          )
                          setNodes(updatedNodes)
                          saveToHistory(updatedNodes, connections)
                          setEditingField(null)
                          if (onSave) {
                            onSave(updatedNodes, connections)
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (editingField?.nodeId === node.id && editingField?.field === 'caption') {
                            e.preventDefault()
                            e.currentTarget.focus()
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          const target = e.currentTarget
                          if (editingField?.nodeId === node.id && editingField?.field === 'caption') {
                            // Already editing, just focus
                            target.focus()
                          } else {
                            // Start editing
                            setEditingField({ nodeId: node.id, field: 'caption' })
                            setTimeout(() => target.focus(), 0)
                          }
                        }}
                        ref={(el) => {
                          if (el && !(editingField?.nodeId === node.id && editingField?.field === 'caption')) {
                            if (el.textContent !== (node.content || 'Caption')) {
                              el.textContent = node.content || 'Caption'
                            }
                          }
                        }}
                      />
                    )}
                  </div>

                  {/* Add corner resize handle for image nodes when selected */}
                  {selectedId === node.id && (
                    <div
                      className="absolute -bottom-1 -right-1 w-3 h-3 rounded-sm cursor-se-resize border border-background"
                      style={{ backgroundColor: getResizeHandleColor(node.type || 'text') }}
                      onMouseDown={(e) => {
                        e.preventDefault() // Prevent text selection during resize
                        e.stopPropagation()
                        // Disable text selection during resize
                        document.body.style.userSelect = 'none'
                        setResizingNode(node.id)
                        setResizeStartSize({ width: node.width || 240, height: node.height })
                        setResizeStartPos({ x: e.clientX, y: e.clientY })
                      }}
                      title="Resize image (maintains aspect ratio)"
                    />
                  )}
                </div>
              )
            }

            // Render table nodes
            if (node.type === 'table') {
              return (
                <div
                  key={node.id}
                  data-node-id={node.id}
                  className={`absolute cursor-move ${!isPanning ? 'hover:shadow-lg' : ''} shadow-sm ${
                    connectingFrom === node.id ? 'ring-2 ring-orange-500' : ''
                  }`}
                  style={{
                    left: getNodeDragPosition(node).x,
                    top: getNodeDragPosition(node).y,
                    width: node.width || 240,
                    backgroundColor: getNodeColor(node.type || 'text', node.color, node.id),
                    border: `1px solid ${getNodeBorderColor(node.type || 'text')}`,
                    padding: '0',
                    overflow: 'visible',
                    userSelect: 'none',
                    outline: (selectedId === node.id || selectedIds.includes(node.id)) ? `3px solid ${getResizeHandleColor(node.type || 'text')}` : 'none',
                    outlineOffset: '-1px'
                  }}
                  onMouseDown={(e) => {
                    // Right click on selected node opens context menu
                    if (e.button === 2 && (selectedId === node.id || selectedIds.includes(node.id))) {
                      e.preventDefault()
                      e.stopPropagation()
                      setContextMenu({
                        node,
                        position: { x: e.clientX, y: e.clientY }
                      })
                      return
                    }

                    // Middle mouse button pans
                    if (e.button === 1) {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsPanning(true)
                      setIsMoving(true)
                      setLastPanPoint({ x: e.clientX, y: e.clientY })
                      return
                    }

                    // Only enable dragging in select mode with left click
                    if (tool === 'select' && e.button === 0) {
                      e.stopPropagation()
                      setDragStartPos({ x: e.clientX, y: e.clientY })
                      setIsDragReady(node.id)

                      const rect = canvasRef.current?.getBoundingClientRect()
                      if (rect) {
                        const mouseX = e.clientX - rect.left
                        const mouseY = e.clientY - rect.top
                        setDragOffset({
                          x: mouseX - node.x,
                          y: mouseY - node.y
                        })
                      }
                    }
                  }}
                >
                  <div className="w-full h-auto">
                    <table className="w-full border-collapse">
                      {(node.settings?.show_header_row ?? true) && node.tableData && node.tableData.length > 0 && (
                        <thead>
                          <tr style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                            {Object.keys(node.tableData[0]).map((colKey, colIndex) => {
                              const colCount = Object.keys(node.tableData![0]).length
                              const colWidth = `${100 / colCount}%`
                              return (
                                <th key={colIndex} className="p-0.5 font-semibold text-left" style={{ borderColor: getNodeBorderColor(node.type || 'text'), borderWidth: '1px', borderStyle: 'solid', width: colWidth }}>
                                  <textarea
                                    value={(node.tableData![0] as any)[colKey]}
                                    onChange={(e) => {
                                      const updatedTableData = [...(node.tableData || [])]
                                      updatedTableData[0] = { ...updatedTableData[0], [colKey]: e.target.value }
                                      const updatedNodes = nodes.map(n =>
                                        n.id === node.id ? { ...n, tableData: updatedTableData } : n
                                      )
                                      setNodes(updatedNodes)
                                      saveToHistory(updatedNodes, connections)
                                    }}
                                    className="w-full bg-transparent outline-none resize-none overflow-hidden"
                                    style={{
                                      color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                                      minHeight: '20px',
                                      height: 'auto',
                                      userSelect: tool === 'textedit' ? 'text' : 'none'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    onInput={(e) => {
                                      const target = e.target as HTMLTextAreaElement
                                      target.style.height = 'auto'
                                      target.style.height = target.scrollHeight + 'px'
                                    }}
                                    rows={1}
                                  />
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {node.tableData?.map((row, rowIndex) => {
                          // Skip first row if it's being used as header
                          if ((node.settings?.show_header_row ?? true) && rowIndex === 0) {
                            return null
                          }

                          const colCount = Object.keys(row).length
                          const colWidth = `${100 / colCount}%`
                          const isAlternateRow = (node.settings?.alternate_row_colors ?? false) && rowIndex % 2 === 1

                          return (
                            <tr key={rowIndex} style={isAlternateRow ? { backgroundColor: 'rgba(0,0,0,0.03)' } : {}}>
                              {Object.keys(row).map((colKey, colIndex) => (
                                <td key={colIndex} className="p-0.5" style={{ borderColor: getNodeBorderColor(node.type || 'text'), borderWidth: '1px', borderStyle: 'solid', width: colWidth }}>
                                  <textarea
                                    value={(row as any)[colKey]}
                                    onChange={(e) => {
                                      const updatedTableData = [...(node.tableData || [])]
                                      updatedTableData[rowIndex] = { ...updatedTableData[rowIndex], [colKey]: e.target.value }
                                      const updatedNodes = nodes.map(n =>
                                        n.id === node.id ? { ...n, tableData: updatedTableData } : n
                                      )
                                      setNodes(updatedNodes)
                                      saveToHistory(updatedNodes, connections)
                                    }}
                                    className="w-full bg-transparent outline-none resize-none overflow-hidden"
                                    style={{
                                      color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                                      minHeight: '20px',
                                      height: 'auto',
                                      userSelect: tool === 'textedit' ? 'text' : 'none'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    onInput={(e) => {
                                      const target = e.target as HTMLTextAreaElement
                                      target.style.height = 'auto'
                                      target.style.height = target.scrollHeight + 'px'
                                    }}
                                    rows={1}
                                  />
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Resize handles for table nodes */}
                  {selectedId === node.id && (
                    <>
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm cursor-se-resize hover:bg-primary/80 border border-background"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setResizingNode(node.id)
                          setResizeStartSize({ width: node.width || 240, height: node.height })
                          setResizeStartPos({ x: e.clientX, y: e.clientY })
                        }}
                      />
                    </>
                  )}
                </div>
              )
            }

            // Render location nodes with character-like layout but no profile picture
            if (node.type === 'location') {
              return (
                <div
                  key={node.id}
                  data-node-id={node.id}
                  className={`absolute border-2 rounded-lg overflow-hidden cursor-move ${!isPanning ? 'hover:shadow-lg' : ''} shadow-sm node-background ${
                    connectingFrom === node.id ? 'ring-2 ring-orange-500' : ''
                  } ${
                    isDropTarget ? 'ring-2 ring-green-500 bg-green-50' : ''
                  } ${
                    renderSettings.skipAnimations ? '' : 'transition-all'
                  }`}
                  style={{
                    left: getNodeDragPosition(node).x,
                    top: getNodeDragPosition(node).y,
                    width: node.width || 240,
                    height: node.height || 120,
                    backgroundColor: getNodeColor(node.type || 'text', node.color, node.id),
                    borderColor: (selectedId === node.id || selectedIds.includes(node.id)) ? getResizeHandleColor(node.type || 'text') : getNodeBorderColor(node.type || 'text'),
                    userSelect: tool === 'textedit' ? 'auto' : 'none',
                    outline: (selectedId === node.id || selectedIds.includes(node.id)) ? `3px solid ${getResizeHandleColor(node.type || 'text')}` : 'none',
                    outlineOffset: '-3px'
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Handle double-click navigation for location nodes
                    if (onNavigateToCanvas) {
                      onNavigateToCanvas(node.id, 'location')
                    }
                  }}
                  onMouseDown={(e) => {
                    // Right click on selected node opens context menu
                    if (e.button === 2 && (selectedId === node.id || selectedIds.includes(node.id))) {
                      e.preventDefault()
                      e.stopPropagation()
                      setContextMenu({
                        node,
                        position: { x: e.clientX, y: e.clientY }
                      })
                      return
                    }

                    // Middle mouse button pans
                    if (e.button === 1) {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsPanning(true)
                      setIsMoving(true)
                      setLastPanPoint({ x: e.clientX, y: e.clientY })
                      return
                    }

                    // Only enable dragging in select mode with left click
                    if (tool === 'select' && e.button === 0) {
                      e.stopPropagation()
                      setDragStartPos({ x: e.clientX, y: e.clientY })
                      setIsDragReady(node.id)

                      const rect = canvasRef.current?.getBoundingClientRect()
                      if (rect) {
                        const mouseX = e.clientX - rect.left
                        const mouseY = e.clientY - rect.top
                        setDragOffset({
                          x: mouseX - node.x,
                          y: mouseY - node.y
                        })
                      }
                    }
                  }}
                >
                  {/* Location node layout similar to character but without profile picture */}
                  <div className="flex h-full items-center">
                    {/* Location icon area (instead of profile picture) */}
                    <div className="flex-shrink-0 mr-3 flex items-center justify-center" style={{ marginLeft: '0px' }}>
                      <MapPin className="w-6 h-6" style={{ color: getIconColor(node.type || 'location', getNodeColor(node.type || 'location', node.color, node.id)) }} />
                    </div>

                    {/* Location name */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div
                        key={`${node.id}-title`}
                        contentEditable={editingField?.nodeId === node.id && editingField?.field === 'title'}
                        suppressContentEditableWarning={true}
                        data-content-type="title"
                        className={`bg-transparent border-none outline-none font-medium text-base rounded px-1 ${(editingField?.nodeId === node.id && editingField?.field === 'title') ? 'cursor-text' : 'cursor-move'}`}
                        style={{
                          color: getTextColor(getNodeColor(node.type, node.color, node.id)),
                          caretColor: getTextColor(getNodeColor(node.type, node.color, node.id)),
                          userSelect: (editingField?.nodeId === node.id && editingField?.field === 'title') ? 'text' : 'none'
                        }}
                        onBlur={(e) => {
                          const newText = e.currentTarget.textContent || ''
                          const updatedNodes = nodes.map(n =>
                            n.id === node.id ? { ...n, text: newText } : n
                          )
                          setNodes(updatedNodes)
                          saveToHistory(updatedNodes, connections)
                          setEditingField(null)
                          if (onSave) {
                            onSave(updatedNodes, connections)
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (editingField?.nodeId === node.id && editingField?.field === 'title') {
                            e.preventDefault()
                            e.currentTarget.focus()
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          const target = e.currentTarget
                          if (editingField?.nodeId === node.id && editingField?.field === 'title') {
                            // Already editing, just focus
                            target.focus()
                          } else {
                            // Start editing
                            setEditingField({ nodeId: node.id, field: 'title' })
                            setTimeout(() => target.focus(), 0)
                          }
                        }}
                        spellCheck={false}
                        data-placeholder="Location name..."
                        ref={(el) => {
                          if (el && !(editingField?.nodeId === node.id && editingField?.field === 'title')) {
                            if (el.textContent !== (node.text || '')) {
                              el.textContent = node.text || ''
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Resize handles for location nodes */}
                  {selectedId === node.id && (
                    <>
                      {/* Right edge resize handle (width only) */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-8 rounded-sm cursor-e-resize"
                        style={{ backgroundColor: getResizeHandleColor(node.type || 'text') }}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setResizingNode(node.id)
                          setResizeStartSize({ width: node.width || 240, height: node.height })
                          setResizeStartPos({ x: e.clientX, y: e.clientY })
                        }}
                      />
                    </>
                  )}
                </div>
              )
            }

            // Render event nodes with storyboard-style layout
            if (node.type === 'event') {
              return (
                <div
                  key={node.id}
                  data-node-id={node.id}
                  className={`absolute border-2 rounded-lg overflow-hidden cursor-move ${!isPanning ? 'hover:shadow-lg' : ''} shadow-sm node-background ${
                    connectingFrom === node.id ? 'ring-2 ring-orange-500' : ''
                  } ${
                    isDropTarget ? 'ring-2 ring-green-500 bg-green-50' : ''
                  } ${
                    renderSettings.skipAnimations ? '' : 'transition-all'
                  }`}
                  style={{
                    left: getNodeDragPosition(node).x,
                    top: getNodeDragPosition(node).y,
                    width: node.width || 240,
                    height: node.height || 120,
                    backgroundColor: getNodeColor(node.type || 'text', node.color, node.id),
                    borderColor: (selectedId === node.id || selectedIds.includes(node.id)) ? getResizeHandleColor(node.type || 'text') : getNodeBorderColor(node.type || 'text'),
                    userSelect: tool === 'textedit' ? 'auto' : 'none',
                    outline: (selectedId === node.id || selectedIds.includes(node.id)) ? `3px solid ${getResizeHandleColor(node.type || 'text')}` : 'none',
                    outlineOffset: '-3px'
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Prevent double-click navigation for event nodes
                  }}
                  onMouseDown={(e) => {
                    // Right click on selected node opens context menu
                    if (e.button === 2 && (selectedId === node.id || selectedIds.includes(node.id))) {
                      e.preventDefault()
                      e.stopPropagation()
                      setContextMenu({
                        node,
                        position: { x: e.clientX, y: e.clientY }
                      })
                      return
                    }

                    // Middle mouse button pans
                    if (e.button === 1) {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsPanning(true)
                      setIsMoving(true)
                      setLastPanPoint({ x: e.clientX, y: e.clientY })
                      return
                    }

                    // Only enable dragging in select mode with left click
                    if (tool === 'select' && e.button === 0) {
                      e.stopPropagation()
                      setDragStartPos({ x: e.clientX, y: e.clientY })
                      setIsDragReady(node.id)

                      const rect = canvasRef.current?.getBoundingClientRect()
                      if (rect) {
                        const mouseX = e.clientX - rect.left
                        const mouseY = e.clientY - rect.top
                        setDragOffset({
                          x: mouseX - node.x,
                          y: mouseY - node.y
                        })
                      }
                    }
                  }}
                >
                  {/* Event node storyboard layout */}
                  <div className="flex flex-col h-full">
                    {/* Title area with icon */}
                    <div className="flex items-center px-3 py-2 bg-opacity-50 border-b" style={{
                      borderColor: getNodeBorderColor(node.type || 'event')
                    }}>
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" style={{
                        color: getNodeBorderColor(node.type || 'event')
                      }} />
                      <div
                        key={`${node.id}-title`}
                        contentEditable={editingField?.nodeId === node.id && editingField?.field === 'title'}
                        suppressContentEditableWarning={true}
                        data-content-type="title"
                        className={`bg-transparent border-none outline-none font-semibold text-sm rounded px-1 flex-1 ${(editingField?.nodeId === node.id && editingField?.field === 'title') ? 'cursor-text' : 'cursor-move'}`}
                        style={{
                          color: getTextColor(getNodeColor(node.type, node.color, node.id)),
                          caretColor: getTextColor(getNodeColor(node.type, node.color, node.id)),
                          pointerEvents: tool === 'event' ? 'none' : 'auto',
                          userSelect: (editingField?.nodeId === node.id && editingField?.field === 'title') ? 'text' : 'none'
                        }}
                        onPaste={(e) => {
                          const target = e.currentTarget as HTMLElement
                          if (target) {
                            debouncedAutoResize(node.id, target, true)
                          }
                        }}
                        onInput={(e) => {
                          const newTitle = e.currentTarget.textContent || ''
                          const updatedNodes = nodes.map(n =>
                            n.id === node.id ? { ...n, title: newTitle } : n
                          )
                          setNodes(updatedNodes)

                          // Auto-resize
                          const target = e.currentTarget as HTMLElement
                          if (target) {
                            debouncedAutoResize(node.id, target, true)
                          }
                        }}
                        onBlur={() => {
                          saveToHistory(nodes, connections)
                          setEditingField(null)
                          if (onSave) {
                            onSave(nodes, connections)
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (editingField?.nodeId === node.id && editingField?.field === 'title') {
                            e.preventDefault()
                            e.currentTarget.focus()
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          const target = e.currentTarget
                          if (editingField?.nodeId === node.id && editingField?.field === 'title') {
                            // Already editing, just focus
                            target.focus()
                          } else {
                            // Start editing
                            setEditingField({ nodeId: node.id, field: 'title' })
                            setTimeout(() => target.focus(), 0)
                          }
                        }}
                        spellCheck={false}
                        data-placeholder="Event Title"
                        ref={(el) => {
                          if (el && !(editingField?.nodeId === node.id && editingField?.field === 'title')) {
                            if (el.textContent !== (node.title || '')) {
                              el.textContent = node.title || ''
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Summary area - main content */}
                    <div className={`px-3 py-2 ${(node.settings?.expand_summary ?? true) ? 'flex-1 overflow-hidden' : 'overflow-hidden'}`}>
                      <div
                        key={`${node.id}-summary`}
                        contentEditable={editingField?.nodeId === node.id && editingField?.field === 'summary'}
                        suppressContentEditableWarning={true}
                        data-content-type="summary"
                        className={`bg-transparent border-none outline-none text-sm rounded px-1 ${(node.settings?.expand_summary ?? true) ? 'h-full' : ''} overflow-hidden leading-relaxed resize-none ${(editingField?.nodeId === node.id && editingField?.field === 'summary') ? 'cursor-text' : 'cursor-move'}`}
                        style={{
                          color: getTextColor(getNodeColor(node.type, node.color, node.id)),
                          caretColor: getTextColor(getNodeColor(node.type, node.color, node.id)),
                          pointerEvents: tool === 'event' ? 'none' : 'auto',
                          userSelect: (editingField?.nodeId === node.id && editingField?.field === 'summary') ? 'text' : 'none',
                          ...(!(node.settings?.expand_summary ?? true) && {
                            display: '-webkit-box',
                            WebkitLineClamp: '2',
                            WebkitBoxOrient: 'vertical' as const,
                            textOverflow: 'ellipsis'
                          })
                        }}
                        onPaste={(e) => {
                          const target = e.currentTarget as HTMLElement
                          if (target) {
                            debouncedAutoResize(node.id, target, false)
                          }
                        }}
                        onInput={(e) => {
                          const newSummary = e.currentTarget.textContent || ''
                          const updatedNodes = nodes.map(n =>
                            n.id === node.id ? { ...n, summary: newSummary } : n
                          )
                          setNodes(updatedNodes)

                          // Auto-resize
                          const target = e.currentTarget as HTMLElement
                          if (target) {
                            debouncedAutoResize(node.id, target, false)
                          }
                        }}
                        onBlur={() => {
                          saveToHistory(nodes, connections)
                          setEditingField(null)
                          if (onSave) {
                            onSave(nodes, connections)
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (editingField?.nodeId === node.id && editingField?.field === 'summary') {
                            e.preventDefault()
                            e.currentTarget.focus()
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          const target = e.currentTarget
                          if (editingField?.nodeId === node.id && editingField?.field === 'summary') {
                            // Already editing, just focus
                            target.focus()
                          } else {
                            // Start editing
                            setEditingField({ nodeId: node.id, field: 'summary' })
                            setTimeout(() => target.focus(), 0)
                          }
                        }}
                        spellCheck={false}
                        data-placeholder="Describe what happens in this event..."
                        ref={(el) => {
                          if (el && !(editingField?.nodeId === node.id && editingField?.field === 'summary')) {
                            if (el.textContent !== (node.summary || '')) {
                              el.textContent = node.summary || ''
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Duration input area */}
                    {(node.settings?.show_duration ?? true) && (
                      <div className="px-2 py-2 border-t" style={{
                        borderColor: getNodeBorderColor(node.type || 'event')
                      }}>
                        <div className="flex items-center gap-1">
                          <span className="text-xs whitespace-nowrap" style={{ color: getTextColor(getNodeColor(node.type, node.color, node.id)) }}>
                            Duration:
                          </span>
                          <input
                            type="text"
                            className="text-xs bg-transparent border border-gray-300 rounded px-1 py-0.5 flex-1 min-w-0 outline-none focus:border-primary"
                            style={{
                              color: getTextColor(getNodeColor(node.type, node.color, node.id)),
                              borderColor: getNodeBorderColor(node.type || 'event')
                            }}
                            value={node.durationText || ''}
                            onChange={(e) => {
                              e.stopPropagation()
                              const updatedNodes = nodes.map(n =>
                                n.id === node.id ? { ...n, durationText: e.target.value } : n
                              )
                              setNodes(updatedNodes)
                              saveToHistory(updatedNodes, connections)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation arrow for event nodes */}
                  <div className="absolute top-1 right-1 flex items-center gap-1">
                    <div
                      className="p-1 cursor-pointer ${!isPanning ? 'hover:bg-black/10' : ''} rounded"
                      onClick={async (e) => {
                        e.stopPropagation()

                        if (node.linkedCanvasId && onNavigateToCanvas) {
                          // Navigate to existing canvas
                          onNavigateToCanvas(node.linkedCanvasId, node.title || 'Event')
                        } else if (!node.linkedCanvasId && onNavigateToCanvas) {
                          // Create new linkedCanvasId
                          const linkedCanvasId = `event-canvas-${node.id}`
                          const updatedNodes = nodes.map(n =>
                            n.id === node.id ? { ...n, linkedCanvasId } : n
                          )
                          setNodes(updatedNodes)
                          saveToHistory(updatedNodes, connections)

                          // Save in background without blocking navigation
                          if (onSave) {
                            onSave(updatedNodes, connections)
                          }

                          onNavigateToCanvas(linkedCanvasId, node.title || 'Event')
                        }
                      }}
                      title="Break down event"
                    >
                      <span className="text-2xl font-bold" style={{ color: getIconColor('event', getNodeColor('event', node.color, node.id)) }}>→</span>
                    </div>
                  </div>

                  {/* Resize handles for event nodes */}
                  {selectedId === node.id && (
                    <>
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm cursor-se-resize hover:bg-primary/80 border border-background"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setResizingNode(node.id)
                          setResizeStartSize({ width: node.width || 240, height: node.height })
                          setResizeStartPos({ x: e.clientX, y: e.clientY })
                        }}
                      />
                    </>
                  )}
                </div>
              )
            }

            // Render relationship-canvas nodes
            if (node.type === 'relationship-canvas') {
              const selectedCharacters = node.relationshipData?.selectedCharacters || []

              return (
                <div
                  key={node.id}
                  data-node-id={node.id}
                  className={`absolute cursor-move ${!isPanning ? 'hover:shadow-lg' : ''} shadow-sm border-2 rounded-lg ${
                    connectingFrom === node.id ? 'ring-2 ring-orange-500' : ''
                  }`}
                  style={{
                    left: getNodeDragPosition(node).x,
                    top: getNodeDragPosition(node).y,
                    width: node.width || 240,
                    height: node.height || 120,
                    backgroundColor: getNodeColor(node.type || 'text', node.color, node.id),
                    borderColor: (selectedId === node.id || selectedIds.includes(node.id)) ? getResizeHandleColor(node.type || 'text') : getNodeBorderColor(node.type || 'text'),
                    padding: '12px',
                    overflow: 'hidden',
                    outline: (selectedId === node.id || selectedIds.includes(node.id)) ? `3px solid ${getResizeHandleColor(node.type || 'text')}` : 'none',
                    outlineOffset: '-3px'
                  }}
                  onMouseDown={(e) => {
                    // Right click on selected node opens context menu
                    if (e.button === 2 && (selectedId === node.id || selectedIds.includes(node.id))) {
                      e.preventDefault()
                      e.stopPropagation()
                      setContextMenu({
                        node,
                        position: { x: e.clientX, y: e.clientY }
                      })
                      return
                    }

                    // Middle mouse button pans
                    if (e.button === 1) {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsPanning(true)
                      setIsMoving(true)
                      setLastPanPoint({ x: e.clientX, y: e.clientY })
                      return
                    }

                    // Only enable dragging in select mode with left click
                    if (tool === 'select' && e.button === 0) {
                      e.stopPropagation()
                      setDragStartPos({ x: e.clientX, y: e.clientY })
                      setIsDragReady(node.id)

                      const rect = canvasRef.current?.getBoundingClientRect()
                      if (rect) {
                        const mouseX = e.clientX - rect.left
                        const mouseY = e.clientY - rect.top
                        setDragOffset({
                          x: mouseX - node.x,
                          y: mouseY - node.y
                        })
                      }
                    }
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      <h3 className="font-semibold text-sm" style={{ color: getNodeBorderColor(node.type || 'text') }}>{node.text}</h3>
                    </div>
                    <div className="text-xs" style={{ color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)) }}>
                      {selectedCharacters.length} character{selectedCharacters.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Character Display Area */}
                  <div
                    className="relative flex-1 rounded bg-white border border-border"
                    style={{ height: node.height - 80 }}
                    onDoubleClick={(e) => {
                      // Only open modal if clicking on empty space (not on characters)
                      if (e.target === e.currentTarget) {
                        e.preventDefault()
                        e.stopPropagation()
                        setRelationshipCanvasModal({
                          isOpen: true,
                          nodeId: node.id,
                          node: node
                        })
                      }
                    }}
                  >
                    {selectedCharacters.map(character => {
                      // Scale profile picture size based on node dimensions
                      const minSize = 60; // minimum size in pixels
                      const scaleX = node.width / 400; // scale based on default width of 400
                      const scaleY = node.height / 300; // scale based on default height of 300
                      const scale = Math.min(scaleX, scaleY, 2); // max scale of 2x
                      const profileSize = Math.max(minSize, minSize * scale);

                      return (
                        <div
                          key={character.id}
                          className={`absolute transition-transform cursor-move hover:scale-105 select-none ${
                            isConnectingMode && selectedCharacterForConnection === character.id
                              ? 'scale-110 ring-4 ring-blue-400 shadow-lg'
                              : ''
                          }`}
                          style={{
                            width: profileSize,
                            height: profileSize,
                            left: Math.min(character.position.x, node.width - profileSize - 20),
                            top: Math.min(character.position.y, node.height - profileSize - 100),
                            zIndex: 10
                          }}
                          title={character.name}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()

                            // Set dragging state to prevent canvas dragging
                            setIsDraggingCharacter(true)

                            // Always allow dragging
                            const startX = e.clientX
                            const startY = e.clientY
                            const initialX = character.position.x
                            const initialY = character.position.y
                            let hasMoved = false

                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              hasMoved = true
                              const deltaX = moveEvent.clientX - startX
                              const deltaY = moveEvent.clientY - startY

                              const newX = Math.max(0, Math.min(node.width - profileSize - 20, initialX + deltaX))
                              const newY = Math.max(0, Math.min(node.height - profileSize - 100, initialY + deltaY))

                              setNodes(prevNodes => {
                                return prevNodes.map(n =>
                                  n.id === node.id ? {
                                    ...n,
                                    relationshipData: {
                                      ...n.relationshipData,
                                      selectedCharacters: n.relationshipData?.selectedCharacters.map(char =>
                                        char.id === character.id ? { ...char, position: { x: newX, y: newY } } : char
                                      ) || [],
                                      relationships: n.relationshipData?.relationships || []
                                    }
                                  } : n
                                )
                              })
                            }

                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove)
                              document.removeEventListener('mouseup', handleMouseUp)
                              setIsDraggingCharacter(false)

                              if (hasMoved) {
                                saveToHistory(nodes, connections)
                              }
                            }

                            document.addEventListener('mousemove', handleMouseMove)
                            document.addEventListener('mouseup', handleMouseUp)
                          }}
                        >
                          <div className="w-full h-full rounded-full border-2 overflow-hidden bg-background shadow-sm" style={{ borderColor: getNodeBorderColor(node.type || 'text') }}>
                            {character.profileImageUrl ? (
                              <img
                                src={character.profileImageUrl}
                                alt={character.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User
                                  style={{
                                    width: profileSize * 0.3,
                                    height: profileSize * 0.3,
                                    color: getIconColor(node.type || 'text', getNodeColor(node.type || 'text', node.color, node.id))
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Relationship Lines SVG Overlay */}
                    <svg
                      className="absolute inset-0 pointer-events-none"
                      style={{ width: '100%', height: '100%', zIndex: 5 }}
                    >
                      {node.relationshipData?.relationships?.map(relationship => {
                        const fromChar = selectedCharacters.find(c => c.id === relationship.fromCharacterId)
                        const toChar = selectedCharacters.find(c => c.id === relationship.toCharacterId)

                        if (!fromChar || !toChar) return null

                        // Get character positions and profile sizes
                        const minSize = 60
                        const scaleX = node.width / 400
                        const scaleY = node.height / 300
                        const scale = Math.min(scaleX, scaleY, 2)
                        const profileSize = Math.max(minSize, minSize * scale)

                        const fromX = Math.min(fromChar.position.x, node.width - profileSize - 20) + profileSize / 2
                        const fromY = Math.min(fromChar.position.y, node.height - profileSize - 100) + profileSize / 2
                        const toX = Math.min(toChar.position.x, node.width - profileSize - 20) + profileSize / 2
                        const toY = Math.min(toChar.position.y, node.height - profileSize - 100) + profileSize / 2

                        // Get line color based on relationship type
                        const getLineColor = (type: string) => {
                          switch (type) {
                            case 'romantic': return '#ec4899' // pink/rose
                            case 'family': return '#3b82f6' // sky blue
                            case 'friends': return '#10b981' // emerald
                            case 'professional': return '#f59e0b' // amber
                            case 'rivals': return '#8b5cf6' // violet
                            default: return '#64748b' // slate
                          }
                        }

                        // Get line style based on strength
                        const getLineStyle = (strength: number) => {
                          switch (strength) {
                            case 3: return { strokeWidth: 4, strokeDasharray: 'none' }
                            case 2: return { strokeWidth: 2, strokeDasharray: 'none' }
                            case 1: return { strokeWidth: 1, strokeDasharray: '4,4' }
                            default: return { strokeWidth: 2, strokeDasharray: 'none' }
                          }
                        }

                        const lineColor = getLineColor(relationship.relationshipType)
                        const lineStyle = getLineStyle(relationship.strength)

                        // Check if this is a two-way relationship with different types
                        const hasTwoWay = relationship.reverseRelationshipType !== undefined
                        const reverseLineColor = hasTwoWay ? getLineColor(relationship.reverseRelationshipType!) : lineColor
                        const reverseLineStyle = hasTwoWay ? getLineStyle(relationship.reverseStrength || 2) : lineStyle

                        // Calculate parallel line positions for two-way relationships
                        const angle = Math.atan2(toY - fromY, toX - fromX)
                        const offset = hasTwoWay ? 6 : 0 // pixels offset for parallel lines (increased for better visibility)

                        const line1FromX = fromX + Math.sin(angle) * offset
                        const line1FromY = fromY - Math.cos(angle) * offset
                        const line1ToX = toX + Math.sin(angle) * offset
                        const line1ToY = toY - Math.cos(angle) * offset

                        const line2FromX = fromX - Math.sin(angle) * offset
                        const line2FromY = fromY + Math.cos(angle) * offset
                        const line2ToX = toX - Math.sin(angle) * offset
                        const line2ToY = toY + Math.cos(angle) * offset

                        // Calculate arrow positions
                        const arrowSize = 8
                        const getArrowPoints = (x1: number, y1: number, x2: number, y2: number) => {
                          const angle = Math.atan2(y2 - y1, x2 - x1)
                          const arrowLength = arrowSize
                          const arrowAngle = Math.PI / 6 // 30 degrees

                          const arrowX1 = x2 - arrowLength * Math.cos(angle - arrowAngle)
                          const arrowY1 = y2 - arrowLength * Math.sin(angle - arrowAngle)
                          const arrowX2 = x2 - arrowLength * Math.cos(angle + arrowAngle)
                          const arrowY2 = y2 - arrowLength * Math.sin(angle + arrowAngle)

                          return `${arrowX1},${arrowY1} ${x2},${y2} ${arrowX2},${arrowY2}`
                        }

                        return (
                          <g key={relationship.id}>
                            {/* Invisible wider line for easier clicking */}
                            <line
                              x1={fromX}
                              y1={fromY}
                              x2={toX}
                              y2={toY}
                              stroke="none"
                              fill="none"
                              strokeWidth={Math.max(15, lineStyle.strokeWidth + 8)}
                              className="cursor-pointer"
                              style={{ pointerEvents: 'all', opacity: 0 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                const fromCharData = selectedCharacters.find(c => c.id === relationship.fromCharacterId)
                                const toCharData = selectedCharacters.find(c => c.id === relationship.toCharacterId)

                                if (fromCharData && toCharData) {
                                  setRelationshipModal({
                                    isOpen: true,
                                    fromCharacter: { id: fromCharData.id, name: fromCharData.name },
                                    toCharacter: { id: toCharData.id, name: toCharData.name },
                                    editingRelationship: {
                                      id: relationship.id,
                                      relationshipType: relationship.relationshipType,
                                      strength: relationship.strength,
                                      label: relationship.label,
                                      notes: relationship.notes || '',
                                      reverseRelationshipType: relationship.reverseRelationshipType,
                                      reverseStrength: relationship.reverseStrength,
                                      reverseLabel: relationship.reverseLabel
                                    }
                                  })
                                }
                              }}
                              title={`Click to edit: ${relationship.label}${hasTwoWay ? ` ↔ ${relationship.reverseLabel}` : ''}`}
                            />

                            {hasTwoWay ? (
                              // Two-way relationship: draw two parallel lines with arrows
                              <>
                                {/* Forward relationship line */}
                                <line
                                  x1={line1FromX}
                                  y1={line1FromY}
                                  x2={line1ToX}
                                  y2={line1ToY}
                                  stroke={lineColor}
                                  strokeWidth={lineStyle.strokeWidth}
                                  strokeDasharray={lineStyle.strokeDasharray}
                                  opacity={0.8}
                                  className="pointer-events-none"
                                />
                                {/* Forward relationship arrow */}
                                <polyline
                                  points={getArrowPoints(line1FromX, line1FromY, line1ToX, line1ToY)}
                                  fill="none"
                                  stroke={lineColor}
                                  strokeWidth={Math.max(1, lineStyle.strokeWidth - 1)}
                                  opacity={0.8}
                                  className="pointer-events-none"
                                />

                                {/* Reverse relationship line */}
                                <line
                                  x1={line2ToX}
                                  y1={line2ToY}
                                  x2={line2FromX}
                                  y2={line2FromY}
                                  stroke={reverseLineColor}
                                  strokeWidth={reverseLineStyle.strokeWidth}
                                  strokeDasharray={reverseLineStyle.strokeDasharray}
                                  opacity={0.8}
                                  className="pointer-events-none"
                                />
                                {/* Reverse relationship arrow */}
                                <polyline
                                  points={getArrowPoints(line2ToX, line2ToY, line2FromX, line2FromY)}
                                  fill="none"
                                  stroke={reverseLineColor}
                                  strokeWidth={Math.max(1, reverseLineStyle.strokeWidth - 1)}
                                  opacity={0.8}
                                  className="pointer-events-none"
                                />
                              </>
                            ) : (
                              // Single relationship line with arrow
                              <>
                                <line
                                  x1={fromX}
                                  y1={fromY}
                                  x2={toX}
                                  y2={toY}
                                  stroke={lineColor}
                                  strokeWidth={lineStyle.strokeWidth}
                                  strokeDasharray={lineStyle.strokeDasharray}
                                  opacity={0.8}
                                  className="pointer-events-none"
                                />
                                {/* Single relationship arrow */}
                                <polyline
                                  points={getArrowPoints(fromX, fromY, toX, toY)}
                                  fill="none"
                                  stroke={lineColor}
                                  strokeWidth={Math.max(1, lineStyle.strokeWidth - 1)}
                                  opacity={0.8}
                                  className="pointer-events-none"
                                />
                              </>
                            )}
                          </g>
                        )
                      })}
                    </svg>

                    {selectedCharacters.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-white rounded">
                        <div className="text-center p-4">
                          <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-sm font-medium mb-1">Character Relationships</p>
                          <p className="text-xs opacity-75">Double-click to add characters and map their relationships</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            }

            // Render character nodes with profile picture layout
            if (node.type === 'character') {
              return (
                <div
                  key={node.id}
                  data-node-id={node.id}
                  className={`absolute border-2 rounded-lg overflow-hidden cursor-move ${!isPanning ? 'hover:shadow-lg' : ''} shadow-sm node-background ${
                    connectingFrom === node.id ? 'ring-2 ring-orange-500' : ''
                  } ${
                    isDropTarget ? 'ring-2 ring-green-500 bg-green-50' : ''
                  } ${
                    renderSettings.skipAnimations ? '' : 'transition-all'
                  }`}
                  style={{
                    left: getNodeDragPosition(node).x,
                    top: getNodeDragPosition(node).y,
                    width: node.width || 240,
                    height: node.height || 120,
                    backgroundColor: getNodeColor(node.type || 'text', node.color, node.id),
                    borderColor: (selectedId === node.id || selectedIds.includes(node.id)) ? getResizeHandleColor(node.type || 'text') : getNodeBorderColor(node.type || 'text'),
                    userSelect: tool === 'textedit' ? 'auto' : 'none',
                    outline: (selectedId === node.id || selectedIds.includes(node.id)) ? `3px solid ${getResizeHandleColor(node.type || 'text')}` : 'none',
                    outlineOffset: '-3px'
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Explicitly prevent any double-click navigation for character nodes
                  }}
                  onMouseDown={(e) => {
                    // Right click on selected node opens context menu
                    if (e.button === 2 && (selectedId === node.id || selectedIds.includes(node.id))) {
                      e.preventDefault()
                      e.stopPropagation()
                      setContextMenu({
                        node,
                        position: { x: e.clientX, y: e.clientY }
                      })
                      return
                    }

                    // Middle mouse button pans
                    if (e.button === 1) {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsPanning(true)
                      setIsMoving(true)
                      setLastPanPoint({ x: e.clientX, y: e.clientY })
                      return
                    }

                    // Only enable dragging in select mode with left click
                    if (tool === 'select' && e.button === 0) {
                      e.stopPropagation()
                      setDragStartPos({ x: e.clientX, y: e.clientY })
                      setIsDragReady(node.id)

                      const rect = canvasRef.current?.getBoundingClientRect()
                      if (rect) {
                        const mouseX = e.clientX - rect.left
                        const mouseY = e.clientY - rect.top
                        setDragOffset({
                          x: mouseX - node.x,
                          y: mouseY - node.y
                        })
                      }
                    }
                  }}
                >
                  {/* Character node layout with profile picture */}
                  <div className="flex h-full items-center">
                    {/* Profile picture area */}
                    {(node.settings?.show_profile_picture ?? true) && (
                      <div
                        className={`profile-picture-area flex-shrink-0 w-14 h-14 mr-3 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity border-2 ${
                          node.settings?.picture_shape === 'circle' ? 'rounded-full' :
                          node.settings?.picture_shape === 'square' ? 'rounded-none' :
                          'rounded-md'
                        }`}
                        style={{
                          marginLeft: '-5px',
                          backgroundColor: getNodeColor(node.type || 'character', node.color, node.id),
                          borderColor: getNodeBorderColor(node.type || 'character')
                        }}
                      onClick={(e) => {
                        console.log('Character profile picture clicked (standalone)')
                        e.stopPropagation()
                        // Create file input for profile picture upload
                        const fileInput = document.createElement('input')
                        fileInput.type = 'file'
                        fileInput.accept = 'image/*'
                        fileInput.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              const imageUrl = e.target?.result as string
                              // Load image to get dimensions
                              const img = new Image()
                              img.onload = () => {
                                // Open crop modal with image dimensions
                                setCropModal({
                                  isOpen: true,
                                  nodeId: node.id,
                                  imageUrl: imageUrl,
                                  imageWidth: img.width,
                                  imageHeight: img.height
                                })
                                // Initialize crop area to center square
                                const size = Math.min(img.width, img.height)
                                const x = (img.width - size) / 2
                                const y = (img.height - size) / 2
                                setCropData({ x, y, width: size, height: size })
                              }
                              img.src = imageUrl
                            }
                            reader.readAsDataURL(file)
                          }
                        }
                        fileInput.click()
                      }}
                    >
                      {node.profileImageUrl ? (
                        <img
                          src={node.profileImageUrl}
                          alt="Character profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8" style={{ color: getIconColor(node.type || 'character', getNodeColor(node.type || 'character', node.color, node.id)) }} />
                      )}
                      </div>
                    )}

                    {/* Character name area */}
                    <div className="flex-1 pr-8 min-w-0 flex items-center">
                      <div
                        key={`${node.id}-title`}
                        contentEditable={editingField?.nodeId === node.id && editingField?.field === 'title'}
                        suppressContentEditableWarning={true}
                        data-content-type="title"
                        className={`font-medium text-sm outline-none bg-transparent border-none rounded px-1 w-full ${(editingField?.nodeId === node.id && editingField?.field === 'title') ? 'cursor-text' : 'cursor-move'}`}
                        style={{
                          color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                          caretColor: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          userSelect: (editingField?.nodeId === node.id && editingField?.field === 'title') ? 'text' : 'none'
                        }}
                        onBlur={(e) => {
                          const newText = e.currentTarget.textContent || ''
                          const updatedNodes = nodes.map(n =>
                            n.id === node.id ? { ...n, text: newText } : n
                          )
                          setNodes(updatedNodes)
                          saveToHistory(updatedNodes, connections)
                          setEditingField(null)
                          if (onSave) {
                            onSave(updatedNodes, connections)
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (editingField?.nodeId === node.id && editingField?.field === 'title') {
                            e.preventDefault()
                            e.currentTarget.focus()
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          const target = e.currentTarget
                          if (editingField?.nodeId === node.id && editingField?.field === 'title') {
                            // Already editing, just focus
                            target.focus()
                          } else {
                            // Start editing
                            setEditingField({ nodeId: node.id, field: 'title' })
                            setTimeout(() => target.focus(), 0)
                          }
                        }}
                        spellCheck={false}
                        data-placeholder="Character name..."
                        ref={(el) => {
                          if (el && !(editingField?.nodeId === node.id && editingField?.field === 'title')) {
                            if (el.textContent !== (node.text || '')) {
                              el.textContent = node.text || ''
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Navigation arrow - clickable */}
                    <div
                      className="absolute bottom-1 right-1 p-1 cursor-pointer ${!isPanning ? 'hover:bg-black/10' : ''} rounded"
                      onClick={async (e) => {
                        e.stopPropagation()
                        // Single click navigation for character nodes
                        if (node.linkedCanvasId && onNavigateToCanvas) {
                            onNavigateToCanvas(node.linkedCanvasId, node.text)
                        } else if (!node.linkedCanvasId && onNavigateToCanvas) {
                          const linkedCanvasId = `character-canvas-${node.id}`
                          const updatedNodes = nodes.map(n =>
                            n.id === node.id ? { ...n, linkedCanvasId } : n
                          )
                          setNodes(updatedNodes)
                          saveToHistory(updatedNodes, connections)

                          // Save in background without blocking navigation
                          if (onSave) {
                            onSave(updatedNodes, connections)
                          }

                          onNavigateToCanvas(linkedCanvasId, node.text)
                        }
                      }}
                      title="Open character development"
                    >
                      <span className="text-2xl font-bold" style={{ color: getIconColor('character', getNodeColor('character', node.color, node.id)) }}>→</span>
                    </div>
                  </div>

                  {/* Resize handles for character nodes */}
                  {selectedId === node.id && (
                    <>
                      {/* Right edge resize handle (width only) */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-8 rounded-sm cursor-e-resize"
                        style={{ backgroundColor: getResizeHandleColor(node.type || 'text') }}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setResizingNode(node.id)
                          setResizeStartSize({ width: node.width || 240, height: node.height })
                          setResizeStartPos({ x: e.clientX, y: e.clientY })
                        }}
                      />
                    </>
                  )}
                </div>
              )
            }

            // Render all other node types with standard container
            return (
            <div
              key={node.id}
              data-node-id={node.id}
              draggable={node.type !== 'list'}
              className={`absolute border-2 rounded-lg p-3 cursor-move ${!isPanning ? 'hover:shadow-lg' : ''} shadow-sm node-background ${
                connectingFrom === node.id ? 'ring-2 ring-orange-500' : ''
              } ${
                isDropTarget ? 'ring-2 ring-green-500 bg-green-50' : ''
              } ${
                renderSettings.skipAnimations ? '' : 'transition-all'
              }`}
              style={{
                left: getNodeDragPosition(node).x,
                top: getNodeDragPosition(node).y,
                width: node.width || 240,
                height: node.height || 120,
                backgroundColor: getNodeColor(node.type || 'text', node.color, node.id),
                borderColor: (selectedId === node.id || selectedIds.includes(node.id)) ? getResizeHandleColor(node.type || 'text') : getNodeBorderColor(node.type || 'text'),
                userSelect: tool === 'textedit' ? 'auto' : 'none',
                outline: (selectedId === node.id || selectedIds.includes(node.id)) ? `3px solid ${getResizeHandleColor(node.type || 'text')}` : 'none',
                outlineOffset: '-3px'
              }}
              onDoubleClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Explicitly prevent any double-click navigation for folder nodes
              }}
              onDragStart={(e) => handleDragStart(e, node.id)}
              onDragOver={(e) => handleDragOver(e, node.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, node.id)}
              onMouseDown={(e) => {
                // Right click on selected node opens context menu
                if (e.button === 2 && (selectedId === node.id || selectedIds.includes(node.id))) {
                  e.preventDefault()
                  e.stopPropagation()
                  setContextMenu({
                    node,
                    position: { x: e.clientX, y: e.clientY }
                  })
                  return
                }

                // Middle mouse button pans
                if (e.button === 1) {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsPanning(true)
                  setIsMoving(true)
                  setLastPanPoint({ x: e.clientX, y: e.clientY })
                  return
                }

                // Right click on unselected node pans
                if (e.button === 2) {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsPanning(true)
                  setIsMoving(true)
                  setLastPanPoint({ x: e.clientX, y: e.clientY })
                  return
                }

                // Only enable dragging in select mode with left click
                if (tool === 'select' && e.button === 0) {
                  e.stopPropagation()
                  setDragStartPos({ x: e.clientX, y: e.clientY })
                  setIsDragReady(node.id)

                  const rect = canvasRef.current?.getBoundingClientRect()
                  if (rect) {
                    const mouseX = e.clientX - rect.left
                    const mouseY = e.clientY - rect.top
                    setDragOffset({
                      x: mouseX - node.x,
                      y: mouseY - node.y
                    })
                  }
                }
              }}
            >
              {/* Extended draggable border strips for easier grabbing - only around edges */}
              {/* Top border strip */}
              <div className="absolute left-0 right-0 cursor-move" style={{ top: '-8px', height: '14px', pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  setInteractionMode('moving')
                  e.preventDefault()
                  e.stopPropagation()
                  setDragStartPos({ x: e.clientX, y: e.clientY })
                  setIsDragReady(node.id)
                  const rect = canvasRef.current?.getBoundingClientRect()
                  if (rect) {
                    setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y })
                  }
                }}
              />
              {/* Right border strip */}
              <div className="absolute top-0 bottom-0 cursor-move" style={{ right: '-8px', width: '14px', pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  setInteractionMode('moving')
                  e.preventDefault()
                  e.stopPropagation()
                  setDragStartPos({ x: e.clientX, y: e.clientY })
                  setIsDragReady(node.id)
                  const rect = canvasRef.current?.getBoundingClientRect()
                  if (rect) {
                    setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y })
                  }
                }}
              />
              {/* Bottom border strip */}
              <div className="absolute left-0 right-0 cursor-move" style={{ bottom: '-8px', height: '14px', pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  setInteractionMode('moving')
                  e.preventDefault()
                  e.stopPropagation()
                  setDragStartPos({ x: e.clientX, y: e.clientY })
                  setIsDragReady(node.id)
                  const rect = canvasRef.current?.getBoundingClientRect()
                  if (rect) {
                    setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y })
                  }
                }}
              />
              {/* Left border strip */}
              <div className="absolute top-0 bottom-0 cursor-move" style={{ left: '-8px', width: '14px', pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  setInteractionMode('moving')
                  e.preventDefault()
                  e.stopPropagation()
                  setDragStartPos({ x: e.clientX, y: e.clientY })
                  setIsDragReady(node.id)
                  const rect = canvasRef.current?.getBoundingClientRect()
                  if (rect) {
                    setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y })
                  }
                }}
              />

              {/* Node header - skip for image nodes as they have integrated headers */}
              {node.type !== 'image' && (
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div style={{ color: getIconColor(node.type || 'text', getNodeColor(node.type || 'text', node.color, node.id)), userSelect: 'none' }}>
                    {getNodeIcon(node.type, node)}
                  </div>
                  <div
                    key={`${node.id}-title`}
                    contentEditable={editingField?.nodeId === node.id && editingField?.field === 'title'}
                    suppressContentEditableWarning={true}
                    data-content-type="title"
                    className={`flex-1 font-medium text-sm outline-none bg-transparent border-none rounded px-1 ${(editingField?.nodeId === node.id && editingField?.field === 'title') ? 'cursor-text' : 'cursor-move'}`}
                    style={{
                      color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                      caretColor: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                      pointerEvents: tool === 'event' ? 'none' : 'auto',
                      userSelect: (editingField?.nodeId === node.id && editingField?.field === 'title') ? 'text' : 'none'
                    }}
                    onBlur={(e) => {
                      console.log('💾 onBlur triggered for node title:', node.id, 'New text:', e.currentTarget.textContent)
                      const newText = e.currentTarget.textContent || ''
                      const updatedNodes = nodes.map(n =>
                        n.id === node.id ? { ...n, text: newText } : n
                      )
                      setNodes(updatedNodes)
                      saveToHistory(updatedNodes, connections)
                      setEditingField(null)
                      if (onSave) {
                        console.log('💾 Calling onSave immediately')
                        onSave(updatedNodes, connections)
                      } else {
                        console.log('🔴 onSave not available!')
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (editingField?.nodeId === node.id && editingField?.field === 'title') {
                        e.preventDefault()
                        e.currentTarget.focus()
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      const target = e.currentTarget
                      if (editingField?.nodeId === node.id && editingField?.field === 'title') {
                        // Already editing, just focus
                        target.focus()
                      } else {
                        // Start editing
                        setEditingField({ nodeId: node.id, field: 'title' })
                        setTimeout(() => target.focus(), 0)
                      }
                    }}
                    spellCheck={false}
                    ref={(el) => {
                      if (el && !(editingField?.nodeId === node.id && editingField?.field === 'title')) {
                        if (el.textContent !== (node.text || '')) {
                          el.textContent = node.text || ''
                        }
                      }
                    }}
                  />
                </div>
              </div>
              )}

              {/* Node content */}
              {nodeDetails.showContent && (
                <div className="text-xs overflow-hidden">
                {node.type === 'list' ? (
                  // List container content
                  <div className="space-y-2">
                    {childNodes.length > 0 ? (
                      <div
                        className={
                          node.layoutMode === 'two-columns'
                            ? 'grid grid-cols-2 gap-2'
                            : node.layoutMode === 'grid'
                            ? 'grid grid-cols-3 gap-2'
                            : 'space-y-1'
                        }
                      >
                        {(() => {
                          // Sort child nodes based on auto_sort setting
                          let sortedChildren = [...childNodes]
                          const autoSort = node.settings?.auto_sort || 'manual'

                          if (autoSort === 'alphabetical') {
                            sortedChildren.sort((a, b) => {
                              const aText = a.text || a.title || ''
                              const bText = b.text || b.title || ''
                              return aText.localeCompare(bText)
                            })
                          } else if (autoSort === 'by-type') {
                            sortedChildren.sort((a, b) => {
                              const aType = a.type || 'text'
                              const bType = b.type || 'text'
                              return aType.localeCompare(bType)
                            })
                          }

                          return sortedChildren
                        })().map((childNode, index) => {
                          // Determine height based on node type
                          const childHeight = childNode.type === 'character' ? '72px' : childNode.type === 'event' ? '100px' : '140px'

                          return (
                          <div
                            key={childNode.id}
                            className="mb-2 last:mb-0"
                            style={{
                              width: '100%',
                              height: childHeight
                            }}
                          >
                            {/* Render based on node type */}
                            <div
                              className="relative bg-card rounded-lg border-2 cursor-move transition-all duration-200 w-full h-full node-background"
                              style={{
                                borderColor: getNodeBorderColor(childNode.type || 'folder', true),
                                backgroundColor: getNodeColor(childNode.type || 'folder', childNode.color, childNode.id, false),
                              }}
              onClick={(e) => {
                                e.stopPropagation()
                                // In select mode, clicking child selects the parent list node
                                if (tool === 'select') {
                                  setSelectedId(node.id)
                                } else {
                                  setSelectedId(childNode.id)
                                }
                              }}
                              onDoubleClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // Explicitly prevent any double-click navigation for child folder nodes in lists
                              }}
                              onMouseDown={(e) => {
                                // Right click on selected node opens context menu
                                if (e.button === 2 && (selectedId === childNode.id || selectedIds.includes(childNode.id))) {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setContextMenu({
                                    node: childNode,
                                    position: { x: e.clientX, y: e.clientY }
                                  })
                                  return
                                }

                                // Middle mouse button pans
                                if (e.button === 1) {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setIsPanning(true)
                                  setIsMoving(true)
                                  setLastPanPoint({ x: e.clientX, y: e.clientY })
                                  return
                                }

                                // Only enable dragging in select mode with left click
                                if (tool === 'select' && e.button === 0) {
                                  e.stopPropagation()
                                  setDragStartPos({ x: e.clientX, y: e.clientY })
                                  // In select mode, drag the parent list node instead of child
                                  setIsDragReady(node.id)

                                  const rect = canvasRef.current?.getBoundingClientRect()
                                  if (rect) {
                                    const mouseX = e.clientX - rect.left
                                    const mouseY = e.clientY - rect.top
                                    setDragOffset({
                                      x: mouseX - node.x,
                                      y: mouseY - node.y
                                    })
                                  }
                                }
                              }}
                            >
                              {/* Render character nodes with profile picture layout */}
                              {childNode.type === 'character' ? (
                                <>
                                  <div className="flex items-center gap-3 p-2 h-full">
                                    {/* Profile picture */}
                                    <div
                                      className="profile-picture-area flex-shrink-0 w-12 h-12 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2"
                                      style={{
                                        backgroundColor: getNodeColor(childNode.type || 'character', childNode.color, childNode.id, false),
                                        borderColor: getNodeBorderColor(childNode.type || 'character', true)
                                      }}
                                      onClick={(e) => {
                                        console.log('Character profile picture clicked (in list)')
                                        e.stopPropagation()
                                        const fileInput = document.createElement('input')
                                        fileInput.type = 'file'
                                        fileInput.accept = 'image/*'
                                        fileInput.onchange = (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0]
                                          if (file) {
                                            const reader = new FileReader()
                                            reader.onload = (e) => {
                                              const imageUrl = e.target?.result as string
                                              // Load image to get dimensions
                                              const img = new Image()
                                              img.onload = () => {
                                                // Open crop modal with image dimensions
                                                setCropModal({
                                                  isOpen: true,
                                                  nodeId: childNode.id,
                                                  imageUrl: imageUrl,
                                                  imageWidth: img.width,
                                                  imageHeight: img.height
                                                })
                                                // Initialize crop area to center square
                                                const size = Math.min(img.width, img.height)
                                                const x = (img.width - size) / 2
                                                const y = (img.height - size) / 2
                                                setCropData({ x, y, width: size, height: size })
                                              }
                                              img.src = imageUrl
                                            }
                                            reader.readAsDataURL(file)
                                          }
                                        }
                                        fileInput.click()
                                      }}
                                      title="Click to upload profile picture"
                                    >
                                      {childNode.profileImageUrl ? (
                                        <img
                                          src={childNode.profileImageUrl}
                                          alt="Profile"
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <User className="w-6 h-6" style={{ color: getIconColor(childNode.type || 'character', getNodeColor(childNode.type || 'character', childNode.color, childNode.id), true) }} />
                                        </div>
                                      )}
                                    </div>

                                    {/* Character name */}
                                    <div className="flex-1 min-w-0 flex items-center">
                                      <div
                                        key={`${childNode.id}-title`}
                                        contentEditable={editingField?.nodeId === childNode.id && editingField?.field === 'title'}
                                        suppressContentEditableWarning={true}
                                        data-content-type="title"
                                        className={`flex-1 bg-transparent border-none outline-none font-medium text-sm rounded px-1 whitespace-nowrap overflow-hidden ${(editingField?.nodeId === childNode.id && editingField?.field === 'title') ? 'cursor-text' : 'cursor-move'}`}
                                        style={{
                                          color: getTextColor(getNodeColor(childNode.type, childNode.color, childNode.id), true),
                                          caretColor: getTextColor(getNodeColor(childNode.type, childNode.color, childNode.id), true),
                                          userSelect: (editingField?.nodeId === childNode.id && editingField?.field === 'title') ? 'text' : 'none'
                                        }}
                                        onBlur={(e) => {
                                          const newText = e.currentTarget.textContent || ''
                                          const updatedNodes = nodes.map(n =>
                                            n.id === childNode.id ? { ...n, text: newText } : n
                                          )
                                          setNodes(updatedNodes)
                                          saveToHistory(updatedNodes, connections)
                                          setEditingField(null)
                                          if (onSave) {
                                            onSave(updatedNodes, connections)
                                          }
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (editingField?.nodeId === childNode.id && editingField?.field === 'title') {
                                            e.preventDefault()
                                            e.currentTarget.focus()
                                          }
                                        }}
                                        onDoubleClick={(e) => {
                                          e.stopPropagation()
                                          const target = e.currentTarget
                                          if (editingField?.nodeId === childNode.id && editingField?.field === 'title') {
                                            // Already editing, just focus
                                            target.focus()
                                          } else {
                                            // Start editing
                                            setEditingField({ nodeId: childNode.id, field: 'title' })
                                            setTimeout(() => target.focus(), 0)
                                          }
                                        }}
                                        spellCheck={false}
                                        data-placeholder="Character name..."
                                        ref={(el) => {
                                          if (el && !(editingField?.nodeId === childNode.id && editingField?.field === 'title')) {
                                            if (el.textContent !== (childNode.text || '')) {
                                              el.textContent = childNode.text || ''
                                            }
                                          }
                                        }}
                                      />
                                    </div>

                                    {/* Remove button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeFromContainer(childNode.id)
                                      }}
                                      className="w-6 h-6 flex items-center justify-center rounded flex-shrink-0"
                                      style={{ color: getIconColor(childNode.type || 'character', getNodeColor(childNode.type || 'character', childNode.color, childNode.id), true) }}
                                      title="Remove from container"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>

                                    {/* Navigation arrow */}
                                    <div
                                      className="flex-shrink-0 p-1 cursor-pointer ${!isPanning ? 'hover:bg-black/10' : ''} rounded"
                                      onClick={async (e) => {
                                        e.stopPropagation()

                                        console.log('=== CHARACTER NAVIGATION FROM LIST DEBUG ===')
                                        console.log('childNode from render:', childNode)

                                        // CRITICAL: Get the most up-to-date node from the nodes array
                                        const currentNode = nodes.find(n => n.id === childNode.id)
                                        console.log('currentNode from nodes array:', currentNode)

                                        if (!currentNode || !onNavigateToCanvas) {
                                          console.log('ABORT: No current node or no navigate callback')
                                          return
                                        }

                                        const nodeTitle = currentNode.text || 'Character'

                                        // Use currentNode for linkedCanvasId, not childNode!
                                        if (currentNode.linkedCanvasId) {
                                          console.log('EXISTING linkedCanvasId found:', currentNode.linkedCanvasId)
                                          colorContext.setCurrentFolderId(currentNode.id)
                                          console.log('Navigating to EXISTING canvas:', currentNode.linkedCanvasId, 'with title:', nodeTitle)
                                          onNavigateToCanvas(currentNode.linkedCanvasId, nodeTitle)
                                        } else {
                                          // Create new linkedCanvasId
                                          const linkedCanvasId = `character-canvas-${currentNode.id}`
                                          console.log('Creating NEW linkedCanvasId:', linkedCanvasId)

                                          const updatedNodes = nodes.map(n =>
                                            n.id === currentNode.id ? { ...n, linkedCanvasId } : n
                                          )

                                          console.log('Updated node in array:', updatedNodes.find(n => n.id === currentNode.id))

                                          // Update state
                                          setNodes(updatedNodes)
                                          saveToHistory(updatedNodes, connections)

                                          // Save in background without blocking navigation
                                          if (onSave) {
                                            onSave(updatedNodes, connections)
                                          }

                                          colorContext.setCurrentFolderId(currentNode.id)
                                          console.log('Navigating to NEW canvas:', linkedCanvasId, 'with title:', nodeTitle)
                                          onNavigateToCanvas(linkedCanvasId, nodeTitle)
                                        }
                                        console.log('=== END DEBUG ===')
                                      }}
                                      title="Open character development"
                                    >
                                      <span className="text-2xl font-bold" style={{ color: getIconColor('character', getNodeColor('character', childNode.color, childNode.id), true) }}>→</span>
                                    </div>
                                  </div>
                                </>
                              ) : childNode.type === 'location' ? (
                                <>
                                  <div className="flex items-center gap-3 p-2 h-full">
                                    {/* Location icon */}
                                    <div className="flex-shrink-0 flex items-center justify-center">
                                      <MapPin className="w-6 h-6" style={{ color: getIconColor(childNode.type || 'location', getNodeColor(childNode.type || 'location', childNode.color, childNode.id), true) }} />
                                    </div>

                                    {/* Location name */}
                                    <div className="flex-1 min-w-0 flex items-center">
                                      <div
                                        key={`${childNode.id}-title`}
                                        contentEditable={editingField?.nodeId === childNode.id && editingField?.field === 'title'}
                                        suppressContentEditableWarning={true}
                                        data-content-type="title"
                                        className={`flex-1 bg-transparent border-none outline-none font-medium text-sm rounded px-1 whitespace-nowrap overflow-hidden ${(editingField?.nodeId === childNode.id && editingField?.field === 'title') ? 'cursor-text' : 'cursor-move'}`}
                                        style={{
                                          color: getTextColor(getNodeColor(childNode.type, childNode.color, childNode.id), true),
                                          caretColor: getTextColor(getNodeColor(childNode.type, childNode.color, childNode.id), true),
                                          userSelect: (editingField?.nodeId === childNode.id && editingField?.field === 'title') ? 'text' : 'none'
                                        }}
                                        onBlur={(e) => {
                                          const newText = e.currentTarget.textContent || ''
                                          const updatedNodes = nodes.map(n =>
                                            n.id === childNode.id ? { ...n, text: newText } : n
                                          )
                                          setNodes(updatedNodes)
                                          saveToHistory(updatedNodes, connections)
                                          setEditingField(null)
                                          if (onSave) {
                                            onSave(updatedNodes, connections)
                                          }
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (editingField?.nodeId === childNode.id && editingField?.field === 'title') {
                                            e.preventDefault()
                                            e.currentTarget.focus()
                                          }
                                        }}
                                        onDoubleClick={(e) => {
                                          e.stopPropagation()
                                          const target = e.currentTarget
                                          if (editingField?.nodeId === childNode.id && editingField?.field === 'title') {
                                            // Already editing, just focus
                                            target.focus()
                                          } else {
                                            // Start editing
                                            setEditingField({ nodeId: childNode.id, field: 'title' })
                                            setTimeout(() => target.focus(), 0)
                                          }
                                        }}
                                        spellCheck={false}
                                        data-placeholder="Location name..."
                                        ref={(el) => {
                                          if (el && !(editingField?.nodeId === childNode.id && editingField?.field === 'title')) {
                                            if (el.textContent !== (childNode.text || '')) {
                                              el.textContent = childNode.text || ''
                                            }
                                          }
                                        }}
                                      />
                                    </div>

                                    {/* Remove button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeFromContainer(childNode.id)
                                      }}
                                      className="w-6 h-6 flex items-center justify-center rounded flex-shrink-0"
                                      style={{ color: getIconColor(childNode.type || 'location', getNodeColor(childNode.type || 'location', childNode.color, childNode.id), true) }}
                                      title="Remove from container"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>

                                    {/* Navigation arrow */}
                                    <div
                                      className="flex-shrink-0 p-1 cursor-pointer ${!isPanning ? 'hover:bg-black/10' : ''} rounded"
                                      onClick={async (e) => {
                                        e.stopPropagation()

                                        const currentNode = nodes.find(n => n.id === childNode.id)
                                        if (!currentNode || !onNavigateToCanvas) {
                                          return
                                        }

                                        const nodeTitle = currentNode.text || 'Location'

                                        if (currentNode.linkedCanvasId) {
                                          colorContext.setCurrentFolderId(currentNode.id)
                                          onNavigateToCanvas(currentNode.linkedCanvasId, nodeTitle)
                                        } else {
                                          // Create new linkedCanvasId
                                          const linkedCanvasId = `location-canvas-${currentNode.id}`

                                          const updatedNodes = nodes.map(n =>
                                            n.id === currentNode.id ? { ...n, linkedCanvasId } : n
                                          )

                                          setNodes(updatedNodes)
                                          saveToHistory(updatedNodes, connections)

                                          // Save in background without blocking navigation
                                          if (onSave) {
                                            onSave(updatedNodes, connections)
                                          }

                                          colorContext.setCurrentFolderId(currentNode.id)

                                          onNavigateToCanvas(linkedCanvasId, nodeTitle)
                                        }
                                      }}
                                      title="Open location details"
                                    >
                                      <span className="text-lg font-bold" style={{ color: getIconColor('location', getNodeColor('location', childNode.color, childNode.id), true) }}>→</span>
                                    </div>
                                  </div>
</>
                              ) : childNode.type === 'event' ? (
                                <>
                                  <div className="flex flex-col h-full">
                                    {/* Event title with icon */}
                                    <div className="flex items-center gap-2 p-2 border-b" style={{
                                      borderColor: getNodeBorderColor(childNode.type || 'event', true)
                                    }}>
                                      <Calendar className="w-4 h-4 flex-shrink-0" style={{
                                        color: getIconColor(childNode.type || 'event', getNodeColor(childNode.type || 'event', childNode.color, childNode.id), true)
                                      }} />
                                      <div
                                        key={`${childNode.id}-title`}
                                        contentEditable={editingField?.nodeId === childNode.id && editingField?.field === 'title'}
                                        suppressContentEditableWarning={true}
                                        data-content-type="title"
                                        className={`flex-1 bg-transparent border-none outline-none font-medium text-sm rounded px-1 whitespace-nowrap overflow-hidden ${(editingField?.nodeId === childNode.id && editingField?.field === 'title') ? 'cursor-text' : 'cursor-move'}`}
                                        style={{
                                          color: getTextColor(getNodeColor(childNode.type, childNode.color, childNode.id), true),
                                          caretColor: getTextColor(getNodeColor(childNode.type, childNode.color, childNode.id), true),
                                          userSelect: (editingField?.nodeId === childNode.id && editingField?.field === 'title') ? 'text' : 'none'
                                        }}
                                        onBlur={(e) => {
                                          const newTitle = e.currentTarget.textContent || ''
                                          const updatedNodes = nodes.map(n =>
                                            n.id === childNode.id ? { ...n, title: newTitle } : n
                                          )
                                          setNodes(updatedNodes)
                                          saveToHistory(updatedNodes, connections)
                                          setEditingField(null)
                                          if (onSave) {
                                            onSave(updatedNodes, connections)
                                          }
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (editingField?.nodeId === childNode.id && editingField?.field === 'title') {
                                            e.preventDefault()
                                            e.currentTarget.focus()
                                          }
                                        }}
                                        onDoubleClick={(e) => {
                                          e.stopPropagation()
                                          const target = e.currentTarget
                                          if (editingField?.nodeId === childNode.id && editingField?.field === 'title') {
                                            // Already editing, just focus
                                            target.focus()
                                          } else {
                                            // Start editing
                                            setEditingField({ nodeId: childNode.id, field: 'title' })
                                            setTimeout(() => target.focus(), 0)
                                          }
                                        }}
                                        spellCheck={false}
                                        data-placeholder="Event Title"
                                        ref={(el) => {
                                          if (el && !(editingField?.nodeId === childNode.id && editingField?.field === 'title')) {
                                            if (el.textContent !== (childNode.title || 'New Event')) {
                                              el.textContent = childNode.title || 'New Event'
                                            }
                                          }
                                        }}
                                      />

                                      {/* Remove button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          removeFromContainer(childNode.id)
                                        }}
                                        className="w-6 h-6 flex items-center justify-center rounded flex-shrink-0"
                                        style={{ color: getIconColor(childNode.type || 'event', getNodeColor(childNode.type || 'event', childNode.color, childNode.id), true) }}
                                        title="Remove from container"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Event summary area */}
                                    <div className="flex-1 px-2 py-1 text-xs leading-relaxed overflow-hidden">
                                      <div
                                        className="line-clamp-2"
                                        style={{ color: getTextColor(getNodeColor(childNode.type, childNode.color, childNode.id), true) }}
                                      >
                                        {childNode.summary || 'Event summary...'}
                                      </div>
                                    </div>

                                    {/* Duration display */}
                                    <div className="px-2 py-1 border-t text-center" style={{
                                      borderColor: getNodeBorderColor(childNode.type || 'event', true)
                                    }}>
                                      <div
                                        className="text-xs font-medium"
                                        style={{ color: getTextColor(getNodeColor(childNode.type, childNode.color, childNode.id), true) }}
                                      >
                                        {childNode.durationText || ''}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Header with title and controls for folder nodes */}
                                  <div className="flex items-center justify-between p-2 pb-1">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div style={{ color: getIconColor(childNode.type || 'folder', getNodeColor(childNode.type || 'folder', childNode.color, childNode.id), true) }}>
                                    {getNodeIcon(childNode.type, childNode)}
                                  </div>
                                  <div
                                    key={`${childNode.id}-title`}
                                    contentEditable={editingField?.nodeId === childNode.id && editingField?.field === 'title'}
                                    suppressContentEditableWarning={true}
                                    data-content-type="title"
                                    className={`flex-1 bg-transparent border-none outline-none font-medium text-sm min-w-0 rounded px-1 ${(editingField?.nodeId === childNode.id && editingField?.field === 'title') ? 'cursor-text' : 'cursor-move'}`}
                                    style={{
                                      color: getTextColor(getNodeColor(childNode.type || 'folder', childNode.color, childNode.id), true),
                                      caretColor: getTextColor(getNodeColor(childNode.type || 'folder', childNode.color, childNode.id), true),
                                      userSelect: (editingField?.nodeId === childNode.id && editingField?.field === 'title') ? 'text' : 'none'
                                    }}
                                    onBlur={(e) => {
                                      const newText = e.currentTarget.textContent || ''
                                      const updatedNodes = nodes.map(n =>
                                        n.id === childNode.id ? { ...n, text: newText } : n
                                      )
                                      setNodes(updatedNodes)
                                      saveToHistory(updatedNodes, connections)
                                      setEditingField(null)
                                      if (onSave) {
                                        onSave(updatedNodes, connections)
                                      }
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (editingField?.nodeId === childNode.id && editingField?.field === 'title') {
                                        e.preventDefault()
                                        e.currentTarget.focus()
                                      }
                                    }}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation()
                                      const target = e.currentTarget
                                      if (editingField?.nodeId === childNode.id && editingField?.field === 'title') {
                                        // Already editing, just focus
                                        target.focus()
                                      } else {
                                        // Start editing
                                        setEditingField({ nodeId: childNode.id, field: 'title' })
                                        setTimeout(() => target.focus(), 0)
                                      }
                                    }}
                                    spellCheck={false}
                                    data-placeholder="Folder title..."
                                    ref={(el) => {
                                      // Only update DOM if NOT currently editing this field
                                      if (el && !(editingField?.nodeId === childNode.id && editingField?.field === 'title')) {
                                        if (el.textContent !== (childNode.text || '')) {
                                          el.textContent = childNode.text || ''
                                        }
                                      }
                                    }}
                                  />
                                </div>
                                {/* Remove from container button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeFromContainer(childNode.id)
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded"
                                  style={{ color: getIconColor(childNode.type || 'folder', getNodeColor(childNode.type || 'folder', childNode.color, childNode.id), true) }}
                                  title="Remove from container"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Content area */}
                              <div className="px-2 pb-2">
                                <div
                                  key={`${childNode.id}-content`}
                                  contentEditable={editingField?.nodeId === childNode.id && editingField?.field === 'content'}
                                  suppressContentEditableWarning={true}
                                  data-content-type="content"
                                  className={`w-full bg-transparent border-none outline-none text-sm min-h-[3.5rem] max-h-full overflow-auto leading-relaxed rounded px-1 ${(editingField?.nodeId === childNode.id && editingField?.field === 'content') ? 'cursor-text' : 'cursor-move'}`}
                                  style={{
                                    color: getTextColor(getNodeColor(childNode.type || 'folder', childNode.color, childNode.id)),
                                    caretColor: getTextColor(getNodeColor(childNode.type || 'folder', childNode.color, childNode.id)),
                                    userSelect: (editingField?.nodeId === childNode.id && editingField?.field === 'content') ? 'text' : 'none'
                                  }}
                                  onBlur={(e) => {
                                    const newContent = e.currentTarget.textContent || ''
                                    const updatedNodes = nodes.map(n =>
                                      n.id === childNode.id ? { ...n, content: newContent } : n
                                    )
                                    setNodes(updatedNodes)
                                    saveToHistory(updatedNodes, connections)
                                    setEditingField(null)
                                    if (onSave) {
                                      onSave(updatedNodes, connections)
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (editingField?.nodeId === childNode.id && editingField?.field === 'content') {
                                      e.currentTarget.focus()
                                    }
                                  }}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation()
                                    const target = e.currentTarget
                                    if (editingField?.nodeId === childNode.id && editingField?.field === 'content') {
                                      // Already editing, just focus
                                      target.focus()
                                    } else {
                                      // Start editing
                                      setEditingField({ nodeId: childNode.id, field: 'content' })
                                      setTimeout(() => target.focus(), 0)
                                    }
                                  }}
                                  spellCheck={false}
                                  data-placeholder="Write your content here..."
                                  ref={(el) => {
                                    if (el && !(editingField?.nodeId === childNode.id && editingField?.field === 'content')) {
                                      if (el.textContent !== (childNode.content || '')) {
                                        el.textContent = childNode.content || ''
                                      }
                                    }
                                  }}
                                >
                                </div>
                              </div>

                              {/* Folder indicator */}
                              <div className="absolute bottom-1 right-1 flex items-center gap-1">
                                <div
                                  className="p-1 cursor-pointer ${!isPanning ? 'hover:bg-black/10' : ''} rounded"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // CRITICAL: Get the most up-to-date node from the nodes array
                                    const currentNode = nodes.find(n => n.id === childNode.id)
                                    if (!currentNode || !onNavigateToCanvas) return

                                    const nodeTitle = currentNode.text || 'Folder'

                                    // Use currentNode for linkedCanvasId, not childNode!
                                    if (currentNode.linkedCanvasId) {
                                      // Switch to folder color context when entering a folder
                                      colorContext.setCurrentFolderId(currentNode.id)
                                      onNavigateToCanvas(currentNode.linkedCanvasId, nodeTitle)
                                    } else {
                                      // Create new linkedCanvasId
                                      const linkedCanvasId = `folder-canvas-${currentNode.id}`
                                      const updatedNodes = nodes.map(n =>
                                        n.id === currentNode.id ? { ...n, linkedCanvasId } : n
                                      )

                                      // Update state
                                      setNodes(updatedNodes)
                                      saveToHistory(updatedNodes, connections)

                                      // Save in background without blocking navigation
                                      if (onSave) {
                                        onSave(updatedNodes, connections)
                                      }

                                      // Switch to folder color context
                                      colorContext.setCurrentFolderId(currentNode.id)
                                      onNavigateToCanvas(linkedCanvasId, nodeTitle)
                                    }
                                  }}
                                  title="Open folder"
                                >
                                  <span className="text-2xl font-bold" style={{ color: getIconColor('folder', getNodeColor('folder', childNode.color, childNode.id), true) }}>→</span>
                                </div>
                              </div>
                                </>
                              )}
                            </div>
                          </div>
                        )})}
                      </div>
                    ) : (
                      <div className="text-center py-4" style={{ color: 'color-mix(in srgb, var(--node-border-default, hsl(var(--border))) 75%, transparent)' }}>
                        <div className="text-sm mb-1">Empty List</div>
                        <div className="text-xs">Drag folder, character, location, or event nodes here to organize them</div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Text/other node content
                  <div
                    key={`${node.id}-content`}
                    contentEditable={editingField?.nodeId === node.id && editingField?.field === 'content'}
                    suppressContentEditableWarning={true}
                    data-content-type="content"
                    className={`w-full bg-transparent border-none outline-none text-sm min-h-[4rem] max-h-full overflow-hidden leading-relaxed rounded px-1 ${(editingField?.nodeId === node.id && editingField?.field === 'content') ? 'cursor-text' : 'cursor-move'}`}
                    draggable={false}
                    style={{
                      color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                      caretColor: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                      pointerEvents: tool === 'event' ? 'none' : 'auto',
                      userSelect: (editingField?.nodeId === node.id && editingField?.field === 'content') ? 'text' : 'none',
                      WebkitUserSelect: (editingField?.nodeId === node.id && editingField?.field === 'content') ? 'text' : 'none',
                      MozUserSelect: (editingField?.nodeId === node.id && editingField?.field === 'content') ? 'text' : 'none',
                      msUserSelect: (editingField?.nodeId === node.id && editingField?.field === 'content') ? 'text' : 'none',
                      // Lock height during manual resize to prevent flash
                      height: resizingNode === node.id ? `${node.height - 60}px` : 'auto'
                    } as React.CSSProperties}
                    onInput={(e) => {
                      // Skip input handling if this node is being manually resized
                      if (resizingNode === node.id) {
                        return
                      }

                      const newContent = e.currentTarget.textContent || ''
                      const updatedNodes = nodes.map(n =>
                        n.id === node.id ? { ...n, content: newContent } : n
                      )
                      setNodes(updatedNodes)

                      // Real-time auto-resize for text/content nodes
                      if (node.type === 'text' || !node.type) {
                        const target = e.currentTarget as HTMLElement
                        if (target) {
                          // Delayed resize to avoid cursor jumping
                          debouncedAutoResize(node.id, target, false)
                        }
                      }
                    }}
                    // Removed onKeyUp to prevent cursor jumping
                    onPaste={(e) => {
                      // Handle paste operations for text nodes
                      if (node.type === 'text' || !node.type) {
                        const target = e.currentTarget as HTMLElement
                        if (target) {
                          debouncedAutoResize(node.id, target, false)
                        }
                      }
                    }}
                    onBlur={() => {
                      saveToHistory(nodes, connections)
                      setEditingField(null)
                      if (onSave) {
                        onSave(nodes, connections)
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      const target = e.currentTarget
                      if (editingField?.nodeId === node.id && editingField?.field === 'content') {
                        // Already editing, just focus
                        target.focus()
                      } else {
                        // Start editing
                        setEditingField({ nodeId: node.id, field: 'content' })
                        setTimeout(() => target.focus(), 0)
                      }
                    }}
                    spellCheck={false}
                    data-placeholder="Write your content here..."
                    ref={(el) => {
                      if (el && !(editingField?.nodeId === node.id && editingField?.field === 'content')) {
                        if (el.textContent !== (node.content || '')) {
                          el.textContent = node.content || ''
                        }
                      }
                    }}
                  />
                )}
                </div>
              )}

              {/* Special node indicators */}
              {node.type === 'folder' && (
                <div className="absolute bottom-1 right-1 flex items-center gap-1">
                  <div
                    className="p-1 cursor-pointer ${!isPanning ? 'hover:bg-black/10' : ''} rounded"
                    onClick={async (e) => {
                      e.stopPropagation()
                      // Single click navigation for folder nodes
                      if (node.linkedCanvasId && onNavigateToCanvas) {
                        // Switch to folder color context when entering a folder
                        colorContext.setCurrentFolderId(node.id)
                        onNavigateToCanvas(node.linkedCanvasId, node.text)
                      } else if (!node.linkedCanvasId && onNavigateToCanvas) {
                        const linkedCanvasId = `folder-canvas-${node.id}`
                        const updatedNodes = nodes.map(n =>
                          n.id === node.id ? { ...n, linkedCanvasId } : n
                        )
                        setNodes(updatedNodes)
                        saveToHistory(updatedNodes, connections)

                        // Save in background without blocking navigation
                        if (onSave) {
                          onSave(updatedNodes, connections)
                        }

                        // Switch to folder color context
                        colorContext.setCurrentFolderId(node.id)
                        onNavigateToCanvas(linkedCanvasId, node.text)
                      }
                    }}
                    title="Open folder"
                  >
                    <span className="text-2xl font-bold" style={{ color: getIconColor('folder', getNodeColor('folder', node.color, node.id)) }}>→</span>
                  </div>
                </div>
              )}

              {/* Resize handles for selected nodes (not for child nodes within list containers) */}
              {selectedId === node.id && tool === 'select' && !node.parentId && (
                <>
                  {/* Bottom-right corner resize handle */}
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm cursor-se-resize hover:bg-primary/80 border border-background z-10"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsResizeReady(node.id)
                      setResizeStartSize({ width: node.width || 240, height: node.height })
                      setResizeStartPos({ x: e.clientX, y: e.clientY })
                    }}
                    title="Resize node"
                  />

                  {/* Right edge resize handle (width only) */}
                  {node.type !== 'image' && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-8 rounded-sm cursor-e-resize z-10"
                      style={{ backgroundColor: getResizeHandleColor(node.type || 'text') }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsResizeReady(node.id)
                        setResizeStartSize({ width: node.width || 240, height: node.height })
                        setResizeStartPos({ x: e.clientX, y: e.clientY })
                      }}
                      title="Resize width"
                    />
                  )}

                  {/* Bottom edge resize handle (height only) */}
                  {node.type !== 'image' && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-8 h-2 rounded-sm cursor-s-resize z-10"
                      style={{ backgroundColor: getResizeHandleColor(node.type || 'text') }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsResizeReady(node.id)
                        setResizeStartSize({ width: node.width || 240, height: node.height })
                        setResizeStartPos({ x: e.clientX, y: e.clientY })
                      }}
                      title="Resize height"
                    />
                  )}


                </>
              )}

              {/* Indicator for child nodes that cannot be resized individually */}
              {selectedId === node.id && node.parentId && (
                <div className="absolute -top-6 left-0 text-xs bg-background rounded px-1" style={{ color: 'color-mix(in srgb, var(--node-border-default, hsl(var(--border))) 75%, transparent)', borderColor: 'color-mix(in srgb, var(--node-border-default, hsl(var(--border))) 75%, transparent)' }}>
                  Scales with container
                </div>
              )}
            </div>
            )
          })}

          {/* Connection Lines Overlay - Behind nodes */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{
              width: '2000px',
              height: '1500px',
              zIndex: 1
            }}
          >
            {connections.map(connection => {
              const fromNode = nodes.find(n => n.id === connection.from)
              const toNode = nodes.find(n => n.id === connection.to)

              if (!fromNode || !toNode) return null

              // Only render timeline connections, not regular connections
              const isTimelineConnection = connection.id.startsWith('timeline-')
              if (!isTimelineConnection) return null // Skip non-timeline connections

              // Calculate center points
              const fromCenterX = fromNode.x + fromNode.width / 2
              const fromCenterY = fromNode.y + fromNode.height / 2
              const toCenterX = toNode.x + toNode.width / 2
              const toCenterY = toNode.y + toNode.height / 2

              // Calculate angle between centers
              const angle = Math.atan2(toCenterY - fromCenterY, toCenterX - fromCenterX)

              // Function to find intersection point with rectangle edge
              const getEdgeIntersection = (nodeX: number, nodeY: number, nodeWidth: number, nodeHeight: number, angle: number, fromCenter: boolean) => {
                const centerX = nodeX + nodeWidth / 2
                const centerY = nodeY + nodeHeight / 2

                // Calculate intersection with each edge
                const cosAngle = Math.cos(angle)
                const sinAngle = Math.sin(angle)

                // Distances from center to edges
                const halfWidth = nodeWidth / 2
                const halfHeight = nodeHeight / 2

                // Check which edge the line intersects
                let intersectionX, intersectionY

                if (Math.abs(cosAngle) > Math.abs(sinAngle)) {
                  // Intersects left or right edge
                  if (cosAngle > 0) {
                    // Right edge
                    intersectionX = nodeX + nodeWidth
                    intersectionY = centerY + (halfWidth * sinAngle / cosAngle)
                  } else {
                    // Left edge
                    intersectionX = nodeX
                    intersectionY = centerY - (halfWidth * sinAngle / cosAngle)
                  }
                } else {
                  // Intersects top or bottom edge
                  if (sinAngle > 0) {
                    // Bottom edge
                    intersectionY = nodeY + nodeHeight
                    intersectionX = centerX + (halfHeight * cosAngle / sinAngle)
                  } else {
                    // Top edge
                    intersectionY = nodeY
                    intersectionX = centerX - (halfHeight * cosAngle / sinAngle)
                  }
                }

                return { x: intersectionX, y: intersectionY }
              }

              // Calculate connection points on node edges
              const fromPoint = getEdgeIntersection(fromNode.x, fromNode.y, fromNode.width, fromNode.height, angle, true)
              const toPoint = getEdgeIntersection(toNode.x, toNode.y, toNode.width, toNode.height, angle + Math.PI, false)

              const strokeColor = getNodeBorderColor('event') // Follow color palette system
              const strokeWidth = 3

              return (
                <g key={connection.id}>
                  {/* Connection line */}
                  <line
                    x1={fromPoint.x}
                    y1={fromPoint.y}
                    x2={toPoint.x}
                    y2={toPoint.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                  />
                </g>
              )
            })}
          </svg>

          {/* Empty state */}
          {nodes.filter(node => visibleNodeIds.includes(node.id)).length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Card className="p-8 text-center max-w-md">
                {nodes.length === 0 ? (
                  <>
                    <h3 className="text-lg font-medium mb-2 text-card-foreground">Welcome to StoryCanvas</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your story by adding nodes to the canvas.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium mb-2 text-card-foreground">No visible nodes</h3>
                    <p className="text-muted-foreground mb-4">
                      All nodes are hidden by the color filter. Use the filter tool to show nodes.
                    </p>
                  </>
                )}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setTool('text')}
                    className="flex items-center gap-2"
                  >
                    <Type className="w-5 h-5" />
                    Add Text
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setTool('character')}
                    className="flex items-center gap-2"
                  >
                    <User className="w-5 h-5" />
                    Add Character
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setTool('folder')}
                    className="flex items-center gap-2"
                  >
                    <Folder className="w-5 h-5" />
                    Add Section
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  After selecting a tool, click anywhere on the canvas to create a node.
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Image Cropping Modal */}
      {cropModal?.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-3xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Crop Profile Picture</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCropModal(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative mb-4 inline-block">
              <img
                ref={cropImageRef}
                src={cropModal.imageUrl}
                alt="Image to crop"
                className="max-w-full max-h-96 mx-auto select-none"
                style={{ display: 'block' }}
                onMouseDown={(e) => e.preventDefault()}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement
                  // Update crop data if needed
                  if (cropData.width === 100) {
                    const size = Math.min(cropModal.imageWidth!, cropModal.imageHeight!)
                    const x = (cropModal.imageWidth! - size) / 2
                    const y = (cropModal.imageHeight! - size) / 2
                    setCropData({ x, y, width: size, height: size })
                  }
                }}
              />

              {/* Draggable crop overlay */}
              {cropModal.imageWidth && cropModal.imageHeight && (
                <div
                  className="absolute border-2 border-black bg-black/20 cursor-move select-none"
                  style={{
                    left: `${(cropData.x / cropModal.imageWidth) * 100}%`,
                    top: `${(cropData.y / cropModal.imageHeight) * 100}%`,
                    width: `${(cropData.width / cropModal.imageWidth) * 100}%`,
                    height: `${(cropData.height / cropModal.imageHeight) * 100}%`,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (cropImageRef.current) {
                      const img = cropImageRef.current
                      const rect = img.getBoundingClientRect()
                      const scaleX = cropModal.imageWidth / rect.width
                      const scaleY = cropModal.imageHeight / rect.height

                      setIsDraggingCrop(true)
                      setDragStartCrop({
                        x: e.clientX - (cropData.x / scaleX) - rect.left,
                        y: e.clientY - (cropData.y / scaleY) - rect.top
                      })
                    }
                  }}
                >
                  {/* Resize handles */}
                  <div
                    className="absolute -top-1 -left-1 w-3 h-3 bg-black border border-white cursor-nw-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      setIsResizingCrop(true)
                      setResizeDirection('nw')
                    }}
                  ></div>
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-black border border-white cursor-ne-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      setIsResizingCrop(true)
                      setResizeDirection('ne')
                    }}
                  ></div>
                  <div
                    className="absolute -bottom-1 -left-1 w-3 h-3 bg-black border border-white cursor-sw-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      setIsResizingCrop(true)
                      setResizeDirection('sw')
                    }}
                  ></div>
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-black border border-white cursor-se-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      setIsResizingCrop(true)
                      setResizeDirection('se')
                    }}
                  ></div>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Drag the black square to position your crop area. Use the corner handles to resize. The crop will always be square.
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCropModal(null)
                  setIsDraggingCrop(false)
                  setIsResizingCrop(false)
                  setResizeDirection(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (cropModal) {
                    const croppedImageUrl = await cropImage(cropModal.imageUrl, cropData)
                    const updatedNodes = nodes.map(n =>
                      n.id === cropModal.nodeId ? { ...n, profileImageUrl: croppedImageUrl } : n
                    )
                    // Sync relationship canvases immediately after updating profile picture
                    const syncedNodes = syncRelationshipCanvases(updatedNodes)
                    setNodes(syncedNodes)
                    saveToHistory(syncedNodes, connections)
                    setCropModal(null)
                    setIsDraggingCrop(false)
                    setIsResizingCrop(false)
                    setResizeDirection(null)
                    toast.success('Profile picture updated!')
                  }
                }}
              >
                Apply Crop
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Relationship Canvas Modal */}
      {relationshipCanvasModal?.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                {relationshipCanvasModal.node.text} - Relationship Editor
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRelationshipCanvasModal(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel - Character Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold">Characters</h4>
                  <Button
                    variant={isConnectingMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsConnectingMode(!isConnectingMode)
                      setSelectedCharacterForConnection(null)
                    }}
                    className="flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    {isConnectingMode ? "Exit Connect Mode" : "Connect Characters"}
                  </Button>
                </div>

                {isConnectingMode && (
                  <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Double-click on two characters in the canvas to create a relationship between them.
                      You can still drag characters around to position them.
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Add Characters to Map:</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      onChange={(e) => {
                        if (e.target.value) {
                          const characterId = e.target.value
                          const availableCharacters = getAllCharacters()
                          const character = availableCharacters.find(c => c.id === characterId)
                          const currentNode = relationshipCanvasModal.node
                          const selectedCharacters = currentNode.relationshipData?.selectedCharacters || []

                          if (character && !selectedCharacters.find(sc => sc.id === characterId)) {
                            const newCharacter = {
                              id: character.id,
                              name: character.name,
                              profileImageUrl: character.profileImageUrl,
                              position: {
                                x: 50 + Math.random() * 200,
                                y: 50 + Math.random() * 200
                              }
                            }

                            const updatedNodes = nodes.map(n =>
                              n.id === currentNode.id ? {
                                ...n,
                                relationshipData: {
                                  ...n.relationshipData,
                                  selectedCharacters: [...selectedCharacters, newCharacter],
                                  relationships: n.relationshipData?.relationships || []
                                }
                              } : n
                            )
                            setNodes(updatedNodes)
                            saveToHistory(updatedNodes, connections)

                            // Update modal state
                            const updatedNode = updatedNodes.find(n => n.id === currentNode.id)
                            if (updatedNode) {
                              setRelationshipCanvasModal({
                                ...relationshipCanvasModal,
                                node: updatedNode
                              })
                            }
                          }
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">Select a character to add...</option>
                      {getAllCharacters()
                        .filter(char => !(relationshipCanvasModal.node.relationshipData?.selectedCharacters || []).find(sc => sc.id === char.id))
                        .map(char => (
                          <option key={char.id} value={char.id}>{char.name}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Selected Characters:</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {(relationshipCanvasModal.node.relationshipData?.selectedCharacters || []).map(character => (
                        <div key={character.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-background border border-border flex items-center justify-center">
                              {character.profileImageUrl ? (
                                <img
                                  src={character.profileImageUrl}
                                  alt={character.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-foreground">{character.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentNode = relationshipCanvasModal.node
                              const selectedCharacters = currentNode.relationshipData?.selectedCharacters || []
                              const updatedCharacters = selectedCharacters.filter(sc => sc.id !== character.id)

                              const updatedNodes = nodes.map(n =>
                                n.id === currentNode.id ? {
                                  ...n,
                                  relationshipData: {
                                    ...n.relationshipData,
                                    selectedCharacters: updatedCharacters,
                                    relationships: n.relationshipData?.relationships || []
                                  }
                                } : n
                              )
                              setNodes(updatedNodes)
                              saveToHistory(updatedNodes, connections)

                              // Update modal state
                              const updatedNode = updatedNodes.find(n => n.id === currentNode.id)
                              if (updatedNode) {
                                setRelationshipCanvasModal({
                                  ...relationshipCanvasModal,
                                  node: updatedNode
                                })
                              }
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Relationship Visualization */}
              <div>
                <h4 className="text-md font-semibold mb-3">Relationship Map Preview</h4>
                <div
                  className="relative border-2 border-dashed border-border rounded-lg bg-white"
                  style={{ height: '400px', minHeight: '300px' }}
                  onMouseMove={(e) => {
                    if (draggingCharacter) {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = Math.max(0, Math.min(280, e.clientX - rect.left - dragCharacterOffset.x))
                      const y = Math.max(0, Math.min(280, e.clientY - rect.top - dragCharacterOffset.y))

                      const currentNode = relationshipCanvasModal.node
                      const selectedCharacters = currentNode.relationshipData?.selectedCharacters || []
                      const updatedCharacters = selectedCharacters.map(char =>
                        char.id === draggingCharacter ? { ...char, position: { x, y } } : char
                      )

                      const updatedNodes = nodes.map(n =>
                        n.id === currentNode.id ? {
                          ...n,
                          relationshipData: {
                            ...n.relationshipData,
                            selectedCharacters: updatedCharacters,
                            relationships: n.relationshipData?.relationships || []
                          }
                        } : n
                      )
                      setNodes(updatedNodes)

                      // Update modal state
                      const updatedNode = updatedNodes.find(n => n.id === currentNode.id)
                      if (updatedNode) {
                        setRelationshipCanvasModal({
                          ...relationshipCanvasModal,
                          node: updatedNode
                        })
                      }
                    }
                  }}
                  onMouseUp={() => {
                    if (draggingCharacter) {
                      setDraggingCharacter(null)
                      saveToHistory(nodes, connections)
                    }
                  }}
                >
                  {(relationshipCanvasModal.node.relationshipData?.selectedCharacters || []).map(character => (
                    <div
                      key={character.id}
                      className={`absolute w-16 h-16 select-none transition-transform ${
                        isConnectingMode
                          ? selectedCharacterForConnection === character.id
                            ? 'cursor-pointer scale-110 ring-4 ring-blue-400 shadow-lg z-10'
                            : 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-gray-300'
                          : draggingCharacter === character.id
                          ? 'cursor-move scale-110 z-10'
                          : 'cursor-move hover:scale-105'
                      }`}
                      style={{
                        left: Math.min(character.position.x, 280),
                        top: Math.min(character.position.y, 280)
                      }}
                      title={character.name}
                      onMouseDown={(e) => {
                        e.preventDefault()

                        // Handle relationship connection mode
                        if (isConnectingMode) {
                          if (selectedCharacterForConnection === null) {
                            // First character selected
                            setSelectedCharacterForConnection(character.id)
                          } else if (selectedCharacterForConnection !== character.id) {
                            // Second character selected, create relationship
                            const fromCharacter = relationshipCanvasModal.node.relationshipData?.selectedCharacters?.find(c => c.id === selectedCharacterForConnection)
                            const toCharacter = character

                            if (fromCharacter) {
                              setRelationshipModal({
                                isOpen: true,
                                fromCharacter: { id: fromCharacter.id, name: fromCharacter.name },
                                toCharacter: { id: toCharacter.id, name: toCharacter.name }
                              })
                            }
                            setSelectedCharacterForConnection(null)
                          }
                          return // Don't start dragging in connecting mode
                        }

                        // Regular dragging mode
                        setDraggingCharacter(character.id)
                        const rect = e.currentTarget.getBoundingClientRect()
                        setDragCharacterOffset({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top
                        })
                      }}
                    >
                      <div className="w-full h-full rounded-full border-2 border-border overflow-hidden bg-background shadow-md">
                        {character.profileImageUrl ? (
                          <img
                            src={character.profileImageUrl}
                            alt={character.name}
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-center mt-1 font-medium truncate bg-background px-1 rounded shadow-sm text-foreground border border-border">
                        {character.name}
                      </div>
                    </div>
                  ))}

                  {(relationshipCanvasModal.node.relationshipData?.selectedCharacters?.length || 0) === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm">Add characters to start mapping relationships</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setRelationshipCanvasModal(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setRelationshipCanvasModal(null)
                  toast.success('Relationship map updated!')
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Relationship Creation Modal */}
      {relationshipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg border max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {relationshipModal.editingRelationship ? 'Edit Relationship' : 'Create Relationship'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRelationshipModal(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-1">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-medium">{relationshipModal.fromCharacter.name}</p>
                </div>
                <Heart className="w-6 h-6 text-red-500" />
                <div className="text-center">
                  {relationshipModal.toCharacter.id ? (
                    // Show selected character
                    <>
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-1">
                        <User className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-sm font-medium">{relationshipModal.toCharacter.name}</p>
                    </>
                  ) : (
                    // Show character selection dropdown
                    <div>
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <select
                        className="text-xs p-1 border rounded"
                        onChange={(e) => {
                          if (e.target.value && relationshipCanvasModal) {
                            const selectedChar = relationshipCanvasModal.node.relationshipData?.selectedCharacters?.find(c => c.id === e.target.value)
                            if (selectedChar) {
                              setRelationshipModal({
                                ...relationshipModal,
                                toCharacter: { id: selectedChar.id, name: selectedChar.name }
                              })
                            }
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">Select character...</option>
                        {relationshipCanvasModal?.node.relationshipData?.selectedCharacters
                          ?.filter(c => c.id !== relationshipModal.fromCharacter.id)
                          .map(character => (
                            <option key={character.id} value={character.id}>{character.name}</option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Relationship Type:</label>
                <select
                  className="w-full p-2 border rounded-md"
                  id="relationshipType"
                  defaultValue={relationshipModal.editingRelationship?.relationshipType || 'friends'}
                >
                  <option value="romantic">Romantic (Red)</option>
                  <option value="family">Family (Blue)</option>
                  <option value="friends">Friends (Green)</option>
                  <option value="professional">Professional (Orange)</option>
                  <option value="rivals">Rivals/Enemies (Purple)</option>
                  <option value="other">Other (Gray)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Relationship Strength:</label>
                <select
                  className="w-full p-2 border rounded-md"
                  id="relationshipStrength"
                  defaultValue={relationshipModal.editingRelationship?.strength || 2}
                >
                  <option value={3}>Strong (Thick line)</option>
                  <option value={2}>Medium (Normal line)</option>
                  <option value={1}>Weak (Thin dotted line)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Label (optional):</label>
                <input
                  type="text"
                  placeholder="e.g. 'married', 'siblings', 'best friends'"
                  className="w-full p-2 border rounded-md"
                  id="relationshipLabel"
                  defaultValue={relationshipModal.editingRelationship?.label || ''}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Notes (optional):</label>
                <textarea
                  placeholder="Additional details about this relationship"
                  className="w-full p-2 border rounded-md h-20 resize-none"
                  id="relationshipNotes"
                  defaultValue={relationshipModal.editingRelationship?.notes || ''}
                />
              </div>

              {/* Two-way relationship option */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="isTwoWay"
                    className="rounded"
                    defaultChecked={relationshipModal.editingRelationship?.reverseRelationshipType !== undefined}
                    onChange={(e) => {
                      const twoWaySection = document.getElementById('twoWaySection')
                      if (twoWaySection) {
                        twoWaySection.style.display = e.target.checked ? 'block' : 'none'
                      }
                    }}
                  />
                  <label htmlFor="isTwoWay" className="text-sm font-medium">
                    Two-way relationship (different feelings in each direction)
                  </label>
                </div>

                <div
                  id="twoWaySection"
                  className="space-y-3 pl-6 border-l-2 border-muted"
                  style={{ display: relationshipModal.editingRelationship?.reverseRelationshipType ? 'block' : 'none' }}
                >
                  <p className="text-xs text-muted-foreground">
                    How <strong>{relationshipModal.toCharacter.name}</strong> feels about <strong>{relationshipModal.fromCharacter.name}</strong>:
                  </p>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Return Relationship Type:</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      id="reverseRelationshipType"
                      defaultValue={relationshipModal.editingRelationship?.reverseRelationshipType || 'friends'}
                    >
                      <option value="romantic">Romantic (Red)</option>
                      <option value="family">Family (Blue)</option>
                      <option value="friends">Friends (Green)</option>
                      <option value="professional">Professional (Orange)</option>
                      <option value="rivals">Rivals/Enemies (Purple)</option>
                      <option value="other">Other (Gray)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Return Strength:</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      id="reverseStrength"
                      defaultValue={relationshipModal.editingRelationship?.reverseStrength || 2}
                    >
                      <option value={3}>Strong (Thick line)</option>
                      <option value={2}>Medium (Normal line)</option>
                      <option value={1}>Weak (Thin dotted line)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Return Label (optional):</label>
                    <input
                      type="text"
                      placeholder="e.g. 'dislikes', 'ignores', 'admires'"
                      className="w-full p-2 border rounded-md"
                      id="reverseLabel"
                      defaultValue={relationshipModal.editingRelationship?.reverseLabel || ''}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2 mt-6">
              {relationshipModal.editingRelationship && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!relationshipCanvasModal || !relationshipModal.editingRelationship) return

                    const currentNode = relationshipCanvasModal.node
                    const existingRelationships = currentNode.relationshipData?.relationships || []
                    const updatedRelationships = existingRelationships.filter(
                      rel => rel.id !== relationshipModal.editingRelationship!.id
                    )

                    const updatedNodes = nodes.map(n =>
                      n.id === currentNode.id ? {
                        ...n,
                        relationshipData: {
                          ...n.relationshipData,
                          selectedCharacters: n.relationshipData?.selectedCharacters || [],
                          relationships: updatedRelationships
                        }
                      } : n
                    )

                    setNodes(updatedNodes)
                    saveToHistory(updatedNodes, connections)

                    // Update modal state
                    const updatedNode = updatedNodes.find(n => n.id === currentNode.id)
                    if (updatedNode) {
                      setRelationshipCanvasModal({
                        ...relationshipCanvasModal,
                        node: updatedNode
                      })
                    }

                    setRelationshipModal(null)
                    toast.success('Relationship deleted!')
                  }}
                >
                  Delete
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setRelationshipModal(null)}
                >
                  Cancel
                </Button>
                <Button
                disabled={!relationshipModal.toCharacter.id}
                onClick={() => {
                  if (!relationshipCanvasModal || !relationshipModal.toCharacter.id) return

                  const typeSelect = document.getElementById('relationshipType') as HTMLSelectElement
                  const strengthSelect = document.getElementById('relationshipStrength') as HTMLSelectElement
                  const labelInput = document.getElementById('relationshipLabel') as HTMLInputElement
                  const notesInput = document.getElementById('relationshipNotes') as HTMLTextAreaElement

                  // Two-way relationship fields
                  const isTwoWayCheckbox = document.getElementById('isTwoWay') as HTMLInputElement
                  const reverseTypeSelect = document.getElementById('reverseRelationshipType') as HTMLSelectElement
                  const reverseStrengthSelect = document.getElementById('reverseStrength') as HTMLSelectElement
                  const reverseLabelInput = document.getElementById('reverseLabel') as HTMLInputElement

                  const currentNode = relationshipCanvasModal.node
                  const existingRelationships = currentNode.relationshipData?.relationships || []

                  if (relationshipModal.editingRelationship) {
                    // Update existing relationship
                    const updatedRelationships = existingRelationships.map(rel =>
                      rel.id === relationshipModal.editingRelationship!.id
                        ? {
                            ...rel,
                            relationshipType: typeSelect.value as 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other',
                            strength: parseInt(strengthSelect.value) as 1 | 2 | 3,
                            label: labelInput.value || `${typeSelect.options[typeSelect.selectedIndex].text}`,
                            notes: notesInput.value,
                            // Two-way relationship data
                            ...(isTwoWayCheckbox.checked ? {
                              reverseRelationshipType: reverseTypeSelect.value as 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other',
                              reverseStrength: parseInt(reverseStrengthSelect.value) as 1 | 2 | 3,
                              reverseLabel: reverseLabelInput.value || `${reverseTypeSelect.options[reverseTypeSelect.selectedIndex].text}`,
                            } : {
                              reverseRelationshipType: undefined,
                              reverseStrength: undefined,
                              reverseLabel: undefined
                            })
                          }
                        : rel
                    )

                    const updatedNodes = nodes.map(n =>
                      n.id === currentNode.id ? {
                        ...n,
                        relationshipData: {
                          ...n.relationshipData,
                          selectedCharacters: n.relationshipData?.selectedCharacters || [],
                          relationships: updatedRelationships
                        }
                      } : n
                    )

                    setNodes(updatedNodes)
                    saveToHistory(updatedNodes, connections)

                    // Update modal state
                    const updatedNode = updatedNodes.find(n => n.id === currentNode.id)
                    if (updatedNode) {
                      setRelationshipCanvasModal({
                        ...relationshipCanvasModal,
                        node: updatedNode
                      })
                    }

                    setRelationshipModal(null)
                    toast.success('Relationship updated!')
                  } else {
                    // Check for existing relationship between these characters (in either direction)
                    const exactMatchIndex = existingRelationships.findIndex(rel =>
                      rel.fromCharacterId === relationshipModal.fromCharacter.id && rel.toCharacterId === relationshipModal.toCharacter.id
                    )

                    const reverseMatchIndex = existingRelationships.findIndex(rel =>
                      rel.fromCharacterId === relationshipModal.toCharacter.id && rel.toCharacterId === relationshipModal.fromCharacter.id
                    )

                    let updatedRelationships

                    if (exactMatchIndex !== -1) {
                      // Exact same direction relationship exists - overwrite it
                      const overwrittenRelationship = {
                        ...existingRelationships[exactMatchIndex],
                        relationshipType: typeSelect.value as 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other',
                        strength: parseInt(strengthSelect.value) as 1 | 2 | 3,
                        label: labelInput.value || `${typeSelect.options[typeSelect.selectedIndex].text}`,
                        notes: notesInput.value,
                        // Two-way relationship data
                        ...(isTwoWayCheckbox.checked ? {
                          reverseRelationshipType: reverseTypeSelect.value as 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other',
                          reverseStrength: parseInt(reverseStrengthSelect.value) as 1 | 2 | 3,
                          reverseLabel: reverseLabelInput.value || `${reverseTypeSelect.options[reverseTypeSelect.selectedIndex].text}`,
                        } : {
                          // Clear reverse relationship data if not two-way
                          reverseRelationshipType: undefined,
                          reverseStrength: undefined,
                          reverseLabel: undefined
                        })
                      }

                      updatedRelationships = existingRelationships.map((rel, index) =>
                        index === exactMatchIndex ? overwrittenRelationship : rel
                      )

                      toast.success('Relationship updated!')
                    } else if (reverseMatchIndex !== -1) {
                      // Reverse direction relationship exists - merge into two-way relationship
                      const existingRel = existingRelationships[reverseMatchIndex]

                      const mergedRelationship = {
                        ...existingRel,
                        // Swap directions so the new relationship becomes the forward direction
                        fromCharacterId: relationshipModal.fromCharacter.id,
                        toCharacterId: relationshipModal.toCharacter.id,
                        relationshipType: typeSelect.value as 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other',
                        strength: parseInt(strengthSelect.value) as 1 | 2 | 3,
                        label: labelInput.value || `${typeSelect.options[typeSelect.selectedIndex].text}`,
                        notes: notesInput.value,
                        // Move existing relationship to reverse direction
                        reverseRelationshipType: existingRel.relationshipType,
                        reverseStrength: existingRel.strength,
                        reverseLabel: existingRel.label,
                        // Include additional two-way data if specified
                        ...(isTwoWayCheckbox.checked ? {
                          reverseRelationshipType: reverseTypeSelect.value as 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other',
                          reverseStrength: parseInt(reverseStrengthSelect.value) as 1 | 2 | 3,
                          reverseLabel: reverseLabelInput.value || `${reverseTypeSelect.options[reverseTypeSelect.selectedIndex].text}`
                        } : {})
                      }

                      updatedRelationships = existingRelationships.map((rel, index) =>
                        index === reverseMatchIndex ? mergedRelationship : rel
                      )

                      toast.success('Relationships merged into two-way relationship!')
                    } else {
                      // Create new relationship
                      const newRelationship = {
                        id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        fromCharacterId: relationshipModal.fromCharacter.id,
                        toCharacterId: relationshipModal.toCharacter.id,
                        relationshipType: typeSelect.value as 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other',
                        strength: parseInt(strengthSelect.value) as 1 | 2 | 3,
                        label: labelInput.value || `${typeSelect.options[typeSelect.selectedIndex].text}`,
                        notes: notesInput.value,
                        isBidirectional: true,
                        // Two-way relationship data
                        ...(isTwoWayCheckbox.checked ? {
                          reverseRelationshipType: reverseTypeSelect.value as 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other',
                          reverseStrength: parseInt(reverseStrengthSelect.value) as 1 | 2 | 3,
                          reverseLabel: reverseLabelInput.value || `${reverseTypeSelect.options[reverseTypeSelect.selectedIndex].text}`,
                        } : {})
                      }

                      updatedRelationships = [...existingRelationships, newRelationship]
                    }

                    const updatedNodes = nodes.map(n =>
                      n.id === currentNode.id ? {
                        ...n,
                        relationshipData: {
                          ...n.relationshipData,
                          selectedCharacters: n.relationshipData?.selectedCharacters || [],
                          relationships: updatedRelationships
                        }
                      } : n
                    )

                    setNodes(updatedNodes)
                    saveToHistory(updatedNodes, connections)

                    // Update modal state
                    const updatedNode = updatedNodes.find(n => n.id === currentNode.id)
                    if (updatedNode) {
                      setRelationshipCanvasModal({
                        ...relationshipCanvasModal,
                        node: updatedNode
                      })
                    }

                    setRelationshipModal(null)
                    toast.success('Relationship created!')
                  }
                }}
              >
                {relationshipModal.editingRelationship ? 'Update Relationship' : 'Create Relationship'}
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selection box */}
      {isSelecting && selectionBox.width > 0 && selectionBox.height > 0 && (
        <div
          style={{
            position: 'absolute',
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
            border: '2px dashed #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        />
      )}

      {/* Context menu */}
      {contextMenu && (
        <NodeContextMenu
          node={contextMenu.node}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onSettingChange={handleSettingChange}
          onDuplicate={handleDuplicateNode}
          onDelete={handleDeleteNode}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
        />
      )}

    </div>
  )
}