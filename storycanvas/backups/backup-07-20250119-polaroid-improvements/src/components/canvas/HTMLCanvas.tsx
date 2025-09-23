'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Minus, Maximize2, MousePointer, Hand, Type, Folder, User, MapPin, Calendar, Trash2, Undo, Redo, X, List, Zap, Move, Image } from 'lucide-react'
import { toast } from 'sonner'
import { ColorPicker } from '@/components/ui/color-picker'
import { PaletteSelector } from '@/components/ui/palette-selector'
import { ColorFilter } from '@/components/ui/color-filter'
import { PerformanceOptimizer } from '@/lib/performance-utils'
import { useColorContext } from '@/components/providers/color-provider'

interface Node {
  id: string
  x: number
  y: number
  text: string
  content?: string
  width: number
  height: number
  type?: 'text' | 'character' | 'event' | 'location' | 'folder' | 'list' | 'image'
  color?: string
  linkedCanvasId?: string
  imageUrl?: string
  attributes?: any
  // Container properties for list nodes
  parentId?: string // If this node is inside a container
  childIds?: string[] // If this node is a container (for list nodes)
  layoutMode?: 'single-column' | 'multi-column' // Layout for list containers
}

interface Connection {
  id: string
  from: string
  to: string
  type?: 'leads-to' | 'conflicts-with' | 'relates-to'
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
  const [tool, setTool] = useState<'pan' | 'select' | 'text' | 'character' | 'event' | 'location' | 'folder' | 'list' | 'image' | 'connect'>('pan')
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [showHelp, setShowHelp] = useState(true)
  const [visibleNodeIds, setVisibleNodeIds] = useState<string[]>([])
  const [viewportNodes, setViewportNodes] = useState<Node[]>([])
  const [isMoving, setIsMoving] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [paletteRefresh, setPaletteRefresh] = useState(0) // Force re-render when palette changes
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [isDragReady, setIsDragReady] = useState<string | null>(null)
  const [resizingNode, setResizingNode] = useState<string | null>(null)
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 })
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

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

      // Skip auto-resize for image nodes - they maintain their aspect ratio based on the image
      const currentNode = nodes.find(n => n.id === nodeId)
      if (currentNode?.type === 'image') {
        return
      }

      // Force a reflow to get accurate measurements
      element.style.height = 'auto'
      const scrollHeight = element.scrollHeight

      let newHeight
      if (isTitle) {
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
        return prevNodes.map(n =>
          n.id === nodeId ? { ...n, height: newHeight } : n
        )
      })
    } catch (error) {
      console.error('Auto-resize error for node', nodeId, ':', error)
    }
  }, [])

  // Auto-resize all nodes on initial load and when new nodes are added
  useEffect(() => {
    // Wait for DOM to be ready, then auto-size all nodes
    const timer = setTimeout(() => {
      nodes.forEach(node => {
        // Skip auto-resize for image nodes - they maintain their aspect ratio based on the image
        if (node.type === 'image') {
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
    }, 100)

    return () => clearTimeout(timer)
  }, [nodes.length, autoResizeNode]) // Only when nodes are added/removed

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

  // Update visible nodes when nodes change
  useEffect(() => {
    if (visibleNodeIds.length === 0 || visibleNodeIds.length === nodes.length) {
      setVisibleNodeIds(nodes.map(node => node.id))
    }
  }, [nodes])

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

  // Keyboard shortcuts for undo/redo and delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts while user is typing in contentEditable
      if (document.activeElement?.getAttribute('contenteditable') === 'true') return
      
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
        setTool('pan')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedId])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Pan tool doesn't create nodes, only pans
    if (tool === 'pan' || tool === 'select' || isPanning) return
    
    // Only create nodes when a creation tool is selected
    if (!['text', 'character', 'event', 'location', 'folder', 'list', 'image'].includes(tool)) return
    
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
      width: tool === 'list' ? 320 : 200,  // List containers are wider
      height: tool === 'list' ? 240 : 120, // List containers are taller
      type: tool,
      // Don't set color - let it use dynamic theme colors
      ...(tool === 'folder' ? { linkedCanvasId: `${tool}-canvas-${Date.now()}` } : {}),
      ...(tool === 'list' ? { childIds: [], layoutMode: 'single-column' as const } : {})
    }

    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    setSelectedId(newNode.id)  // Select the newly created node
    setTool('select')  // Switch to select tool after creating node for immediate interaction
    toast.success(`Created ${tool} node`)
  }, [tool, isPanning, nodes, connections, saveToHistory])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool === 'pan' && e.target === canvasRef.current) {
      setIsPanning(true)
      setIsMoving(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [tool])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      
      // Use the parent container for scrolling instead of transform
      const canvasContainer = canvasRef.current?.parentElement
      if (canvasContainer) {
        canvasContainer.scrollLeft -= deltaX
        canvasContainer.scrollTop -= deltaY
      }
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    } else if (isDragReady && !draggingNode) {
      // Check if mouse moved enough to start dragging (drag threshold)
      const deltaX = e.clientX - dragStartPos.x
      const deltaY = e.clientY - dragStartPos.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      if (distance > 5) { // 5px drag threshold
        setDraggingNode(isDragReady)
        setIsDragReady(null)
      }
    } else if (draggingNode) {
      // Handle node dragging - just update position state, don't re-render nodes
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left - dragOffset.x
        const y = e.clientY - rect.top - dragOffset.y
        
        setDragPosition({ x: Math.max(0, x), y: Math.max(0, y) })
        setIsMoving(true)
      }
    } else if (resizingNode) {
      // Handle node resizing
      const deltaX = e.clientX - resizeStartPos.x
      const deltaY = e.clientY - resizeStartPos.y

      const resizingNodeObj = nodes.find(n => n.id === resizingNode)
      if (!resizingNodeObj) return

      let newWidth = Math.max(120, resizeStartSize.width + deltaX)
      let newHeight = Math.max(80, resizeStartSize.height + deltaY)

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

        // Update child nodes proportionally (but don't allow individual child scaling)
        const updatedNodes = nodes.map(node => {
          if (resizingNodeObj.childIds?.includes(node.id)) {
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
      }
      // Text, character, event, location, folder nodes: freely scalable width and height
      // (no special restrictions)

      // Update the resizing node size immediately for visual feedback
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
  }, [isPanning, lastPanPoint, draggingNode, isDragReady, dragOffset, dragStartPos, resizingNode, resizeStartPos, resizeStartSize])

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
    
    // Clear drag ready state if mouse up without dragging
    if (isDragReady) {
      setIsDragReady(null)
    }
    
    if (draggingNode) {
      // Update the actual node position when dragging ends
      const updatedNodes = nodes.map(node =>
        node.id === draggingNode
          ? { ...node, x: dragPosition.x, y: dragPosition.y }
          : node
      )
      setNodes(updatedNodes)
      saveToHistory(updatedNodes, connections)
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
      toast.success('Node resized')
    }
    
    if (isMoving) {
      // Delay to allow final render with high quality after movement stops
      setTimeout(() => setIsMoving(false), 100)
    }
  }, [isMoving, draggingNode, isDragReady, resizingNode, nodes, connections, saveToHistory, dragPosition])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Allow normal scrolling - don't prevent default
    // The container will handle scrolling naturally
  }, [])

  const getDefaultText = (nodeType: string) => {
    switch (nodeType) {
      case 'character': return 'New Character'
      case 'event': return 'New Event'
      case 'location': return 'New Location'
      case 'folder': return 'New Section'
      case 'list': return 'New List'
      case 'image': return 'New Image'
      default: return 'New Text Node'
    }
  }

  const getDefaultContent = (nodeType: string) => {
    switch (nodeType) {
      case 'character': return 'Who is this character and what do they want?'
      case 'event': return 'What happens in this event?'
      case 'location': return 'What is this place like?'
      case 'folder': return 'What does this section contain?'
      case 'list': return ''  // List containers show their children, no default content needed
      case 'image': return 'Image caption or paste URL here...'
      default: return 'What would you like to write about?'
    }
  }

  const getNodeColor = (nodeType: string, customColor?: string, nodeId?: string) => {
    if (customColor) return customColor
    
    // For folder nodes, optionally show their custom palette color
    if (nodeType === 'folder' && nodeId) {
      const folderPalette = colorContext.getFolderPalette(nodeId)
      if (folderPalette) {
        // Show the folder's custom color on the outside
        return folderPalette.colors.nodeDefault
      }
    }
    
    // Get the current active palette from color context
    const currentPalette = colorContext.getCurrentPalette()
    
    if (currentPalette && currentPalette.colors && currentPalette.colors.nodeDefault) {
      return currentPalette.colors.nodeDefault
    }
    
    // Try getting the color from CSS variables (applied by palette system)
    const paletteBase = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-node-default')
      .trim()
    
    if (paletteBase && paletteBase !== '#ffffff' && paletteBase !== 'white' && paletteBase !== '') {
      return paletteBase
    }
    
    // Hard fallback - use a nice blue color instead of white
    return '#e0f2fe' // Light blue instead of white
  }

  const getNodeBorderColor = (nodeType: string) => {
    // Use palette border color for all nodes
    const paletteBorder = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-border')
      .trim() || 'hsl(var(--border))'
    
    return paletteBorder
  }

  // Helper function to get text color from palette
  const getTextColor = (backgroundColor: string) => {
    // Use palette text color
    const paletteTextColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-node-text')
      .trim()
    
    if (paletteTextColor) {
      return paletteTextColor
    }

    // Fallback to luminance calculation
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
        return luminance > 0.5 ? '#000000' : '#ffffff'
      }
    }

    return '#000000'
  }

  const handleNodeClick = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation()
    
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

    // Simply select the node
    setSelectedId(node.id)
  }


  const handleNodeDoubleClick = (node: Node) => {
    // Double click navigates into folders (works with any tool)
    console.log('Double-clicking node:', node.id, 'type:', node.type, 'linkedCanvasId:', node.linkedCanvasId)
    if (node.type === 'folder' && node.linkedCanvasId && onNavigateToCanvas) {
      console.log('Navigating to canvas:', node.linkedCanvasId, 'with title:', node.text)
      
      // Switch to folder color context when entering a folder
      colorContext.setCurrentFolderId(node.id)
      
      // Apply folder palette if it exists
      const folderPalette = colorContext.getFolderPalette(node.id)
      if (folderPalette) {
        colorContext.applyPalette(folderPalette)
      }
      
      onNavigateToCanvas(node.linkedCanvasId, node.text)
    } else if (node.type === 'folder' && !node.linkedCanvasId) {
      console.log('Folder node missing linkedCanvasId, creating one')
      // Create a linked canvas ID if it doesn't exist
      const linkedCanvasId = `folder-canvas-${node.id}-${Date.now()}`
      const updatedNodes = nodes.map(n => 
        n.id === node.id ? { ...n, linkedCanvasId } : n
      )
      setNodes(updatedNodes)
      
      if (onNavigateToCanvas) {
        // Switch to folder color context
        colorContext.setCurrentFolderId(node.id)
        onNavigateToCanvas(linkedCanvasId, node.text)
      }
    } else {
      console.log('Navigation failed - not a folder or missing onNavigateToCanvas callback')
    }
  }


  const calculateAutoSize = (node: Node, content: string) => {
    // Auto-sizing logic based on node type and content
    const baseWidth = 240
    const baseHeight = 120
    const minWidth = 180
    const minHeight = 100
    const maxWidth = 800
    const maxHeight = 1000

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
        // No image URL or dimensions, use current size or default
        return {
          width: node.width || baseWidth,
          height: node.height || baseHeight
        }
      }
    } else if (node.type === 'list') {
      // List nodes: preserve user-set dimensions, only grow if needed
      const childCount = node.childIds?.length || 0
      const headerHeight = 40
      const childItemHeight = 150 // Height per child folder (140px + margin)
      const padding = 16
      const emptyStateHeight = 100 // Height when empty

      const minListWidth = 380 // Wider to accommodate full folder nodes
      const minListHeight = childCount > 0 ? headerHeight + padding + (childCount * childItemHeight) + 20 : emptyStateHeight

      // IMPORTANT: Only grow the list if it needs to accommodate content, never shrink it
      // If user has manually resized the list larger, preserve their size
      const currentWidth = node.width || minListWidth
      const currentHeight = node.height || minListHeight

      const newHeight = Math.min(maxHeight, Math.max(minListHeight, currentHeight))
      const newWidth = Math.min(maxWidth, Math.max(minListWidth, currentWidth))

      return {
        width: newWidth,
        height: newHeight
      }
    } else if (node.type === 'folder') {
      // Folder nodes: scalable both horizontally and vertically like text nodes
      return {
        width: node.width || baseWidth,
        height: node.height || baseHeight
      }
    }

    // Default: return current size or base size
    return {
      width: node.width || baseWidth,
      height: node.height || baseHeight
    }
  }


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
    
    // Only allow folder nodes to be added to list containers
    if (targetNode?.type === 'list' && draggedNodeObj && draggedNodeId !== targetNodeId && !draggedNodeObj.parentId) {
      if (draggedNodeObj.type !== 'folder') {
        toast.error('Lists can only contain folder nodes. Convert this node to a folder first.')
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

  const getNodeIcon = (type?: string) => {
    switch (type) {
      case 'character': return <User className="w-5 h-5" />
      case 'event': return <Calendar className="w-5 h-5" />
      case 'location': return <MapPin className="w-5 h-5" />
      case 'folder': return <Folder className="w-5 h-5" />
      case 'list': return <List className="w-5 h-5" />
      case 'image': return <Image className="w-5 h-5" />
      default: return <Type className="w-5 h-5" />
    }
  }

  return (
    <div className="w-full h-full overflow-hidden flex bg-background">
      {/* Left Sidebar */}
      <div className="w-20 bg-card border-r border-border flex flex-col items-center py-4 gap-3 z-20 max-h-screen hover-scrollable">
        {/* Navigation Tools */}
        <div className="flex flex-col gap-1">
          <Button 
            size="sm" 
            variant={tool === 'pan' ? 'default' : 'outline'}
            onClick={() => {
              setTool('pan')
              setSelectedId(null)
            }}
            className={`h-12 w-14 p-0 ${tool === 'pan' ? 'bg-blue-600 text-white' : ''}`}
            title="Pan Tool - Move around the canvas"
          >
            <Hand className="w-7 h-7" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'select' ? 'default' : 'outline'}
            onClick={() => setTool('select')}
            className={`h-12 w-14 p-0 ${tool === 'select' ? 'bg-green-600 text-white' : ''}`}
            title="Select Tool - Click and interact with nodes"
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
            title="Add Event - Click canvas to create"
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
            <Image className="w-7 h-7" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'connect' ? 'default' : 'outline'}
            onClick={() => setTool('connect')}
            className={`h-12 w-14 p-0 ${tool === 'connect' ? 'bg-orange-600 text-white' : ''}`}
            title="Connect Nodes - Click two nodes to connect"
          >
            <Zap className="w-7 h-7" />
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

        {/* Canvas Controls */}
        <div className="flex flex-col gap-1">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => resizeCanvasAndRepositionNodes(2000, 1500, 'plot structure')}
            className="h-11 w-14 p-0"
            title="Center nodes on canvas"
          >
            <Move className="w-5 h-5" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-border my-2" />

        {/* Color Tools */}
        <div className="flex flex-col items-center gap-1">
          <PaletteSelector
            mode="advanced"
            scope={colorContext.currentFolderId ? "folder" : "project"}
            contextId={colorContext.currentFolderId || storyId}
            onColorSelect={(color) => {
              if (selectedId) {
                handleColorChange(selectedId, color)
              } else {
                toast.info('Select a node first to apply color')
              }
            }}
            onPaletteChange={(palette) => {
              // Apply palette based on current context
              if (colorContext.currentFolderId) {
                // We're in a folder - set folder palette
                colorContext.setFolderPalette(colorContext.currentFolderId, palette)
              } else {
                // We're at project level - set project palette
                colorContext.setProjectPalette(storyId, palette)
              }
              
              // Apply the palette immediately
              colorContext.applyPalette(palette)
              
              // Reset all nodes to use the new theme colors
              resetAllNodesToThemeColors()
              
              // Force re-render to update node colors
              setPaletteRefresh(prev => prev + 1)
            }}
          />
          <ColorFilter
            nodes={nodes}
            onFilterChange={setVisibleNodeIds}
          />
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-auto" style={{ backgroundColor: 'var(--color-canvas-bg, hsl(var(--background)))' }}>
        {/* Help Panel */}
        {showHelp && (
          <div className="fixed top-16 right-4 z-50 max-w-xs sm:max-w-sm">
            <Card className="p-3 bg-card/95 backdrop-blur-sm border border-border text-xs sm:text-sm shadow-lg">
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
                <div><strong>Select:</strong> Click nodes to select, click again to edit</div>
                <div><strong>Move:</strong> Drag selected nodes to reposition them</div>
                <div><strong>Create:</strong> Select a tool then click on canvas</div>
                <div><strong>Navigate:</strong> Double-click folder nodes to enter</div>
                <div><strong>Organize:</strong> Drag nodes into list containers (📦)</div>
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
        
        {/* Help toggle when hidden */}
        {!showHelp && (
          <div className="fixed top-16 right-4 z-50">
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

        <div 
          ref={canvasRef}
          className={`canvas-grid relative ${
            tool === 'pan' ? 'cursor-grab' : 
            tool === 'select' ? 'cursor-default' : 
            'cursor-crosshair'
          } ${isPanning ? 'cursor-grabbing' : ''}`}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
          style={{
            width: '2000px',
            height: '1500px',
            minWidth: '2000px',
            minHeight: '1500px'
          }}
        >
          {/* Render nodes */}
          {viewportNodes.filter(node => !node.parentId).map(node => {
            const renderSettings = PerformanceOptimizer.getOptimalRenderSettings(nodes.length, isMoving)
            const nodeDetails = { showTitle: true, showContent: true } // Always show all details in fixed canvas
            const isDropTarget = dropTarget === node.id
            const childNodes = node.childIds ? nodes.filter(n => node.childIds?.includes(n.id)) : []
            
            return (
            <div
              key={node.id}
              data-node-id={node.id}
              draggable={node.type !== 'list'}
              className={`absolute border-2 rounded-lg p-3 cursor-default hover:shadow-lg shadow-sm ${
                selectedId === node.id ? 'ring-2 ring-primary' : ''
              } ${
                connectingFrom === node.id ? 'ring-2 ring-orange-500' : ''
              } ${
                isDropTarget ? 'ring-2 ring-green-500 bg-green-50' : ''
              } ${
                renderSettings.skipAnimations ? '' : 'transition-all'
              }`}
              style={{
                left: draggingNode === node.id ? dragPosition.x : node.x,
                top: draggingNode === node.id ? dragPosition.y : node.y,
                width: node.width,
                height: node.height,
                backgroundColor: getNodeColor(node.type || 'text', node.color, node.id),
                borderColor: selectedId === node.id ? 'hsl(var(--primary))' : getNodeBorderColor(node.type || 'text')
              }}
              onClick={(e) => handleNodeClick(node, e)}
              onDoubleClick={() => handleNodeDoubleClick(node)}
              onDragStart={(e) => handleDragStart(e, node.id)}
              onDragOver={(e) => handleDragOver(e, node.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, node.id)}
            >
              {/* Node header - skip for image nodes as they have integrated headers */}
              {node.type !== 'image' && (
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div style={{ color: getNodeBorderColor(node.type || 'text') }}>
                    {getNodeIcon(node.type)}
                  </div>
                  <div
                    contentEditable
                    suppressContentEditableWarning={true}
                    data-content-type="title"
                    className="flex-1 font-medium text-sm outline-none bg-transparent border-none cursor-text"
                    style={{
                      color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                      caretColor: getTextColor(getNodeColor(node.type || 'text', node.color, node.id))
                    }}
                    onInput={(e) => {
                      const newText = e.currentTarget.textContent || ''
                      const updatedNodes = nodes.map(n =>
                        n.id === node.id ? { ...n, text: newText } : n
                      )
                      setNodes(updatedNodes)

                      // Real-time auto-resize for title (but not for list nodes)
                      if (node.type !== 'list') {
                        const target = e.currentTarget as HTMLElement
                        if (target) {
                          // Delayed resize to avoid cursor jumping
                          setTimeout(() => autoResizeNode(node.id, target, true), 300)
                        }
                      }
                    }}
                    // Removed onKeyUp to prevent cursor jumping
                    onPaste={(e) => {
                      // Handle paste operations (but not auto-resize for list nodes)
                      if (node.type !== 'list') {
                        const target = e.currentTarget as HTMLElement
                        if (target) {
                          setTimeout(() => autoResizeNode(node.id, target, true), 200)
                        }
                      }
                    }}
                    onBlur={() => {
                      saveToHistory(nodes, connections)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Focus the text editing area when clicked
                      e.currentTarget.focus()
                    }}
                    onFocus={(e) => {
                      // Let the browser handle cursor positioning naturally
                      // Don't override the user's click position
                    }}
                    spellCheck={false}
                  >
                  </div>
                </div>
                {/* Drag handle - always visible */}
                <div
                  className="flex items-center justify-center w-6 h-6 bg-muted/50 hover:bg-muted rounded cursor-move opacity-60 hover:opacity-100"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    // Store initial mouse position and prepare for potential drag
                    setDragStartPos({ x: e.clientX, y: e.clientY })
                    setIsDragReady(node.id)

                    // Calculate offset from mouse to node's top-left corner for when dragging actually starts
                    const rect = canvasRef.current?.getBoundingClientRect()
                    if (rect) {
                      const mouseX = e.clientX - rect.left
                      const mouseY = e.clientY - rect.top

                      setDragOffset({
                        x: mouseX - node.x,
                        y: mouseY - node.y
                      })
                    }
                  }}
                  title="Drag to move node"
                >
                  {/* 3 horizontal lines icon */}
                  <div className="flex flex-col gap-0.5">
                    <div className="w-3 h-0.5 bg-current"></div>
                    <div className="w-3 h-0.5 bg-current"></div>
                    <div className="w-3 h-0.5 bg-current"></div>
                  </div>
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
                      <div className="space-y-1">
                        {childNodes.map((childNode, index) => (
                          <div
                            key={childNode.id}
                            className="mb-2 last:mb-0"
                            style={{
                              width: '100%',
                              height: '140px' // Standard folder height
                            }}
                          >
                            {/* Full folder node structure */}
                            <div
                              className="relative bg-card rounded-lg border-2 cursor-pointer transition-all duration-200 w-full h-full"
                              style={{
                                borderColor: getNodeBorderColor(childNode.type || 'folder'),
                                backgroundColor: getNodeColor(childNode.type || 'folder', childNode.color, childNode.id),
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedId(childNode.id)
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation()
                                handleNodeDoubleClick(childNode)
                              }}
                            >
                              {/* Header with title and controls */}
                              <div className="flex items-center justify-between p-2 pb-1">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div style={{ color: getNodeBorderColor(childNode.type || 'folder') }}>
                                    {getNodeIcon(childNode.type)}
                                  </div>
                                  <div
                                    contentEditable
                                    suppressContentEditableWarning={true}
                                    data-content-type="title"
                                    className="flex-1 bg-transparent border-none outline-none font-medium text-sm cursor-text min-w-0"
                                    style={{
                                      color: getTextColor(getNodeColor(childNode.type || 'folder', childNode.color, childNode.id)),
                                      caretColor: getTextColor(getNodeColor(childNode.type || 'folder', childNode.color, childNode.id))
                                    }}
                                    onInput={(e) => {
                                      const newText = e.currentTarget.textContent || ''
                                      const updatedNodes = nodes.map(n =>
                                        n.id === childNode.id ? { ...n, text: newText } : n
                                      )
                                      setNodes(updatedNodes)
                                    }}
                                    onBlur={() => {
                                      saveToHistory(nodes, connections)
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.currentTarget.focus()
                                    }}
                                    onFocus={(e) => {
                                      // Let the browser handle cursor positioning naturally
                                    }}
                                    spellCheck={false}
                                    data-placeholder="Folder title..."
                                  >
                                    {childNode.text || ''}
                                  </div>
                                </div>
                                {/* Drag handle for child folder nodes */}
                                <div
                                  className="flex items-center justify-center w-6 h-6 bg-muted/50 hover:bg-muted rounded cursor-move opacity-60 hover:opacity-100 mr-1"
                                  onMouseDown={(e) => {
                                    e.stopPropagation()
                                    setDragStartPos({ x: e.clientX, y: e.clientY })
                                    setIsDragReady(childNode.id)
                                    const rect = canvasRef.current?.getBoundingClientRect()
                                    if (rect) {
                                      const mouseX = e.clientX - rect.left
                                      const mouseY = e.clientY - rect.top
                                      setDragOffset({
                                        x: mouseX - childNode.x,
                                        y: mouseY - childNode.y
                                      })
                                    }
                                  }}
                                  title="Drag to move folder"
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <div className="w-3 h-0.5 bg-current"></div>
                                    <div className="w-3 h-0.5 bg-current"></div>
                                    <div className="w-3 h-0.5 bg-current"></div>
                                  </div>
                                </div>
                                {/* Remove from container button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeFromContainer(childNode.id)
                                  }}
                                  className="text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"
                                  title="Remove from container"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Content area */}
                              <div className="px-2 pb-2">
                                <div
                                  contentEditable
                                  suppressContentEditableWarning={true}
                                  data-content-type="content"
                                  className="w-full bg-transparent border-none outline-none text-sm min-h-[3.5rem] max-h-full overflow-auto cursor-text leading-relaxed"
                                  style={{
                                    color: getTextColor(getNodeColor(childNode.type || 'folder', childNode.color, childNode.id)),
                                    caretColor: getTextColor(getNodeColor(childNode.type || 'folder', childNode.color, childNode.id))
                                  }}
                                  onInput={(e) => {
                                    const newContent = e.currentTarget.textContent || ''
                                    const updatedNodes = nodes.map(n =>
                                      n.id === childNode.id ? { ...n, content: newContent } : n
                                    )
                                    setNodes(updatedNodes)
                                  }}
                                  onBlur={() => {
                                    saveToHistory(nodes, connections)
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.currentTarget.focus()
                                  }}
                                  spellCheck={false}
                                  data-placeholder="Write your content here..."
                                >
                                </div>
                              </div>

                              {/* Folder indicator */}
                              <div className="absolute bottom-1 right-1 flex items-center gap-1">
                                {colorContext.getFolderPalette(childNode.id) && (
                                  <span className="text-xs" title="Has custom color palette">🎨</span>
                                )}
                                <span className="text-xs font-medium" style={{ color: getNodeBorderColor('folder') }}>→</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4" style={{ color: 'color-mix(in srgb, var(--node-border-default, hsl(var(--border))) 75%, transparent)' }}>
                        <div className="text-sm mb-1">Empty Folder List</div>
                        <div className="text-xs">Drag folder nodes here to organize them</div>
                        <div className="text-xs mt-1" style={{ color: 'color-mix(in srgb, var(--node-border-default, hsl(var(--border))) 75%, transparent)' }}>⚠ Only accepts folder nodes</div>
                      </div>
                    )}
                  </div>
                ) : node.type === 'image' ? (
                  // Polaroid-style image node with integrated header
                  <div
                    className="w-full h-full cursor-pointer relative"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Create hidden file input and trigger it
                      const fileInput = document.createElement('input')
                      fileInput.type = 'file'
                      fileInput.accept = 'image/*'
                      fileInput.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            const imageUrl = event.target?.result as string

                            // Store the image first, then resize node based on dimensions
                            const updatedNodes = nodes.map(n =>
                              n.id === node.id ? {
                                ...n,
                                imageUrl
                              } : n
                            )
                            setNodes(updatedNodes)

                            // Create temporary image to get dimensions and resize node
                            const tempImg = new Image()
                            tempImg.onload = () => {
                              console.log('Image loaded, dimensions:', tempImg.naturalWidth, 'x', tempImg.naturalHeight)

                              const naturalWidth = tempImg.naturalWidth
                              const naturalHeight = tempImg.naturalHeight

                              // Calculate Polaroid proportions
                              let imageWidth = Math.min(320, naturalWidth)
                              let imageHeight = Math.min(320, naturalHeight)

                              // Maintain aspect ratio if we scaled down
                              const aspectRatio = naturalWidth / naturalHeight
                              if (naturalWidth > 320 || naturalHeight > 320) {
                                if (naturalWidth > naturalHeight) {
                                  imageWidth = 320
                                  imageHeight = imageWidth / aspectRatio
                                } else {
                                  imageHeight = 320
                                  imageWidth = imageHeight * aspectRatio
                                }
                              }

                              // Polaroid frame: integrated design
                              const frameWidth = imageWidth + 40  // 20px padding each side
                              const frameHeight = imageHeight + 120 // 40px top for header, 80px bottom for caption

                              const nodeWidth = Math.round(frameWidth)
                              const nodeHeight = Math.round(frameHeight)

                              console.log('Calculated integrated Polaroid size:', nodeWidth, 'x', nodeHeight)

                              const resizedNodes = updatedNodes.map(n =>
                                n.id === node.id ? {
                                  ...n,
                                  width: nodeWidth,
                                  height: nodeHeight,
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
                            }
                            tempImg.onerror = () => {
                              console.error('Failed to load image for sizing')
                            }
                            tempImg.src = imageUrl
                          }
                          reader.readAsDataURL(file)
                        }
                      }
                      fileInput.click()
                    }}
                  >
                    {/* Integrated Polaroid Frame with Header */}
                    <div
                      className="w-full h-full rounded-lg shadow-lg relative"
                      style={{
                        backgroundColor: getNodeColor(node.type, node.color, node.id),
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    >

                      {/* Integrated header area */}
                      <div className="flex items-center justify-between px-4 py-2 gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div style={{ color: getTextColor(getNodeColor(node.type, node.color, node.id)) }}>
                            {getNodeIcon(node.type)}
                          </div>
                          <div
                            contentEditable
                            suppressContentEditableWarning={true}
                            data-content-type="title"
                            className="flex-1 font-medium text-sm outline-none bg-transparent border-none cursor-text"
                            style={{
                              color: getTextColor(getNodeColor(node.type, node.color, node.id)),
                              caretColor: getTextColor(getNodeColor(node.type, node.color, node.id))
                            }}
                            onInput={(e) => {
                              const newText = e.currentTarget.textContent || ''
                              const updatedNodes = nodes.map(n =>
                                n.id === node.id ? { ...n, text: newText } : n
                              )
                              setNodes(updatedNodes)
                            }}
                            onBlur={() => {
                              saveToHistory(nodes, connections)
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              e.currentTarget.focus()
                            }}
                            onFocus={(e) => {
                              // Let the browser handle cursor positioning naturally
                            }}
                            spellCheck={false}
                          >
                          </div>
                        </div>
                        {/* Integrated drag handle */}
                        <div
                          className="flex items-center justify-center w-6 h-6 rounded cursor-move opacity-60 hover:opacity-100 transition-opacity"
                          style={{
                            backgroundColor: getTextColor(getNodeColor(node.type, node.color, node.id)) + '20'
                          }}
                          onMouseDown={(e) => {
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
                          }}
                          title="Drag to move node"
                        >
                          {/* 3 horizontal lines icon */}
                          <div className="flex flex-col gap-0.5">
                            <div
                              className="w-3 h-0.5"
                              style={{ backgroundColor: getTextColor(getNodeColor(node.type, node.color, node.id)) }}
                            ></div>
                            <div
                              className="w-3 h-0.5"
                              style={{ backgroundColor: getTextColor(getNodeColor(node.type, node.color, node.id)) }}
                            ></div>
                            <div
                              className="w-3 h-0.5"
                              style={{ backgroundColor: getTextColor(getNodeColor(node.type, node.color, node.id)) }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Polaroid photo area */}
                      <div className="px-4 pb-12">
                        {/* Image area */}
                        <div
                          className="w-full bg-gray-50 rounded border-2 border-gray-100 overflow-hidden relative"
                          style={{
                            height: node.attributes?.imageHeight ? `${node.attributes.imageHeight}px` : '200px',
                            aspectRatio: node.attributes?.imageWidth && node.attributes?.imageHeight
                              ? `${node.attributes.imageWidth} / ${node.attributes.imageHeight}`
                              : '4/3'
                          }}
                        >
                          {node.imageUrl ? (
                            <img
                              src={node.imageUrl}
                              alt={node.text || 'Image'}
                              className="w-full h-full object-cover"
                              style={{ display: 'block' }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center">
                              <div
                                style={{
                                  color: 'color-mix(in srgb, var(--node-border-default, hsl(var(--border))) 60%, transparent)'
                                }}
                              >
                                <div className="text-3xl mb-2">📸</div>
                                <div className="text-sm mb-1 font-medium">Add Photo</div>
                                <div className="text-xs">Click to browse</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Caption area - Polaroid style */}
                        <div
                          className="absolute bottom-4 left-4 right-4 text-center"
                          style={{ height: '32px' }}
                        >
                          <div
                            contentEditable
                            suppressContentEditableWarning={true}
                            data-content-type="caption"
                            className="w-full bg-transparent border-none outline-none text-sm text-center cursor-text"
                            style={{
                              color: getTextColor(getNodeColor(node.type, node.color, node.id)),
                              caretColor: getTextColor(getNodeColor(node.type, node.color, node.id)),
                              fontFamily: 'cursive, sans-serif',
                              lineHeight: '1.2'
                            }}
                            onInput={(e) => {
                              const newCaption = e.currentTarget.textContent || ''
                              const updatedNodes = nodes.map(n =>
                                n.id === node.id ? { ...n, content: newCaption } : n
                              )
                              setNodes(updatedNodes)
                            }}
                            onBlur={() => {
                              saveToHistory(nodes, connections)
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              e.currentTarget.focus()
                            }}
                            spellCheck={false}
                            data-placeholder={node.imageUrl ? "Add a caption..." : ""}
                          >
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  // Text/other node content
                  <div
                    contentEditable
                    suppressContentEditableWarning={true}
                    data-content-type="content"
                    className="w-full bg-transparent border-none outline-none text-sm min-h-[4rem] max-h-full overflow-auto cursor-text leading-relaxed"
                    style={{
                      color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                      caretColor: getTextColor(getNodeColor(node.type || 'text', node.color, node.id))
                    }}
                    onInput={(e) => {
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
                          setTimeout(() => autoResizeNode(node.id, target, false), 300)
                        }
                      }
                    }}
                    // Removed onKeyUp to prevent cursor jumping
                    onPaste={(e) => {
                      // Handle paste operations for text nodes
                      if (node.type === 'text' || !node.type) {
                        const target = e.currentTarget as HTMLElement
                        if (target) {
                          setTimeout(() => autoResizeNode(node.id, target), 200)
                        }
                      }
                    }}
                    onBlur={() => {
                      saveToHistory(nodes, connections)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Focus the text editing area when clicked
                      e.currentTarget.focus()
                    }}
                    onFocus={(e) => {
                      // Let the browser handle cursor positioning naturally
                      // Don't override the user's click position
                    }}
                    spellCheck={false}
                    data-placeholder="Write your content here..."
                  >
                  </div>
                )}
                </div>
              )}

              {/* Special node indicators */}
              {node.type === 'folder' && (
                <div className="absolute bottom-1 right-1 flex items-center gap-1">
                  {colorContext.getFolderPalette(node.id) && (
                    <span className="text-xs" title="Has custom color palette">🎨</span>
                  )}
                  <span className="text-xs font-medium" style={{ color: getNodeBorderColor('folder') }}>→</span>
                </div>
              )}
              {node.type === 'list' && (
                <div className="absolute bottom-1 right-1">
                  <span className="text-xs font-medium" style={{ color: getNodeBorderColor('list') }}>📦</span>
                </div>
              )}

              {/* Resize handles for selected nodes (not for child nodes within list containers) */}
              {selectedId === node.id && tool === 'select' && !node.parentId && (
                <>
                  {/* Bottom-right corner resize handle */}
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm cursor-se-resize hover:bg-primary/80 border border-background"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      setResizingNode(node.id)
                      setResizeStartSize({ width: node.width, height: node.height })
                      setResizeStartPos({ x: e.clientX, y: e.clientY })
                    }}
                    title="Resize node"
                  />

                  {/* Right edge resize handle (width only) */}
                  {node.type !== 'image' && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-8 bg-primary/70 rounded-sm cursor-e-resize hover:bg-primary/90"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        setResizingNode(node.id)
                        setResizeStartSize({ width: node.width, height: node.height })
                        setResizeStartPos({ x: e.clientX, y: e.clientY })
                      }}
                      title="Resize width"
                    />
                  )}

                  {/* Bottom edge resize handle (height only) */}
                  {node.type !== 'image' && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-8 h-2 bg-primary/70 rounded-sm cursor-s-resize hover:bg-primary/90"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        setResizingNode(node.id)
                        setResizeStartSize({ width: node.width, height: node.height })
                        setResizeStartPos({ x: e.clientX, y: e.clientY })
                      }}
                      title="Resize height"
                    />
                  )}

                  {/* Image-specific resize indicator */}
                  {node.type === 'image' && (
                    <div className="absolute -top-6 left-0 text-xs text-primary bg-background border border-primary rounded px-1">
                      Maintains ratio
                    </div>
                  )}

                  {/* List container resize indicator */}
                  {node.type === 'list' && (
                    <div className="absolute -top-6 left-0 text-xs text-primary bg-background border border-primary rounded px-1">
                      Scales children
                    </div>
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

    </div>
  )
}