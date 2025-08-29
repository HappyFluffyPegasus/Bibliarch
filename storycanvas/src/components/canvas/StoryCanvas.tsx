'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Rect, Text, Group, Line, Circle } from 'react-konva'
import type Konva from 'konva'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Maximize2, Save, MousePointer, Hand, Type, Trash2, Edit2, GitBranch, User, MapPin, Calendar, Folder } from 'lucide-react'
import { toast } from 'sonner'

interface Node {
  id: string
  x: number
  y: number
  text: string
  width: number
  height: number
  type?: 'text' | 'character' | 'event' | 'location' | 'folder'
  color?: string
  linkedCanvasId?: string  // For folder nodes
  attributes?: {
    traits?: string[]
    motivation?: string
    role?: string
    age?: string
    description?: string
  }
}

interface Connection {
  id: string
  from: string
  to: string
  type?: 'leads-to' | 'conflicts-with' | 'relates-to'
}

interface StoryCanvasProps {
  storyId: string
  initialNodes?: Node[]
  initialConnections?: Connection[]
  onSave?: (nodes: Node[], connections: Connection[]) => void
  onNavigateToCanvas?: (canvasId: string, nodeTitle: string) => void
}

export default function StoryCanvas({ storyId, initialNodes = [], initialConnections = [], onSave, onNavigateToCanvas }: StoryCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [tool, setTool] = useState<'select' | 'pan' | 'text' | 'connect' | 'character' | 'event' | 'location' | 'folder'>('select')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editAttributes, setEditAttributes] = useState<any>({})
  const [newTrait, setNewTrait] = useState('')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  // CRITICAL: Update state when props change (when navigating between canvases)
  useEffect(() => {
    console.log('Canvas props changed, updating state:', { initialNodes, initialConnections })
    setNodes(initialNodes)
    setConnections(initialConnections)
    // Reset selection states when canvas changes
    setSelectedId(null)
    setConnectingFrom(null)
    setEditingNodeId(null)
  }, [initialNodes, initialConnections])

  // Track the previous values to detect real changes
  const prevNodesRef = useRef(initialNodes)
  const prevConnectionsRef = useRef(initialConnections)

  // Auto-save when nodes or connections change
  useEffect(() => {
    // Don't save if we just loaded new props
    const propsJustChanged = (
      prevNodesRef.current !== initialNodes ||
      prevConnectionsRef.current !== initialConnections
    )
    
    if (propsJustChanged) {
      prevNodesRef.current = initialNodes
      prevConnectionsRef.current = initialConnections
      console.log('Props just changed, skipping auto-save')
      return
    }
    
    // Skip auto-save if both are empty and we just navigated
    // This prevents saving empty data when first entering a folder
    if (nodes.length === 0 && connections.length === 0 && 
        initialNodes.length === 0 && initialConnections.length === 0) {
      console.log('Empty canvas, skipping auto-save')
      return
    }
    
    // Create a debounced save timer
    const saveTimer = setTimeout(() => {
      if (onSave) {
        console.log('Auto-saving canvas:', { nodes, connections })
        onSave(nodes, connections)
        // Silent save - no toast for auto-save to avoid spam
      }
    }, 1500) // Save after 1.5 seconds of no changes

    return () => clearTimeout(saveTimer)
  }, [nodes, connections, initialNodes, initialConnections])

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('canvas-container')
      if (container) {
        setDimensions({
          width: container.offsetWidth,
          height: container.offsetHeight
        })
      }
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Handle wheel zoom
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const oldScale = scale
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1
    const boundedScale = Math.max(0.1, Math.min(5, newScale))

    setScale(boundedScale)
    setPosition({
      x: pointer.x - mousePointTo.x * boundedScale,
      y: pointer.y - mousePointTo.y * boundedScale
    })
  }, [scale, position])

  // Handle drag for panning
  const handleDragEnd = (e: any) => {
    if (tool === 'pan') {
      const stage = e.target.getStage()
      if (stage) {
        setPosition({
          x: stage.x(),
          y: stage.y()
        })
      }
    }
  }

  // Zoom controls
  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.2, 5)
    setScale(newScale)
  }

  const handleZoomOut = () => {
    const newScale = Math.max(scale / 1.2, 0.1)
    setScale(newScale)
  }

  const handleZoomReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // Add a new node of specified type
  const handleAddNode = (nodeType: 'text' | 'character' | 'event' | 'location' | 'folder' = 'text') => {
    const nodeDefaults: Record<string, any> = {
      text: { text: 'New story element', color: '#ffffff', width: 200, height: 100 },
      character: { 
        text: 'New Character', 
        color: '#fef3c7', 
        width: 220, 
        height: 140,
        attributes: {
          traits: [],
          motivation: '',
          role: '',
          age: '',
          description: ''
        }
      },
      event: { text: 'New Event', color: '#fce7f3', width: 200, height: 100 },
      location: { text: 'New Location', color: '#e0e7ff', width: 200, height: 100 },
      folder: { 
        text: 'New Section', 
        color: '#d4d4d8', 
        width: 240, 
        height: 120,
        linkedCanvasId: `canvas-${Date.now()}`
      }
    }
    
    const defaults = nodeDefaults[nodeType]
    const newNode: Node = {
      id: `node-${Date.now()}`,
      x: (dimensions.width / 2 - position.x) / scale,
      y: (dimensions.height / 2 - position.y) / scale,
      type: nodeType,
      ...defaults
    }
    setNodes([...nodes, newNode])
    setSelectedId(newNode.id)
    toast.success(`Added new ${nodeType} node`)
  }

  // Update node position
  const handleNodeDragEnd = (e: any, nodeId: string) => {
    const node = e.target
    setNodes(nodes.map(n => 
      n.id === nodeId 
        ? { ...n, x: node.x(), y: node.y() } 
        : n
    ))
  }

  // Save canvas
  const handleSaveCanvas = () => {
    if (onSave) {
      onSave(nodes, connections)
      toast.success('Canvas saved successfully')
    }
  }

  // Handle node click for connections
  const handleNodeClick = (nodeId: string) => {
    if (tool === 'connect') {
      if (!connectingFrom) {
        // Start connection
        setConnectingFrom(nodeId)
        toast.info('Click another node to connect')
      } else if (connectingFrom === nodeId) {
        // Cancel if clicking same node
        setConnectingFrom(null)
        toast.info('Connection cancelled')
      } else {
        // Complete connection
        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          from: connectingFrom,
          to: nodeId,
          type: 'leads-to'
        }
        setConnections([...connections, newConnection])
        setConnectingFrom(null)
        toast.success('Nodes connected!')
      }
    } else {
      setSelectedId(nodeId)
    }
  }

  // Delete connection
  const handleDeleteConnection = (connId: string) => {
    setConnections(connections.filter(c => c.id !== connId))
    toast.success('Connection removed')
  }

  // Get node center position for connections
  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }
    return {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2
    }
  }

  // Delete selected node
  const handleDeleteNode = () => {
    if (selectedId) {
      setNodes(nodes.filter(n => n.id !== selectedId))
      // Also remove connections to/from this node
      setConnections(connections.filter(c => c.from !== selectedId && c.to !== selectedId))
      setSelectedId(null)
      toast.success('Node deleted')
    }
  }

  // Start editing node
  const handleEditNode = () => {
    if (selectedId) {
      const node = nodes.find(n => n.id === selectedId)
      if (node) {
        setEditingNodeId(selectedId)
        setEditText(node.text)
        setEditAttributes(node.attributes || {})
      }
    }
  }

  // Save edited text
  const handleSaveEdit = () => {
    if (editingNodeId) {
      const node = nodes.find(n => n.id === editingNodeId)
      setNodes(nodes.map(n => 
        n.id === editingNodeId 
          ? { 
              ...n, 
              text: editText,
              attributes: node?.type === 'character' ? editAttributes : n.attributes 
            } 
          : n
      ))
      setEditingNodeId(null)
      setEditText('')
      setEditAttributes({})
      toast.success('Node updated')
    }
  }

  // Handle double click to edit or navigate
  const handleNodeDoubleClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      if (node.type === 'folder' && node.linkedCanvasId && onNavigateToCanvas) {
        // Navigate to the linked canvas
        onNavigateToCanvas(node.linkedCanvasId, node.text)
      } else {
        // Edit the node
        setSelectedId(nodeId)
        setEditingNodeId(nodeId)
        setEditText(node.text)
        setEditAttributes(node.attributes || {})
      }
    }
  }

  // Handle key presses
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId && !editingNodeId) {
        handleDeleteNode()
      } else if (e.key === 'Escape' && editingNodeId) {
        setEditingNodeId(null)
        setEditText('')
      } else if (e.key === 'Enter' && editingNodeId && e.ctrlKey) {
        handleSaveEdit()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedId, editingNodeId, editText])

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Help text */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-3 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 max-w-xs">
          <p className="text-xs text-muted-foreground">
            <strong>Tips:</strong> Double-click nodes to edit • 
            {tool === 'connect' ? ' Click two nodes to connect them' : 
             selectedId ? ' Press Delete to remove • Double-click to edit attributes' : 
             ' Click toolbar buttons to add nodes'}
          </p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <Card className="p-2 flex items-center gap-2 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
          {/* Tool Selection */}
          <div className="flex gap-1 border-r pr-2 mr-2">
            <Button
              variant={tool === 'select' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setTool('select')
                setConnectingFrom(null)
              }}
              title="Select tool"
            >
              <MousePointer className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'pan' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setTool('pan')
                setConnectingFrom(null)
              }}
              title="Pan tool"
            >
              <Hand className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setTool('text')
                handleAddNode('text')
                setConnectingFrom(null)
              }}
              title="Add text node"
            >
              <Type className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'character' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setTool('character')
                handleAddNode('character')
                setConnectingFrom(null)
              }}
              title="Add character node"
            >
              <User className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'event' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setTool('event')
                handleAddNode('event')
                setConnectingFrom(null)
              }}
              title="Add event node"
            >
              <Calendar className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'location' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setTool('location')
                handleAddNode('location')
                setConnectingFrom(null)
              }}
              title="Add location node"
            >
              <MapPin className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'folder' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setTool('folder')
                handleAddNode('folder')
                setConnectingFrom(null)
              }}
              title="Add folder/section node"
            >
              <Folder className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'connect' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setTool('connect')
                setSelectedId(null)
              }}
              title="Connect nodes"
              className={connectingFrom ? 'bg-purple-600 text-white' : ''}
            >
              <GitBranch className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex gap-1 border-r pr-2 mr-2">
            <Button variant="ghost" size="sm" onClick={handleZoomOut}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-xs px-2 py-1 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomReset}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Node Actions */}
          {selectedId && (
            <div className="flex gap-1 border-r pr-2 mr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditNode}
                title="Edit node (or double-click)"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteNode}
                title="Delete node (or press Delete)"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-400">
            ✓ Auto-saving
          </div>
        </Card>
      </div>

      {/* Canvas */}
      <div 
        id="canvas-container"
        className="flex-1 bg-gray-50 dark:bg-gray-950 canvas-grid"
      >
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          draggable={tool === 'pan'}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
        >
          <Layer>
            {/* Grid background effect is handled by CSS */}
            
            {/* Render connections first (behind nodes) */}
            {connections.map((conn) => {
              const fromPos = getNodeCenter(conn.from)
              const toPos = getNodeCenter(conn.to)
              return (
                <Line
                  key={conn.id}
                  points={[fromPos.x, fromPos.y, toPos.x, toPos.y]}
                  stroke={conn.type === 'conflicts-with' ? '#ef4444' : '#9333ea'}
                  strokeWidth={2}
                  opacity={0.6}
                  onClick={() => handleDeleteConnection(conn.id)}
                  onTap={() => handleDeleteConnection(conn.id)}
                />
              )
            })}
            
            {/* Render nodes */}
            {nodes.map((node) => (
              <Group
                key={node.id}
                id={`node-${node.id}`}
                x={node.x}
                y={node.y}
                draggable={tool === 'select'}
                onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
                onClick={() => handleNodeClick(node.id)}
                onTap={() => handleNodeClick(node.id)}
                onDblClick={() => handleNodeDoubleClick(node.id)}
                onDblTap={() => handleNodeDoubleClick(node.id)}
                onMouseEnter={() => {
                  setHoveredNodeId(node.id)
                  document.body.style.cursor = 'pointer'
                }}
                onMouseLeave={() => {
                  setHoveredNodeId(null)
                  document.body.style.cursor = 'default'
                }}
                opacity={hoveredNodeId && hoveredNodeId !== node.id ? 0.5 : 1}
              >
                {/* Node background */}
                <Rect
                  width={node.width}
                  height={node.height}
                  fill={node.color || 'white'}
                  stroke={
                    connectingFrom === node.id 
                      ? '#10b981' 
                      : selectedId === node.id 
                        ? '#9333ea'
                        : hoveredNodeId === node.id
                          ? '#6366f1'
                          : '#e2e8f0'
                  }
                  strokeWidth={connectingFrom === node.id || selectedId === node.id ? 3 : hoveredNodeId === node.id ? 2.5 : 1}
                  shadowColor={hoveredNodeId === node.id ? '#6366f1' : 'black'}
                  shadowBlur={hoveredNodeId === node.id ? 15 : 5}
                  shadowOpacity={hoveredNodeId === node.id ? 0.4 : 0.1}
                  shadowOffsetY={2}
                  cornerRadius={8}
                />
                
                {/* Node type icon */}
                {node.type === 'character' && (
                  <Circle
                    x={node.width - 25}
                    y={15}
                    radius={10}
                    fill="#9333ea"
                  />
                )}
                {node.type === 'event' && (
                  <Rect
                    x={node.width - 30}
                    y={10}
                    width={20}
                    height={20}
                    fill="#ec4899"
                    cornerRadius={4}
                  />
                )}
                {node.type === 'location' && (
                  <Rect
                    x={node.width - 30}
                    y={10}
                    width={20}
                    height={20}
                    fill="#3b82f6"
                    cornerRadius={10}
                  />
                )}
                
                {/* Node text */}
                <Text
                  x={10}
                  y={10}
                  width={node.width - 40}
                  height={30}
                  text={node.text}
                  fontSize={16}
                  fontStyle={node.type === 'character' ? 'bold' : 'normal'}
                  fill="#1f2937"
                  align="left"
                  verticalAlign="top"
                  wrap="word"
                />
                
                {/* Helper text for all nodes - shows when they have default/minimal content */}
                {((node.type === 'character' && (!node.attributes?.motivation && (!node.attributes?.traits || node.attributes.traits.length === 0))) ||
                  (node.type === 'event' && node.text === 'New Event') ||
                  (node.type === 'location' && node.text === 'New Location') ||
                  (node.type === 'folder' && node.text === 'New Section') ||
                  (node.type === 'text' && node.text === 'New story element')) && (
                  <Text
                    x={10}
                    y={node.height - 25}
                    text="Double-click to edit"
                    fontSize={11}
                    fill="#6366f1"
                    fontStyle="italic"
                  />
                )}
                
                {/* Character attributes display */}
                {node.type === 'character' && node.attributes && (
                  <>
                    {node.attributes.role && (
                      <Text
                        x={10}
                        y={40}
                        text={node.attributes.role}
                        fontSize={12}
                        fill="#6b7280"
                        fontStyle="italic"
                      />
                    )}
                    {node.attributes.traits && node.attributes.traits.length > 0 && (
                      <Text
                        x={10}
                        y={60}
                        width={node.width - 20}
                        text={node.attributes.traits.slice(0, 3).join(', ')}
                        fontSize={11}
                        fill="#9333ea"
                        wrap="word"
                      />
                    )}
                    {node.attributes.motivation && (
                      <Text
                        x={10}
                        y={80}
                        width={node.width - 20}
                        height={50}
                        text={`"${node.attributes.motivation}"`}
                        fontSize={10}
                        fill="#6b7280"
                        wrap="word"
                        ellipsis={true}
                      />
                    )}
                  </>
                )}
                
                {/* Event type indicator */}
                {node.type === 'event' && (
                  <Text
                    x={10}
                    y={40}
                    width={node.width - 20}
                    height={node.height - 50}
                    text="📅 Event"
                    fontSize={12}
                    fill="#ec4899"
                    fontStyle="italic"
                  />
                )}
                
                {/* Location type indicator */}
                {node.type === 'location' && (
                  <Text
                    x={10}
                    y={40}
                    width={node.width - 20}
                    height={node.height - 50}
                    text="📍 Location"
                    fontSize={12}
                    fill="#3b82f6"
                    fontStyle="italic"
                  />
                )}
                
                {/* Text node indicator */}
                {(!node.type || node.type === 'text') && node.text !== 'New story element' && (
                  <Text
                    x={10}
                    y={40}
                    width={node.width - 20}
                    height={node.height - 50}
                    text="📝 Note"
                    fontSize={11}
                    fill="#6b7280"
                    fontStyle="italic"
                  />
                )}
                
                {/* Folder node indicator */}
                {node.type === 'folder' && (
                  <>
                    <Text
                      x={10}
                      y={40}
                      text="📁 Section"
                      fontSize={12}
                      fill="#71717a"
                      fontStyle="italic"
                    />
                    <Text
                      x={10}
                      y={node.height - 25}
                      text={node.text === 'New Section' ? "Double-click to enter" : "Double-click to open"}
                      fontSize={10}
                      fill="#3b82f6"
                      fontStyle="italic"
                    />
                  </>
                )}
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingNodeId} onOpenChange={(open) => {
        if (!open) {
          setEditingNodeId(null)
          setEditText('')
          setEditAttributes({})
          setNewTrait('')
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit {(() => {
                const nodeType = nodes.find(n => n.id === editingNodeId)?.type
                return nodeType === 'character' ? 'Character' : 
                       nodeType === 'event' ? 'Event' :
                       nodeType === 'location' ? 'Location' : 'Story'
              })()} Node
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Name/Text */}
            <div>
              <Label htmlFor="node-text">
                {(() => {
                  const nodeType = nodes.find(n => n.id === editingNodeId)?.type
                  return nodeType === 'character' ? 'Character Name' : 
                         nodeType === 'event' ? 'Event Title' :
                         nodeType === 'location' ? 'Location Name' : 'Content'
                })()}
              </Label>
              <Textarea
                id="node-text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder={(() => {
                  const nodeType = nodes.find(n => n.id === editingNodeId)?.type
                  return nodeType === 'character' ? 'Enter character name...' : 
                         nodeType === 'event' ? 'What happens in this event?' :
                         nodeType === 'location' ? 'Name or describe this location...' : 'Enter your story text...'
                })()}
                className="min-h-[80px] mt-2"
                autoFocus
              />
            </div>
            
            {/* Character-specific attributes */}
            {nodes.find(n => n.id === editingNodeId)?.type === 'character' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* Role */}
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={editAttributes.role || ''}
                      onValueChange={(value) => setEditAttributes({...editAttributes, role: value})}
                    >
                      <SelectTrigger id="role" className="mt-2">
                        <SelectValue placeholder="Select a role..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Protagonist">Protagonist</SelectItem>
                        <SelectItem value="Antagonist">Antagonist</SelectItem>
                        <SelectItem value="Supporting">Supporting</SelectItem>
                        <SelectItem value="Minor">Minor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Age */}
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      value={editAttributes.age || ''}
                      onChange={(e) => setEditAttributes({...editAttributes, age: e.target.value})}
                      placeholder="e.g., 25, teenager, elderly"
                      className="mt-2"
                    />
                  </div>
                </div>
                
                {/* Motivation */}
                <div>
                  <Label htmlFor="motivation">Motivation</Label>
                  <Textarea
                    id="motivation"
                    value={editAttributes.motivation || ''}
                    onChange={(e) => setEditAttributes({...editAttributes, motivation: e.target.value})}
                    placeholder="What drives this character?"
                    className="min-h-[60px] mt-2"
                  />
                </div>
                
                {/* Traits */}
                <div>
                  <Label>Character Traits</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newTrait}
                      onChange={(e) => setNewTrait(e.target.value)}
                      placeholder="Add a trait..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTrait.trim()) {
                          e.preventDefault()
                          const traits = editAttributes.traits || []
                          setEditAttributes({...editAttributes, traits: [...traits, newTrait.trim()]})
                          setNewTrait('')
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newTrait.trim()) {
                          const traits = editAttributes.traits || []
                          setEditAttributes({...editAttributes, traits: [...traits, newTrait.trim()]})
                          setNewTrait('')
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(editAttributes.traits || []).map((trait: string, index: number) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => {
                          const traits = [...(editAttributes.traits || [])]
                          traits.splice(index, 1)
                          setEditAttributes({...editAttributes, traits})
                        }}
                      >
                        {trait} ×
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editAttributes.description || ''}
                    onChange={(e) => setEditAttributes({...editAttributes, description: e.target.value})}
                    placeholder="Physical appearance, backstory, notes..."
                    className="min-h-[80px] mt-2"
                  />
                </div>
              </>
            )}
            
            <p className="text-xs text-muted-foreground">
              Tip: Press Ctrl+Enter to save, Escape to cancel
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingNodeId(null)
                setEditText('')
                setEditAttributes({})
                setNewTrait('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}