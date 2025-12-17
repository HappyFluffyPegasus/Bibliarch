# Master Doc Export - Complete Implementation Plan

## 1. Feature Overview

**Purpose:** One-click export of entire project as a downloadable document for backup/offline access.

**Export Formats:**
- Markdown (.md) - Recommended, preserves formatting
- Plain Text (.txt) - Universal fallback

**Trigger Location:** Toolbar button (download/export icon)

---

## 2. User Flow

```
1. User clicks Export button in toolbar
2. Export dialog opens with options
3. User selects format (MD or TXT) and content options
4. User clicks "Export"
5. System traverses all canvases recursively
6. System captures relationship node screenshots
7. System generates document
8. Browser downloads file: "{StoryTitle}_export_{date}.md"
```

---

## 3. UI Components

### 3a. Toolbar Button

**Location:** Top toolbar, near zoom controls
**Icon:** Download or FileText icon from lucide-react
**Tooltip:** "Export Project"

### 3b. Export Dialog

```
┌─────────────────────────────────────────────┐
│  Export Project                         [X] │
├─────────────────────────────────────────────┤
│                                             │
│  Format                                     │
│  ┌─────────────────────────────────────┐   │
│  │ ● Markdown (.md)  - Recommended     │   │
│  │ ○ Plain Text (.txt)                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Include                                    │
│  ┌─────────────────────────────────────┐   │
│  │ ☑ Characters (with profile pics)    │   │
│  │ ☑ Events                            │   │
│  │ ☑ Locations                         │   │
│  │ ☑ Text notes                        │   │
│  │ ☑ Tables                            │   │
│  │ ☑ Lists                             │   │
│  │ ☑ Images                            │   │
│  │ ☑ Relationship nodes (as images)    │   │
│  │ ☑ Connection lines between nodes    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────┐           ┌──────────────┐    │
│  │ Cancel  │           │   Export     │    │
│  └─────────┘           └──────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 4. File Structure

```
src/
├── lib/
│   └── export/
│       ├── masterDocExport.ts      # Core export logic
│       ├── formatters/
│       │   ├── markdownFormatter.ts  # MD generation
│       │   └── plainTextFormatter.ts # TXT generation
│       ├── nodeProcessors.ts        # Per-node-type handlers
│       └── canvasTraversal.ts       # Recursive canvas loading
│
├── components/
│   └── export/
│       └── ExportDialog.tsx         # Export modal UI
│
└── app/
    └── story/
        └── [id]/
            └── page.tsx             # Add toolbar button + dialog
```

---

## 5. Dependencies

```json
{
  "html2canvas": "^1.4.1"  // For relationship node screenshots
}
```

Install: `npm install html2canvas`

---

## 6. Data Flow

```
┌─────────────────┐
│ User clicks     │
│ Export button   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Open dialog,    │
│ select options  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Fetch story     │
│ metadata        │
│ (title, bio)    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Fetch ALL       │
│ canvas_data for │
│ this story_id   │
│ (single query)  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Build canvas    │
│ tree structure  │
│ (main → nested) │
└────────┬────────┘
         ▼
┌─────────────────┐
│ For each        │
│ relationship    │
│ node: capture   │
│ screenshot      │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Process nodes   │
│ recursively,    │
│ generate output │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Download file   │
└─────────────────┘
```

---

## 7. Node Type Processing

### 7a. Story (Root)

**Markdown:**
```markdown
# {Story Title}

{Story bio/description}

---
```

**Plain Text:**
```
================================
{STORY TITLE}
================================

{Story bio/description}

--------------------------------
```

---

### 7b. Folder

**Markdown:** (heading level based on nesting depth)
```markdown
## {Folder Name}

{Folder description if any}
```

**Plain Text:**
```
>> {FOLDER NAME}

{Folder description if any}
```

Depth mapping:
- Depth 0 (main canvas): ## (H2)
- Depth 1: ### (H3)
- Depth 2: #### (H4)
- Depth 3+: ##### (H5)

---

### 7c. Character

**Markdown:**
```markdown
### {Character Name}

![{Character Name}]({profileImageUrl})

**Role:** {role}

**Description:**
{description}

**Backstory:**
{backstory}

