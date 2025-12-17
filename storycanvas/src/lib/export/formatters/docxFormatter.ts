// DOCX formatter for export
// Creates Word documents with proper heading sizes and formatting

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  convertInchesToTwip,
  ShadingType
} from 'docx'

// Type alias for HeadingLevel values
type HeadingLevelType = typeof HeadingLevel[keyof typeof HeadingLevel]

import type { StoryMetadata, CanvasData, ExportOptions, ExportNode } from '../types'
import { sortNodesByPosition, getNestedCanvasId } from '../canvasTraversal'

// Template default content that should be SKIPPED entirely
const TEMPLATE_DEFAULTS = new Set([
  'Write your content here...',
  'Describe what happens in this event...',
  'Upload a map of your world here',
  'Upload a map of your world here →',
  'Upload a map of this country/region (any shape/size) →',
  'Click to add image',
  'Drag and drop an image here',
  'Add your image here',
  'What is their history and past?',
  'Who are they at the start?',
  'Who have they become?',
  'What themes do they represent?',
  'What drives this character?',
  'What are their moral principles?',
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
  'Where does most of your story take place?',
  'What are the rules that govern your story world?',
  'What happened before your story begins?',
  'What other important places appear in your story?',
  'How should your world feel to readers?',
  'What is the main conflict driving your story?',
  'What ethical dilemmas does your story explore?',
  'How do your characters change and learn?',
  'What broader social issues does your story address?',
  'What emotions should readers feel and why?',
  'Jot recurring imagery, symbols, or foreshadowing ideas.',
  'Track how conflict escalates and what\'s at risk.',
  'What subplots or secondary stories run alongside your main plot?',
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

function isEmptyOrTemplate(content: string | undefined): boolean {
  if (!content) return true
  const trimmed = content.trim()
  if (!trimmed) return true
  if (TEMPLATE_DEFAULTS.has(trimmed)) return true
  if (trimmed.startsWith('What ') && trimmed.endsWith('?')) return true
  if (trimmed.startsWith('How ') && trimmed.endsWith('?')) return true
  if (trimmed.startsWith('Who ') && trimmed.endsWith('?')) return true
  if (trimmed.startsWith('Where ') && trimmed.endsWith('?')) return true
  if (trimmed.startsWith('Describe ') && trimmed.endsWith('...')) return true
  if (trimmed.includes('Upload a map')) return true
  return false
}

function getNodeName(node: ExportNode): string {
  if (node.type === 'event' && node.title) {
    return node.title
  }
  return node.text || ''
}

function getNodeContent(node: ExportNode): string | undefined {
  if (node.type === 'event') return node.summary
  if (node.type === 'text' || node.type === 'compact-text') return node.content
  if (node.type === 'location') return node.content || node.description
  return node.content || node.description
}

// Interfaces
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
    characters: [], events: [], locations: [], textNotes: [],
    tables: [], lists: [], images: [], relationshipNodes: [],
    folders: [], allNodes: []
  }
}

function sortEventsByAge(events: EventWithContent[]): EventWithContent[] {
  return [...events].sort((a, b) => {
    const nameA = getNodeName(a.node)
    const nameB = getNodeName(b.node)
    const ageMatchA = nameA.match(/age\s*(\d+)/i)
    const ageMatchB = nameB.match(/age\s*(\d+)/i)
    if (ageMatchA && ageMatchB) return parseInt(ageMatchA[1]) - parseInt(ageMatchB[1])
    if (ageMatchA) return -1
    if (ageMatchB) return 1
    if (a.node.sequenceOrder !== undefined && b.node.sequenceOrder !== undefined) {
      return a.node.sequenceOrder - b.node.sequenceOrder
    }
    return 0
  })
}

