// Plain text formatter for export
// Uses visual hierarchy that actually works in plain text files
// Designed for human readability without markdown rendering

import type { StoryMetadata, CanvasData, ExportOptions, ExportNode } from '../types'
import { sortNodesByPosition, getNestedCanvasId } from '../canvasTraversal'

// Placeholder text that should be filtered from exports (UI-only instructions)
const UI_PLACEHOLDERS = new Set([
  'Upload a map of your world here',
  'Click to add image',
  'Drag and drop an image here',
  'Add your image here',
])

// Check if content is UI placeholder (should be removed)
function isUIPlaceholder(content: string | undefined): boolean {
  if (!content) return false
  const trimmed = content.trim()
  return UI_PLACEHOLDERS.has(trimmed)
}

// Get display name for a node - uses 'text' field as primary
function getNodeName(node: ExportNode): string {
  // For events, prefer title if it exists, otherwise use text
  if (node.type === 'event' && node.title) {
    return node.title
  }
  // Primary display name is always 'text'
  return node.text || 'Untitled'
}

// Get content/description for a node
function getNodeContent(node: ExportNode): string | undefined {
  // For events, use summary
  if (node.type === 'event') {
    return node.summary
  }
  // For text nodes, use content
  if (node.type === 'text' || node.type === 'compact-text') {
    return node.content
  }
  // For locations, use content or description
  if (node.type === 'location') {
    return node.content || node.description
  }
  return node.content || node.description
}

interface CharacterWithContent {
  node: ExportNode
  subCanvasContent: CollectedContent
}

interface EventWithContent {
  node: ExportNode
  subCanvasContent: CollectedContent
}

interface LocationWithContent {
  node: ExportNode
  subCanvasContent: CollectedContent
}

interface FolderWithContent {
  node: ExportNode
  children: CollectedContent
}

interface CollectedContent {
  characters: CharacterWithContent[]
  events: EventWithContent[]
  locations: LocationWithContent[]
  textNotes: ExportNode[]
  tables: ExportNode[]
  lists: ExportNode[]
  images: ExportNode[]
  relationshipNodes: ExportNode[]
  folders: FolderWithContent[]
  allNodes: ExportNode[]
}

function createEmptyContent(): CollectedContent {
  return {
    characters: [],
    events: [],
    locations: [],
    textNotes: [],
    tables: [],
    lists: [],
    images: [],
    relationshipNodes: [],
    folders: [],
    allNodes: []
  }
}

// Recursively collect content from a canvas, including all nested canvases
function collectCanvasContent(
  canvas: CanvasData,
  allCanvases: Map<string, CanvasData>,
  visited: Set<string>
): CollectedContent {
  const content = createEmptyContent()

  if (visited.has(canvas.canvas_type)) {
    return content
  }
  visited.add(canvas.canvas_type)

  content.allNodes = canvas.nodes || []
  const sortedNodes = sortNodesByPosition(canvas.nodes || [])

  for (const node of sortedNodes) {
    switch (node.type) {
      case 'character': {
        const charCanvasId = getNestedCanvasId(node)
        let charSubContent = createEmptyContent()

        if (charCanvasId && allCanvases.has(charCanvasId)) {
          const charCanvas = allCanvases.get(charCanvasId)!
          charSubContent = collectCanvasContent(charCanvas, allCanvases, new Set(visited))
        }

        content.characters.push({ node, subCanvasContent: charSubContent })
        break
      }
      case 'event': {
        const eventCanvasId = getNestedCanvasId(node)
        let eventSubContent = createEmptyContent()

        if (eventCanvasId && allCanvases.has(eventCanvasId)) {
          const eventCanvas = allCanvases.get(eventCanvasId)!
          eventSubContent = collectCanvasContent(eventCanvas, allCanvases, new Set(visited))
        }

        content.events.push({ node, subCanvasContent: eventSubContent })
        break
      }
      case 'location': {
        const locationCanvasId = getNestedCanvasId(node)
        let locationSubContent = createEmptyContent()

        if (locationCanvasId && allCanvases.has(locationCanvasId)) {
          const locationCanvas = allCanvases.get(locationCanvasId)!
          locationSubContent = collectCanvasContent(locationCanvas, allCanvases, new Set(visited))
        }

        content.locations.push({ node, subCanvasContent: locationSubContent })
        break
      }
      case 'text':
      case 'compact-text':
        content.textNotes.push(node)
        break
      case 'table':
        content.tables.push(node)
        break
      case 'list':
        content.lists.push(node)
        break
      case 'image':
        content.images.push(node)
        break
      case 'relationship-canvas':
        content.relationshipNodes.push(node)
        break
      case 'folder': {
        const nestedCanvasId = getNestedCanvasId(node)
        if (nestedCanvasId && allCanvases.has(nestedCanvasId)) {
          const nestedCanvas = allCanvases.get(nestedCanvasId)!
          const nestedContent = collectCanvasContent(nestedCanvas, allCanvases, new Set(visited))
          content.folders.push({ node, children: nestedContent })
        } else {
          content.folders.push({ node, children: createEmptyContent() })
        }
        break
      }
    }
  }

  return content
}