**Relationships:**
- → {OtherCharacter}: {relationship type}
- ↔ {OtherCharacter}: {relationship type}
```

**Plain Text:**
```
--- {CHARACTER NAME} ---
[Profile Image: {filename or URL}]

Role: {role}

Description:
{description}

Backstory:
{backstory}

Relationships:
  -> {OtherCharacter}: {relationship type}
  <-> {OtherCharacter}: {relationship type}
```

---

### 7d. Event

**Markdown:**
```markdown
### {Event Title}

**Date:** {date if set}

{Event description}
```

**Plain Text:**
```
--- {EVENT TITLE} ---
Date: {date if set}

{Event description}
```

---

### 7e. Location

**Markdown:**
```markdown
### {Location Name}

{Location description}
```

**Plain Text:**
```
--- {LOCATION NAME} ---

{Location description}
```

---

### 7f. Text Node

**Markdown:**
```markdown
### {Title}

{Content}
```

**Plain Text:**
```
--- {TITLE} ---

{Content}
```

---

### 7g. Table Node

**Markdown:**
```markdown
### {Table Title}

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| data     | data     | data     |
| data     | data     | data     |
```

**Plain Text:**
```
--- {TABLE TITLE} ---

Column 1     | Column 2     | Column 3
-------------|--------------|-------------
data         | data         | data
data         | data         | data
```

---

### 7h. List Node

**Markdown:**
```markdown
### {List Title}

- Item 1
- Item 2
- Item 3
```

**Plain Text:**
```
--- {LIST TITLE} ---

• Item 1
• Item 2
• Item 3
```

---

### 7i. Image Node

**Markdown:**
```markdown
### {Image Caption/Title}

![{caption}]({imageUrl})
```

**Plain Text:**
```
--- {IMAGE CAPTION/TITLE} ---

[Image: {imageUrl or filename}]
```

---

### 7j. Relationship Node (SPECIAL - Screenshot)

**Process:**
1. Find the relationship node DOM element by ID
2. Use html2canvas to capture as PNG
3. Convert to base64 data URL
4. Embed in document

**Markdown:**
```markdown
### {Relationship Node Title}

![Relationship Map](data:image/png;base64,{screenshotData})

**Characters involved:**
- {Character 1}
- {Character 2}
- {Character 3}

**Connections:**
- {Character 1} ←{type}→ {Character 2}
- {Character 2} ←{type}→ {Character 3}
```

**Plain Text:**
```
--- {RELATIONSHIP NODE TITLE} ---

[Relationship Diagram - See Markdown export for visual]

Characters involved:
• {Character 1}
• {Character 2}
• {Character 3}

Connections:
  {Character 1} <--{type}--> {Character 2}
  {Character 2} <--{type}--> {Character 3}
```

---

### 7k. Line Node

**Skip** - decorative only, no content to export

---

## 8. Connection Lines (Between Nodes)

Append to end of each canvas section:

**Markdown:**
```markdown
---

**Node Connections:**
- {Node A} → {Node B}: {label if any}
- {Node C} ↔ {Node D}: {label if any}
```

**Plain Text:**
```
--------------------------------
Node Connections:
  {Node A} --> {Node B}: {label if any}
  {Node C} <-> {Node D}: {label if any}
```

---

## 9. Recursive Traversal Algorithm

```typescript
async function exportCanvas(
  canvasId: string,
  depth: number,
  allCanvasData: Map<string, CanvasData>,
  options: ExportOptions
): Promise<string> {

  const canvas = allCanvasData.get(canvasId)
  if (!canvas) return ''

  let output = ''

  // Sort nodes by position (top-left to bottom-right)
  const sortedNodes = sortNodesByPosition(canvas.nodes)

  for (const node of sortedNodes) {
    // Skip if type not included in options
    if (!options.include[node.type]) continue

    // Process node based on type
    output += processNode(node, depth, options)

    // If folder or character, recurse into their canvas
    if (node.type === 'folder' || node.type === 'character') {
      const nestedCanvasId = node.type === 'folder'
        ? `folder-${node.id}`
        : `character-${node.id}`

      output += await exportCanvas(
        nestedCanvasId,
        depth + 1,
        allCanvasData,
        options
      )
    }
  }

  // Add connections section if enabled
  if (options.include.connections && canvas.connections.length > 0) {
    output += formatConnections(canvas.connections, canvas.nodes, options)
  }

  return output
}
```

---

## 10. Screenshot Capture (Relationship Nodes)

```typescript
import html2canvas from 'html2canvas'