function collectCanvasContent(
  canvas: CanvasData,
  allCanvases: Map<string, CanvasData>,
  visited: Set<string>
): CollectedContent {
  const content = createEmptyContent()
  if (visited.has(canvas.canvas_type)) return content
  visited.add(canvas.canvas_type)
  content.allNodes = canvas.nodes || []
  const sortedNodes = sortNodesByPosition(canvas.nodes || [])

  for (const node of sortedNodes) {
    switch (node.type) {
      case 'character': {
        const canvasId = getNestedCanvasId(node)
        let sub = createEmptyContent()
        if (canvasId && allCanvases.has(canvasId)) {
          sub = collectCanvasContent(allCanvases.get(canvasId)!, allCanvases, new Set(visited))
        }
        content.characters.push({ node, subCanvasContent: sub })
        break
      }
      case 'event': {
        const canvasId = getNestedCanvasId(node)
        let sub = createEmptyContent()
        if (canvasId && allCanvases.has(canvasId)) {
          sub = collectCanvasContent(allCanvases.get(canvasId)!, allCanvases, new Set(visited))
        }
        content.events.push({ node, subCanvasContent: sub })
        break
      }
      case 'location': {
        const canvasId = getNestedCanvasId(node)
        let sub = createEmptyContent()
        if (canvasId && allCanvases.has(canvasId)) {
          sub = collectCanvasContent(allCanvases.get(canvasId)!, allCanvases, new Set(visited))
        }
        content.locations.push({ node, subCanvasContent: sub })
        break
      }
      case 'text':
      case 'compact-text':
        content.textNotes.push(node)
        break
      case 'table':
        content.tables.push(node)
        break
      case 'relationship-canvas':
        content.relationshipNodes.push(node)
        break
      case 'folder': {
        const canvasId = getNestedCanvasId(node)
        if (canvasId && allCanvases.has(canvasId)) {
          const nested = collectCanvasContent(allCanvases.get(canvasId)!, allCanvases, new Set(visited))
          content.folders.push({ node, children: nested })
        } else {
          content.folders.push({ node, children: createEmptyContent() })
        }
        break
      }
    }
  }
  return content
}

// Document building helpers
function createHeading(text: string, level: HeadingLevelType): Paragraph {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 }
  })
}

function createBodyText(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text })],
    spacing: { after: 120 }
  })
}

function createLabeledField(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value })
    ],
    spacing: { after: 80 }
  })
}

function createTable(tableData: Record<string, string>[], title?: string): Paragraph[] {
  const paragraphs: Paragraph[] = []

  if (!tableData || tableData.length === 0) return paragraphs

  const columns = Object.keys(tableData[0]).filter(k => k !== 'id' && !k.startsWith('_'))
  if (columns.length === 0) return paragraphs

  // Filter rows with data
  const valueColumn = columns.length >= 2 ? columns[1] : columns[0]
  const rowsWithData = tableData.filter(row => {
    return columns.some((col, idx) => {
      const val = row[col]
      if (!val || !val.trim() || val === '☐' || val === '☑') return false
      if (columns.length === 2 && idx === 0) {
        const valueVal = row[valueColumn]
        return valueVal && valueVal.trim()
      }
      return true
    })
  })

  if (rowsWithData.length === 0) return paragraphs

  if (title) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: title, bold: true })],
      spacing: { before: 160, after: 80 }
    }))
  }

  // Create table
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Header row
      new TableRow({
        children: columns.map(col => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: col, bold: true })]
          })],
          shading: { type: ShadingType.SOLID, color: 'E0E0E0' }
        }))
      }),
      // Data rows
      ...rowsWithData.map(row => new TableRow({
        children: columns.map(col => new TableCell({
          children: [new Paragraph({ text: row[col] || '' })]
        }))
      }))
    ]
  })

  paragraphs.push(new Paragraph({ children: [] })) // spacer
  paragraphs.push(table as unknown as Paragraph) // Type workaround
  paragraphs.push(new Paragraph({ children: [], spacing: { after: 160 } }))

  return paragraphs
}

// Content formatters
function formatCharacter(char: CharacterWithContent, level: HeadingLevelType): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const name = getNodeName(char.node)
  if (!name) return paragraphs

  const sub = char.subCanvasContent
  let hasContent = false

  // Check for content
  const fields: { label: string; value: string }[] = []
  if (char.node.role && !isEmptyOrTemplate(char.node.role)) {
    fields.push({ label: 'Role', value: char.node.role })
  }
  if (char.node.description && !isEmptyOrTemplate(char.node.description)) {
    fields.push({ label: 'Description', value: char.node.description })
  }
  if (char.node.backstory && !isEmptyOrTemplate(char.node.backstory)) {
    fields.push({ label: 'Backstory', value: char.node.backstory })
  }

  for (const note of sub.textNotes) {
    const fieldName = getNodeName(note)
    const fieldContent = getNodeContent(note)
    if (fieldName && !isEmptyOrTemplate(fieldContent)) {
      fields.push({ label: fieldName, value: fieldContent! })
    }
  }

  if (fields.length === 0 && sub.tables.length === 0) return paragraphs

  paragraphs.push(createHeading(name, level))

  for (const field of fields) {
    paragraphs.push(createLabeledField(field.label, field.value))
  }

  for (const table of sub.tables) {
    const tableName = getNodeName(table) || 'Character Info'
    paragraphs.push(...createTable(table.tableData || [], tableName !== 'Untitled' ? tableName : 'Character Info'))
  }

  return paragraphs
}

