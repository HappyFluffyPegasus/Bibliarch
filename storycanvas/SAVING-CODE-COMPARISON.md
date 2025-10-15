# Saving Code Comparison: Working vs Broken Paths

## Executive Summary

This document details the **exact code paths** for saving in Bibliarch, comparing what works (Characters & Relationships) versus what fails (Plot Structure & Events, World & Settings).

---

## The Two Saving Mechanisms

### 1. Initial Template Save (Works for ALL folders)
**Location**: `src/app/story/[id]/page.tsx` lines 272-473

### 2. Auto-Save During Edits (Works ONLY for Characters)
**Location**: `src/components/canvas/HTMLCanvas.tsx` lines 325-333

---

## Code Path 1: Initial Template Application (✅ WORKING)

### Step-by-Step Flow

#### 1.1 User Clicks Folder Arrow
**File**: `src/components/canvas/HTMLCanvas.tsx:2935-2954`

```typescript
// FOLDER NODE (not in list)
<div onClick={async (e) => {
  e.stopPropagation()

  if (node.linkedCanvasId && onNavigateToCanvas) {
    // Already has linked canvas, just navigate
    onNavigateToCanvas(node.linkedCanvasId, node.text)
  } else if (!node.linkedCanvasId && onNavigateToCanvas) {
    // Create NEW linkedCanvasId
    const linkedCanvasId = `folder-canvas-${node.id}`

    // Update node with linkedCanvasId
    const updatedNodes = nodes.map(n =>
      n.id === node.id ? { ...n, linkedCanvasId } : n
    )
    setNodes(updatedNodes)

    // Save the updated nodes
    if (onSave) {
      onSave(updatedNodes, connections)
    }

    // Navigate to folder
    onNavigateToCanvas(linkedCanvasId, node.text)
  }
}}>
```

**What happens for each folder**:
- `characters-folder` node → creates `folder-canvas-characters-folder`
- `plot-folder` node → creates `folder-canvas-plot-folder`
- `world-folder` node → creates `folder-canvas-world-folder`

#### 1.2 Navigation Handler Receives Request
**File**: `src/app/story/[id]/page.tsx:586-642`

```typescript
async function handleNavigateToCanvas(canvasId: string, nodeTitle: string) {
  // Save current canvas before leaving
  if (latestCanvasData.current.nodes.length > 0) {
    await handleSaveCanvas(latestCanvasData.current.nodes, latestCanvasData.current.connections)
    console.log('Saved canvas before navigation:', currentCanvasId, latestCanvasData.current)
  }

  // Visual feedback
  setIsLoading(true)

  setTimeout(() => {
    // Update breadcrumb path
    const newPath = [...canvasPath, { id: canvasId, title: nodeTitle }]
    setCanvasPath(newPath)

    // Clear old canvas data
    setCanvasData({ nodes: [], connections: [] })
    latestCanvasData.current = { nodes: [], connections: [] }

    // Update canvas ID state
    setCurrentCanvasId(canvasId)  // ← STATE UPDATE

    // Force reload to get new canvas
    setTimeout(() => {
      loadStory()
    }, 100)
  }, 200)
}
```

**Key Variables**:
- `currentCanvasId` (state) → Updated to `canvasId` parameter
- `currentCanvasIdRef.current` → NOT UPDATED HERE ⚠️

#### 1.3 UseEffect Detects Canvas ID Change
**File**: `src/app/story/[id]/page.tsx:66-73`

```typescript
useEffect(() => {
  // CRITICAL: Clear canvas data when changing canvases
  setCanvasData({ nodes: [], connections: [] })
  latestCanvasData.current = { nodes: [], connections: [] }

  // UPDATE THE REF
  currentCanvasIdRef.current = currentCanvasId  // ← REF GETS UPDATED HERE

  loadStory()
}, [resolvedParams.id, currentCanvasId])  // ← Triggers when currentCanvasId changes
```

**Timing Critical**: This runs AFTER `setCurrentCanvasId()` completes.