async function captureRelationshipNode(nodeId: string): Promise<string> {
  // Find the node element in DOM
  const element = document.querySelector(`[data-node-id="${nodeId}"]`)

  if (!element) {
    console.warn(`Relationship node ${nodeId} not found in DOM`)
    return ''
  }

  try {
    const canvas = await html2canvas(element as HTMLElement, {
      backgroundColor: null,
      scale: 2, // Higher quality
      logging: false
    })

    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Failed to capture relationship node:', error)
    return ''
  }
}
```

**Challenge:** Node must be visible in DOM to capture.

**Solution:** Before export, temporarily render all relationship nodes (hidden or in a off-screen container), capture them, then clean up.

---

## 11. Database Query

Single efficient query to get all canvas data:

```typescript
const { data: allCanvases } = await supabase
  .from('canvas_data')
  .select('canvas_type, nodes, connections')
  .eq('story_id', storyId)

// Convert to Map for easy lookup
const canvasMap = new Map(
  allCanvases.map(c => [c.canvas_type, c])
)
```

---

## 12. File Download

```typescript
function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}

// Usage
downloadFile(
  markdownContent,
  `${storyTitle}_export_${date}.md`,
  'text/markdown'
)
```

---

## 13. Export Options Interface

```typescript
interface ExportOptions {
  format: 'markdown' | 'plaintext'
  include: {
    characters: boolean
    events: boolean
    locations: boolean
    textNotes: boolean
    tables: boolean
    lists: boolean
    images: boolean
    relationshipNodes: boolean
    connections: boolean
  }
}
```

---

## 14. Implementation Order

1. **Phase 1:** Core structure
   - Create file structure
   - Install html2canvas
   - Create ExportDialog component
   - Add toolbar button

2. **Phase 2:** Basic export
   - Implement canvasTraversal.ts
   - Implement nodeProcessors.ts (all types except relationship)
   - Implement markdownFormatter.ts
   - Implement plainTextFormatter.ts
   - Test with simple project

3. **Phase 3:** Relationship screenshots
   - Implement screenshot capture
   - Handle DOM visibility challenge
   - Embed in output

4. **Phase 4:** Polish
   - Loading state during export
   - Error handling
   - Progress indicator for large projects

---

## 15. Estimated Output Example

For a project with:
- 3 folders (Characters, Plot, World)
- 5 characters with profile pics
- 10 events
- 3 locations
- 2 relationship nodes
- Various connections

**Markdown output:** ~50-100KB (depending on images)
**Plain text output:** ~10-20KB

---

## 16. Output Example

### Markdown Sample

```markdown
# My Fantasy Novel

A tale of magic and adventure in a world where dragons rule the skies.

---

## Characters & Relationships

### Elena

![Elena](https://storage.supabase.co/...)

**Role:** Protagonist

**Description:**
A young mage discovering her powers in a world that fears magic.

**Backstory:**
Elena grew up in the northern villages, hiding her abilities...

**Relationships:**
- → Marcus: Mentor
- ↔ James: Romantic interest

### Marcus

![Marcus](https://storage.supabase.co/...)

**Role:** Mentor

**Description:**
An aging wizard who sees potential in Elena...

---

## Plot Structure

### Act 1 - The Beginning

#### Inciting Incident

Elena discovers the ancient tome hidden in her grandmother's attic...

#### Meeting Marcus

On the run from the King's hunters, Elena stumbles upon...

---

## Relationship Map

![Relationship Map](data:image/png;base64,iVBORw0KGgo...)

**Characters involved:**
- Elena
- Marcus
- James
- The Dark Lord

**Connections:**
- Elena ←mentor→ Marcus
- Elena ←romantic→ James
- Elena ←enemy→ The Dark Lord

---

**Node Connections:**
- Inciting Incident → Meeting Marcus: leads to
- Meeting Marcus → Training Begins: leads to
```

---

*Document created: January 2025*
*For implementation in Bibliarch/StoryCanvas*