function formatEvent(event: EventWithContent, level: HeadingLevelType): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const name = getNodeName(event.node)
  if (!name) return paragraphs

  const summary = event.node.summary
  const sub = event.subCanvasContent
  const hasRealSummary = !isEmptyOrTemplate(summary)

  const hasRealSubEvents = sub.events.some(e => !isEmptyOrTemplate(e.node.summary))
  const hasRealTextNotes = sub.textNotes.some(n => !isEmptyOrTemplate(getNodeContent(n)))
  const hasRealTables = sub.tables.length > 0

  if (!hasRealSummary && !hasRealSubEvents && !hasRealTextNotes && !hasRealTables) {
    return paragraphs
  }

  paragraphs.push(createHeading(name, level))

  if (event.node.durationText && event.node.durationText !== 'N/A') {
    paragraphs.push(createLabeledField('Duration', event.node.durationText))
  }

  if (hasRealSummary) {
    paragraphs.push(createBodyText(summary!))
  }

  // Sub-events
  const sortedSubs = sortEventsByAge(sub.events)
  const nextLevel = level === HeadingLevel.HEADING_2 ? HeadingLevel.HEADING_3 :
                    level === HeadingLevel.HEADING_3 ? HeadingLevel.HEADING_4 :
                    HeadingLevel.HEADING_5
  for (const subEvent of sortedSubs) {
    paragraphs.push(...formatEvent(subEvent, nextLevel))
  }

  // Text notes
  for (const note of sub.textNotes) {
    const fieldName = getNodeName(note)
    const fieldContent = getNodeContent(note)
    if (fieldName && !isEmptyOrTemplate(fieldContent)) {
      paragraphs.push(createLabeledField(fieldName, fieldContent!))
    }
  }

  // Tables
  for (const table of sub.tables) {
    paragraphs.push(...createTable(table.tableData || [], getNodeName(table)))
  }

  return paragraphs
}

function formatLocation(loc: LocationWithContent, level: HeadingLevelType): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const name = getNodeName(loc.node)
  if (!name) return paragraphs

  paragraphs.push(createHeading(name, level))

  const content = getNodeContent(loc.node)
  if (!isEmptyOrTemplate(content)) {
    paragraphs.push(createBodyText(content!))
  }

  const sub = loc.subCanvasContent

  for (const note of sub.textNotes) {
    const fieldName = getNodeName(note)
    const fieldContent = getNodeContent(note)
    if (fieldName && !isEmptyOrTemplate(fieldContent)) {
      paragraphs.push(createLabeledField(fieldName, fieldContent!))
    }
  }

  for (const table of sub.tables) {
    paragraphs.push(...createTable(table.tableData || [], getNodeName(table)))
  }

  const nextLevel = level === HeadingLevel.HEADING_2 ? HeadingLevel.HEADING_3 :
                    level === HeadingLevel.HEADING_3 ? HeadingLevel.HEADING_4 :
                    HeadingLevel.HEADING_5

  for (const subLoc of sub.locations) {
    paragraphs.push(...formatLocation(subLoc, nextLevel))
  }

  for (const folder of sub.folders) {
    paragraphs.push(...formatFolder(folder, nextLevel))
  }

  return paragraphs
}

function formatTextNote(node: ExportNode, level: HeadingLevelType): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const title = getNodeName(node)
  const content = getNodeContent(node)

  if (!title || isEmptyOrTemplate(content)) return paragraphs

  paragraphs.push(createHeading(title, level))
  paragraphs.push(createBodyText(content!))

  return paragraphs
}

