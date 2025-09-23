'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Minus, MousePointer, Hand, Type, Folder, User, MapPin, Calendar, Undo, Redo, X, List, Move, Image as ImageIcon, ArrowUp, ArrowDown, Table } from 'lucide-react'
import { toast } from 'sonner'
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
  type?: 'text' | 'character' | 'event' | 'location' | 'folder' | 'list' | 'image' | 'table'
  color?: string
  linkedCanvasId?: string
  imageUrl?: string
  profileImageUrl?: string // For character nodes profile pictures
  attributes?: any
  tableData?: { label: string; value: string }[] // For table nodes
  // Container properties for list nodes
  parentId?: string // If this node is inside a container
  childIds?: string[] // If this node is a container (for list nodes)
  layoutMode?: 'single-column' | 'multi-column' // Layout for list containers
  // Layer control
  zIndex?: number // Layer ordering (higher = on top)
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
  const [tool, setTool] = useState<'pan' | 'select' | 'text' | 'character' | 'event' | 'location' | 'folder' | 'list' | 'image' | 'table' | 'connect'>('pan')
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
  const [zoom, setZoom] = useState(1)
  const [zoomCenter, setZoomCenter] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

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

  // Debounced resize function to prevent conflicts and race conditions
  const debouncedResizeRef = useRef<Record<string, NodeJS.Timeout>>({})
  const debouncedAutoResize = useCallback((nodeId: string, element: HTMLElement | null, isTitle = false, delay = 250) => {
    // Clear any existing timeout for this node
    if (debouncedResizeRef.current[nodeId]) {
      clearTimeout(debouncedResizeRef.current[nodeId])
    }

    // Set new timeout
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
          // Skip auto-resize for image and character nodes - they maintain their fixed sizes
          if (node.type === 'image' || node.type === 'character') {
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
    if (!['text', 'character', 'event', 'location', 'folder', 'list', 'image', 'table'].includes(tool)) return

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
      width: tool === 'list' ? 320 : tool === 'image' ? 300 : tool === 'character' ? 320 : tool === 'table' ? 280 : 200,  // Table nodes medium width
      height: tool === 'list' ? 240 : tool === 'image' ? 200 : tool === 'character' ? 72 : tool === 'table' ? 200 : 120, // Table nodes taller for rows
      type: tool,
      // Don't set color - let it use dynamic theme colors
      ...(tool === 'folder' ? { linkedCanvasId: `${tool}-canvas-${Date.now()}` } : {}),
      ...(tool === 'list' ? { childIds: [], layoutMode: 'single-column' as const } : {}),
      ...(tool === 'table' ? { tableData: getDefaultTableData() } : {})
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
      // Check if mouse moved enough to start dragging (very small threshold for immediate response)
      const deltaX = e.clientX - dragStartPos.x
      const deltaY = e.clientY - dragStartPos.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (distance > 2) { // Reduced threshold for more responsive dragging
        setDraggingNode(isDragReady)
        setIsDragReady(null)
        setIsMoving(true)
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
      // Check if the dragged node was dropped onto a list container
      const draggedNodeObj = nodes.find(n => n.id === draggingNode)
      let droppedIntoList = false

      if (draggedNodeObj && (draggedNodeObj.type === 'folder' || draggedNodeObj.type === 'character') && !draggedNodeObj.parentId) {
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
        // Update the actual node position when dragging ends (normal canvas drop)
        const updatedNodes = nodes.map(node =>
          node.id === draggingNode
            ? { ...node, x: dragPosition.x, y: dragPosition.y }
            : node
        )
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
      toast.success('Node resized')
    }
    
    if (isMoving) {
      // Delay to allow final render with high quality after movement stops
      setTimeout(() => setIsMoving(false), 100)
    }
  }, [isMoving, draggingNode, isDragReady, resizingNode, nodes, connections, saveToHistory, dragPosition])

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
      case 'table': return 'Character Info'
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
      default: return 'What would you like to write about?'
    }
  }

  const getDefaultTableData = () => {
    return [
      { label: 'Name', value: '' },
      { label: 'Age', value: '' },
      { label: 'Role', value: '' },
      { label: 'Height', value: '' },
      { label: 'Job', value: '' }
    ]
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
          const nodeHeight = childNode.type === 'character' ? 72 : 140 // Character nodes are 72px, folders are 140px
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

  const getNodeIcon = (type?: string) => {
    switch (type) {
      case 'character': return <User className="w-5 h-5" />
      case 'event': return <Calendar className="w-5 h-5" />
      case 'location': return <MapPin className="w-5 h-5" />
      case 'folder': return <Folder className="w-5 h-5" />
      case 'list': return <List className="w-5 h-5" />
      case 'image': return <ImageIcon className="w-5 h-5" />
      case 'table': return <Table className="w-5 h-5" />
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
            <ImageIcon className="w-7 h-7" />
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
                <div><strong>Navigate:</strong> Click arrow (→) on folder/character nodes to enter</div>
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
                    selectedId === node.id ? 'ring-2 ring-primary' : ''
                  } ${
                    connectingFrom === node.id ? 'ring-2 ring-orange-500' : ''
                  }`}
                  style={{
                    left: draggingNode === node.id ? dragPosition.x : node.x,
                    top: draggingNode === node.id ? dragPosition.y : node.y,
                    width: node.width,
                    height: node.height,
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '0',
                    margin: '0'
                  }}
                  onClick={(e) => handleNodeClick(node, e)}
                  onMouseDown={(e) => {
                    // For image nodes, allow dragging from anywhere except when double-clicking for upload
                    e.preventDefault()
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
                >
                  {node.imageUrl ? (
                    <img
                      src={node.imageUrl}
                      alt="Image"
                      className="cursor-move"
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        border: 'none',
                        outline: 'none'
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
                      className="w-full h-full cursor-pointer flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: getNodeColor('image', node.color, node.id),
                        border: `2px solid ${getNodeBorderColor('image')}`,
                        color: getTextColor(getNodeColor('image', node.color, node.id))
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

                  {/* Add corner resize handle for image nodes when selected */}
                  {selectedId === node.id && (
                    <div
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm cursor-se-resize hover:bg-primary/80 border border-background"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        setResizingNode(node.id)
                        setResizeStartSize({ width: node.width, height: node.height })
                        setResizeStartPos({ x: e.clientX, y: e.clientY })
                      }}
                      title="Resize image (maintains aspect ratio)"
                    />
                  )}
                </div>
              )
            }

            // Render character nodes with profile picture layout
            if (node.type === 'character') {
              return (
                <div
                  key={node.id}
                  data-node-id={node.id}
                  className={`absolute border-2 rounded-lg overflow-hidden cursor-move hover:shadow-lg shadow-sm node-background ${
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
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Explicitly prevent any double-click navigation for character nodes
                  }}
                  onMouseDown={(e) => {
                    // Check if user is clicking on text content areas that should be editable
                    const target = e.target as HTMLElement
                    const isTextElement = target.contentEditable === 'true' ||
                                         target.tagName === 'INPUT' ||
                                         target.tagName === 'TEXTAREA' ||
                                         target.closest('[contenteditable="true"]')

                    // Only start drag if NOT clicking on editable text
                    if (!isTextElement) {
                      e.preventDefault()
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
                    <div
                      className="flex-shrink-0 w-16 h-16 ml-2 mr-3 bg-muted rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:bg-muted/80"
                      onClick={(e) => {
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
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <User className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Character name area */}
                    <div className="flex-1 pr-8 min-w-0 flex items-center">
                      <div
                        contentEditable
                        suppressContentEditableWarning={true}
                        data-content-type="title"
                        className="font-medium text-sm outline-none bg-transparent border-none cursor-text hover:bg-muted/20 rounded px-1 w-full"
                        style={{
                          color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                          caretColor: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        onBlur={(e) => {
                          const newText = e.currentTarget.textContent || ''
                          const updatedNodes = nodes.map(n =>
                            n.id === node.id ? { ...n, text: newText } : n
                          )
                          setNodes(updatedNodes)
                          saveToHistory(updatedNodes, connections)
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          e.currentTarget.focus()
                        }}
                        spellCheck={false}
                        data-placeholder="Character name..."
                      >
                        {node.text || ''}
                      </div>
                    </div>

                    {/* Navigation arrow - clickable */}
                    <div
                      className="absolute bottom-1 right-1 p-1 cursor-pointer hover:bg-black/10 rounded"
                      onClick={async (e) => {
                        e.stopPropagation()
                        // Single click navigation for character nodes
                        if (node.linkedCanvasId && onNavigateToCanvas) {
                            onNavigateToCanvas(node.linkedCanvasId, node.text)
                        } else if (!node.linkedCanvasId && onNavigateToCanvas) {
                          const linkedCanvasId = `character-canvas-${node.id}-${Date.now()}`
                          const updatedNodes = nodes.map(n =>
                            n.id === node.id ? { ...n, linkedCanvasId } : n
                          )
                          setNodes(updatedNodes)
                          saveToHistory(updatedNodes, connections)

                          // CRITICAL: Save immediately to ensure persistence
                          if (onSave) {
                            await onSave(updatedNodes, connections)
                          }

                          onNavigateToCanvas(linkedCanvasId, node.text)
                        }
                      }}
                      title="Open character development"
                    >
                      <span className="text-2xl font-bold" style={{ color: getNodeBorderColor('character') }}>→</span>
                    </div>
                  </div>

                  {/* Resize handles for character nodes */}
                  {selectedId === node.id && (
                    <>
                      {/* Right edge resize handle (width only) */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-8 bg-primary/70 rounded-sm cursor-e-resize hover:bg-primary/90"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setResizingNode(node.id)
                          setResizeStartSize({ width: node.width, height: node.height })
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
              className={`absolute border-2 rounded-lg p-3 cursor-move hover:shadow-lg shadow-sm node-background ${
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
              onDoubleClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Explicitly prevent any double-click navigation for folder nodes
              }}
              onMouseDown={(e) => {
                // Check if user is clicking on text content areas that should be editable
                const target = e.target as HTMLElement
                const isTextElement = target.contentEditable === 'true' ||
                                     target.tagName === 'INPUT' ||
                                     target.tagName === 'TEXTAREA' ||
                                     target.closest('[contenteditable="true"]')

                // Only start drag if NOT clicking on editable text
                if (!isTextElement) {
                  e.preventDefault()
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
                    className="flex-1 font-medium text-sm outline-none bg-transparent border-none cursor-text hover:bg-muted/20 rounded px-1"
                    style={{
                      color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)),
                      caretColor: getTextColor(getNodeColor(node.type || 'text', node.color, node.id))
                    }}
                    onInput={(e) => {
                      const newText = e.currentTarget.textContent || ''
                      // Save cursor position before state update
                      const selection = window.getSelection()
                      let cursorOffset = 0
                      if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0)
                        cursorOffset = range.startOffset
                      }

                      const updatedNodes = nodes.map(n =>
                        n.id === node.id ? { ...n, text: newText } : n
                      )
                      setNodes(updatedNodes)

                      // Restore cursor position after state update
                      setTimeout(() => {
                        const element = e.currentTarget
                        if (element && document.activeElement === element) {
                          const textNode = element.firstChild
                          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                            const newRange = document.createRange()
                            const newSelection = window.getSelection()
                            const safeOffset = Math.min(cursorOffset, textNode.textContent?.length || 0)
                            newRange.setStart(textNode, safeOffset)
                            newRange.setEnd(textNode, safeOffset)
                            newSelection?.removeAllRanges()
                            newSelection?.addRange(newRange)
                          }
                        }
                      }, 0)

                      // Real-time auto-resize for title (but not for list nodes)
                      if (node.type !== 'list') {
                        const target = e.currentTarget as HTMLElement
                        if (target) {
                          // Delayed resize to avoid cursor jumping
                          debouncedAutoResize(node.id, target, true)
                        }
                      }
                    }}
                    // Removed onKeyUp to prevent cursor jumping
                    onPaste={(e) => {
                      // Handle paste operations (but not auto-resize for list nodes)
                      if (node.type !== 'list') {
                        const target = e.currentTarget as HTMLElement
                        if (target) {
                          debouncedAutoResize(node.id, target, true)
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
                        {childNodes.map((childNode, index) => {
                          // Determine height based on node type
                          const childHeight = childNode.type === 'character' ? '72px' : '140px'

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
                                borderColor: getNodeBorderColor(childNode.type || 'folder'),
                                backgroundColor: getNodeColor(childNode.type || 'folder', childNode.color, childNode.id),
                              }}
              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedId(childNode.id)
                              }}
                              onDoubleClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // Explicitly prevent any double-click navigation for child folder nodes in lists
                              }}
                              onMouseDown={(e) => {
                                // Check if user is clicking on text content areas that should be editable
                                const target = e.target as HTMLElement
                                const isTextElement = target.contentEditable === 'true' ||
                                                     target.tagName === 'INPUT' ||
                                                     target.tagName === 'TEXTAREA' ||
                                                     target.closest('[contenteditable="true"]')

                                // Only start drag if NOT clicking on editable text
                                if (!isTextElement) {
                                  // Child folder nodes also skip our mouse-based movement completely
                                  if (childNode.type === 'folder') {
                                    return // Don't interfere with HTML5 drag at all
                                  }

                                  // For non-folder child nodes, use mouse-based movement
                                  e.preventDefault()
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
                                }
                              }}
                            >
                              {/* Render character nodes with profile picture layout */}
                              {childNode.type === 'character' ? (
                                <>
                                  <div className="flex items-center gap-3 p-2 h-full">
                                    {/* Profile picture */}
                                    <div
                                      className="flex-shrink-0 w-12 h-12 bg-muted rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const fileInput = document.createElement('input')
                                        fileInput.type = 'file'
                                        fileInput.accept = 'image/*'
                                        fileInput.onchange = async (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0]
                                          if (file) {
                                            const reader = new FileReader()
                                            reader.onload = async (event) => {
                                              const imageUrl = event.target?.result as string
                                              setImageToCrop(imageUrl)
                                              setCroppingNodeId(childNode.id)
                                              setShowCropModal(true)
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
                                          <User className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Character name */}
                                    <div className="flex-1 min-w-0 flex items-center">
                                      <div
                                        contentEditable
                                        suppressContentEditableWarning={true}
                                        data-content-type="title"
                                        className="flex-1 bg-transparent border-none outline-none font-medium text-sm cursor-text hover:bg-muted/20 rounded px-1 whitespace-nowrap overflow-hidden"
                                        style={{
                                          color: getTextColor(getNodeColor(childNode.type, childNode.color, childNode.id)),
                                          caretColor: getTextColor(getNodeColor(childNode.type, childNode.color, childNode.id))
                                        }}
                                        onBlur={(e) => {
                                          const newText = e.currentTarget.textContent || ''
                                          const updatedNodes = nodes.map(n =>
                                            n.id === childNode.id ? { ...n, text: newText } : n
                                          )
                                          setNodes(updatedNodes)
                                          saveToHistory(updatedNodes, connections)
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          e.currentTarget.focus()
                                        }}
                                        spellCheck={false}
                                        data-placeholder="Character name..."
                                      >
                                        {childNode.text || ''}
                                      </div>
                                    </div>

                                    {/* Remove button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeFromContainer(childNode.id)
                                      }}
                                      className="text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 flex-shrink-0"
                                      title="Remove from container"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>

                                    {/* Navigation arrow */}
                                    <div
                                      className="flex-shrink-0 p-1 cursor-pointer hover:bg-black/10 rounded"
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
                                          const folderPalette = colorContext.getFolderPalette(currentNode.id)
                                          if (folderPalette) {
                                            colorContext.applyPalette(folderPalette)
                                          }
                                          console.log('Navigating to EXISTING canvas:', currentNode.linkedCanvasId, 'with title:', nodeTitle)
                                          onNavigateToCanvas(currentNode.linkedCanvasId, nodeTitle)
                                        } else {
                                          // Create new linkedCanvasId
                                          const linkedCanvasId = `character-canvas-${currentNode.id}-${Date.now()}`
                                          console.log('Creating NEW linkedCanvasId:', linkedCanvasId)

                                          const updatedNodes = nodes.map(n =>
                                            n.id === currentNode.id ? { ...n, linkedCanvasId } : n
                                          )

                                          console.log('Updated node in array:', updatedNodes.find(n => n.id === currentNode.id))

                                          // Update state
                                          setNodes(updatedNodes)
                                          saveToHistory(updatedNodes, connections)

                                          // CRITICAL: Save immediately to ensure persistence
                                          if (onSave) {
                                            console.log('Saving to database BEFORE navigation...')
                                            await onSave(updatedNodes, connections)
                                            console.log('Save complete!')
                                          } else {
                                            console.log('WARNING: No onSave callback!')
                                          }

                                          colorContext.setCurrentFolderId(currentNode.id)
                                          console.log('Navigating to NEW canvas:', linkedCanvasId, 'with title:', nodeTitle)
                                          onNavigateToCanvas(linkedCanvasId, nodeTitle)
                                        }
                                        console.log('=== END DEBUG ===')
                                      }}
                                      title="Open character development"
                                    >
                                      <span className="text-2xl font-bold" style={{ color: getNodeBorderColor('character') }}>→</span>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Header with title and controls for folder nodes */}
                                  <div className="flex items-center justify-between p-2 pb-1">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div style={{ color: getNodeBorderColor(childNode.type || 'folder') }}>
                                    {getNodeIcon(childNode.type)}
                                  </div>
                                  <div
                                    contentEditable
                                    suppressContentEditableWarning={true}
                                    data-content-type="title"
                                    className="flex-1 bg-transparent border-none outline-none font-medium text-sm cursor-text min-w-0 hover:bg-muted/20 rounded px-1"
                                    style={{
                                      color: getTextColor(getNodeColor(childNode.type || 'folder', childNode.color, childNode.id)),
                                      caretColor: getTextColor(getNodeColor(childNode.type || 'folder', childNode.color, childNode.id))
                                    }}
                                    onInput={(e) => {
                                      // Don't update state immediately to avoid cursor jumping
                                      // State will be updated on blur instead
                                    }}
                                    onBlur={(e) => {
                                      const newText = e.currentTarget.textContent || ''
                                      const updatedNodes = nodes.map(n =>
                                        n.id === childNode.id ? { ...n, text: newText } : n
                                      )
                                      setNodes(updatedNodes)
                                      saveToHistory(updatedNodes, connections)
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
                                  className="w-full bg-transparent border-none outline-none text-sm min-h-[3.5rem] max-h-full overflow-auto cursor-text leading-relaxed hover:bg-muted/10 rounded px-1"
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
                                <div
                                  className="p-1 cursor-pointer hover:bg-black/10 rounded"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    // CRITICAL: Get the most up-to-date node from the nodes array
                                    const currentNode = nodes.find(n => n.id === childNode.id)
                                    if (!currentNode || !onNavigateToCanvas) return

                                    const nodeTitle = currentNode.text || 'Folder'

                                    // Use currentNode for linkedCanvasId, not childNode!
                                    if (currentNode.linkedCanvasId) {
                                      // Switch to folder color context when entering a folder
                                      colorContext.setCurrentFolderId(currentNode.id)
                                      // Apply folder palette if it exists
                                      const folderPalette = colorContext.getFolderPalette(currentNode.id)
                                      if (folderPalette) {
                                        colorContext.applyPalette(folderPalette)
                                      }
                                      onNavigateToCanvas(currentNode.linkedCanvasId, nodeTitle)
                                    } else {
                                      // Create new linkedCanvasId
                                      const linkedCanvasId = `folder-canvas-${currentNode.id}-${Date.now()}`
                                      const updatedNodes = nodes.map(n =>
                                        n.id === currentNode.id ? { ...n, linkedCanvasId } : n
                                      )

                                      // Update state
                                      setNodes(updatedNodes)
                                      saveToHistory(updatedNodes, connections)

                                      // CRITICAL: Save immediately to ensure persistence
                                      if (onSave) {
                                        await onSave(updatedNodes, connections)
                                      }

                                      // Switch to folder color context
                                      colorContext.setCurrentFolderId(currentNode.id)
                                      onNavigateToCanvas(linkedCanvasId, nodeTitle)
                                    }
                                  }}
                                  title="Open folder"
                                >
                                  <span className="text-2xl font-bold" style={{ color: getNodeBorderColor('folder') }}>→</span>
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
                        <div className="text-xs">Drag folder or character nodes here to organize them</div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Text/other node content
                  <div
                    contentEditable
                    suppressContentEditableWarning={true}
                    data-content-type="content"
                    className="w-full bg-transparent border-none outline-none text-sm min-h-[4rem] max-h-full overflow-auto cursor-text leading-relaxed hover:bg-muted/10 rounded px-1"
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
                  <div
                    className="p-1 cursor-pointer hover:bg-black/10 rounded"
                    onClick={async (e) => {
                      e.stopPropagation()
                      // Single click navigation for folder nodes
                      if (node.linkedCanvasId && onNavigateToCanvas) {
                        // Switch to folder color context when entering a folder
                        colorContext.setCurrentFolderId(node.id)
                        // Apply folder palette if it exists
                        const folderPalette = colorContext.getFolderPalette(node.id)
                        if (folderPalette) {
                          colorContext.applyPalette(folderPalette)
                        }
                        onNavigateToCanvas(node.linkedCanvasId, node.text)
                      } else if (!node.linkedCanvasId && onNavigateToCanvas) {
                        const linkedCanvasId = `folder-canvas-${node.id}-${Date.now()}`
                        const updatedNodes = nodes.map(n =>
                          n.id === node.id ? { ...n, linkedCanvasId } : n
                        )
                        setNodes(updatedNodes)
                        saveToHistory(updatedNodes, connections)

                        // CRITICAL: Save immediately to ensure persistence
                        if (onSave) {
                          await onSave(updatedNodes, connections)
                        }

                        // Switch to folder color context
                        colorContext.setCurrentFolderId(node.id)
                        onNavigateToCanvas(linkedCanvasId, node.text)
                      }
                    }}
                    title="Open folder"
                  >
                    <span className="text-2xl font-bold" style={{ color: getNodeBorderColor('folder') }}>→</span>
                  </div>
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
                    setNodes(updatedNodes)
                    saveToHistory(updatedNodes, connections)
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

    </div>
  )
}