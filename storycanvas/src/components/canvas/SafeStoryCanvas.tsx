'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, AlertTriangle, RefreshCw } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/error-boundary'

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

interface SafeNeighborNotesProps {
  storyId: string
  initialNodes?: Node[]
  initialConnections?: Connection[]
  onSave?: (nodes: Node[], connections: Connection[]) => void
  onNavigateToCanvas?: (canvasId: string, nodeTitle: string) => void
}

// Simple fallback canvas when Konva fails
function FallbackCanvas({ 
  initialNodes = [], 
  initialConnections = [],
  onSave,
  onNavigateToCanvas 
}: SafeNeighborNotesProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes)

  const handleAddTextNode = () => {
    const newNode: Node = {
      id: `text-${Date.now()}`,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      text: 'New Text Node',
      content: 'Double-click to edit this content...',
      width: 200,
      height: 120,
      type: 'text',
      color: '#f8fafc'
    }
    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    onSave?.(newNodes, initialConnections)
  }

  const handleNodeClick = (node: Node) => {
    if (node.type === 'folder' && node.linkedCanvasId && onNavigateToCanvas) {
      onNavigateToCanvas(node.linkedCanvasId, node.text)
    }
  }

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 relative">
      {/* Fallback header */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <AlertTriangle className="w-4 h-4" />
            Canvas is running in safe mode
          </div>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={handleAddTextNode}>
              Add Text Node
            </Button>
          </div>
        </Card>
      </div>

      {/* Simple node rendering */}
      <div className="absolute inset-0 overflow-hidden">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute bg-white dark:bg-gray-800 border rounded-lg p-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
            style={{
              left: node.x,
              top: node.y,
              width: node.width,
              height: node.height,
              backgroundColor: node.color || '#ffffff'
            }}
            onClick={() => handleNodeClick(node)}
          >
            <div className="font-medium text-sm mb-1">{node.text}</div>
            {node.content && (
              <div className="text-xs text-gray-600 dark:text-gray-400 overflow-hidden">
                {node.content.slice(0, 100)}...
              </div>
            )}
            {node.type === 'folder' && (
              <div className="text-xs text-blue-600 mt-1">Click to open →</div>
            )}
          </div>
        ))}
      </div>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="p-8 text-center">
            <Sparkles className="w-8 h-8 text-sky-600 dark:text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Empty Canvas</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add your first node to get started
            </p>
            <Button onClick={handleAddTextNode}>
              Add Text Node
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}

// Canvas error fallback
function CanvasErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="p-8 text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Canvas Error</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          The canvas encountered a rendering error. This might be due to browser compatibility or memory issues.
        </p>
        <div className="space-y-2">
          <Button onClick={retry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <p className="text-xs text-gray-500">
            If this continues, the canvas will use safe mode
          </p>
        </div>
      </Card>
    </div>
  )
}

export default function SafeNeighborNotes(props: SafeNeighborNotesProps) {
  const [isClient, setIsClient] = useState(false)
  const [HTMLCanvas, setHTMLCanvas] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    let isMounted = true
    
    const loadCanvas = async () => {
      try {
        const canvasModule = await import('./HTMLCanvas')
        if (isMounted) {
          setHTMLCanvas(() => canvasModule.default)
        }
      } catch (error) {
        console.error('Failed to load HTML canvas component:', error)
        if (isMounted) {
          // Fallback to the simple canvas if even HTML canvas fails
          const FallbackComponent = () => <FallbackCanvas {...props} />
          FallbackComponent.displayName = 'FallbackComponent'
          setHTMLCanvas(() => FallbackComponent)
        }
      }
    }

    loadCanvas()

    return () => {
      isMounted = false
    }
  }, [props])

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-sky-600 dark:text-blue-400 animate-pulse" />
      </div>
    )
  }

  if (!HTMLCanvas) {
    return <FallbackCanvas {...props} />
  }

  return (
    <ErrorBoundary
      fallback={CanvasErrorFallback}
      onError={(error) => console.error('Canvas error:', error)}
    >
      <HTMLCanvas {...props} />
    </ErrorBoundary>
  )
}