// Create a title heading with underline
// Level 1: TITLE with ===== underline
// Level 2: Title with ----- underline
// Level 3+: Title with no underline but prefix markers
function makeHeading(text: string, level: number): string {
  if (level === 1) {
    // Main title - ALL CAPS with double line
    const title = text.toUpperCase()
    return `${title}\n${'='.repeat(title.length)}\n\n`
  } else if (level === 2) {
    // Section - Title Case with single line
    return `${text}\n${'-'.repeat(text.length)}\n\n`
  } else if (level === 3) {
    // Subsection - with arrow prefix
    return `► ${text}\n\n`
  } else if (level === 4) {
    // Sub-subsection - with bullet prefix
    return `  • ${text}\n\n`
  } else {
    // Deeper levels - indented with dash
    const indent = '    '.repeat(level - 4)
    return `${indent}- ${text}\n\n`
  }
}

// Format a labeled field
function formatField(label: string, value: string | undefined, indent: string = ''): string {
  if (value && value.trim() && !isUIPlaceholder(value)) {
    // Wrap long content with proper indentation
    const lines = value.split('\n')
    if (lines.length > 1) {
      return `${indent}${label}:\n${lines.map(l => `${indent}    ${l}`).join('\n')}\n\n`
    }
    return `${indent}${label}: ${value}\n`
  } else {
    return `${indent}${label}: (not written yet)\n`
  }
}

// Format a character node with all its content
function formatCharacter(
  charWithContent: CharacterWithContent,
  level: number
): string {
  const node = charWithContent.node
  const name = getNodeName(node)
  let output = makeHeading(name, level)

  const indent = level >= 3 ? '    ' : ''

  // Role
  output += formatField('Role', node.role, indent)

  // Description
  if (node.description) {
    output += formatField('Description', node.description, indent)
  }

  // Backstory
  if (node.backstory) {
    output += formatField('Backstory', node.backstory, indent)
  }

  output += '\n'

  // Include text notes from character's sub-canvas as fields
  const subContent = charWithContent.subCanvasContent

  for (const textNote of subContent.textNotes) {
    const fieldName = getNodeName(textNote)
    const fieldContent = getNodeContent(textNote)

    if (isUIPlaceholder(fieldContent)) continue

    output += formatField(fieldName, fieldContent, indent)
  }

  // Include tables from character's sub-canvas
  for (const table of subContent.tables) {
    output += formatTable(table, level + 1)
  }

  // Include lists from character's sub-canvas
  for (const list of subContent.lists) {
    output += formatList(list, level + 1)
  }

  // Include nested folders from character's sub-canvas
  for (const folder of subContent.folders) {
    output += formatFolder(folder, level + 1)
  }

  return output
}

// Format an event node with all its content
function formatEvent(
  eventWithContent: EventWithContent,
  level: number
): string {
  const node = eventWithContent.node
  const name = getNodeName(node)
  let output = makeHeading(name, level)

  const indent = level >= 3 ? '    ' : ''

  // Duration
  if (node.durationText) {
    output += `${indent}Duration: ${node.durationText}\n`
  }

  // Summary/Description
  const summary = node.summary
  if (summary && summary.trim() && !isUIPlaceholder(summary)) {
    const lines = summary.split('\n')
    for (const line of lines) {
      output += `${indent}${line}\n`
    }
  } else {
    output += `${indent}(no description written yet)\n`
  }

  output += '\n'

  // Include sub-content from event's canvas
  const subContent = eventWithContent.subCanvasContent

  // Sub-events
  if (subContent.events.length > 0) {
    for (const subEvent of subContent.events) {
      output += formatEvent(subEvent, level + 1)
    }
  }

  // Text notes inside event
  for (const textNote of subContent.textNotes) {
    const fieldName = getNodeName(textNote)
    const fieldContent = getNodeContent(textNote)

    if (isUIPlaceholder(fieldContent)) continue

    output += formatField(fieldName, fieldContent, indent)
  }

  // Tables inside event
  for (const table of subContent.tables) {
    output += formatTable(table, level + 1)
  }

  // Nested folders inside event
  for (const folder of subContent.folders) {
    output += formatFolder(folder, level + 1)
  }

  return output
}

