'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Minus, Maximize2, MousePointer, Hand, Type, Folder, User, MapPin, Calendar, Edit2, Trash2, Undo, Redo, X } from 'lucide-react'
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

// Updated with smaller sidebar and trackpad support
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
  const [tool, setTool] = useState<'pan' | 'select' | 'text' | 'character' | 'event' | 'location' | 'folder'>('pan')
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editingContentId, setEditingContentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [showHelp, setShowHelp] = useState(true)
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

  // Initialize nodes from props
  useEffect(() => {
    setNodes(initialNodes)
    setConnections(initialConnections)
    // Initialize history with the first state
    if (initialNodes.length > 0 || initialConnections.length > 0) {
      setHistory([{ nodes: initialNodes, connections: initialConnections }])
      setHistoryIndex(0)
    }
  }, [initialNodes, initialConnections])

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
    if (!['text', 'character', 'event', 'location', 'folder'].includes(tool)) return
    
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
    // Only allow node interactions with select tool
    if (tool !== 'select') return

    // First click selects the node
    if (selectedId !== node.id) {
      setSelectedId(node.id)
      return
    }

    // Second click (or click on already selected node) starts inline editing
    setEditingNodeId(node.id)
    setEditingText(node.text)
  }

  const handleNodeDoubleClick = (node: Node) => {
    // Only allow double-click navigation with select tool
    if (tool !== 'select') return
    
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
    setEditingContent(node.content || '')
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
      <div className="w-12 bg-card border-r border-border flex flex-col items-center py-3 gap-1 z-20">
        {/* Navigation Tools */}
        <div className="flex flex-col gap-1">
          <Button 
            size="sm" 
            variant={tool === 'pan' ? 'default' : 'outline'}
            onClick={() => {
              setTool('pan')
              setSelectedId(null)
            }}
            className={`h-8 w-10 p-0 ${tool === 'pan' ? 'bg-blue-600 text-white' : ''}`}
            title="Pan Tool - Move around the canvas"
          >
            <Hand className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'select' ? 'default' : 'outline'}
            onClick={() => setTool('select')}
            className={`h-8 w-10 p-0 ${tool === 'select' ? 'bg-green-600 text-white' : ''}`}
            title="Select Tool - Click and interact with nodes"
          >
            <MousePointer className="w-4 h-4" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-6 h-px bg-border my-1" />

        {/* Creation Tools */}
        <div className="flex flex-col gap-1">
          <Button 
            size="sm" 
            variant={tool === 'text' ? 'default' : 'outline'}
            onClick={() => setTool('text')}
            className={`h-8 w-10 p-0 ${tool === 'text' ? 'bg-gray-600 text-white' : ''}`}
            title="Add Text Node - Click canvas to create"
          >
            <Type className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'character' ? 'default' : 'outline'}
            onClick={() => setTool('character')}
            className={`h-8 w-10 p-0 ${tool === 'character' ? 'bg-amber-600 text-white' : ''}`}
            title="Add Character - Click canvas to create"
          >
            <User className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'event' ? 'default' : 'outline'}
            onClick={() => setTool('event')}
            className={`h-8 w-10 p-0 ${tool === 'event' ? 'bg-pink-600 text-white' : ''}`}
            title="Add Event - Click canvas to create"
          >
            <Calendar className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'location' ? 'default' : 'outline'}
            onClick={() => setTool('location')}
            className={`h-8 w-10 p-0 ${tool === 'location' ? 'bg-green-600 text-white' : ''}`}
            title="Add Location - Click canvas to create"
          >
            <MapPin className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant={tool === 'folder' ? 'default' : 'outline'}
            onClick={() => setTool('folder')}
            className={`h-8 w-10 p-0 ${tool === 'folder' ? 'bg-indigo-600 text-white' : ''}`}
            title="Add Section/Folder - Click canvas to create"
          >
            <Folder className="w-4 h-4" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-6 h-px bg-border my-1" />

        {/* Undo/Redo Controls */}
        <div className="flex flex-col gap-1">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={undo}
            disabled={historyIndex <= 0}
            className="h-7 w-10 p-0"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3 h-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="h-7 w-10 p-0"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3 h-3" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-6 h-px bg-border my-1" />

        {/* Zoom Controls */}
        <div className="flex flex-col gap-1">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
            className="h-7 w-10 p-0"
            title="Zoom Out"
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setScale(1)}
            className="h-7 w-10 p-0"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
            className="h-7 w-10 p-0"
            title="Zoom In"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {/* Help Panel */}
        {showHelp && (
          <div className="absolute top-4 right-4 z-10 max-w-sm">
            <Card className="p-4 bg-card/90 backdrop-blur-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-card-foreground">How to use:</h4>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowHelp(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div><strong>Pan:</strong> Click & drag, or use trackpad/scroll</div>
                <div><strong>Zoom:</strong> Ctrl + scroll wheel</div>
                <div><strong>Select:</strong> Click nodes to select, click again to edit</div>
                <div><strong>Create:</strong> Select a tool then click on canvas</div>
                <div><strong>Navigate:</strong> Double-click folder nodes to enter</div>
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
          <div className="absolute top-4 right-4 z-10">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowHelp(true)}
              className="h-8 w-8 p-0"
              title="Show help"
            >
              ?
            </Button>
          </div>
        )}

        <div 
          ref={canvasRef}
          className={`w-full h-full ${
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
                <h3 className="text-lg font-medium mb-2 text-card-foreground">Welcome to StoryCanvas</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your story by adding nodes to the canvas.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setTool('text')}
                    className="flex items-center gap-2"
                  >
                    <Type className="w-4 h-4" />
                    Add Text
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setTool('character')}
                    className="flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Add Character
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setTool('folder')}
                    className="flex items-center gap-2"
                  >
                    <Folder className="w-4 h-4" />
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