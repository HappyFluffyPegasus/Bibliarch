'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'

// Import Konva components using ES6 imports
import { Stage, Layer, Rect, Text, Group, Line, Circle } from 'react-konva'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Maximize2, MousePointer, Hand, Type, Trash2, Edit2, GitBranch, User, MapPin, Calendar, Folder, Image, Upload, X, List } from 'lucide-react'

interface Node {
  id: string
  x: number
  y: number
  text: string        // Title/header text
  content?: string    // Rich body content for text nodes
  width: number
  height: number
  type?: 'text' | 'character' | 'event' | 'location' | 'folder' | 'image' | 'list'
  color?: string
  linkedCanvasId?: string  // For folder nodes
  imageUrl?: string   // Profile image for characters, or main image for image nodes
  parentId?: string   // For child nodes in containers
  childIds?: string[] // For container nodes (list, folder)
  attributes?: {
    // Character-specific attributes
    traits?: string[]
    motivation?: string
    role?: string
    age?: string
    description?: string
    appearance?: string
    backstory?: string
    goals?: string[]
    fears?: string[]
    relationships?: Array<{
      characterName: string
      relationshipType: 'friend' | 'enemy' | 'family' | 'romantic' | 'mentor' | 'rival' | 'ally' | 'other'
      description: string
    }>
    arc?: string
    
    // Character template data for quick creation
    characterTemplate?: 'protagonist' | 'antagonist' | 'mentor' | 'sidekick' | 'love-interest' | 'custom'
    
    // List container attributes
    listItems?: string[]  // For simple text lists
    layoutColumns?: number // Number of columns for multi-column layout
    containerPadding?: number // Internal padding for container
    maxChildNodes?: number // Maximum child nodes (optional constraint)
    sortOrder?: 'manual' | 'alphabetical' | 'chronological' // How to order child items
  }
}

interface Connection {
  id: string
  from: string
  to: string
  type?: 'leads-to' | 'conflicts-with' | 'relates-to'
}

interface BibliarchProps {
  storyId: string
  initialNodes?: Node[]
  initialConnections?: Connection[]
  onSave?: (nodes: Node[], connections: Connection[]) => void
  onNavigateToCanvas?: (canvasId: string, nodeTitle: string) => void
}

