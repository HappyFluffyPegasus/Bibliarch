// Canvas traversal logic for export

import { createClient } from '@/lib/supabase/client'
import type { CanvasData, ExportNode, ExportConnection } from './types'

// Type for raw canvas data from database
interface RawCanvasData {
  canvas_type: string
  nodes: ExportNode[] | null
  connections: ExportConnection[] | null
}

/**
 * Fetch all canvas data for a story in a single query
 */
export async function fetchAllCanvasData(storyId: string): Promise<Map<string, CanvasData>> {
  const supabase = createClient()

  const { data: allCanvases, error } = await supabase
    .from('canvas_data')
    .select('canvas_type, nodes, connections')
    .eq('story_id', storyId)

  if (error) {
    console.error('Error fetching canvas data:', error)
    throw error
  }

  // Convert to Map for easy lookup
  const canvasMap = new Map<string, CanvasData>()

  if (allCanvases) {
    for (const canvas of allCanvases as RawCanvasData[]) {
      canvasMap.set(canvas.canvas_type, {
        canvas_type: canvas.canvas_type,
        nodes: (canvas.nodes || []) as ExportNode[],
        connections: (canvas.connections || []) as ExportConnection[]
      })
    }
  }

  console.log(`[Export] Fetched ${canvasMap.size} canvases for story ${storyId}`)

  return canvasMap
}

/**
 * Sort nodes by position (top-left to bottom-right reading order)
 * This ensures consistent export ordering
 */
export function sortNodesByPosition(nodes: ExportNode[]): ExportNode[] {
  return [...nodes].sort((a, b) => {
    // Primary sort by Y (top to bottom)
    // Use a threshold to group nodes at similar Y positions
    const yThreshold = 50
    const yDiff = a.y - b.y

    if (Math.abs(yDiff) > yThreshold) {
      return yDiff
    }

    // Secondary sort by X (left to right) for nodes at similar Y
    return a.x - b.x
  })
}

/**
 * Get the nested canvas ID for a node
 * All navigable node types can have their own sub-canvases
 */
export function getNestedCanvasId(node: ExportNode): string | null {
  // Folders use linkedCanvasId or folder-canvas-{id}
  if (node.type === 'folder') {
    return node.linkedCanvasId || `folder-canvas-${node.id}`
  }

  // Characters have their own canvas
  if (node.type === 'character') {
    return `character-canvas-${node.id}`
  }

  // Events have their own canvas (for sub-events)
  if (node.type === 'event') {
    return `event-canvas-${node.id}`
  }

  // Locations have their own canvas (for sub-locations)
  if (node.type === 'location') {
    return `location-canvas-${node.id}`
  }

  return null
}

/**
 * Build a hierarchical structure of all canvases
 * Returns the main canvas and all nested canvases in traversal order
 */
export function buildCanvasHierarchy(
  canvasMap: Map<string, CanvasData>,
  startCanvasId: string = 'main'
): { canvasId: string; depth: number; parentTitle?: string }[] {
  const result: { canvasId: string; depth: number; parentTitle?: string }[] = []
  const visited = new Set<string>()

  function traverse(canvasId: string, depth: number, parentTitle?: string) {
    if (visited.has(canvasId)) return
    visited.add(canvasId)

    result.push({ canvasId, depth, parentTitle })

    const canvas = canvasMap.get(canvasId)
    if (!canvas) return

    const sortedNodes = sortNodesByPosition(canvas.nodes)

    for (const node of sortedNodes) {
      const nestedCanvasId = getNestedCanvasId(node)
      if (nestedCanvasId && canvasMap.has(nestedCanvasId)) {
        // Use node.text as the title (primary display name)
        const nodeTitle = node.text || node.type
        traverse(nestedCanvasId, depth + 1, nodeTitle)
      }
    }
  }

  traverse(startCanvasId, 0)
  return result
}