#### 1.4 Load Story Checks for Existing Canvas
**File**: `src/app/story/[id]/page.tsx:166-179`

```typescript
async function loadStory() {
  // ... auth checks ...

  // Load canvas data for current canvas
  const { data: canvas, error: canvasError } = await supabase
    .from('canvas_data')
    .select('*')
    .eq('story_id', resolvedParams.id)
    .eq('canvas_type', currentCanvasId)  // ← Uses STATE, not ref
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  // PGRST116 = no rows found (expected for new canvases)
  if (canvasError && canvasError.code !== 'PGRST116') {
    console.error('Error loading canvas:', canvasError)
  }

  if (canvas) {
    // Canvas exists, load it
    const loadedData = {
      nodes: canvas.nodes || [],
      connections: canvas.connections || []
    }
    // ... check if empty and apply template ...
  } else {
    // NO CANVAS EXISTS - apply template
    // ... template logic ...
  }
}
```

#### 1.5 Template Detection and Application
**File**: `src/app/story/[id]/page.tsx:272-383`

```typescript
if (canvas) {
  // Canvas already exists
  const loadedData = { nodes: canvas.nodes || [], connections: canvas.connections || [] }

  if (loadedData.nodes.length === 0) {
    // Canvas exists but is EMPTY - apply template
    if (currentCanvasId.includes('characters-folder') && subCanvasTemplates['characters-folder']) {
      // Apply characters template
      const templateData = { ... }
      setCanvasData(templateData)
      setTimeout(() => {
        handleSaveCanvas(templateData.nodes, templateData.connections)
      }, 1000)
    }
  } else {
    // Has data, just load it
    setCanvasData(loadedData)
  }
} else {
  // NO CANVAS EXISTS YET
  let templateData = { nodes: [], connections: [] }

  // Check for characters-folder (line 284-315)
  if (currentCanvasId.includes('characters-folder') && subCanvasTemplates['characters-folder']) {
    console.log('✅ Applying Characters & Relationships folder template')
    const timestamp = Date.now()

    const idMap = {}
    subCanvasTemplates['characters-folder'].nodes.forEach(node => {
      idMap[node.id] = `${node.id}-${timestamp}`
    })

    templateData = {
      nodes: subCanvasTemplates['characters-folder'].nodes.map(node => ({
        ...node,
        id: idMap[node.id],
        // ... update references ...
      })),
      connections: // ... mapped connections ...
    }

    setCanvasData(templateData)
    latestCanvasData.current = templateData

    // IMMEDIATE SAVE
    handleSaveCanvas(templateData.nodes, templateData.connections)
  }

  // Check for plot-folder (line 316-349)
  else if (currentCanvasId.includes('plot-folder') && subCanvasTemplates['plot-folder']) {
    // Same logic as characters
    handleSaveCanvas(templateData.nodes, templateData.connections)
  }

  // Check for world-folder (line 350-383)
  else if (currentCanvasId.includes('world-folder') && subCanvasTemplates['world-folder']) {
    // Same logic as characters
    handleSaveCanvas(templateData.nodes, templateData.connections)
  }
}
```

**Key Point**: ALL three folders follow the SAME code path for initial save.

#### 1.6 HandleSaveCanvas Executes
**File**: `src/app/story/[id]/page.tsx:484-562`