export default function Bibliarch({ initialNodes = [], initialConnections = [], onSave, onNavigateToCanvas }: BibliarchProps) {
  // ALL HOOKS MUST BE DECLARED FIRST - before any conditional returns
  const stageRef = useRef<any>(null)
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [tool, setTool] = useState<'select' | 'pan' | 'text' | 'connect' | 'character' | 'event' | 'location' | 'folder' | 'image' | 'list'>('select')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [editText, setEditText] = useState('')
  const [editContent, setEditContent] = useState('')  // For rich body content
  const [editAttributes, setEditAttributes] = useState<any>({})
  const [newTrait, setNewTrait] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [newFear, setNewFear] = useState('')
  const [newRelationship, setNewRelationship] = useState({ characterName: '', relationshipType: '', description: '' })
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Container drag-and-drop state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [listItemToEdit, setListItemToEdit] = useState<{nodeId: string, index: number} | null>(null)
  const [newListItem, setNewListItem] = useState('')
  
  // Feature flag for curved connections - can be disabled if causing issues
  const [useCurvedConnections] = useState(true)
  
  // Inline editing state for text editing without modals
  const [inlineEditingNodeId, setInlineEditingNodeId] = useState<string | null>(null)
  const [inlineEditingField, setInlineEditingField] = useState<'title' | 'content' | null>(null)
  const [inlineEditingValue, setInlineEditingValue] = useState('')
  // Modal editing state for character nodes
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  
  // MORE HOOKS - Move all hooks to top
  const prevNodesRef = useRef(initialNodes)
  const prevConnectionsRef = useRef(initialConnections)

  // CRITICAL: Update state when props change (when navigating between canvases)
  useEffect(() => {
    console.log('Canvas props changed, updating state:', { initialNodes, initialConnections })
    // Ensure all loaded nodes have proper colors
    const nodesWithColors = initialNodes.map(node => ({
      ...node,
      color: node.color || '#87CEEB' // Ensure all nodes have at least light blue color
    }))
    setNodes(nodesWithColors)
    setConnections(initialConnections)
    // Reset selection states when canvas changes
    setSelectedId(null)
    setConnectingFrom(null)
    setInlineEditingNodeId(null)
    setInlineEditingField(null)
    setInlineEditingValue('')
  }, [initialNodes, initialConnections])

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
  }, [nodes, connections, initialNodes, initialConnections, onSave])

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

  // Update node colors when palette changes
  useEffect(() => {
    const updateNodeColors = (paletteColor?: string) => {
      // Use provided color or try to get from CSS variables, fallback to light blue
      const mainColor = paletteColor || 
        getComputedStyle(document.documentElement).getPropertyValue('--color-node-default').trim() || 
        '#87CEEB'
      
      console.log('Updating node colors to:', mainColor) // Debug log
      
      // Always update nodes, even if they already have a color
      setNodes(prevNodes => 
        prevNodes.map(node => ({
          ...node,
          color: mainColor
        }))
      )
    }

    // Listen for custom palette change events
    const handlePaletteChange = (event: any) => {
      const palette = event.detail?.palette
      if (palette?.colors?.nodeDefault) {
        console.log('Palette changed event received:', palette.colors.nodeDefault)
        updateNodeColors(palette.colors.nodeDefault)
      }
    }

    // Listen for palette change events
    window.addEventListener('paletteChanged', handlePaletteChange)

    // Also listen for style changes as backup
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style') {
          console.log('Style changed, updating colors...') // Debug log
          setTimeout(updateNodeColors, 100) // Small delay to ensure CSS is applied
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    })

    // Initial color update to ensure all nodes are light blue
    updateNodeColors()

    return () => {
      window.removeEventListener('paletteChanged', handlePaletteChange)
      observer.disconnect()
    }
  }, [])

  // Handle wheel zoom
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    let direction = e.evt.deltaY > 0 ? 1 : -1
    if (e.evt.ctrlKey) {
      direction = -direction
    }

    const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1
    const clampedScale = Math.max(0.1, Math.min(3, newScale))

    setScale(clampedScale)

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    }
    setPosition(newPos)
  }, [])

  // Auto-generate relationship connections when nodes change
  useEffect(() => {
    const generateRelationshipConnections = () => {
      const characterNodes = nodes.filter(node => node.type === 'character')
      const newConnections: Connection[] = []
      
      characterNodes.forEach(node => {
        if (node.attributes?.relationships) {
          node.attributes.relationships.forEach(relationship => {
            // Find the target character node by name
            const targetNode = characterNodes.find(n => 
              n.text.toLowerCase().includes(relationship.characterName.toLowerCase()) ||
              relationship.characterName.toLowerCase().includes(n.text.toLowerCase())
            )
            
            if (targetNode && targetNode.id !== node.id) {
              // Check if connection already exists (avoid duplicates)
              const existsAlready = connections.some(conn => 
                (conn.from === node.id && conn.to === targetNode.id) ||
                (conn.from === targetNode.id && conn.to === node.id)
              )
              
              if (!existsAlready) {
                newConnections.push({
                  id: `relationship-${node.id}-${targetNode.id}`,
                  from: node.id,
                  to: targetNode.id,
                  type: relationship.relationshipType
                })
              }
            }
          })
        }
      })
      
      // Add new connections if any were generated
      if (newConnections.length > 0) {
        setConnections(prev => [...prev, ...newConnections])
      }
    }
    
    // Generate connections when nodes change
    if (nodes.length > 0) {
      generateRelationshipConnections()
    }
  }, [nodes, connections]) // Include connections to prevent warnings

  // Handle key presses
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const handleDeleteNode = () => {
        if (!selectedId) return
        setNodes(prev => prev.filter(node => node.id !== selectedId))
        setConnections(prev => prev.filter(conn => 
          conn.from !== selectedId && conn.to !== selectedId
        ))
        setSelectedId(null)

      }

      if (e.key === 'Delete' && selectedId && !editingNodeId) {
        handleDeleteNode()
      } else if (e.key === 'Escape' && editingNodeId) {
        setEditingNodeId(null)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [selectedId, editingNodeId])

  // Phase 2: Helper functions for semantic node styling
  const getNodeBorderColor = (nodeType?: string) => {
    switch (nodeType) {
      case 'character': return '#f59e0b'  // Amber 500
      case 'event': return '#ec4899'     // Pink 500 
      case 'location': return '#10b981'  // Emerald 500
      case 'folder': return '#6366f1'    // Indigo 500
      case 'image': return '#0ea5e9'     // Sky 500
      case 'list': return '#f97316'      // Orange 500
      default: return '#d1d5db'         // Gray 300 for text nodes
    }
  }

  const getNodeShadowColor = (nodeType?: string) => {
    switch (nodeType) {
      case 'character': return '#f59e0b25'  // Amber with transparency
      case 'event': return '#ec489925'     // Pink with transparency
      case 'location': return '#10b98125'  // Emerald with transparency
      case 'folder': return '#6366f125'    // Indigo with transparency
      case 'image': return '#0ea5e925'     // Sky with transparency
      case 'list': return '#f9731625'      // Orange with transparency
      default: return '#0000001a'         // Default gray shadow
    }
  }

  // Function to determine if text should be light or dark based on background
  const getTextColor = (backgroundColor?: string) => {
    if (!backgroundColor) return '#000000'
    
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // Return white text for dark backgrounds, black text for light backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  // Container management functions
  const isNodeInContainer = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    return !!node?.parentId
  }

  const getContainerNode = (childNodeId: string) => {
    const childNode = nodes.find(n => n.id === childNodeId)
    if (!childNode?.parentId) return null
    return nodes.find(n => n.id === childNode.parentId)
  }

  const getChildNodes = (containerId: string) => {
    return nodes.filter(n => n.parentId === containerId)
  }

  const canNodeBeDroppedInContainer = (nodeId: string, containerId: string): boolean => {
    const node = nodes.find(n => n.id === nodeId)
    const container = nodes.find(n => n.id === containerId)
    
    if (!node || !container) return false
    if (node.id === container.id) return false // Can't drop node on itself
    if (node.parentId === containerId) return false // Already in this container
    if (container.type !== 'list' && container.type !== 'folder') return false // Only certain nodes are containers
    
    // Check max child limit
    const maxChildren = container.attributes?.maxChildNodes
    if (maxChildren && (container.childIds?.length || 0) >= maxChildren) return false
    
    return true
  }

  const addNodeToContainer = (nodeId: string, containerId: string) => {
    if (!canNodeBeDroppedInContainer(nodeId, containerId)) return

    setNodes(prevNodes => {
      return prevNodes.map(node => {
        if (node.id === nodeId) {
          // Remove from previous container if it had one
          const oldContainer = prevNodes.find(n => n.childIds?.includes(nodeId))
          if (oldContainer) {
            oldContainer.childIds = oldContainer.childIds?.filter(id => id !== nodeId) || []
          }
          
          // Add to new container
          return {
            ...node,
            parentId: containerId,
            // Position relative to container
            x: node.x,
            y: node.y
          }
        } else if (node.id === containerId) {
          // Add child to container
          return {
            ...node,
            childIds: [...(node.childIds || []), nodeId]
          }
        }
        return node
      })
    })
    
    // Auto-resize container if needed
    updateContainerSize(containerId)

  }

  const removeNodeFromContainer = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node?.parentId) return

    const containerId = node.parentId
    const container = nodes.find(n => n.id === containerId)
    if (!container) return

    setNodes(prevNodes => {
      return prevNodes.map(n => {
        if (n.id === nodeId) {
          // Position the node outside the container
          return { 
            ...n, 
            parentId: undefined,
            x: container.x + container.width + 20, // Place to the right of container
            y: container.y + (Math.random() * 100) // Add some randomness to avoid overlap
          }
        } else if (n.id === containerId) {
          return {
            ...n,
            childIds: n.childIds?.filter(id => id !== nodeId) || []
          }
        }
        return n
      })
    })

    // Auto-resize container
    updateContainerSize(containerId)

  }

  const updateContainerSize = (containerId: string) => {
    const container = nodes.find(n => n.id === containerId)
    if (!container || container.type !== 'list') return

    const childNodes = getChildNodes(containerId)
    const padding = container.attributes?.containerPadding || 15
    const columns = container.attributes?.layoutColumns || 1
    
    if (childNodes.length === 0) {
      // Minimum size when empty
      setNodes(prev => prev.map(n => 
        n.id === containerId 
          ? { ...n, width: 300, height: 180 }
          : n
      ))
      return
    }

    // Calculate required size based on child nodes
    const rows = Math.ceil(childNodes.length / columns)
    const nodeWidth = 200 // Standard child node width in container
    const nodeHeight = 100 // Standard child node height in container
    
    const newWidth = Math.max(300, (nodeWidth * columns) + (padding * (columns + 1)))
    const newHeight = Math.max(180, (nodeHeight * rows) + (padding * (rows + 1)) + 40) // +40 for header

    setNodes(prev => prev.map(n => 
      n.id === containerId 
        ? { ...n, width: newWidth, height: newHeight }
        : n
    ))
  }

  // Inline editing functions
  const startEditing = (nodeId: string, field: 'title' | 'content') => {
    try {
      const node = nodes.find(n => n.id === nodeId)
      if (!node) return
      
      setInlineEditingNodeId(nodeId)
      setInlineEditingField(field)
      setInlineEditingValue(field === 'title' ? node.text : (node.content || ''))
    } catch (error) {
      console.error('Error starting inline edit:', error)
    }
  }

  const finishEditing = () => {
    if (!inlineEditingNodeId || !inlineEditingField) return

    const updatedNodes = nodes.map(node => {
      if (node.id === inlineEditingNodeId) {
        if (inlineEditingField === 'title') {
          return { ...node, text: inlineEditingValue.trim() || 'Untitled' }
        } else if (inlineEditingField === 'content') {
          return { ...node, content: inlineEditingValue }
        }
      }
      return node
    })

    setNodes(updatedNodes)
    onSave(updatedNodes, connections)
    
    setInlineEditingNodeId(null)
    setInlineEditingField(null)
    setInlineEditingValue('')
  }

  const cancelEditing = () => {
    setInlineEditingNodeId(null)
    setInlineEditingField(null)
    setInlineEditingValue('')
  }

  // Inline editing input component
  const InlineEditingInput = () => {
    if (!inlineEditingNodeId || !inlineEditingField) return null
    
    const node = nodes.find(n => n.id === inlineEditingNodeId)
    if (!node) return null

    try {
      const scale = stageRef.current?.scaleX() || 1
      const stagePosition = position || { x: 0, y: 0 }
      
      return (
        <div
          className="absolute z-50 bg-white border-2 border-blue-500 rounded shadow-lg dark:bg-gray-800 dark:border-blue-400"
          style={{
            left: (node.x * scale) + stagePosition.x + 10,
            top: (node.y * scale) + stagePosition.y + (inlineEditingField === 'title' ? 10 : 35),
            width: Math.max((node.width * scale) - 20, 200),
            minHeight: inlineEditingField === 'title' ? 'auto' : '60px'
          }}
        >
          {inlineEditingField === 'title' ? (
            <input
              type="text"
              value={inlineEditingValue}
              onChange={(e) => setInlineEditingValue(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finishEditing()
                if (e.key === 'Escape') cancelEditing()
              }}
              className="w-full p-2 text-sm font-bold bg-transparent border-none outline-none resize-none text-gray-900 dark:text-gray-100"
              style={{ fontSize: '14px' }}
              autoFocus
              placeholder="Enter title..."
            />
          ) : (
            <textarea
              value={inlineEditingValue}
              onChange={(e) => setInlineEditingValue(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancelEditing()
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') finishEditing()
              }}
              className="w-full p-2 text-sm bg-transparent border-none outline-none resize-none text-gray-900 dark:text-gray-100"
              style={{ fontSize: '11px', minHeight: '60px' }}
              autoFocus
              placeholder="Enter content..."
            />
          )}
          <div className="flex justify-end gap-1 p-1 text-xs text-gray-500 border-t dark:border-gray-600 dark:text-gray-400">
            <span>{inlineEditingField === 'title' ? 'Enter to save, Esc to cancel' : 'Ctrl+Enter to save, Esc to cancel'}</span>
          </div>
        </div>
      )
    } catch (error) {
      console.error('Error in inline editing:', error)
      return null
    }
  }


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

  // Character archetypes for quick character creation
  const characterTemplates = {
    protagonist: {
      text: 'Protagonist',
      role: 'Protagonist',
      traits: ['Determined', 'Brave', 'Growth-oriented'],
      motivation: 'To overcome their greatest challenge and become who they were meant to be',
      goals: ['Achieve their main objective', 'Overcome personal weakness', 'Protect what matters most'],
      fears: ['Failure', 'Losing loved ones', 'Being inadequate'],
      appearance: 'Describe your main character\'s distinctive features...',
      description: 'Your story\'s central character who drives the plot forward through their choices and actions.'
    },
    antagonist: {
      text: 'Antagonist', 
      role: 'Antagonist',
      traits: ['Powerful', 'Cunning', 'Self-righteous'],
      motivation: 'To achieve their goal which conflicts with the protagonist',
      goals: ['Stop the protagonist', 'Achieve their master plan', 'Maintain control'],
      fears: ['Losing power', 'Being proven wrong', 'Their past catching up'],
      appearance: 'What makes this character intimidating or memorable?',
      description: 'The primary opposition to your protagonist. Remember: they believe they\'re the hero of their own story.'
    },
    mentor: {
      text: 'Mentor',
      role: 'Supporting',
      traits: ['Wise', 'Patient', 'Experienced'],
      motivation: 'To guide and prepare the protagonist for their journey',
      goals: ['Teach important lessons', 'Protect the protagonist', 'Pass on knowledge'],
      fears: ['Student failing', 'Past mistakes repeating', 'Being too late'],
      appearance: 'Often older, with kind but knowing eyes...',
      description: 'A guide who helps the protagonist grow and provides crucial wisdom at key moments.'
    },
    'love-interest': {
      text: 'Love Interest',
      role: 'Supporting',
      traits: ['Attractive', 'Independent', 'Compelling'],
      motivation: 'To pursue their own goals while building a relationship with the protagonist',
      goals: ['Personal ambitions', 'Romantic connection', 'Character growth'],
      fears: ['Heartbreak', 'Losing independence', 'Not being worthy'],
      appearance: 'Physically and emotionally attractive to the protagonist...',
      description: 'A fully-developed character who enhances the story through romantic subplot.'
    },
    custom: {
      text: 'Character Name',
      role: 'Supporting',
      traits: [],
      motivation: 'What drives this character?',
      goals: [],
      fears: [],
      appearance: '',
      description: ''
    }
  }

  // Add a new node of specified type
  const handleAddNode = (nodeType: 'text' | 'character' | 'event' | 'location' | 'folder' | 'image' | 'list' = 'text', characterTemplate?: string) => {
    // Force light blue color instead of trying to read CSS variables during creation
    const mainColor = '#87CEEB'  // Light blue as default
    
    // Use light blue for all node types - unified color system
    const nodeColors = {
      text: mainColor,        // Light blue for all nodes
      character: mainColor,   // Light blue for all nodes
      event: mainColor,       // Light blue for all nodes
      location: mainColor,    // Light blue for all nodes
      folder: mainColor,      // Light blue for all nodes
      image: mainColor,       // Light blue for all nodes
      list: mainColor         // Light blue for all nodes
    }

    const nodeDefaults: Record<string, any> = {
      text: { 
        text: 'Story Note', 
        content: 'Click to add your story notes, plot points, or ideas here...',
        color: nodeColors.text, 
        width: 220, 
        height: 120 
      },
      character: (() => {
        // Use character template if provided, otherwise use custom template
        const template = characterTemplate && characterTemplates[characterTemplate as keyof typeof characterTemplates] 
          ? characterTemplates[characterTemplate as keyof typeof characterTemplates]
          : characterTemplates.custom
        
        return {
          text: template.text,
          color: nodeColors.character, 
          width: 220, 
          height: 140,
          linkedCanvasId: `character-${Date.now()}`,
          attributes: {
            role: template.role,
            traits: [...template.traits],
            goals: [...template.goals], 
            fears: [...template.fears],
            motivation: template.motivation,
            appearance: template.appearance,
            description: template.description,
            age: '',
            backstory: '',
            relationships: [],
            arc: '',
            characterTemplate: characterTemplate || 'custom'
          }
        }
      })(),
      event: { 
        text: 'Event Title', 
        content: 'Describe what happens in this event...',
        color: nodeColors.event, 
        width: 220, 
        height: 120 
      },
      location: { 
        text: 'Location Name', 
        content: 'Describe this location, its atmosphere, and importance to the story...',
        color: nodeColors.location, 
        width: 220, 
        height: 120,
        linkedCanvasId: `location-${Date.now()}` // Make locations expandable
      },
      folder: { 
        text: 'Section Title', 
        color: nodeColors.folder, 
        width: 240, 
        height: 120,
        linkedCanvasId: `canvas-${Date.now()}`
      },
      image: {
        text: 'Image/Mood Board',
        content: 'Add images, character portraits, location references, or visual inspiration here...',
        color: nodeColors.image,
        width: 240,
        height: 160
      },
      list: {
        text: 'List Container',
        content: 'Organize multiple items in a structured format. Drag nodes into this container.',
        color: nodeColors.list,
        width: 300,
        height: 250,
        childIds: [],
        attributes: {
          listItems: [],
          layoutColumns: 1,
          containerPadding: 15,
          sortOrder: 'manual'
        }
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
  }

  // Update node position and handle container drops
  const handleNodeDragEnd = (e: any, nodeId: string) => {
    const node = e.target
    const newX = node.x()
    const newY = node.y()
    
    // Check if dropped on a container
    let droppedInContainer = false
    if (dropTargetId && canNodeBeDroppedInContainer(nodeId, dropTargetId)) {
      addNodeToContainer(nodeId, dropTargetId)
      droppedInContainer = true
    }
    
    // Update position
    setNodes(nodes.map(n => 
      n.id === nodeId 
        ? { ...n, x: newX, y: newY } 
        : n
    ))
    
    // Clean up drag state
    setDraggingNodeId(null)
    setDropTargetId(null)
    setDragOffset({ x: 0, y: 0 })
    
    if (!droppedInContainer && dropTargetId) {

    }
  }

  const handleNodeDragStart = (e: any, nodeId: string) => {
    setDraggingNodeId(nodeId)
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    const node = e.target
    setDragOffset({
      x: pointer.x - node.x(),
      y: pointer.y - node.y()
    })
  }


  // Handle node click for connections
  const handleNodeClick = (nodeId: string) => {
    if (tool === 'connect') {
      if (!connectingFrom) {
        // Start connection
        setConnectingFrom(nodeId)

      } else if (connectingFrom === nodeId) {
        // Cancel if clicking same node
        setConnectingFrom(null)

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

      }
    } else {
      setSelectedId(nodeId)
    }
  }

  // Delete connection
  const handleDeleteConnection = (connId: string) => {
    setConnections(connections.filter(c => c.id !== connId))

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

    }
  }

  // Start editing node
  const handleEditNode = () => {
    if (selectedId) {
      const node = nodes.find(n => n.id === selectedId)
      if (node) {
        setEditingNodeId(selectedId)
        setEditText(node.text)
        setEditContent(node.content || '')
        setEditAttributes(node.attributes || {})
        setImagePreview(null) // Reset preview, use existing imageUrl if available
      }
    }
  }

  // Save edited text and content
  const handleSaveEdit = () => {
    if (editingNodeId) {
      const node = nodes.find(n => n.id === editingNodeId)
      setNodes(nodes.map(n => 
        n.id === editingNodeId 
          ? { 
              ...n, 
              text: editText,
              content: editContent,
              imageUrl: node?.type === 'character' ? (imagePreview || editAttributes.imageUrl) : n.imageUrl,
              attributes: node?.type === 'character' ? editAttributes : n.attributes 
            } 
          : n
      ))
      setEditingNodeId(null)
      setEditText('')
      setEditContent('')
      setEditAttributes({})
      setImagePreview(null)

    }
  }

  // Handle double click to edit or navigate
  const handleNodeDoubleClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      console.log('Double-click on node:', { type: node.type, linkedCanvasId: node.linkedCanvasId, hasNavigateCallback: !!onNavigateToCanvas })
      
      // Navigate to linked canvas for expandable nodes
      if ((node.type === 'folder' || node.type === 'character' || node.type === 'location') 
          && node.linkedCanvasId && onNavigateToCanvas) {
        console.log('Navigating to canvas:', node.linkedCanvasId, node.text)
        onNavigateToCanvas(node.linkedCanvasId, node.text)
      } else if (node.type === 'character') {
        // Open the detailed modal for character nodes
        setSelectedId(nodeId)
        setEditingNodeId(nodeId)
        setEditText(node.text)
        setEditContent(node.content || '')
        setEditAttributes(node.attributes || {})
        setImagePreview(null)
      } else {
        // Start inline editing for the title for other node types
        startEditing(nodeId, 'title')
      }
    }
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Basic validation
      if (file.size > 5 * 1024 * 1024) { // 5MB limit

        return
      }
      
      if (!file.type.startsWith('image/')) {

        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setImagePreview(imageUrl)
        // Update the editing attributes
        setEditAttributes({ ...editAttributes, imageUrl })
      }
      reader.readAsDataURL(file)
    }
  }



  return (
    <div className="relative w-full h-full flex">
      {/* Left Sidebar */}
      <div className="w-24 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-2 z-20 hover-scrollable">
        {/* Tool Selection */}
        <div className="flex flex-col gap-1 items-center">
          <Button
            variant={tool === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setTool('select')
              setConnectingFrom(null)
            }}
            title="Select tool"
            className="w-12 h-12"
          >
            <MousePointer className="w-5 h-5" />
          </Button>
          <Button
            variant={tool === 'pan' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setTool('pan')
              setConnectingFrom(null)
            }}
            title="Pan tool"
            className="w-12 h-12"
          >
            <Hand className="w-5 h-5" />
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
            className="w-12 h-12"
          >
            <Type className="w-5 h-5" />
          </Button>
          <Button
            variant={tool === 'character' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setTool('character')
              handleAddNode('character', 'custom')
              setConnectingFrom(null)
            }}
            title="Add character node"
            className="w-12 h-12"
          >
            <User className="w-5 h-5" />
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
            className="w-12 h-12"
          >
            <Calendar className="w-5 h-5" />
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
            className="w-12 h-12"
          >
            <MapPin className="w-5 h-5" />
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
            className="w-12 h-12"
          >
            <Folder className="w-5 h-5" />
          </Button>
          <Button
            variant={tool === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setTool('list')
              handleAddNode('list')
              setConnectingFrom(null)
            }}
            title="Add list/container node"
            className="w-12 h-12"
          >
            <List className="w-5 h-5" />
          </Button>
          <Button
            variant={tool === 'image' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setTool('image')
              handleAddNode('image')
              setConnectingFrom(null)
            }}
            title="Add image/mood board node"
            className="w-12 h-12"
          >
            <Image className="w-5 h-5" />
          </Button>
          <Button
            variant={tool === 'connect' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setTool('connect')
              setSelectedId(null)
            }}
            title="Connect nodes"
            className={`w-10 h-10 ${connectingFrom ? 'bg-sky-500 text-white' : ''}`}
          >
            <GitBranch className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Phase 2 Character Tools Separator */}
        <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
        
        {/* Phase 2 Enhanced Character Tools */}
        <div className="flex flex-col gap-1 items-center">
          <Button
            variant={tool === 'character-protagonist' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setTool('character-protagonist')
              handleAddNode('character', 'protagonist')
              setConnectingFrom(null)
            }}
            title="Add protagonist character"
            className="w-12 h-12 relative group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 dark:hover:from-blue-800/40 dark:hover:to-blue-700/40 border-blue-200 dark:border-blue-700"
          >
            <User className="w-4 h-4 text-blue-700 dark:text-blue-300" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">★</span>
            </span>
          </Button>
          <Button
            variant={tool === 'character-antagonist' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setTool('character-antagonist')
              handleAddNode('character', 'antagonist')
              setConnectingFrom(null)
            }}
            title="Add antagonist character"
            className="w-12 h-12 relative group bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 dark:from-red-900/30 dark:to-red-800/30 dark:hover:from-red-800/40 dark:hover:to-red-700/40 border-red-200 dark:border-red-700"
          >
            <User className="w-4 h-4 text-red-700 dark:text-red-300" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">⚡</span>
            </span>
          </Button>
          <Button
            variant={tool === 'character-mentor' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setTool('character-mentor')
              handleAddNode('character', 'mentor')
              setConnectingFrom(null)
            }}
            title="Add mentor character"
            className="w-12 h-12 relative group bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 dark:hover:from-indigo-800/40 dark:hover:to-indigo-700/40 border-indigo-200 dark:border-indigo-700"
          >
            <User className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✦</span>
            </span>
          </Button>
          <Button
            variant={tool === 'character-love-interest' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setTool('character-love-interest')
              handleAddNode('character', 'love-interest')
              setConnectingFrom(null)
            }}
            title="Add love interest character"
            className="w-12 h-12 relative group bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 dark:hover:from-pink-800/40 dark:hover:to-pink-700/40 border-pink-200 dark:border-pink-700"
          >
            <User className="w-4 h-4 text-pink-700 dark:text-pink-300" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-pink-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">♥</span>
            </span>
          </Button>
        </div>
        
        <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>

        {/* Zoom Controls */}
        <div className="flex flex-col gap-1 items-center">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} className="w-12 h-12">
            <Minus className="w-5 h-5" />
          </Button>
          <span className="text-xs px-1 py-1 min-w-[40px] text-center text-gray-600 dark:text-gray-400">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} className="w-12 h-12">
            <Plus className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomReset} className="w-12 h-12">
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Node Actions */}
        {selectedId && (
          <>
            <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex flex-col gap-1 items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditNode}
                title="Edit node (or double-click)"
                className="w-12 h-12"
              >
                <Edit2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteNode}
                title="Delete node (or press Delete)"
                className="w-12 h-12 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}

        {/* Auto-save indicator at bottom */}
        <div className="mt-auto">
          <div className="px-2 py-1.5 bg-green-100 dark:bg-green-900/20 rounded text-xs text-green-700 dark:text-green-400">
            ✓
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="absolute bottom-4 left-28 z-10">
        <Card className="p-3 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 max-w-xs">
          <p className="text-xs text-muted-foreground">
            <strong>Tips:</strong> Double-click nodes to edit • 
            {tool === 'connect' ? ' Click two nodes to connect them' : 
             selectedId ? ' Press Delete to remove • Double-click to edit attributes' : 
             ' Click sidebar buttons to add nodes'}
          </p>
        </Card>
      </div>

      {/* Canvas */}
      <div 
        id="canvas-container"
        className="flex-1 canvas-grid"
        style={{
          backgroundPosition: `${position.x * 0.1}px ${position.y * 0.1}px`,
          backgroundColor: 'var(--color-canvas-bg, #f9fafb)'
        }}
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
            {/* Large canvas background for infinite scrolling */}
            <Rect
              x={-10000}
              y={-10000}
              width={20000}
              height={20000}
              fill="transparent"
              listening={true}
              onClick={(e) => {
                if (e.target === e.currentTarget && tool !== 'pan') {
                  setSelectedId(null)
                  setConnectingFrom(null)
                }
              }}
            />
            
            {/* Grid background effect is handled by CSS */}
            
            {/* Render connections first (behind nodes) */}
            {connections.map((conn) => {
              try {
                const fromPos = getNodeCenter(conn.from)
                const toPos = getNodeCenter(conn.to)
                
                // Skip rendering if positions are invalid
                if (!fromPos || !toPos || isNaN(fromPos.x) || isNaN(fromPos.y) || isNaN(toPos.x) || isNaN(toPos.y)) {
                  return null
                }
                
                const isHovered = hoveredConnectionId === conn.id
              
              // Phase 2: Enhanced semantic connection colors with better visibility
              const getConnectionColor = () => {
                if (isHovered) return '#6366f1'    // Indigo 500 - Hover state with glow
                switch (conn.type) {
                  case 'leads-to': return '#2563eb'        // Blue 600 - Sequential relationship (darker for better visibility)
                  case 'relates-to': return '#059669'      // Emerald 600 - Related elements
                  case 'conflicts-with': return '#dc2626'  // Red 600 - Conflict relationship
                  // Character relationship types
                  case 'friend': return '#16a34a'          // Green 600 - Friendship
                  case 'enemy': return '#dc2626'           // Red 600 - Enemy
                  case 'family': return '#d97706'          // Amber 600 - Family
                  case 'romantic': return '#db2777'        // Pink 600 - Romance
                  case 'mentor': return '#7c3aed'          // Purple 600 - Mentor
                  case 'rival': return '#ea580c'           // Orange 600 - Rivalry
                  case 'ally': return '#0891b2'            // Cyan 600 - Alliance
                  default: return '#7c3aed'               // Purple 600 - Default connection
                }
              }

              // Calculate smooth curve points for better connections
              const calculateCurvePoints = (from: {x: number, y: number}, to: {x: number, y: number}) => {
                const midX = (from.x + to.x) / 2
                const midY = (from.y + to.y) / 2
                
                // Add a slight curve to avoid straight lines
                const offset = 30
                const curveX = midX + (from.y > to.y ? offset : -offset)
                const curveY = midY + (from.x < to.x ? offset : -offset)

                return [from.x, from.y, curveX, curveY, to.x, to.y]
              }

              // Use curved or straight lines based on feature flag
              const connectionPoints = useCurvedConnections ? 
                calculateCurvePoints(fromPos, toPos) : 
                [fromPos.x, fromPos.y, toPos.x, toPos.y]
              
              // Calculate simple arrow head
              const getArrowHead = (from: {x: number, y: number}, to: {x: number, y: number}) => {
                try {
                  const angle = Math.atan2(to.y - from.y, to.x - from.x)
                  const arrowSize = isHovered ? 12 : 8
                  
                  // Position arrow at 85% along the line
                  const arrowX = from.x + (to.x - from.x) * 0.85
                  const arrowY = from.y + (to.y - from.y) * 0.85
                  
                  const arrowPoints = [
                    arrowX, arrowY,
                    arrowX - arrowSize * Math.cos(angle - 0.5), arrowY - arrowSize * Math.sin(angle - 0.5),
                    arrowX - arrowSize * Math.cos(angle + 0.5), arrowY - arrowSize * Math.sin(angle + 0.5)
                  ]
                  
                  return { x: arrowX, y: arrowY, points: arrowPoints }
                } catch (error) {
                  // Fallback to simple arrow if calculation fails
                  return { x: to.x - 10, y: to.y, points: [to.x - 10, to.y, to.x - 15, to.y - 5, to.x - 15, to.y + 5] }
                }
              }
              
              const arrow = getArrowHead(fromPos, toPos)

              return (
                <Group key={conn.id}>
                  {/* Connection line */}
                  <Line
                    points={connectionPoints}
                    tension={useCurvedConnections ? 0.5 : 0} // Use tension for curves, 0 for straight lines
                    stroke={getConnectionColor()}
                    strokeWidth={isHovered ? 6 : 4}
                    opacity={isHovered ? 1 : 0.9}
                    shadowColor={isHovered ? getConnectionColor() : '#00000030'}
                    shadowBlur={isHovered ? 12 : 4}
                    shadowOpacity={isHovered ? 0.6 : 0.25}
                    shadowOffsetY={isHovered ? 3 : 1}
                    lineCap="round"
                    lineJoin="round"
                    hitStrokeWidth={20} // Larger hit area for easier interaction with curves
                    onClick={() => handleDeleteConnection(conn.id)}
                    onTap={() => handleDeleteConnection(conn.id)}
                    onMouseEnter={() => {
                      setHoveredConnectionId(conn.id)
                      document.body.style.cursor = 'pointer'
                    }}
                    onMouseLeave={() => {
                      setHoveredConnectionId(null)
                      document.body.style.cursor = 'default'
                    }}
                  />
                  
                  {/* Arrow head */}
                  <Line
                    points={arrow.points}
                    fill={getConnectionColor()}
                    stroke={getConnectionColor()}
                    strokeWidth={2}
                    closed={true}
                    opacity={isHovered ? 1 : 0.9}
                    onClick={() => handleDeleteConnection(conn.id)}
                    onTap={() => handleDeleteConnection(conn.id)}
                    onMouseEnter={() => {
                      setHoveredConnectionId(conn.id)
                      document.body.style.cursor = 'pointer'
                    }}
                    onMouseLeave={() => {
                      setHoveredConnectionId(null)
                      document.body.style.cursor = 'default'
                    }}
                  />
                </Group>
              )
              } catch (error) {
                console.error('Error rendering connection:', conn.id, error)
                return null
              }
            })}
            
            {/* Render nodes - filter out child nodes that are inside containers */}
            {nodes.filter(node => !node.parentId).map((node) => (
              <Group
                key={node.id}
                id={`node-${node.id}`}
                x={node.x}
                y={node.y}
                draggable={tool === 'select'} // Allow all nodes to be draggable when select tool is active
                onDragStart={(e) => handleNodeDragStart(e, node.id)}
                onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
                onClick={() => handleNodeClick(node.id)}
                onTap={() => handleNodeClick(node.id)}
                onDblClick={() => handleNodeDoubleClick(node.id)}
                onDblTap={() => handleNodeDoubleClick(node.id)}
                onMouseEnter={() => {
                  setHoveredNodeId(node.id)
                  // Show drop target indication for containers
                  if (draggingNodeId && draggingNodeId !== node.id && (node.type === 'list' || node.type === 'folder')) {
                    if (canNodeBeDroppedInContainer(draggingNodeId, node.id)) {
                      setDropTargetId(node.id)
                      document.body.style.cursor = 'grab'
                    } else {
                      document.body.style.cursor = 'not-allowed'
                    }
                  } else {
                    document.body.style.cursor = 'pointer'
                  }
                }}
                onMouseLeave={() => {
                  setHoveredNodeId(null)
                  if (dropTargetId === node.id) {
                    setDropTargetId(null)
                  }
                  document.body.style.cursor = 'default'
                }}
              >
                {/* Node background */}
                <Rect
                  width={node.width}
                  height={node.height}
                  fill={`hsl(${getComputedStyle(document.documentElement).getPropertyValue('--color-primary-hue') || '200'}, 60%, 75%)`}
                  stroke={
                    connectingFrom === node.id 
                      ? '#10b981'   // Emerald 500 - Connection mode
                      : dropTargetId === node.id
                        ? '#f59e0b'   // Amber 500 - Valid drop target
                        : selectedId === node.id 
                          ? '#9333ea' // Purple 600 - Selected state
                          : hoveredNodeId === node.id
                            ? '#6366f1' // Indigo 500 - Hover state with glow
                            : getNodeBorderColor(node.type) // Semantic border colors
                  }
                  strokeWidth={
                    connectingFrom === node.id 
                      ? 3 
                      : selectedId === node.id 
                        ? 3 
                        : hoveredNodeId === node.id 
                          ? 3 // Thicker border on hover for edge highlighting effect
                          : 2 // Slightly thicker default border for better visibility
                  }
                  shadowColor={hoveredNodeId === node.id ? '#6366f1' : getNodeShadowColor(node.type)}
                  shadowBlur={hoveredNodeId === node.id ? 15 : 6}
                  shadowOpacity={hoveredNodeId === node.id ? 0.6 : 0.2}
                  shadowOffsetY={hoveredNodeId === node.id ? 4 : 2}
                  cornerRadius={8}
                />
                
                {/* Phase 2: Enhanced Node Type Indicators */}
                {node.type === 'character' && (
                  <>
                    {/* Character image thumbnail */}
                    {node.imageUrl && (
                      <Group>
                        <Rect
                          x={10}
                          y={30}
                          width={40}
                          height={40}
                          fill="white"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          cornerRadius={6}
                        />
                        <Text
                          x={30}
                          y={52}
                          text="📷"
                          fontSize={20}
                          align="center"
                          fill="#f59e0b"
                        />
                      </Group>
                    )}
                    
                    {/* Character type indicator with template-specific styling */}
                    <Circle
                      x={node.width - 20}
                      y={20}
                      radius={12}
                      fill={(() => {
                        switch (node.attributes?.characterTemplate) {
                          case 'protagonist': return '#3b82f6'  // Blue
                          case 'antagonist': return '#ef4444'   // Red
                          case 'mentor': return '#8b5cf6'       // Purple
                          case 'love-interest': return '#ec4899' // Pink
                          default: return '#f59e0b'            // Amber for custom
                        }
                      })()
                    }
                    />
                    {/* Template-specific character icon */}
                    <Text
                      x={node.width - 20}
                      y={28}
                      text={(() => {
                        switch (node.attributes?.characterTemplate) {
                          case 'protagonist': return '★'
                          case 'antagonist': return '⚡'
                          case 'mentor': return '✦'
                          case 'love-interest': return '♥'
                          default: return '👤'
                        }
                      })()
                      }
                      fontSize={12}
                      align="center"
                      fill="white"
                      fontStyle="bold"
                    />
                    {/* Expandable indicator */}
                    <Text
                      x={node.width - 35}
                      y={node.height - 15}
                      text="📂"
                      fontSize={12}
                      fill="#f59e0b"
                    />
                  </>
                )}
                {node.type === 'event' && (
                  <>
                    <Circle
                      x={node.width - 20}
                      y={20}
                      radius={12}
                      fill="#ec4899"
                    />
                    <Text
                      x={node.width - 20}
                      y={28}
                      text="📅"
                      fontSize={12}
                      align="center"
                      fill="white"
                    />
                  </>
                )}
                {node.type === 'location' && (
                  <>
                    <Circle
                      x={node.width - 20}
                      y={20}
                      radius={12}
                      fill="#10b981"
                    />
                    <Text
                      x={node.width - 20}
                      y={28}
                      text="📍"
                      fontSize={12}
                      align="center"
                      fill="white"
                    />
                    {/* Expandable indicator for location */}
                    <Text
                      x={node.width - 35}
                      y={node.height - 15}
                      text="📂"
                      fontSize={12}
                      fill="#10b981"
                    />
                  </>
                )}
                {node.type === 'image' && (
                  <>
                    <Circle
                      x={node.width - 20}
                      y={20}
                      radius={12}
                      fill="#0ea5e9"
                    />
                    <Text
                      x={node.width - 20}
                      y={28}
                      text="🖼️"
                      fontSize={10}
                      align="center"
                      fill="white"
                    />
                  </>
                )}
                
                {/* Phase 2: Text node type indicator */}
                {(!node.type || node.type === 'text') && (
                  <>
                    <Circle
                      x={node.width - 20}
                      y={20}
                      radius={12}
                      fill="#6b7280"
                    />
                    <Text
                      x={node.width - 20}
                      y={28}
                      text="📝"
                      fontSize={12}
                      align="center"
                      fill="white"
                    />
                  </>
                )}
                
                {/* Node title */}
                <Text
                  x={10}
                  y={10}
                  width={node.width - 40}
                  height={30}
                  text={node.text}
                  fontSize={14}
                  fontStyle="bold"
                  fill={getTextColor(node.color)}
                  align="left"
                  verticalAlign="top"
                  wrap="word"
                  onClick={() => {
                    if (tool === 'select') startEditing(node.id, 'title')
                  }}
                  onTap={() => {
                    if (tool === 'select') startEditing(node.id, 'title')
                  }}
                />
                
                {/* Node content (for text, event, location, image nodes) */}
                {(node.type === 'text' || node.type === 'event' || node.type === 'location' || node.type === 'image') && node.content && (
                  <Text
                    x={10}
                    y={35}
                    width={node.width - 20}
                    height={node.height - 65}
                    text={node.content}
                    fontSize={11}
                    fill={getTextColor(node.color)}
                    align="left"
                    verticalAlign="top"
                    wrap="word"
                    ellipsis={true}
                    onClick={() => {
                      if (tool === 'select') startEditing(node.id, 'content')
                    }}
                    onTap={() => {
                      if (tool === 'select') startEditing(node.id, 'content')
                    }}
                  />
                )}
                
                {/* Placeholder for empty content */}
                {(node.type === 'text' || node.type === 'event' || node.type === 'location' || node.type === 'image') && !node.content && (
                  <Text
                    x={10}
                    y={35}
                    width={node.width - 20}
                    height={node.height - 65}
                    text="Click to add content..."
                    fontSize={11}
                    fill="#9ca3af"
                    align="left"
                    verticalAlign="top"
                    wrap="word"
                    fontStyle="italic"
                    onClick={() => {
                      if (tool === 'select') startEditing(node.id, 'content')
                    }}
                    onTap={() => {
                      if (tool === 'select') startEditing(node.id, 'content')
                    }}
                  />
                )}
                {node.type === 'image' && (
                  <>
                    {node.imageUrl ? (
                      <>
                        {/* Image display area */}
                        <Rect
                          x={10}
                          y={35}
                          width={node.width - 20}
                          height={node.height - 50}
                          fill="white"
                          stroke="#e2e8f0"
                          strokeWidth={1}
                          cornerRadius={6}
                        />
                        {/* Image placeholder - in real implementation would show actual image */}
                        <Text
                          x={node.width / 2}
                          y={node.height / 2}
                          text="🖼️"
                          fontSize={32}
                          align="center"
                          fill="#64748b"
                        />
                        <Text
                          x={node.width / 2}
                          y={node.height / 2 + 20}
                          text="Image Loaded"
                          fontSize={10}
                          align="center"
                          fill="#64748b"
                        />
                      </>
                    ) : (
                      <>
                        {/* Upload area */}
                        <Rect
                          x={10}
                          y={35}
                          width={node.width - 20}
                          height={node.height - 50}
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                          strokeWidth={2}
                          strokeDash={[5, 5]}
                          cornerRadius={6}
                        />
                        <Text
                          x={node.width / 2}
                          y={node.height / 2 - 10}
                          text="📁"
                          fontSize={24}
                          align="center"
                          fill="#94a3b8"
                        />
                        <Text
                          x={node.width / 2}
                          y={node.height / 2 + 15}
                          text="Double-click to upload"
                          fontSize={10}
                          align="center"
                          fill="#64748b"
                        />
                      </>
                    )}
                    
                    {/* Image node indicator */}
                    <Circle
                      x={node.width - 25}
                      y={15}
                      radius={10}
                      fill="#10b981"
                    />
                    <Text
                      x={node.width - 25}
                      y={20}
                      text="📷"
                      fontSize={8}
                      align="center"
                      fill="white"
                    />
                  </>
                )}
                
                {/* List Container Node Rendering */}
                {node.type === 'list' && (
                  <>
                    {/* List node type indicator */}
                    <Circle
                      x={node.width - 20}
                      y={20}
                      radius={12}
                      fill="#f97316"
                    />
                    <Text
                      x={node.width - 20}
                      y={28}
                      text="📋"
                      fontSize={12}
                      align="center"
                      fill="white"
                    />
                    
                    {/* Container drop zone visual */}
                    {dropTargetId === node.id && (
                      <Rect
                        x={5}
                        y={30}
                        width={node.width - 10}
                        height={node.height - 40}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        strokeDash={[10, 5]}
                        cornerRadius={8}
                        opacity={0.8}
                      />
                    )}
                    
                    {/* Container border */}
                    <Rect
                      x={10}
                      y={35}
                      width={node.width - 20}
                      height={node.height - 50}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth={1}
                      strokeDash={[5, 3]}
                      cornerRadius={6}
                    />
                    
                    {/* List items display */}
                    {node.attributes?.listItems && node.attributes.listItems.length > 0 && (
                      <>
                        {node.attributes.listItems.slice(0, 4).map((item: string, index: number) => {
                          const padding = node.attributes?.containerPadding || 15
                          const columns = node.attributes?.layoutColumns || 1
                          const itemWidth = (node.width - 20 - (padding * (columns + 1))) / columns
                          const itemHeight = 30
                          
                          const col = index % columns
                          const row = Math.floor(index / columns)
                          
                          const x = 15 + col * (itemWidth + padding)
                          const y = 45 + row * (itemHeight + 8)
                          
                          return (
                            <Group key={index}>
                              {/* Item background */}
                              <Rect
                                x={x}
                                y={y}
                                width={itemWidth}
                                height={itemHeight}
                                fill="#ffffff"
                                stroke="#d1d5db"
                                strokeWidth={1}
                                cornerRadius={4}
                                shadowColor="#00000020"
                                shadowBlur={2}
                                shadowOffsetY={1}
                              />
                              {/* Item text */}
                              <Text
                                x={x + 8}
                                y={y + 10}
                                width={itemWidth - 16}
                                height={itemHeight - 8}
                                text={`• ${item}`}
                                fontSize={10}
                                fill="#374151"
                                align="left"
                                verticalAlign="middle"
                                wrap="word"
                                ellipsis={true}
                              />
                            </Group>
                          )
                        })}
                        
                        {/* Show more indicator if there are more items */}
                        {node.attributes.listItems.length > 4 && (
                          <Text
                            x={15}
                            y={node.height - 25}
                            text={`... and ${node.attributes.listItems.length - 4} more items`}
                            fontSize={9}
                            fill="#6b7280"
                            fontStyle="italic"
                          />
                        )}
                      </>
                    )}
                    
                    {/* Child nodes display (for nodes dragged into container) */}
                    {node.childIds && node.childIds.length > 0 && (
                      <>
                        {/* Header showing container count */}
                        <Text
                          x={15}
                          y={45}
                          text={`📦 ${node.childIds.length} item${node.childIds.length === 1 ? '' : 's'} inside`}
                          fontSize={10}
                          fill="#059669"
                          fontStyle="bold"
                        />
                        
                        {/* Render child nodes as mini-nodes inside the container */}
                        {node.childIds.slice(0, 6).map((childId: string, index: number) => {
                          const childNode = nodes.find(n => n.id === childId)
                          if (!childNode) return null
                          
                          const padding = 15
                          const columns = node.attributes?.layoutColumns || 2
                          const itemWidth = Math.max(80, (node.width - 20 - (padding * (columns + 1))) / columns)
                          const itemHeight = 60
                          
                          const col = index % columns
                          const row = Math.floor(index / columns)
                          const x = padding + col * (itemWidth + padding / columns)
                          const y = 65 + row * (itemHeight + 8)
                          
                          return (
                            <Group 
                              key={`child-${childId}`}
                              onClick={() => {
                                // Single click: select the child node for editing
                                setSelectedId(childId)

                              }}
                              onDblClick={() => {
                                // Double click: remove from container
                                removeNodeFromContainer(childId)
                              }}
                            >
                              {/* Mini-node background */}
                              <Rect
                                x={x}
                                y={y}
                                width={itemWidth}
                                height={itemHeight}
                                fill="#ffffff"
                                stroke={selectedId === childId ? '#9333ea' : getNodeBorderColor(childNode.type)}
                                strokeWidth={selectedId === childId ? 2 : 1}
                                cornerRadius={4}
                                shadowColor="#00000020"
                                shadowBlur={2}
                                shadowOffsetY={1}
                              />
                              {/* Child node title */}
                              <Text
                                x={x + 8}
                                y={y + 8}
                                width={itemWidth - 16}
                                height={20}
                                text={childNode.text}
                                fontSize={10}
                                fontStyle="bold"
                                fill={getTextColor('#ffffff')}
                                align="left"
                                wrap="word"
                                ellipsis={true}
                              />
                              {/* Child node type icon */}
                              <Text
                                x={x + itemWidth - 15}
                                y={y + 8}
                                text={(() => {
                                  switch (childNode.type) {
                                    case 'character': return '👤'
                                    case 'event': return '📅'  
                                    case 'location': return '📍'
                                    case 'image': return '🖼️'
                                    default: return '📝'
                                  }
                                })()}
                                fontSize={10}
                                fill="#666"
                              />
                              {/* Child node content preview */}
                              {childNode.content && (
                                <Text
                                  x={x + 8}
                                  y={y + 30}
                                  width={itemWidth - 16}
                                  height={25}
                                  text={childNode.content}
                                  fontSize={8}
                                  fill="#666"
                                  align="left"
                                  wrap="word"
                                  ellipsis={true}
                                />
                              )}
                            </Group>
                          )
                        })}
                        
                        {/* Show "and X more" if there are more than 6 items */}
                        {node.childIds.length > 6 && (
                          <Text
                            x={15}
                            y={node.height - 25}
                            text={`... and ${node.childIds.length - 6} more items`}
                            fontSize={9}
                            fill="#6b7280"
                            fontStyle="italic"
                          />
                        )}
                      </>
                    )}
                    
                    {/* Empty container message */}
                    {(!node.attributes?.listItems || node.attributes.listItems.length === 0) && 
                     (!node.childIds || node.childIds.length === 0) && (
                      <>
                        <Text
                          x={node.width / 2}
                          y={node.height / 2 - 10}
                          text="📋"
                          fontSize={24}
                          align="center"
                          fill="#d1d5db"
                        />
                        <Text
                          x={node.width / 2}
                          y={node.height / 2 + 15}
                          text="Drag items here or"
                          fontSize={11}
                          align="center"
                          fill="#6b7280"
                        />
                        <Text
                          x={node.width / 2}
                          y={node.height / 2 + 30}
                          text="double-click to edit list"
                          fontSize={11}
                          align="center"
                          fill="#6b7280"
                          fontStyle="italic"
                        />
                      </>
                    )}
                    
                    {/* Column layout indicator */}
                    {(node.attributes?.layoutColumns || 1) > 1 && (
                      <Text
                        x={node.width - 45}
                        y={node.height - 15}
                        text={`${node.attributes?.layoutColumns || 1} cols`}
                        fontSize={8}
                        fill="#f97316"
                        fontStyle="bold"
                      />
                    )}
                  </>
                )}
                
                {/* Helper text for expandable nodes */}
                {((node.type === 'character' && (!node.attributes?.motivation && (!node.attributes?.traits || node.attributes.traits.length === 0))) ||
                  (node.type === 'location' && node.text === 'Location Name')) && (
                  <Text
                    x={10}
                    y={node.height - 25}
                    text="Double-click to open"
                    fontSize={11}
                    fill={getNodeBorderColor(node.type)}
                    fontStyle="italic"
                  />
                )}
                
                {/* Helper text for non-expandable nodes */}
                {((node.type === 'event' && node.text === 'Event Title') ||
                  (node.type === 'text' && node.text === 'Story Note') ||
                  (node.type === 'image' && node.text === 'Image/Mood Board') ||
                  (node.type === 'list' && node.text === 'List Container' && 
                   (!node.attributes?.listItems || node.attributes.listItems.length === 0) &&
                   (!node.childIds || node.childIds.length === 0))) && (
                  <Text
                    x={10}
                    y={node.height - 25}
                    text="Double-click to edit"
                    fontSize={11}
                    fill={getNodeBorderColor(node.type)}
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
                        fill={(() => {
                          switch (node.attributes?.characterTemplate) {
                            case 'protagonist': return '#3b82f6'
                            case 'antagonist': return '#ef4444'
                            case 'mentor': return '#8b5cf6'
                            case 'love-interest': return '#ec4899'
                            default: return '#6b7280'
                          }
                        })()
                        }
                        fontStyle="bold"
                      />
                    )}
                    {node.attributes.traits && node.attributes.traits.length > 0 && (
                      <Text
                        x={10}
                        y={60}
                        width={node.width - 20}
                        text={node.attributes.traits.slice(0, 3).join(', ')}
                        fontSize={11}
                        fill="#7c3aed"
                        wrap="word"
                        fontStyle="italic"
                      />
                    )}
                    {node.attributes.motivation && (
                      <Text
                        x={10}
                        y={80}
                        width={node.width - 20}
                        height={30}
                        text={`"${node.attributes.motivation}"`}
                        fontSize={10}
                        fill="var(--node-text-muted)"
                        wrap="word"
                        ellipsis={true}
                      />
                    )}
                    {(node.attributes.goals && node.attributes.goals.length > 0) && (
                      <Text
                        x={10}
                        y={110}
                        width={node.width - 20}
                        height={20}
                        text={`Goals: ${node.attributes.goals.slice(0, 2).join(', ')}`}
                        fontSize={9}
                        fill="#059669"
                        wrap="word"
                        ellipsis={true}
                      />
                    )}
                  </>
                )}
                
                {/* Event type indicator - only show if no content */}
                {node.type === 'event' && !node.content && (
                  <Text
                    x={10}
                    y={node.height - 45}
                    width={node.width - 20}
                    text="📅 Plot Event"
                    fontSize={11}
                    fill="#ec4899"
                    fontStyle="bold"
                  />
                )}
                
                {/* Location type indicator - only show if no content */}
                {node.type === 'location' && !node.content && (
                  <Text
                    x={10}
                    y={node.height - 45}
                    width={node.width - 20}
                    text="📍 Story Location"
                    fontSize={11}
                    fill="#10b981"
                    fontStyle="bold"
                  />
                )}
                
                {/* Text node indicator - only show if no content */}
                {(!node.type || node.type === 'text') && !node.content && (
                  <Text
                    x={10}
                    y={node.height - 45}
                    width={node.width - 20}
                    text="Story Note"
                    fontSize={11}
                    fill="#6b7280"
                    fontStyle="bold"
                  />
                )}
                
                {/* Image node indicator - only show if no content */}
                {node.type === 'image' && !node.content && (
                  <Text
                    x={10}
                    y={node.height - 45}
                    width={node.width - 20}
                    text="🖼️ Visual References"
                    fontSize={11}
                    fill="#0ea5e9"
                    fontStyle="bold"
                  />
                )}
                
                {/* Folder node indicator */}
                {node.type === 'folder' && (
                  <>
                    <Circle
                      x={node.width - 20}
                      y={20}
                      radius={12}
                      fill="#6366f1"
                    />
                    <Text
                      x={node.width - 20}
                      y={28}
                      text="📁"
                      fontSize={12}
                      align="center"
                      fill="white"
                    />
                    <Text
                      x={10}
                      y={node.height - 25}
                      text={node.text === 'Section Title' ? "Double-click to enter" : "Double-click to open"}
                      fontSize={10}
                      fill="#6366f1"
                      fontStyle="italic"
                    />
                  </>
                )}
              </Group>
            ))}
          </Layer>
        </Stage>

        {/* Inline text editing input */}
        {inlineEditingNodeId && inlineEditingField && (
          <InlineEditingInput />
        )}
      </div>

      {/* Edit Dialog - Only open for character nodes or when not using inline editing */}
      <Dialog open={!!editingNodeId && !inlineEditingField && (() => {
        const node = nodes.find(n => n.id === editingNodeId)
        return node?.type === 'character'
      })()} onOpenChange={(open) => {
        if (!open) {
          setEditingNodeId(null)
          setEditText('')
          setEditContent('')
          setEditAttributes({})
          setNewTrait('')
          setNewGoal('')
          setNewFear('')
          setNewRelationship({ characterName: '', relationshipType: '', description: '' })
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {(() => {
                try {
                  const nodeType = nodes.find(n => n.id === editingNodeId)?.type
                  return nodeType === 'character' ? 'Character' : 
                         nodeType === 'event' ? 'Event' :
                         nodeType === 'location' ? 'Location' :
                         nodeType === 'image' ? 'Image/Mood Board' :
                         nodeType === 'list' ? 'List Container' : 'Story'
                } catch (error) {
                  return 'Node'
                }
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
                         nodeType === 'location' ? 'Location Name' :
                         nodeType === 'image' ? 'Title' :
                         nodeType === 'list' ? 'List Title' : 'Content'
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
                         nodeType === 'location' ? 'Name or describe this location...' :
                         nodeType === 'image' ? 'What images or mood board is this?' :
                         nodeType === 'list' ? 'Enter list name...' : 'Enter your story text...'
                })()}
                className="min-h-[80px] mt-2"
                autoFocus
              />
            </div>

            {/* Content field for text, event, location, image, and list nodes */}
            {(() => {
              const nodeType = nodes.find(n => n.id === editingNodeId)?.type
              return nodeType === 'text' || nodeType === 'event' || nodeType === 'location' || nodeType === 'image' || nodeType === 'list'
            })() && (
              <div>
                <Label htmlFor="node-content">Content</Label>
                <Textarea
                  id="node-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder={(() => {
                    const nodeType = nodes.find(n => n.id === editingNodeId)?.type
                    return nodeType === 'text' ? 'Add your story notes, plot points, or ideas here...' : 
                           nodeType === 'event' ? 'Describe what happens in this event...' :
                           nodeType === 'location' ? 'Describe this location, its atmosphere, and importance...' :
                           nodeType === 'image' ? 'Describe the images you want to collect here, or add links to inspiration...' :
                           nodeType === 'list' ? 'Describe what this list is for...' : 'Add content...'
                  })()}
                  className="min-h-[120px] max-h-[200px] mt-2"
                />
              </div>
            )}
            
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
                
                {/* Character Image */}
                <div>
                  <Label>Character Image</Label>
                  <div className="mt-2">
                    {(imagePreview || editAttributes.imageUrl) && (
                      <div className="relative inline-block mb-3">
                        <img 
                          src={imagePreview || editAttributes.imageUrl} 
                          alt="Character portrait" 
                          className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                          onClick={() => {
                            setImagePreview(null)
                            setEditAttributes({ ...editAttributes, imageUrl: '' })
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('character-image-upload')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {(imagePreview || editAttributes.imageUrl) ? 'Change Image' : 'Upload Image'}
                      </Button>
                      <input
                        id="character-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a character portrait or reference image (max 5MB)
                    </p>
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
                    className="min-h-[60px] max-h-[120px] mt-2"
                  />
                </div>
                
                {/* Appearance */}
                <div>
                  <Label htmlFor="appearance">Physical Appearance</Label>
                  <Textarea
                    id="appearance"
                    value={editAttributes.appearance || ''}
                    onChange={(e) => setEditAttributes({...editAttributes, appearance: e.target.value})}
                    placeholder="How does this character look? Height, build, distinctive features..."
                    className="min-h-[60px] max-h-[120px] mt-2"
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
                
                {/* Goals */}
                <div>
                  <Label>Goals & Objectives</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Add a goal..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newGoal.trim()) {
                          e.preventDefault()
                          const goals = editAttributes.goals || []
                          setEditAttributes({...editAttributes, goals: [...goals, newGoal.trim()]})
                          setNewGoal('')
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newGoal.trim()) {
                          const goals = editAttributes.goals || []
                          setEditAttributes({...editAttributes, goals: [...goals, newGoal.trim()]})
                          setNewGoal('')
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(editAttributes.goals || []).map((goal: string, index: number) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => {
                          const goals = [...(editAttributes.goals || [])]
                          goals.splice(index, 1)
                          setEditAttributes({...editAttributes, goals})
                        }}
                      >
                        {goal} ×
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Fears */}
                <div>
                  <Label>Fears & Obstacles</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newFear}
                      onChange={(e) => setNewFear(e.target.value)}
                      placeholder="Add a fear or obstacle..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newFear.trim()) {
                          e.preventDefault()
                          const fears = editAttributes.fears || []
                          setEditAttributes({...editAttributes, fears: [...fears, newFear.trim()]})
                          setNewFear('')
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newFear.trim()) {
                          const fears = editAttributes.fears || []
                          setEditAttributes({...editAttributes, fears: [...fears, newFear.trim()]})
                          setNewFear('')
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(editAttributes.fears || []).map((fear: string, index: number) => (
                      <Badge 
                        key={index} 
                        variant="destructive"
                        className="cursor-pointer opacity-80"
                        onClick={() => {
                          const fears = [...(editAttributes.fears || [])]
                          fears.splice(index, 1)
                          setEditAttributes({...editAttributes, fears})
                        }}
                      >
                        {fear} ×
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Character Relationships */}
                <div>
                  <Label>Character Relationships</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newRelationship.characterName}
                      onChange={(e) => setNewRelationship({...newRelationship, characterName: e.target.value})}
                      placeholder="Character name..."
                      className="flex-1"
                    />
                    <Select
                      value={newRelationship.relationshipType}
                      onValueChange={(value) => setNewRelationship({...newRelationship, relationshipType: value})}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="enemy">Enemy</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="romantic">Romantic</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="rival">Rival</SelectItem>
                        <SelectItem value="ally">Ally</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={newRelationship.description}
                      onChange={(e) => setNewRelationship({...newRelationship, description: e.target.value})}
                      placeholder="Description..."
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newRelationship.characterName.trim() && newRelationship.relationshipType) {
                          const relationships = editAttributes.relationships || []
                          setEditAttributes({
                            ...editAttributes, 
                            relationships: [...relationships, {...newRelationship}]
                          })
                          setNewRelationship({ characterName: '', relationshipType: '', description: '' })
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(editAttributes.relationships || []).map((relationship: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <span className="font-medium">{relationship.characterName}</span>
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                            {relationship.relationshipType}
                          </span>
                          {relationship.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {relationship.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const relationships = [...(editAttributes.relationships || [])]
                            relationships.splice(index, 1)
                            setEditAttributes({...editAttributes, relationships})
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <Label htmlFor="description">Additional Notes</Label>
                  <Textarea
                    id="description"
                    value={editAttributes.description || ''}
                    onChange={(e) => setEditAttributes({...editAttributes, description: e.target.value})}
                    placeholder="Backstory, quirks, additional character details..."
                    className="min-h-[80px] max-h-[150px] mt-2"
                  />
                </div>
              </>
            )}
            
            {/* List-specific attributes */}
            {nodes.find(n => n.id === editingNodeId)?.type === 'list' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* Layout Columns */}
                  <div>
                    <Label htmlFor="layout-columns">Layout Columns</Label>
                    <Select
                      value={(editAttributes.layoutColumns || 1).toString()}
                      onValueChange={(value) => setEditAttributes({...editAttributes, layoutColumns: parseInt(value)})}
                    >
                      <SelectTrigger id="layout-columns" className="mt-2">
                        <SelectValue placeholder="Select columns..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Column</SelectItem>
                        <SelectItem value="2">2 Columns</SelectItem>
                        <SelectItem value="3">3 Columns</SelectItem>
                        <SelectItem value="4">4 Columns</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Container Padding */}
                  <div>
                    <Label htmlFor="container-padding">Container Padding</Label>
                    <Input
                      id="container-padding"
                      type="number"
                      value={editAttributes.containerPadding || 15}
                      onChange={(e) => setEditAttributes({...editAttributes, containerPadding: parseInt(e.target.value) || 15})}
                      min={5}
                      max={30}
                      className="mt-2"
                    />
                  </div>
                </div>
                
                {/* Sort Order */}
                <div>
                  <Label htmlFor="sort-order">Sort Order</Label>
                  <Select
                    value={editAttributes.sortOrder || 'manual'}
                    onValueChange={(value) => setEditAttributes({...editAttributes, sortOrder: value})}
                  >
                    <SelectTrigger id="sort-order" className="mt-2">
                      <SelectValue placeholder="Select sort order..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Order</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      <SelectItem value="chronological">Chronological</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* List Items Management */}
                <div>
                  <Label>List Items</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newListItem}
                      onChange={(e) => setNewListItem(e.target.value)}
                      placeholder="Add a list item..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newListItem.trim()) {
                          e.preventDefault()
                          const items = editAttributes.listItems || []
                          setEditAttributes({...editAttributes, listItems: [...items, newListItem.trim()]})
                          setNewListItem('')
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newListItem.trim()) {
                          const items = editAttributes.listItems || []
                          setEditAttributes({...editAttributes, listItems: [...items, newListItem.trim()]})
                          setNewListItem('')
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Display current list items */}
                  <div className="mt-3 space-y-2">
                    {(editAttributes.listItems || []).map((item: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <span className="text-sm">• {item}</span>
                        </div>
                        <div className="flex gap-2">
                          {/* Move up button */}
                          {index > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const items = [...(editAttributes.listItems || [])]
                                const temp = items[index]
                                items[index] = items[index - 1]
                                items[index - 1] = temp
                                setEditAttributes({...editAttributes, listItems: items})
                              }}
                              title="Move up"
                            >
                              ↑
                            </Button>
                          )}
                          {/* Move down button */}
                          {index < (editAttributes.listItems?.length || 0) - 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const items = [...(editAttributes.listItems || [])]
                                const temp = items[index]
                                items[index] = items[index + 1]
                                items[index + 1] = temp
                                setEditAttributes({...editAttributes, listItems: items})
                              }}
                              title="Move down"
                            >
                              ↓
                            </Button>
                          )}
                          {/* Remove button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const items = [...(editAttributes.listItems || [])]
                              items.splice(index, 1)
                              setEditAttributes({...editAttributes, listItems: items})
                            }}
                            title="Remove item"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {(!editAttributes.listItems || editAttributes.listItems.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No items added yet. Add items above or drag nodes into this container.
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Max Child Nodes (Optional) */}
                <div>
                  <Label htmlFor="max-children">Maximum Items (Optional)</Label>
                  <Input
                    id="max-children"
                    type="number"
                    value={editAttributes.maxChildNodes || ''}
                    onChange={(e) => setEditAttributes({...editAttributes, maxChildNodes: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="No limit"
                    min={1}
                    max={50}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Limit how many items can be added to this container
                  </p>
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
                setEditContent('')
                setEditAttributes({})
                setNewTrait('')
                setNewGoal('')
                setNewFear('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
