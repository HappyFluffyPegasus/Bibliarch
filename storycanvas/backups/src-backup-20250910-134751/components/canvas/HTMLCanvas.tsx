'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Minus, Maximize2, MousePointer, Hand, Type, Folder, User, MapPin, Calendar, Trash2, Undo, Redo, X, List, Zap } from 'lucide-react'
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
  const [tool, setTool] = useState<'pan' | 'select' | 'text' | 'character' | 'event' | 'location' | 'folder' | 'list' | 'connect'>('pan')
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editingContentId, setEditingContentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [showHelp, setShowHelp] = useState(true)
  const [visibleNodeIds, setVisibleNodeIds] = useState<string[]>([])
  const [viewportNodes, setViewportNodes] = useState<Node[]>([])
  const [isMoving, setIsMoving] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [paletteRefresh, setPaletteRefresh] = useState(0) // Force re-render when palette changes
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Undo/Redo system
  const [history, setHistory] = useState<{ nodes: Node[], connections: Connection[] }[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const maxHistorySize = 50

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

  // Performance-optimized viewport calculation
  const updateViewportNodes = useCallback(
    PerformanceOptimizer.throttle(() => {
      if (nodes.length > 50) { // Only optimize for larger canvases
        const viewportBounds = PerformanceOptimizer.calculateViewportBounds(
          canvasRef.current, 
          pan, 
          scale
        )
        
        const filteredByColor = nodes.filter(node => visibleNodeIds.includes(node.id))
        const inViewportNodes = PerformanceOptimizer.getVisibleNodes(
          filteredByColor,
          viewportBounds,
          scale
        )
        
        setViewportNodes(inViewportNodes)
      } else {
        // For smaller canvases, show all visible nodes
        setViewportNodes(nodes.filter(node => visibleNodeIds.includes(node.id)))
      }
    }, 16), // Limit to 60fps
    [nodes, visibleNodeIds, pan, scale, paletteRefresh]
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
      // Don't trigger shortcuts while editing
      if (editingNodeId || editingContentId) return
      
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      } else if (e.key === 'Delete' && selectedId) {
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
  }, [undo, redo, selectedId, editingNodeId, editingContentId])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Cancel inline editing when clicking on empty canvas
    if (editingNodeId) {
      handleSaveInlineEdit()
      return
    }
    if (editingContentId) {
      handleSaveContentEdit()
      return
    }
    
    // Pan tool doesn't create nodes, only pans
    if (tool === 'pan' || tool === 'select' || isPanning) return
    
    // Only create nodes when a creation tool is selected
    if (!['text', 'character', 'event', 'location', 'folder', 'list'].includes(tool)) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left - pan.x) / scale
    const y = (e.clientY - rect.top - pan.y) / scale

    const newNode: Node = {
      id: `${tool}-${Date.now()}`,
      x: Math.max(0, x - 100),
      y: Math.max(0, y - 60),
      text: getDefaultText(tool),
      content: getDefaultContent(tool),
      width: tool === 'list' ? 320 : 200,  // List containers are wider
      height: tool === 'list' ? 240 : 120, // List containers are taller
      type: tool,
      color: getNodeColor(tool),
      ...(tool === 'folder' ? { linkedCanvasId: `${tool}-canvas-${Date.now()}` } : {}),
      ...(tool === 'list' ? { childIds: [], layoutMode: 'single-column' as const } : {})
    }

    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    setSelectedId(newNode.id)  // Select the newly created node
    setTool('select')  // Switch to select tool after creating node for immediate interaction
    toast.success(`Created ${tool} node`)
  }, [tool, scale, pan, isPanning, editingNodeId, editingContentId, nodes, connections, saveToHistory])

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
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [isPanning, lastPanPoint])

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
    if (isMoving) {
      // Delay to allow final render with high quality after movement stops
      setTimeout(() => setIsMoving(false), 100)
    }
  }, [isMoving])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    // Check if this is a zoom gesture (Ctrl + wheel or pinch)
    if (e.ctrlKey) {
      // Zoom
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      setScale(prev => Math.max(0.1, Math.min(3, prev * zoomFactor)))
    } else {
      // Pan with trackpad/scroll wheel
      const deltaX = e.deltaX
      const deltaY = e.deltaY
      
      setPan(prev => ({
        x: prev.x - deltaX,
        y: prev.y - deltaY
      }))
    }
  }, [])

  const getDefaultText = (nodeType: string) => {
    switch (nodeType) {
      case 'character': return 'New Character'
      case 'event': return 'New Event'
      case 'location': return 'New Location'
      case 'folder': return 'New Section'
      case 'list': return 'New List'
      default: return 'New Text Node'
    }
  }

  const getDefaultContent = (nodeType: string) => {
    switch (nodeType) {
      case 'character': return 'Describe this character...'
      case 'event': return 'What happens in this event?'
      case 'location': return 'Describe this location...'
      case 'folder': return 'This section contains related story elements'
      case 'list': return 'Drag nodes here to organize them in a list container'
      default: return 'Add your content here...'
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
    
    // Use palette color as base, with slight type-specific tints
    const paletteBase = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-node-default')
      .trim() || '#ffffff'
    
    // Return palette-based colors with subtle type variations
    switch (nodeType) {
      case 'character': return paletteBase  // Use palette base
      case 'event': return paletteBase      // Use palette base  
      case 'location': return paletteBase   // Use palette base
      case 'folder': return paletteBase     // Use palette base
      case 'list': return paletteBase       // Use palette base
      default: return paletteBase           // Use palette base for text nodes
    }
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

    // First click selects the node
    if (selectedId !== node.id) {
      setSelectedId(node.id)
      return
    }

    // Second click (or click on already selected node) starts inline editing
    setEditingNodeId(node.id)
    setEditingText(node.text)  // Set current text, will be selected for easy deletion
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

  const handleSaveInlineEdit = () => {
    if (!editingNodeId || !editingText.trim()) return

    const newNodes = nodes.map(node => 
      node.id === editingNodeId 
        ? { ...node, text: editingText.trim() }
        : node
    )
    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    
    setEditingNodeId(null)
    setEditingText('')
    toast.success('Node updated')
  }

  const handleCancelInlineEdit = () => {
    setEditingNodeId(null)
    setEditingText('')
  }

  const handleInlineEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveInlineEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelInlineEdit()
    }
  }

  const handleContentClick = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation()
    // Only allow content editing with select tool
    if (tool !== 'select') return

    setEditingContentId(node.id)
    setEditingContent(node.content || '')  // Set current content, will be selected for easy deletion
    setSelectedId(node.id)
  }

  const handleSaveContentEdit = () => {
    if (!editingContentId) return

    const newNodes = nodes.map(node => 
      node.id === editingContentId 
        ? { ...node, content: editingContent }
        : node
    )
    setNodes(newNodes)
    saveToHistory(newNodes, connections)
    
    setEditingContentId(null)
    setEditingContent('')
    toast.success('Content updated')
  }

  const handleCancelContentEdit = () => {
    setEditingContentId(null)
    setEditingContent('')
  }

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSaveContentEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelContentEdit()
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

  // Drag and drop handlers for list containers
  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggedNode(nodeId)
    e.dataTransfer.setData('text/plain', nodeId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetNodeId: string) => {
    const targetNode = nodes.find(n => n.id === targetNodeId)
    if (targetNode?.type === 'list' && draggedNode !== targetNodeId) {
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
    
    if (targetNode?.type === 'list' && draggedNodeObj && draggedNodeId !== targetNodeId && !draggedNodeObj.parentId) {
      // Add node to list container
      const newNodes = nodes.map(node => {
        if (node.id === targetNodeId) {
          return {
            ...node,
            childIds: [...(node.childIds || []), draggedNodeId]
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
      toast.success(`Added ${draggedNodeObj.text} to ${targetNode.text}`)
    }
    
    setDraggedNode(null)
    setDropTarget(null)
  }

  const removeFromContainer = (nodeId: string) => {
    const nodeToRemove = nodes.find(n => n.id === nodeId)
    if (!nodeToRemove?.parentId) return

    const newNodes = nodes.map(node => {
      if (node.id === nodeToRemove.parentId) {
        return {
          ...node,
          childIds: (node.childIds || []).filter(id => id !== nodeId)
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
    toast.success('Removed from container')
  }

  const handleApplyTemplate = (templateNodes: Node[], templateConnections: Connection[]) => {
    // Find an empty area on the canvas to place the template
    const findEmptyPosition = () => {
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) return { x: 100, y: 100 }

      // Start from current viewport center
      const centerX = Math.max(100, (-pan.x + canvasRect.width / 2) / scale)
      const centerY = Math.max(100, (-pan.y + canvasRect.height / 2) / scale)
      
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

    // Offset template nodes to avoid overlaps
    const offsetTemplateNodes = templateNodes.map(node => ({
      ...node,
      id: `template-${Date.now()}-${node.id}`, // Ensure unique IDs
      x: node.x + deltaX,
      y: node.y + deltaY
    }))
    
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
    
    toast.success(`Template added with ${templateNodes.length} nodes`)
  }

  const getNodeIcon = (type?: string) => {
    switch (type) {
      case 'character': return <User className="w-5 h-5" />
      case 'event': return <Calendar className="w-5 h-5" />
      case 'location': return <MapPin className="w-5 h-5" />
      case 'folder': return <Folder className="w-5 h-5" />
      case 'list': return <List className="w-5 h-5" />
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

        {/* Zoom Controls */}
        <div className="flex flex-col gap-1">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
            className="h-11 w-14 p-0"
            title="Zoom Out"
          >
            <Minus className="w-7 h-7" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setScale(1)}
            className="h-11 w-14 p-0"
            title="Reset Zoom"
          >
            <Maximize2 className="w-7 h-7" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
            className="h-11 w-14 p-0"
            title="Zoom In"
          >
            <Plus className="w-7 h-7" />
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
      <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: 'var(--color-canvas-bg, hsl(var(--background)))' }}>
        {/* Help Panel */}
        {showHelp && (
          <div className="absolute top-2 right-2 z-10 max-w-xs sm:max-w-sm">
            <Card className="p-3 bg-card/90 backdrop-blur-sm border border-border text-xs sm:text-sm">
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
                <div><strong>Create:</strong> Select a tool then click on canvas</div>
                <div><strong>Navigate:</strong> Double-click folder nodes to enter</div>
                <div><strong>Organize:</strong> Drag nodes into list containers (📦)</div>
                <div><strong>Delete:</strong> Select node and press Delete key</div>
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
          <div className="absolute top-2 right-2 z-10">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowHelp(true)}
              className="h-6 w-6 p-0 text-xs"
              title="Show help"
            >
              ?
            </Button>
          </div>
        )}

        <div 
          ref={canvasRef}
          className={`w-full h-full canvas-grid ${
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
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0'
          }}
        >
          {/* Render nodes */}
          {viewportNodes.filter(node => !node.parentId).map(node => {
            const renderSettings = PerformanceOptimizer.getOptimalRenderSettings(nodes.length, isMoving)
            const viewportBounds = PerformanceOptimizer.calculateViewportBounds(canvasRef.current, pan, scale)
            const nodeDetails = PerformanceOptimizer.shouldRenderNodeDetails(node, scale, viewportBounds)
            const isDropTarget = dropTarget === node.id
            const childNodes = node.childIds ? nodes.filter(n => node.childIds?.includes(n.id)) : []
            
            return (
            <div
              key={node.id}
              draggable={node.type !== 'list'}
              className={`absolute border-2 rounded-lg p-3 cursor-pointer hover:shadow-lg shadow-sm ${
                selectedId === node.id ? 'ring-2 ring-primary' : ''
              } ${
                connectingFrom === node.id ? 'ring-2 ring-orange-500' : ''
              } ${
                isDropTarget ? 'ring-2 ring-green-500 bg-green-50' : ''
              } ${
                renderSettings.skipAnimations ? '' : 'transition-all'
              }`}
              style={{
                left: node.x,
                top: node.y,
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
              {/* Node header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div style={{ color: getNodeBorderColor(node.type || 'text') }}>
                    {getNodeIcon(node.type)}
                  </div>
                  {editingNodeId === node.id ? (
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={handleInlineEditKeyDown}
                      className="flex-1 bg-transparent border-none outline-none font-medium text-sm focus:bg-background focus:px-1 focus:border focus:border-primary focus:rounded"
                      style={{ color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)) }}
                      autoFocus
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        e.target.select()
                      }}
                    />
                  ) : (
                    nodeDetails.showTitle && (
                      <span 
                        className="font-medium text-sm truncate flex-1"
                        style={{ color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)) }}
                      >
                        {node.text}
                      </span>
                    )
                  )}
                </div>
                {selectedId === node.id && editingNodeId !== node.id && (
                  <div className="flex items-center gap-1">
                    <ColorPicker
                      color={node.color || getNodeColor(node.type || 'text', undefined, node.id)}
                      onColorChange={(color) => handleColorChange(node.id, color)}
                      className="h-6 w-6"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteNode(node.id)
                      }}
                      className="h-6 w-6 p-0 hover:bg-destructive/20"
                    >
                      <Trash2 className="w-5 h-5 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Node content */}
              {nodeDetails.showContent && (
                <div 
                  className={`text-xs overflow-hidden ${node.type === 'list' ? 'cursor-default' : 'cursor-text hover:bg-muted/20'} rounded p-1 -m-1`}
                  style={{ color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)) }}
                  onClick={(e) => node.type !== 'list' ? handleContentClick(node, e) : null}
                >
                {node.type === 'list' ? (
                  // List container content
                  <div className="space-y-2">
                    {childNodes.length > 0 ? (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Contains {childNodes.length} item{childNodes.length !== 1 ? 's' : ''}:
                        </div>
                        {childNodes.slice(0, 4).map((childNode, index) => (
                          <div key={childNode.id} className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                            <div className="flex items-center gap-2 flex-1">
                              <div style={{ color: getNodeBorderColor(childNode.type || 'text') }}>
                                {getNodeIcon(childNode.type)}
                              </div>
                              <span className="text-xs truncate">{childNode.text}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFromContainer(childNode.id)
                              }}
                              className="text-red-500 hover:text-red-700 ml-1"
                              title="Remove from container"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {childNodes.length > 4 && (
                          <div className="text-xs text-muted-foreground">
                            +{childNodes.length - 4} more...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        <div className="text-sm mb-1">Empty Container</div>
                        <div className="text-xs">Drag nodes here to organize them</div>
                      </div>
                    )}
                  </div>
                ) : editingContentId === node.id ? (
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onKeyDown={handleContentKeyDown}
                    className="w-full bg-transparent border-none outline-none text-xs resize-none focus:bg-background focus:p-1 focus:border focus:border-primary focus:rounded h-16"
                    style={{ color: getTextColor(getNodeColor(node.type || 'text', node.color, node.id)) }}
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      e.target.select()
                    }}
                    placeholder="Write your content here..."
                  />
                ) : (
                  <div className="min-h-[2rem]">
                    <div className="text-sm">
                      {node.content && node.content.length > 80 
                        ? `${node.content.slice(0, 80)}...`
                        : node.content || 'Click to add content...'
                      }
                    </div>
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