```typescript
const handleSaveCanvas = useCallback(async (nodes: any[], connections: any[] = []) => {
  const saveToCanvasId = currentCanvasIdRef.current  // ← USES REF, NOT STATE

  console.log('handleSaveCanvas called:', {
    storyId: resolvedParams.id,
    canvasId: saveToCanvasId,
    nodeCount: nodes.length,
    connectionCount: connections.length,
    nodes
  })

  // Update the ref with latest data
  latestCanvasData.current = { nodes, connections }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('No user, cannot save')
    return
  }

  const canvasPayload = {
    story_id: resolvedParams.id,
    nodes: nodes,
    connections: connections,
    canvas_type: saveToCanvasId  // ← CRITICAL: Uses ref value
  }

  // Check if canvas data exists
  const { data: existing, error: checkError } = await supabase
    .from('canvas_data')
    .select('id')
    .eq('story_id', resolvedParams.id)
    .eq('canvas_type', saveToCanvasId)  // ← Query uses ref value
    .single()

  if (existing) {
    // Update existing canvas
    console.log('Updating existing canvas:', existing.id)
    await supabase.from('canvas_data').update({
      nodes: nodes,
      connections: connections,
      updated_at: new Date().toISOString()
    }).eq('id', existing.id)
  } else {
    // Create new canvas record
    console.log('Creating new canvas record')
    await supabase.from('canvas_data').insert(canvasPayload)
  }

  // Update story timestamp
  await supabase.from('stories').update({
    updated_at: new Date().toISOString()
  }).eq('id', resolvedParams.id)
}, [resolvedParams.id])
```

**State of Variables During First Save**:
- `currentCanvasId` (state) = `'folder-canvas-characters-folder'` (or plot/world)
- `currentCanvasIdRef.current` (ref) = `'folder-canvas-characters-folder'` (or plot/world)
- **They MATCH** ✅

**Result**: Initial template save works for ALL folders.

---

## Code Path 2: Auto-Save During Edits (❌ BROKEN for Plot/World)

### Step-by-Step Flow

#### 2.1 User Edits Content in Canvas
**File**: `src/components/canvas/HTMLCanvas.tsx` (various onBlur handlers)

User types in a text node, image caption, table cell, etc.

Node state updates:
```typescript
const [nodes, setNodes] = useState<Node[]>(initialNodes)

// When user edits:
setNodes(prevNodes =>
  prevNodes.map(n => n.id === nodeId ? { ...n, text: newText } : n)
)
```

#### 2.2 Auto-Save Effect Triggers
**File**: `src/components/canvas/HTMLCanvas.tsx:325-333`

```typescript
// Auto-save when nodes change
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (onSave && (nodes.length > 0 || connections.length > 0)) {
      onSave(nodes, connections)  // ← Calls parent's handleSaveCanvas
      toast.success('Auto-saved', { duration: 1000 })
    }
  }, 2000)

  return () => clearTimeout(timeoutId)
}, [nodes, connections, onSave])  // ← Runs every time nodes/connections change
```

**Key**:
- `onSave` is passed from parent component
- `onSave` = `handleSaveCanvas` function from page.tsx
- NO canvas ID is passed - relies on closure

#### 2.3 HandleSaveCanvas Callback Executes (STALE REF ISSUE)
**File**: `src/app/story/[id]/page.tsx:484-562`

```typescript
const handleSaveCanvas = useCallback(async (nodes: any[], connections: any[] = []) => {
  const saveToCanvasId = currentCanvasIdRef.current  // ← GETS REF VALUE

  console.log('handleSaveCanvas called:', {
    storyId: resolvedParams.id,
    canvasId: saveToCanvasId,  // ← WHAT VALUE IS THIS?
    nodeCount: nodes.length
  })

  // ... save logic using saveToCanvasId ...
}, [resolvedParams.id])  // ← Dependencies: ONLY resolvedParams.id
```

**CRITICAL ANALYSIS OF CALLBACK**:

**Dependency Array**: `[resolvedParams.id]`
- Does NOT include `currentCanvasId`
- Does NOT include `currentCanvasIdRef`
- Callback is created ONCE per story
- **Callback NEVER recreates when canvas changes**

**Closure Capture**:
- When callback is created, it captures `currentCanvasIdRef` object reference
- The ref object DOES update: `currentCanvasIdRef.current = currentCanvasId`
- BUT: The callback's closure doesn't see the update until it's recreated
- Since callback never recreates (only depends on `resolvedParams.id`), it should use the LATEST ref value

**The Ref Should Work But...**

