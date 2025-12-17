// Plain text formatter for export
// Uses visual hierarchy that actually works in plain text files
// Designed for human readability without markdown rendering

import type { StoryMetadata, CanvasData, ExportOptions, ExportNode } from '../types'
import { sortNodesByPosition, getNestedCanvasId } from '../canvasTraversal'

// Template default content that should be SKIPPED entirely
// These are placeholder prompts from templates that users haven't filled in
const TEMPLATE_DEFAULTS = new Set([
  // General
  'Write your content here...',
  'Describe what happens in this event...',
  'Upload a map of your world here',
  'Upload a map of your world here →',
  'Upload a map of this country/region (any shape/size) →',
  'Click to add image',
  'Drag and drop an image here',
  'Add your image here',

  // Character templates
  'What is their history and past?',
  'Who are they at the start?',
  'Who have they become?',
  'What themes do they represent?',
  'What drives this character?',
  'What are their moral principles?',

  // Event templates
  'What event kicks off your story?',
  'What challenges does your protagonist face?',
  'What major event changes everything?',
  'What is the final confrontation?',
  'How does everything wrap up?',
  'What happens first in this event?',
  'What happens next?',
  'What happens after that?',
  'How does this event conclude?',
  'How does this serve the overall story? What does the audience learn? What changes as a result?',
  'What themes are explored here? Any symbolic elements? Motifs or recurring imagery?',
  'How should the audience feel? Emotional journey within this event. Key emotional beats.',
  'Introduce your protagonist and their ordinary world. Set the tone and establish the initial situation before everything changes.',
  'The event that kicks off your story and disrupts the protagonist\'s ordinary world. This is what sets everything in motion.',
  'The protagonist makes a crucial decision or faces a situation they cannot back away from. The stakes are raised.',
  'A major revelation or turning point that changes the protagonist\'s understanding of their situation. The game changes.',
  'The lowest point for your protagonist. All seems lost, and they must find the strength to continue despite overwhelming odds.',
  'The final confrontation or decisive moment. The protagonist faces their greatest challenge and the main conflict reaches its peak.',
  'The aftermath of the climax. Loose ends are tied up, and we see how the protagonist\'s world has changed.',
  'Where does this happen? What\'s the mood/tone? Time of day, weather, sensory details?',
  'What\'s at stake in this moment? What could go wrong? What tension exists?',
  'Important lines or exchanges. Memorable moments.',
  'Key visual moments. Action sequences. Important blocking or cinematography ideas.',

  // Location templates
  'Where does most of your story take place?',
  'What are the rules that govern your story world?',
  'What happened before your story begins?',
  'What other important places appear in your story?',
  'How should your world feel to readers?',

  // Theme templates
  'What is the main conflict driving your story?',
  'What ethical dilemmas does your story explore?',
  'How do your characters change and learn?',
  'What broader social issues does your story address?',
  'What emotions should readers feel and why?',
  'Jot recurring imagery, symbols, or foreshadowing ideas.',
  'Track how conflict escalates and what\'s at risk.',
  'What subplots or secondary stories run alongside your main plot?',

  // Worldbuilding templates
  'What are the major landforms, climates, and regions?',
  'What unites or defines cultures across the world?',
  'How advanced is the world, and what role does magic/tech play?',
  'What do people believe in, and how does it affect daily life?',
  'What fuels prosperity or scarcity across nations?',
  'Are there many languages? A common tongue?',
  'How do people move, migrate, or share ideas?',
  'What\'s seen as sacred, shameful, or universally important?',
  'Who holds authority (political, magical, religious)?',
  'What are the big global threats or rivalries?',
  'What major events shaped this world?',

  // Country/Location templates
  'What defines the country\'s traditions, customs, festivals, and rituals?',
  'What terrain, natural resources, or weather shape life here?',
  'Are there dominant faiths, cults, or superstitions?',
  'What\'s sacred, shameful, or central to identity?',
  'What\'s their army/navy like? Are they expansionist or defensive?',
  'Who rules? What systems of government, monarchy, or councils exist?',
  'List the most important or notable urban centers.',
  'What\'s unique about their level of progress or magical practices?',
  'Rivalries, wars, rebellions, internal strife, and current political tensions.',
  'What\'s daily living like for common people vs. elites?',
  'How did this country form? What key events shaped it? Founding myths, major wars, cultural shifts, and historical turning points.',
  'What are the main exports/imports? How wealthy is the nation?',
  'Music, fashion, food, or art they\'re known for abroad.',
  'What\'s spoken here? Any regional slang or secret codes?',
  'Who rules? How? What parties/factions exist? How stable is the government?',
  'What social classes exist? How mobile is society? What are the cultural values?',
  'What are the unique traditions, festivals, foods, and daily customs?',
  'What natural resources, terrains, and geographic features define this land?',
  'What\'s the weather like? Seasons? Environmental challenges?',
  'How do they protect themselves? What\'s their military structure and strength?',
  'What do people believe? Major religions, spiritual practices, or philosophies.',
  'Internal conflicts, border disputes, or major challenges they face.',
  'What does this location share with the world? Art, music, customs, technology, philosophy.',
])