// Format a location node with all its content
function formatLocation(
  locationWithContent: LocationWithContent,
  level: number
): string {
  const node = locationWithContent.node
  const name = getNodeName(node)
  let output = makeHeading(name, level)

  const indent = level >= 3 ? '    ' : ''

  // Content/Description
  const content = getNodeContent(node)
  if (content && content.trim() && !isUIPlaceholder(content)) {
    const lines = content.split('\n')
    for (const line of lines) {
      output += `${indent}${line}\n`
    }
    output += '\n'
  }

  // Include sub-content from location's canvas
  const subContent = locationWithContent.subCanvasContent

  // Text notes inside location
  for (const textNote of subContent.textNotes) {
    const fieldName = getNodeName(textNote)
    const fieldContent = getNodeContent(textNote)

    if (isUIPlaceholder(fieldContent)) continue

    output += formatField(fieldName, fieldContent, indent)
  }

  // Tables inside location
  for (const table of subContent.tables) {
    output += formatTable(table, level + 1)
  }

  // Lists inside location
  for (const list of subContent.lists) {
    output += formatList(list, level + 1)
  }

  // Nested locations
  for (const subLocation of subContent.locations) {
    output += formatLocation(subLocation, level + 1)
  }

  // Nested folders inside location
  for (const folder of subContent.folders) {
    output += formatFolder(folder, level + 1)
  }

  return output
}

// Format a text note
function formatTextNote(node: ExportNode, level: number): string {
  const title = getNodeName(node)
  const content = getNodeContent(node)

  if (isUIPlaceholder(content)) return ''

  let output = makeHeading(title, level)

  const indent = level >= 3 ? '    ' : ''

  if (content && content.trim()) {
    const lines = content.split('\n')
    for (const line of lines) {
      output += `${indent}${line}\n`
    }
    output += '\n'
  } else {
    output += `${indent}(not written yet)\n\n`
  }

  return output
}

// Format a table node with dynamic columns
function formatTable(node: ExportNode, level: number): string {
  const title = getNodeName(node)
  const tableData = node.tableData

  let output = makeHeading(title, level)

  const indent = level >= 3 ? '    ' : ''

  if (!tableData || tableData.length === 0) {
    output += `${indent}(no data in table)\n\n`
    return output
  }

  // Get all column keys from the first row
  const columns = Object.keys(tableData[0]).filter(key =>
    key !== 'id' && !key.startsWith('_')
  )

  if (columns.length === 0) {
    output += `${indent}(no data in table)\n\n`
    return output
  }

  // Calculate column widths
  const colWidths = columns.map(col => {
    const headerLen = col.length
    const maxDataLen = Math.max(
      ...tableData.map(row => ((row[col] || '') as string).length),
      0
    )
    return Math.max(headerLen, maxDataLen, 8)
  })

  // Header row
  output += indent + columns.map((col, i) => col.padEnd(colWidths[i])).join(' | ') + '\n'
  output += indent + colWidths.map(w => '-'.repeat(w)).join('-+-') + '\n'

  // Data rows
  for (const row of tableData) {
    output += indent + columns.map((col, i) =>
      ((row[col] || '') as string).padEnd(colWidths[i])
    ).join(' | ') + '\n'
  }

  output += '\n'
  return output
}

// Format a list node
function formatList(node: ExportNode, level: number): string {
  const title = getNodeName(node)
  const childIds = node.childIds || []

  let output = makeHeading(title, level)

  const indent = level >= 3 ? '    ' : ''

  if (childIds.length === 0) {
    output += `${indent}(no items in list)\n\n`
  } else {
    output += `${indent}${childIds.length} items\n\n`
  }

  return output
}