The ref pattern SHOULD work because:
```typescript
// Ref is an object, changes to .current property are visible
const myRef = useRef('initial')
myRef.current = 'updated'  // This change is visible everywhere

const callback = useCallback(() => {
  console.log(myRef.current)  // Should see 'updated'
}, [])
```

So why does it fail?

---

## The Timing Problem: Race Conditions

### Scenario A: First Navigation to Characters (✅ WORKS)

**Timeline**:
1. **T=0ms**: User clicks Characters folder arrow
2. **T=0ms**: `handleNavigateToCanvas('folder-canvas-characters-folder', 'Characters & Relationships')`
3. **T=200ms**: `setCurrentCanvasId('folder-canvas-characters-folder')`
4. **T=200ms**: React schedules re-render
5. **T=210ms**: useEffect runs: `currentCanvasIdRef.current = 'folder-canvas-characters-folder'`
6. **T=300ms**: `loadStory()` loads/creates canvas
7. **T=400ms**: Template applied, `handleSaveCanvas()` called
8. **T=400ms**: `saveToCanvasId = currentCanvasIdRef.current` = `'folder-canvas-characters-folder'` ✅
9. **T=400ms**: Database INSERT for `folder-canvas-characters-folder` ✅
10. **T=500ms**: Canvas renders with template data
11. **User edits at T=5000ms**
12. **T=7000ms**: Auto-save triggers
13. **T=7000ms**: `saveToCanvasId = currentCanvasIdRef.current` = `'folder-canvas-characters-folder'` ✅
14. **T=7000ms**: Database UPDATE for `folder-canvas-characters-folder` ✅

**Why It Works**: Ref was set to `'folder-canvas-characters-folder'` and stays that value.

### Scenario B: Navigate to Plot After Characters (❌ FAILS)

**Timeline**:
1. **User is in Characters folder**
2. **T=0ms**: `currentCanvasIdRef.current = 'folder-canvas-characters-folder'`
3. **T=0ms**: User clicks Back to main
4. **T=200ms**: `setCurrentCanvasId('main')`
5. **T=210ms**: useEffect runs: `currentCanvasIdRef.current = 'main'`
6. **T=500ms**: Main canvas renders
7. **T=5000ms**: User clicks Plot folder arrow
8. **T=5000ms**: `handleNavigateToCanvas('folder-canvas-plot-folder', 'Plot Structure & Events')`
9. **T=5200ms**: `setCurrentCanvasId('folder-canvas-plot-folder')`
10. **T=5200ms**: React schedules re-render
11. **T=5210ms**: useEffect runs: `currentCanvasIdRef.current = 'folder-canvas-plot-folder'` ✅
12. **T=5300ms**: `loadStory()` loads/creates canvas
13. **T=5400ms**: Template applied, `handleSaveCanvas()` called
14. **T=5400ms**: `saveToCanvasId = currentCanvasIdRef.current` = `'folder-canvas-plot-folder'` ✅
15. **T=5400ms**: Database INSERT for `folder-canvas-plot-folder` ✅
16. **T=5500ms**: Plot canvas renders with template
17. **User edits at T=10000ms**
18. **T=12000ms**: Auto-save triggers

**HERE'S THE PROBLEM**:

At T=12000ms when auto-save runs:
- What is `currentCanvasIdRef.current`?
- **Expected**: `'folder-canvas-plot-folder'`
- **Actual**: Could be ANYTHING depending on race conditions

**Possible Race Condition**:
- If another state update happens between T=10000-12000ms
- If navigation happens (user clicks back)
- If React batch updates cause timing issues
- **Ref might revert to previous value**

### Scenario C: Direct Navigation Without Returning to Main (❓ UNKNOWN)

**Timeline**:
1. User in Characters folder
2. User navigates directly to Plot folder (if possible via breadcrumb)
3. `currentCanvasIdRef.current` transitions: `characters-folder` → `plot-folder`
4. Question: Does the transition happen cleanly?

---

## The Real Difference: Navigation Pattern