// Check if content is a template default (should be skipped)
function isTemplateDefault(content: string | undefined): boolean {
  if (!content) return true
  const trimmed = content.trim()
  if (!trimmed) return true
  return TEMPLATE_DEFAULTS.has(trimmed)
}

// Check if a string contains only template/placeholder content
function isEmptyOrTemplate(content: string | undefined): boolean {
  if (!content) return true
  const trimmed = content.trim()
  if (!trimmed) return true
  if (TEMPLATE_DEFAULTS.has(trimmed)) return true
  // Also check if it starts with common template patterns
  if (trimmed.startsWith('What ') && trimmed.endsWith('?')) return true
  if (trimmed.startsWith('How ') && trimmed.endsWith('?')) return true
  if (trimmed.startsWith('Who ') && trimmed.endsWith('?')) return true
  if (trimmed.startsWith('Where ') && trimmed.endsWith('?')) return true
  if (trimmed.startsWith('Describe ') && trimmed.endsWith('...')) return true
  if (trimmed.includes('Upload a map')) return true
  return false
}

// Get display name for a node - uses 'text' field as primary
function getNodeName(node: ExportNode): string {
  if (node.type === 'event' && node.title) {
    return node.title
  }
  return node.text || ''
}

// Get content/description for a node
function getNodeContent(node: ExportNode): string | undefined {
  if (node.type === 'event') {
    return node.summary
  }
  if (node.type === 'text' || node.type === 'compact-text') {
    return node.content
  }
  if (node.type === 'location') {
    return node.content || node.description
  }
  return node.content || node.description
}

