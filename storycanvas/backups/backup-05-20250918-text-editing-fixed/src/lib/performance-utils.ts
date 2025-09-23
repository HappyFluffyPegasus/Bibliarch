interface Node {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export interface ViewportBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export class PerformanceOptimizer {
  // Calculate which nodes are visible in the current viewport
  static getVisibleNodes(
    nodes: Node[],
    viewportBounds: ViewportBounds,
    scale: number,
    buffer: number = 200 // Additional buffer around viewport
  ): Node[] {
    const scaledBuffer = buffer / scale
    
    return nodes.filter(node => {
      const nodeLeft = node.x
      const nodeRight = node.x + node.width
      const nodeTop = node.y
      const nodeBottom = node.y + node.height
      
      const viewLeft = viewportBounds.minX - scaledBuffer
      const viewRight = viewportBounds.maxX + scaledBuffer
      const viewTop = viewportBounds.minY - scaledBuffer
      const viewBottom = viewportBounds.maxY + scaledBuffer
      
      // Check if node intersects with viewport (including buffer)
      return !(nodeRight < viewLeft || 
               nodeLeft > viewRight || 
               nodeBottom < viewTop || 
               nodeTop > viewBottom)
    })
  }

  // Calculate viewport bounds from canvas transform and size
  static calculateViewportBounds(
    canvasElement: HTMLElement | null,
    pan: { x: number; y: number },
    scale: number
  ): ViewportBounds {
    if (!canvasElement) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 }
    }

    const rect = canvasElement.getBoundingClientRect()
    
    // Convert screen coordinates to canvas coordinates
    const minX = (-pan.x) / scale
    const minY = (-pan.y) / scale
    const maxX = (rect.width - pan.x) / scale
    const maxY = (rect.height - pan.y) / scale
    
    return { minX, minY, maxX, maxY }
  }

  // Debounce function for reducing update frequency
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null
    
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // Throttle function for limiting update frequency
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // Batch DOM updates using requestAnimationFrame
  static batchUpdates(callback: () => void): void {
    requestAnimationFrame(callback)
  }

  // Calculate optimal render quality based on performance
  static getOptimalRenderSettings(nodeCount: number, isMoving: boolean): {
    quality: 'high' | 'medium' | 'low'
    skipAnimations: boolean
    simplifyNodes: boolean
  } {
    if (isMoving) {
      return {
        quality: 'low',
        skipAnimations: true,
        simplifyNodes: true
      }
    }

    if (nodeCount > 200) {
      return {
        quality: 'medium',
        skipAnimations: false,
        simplifyNodes: true
      }
    }

    if (nodeCount > 100) {
      return {
        quality: 'medium',
        skipAnimations: false,
        simplifyNodes: false
      }
    }

    return {
      quality: 'high',
      skipAnimations: false,
      simplifyNodes: false
    }
  }

  // Memory management for large datasets
  static cleanupUnusedResources(
    allNodes: Node[],
    visibleNodes: Node[],
    nodeCache: Map<string, any>
  ): void {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id))
    
    // Remove cached data for nodes that are no longer visible
    for (const [nodeId] of nodeCache) {
      if (!visibleNodeIds.has(nodeId)) {
        nodeCache.delete(nodeId)
      }
    }
  }

  // Performance monitoring
  static measurePerformance<T>(
    operationName: string,
    operation: () => T
  ): T {
    const startTime = performance.now()
    const result = operation()
    const endTime = performance.now()
    
    const duration = endTime - startTime
    if (duration > 16) { // More than one frame (60fps)
      console.warn(`Performance warning: ${operationName} took ${duration.toFixed(2)}ms`)
    }
    
    return result
  }

  // Optimize connection rendering for large numbers
  static getVisibleConnections(
    connections: Array<{ from: string; to: string }>,
    visibleNodeIds: Set<string>
  ): Array<{ from: string; to: string }> {
    return connections.filter(conn => 
      visibleNodeIds.has(conn.from) && visibleNodeIds.has(conn.to)
    )
  }

  // Level-of-detail optimization
  static shouldRenderNodeDetails(
    node: Node,
    scale: number,
    viewportBounds: ViewportBounds
  ): {
    showTitle: boolean
    showContent: boolean
    showBorder: boolean
  } {
    const nodeSize = Math.max(node.width * scale, node.height * scale)
    const distanceFromCenter = this.calculateDistanceFromViewportCenter(node, viewportBounds)
    
    if (scale < 0.3 || nodeSize < 30) {
      return {
        showTitle: false,
        showContent: false,
        showBorder: false
      }
    }
    
    if (scale < 0.5 || nodeSize < 50 || distanceFromCenter > 1000) {
      return {
        showTitle: true,
        showContent: false,
        showBorder: true
      }
    }
    
    return {
      showTitle: true,
      showContent: true,
      showBorder: true
    }
  }

  private static calculateDistanceFromViewportCenter(
    node: Node,
    viewportBounds: ViewportBounds
  ): number {
    const centerX = (viewportBounds.minX + viewportBounds.maxX) / 2
    const centerY = (viewportBounds.minY + viewportBounds.maxY) / 2
    const nodeCenterX = node.x + node.width / 2
    const nodeCenterY = node.y + node.height / 2
    
    return Math.sqrt(
      Math.pow(nodeCenterX - centerX, 2) + 
      Math.pow(nodeCenterY - centerY, 2)
    )
  }
}