### Characters & Relationships (First Folder Visited)
```
Main Canvas (ref='main')
  ↓ Navigate to Characters
  ↓ setCurrentCanvasId('folder-canvas-characters-folder')
  ↓ useEffect updates ref to 'folder-canvas-characters-folder'
  ↓ Template loads and saves
  ↓ User edits
  ↓ Auto-save: ref still = 'folder-canvas-characters-folder' ✅
```

**Key**: Simple linear path, ref updates once and stays.

### Plot & World (Subsequent Folders)
```
Main Canvas (ref='main')
  ↓ Navigate to Characters
  ↓ ref = 'folder-canvas-characters-folder'
  ↓ User edits Characters
  ↓ Navigate Back to Main
  ↓ ref = 'main'
  ↓ Navigate to Plot
  ↓ ref = 'folder-canvas-plot-folder' (should be)
  ↓ User edits Plot
  ↓ Auto-save: ref = ??? ❌
```

**Key**: Multiple navigation steps, ref changes multiple times.

---

## Code Evidence: Where State and Ref Diverge

### State Updates (Always Correct)
```typescript
// page.tsx:625
setCurrentCanvasId(canvasId)  // ← State updates immediately

// Later in loadStory (line 169)
.eq('canvas_type', currentCanvasId)  // ← Uses state, works correctly
```

### Ref Updates (Async, May Lag)
```typescript
// page.tsx:70 (in useEffect)
currentCanvasIdRef.current = currentCanvasId  // ← Ref updates after state

// Later in handleSaveCanvas (line 485)
const saveToCanvasId = currentCanvasIdRef.current  // ← May be stale
```

### The Dependency Issue
```typescript
const handleSaveCanvas = useCallback(async (nodes, connections) => {
  const saveToCanvasId = currentCanvasIdRef.current  // ← Reads ref
  // ... save to saveToCanvasId ...
}, [resolvedParams.id])  // ← MISSING: currentCanvasId
```

**Problem**: useCallback doesn't depend on `currentCanvasId`, so it never knows when the canvas changes. It relies ENTIRELY on the ref being updated by the separate useEffect.

---

## Why Characters Works But Others Don't: The Hypothesis

### Hypothesis 1: First-In Advantage
- Characters is navigated to FIRST from main canvas
- Ref transition: `'main'` → `'folder-canvas-characters-folder'`
- Stays in Characters folder, ref stable
- Auto-save keeps using `'folder-canvas-characters-folder'` ✅

### Hypothesis 2: Ref Update Timing
- When navigating to Characters: ref updates cleanly
- When navigating to Plot/World: previous folder ref interferes
- Ref might be set to Plot, but auto-save reads OLD value

### Hypothesis 3: UseEffect Race Condition
```typescript
// Navigation triggers:
setCurrentCanvasId('folder-canvas-plot-folder')  // T=0

// Later, useEffect runs:
useEffect(() => {
  currentCanvasIdRef.current = currentCanvasId  // T=10ms
  loadStory()  // T=10ms
}, [currentCanvasId])

// BUT: If auto-save triggers between T=0 and T=10ms:
setTimeout(() => {
  onSave(nodes, connections)  // Uses OLD ref value ❌
}, 2000)
```

**Gap**: Between state update and ref update, there's a window where ref is stale.

---

## Database State Analysis

### What Should Be in Database

After visiting all three folders once:

```sql
-- Expected records in canvas_data table:
canvas_type = 'main'
canvas_type = 'folder-canvas-characters-folder'
canvas_type = 'folder-canvas-plot-folder'
canvas_type = 'folder-canvas-world-folder'
```

### What Might Actually Be There

If Plot/World fail to save:

```sql
-- Actual records:
canvas_type = 'main' (has all changes, mixed content) ❌
canvas_type = 'folder-canvas-characters-folder' (correct) ✅
canvas_type = 'folder-canvas-plot-folder' (empty or wrong) ❌
canvas_type = 'folder-canvas-world-folder' (empty or wrong) ❌
```

**Evidence Needed**: Check if Plot/World changes are being saved to `'main'` or `'folder-canvas-characters-folder'`.