function formatRelationship(node: ExportNode, level: HeadingLevelType): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const relData = node.relationshipData
  if (!relData) return paragraphs

  const characters = relData.selectedCharacters || []
  const relationships = relData.relationships || []
  if (relationships.length === 0) return paragraphs

  paragraphs.push(createHeading(getNodeName(node) || 'Relationships', level))

  if (characters.length > 0) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: 'Characters:', bold: true })],
      spacing: { before: 80 }
    }))
    for (const char of characters) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: `• ${char.name}` })],
        indent: { left: convertInchesToTwip(0.25) }
      }))
    }
  }

  if (relationships.length > 0) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: 'Connections:', bold: true })],
      spacing: { before: 160 }
    }))
    for (const rel of relationships) {
      const fromChar = characters.find(c => c.id === rel.fromCharacterId)
      const toChar = characters.find(c => c.id === rel.toCharacterId)
      const fromName = fromChar?.name || 'Unknown'
      const toName = toChar?.name || 'Unknown'

      let text = rel.isBidirectional
        ? `${fromName} ↔ ${toName}: ${rel.label}`
        : `${fromName} → ${toName}: ${rel.label}`

      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: `• ${text}` })],
        indent: { left: convertInchesToTwip(0.25) }
      }))
    }
  }

  return paragraphs
}

function formatFolder(folder: FolderWithContent, level: HeadingLevelType): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const title = getNodeName(folder.node)
  if (!title) return paragraphs

  const childParagraphs = formatContent(folder.children, level === HeadingLevel.HEADING_2 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4)
  const nodeContent = folder.node.content

  if (childParagraphs.length === 0 && isEmptyOrTemplate(nodeContent)) {
    return paragraphs
  }

  paragraphs.push(createHeading(title, level))

  if (!isEmptyOrTemplate(nodeContent)) {
    paragraphs.push(createBodyText(nodeContent!))
  }

  paragraphs.push(...childParagraphs)

  return paragraphs
}

function formatContent(content: CollectedContent, level: HeadingLevelType): Paragraph[] {
  const paragraphs: Paragraph[] = []

  const nextLevel = level === HeadingLevel.HEADING_2 ? HeadingLevel.HEADING_3 :
                    level === HeadingLevel.HEADING_3 ? HeadingLevel.HEADING_4 :
                    HeadingLevel.HEADING_5

  for (const char of content.characters) {
    paragraphs.push(...formatCharacter(char, level))
  }

  const sortedEvents = sortEventsByAge(content.events)
  for (const event of sortedEvents) {
    paragraphs.push(...formatEvent(event, level))
  }

  for (const loc of content.locations) {
    paragraphs.push(...formatLocation(loc, level))
  }

  for (const rel of content.relationshipNodes) {
    paragraphs.push(...formatRelationship(rel, level))
  }

  for (const note of content.textNotes) {
    paragraphs.push(...formatTextNote(note, level))
  }

  for (const table of content.tables) {
    paragraphs.push(...createTable(table.tableData || [], getNodeName(table)))
  }

  for (const folder of content.folders) {
    paragraphs.push(...formatFolder(folder, level))
  }

  return paragraphs
}

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

export function formatAsDocx(
  story: StoryMetadata,
  allCanvases: Map<string, CanvasData>,
  options: ExportOptions
): Document {
  const sections: Paragraph[] = []

  // Title - Heading 1
  sections.push(new Paragraph({
    text: story.title,
    heading: HeadingLevel.TITLE,
    spacing: { after: 200 }
  }))

  // Bio/description
  if (story.bio && !isEmptyOrTemplate(story.bio)) {
    sections.push(new Paragraph({
      children: [new TextRun({ text: story.bio, italics: true })],
      spacing: { after: 400 }
    }))
  }

  // Horizontal line
  sections.push(new Paragraph({
    children: [new TextRun({ text: '─'.repeat(60) })],
    spacing: { before: 200, after: 400 }
  }))

  // Collect content
  const mainCanvas = allCanvases.get('main')
  if (mainCanvas) {
    const visited = new Set<string>()
    const content = collectCanvasContent(mainCanvas, allCanvases, visited)
    const filteredContent = filterContentByOptions(content, options)

    // Filter duplicate title folders
    const storyTitleLower = story.title.toLowerCase().trim()
    filteredContent.folders = filteredContent.folders.filter(f => {
      const folderName = getNodeName(f.node).toLowerCase().trim()
      return folderName !== storyTitleLower
    })

    // Format all content at Heading 2 level
    sections.push(...formatContent(filteredContent, HeadingLevel.HEADING_2))
  }

  return new Document({
    sections: [{
      children: sections
    }]
  })
}
