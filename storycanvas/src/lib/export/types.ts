// Export types and interfaces

export interface ExportOptions {
  format: 'markdown' | 'plaintext'
  include: {
    characters: boolean
    events: boolean
    locations: boolean
    textNotes: boolean
    tables: boolean
    lists: boolean
    relationshipNodes: boolean
  }
}

export interface CanvasData {
  canvas_type: string
  nodes: ExportNode[]
  connections: ExportConnection[]
}

export interface ExportNode {
  id: string
  type: string
  x: number
  y: number
  width?: number
  height?: number
  // Main display name - THIS IS THE PRIMARY TITLE FIELD
  text: string
  // Body content for text nodes
  content?: string
  // Event node specific fields
  title?: string // Event title (secondary, for events only)
  summary?: string // Event description/summary
  durationText?: string // Event duration
  sequenceOrder?: number
  // Character/location description
  description?: string
  backstory?: string
  role?: string
  profileImageUrl?: string
  locationIcon?: string
  // Table data - dynamic columns like [{col1: 'value', col2: 'value'}]
  tableData?: Record<string, string>[]
  columnWidths?: Record<string, number>
  // List node
  childIds?: string[]
  // Folder/canvas linking
  linkedCanvasId?: string
  // Image node
  imageUrl?: string
  // Relationship canvas data
  relationshipData?: {
    selectedCharacters: Array<{
      id: string
      name: string
      imageUrl?: string
      position?: { x: number; y: number }
    }>
    relationships: Array<{
      id: string
      fromCharacterId: string
      toCharacterId: string
      relationshipType: string
      strength: number
      label: string
      notes?: string
      isBidirectional: boolean
      reverseLabel?: string
    }>
  }
  // Node settings
  nodeSettings?: {
    icon?: string
    expand_by_default?: boolean
    show_header_row?: boolean
    alternate_row_colors?: boolean
  }
}

export interface ExportConnection {
  id: string
  from: string
  to: string
  label?: string
  type?: string
}

export interface StoryMetadata {
  id: string
  title: string
  bio?: string
}

export interface ExportResult {
  content: string
  filename: string
  mimeType: string
}