// Check if a node has any meaningful content
function hasContent(node: ExportNode): boolean {
  const name = getNodeName(node)
  const content = getNodeContent(node)

  // If name is empty or "Untitled", check if there's real content
  if (!name || name === 'Untitled' || name === 'Untitled Section') {
    return !isEmptyOrTemplate(content)
  }

  return true
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

// Sort events by extracting age/number from title for chronological order
function sortEventsByAge(events: EventWithContent[]): EventWithContent[] {
  return [...events].sort((a, b) => {
    const nameA = getNodeName(a.node)
    const nameB = getNodeName(b.node)

    // Try to extract age numbers from titles like "Age 0-4", "Age 5", etc.
    const ageMatchA = nameA.match(/age\s*(\d+)/i)
    const ageMatchB = nameB.match(/age\s*(\d+)/i)

    if (ageMatchA && ageMatchB) {
      return parseInt(ageMatchA[1]) - parseInt(ageMatchB[1])
    }

    // If one has age and other doesn't, age comes first
    if (ageMatchA) return -1
    if (ageMatchB) return 1

    // Otherwise sort by sequence order if available
    if (a.node.sequenceOrder !== undefined && b.node.sequenceOrder !== undefined) {
      return a.node.sequenceOrder - b.node.sequenceOrder
    }

    // Fall back to original order
    return 0
  })
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
        // Skip list nodes entirely - they just contain references
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
function makeHeading(text: string, level: number): string {
  if (level === 1) {
    const title = text.toUpperCase()
    return `${title}\n${'='.repeat(title.length)}\n\n`
  } else if (level === 2) {
    return `${text}\n${'-'.repeat(text.length)}\n\n`
  } else if (level === 3) {
    return `► ${text}\n\n`
  } else if (level === 4) {
    return `    • ${text}\n\n`
  } else {
    const indent = '        ' + '    '.repeat(level - 5)
    return `${indent}- ${text}\n\n`
  }
}

// Format a labeled field - only if it has real content
function formatField(label: string, value: string | undefined, indent: string = ''): string {
  // Skip if value is empty or template default
  if (isEmptyOrTemplate(value)) {
    return ''
  }

  const lines = value!.split('\n')
  if (lines.length > 1) {
    return `${indent}${label}:\n${lines.map(l => `${indent}    ${l}`).join('\n')}\n\n`
  }
  return `${indent}${label}: ${value}\n`
}

// Format a character node with all its content
function formatCharacter(
  charWithContent: CharacterWithContent,
  level: number
): string {
  const node = charWithContent.node
  const name = getNodeName(node)

  // Skip characters with no name
  if (!name) return ''

  const indent = level >= 3 ? '    ' : ''

  // Build content first to check if character has anything
  let contentParts: string[] = []

  // Only show fields that have real content
  const roleField = formatField('Role', node.role, indent)
  const descField = formatField('Description', node.description, indent)
  const backstoryField = formatField('Backstory', node.backstory, indent)

  if (roleField) contentParts.push(roleField)
  if (descField) contentParts.push(descField)
  if (backstoryField) contentParts.push(backstoryField)

  // Include text notes from character's sub-canvas as fields
  const subContent = charWithContent.subCanvasContent

  for (const textNote of subContent.textNotes) {
    const fieldName = getNodeName(textNote)
    const fieldContent = getNodeContent(textNote)

    // Skip if no name or template content
    if (!fieldName || isEmptyOrTemplate(fieldContent)) continue

    const field = formatField(fieldName, fieldContent, indent)
    if (field) contentParts.push(field)
  }

  // Include tables from character's sub-canvas
  let tableContent = ''
  for (const table of subContent.tables) {
    const tableName = getNodeName(table)
    if (tableName && tableName !== 'Untitled') {
      tableContent += formatTable(table, level + 1)
    } else {
      tableContent += formatTable({ ...table, text: 'Character Info' } as ExportNode, level + 1)
    }
  }

  // Include nested folders from character's sub-canvas
  let folderContent = ''
  for (const folder of subContent.folders) {
    folderContent += formatFolder(folder, level + 1)
  }

  // Skip character entirely if no content at all
  if (contentParts.length === 0 && !tableContent.trim() && !folderContent.trim()) {
    return ''
  }

  let output = makeHeading(name, level)
  output += contentParts.join('')
  output += tableContent
  output += folderContent

  return output
}

// Format an event node with all its content
function formatEvent(
  eventWithContent: EventWithContent,
  level: number
): string {
  const node = eventWithContent.node
  const name = getNodeName(node)

  // Skip events with no name
  if (!name) return ''

  // Check what real content exists
  const summary = node.summary
  const subContent = eventWithContent.subCanvasContent
  const hasRealSummary = !isEmptyOrTemplate(summary)

  // Check for real sub-content (recursively check if sub-events have content)
  const hasRealSubEvents = subContent.events.some(e => {
    const subSummary = e.node.summary
    return !isEmptyOrTemplate(subSummary)
  })
  const hasRealTextNotes = subContent.textNotes.some(n => !isEmptyOrTemplate(getNodeContent(n)))
  const hasRealTables = subContent.tables.some(t => {
    const tableData = t.tableData
    if (!tableData || tableData.length === 0) return false
    const columns = Object.keys(tableData[0]).filter(k => k !== 'id' && !k.startsWith('_'))
    return tableData.some(row => columns.some(col => {
      const val = row[col]
      return val && val.trim() && val !== '☐' && val !== '☑' && !isEmptyOrTemplate(val)
    }))
  })
  const hasRealFolders = subContent.folders.some(f => {
    const folderContent = formatContent(f.children, level + 2)
    return folderContent.trim().length > 0
  })

  const hasSubContent = hasRealSubEvents || hasRealTextNotes || hasRealTables || hasRealFolders

  // If no real content at all (just duration), skip this event
  if (!hasRealSummary && !hasSubContent) {
    return ''
  }

  let output = makeHeading(name, level)

  const indent = level >= 3 ? '    ' : ''

  // Duration - only show if there's also real content
  if (node.durationText && node.durationText !== 'N/A') {
    output += `${indent}Duration: ${node.durationText}\n`
  }

  // Summary/Description - only if real content
  if (hasRealSummary) {
    const lines = summary!.split('\n')
    for (const line of lines) {
      output += `${indent}${line}\n`
    }
  }

  output += '\n'

  // Sub-events - sorted by age, only those with content
  if (subContent.events.length > 0) {
    const sortedSubEvents = sortEventsByAge(subContent.events)
    for (const subEvent of sortedSubEvents) {
      output += formatEvent(subEvent, level + 1)
    }
  }

  // Text notes inside event - only with real content
  for (const textNote of subContent.textNotes) {
    const fieldName = getNodeName(textNote)
    const fieldContent = getNodeContent(textNote)

    if (!fieldName || isEmptyOrTemplate(fieldContent)) continue

    output += formatField(fieldName, fieldContent, indent)
  }

  // Tables inside event - only with real content
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

  if (!name) return ''

  let output = makeHeading(name, level)

  const indent = level >= 3 ? '    ' : ''

  // Content/Description - only if real content
  const content = getNodeContent(node)
  if (!isEmptyOrTemplate(content)) {
    const lines = content!.split('\n')
    for (const line of lines) {
      output += `${indent}${line}\n`
    }
    output += '\n'
  }

  // Include sub-content from location's canvas
  const subContent = locationWithContent.subCanvasContent

  // Text notes inside location - only with real content
  for (const textNote of subContent.textNotes) {
    const fieldName = getNodeName(textNote)
    const fieldContent = getNodeContent(textNote)

    if (!fieldName || isEmptyOrTemplate(fieldContent)) continue

    output += formatField(fieldName, fieldContent, indent)
  }

  // Tables inside location
  for (const table of subContent.tables) {
    output += formatTable(table, level + 1)
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

// Format a text note - only if it has real content
function formatTextNote(node: ExportNode, level: number): string {
  const title = getNodeName(node)
  const content = getNodeContent(node)

  // Skip if no title or content is template default
  if (!title || isEmptyOrTemplate(content)) return ''

  let output = makeHeading(title, level)

  const indent = level >= 3 ? '    ' : ''

  const lines = content!.split('\n')
  for (const line of lines) {
    output += `${indent}${line}\n`
  }
  output += '\n'

  return output
}

// Format a table node with dynamic columns
function formatTable(node: ExportNode, level: number): string {
  const title = getNodeName(node)
  const tableData = node.tableData

  // Skip tables with no data
  if (!tableData || tableData.length === 0) {
    return ''
  }

  // Get all column keys from the first row
  const columns = Object.keys(tableData[0]).filter(key =>
    key !== 'id' && !key.startsWith('_')
  )

  if (columns.length === 0) {
    return ''
  }

  // Filter rows that have meaningful data
  // For key-value tables (like Country Profile), check if the value column has data
  const valueColumn = columns.length >= 2 ? columns[1] : columns[0]
  const rowsWithData = tableData.filter(row => {
    // Check if any column (especially value columns) has real data
    return columns.some((col, idx) => {
      const val = row[col]
      if (!val || !val.trim()) return false
      if (val === '☐' || val === '☑') return false
      // For key-value tables, the first column is usually labels
      // We care about whether the value (2nd column) has data
      if (columns.length === 2 && idx === 0) {
        // This is the label column - check if corresponding value exists
        const valueVal = row[valueColumn]
        return valueVal && valueVal.trim()
      }
      return true
    })
  })

  // Skip if no rows have meaningful data
  if (rowsWithData.length === 0) {
    return ''
  }

  let output = ''

  // Only add heading if table has a real title
  if (title && title !== 'Untitled') {
    output += makeHeading(title, level)
  }

  const indent = level >= 3 ? '    ' : ''

  // Calculate column widths based on rows with data
  const colWidths = columns.map(col => {
    const headerLen = col.length
    const maxDataLen = Math.max(
      ...rowsWithData.map(row => ((row[col] || '') as string).length),
      0
    )
    return Math.max(headerLen, maxDataLen, 8)
  })

  // Header row
  output += indent + columns.map((col, i) => col.padEnd(colWidths[i])).join(' | ') + '\n'
  output += indent + colWidths.map(w => '-'.repeat(w)).join('-+-') + '\n'

  // Data rows - only rows with data
  for (const row of rowsWithData) {
    output += indent + columns.map((col, i) =>
      ((row[col] || '') as string).padEnd(colWidths[i])
    ).join(' | ') + '\n'
  }

  output += '\n'
  return output
}

// Format a relationship node as text
function formatRelationshipNode(node: ExportNode, level: number): string {
  const title = getNodeName(node)

  const relData = node.relationshipData
  if (!relData) return ''

  const characters = relData.selectedCharacters || []
  const relationships = relData.relationships || []

  // Skip if no relationships
  if (relationships.length === 0) return ''

  let output = makeHeading(title || 'Relationships', level)

  const indent = level >= 3 ? '    ' : ''

  if (characters.length > 0) {
    output += `${indent}Characters:\n`
    for (const char of characters) {
      output += `${indent}  - ${char.name}\n`
    }
    output += '\n'
  }

  if (relationships.length > 0) {
    output += `${indent}Connections:\n`
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

  // Skip folders with no title
  if (!title) return ''

  // Check if folder has any real content
  const folderContent = formatContent(children, level + 1)
  const nodeContent = node.content

  // Skip if folder has no content and no children content
  if (!folderContent.trim() && isEmptyOrTemplate(nodeContent)) {
    return ''
  }

  let output = makeHeading(title, level)

  const indent = level >= 3 ? '    ' : ''

  // Folder description if any real content
  if (!isEmptyOrTemplate(nodeContent)) {
    output += `${indent}${nodeContent}\n\n`
  }

  // Format all content inside the folder
  output += folderContent

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

  // Events - sorted by age
  const sortedEvents = sortEventsByAge(content.events)
  for (const event of sortedEvents) {
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

  // Text notes - only with real content
  for (const note of content.textNotes) {
    output += formatTextNote(note, level)
  }

  // Tables - only with real content
  for (const table of content.tables) {
    output += formatTable(table, level)
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
    lists: [],
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

  // Story bio/description - only if exists and not template
  if (story.bio && !isEmptyOrTemplate(story.bio)) {
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

    // Filter out any folder that has the same name as the story (to avoid duplicate title)
    // This happens when the main canvas has a folder named after the story
    const storyTitleLower = story.title.toLowerCase().trim()
    filteredContent.folders = filteredContent.folders.filter(f => {
      const folderName = getNodeName(f.node).toLowerCase().trim()
      return folderName !== storyTitleLower
    })

    // Also filter out text notes that just contain the story bio (already shown at top)
    if (story.bio) {
      const bioPart = story.bio.substring(0, 50).toLowerCase()
      filteredContent.textNotes = filteredContent.textNotes.filter(n => {
        const content = getNodeContent(n)
        if (!content) return true
        return !content.toLowerCase().includes(bioPart)
      })
    }

    // Format all content starting at level 2
    output += formatContent(filteredContent, 2)
  }

  return output
}