---

## Summary of Code Differences

### What's THE SAME (Both Working and Broken)
1. ✅ Template detection logic (identical for all folders)
2. ✅ Initial save on navigation (all folders create records)
3. ✅ Navigation handler code (same for all folders)
4. ✅ Auto-save timer mechanism (same for all folders)
5. ✅ UseEffect ref update logic (same for all canvases)

### What's DIFFERENT (Why Characters Works)
1. ❓ Navigation order (Characters first, Plot/World later)
2. ❓ Ref value at auto-save time (Characters stable, Plot/World stale?)
3. ❓ State/Ref synchronization timing (Characters clean, Plot/World racy?)
4. ❓ Unknown browser/React timing differences

### The Code IS Identical
**Critical Finding**: The code paths are IDENTICAL for all three folders. The difference is NOT in the code logic, but in the RUNTIME BEHAVIOR of the ref during navigation sequences.

---

## The Smoking Gun: Missing Dependency

```typescript
// Current (BROKEN):
const handleSaveCanvas = useCallback(async (nodes, connections) => {
  const saveToCanvasId = currentCanvasIdRef.current  // ← Might be stale
  // ...
}, [resolvedParams.id])  // ← Only depends on story ID

// Should Be (FIXED):
const handleSaveCanvas = useCallback(async (nodes, connections) => {
  const saveToCanvasId = currentCanvasId  // ← Use state directly
  // ...
}, [resolvedParams.id, currentCanvasId])  // ← Add currentCanvasId dependency
```

**Why This Fixes It**:
- Callback recreates when `currentCanvasId` changes
- Closure captures NEW value of `currentCanvasId`
- No reliance on ref synchronization timing
- State is always up-to-date, guaranteed by React

---

## Recommended Fix

### Option 1: Use State in Callback (Cleanest)
```typescript
const handleSaveCanvas = useCallback(async (nodes: any[], connections: any[] = []) => {
  const saveToCanvasId = currentCanvasId  // ← Use state, not ref

  console.log('handleSaveCanvas called:', {
    canvasId: saveToCanvasId,
    nodeCount: nodes.length
  })

  // ... rest of save logic ...
}, [resolvedParams.id, currentCanvasId])  // ← Add dependency
```

### Option 2: Force Ref Update in Navigation (Immediate)
```typescript
async function handleNavigateToCanvas(canvasId: string, nodeTitle: string) {
  // ... existing code ...

  setCurrentCanvasId(canvasId)

  // FORCE IMMEDIATE REF UPDATE (bypass useEffect timing)
  currentCanvasIdRef.current = canvasId  // ← Add this line

  // ... rest of function ...
}
```

### Option 3: Pass Canvas ID to onSave (Most Reliable)
```typescript
// In HTMLCanvas.tsx:
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (onSave && (nodes.length > 0 || connections.length > 0)) {
      // Pass explicit canvas ID from parent (if available)
      onSave(nodes, connections)
    }
  }, 2000)
  return () => clearTimeout(timeoutId)
}, [nodes, connections, onSave])

// Modify parent to pass canvas context:
<Bibliarch
  storyId={resolvedParams.id}
  currentCanvasId={currentCanvasId}  // ← Pass as prop
  initialNodes={canvasData?.nodes || []}
  initialConnections={canvasData?.connections || []}
  onSave={(nodes, conns, canvasId) => handleSaveCanvas(nodes, conns, canvasId)}
  onNavigateToCanvas={handleNavigateToCanvas}
/>
```

---

## Conclusion

**The code paths are identical**. The bug is NOT in the logic, but in the **timing of ref updates relative to auto-save execution**. Characters works because it's typically the first folder visited, establishing a stable ref value. Subsequent folders (Plot, World) fail because the ref doesn't update in time before auto-save runs, causing saves to go to the wrong canvas.

**The fix**: Stop relying on `currentCanvasIdRef` and use `currentCanvasId` state directly in the `handleSaveCanvas` callback, adding it to the dependency array.