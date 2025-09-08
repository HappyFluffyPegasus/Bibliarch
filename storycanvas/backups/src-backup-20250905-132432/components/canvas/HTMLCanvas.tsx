'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Minus, Maximize2, MousePointer, Hand, Type, Folder, User, MapPin, Calendar, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Node {
  id: string
  x: number
  y: number
  text: string
  content?: string
  width: number
  height: number
  type?: 'text' | 'character' | 'event' | 'location' | 'folder' | 'image'
  color?: string
  linkedCanvasId?: string
  imageUrl?: string
  attributes?: any
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

export default function HTMLCanvas({ 
  storyId, 
  initialNodes = [], 
  initialConnections = [], 
  onSave, 
  onNavigateToCanvas 
}: HTMLCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tool, setTool] = useState<'select' | 'text' | 'character' | 'event' | 'location' | 'folder'>('select')
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editingContentId, setEditingContentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const canvasRef = useRef<HTMLDivElement>(null)

  // Auto-save when nodes change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSave && (nodes.length > 0 || connections.length > 0)) {
        onSave(nodes, connections)
      }
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [nodes, connections, onSave])

  // Initialize nodes from props
  useEffect(() => {
    setNodes(initialNodes)
    setConnections(initialConnections)
  }, [initialNodes, initialConnections])

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
    
    if (tool === 'select' || isPanning) return
    
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
      width: 200,
      height: 120,
      type: tool,
      color: getNodeColor(tool),
      ...(tool === 'folder' ? { linkedCanvasId: `${tool}-canvas-${Date.now()}` } : {})
    }

    setNodes(prev => [...prev, newNode])
    setTool('select')
  }, [tool, scale, pan, isPanning, editingNodeId, editingContentId])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool === 'select' && e.target === canvasRef.current) {
      setIsPanning(true)
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
  }, [])

  const getDefaultText = (nodeType: string) => {
    switch (nodeType) {
      case 'character': return 'New Character'
      case 'event': return 'New Event'
      case 'location': return 'New Location'
      case 'folder': return 'New Section'
      default: return 'New Text Node'
    }
  }

  const getDefaultContent = (nodeType: string) => {
    switch (nodeType) {
      case 'character': return 'Describe this character...'
      case 'event': return 'What happens in this event?'
      case 'location': return 'Describe this location...'
      case 'folder': return 'This section contains related story elements'
      default: return 'Add your content here...'
    }
  }

  const getNodeColor = (nodeType: string) => {
    return 'hsl(var(--card))'  // Use theme-aware card color
  }

  const getNodeBorderColor = (nodeType: string) => {
    switch (nodeType) {
      case 'character': return 'hsl(45 93% 47%)'      // Amber
      case 'event': return 'hsl(330 81% 60%)'         // Pink
      case 'location': return 'hsl(142 71% 45%)'      // Green
      case 'folder': return 'hsl(221 83% 53%)'        // Blue
      default: return 'hsl(var(--border))'           // Default border
    }
  }

  const handleNodeClick = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tool !== 'select') return

    // Single click starts inline editing
    setEditingNodeId(node.id)
    setEditingText(node.text)
    setSelectedId(node.id)
  }

  const handleNodeDoubleClick = (node: Node) => {
    // Double click navigates into folders
    console.log('Double-clicking node:', node.id, 'type:', node.type, 'linkedCanvasId:', node.linkedCanvasId)
    if (node.type === 'folder' && node.linkedCanvasId && onNavigateToCanvas) {
      console.log('Navigating to canvas:', node.linkedCanvasId, 'with title:', node.text)
      onNavigateToCanvas(node.linkedCanvasId, node.text)
    } else {
      console.log('Navigation failed - missing linkedCanvasId or onNavigateToCanvas callback')
    }
  }

  const handleSaveInlineEdit = () => {
    if (!editingNodeId || !editingText.trim()) return

    setNodes(prev => prev.map(node => 
      node.id === editingNodeId 
        ? { ...node, text: editingText.trim() }
        : node
    ))
    
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
    if (tool !== 'select') return

    setEditingContentId(node.id)
    setEditingContent(node.content || '')
    setSelectedId(node.id)
  }

  const handleSaveContentEdit = () => {
    if (!editingContentId) return

    setNodes(prev => prev.map(node => 
      node.id === editingContentId 
        ? { ...node, content: editingContent }
        : node
    ))
    
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
    setNodes(prev => prev.filter(node => node.id !== nodeId))
    setConnections(prev => prev.filter(conn => conn.from !== nodeId && conn.to !== nodeId))
    setSelectedId(null)
    toast.success('Node deleted')
  }

  const getNodeIcon = (type?: string) => {
    switch (type) {
      case 'character': return <User className="w-4 h-4" />
      case 'event': return <Calendar className="w-4 h-4" />
      case 'location': return <MapPin className="w-4 h-4" />
      case 'folder': return <Folder className="w-4 h-4" />
      default: return <Type className="w-4 h-4" />
    }
  }

  return (
    <div className="w-full h-full flex bg-background">
      {/* Left Sidebar */}
      <div className="w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-2 z-20">
        {/* Tool Selection */}
        <div className="flex flex-col gap-2">
          <Button 
            size="sm" 
            variant={tool === 'select' ? 'default' : 'outline'}
            onClick={() => setTool('select')}
            className="h-12 w-12 p-0"
            title="Select Tool"
          >
            <MousePointer className="w-5 h-5" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'text' ? 'default' : 'outline'}
            onClick={() => setTool('text')}
            className="h-12 w-12 p-0"
            title="Text Node"
          >
            <Type className="w-5 h-5" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'character' ? 'default' : 'outline'}
            onClick={() => setTool('character')}
            className="h-12 w-12 p-0"
            title="Character"
          >
            <User className="w-5 h-5" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'event' ? 'default' : 'outline'}
            onClick={() => setTool('event')}
            className="h-12 w-12 p-0"
            title="Event"
          >
            <Calendar className="w-5 h-5" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'location' ? 'default' : 'outline'}
            onClick={() => setTool('location')}
            className="h-12 w-12 p-0"
            title="Location"
          >
            <MapPin className="w-5 h-5" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'folder' ? 'default' : 'outline'}
            onClick={() => setTool('folder')}
            className="h-12 w-12 p-0"
            title="Folder/Section"
          >
            <Folder className="w-5 h-5" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-border my-2" />

        {/* Zoom Controls */}
        <div className="flex flex-col gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
            className="h-10 w-12 p-0"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setScale(1)}
            className="h-10 w-12 p-0"
            title="Reset Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
            className="h-10 w-12 p-0"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-border my-2" />

        {/* Pan Tool Indicator */}
        <Button 
          size="sm" 
          variant="outline"
          className="h-10 w-12 p-0"
          title="Hold to pan (or use select tool)"
        >
          <Hand className="w-4 h-4" />
        </Button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-background">
        <div 
          ref={canvasRef}
          className={`w-full h-full ${tool === 'select' ? 'cursor-grab' : 'cursor-crosshair'} ${isPanning ? 'cursor-grabbing' : ''}`}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          style={{
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0'
          }}
        >
          {/* Render nodes */}
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg shadow-sm ${
                selectedId === node.id ? 'ring-2 ring-primary' : ''
              }`}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
                backgroundColor: getNodeColor(node.type || 'text'),
                borderColor: selectedId === node.id ? 'hsl(var(--primary))' : getNodeBorderColor(node.type || 'text')
              }}
              onClick={(e) => handleNodeClick(node, e)}
              onDoubleClick={() => handleNodeDoubleClick(node)}
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
                      onBlur={handleSaveInlineEdit}
                      className="flex-1 bg-transparent border-none outline-none font-medium text-sm text-card-foreground focus:bg-background focus:px-1 focus:border focus:border-primary focus:rounded"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="font-medium text-sm truncate text-card-foreground flex-1">{node.text}</span>
                  )}
                </div>
                {selectedId === node.id && editingNodeId !== node.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteNode(node.id)
                    }}
                    className="h-6 w-6 p-0 hover:bg-destructive/20"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                )}
              </div>
              
              {/* Node content */}
              <div 
                className="text-xs text-muted-foreground overflow-hidden cursor-text hover:bg-muted/20 rounded p-1 -m-1"
                onClick={(e) => handleContentClick(node, e)}
              >
                {editingContentId === node.id ? (
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onKeyDown={handleContentKeyDown}
                    onBlur={handleSaveContentEdit}
                    className="w-full h-16 bg-transparent border-none outline-none text-xs text-muted-foreground resize-none focus:bg-background focus:p-1 focus:border focus:border-primary focus:rounded"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Click to add content..."
                  />
                ) : (
                  <div className="min-h-[2rem]">
                    {node.content && node.content.length > 80 
                      ? `${node.content.slice(0, 80)}...`
                      : node.content || 'Click to add content...'
                    }
                  </div>
                )}
              </div>

              {/* Folder indicator */}
              {node.type === 'folder' && (
                <div className="absolute bottom-1 right-1">
                  <span className="text-xs font-medium" style={{ color: getNodeBorderColor('folder') }}>→</span>
                </div>
              )}
            </div>
          ))}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Card className="p-8 text-center max-w-md">
                <h3 className="text-lg font-medium mb-2 text-card-foreground">Empty Canvas</h3>
                <p className="text-muted-foreground mb-4">
                  Select a tool from the left sidebar and click to add nodes. Use the select tool to pan around the canvas.
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}