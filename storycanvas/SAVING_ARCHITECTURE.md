# Saving Architecture Documentation

This document explains how data persistence works in Bibliarch across different contexts: the main canvas, folder nodes, and character nodes.

## Overview

Bibliarch uses a hierarchical canvas system where:
- The **main canvas** (`canvas_type: 'main'`) is the root level
- **Folder nodes** and **character nodes** can have their own linked canvases
- Each canvas is saved separately in the database with a unique `canvas_type` identifier

---

## Main Canvas Saving

### Location
File: `src/app/story/[id]/page.tsx`

### How It Works

**1. Auto-Save Mechanism (HTMLCanvas.tsx:325-331)**
```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (onSave && (nodes.length > 0 || connections.length > 0)) {
      onSave(nodes, connections)
      toast.success('Auto-saved', { duration: 1000 })
    }
  }, 2000)
  // ... cleanup
}, [nodes, connections])
```
- Triggers 2 seconds after any change to nodes or connections
- Shows a brief toast notification
- Saves both nodes and connection data

**2. Save Handler (page.tsx:484-562)**
```typescript
const handleSaveCanvas = useCallback(async (nodes: any[], connections: any[]) => {
  // Uses currentCanvasIdRef to prevent stale closures
  const saveToCanvasId = currentCanvasIdRef.current

  // Check if canvas exists
  const { data: existing } = await supabase
    .from('canvas_data')
    .select('id')
    .eq('story_id', resolvedParams.id)
    .eq('canvas_type', saveToCanvasId)
    .single()

  if (existing) {
    // UPDATE existing canvas
    await supabase.from('canvas_data').update({
      nodes: nodes,
      connections: connections,
      updated_at: new Date().toISOString()
    }).eq('id', existing.id)
  } else {
    // INSERT new canvas
    await supabase.from('canvas_data').insert({
      story_id: resolvedParams.id,
      nodes: nodes,
      connections: connections,
      canvas_type: saveToCanvasId
    })
  }
})
```

**Key Features:**
- Uses `canvas_type: 'main'` for the main canvas
- Checks for existing record before deciding to INSERT or UPDATE
- Uses `currentCanvasIdRef` to prevent stale closure issues
- Updates story's `updated_at` timestamp after save

---

## Folder Node Saving

### How Folders Work

Folders are special nodes that can link to their own canvas. When a user clicks the arrow button (→) on a folder node:

**1. Initial Click - No Linked Canvas (HTMLCanvas.tsx:2939-2954)**
```typescript
if (!node.linkedCanvasId && onNavigateToCanvas) {
  // Create a unique canvas ID
  const linkedCanvasId = `folder-canvas-${node.id}`

  // Update the node with the linkedCanvasId
  const updatedNodes = nodes.map(n =>
    n.id === node.id ? { ...n, linkedCanvasId } : n
  )

  // Save immediately
  if (onSave) {
    onSave(updatedNodes, connections)
  }

  // Navigate to the new canvas
  onNavigateToCanvas(linkedCanvasId, node.text)
}
```

**2. Subsequent Clicks - Has Linked Canvas (HTMLCanvas.tsx:2930-2938)**
```typescript
if (node.linkedCanvasId && onNavigateToCanvas) {
  // Apply folder-specific color palette
  colorContext.setCurrentFolderId(node.id)
  const folderPalette = colorContext.getFolderPalette(node.id)
  if (folderPalette) {
    colorContext.applyPalette(folderPalette)
  }

  // Navigate directly to existing canvas
  onNavigateToCanvas(node.linkedCanvasId, node.text)
}
```

**3. Loading Folder Canvas (page.tsx:166-179)**
```typescript
// Load canvas data using canvas_type
const { data: canvas } = await supabase
  .from('canvas_data')
  .select('*')
  .eq('story_id', resolvedParams.id)
  .eq('canvas_type', currentCanvasId)  // e.g., 'folder-canvas-abc123'
  .order('updated_at', { ascending: false })
  .limit(1)
  .single()
```

**4. Saving Folder Canvas**
- Uses the SAME `handleSaveCanvas` function as the main canvas
- The `canvas_type` is set to the folder's `linkedCanvasId` (e.g., `folder-canvas-abc123`)
- Auto-saves work identically to the main canvas

**Special Features:**
- First navigation creates the `linkedCanvasId` and saves it to the node
- Folders maintain their own color palette context
- Template application for specific folder types (characters-folder, plot-folder, world-folder, etc.)

---

## Character Node Saving

### How Character Nodes Work

Character nodes work similarly to folder nodes but use the pattern `character-canvas-{nodeId}`:

**1. Initial Click - No Linked Canvas (HTMLCanvas.tsx:2309-2322)**
```typescript
if (!node.linkedCanvasId && onNavigateToCanvas) {
  // Create unique canvas ID for character
  const linkedCanvasId = `character-canvas-${node.id}`

  // Update node with linkedCanvasId
  const updatedNodes = nodes.map(n =>
    n.id === node.id ? { ...n, linkedCanvasId } : n
  )

  // Save immediately (non-blocking)
  if (onSave) {
    onSave(updatedNodes, connections)
  }

  // Navigate to character canvas
  onNavigateToCanvas(linkedCanvasId, node.text)
}
```

**2. Subsequent Clicks - Has Linked Canvas (HTMLCanvas.tsx:2307-2308)**
```typescript
if (node.linkedCanvasId && onNavigateToCanvas) {
  onNavigateToCanvas(node.linkedCanvasId, node.text)
}
```

**3. Character Nodes in List Containers (HTMLCanvas.tsx:2670-2703)**
Character nodes inside list containers have additional logic:
- Checks if the parent node has a `linkedCanvasId`
- Creates one if it doesn't exist
- Applies folder color context when navigating

**4. Template Application (page.tsx:234-263)**
When a character canvas is first created and empty:
```typescript
if (currentCanvasId.includes('character-') && subCanvasTemplates.character) {
  // Apply character template with unique IDs
  const timestamp = Date.now()
  const templateData = {
    nodes: subCanvasTemplates.character.nodes.map(node => ({
      ...node,
      id: `${node.id}-${timestamp}`
    })),
    connections: // ... mapped connections
  }

  // Save template immediately
  handleSaveCanvas(templateData.nodes, templateData.connections)
}
```

---

## Key Differences Summary

| Aspect | Main Canvas | Folder Nodes | Character Nodes |
|--------|------------|--------------|-----------------|
| **canvas_type** | `'main'` | `folder-canvas-{nodeId}` | `character-canvas-{nodeId}` |
| **First Save Trigger** | On node/connection change | When arrow button first clicked | When arrow button first clicked |
| **linkedCanvasId Storage** | N/A | Stored in folder node | Stored in character node |
| **Auto-save** | ✅ Every 2 seconds | ✅ Every 2 seconds | ✅ Every 2 seconds |
| **Template Application** | On story creation | On first canvas load (if type matches) | On first canvas load |
| **Color Palette** | Default/selected | Folder-specific | Inherited from parent |
| **Navigation Save** | N/A | Saves before navigation | Saves before navigation |

---

## Important Implementation Details

### 1. Preventing Data Mixing (page.tsx:67-73)
```typescript
useEffect(() => {
  // CRITICAL: Clear canvas data when changing canvases
  setCanvasData({ nodes: [], connections: [] })
  latestCanvasData.current = { nodes: [], connections: [] }
  currentCanvasIdRef.current = currentCanvasId

  loadStory()
}, [resolvedParams.id, currentCanvasId])
```

### 2. Save Before Navigation (page.tsx:593-596)
```typescript
// SAVE CURRENT CANVAS FIRST!
if (latestCanvasData.current.nodes.length > 0 || latestCanvasData.current.connections.length > 0) {
  await handleSaveCanvas(latestCanvasData.current.nodes, latestCanvasData.current.connections)
}
```

### 3. Ref-Based Canvas ID (page.tsx:485)
```typescript
// Uses ref to prevent stale closures in async callbacks
const saveToCanvasId = currentCanvasIdRef.current
```

---

## Database Schema

All canvas data is stored in the `canvas_data` table:

```sql
canvas_data (
  id: uuid (primary key)
  story_id: uuid (foreign key to stories)
  canvas_type: text (e.g., 'main', 'folder-canvas-123', 'character-canvas-456')
  nodes: jsonb (array of node objects)
  connections: jsonb (array of connection objects)
  created_at: timestamp
  updated_at: timestamp
)
```

**Unique Constraint:** `(story_id, canvas_type)` - ensures one record per canvas type per story

---

## Common Patterns

### Creating a Linked Canvas
1. Generate unique ID: `{type}-canvas-${nodeId}`
2. Update node with `linkedCanvasId`
3. Save node updates immediately (non-blocking)
4. Navigate to new canvas
5. Template applied on first load if applicable

### Loading a Canvas
1. Query by `story_id` and `canvas_type`
2. If not found and it's a templated type, apply template
3. Set canvas data and render
4. Start auto-save timer

### Switching Canvases
1. Save current canvas data
2. Clear canvas data to prevent mixing
3. Update `currentCanvasId`
4. Load new canvas data
5. Apply appropriate color palette