// Format a relationship node as text
function formatRelationshipNode(node: ExportNode, level: number): string {
  const title = getNodeName(node)
  let output = makeHeading(title, level)

  const indent = level >= 3 ? '    ' : ''
  const relData = node.relationshipData

  if (!relData) {
    output += `${indent}(no relationship data)\n\n`
    return output
  }

  const characters = relData.selectedCharacters || []
  const relationships = relData.relationships || []

  if (characters.length > 0) {
    output += `${indent}Characters:\n`
    for (const char of characters) {
      output += `${indent}  - ${char.name}\n`
    }
    output += '\n'
  }

  if (relationships.length > 0) {
    output += `${indent}Relationships:\n`
    for (const rel of relationships) {
      const fromChar = characters.find(c => c.id === rel.fromCharacterId)
      const toChar = characters.find(c => c.id === rel.toCharacterId)
      const fromName = fromChar?.name || 'Unknown'
      const toName = toChar?.name || 'Unknown'

      if (rel.isBidirectional && rel.reverseLabel) {
        output += `${indent}  ${fromName} --> ${toName}: ${rel.label}\n`
        output += `${indent}  ${toName} --> ${fromName}: ${rel.reverseLabel}\n`
      } else if (rel.isBidirectional) {
        output += `${indent}  ${fromName} <--> ${toName}: ${rel.label}\n`
      } else {
        output += `${indent}  ${fromName} --> ${toName}: ${rel.label}\n`
      }

      if (rel.notes) {
        output += `${indent}      Notes: ${rel.notes}\n`
      }
    }
    output += '\n'
  }

  return output
}

// Format a folder with all its contents
function formatFolder(
  folderWithContent: FolderWithContent,
  level: number
): string {
  const node = folderWithContent.node
  const title = getNodeName(node)
  const children = folderWithContent.children

  let output = makeHeading(title, level)

  const indent = level >= 3 ? '    ' : ''

  // Folder description if any
  if (node.content && !isUIPlaceholder(node.content)) {
    output += `${indent}${node.content}\n\n`
  }

  // Format all content inside the folder
  output += formatContent(children, level + 1)

  return output
}

// Format all collected content
function formatContent(
  content: CollectedContent,
  level: number
): string {
  let output = ''

  // Characters
  for (const char of content.characters) {
    output += formatCharacter(char, level)
  }

  // Events
  for (const event of content.events) {
    output += formatEvent(event, level)
  }

  // Locations
  for (const location of content.locations) {
    output += formatLocation(location, level)
  }

  // Relationship nodes
  for (const relNode of content.relationshipNodes) {
    output += formatRelationshipNode(relNode, level)
  }

  // Text notes
  for (const note of content.textNotes) {
    output += formatTextNote(note, level)
  }

  // Tables
  for (const table of content.tables) {
    output += formatTable(table, level)
  }

  // Lists
  for (const list of content.lists) {
    output += formatList(list, level)
  }

  // Folders (recursive)
  for (const folder of content.folders) {
    output += formatFolder(folder, level)
  }

  return output
}

// Apply options to filter content
function filterContentByOptions(content: CollectedContent, options: ExportOptions): CollectedContent {
  return {
    characters: options.include.characters ? content.characters : [],
    events: options.include.events ? content.events : [],
    locations: options.include.locations ? content.locations : [],
    textNotes: options.include.textNotes ? content.textNotes : [],
    tables: options.include.tables ? content.tables : [],
    lists: options.include.lists ? content.lists : [],
    images: [],
    relationshipNodes: options.include.relationshipNodes ? content.relationshipNodes : [],
    folders: content.folders.map(f => ({
      node: f.node,
      children: filterContentByOptions(f.children, options)
    })),
    allNodes: content.allNodes
  }
}

export function formatAsPlainText(
  story: StoryMetadata,
  allCanvases: Map<string, CanvasData>,
  options: ExportOptions
): string {
  let output = ''

  // Title - Level 1 (ALL CAPS with === underline)
  output += makeHeading(story.title, 1)

  // Story bio/description
  if (story.bio) {
    output += `${story.bio}\n\n`
  }

  // Divider
  output += '════════════════════════════════════════════════════════════════\n\n'

  // Collect all content from main canvas
  const mainCanvas = allCanvases.get('main')
  if (mainCanvas) {
    const visited = new Set<string>()
    const content = collectCanvasContent(mainCanvas, allCanvases, visited)

    // Apply options filter
    const filteredContent = filterContentByOptions(content, options)

    // Format all content starting at level 2
    output += formatContent(filteredContent, 2)
  }

  return output
}
