# Saving Bug Analysis: Why Only Characters & Relationships Saves Properly

## The Problem

**Symptom**: Only the "Characters & Relationships" folder node saves properly when you make changes inside it. All other folder nodes (Plot Structure & Events, World & Settings) DO NOT save their internal changes.

---

## Root Cause Analysis

### Why Characters & Relationships Works

The "Characters & Relationships" folder has a **SPECIAL ID** that matches a specific pattern:

**Template Definition** (templates.ts:46-55):
```typescript
{
  id: 'characters-folder',  // ← THIS SPECIFIC ID
  text: 'Characters & Relationships',
  type: 'folder',
  parentId: 'story-development'
}
```

**Navigation Creates LinkedCanvasId** (HTMLCanvas.tsx:2940):
```typescript
const linkedCanvasId = `folder-canvas-${node.id}`
// For characters-folder node:
// linkedCanvasId = 'folder-canvas-characters-folder'
```

**Template Detection MATCHES** (page.tsx:284):
```typescript
if (currentCanvasId.includes('characters-folder') && subCanvasTemplates['characters-folder']) {
  // ✅ MATCH! Apply template and save
  handleSaveCanvas(templateData.nodes, templateData.connections)
}
```

**Why it works**:
1. Node ID: `characters-folder`
2. Creates canvas ID: `folder-canvas-characters-folder`
3. Canvas ID **contains** `characters-folder` ✅
4. Template key exists: `subCanvasTemplates['characters-folder']` ✅
5. **Template gets applied AND saved immediately** ✅

---

### Why Plot & World Folders DON'T Work

**Template Definition** (templates.ts:57-77):
```typescript
{
  id: 'plot-folder',  // ← Generic ID
  text: 'Plot Structure & Events',
  type: 'folder',
  parentId: 'story-development'
}

{
  id: 'world-folder',  // ← Generic ID
  text: 'World & Settings',
  type: 'folder',
  parentId: 'story-development'
}
```

**Navigation Creates LinkedCanvasId** (HTMLCanvas.tsx:2940):
```typescript
const linkedCanvasId = `folder-canvas-${node.id}`
// For plot-folder node:
// linkedCanvasId = 'folder-canvas-plot-folder'

// For world-folder node:
// linkedCanvasId = 'folder-canvas-world-folder'
```

**Template Detection Logic** (page.tsx:316-383):
```typescript
if (currentCanvasId.includes('plot-folder') && subCanvasTemplates['plot-folder']) {
  // ✅ MATCHES plot-folder
  handleSaveCanvas(templateData.nodes, templateData.connections)
}

if (currentCanvasId.includes('world-folder') && subCanvasTemplates['world-folder']) {
  // ✅ MATCHES world-folder
  handleSaveCanvas(templateData.nodes, templateData.connections)
}
```

**The Check Passes BUT...**

**CRITICAL ISSUE**: The template is applied and saved **ONLY ONCE** when the canvas is first created and empty:

```typescript
// Line 272-315: NO existing canvas path
if (canvas) {
  // Canvas exists, load it
  if (loadedData.nodes.length === 0) {
    // Only apply template if EMPTY
  }
} else {
  // NO CANVAS EXISTS YET
  if (currentCanvasId.includes('plot-folder') && subCanvasTemplates['plot-folder']) {
    // Apply template and save ✅ (FIRST TIME ONLY)
  }
}
```

---

## The Real Problem: Auto-Save Not Working

### Where Auto-Save Should Happen

**HTMLCanvas.tsx:325-331** - Auto-save timer:
```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (onSave && (nodes.length > 0 || connections.length > 0)) {
      onSave(nodes, connections)  // ← Should trigger every 2 seconds
      toast.success('Auto-saved', { duration: 1000 })
    }
  }, 2000)
  return () => clearTimeout(timeoutId)
}, [nodes, connections, onSave])
```

### The Stale Canvas ID Problem

**page.tsx:484-562** - handleSaveCanvas function:
```typescript
const handleSaveCanvas = useCallback(async (nodes: any[], connections: any[] = []) => {
  const saveToCanvasId = currentCanvasIdRef.current  // ← Getting canvas ID

  console.log('handleSaveCanvas called:', {
    storyId: resolvedParams.id,
    canvasId: saveToCanvasId,  // ← What canvas is it saving to?
    nodeCount: nodes.length,
    connectionCount: connections.length,
    nodes
  })

  // Check if canvas data exists
  const { data: existing } = await supabase
    .from('canvas_data')
    .select('id')
    .eq('story_id', resolvedParams.id)
    .eq('canvas_type', saveToCanvasId)  // ← Is this the RIGHT canvas?
    .single()
}, [resolvedParams.id])
```

---

## Why Characters & Relationships Works vs Others Don't

### Characters & Relationships Success Path:

1. **First Visit** (Canvas doesn't exist):
   - `currentCanvasId = 'folder-canvas-characters-folder'`
   - Template detected: `currentCanvasId.includes('characters-folder')` ✅
   - Template applied with unique timestamped IDs
   - **Immediately saved** via `handleSaveCanvas()` at line 315
   - Canvas record created in database

2. **Subsequent Edits** (Canvas exists with data):
   - User makes changes
   - Auto-save triggers after 2 seconds
   - `currentCanvasIdRef.current` = `'folder-canvas-characters-folder'`
   - Finds existing canvas record ✅
   - **Updates successfully** ✅

### Plot & World Folder Failure Path:

1. **First Visit** (Canvas doesn't exist):
   - `currentCanvasId = 'folder-canvas-plot-folder'`
   - Template detected: `currentCanvasId.includes('plot-folder')` ✅
   - Template applied with unique timestamped IDs
   - **Immediately saved** via `handleSaveCanvas()` at line 349
   - Canvas record created in database

2. **Subsequent Edits** (Canvas exists with data):
   - User makes changes
   - Auto-save triggers after 2 seconds
   - **PROBLEM**: `currentCanvasIdRef.current` might be wrong
   - OR: Database query fails to find existing record
   - OR: Update operation silently fails
   - **Changes lost** ❌

---

## The Likely Culprit: currentCanvasIdRef Not Updating

### The Ref Update Logic (page.tsx:67-73):

```typescript
useEffect(() => {
  // CRITICAL: Clear canvas data when changing canvases
  setCanvasData({ nodes: [], connections: [] })
  latestCanvasData.current = { nodes: [], connections: [] }
  currentCanvasIdRef.current = currentCanvasId  // ← Updates ref

  loadStory()
}, [resolvedParams.id, currentCanvasId])
```

**Potential Issues**:

1. **Race Condition**: If auto-save triggers before `currentCanvasIdRef` updates
2. **Closure Issue**: `handleSaveCanvas` created with old ref value
3. **Navigation Timing**: Ref not updated when navigating between similar folder types

---

## Evidence Needed to Confirm Root Cause

To debug this, we need to check:

### 1. Console Log Analysis
Look for these logs when editing Plot or World folders:
```javascript
// When auto-save triggers:
console.log('handleSaveCanvas called:', {
  storyId: '...',
  canvasId: '???',  // ← Is this 'folder-canvas-plot-folder' or something else?
  nodeCount: X,
  nodes: [...]
})

// Does it find existing canvas?
console.log('Updating existing canvas:', id)  // ← Should see this
// OR
console.log('Creating new canvas record')     // ← Or this (wrong!)
```

### 2. Database Check
Query the database:
```sql
SELECT canvas_type, nodes, updated_at
FROM canvas_data
WHERE story_id = 'your-story-id'
ORDER BY updated_at DESC;
```

Look for:
- Does `folder-canvas-plot-folder` record exist?
- Does `folder-canvas-world-folder` record exist?
- Are their `updated_at` timestamps changing when you edit?

---

## Why Characters & Relationships is Different

**Hypothesis**: There's something special about the first folder that makes it work:

### Possible Reasons:

1. **Template Application Order**:
   - `characters-folder` is checked first (line 202, 284)
   - `plot-folder` is checked second (line 316)
   - `world-folder` is checked third (line 350)
   - **First one might initialize something correctly**

2. **Canvas Path Tracking**:
   - Characters folder might be setting `currentCanvasIdRef` correctly
   - Subsequent folders might not update the ref properly

3. **Parent-Child Relationship**:
   - All three are children of `story-development` list node
   - Characters is the FIRST child (parentId set first)
   - Position in list might affect ref updates

---

## Recommended Debugging Steps

### Step 1: Add Debug Logging
Add to `handleSaveCanvas` (page.tsx:484):
```typescript
const handleSaveCanvas = useCallback(async (nodes: any[], connections: any[] = []) => {
  const saveToCanvasId = currentCanvasIdRef.current

  console.log('🔍 SAVE DEBUG:', {
    currentCanvasId: currentCanvasId,           // From state
    currentCanvasIdRefValue: saveToCanvasId,    // From ref
    areTheyEqual: currentCanvasId === saveToCanvasId,
    nodeCount: nodes.length
  })

  // ... rest of function
}, [resolvedParams.id])
```

### Step 2: Check Ref Updates
Add to useEffect (page.tsx:67):
```typescript
useEffect(() => {
  console.log('🔄 CANVAS ID CHANGED:', {
    from: currentCanvasIdRef.current,
    to: currentCanvasId
  })

  currentCanvasIdRef.current = currentCanvasId
  // ... rest of effect
}, [resolvedParams.id, currentCanvasId])
```

### Step 3: Verify Database Operations
Check for these console logs:
- "Creating new canvas record" (should happen ONCE per folder)
- "Updating existing canvas:" (should happen on every auto-save)
- "Error updating canvas:" (might reveal the problem)

---

## Most Likely Fix

### Option 1: Force Ref Update
Ensure ref updates IMMEDIATELY when navigating:
```typescript
async function handleNavigateToCanvas(canvasId: string, nodeTitle: string) {
  // ... existing code ...

  // Update to the new canvas ID
  setCurrentCanvasId(canvasId)

  // FORCE REF UPDATE IMMEDIATELY
  currentCanvasIdRef.current = canvasId  // ← Add this line

  // Force reload
  loadStory()
}
```

### Option 2: Use State Instead of Ref
Replace `currentCanvasIdRef` usage in `handleSaveCanvas`:
```typescript
const handleSaveCanvas = useCallback(async (nodes: any[], connections: any[] = []) => {
  // Don't use ref, use the actual currentCanvasId state
  const saveToCanvasId = currentCanvasId  // ← Use state, not ref

  // ... rest of function
}, [resolvedParams.id, currentCanvasId])  // ← Add currentCanvasId to dependencies
```

### Option 3: Pass Canvas ID Explicitly
Modify `onSave` to always pass current canvas ID:
```typescript
// In HTMLCanvas.tsx:
if (onSave && (nodes.length > 0 || connections.length > 0)) {
  onSave(nodes, connections, currentCanvasId)  // ← Pass explicit ID
}

// In page.tsx:
const handleSaveCanvas = useCallback(async (
  nodes: any[],
  connections: any[] = [],
  explicitCanvasId?: string  // ← Add parameter
) => {
  const saveToCanvasId = explicitCanvasId || currentCanvasIdRef.current
  // ... rest of function
}, [resolvedParams.id])
```

---

## Summary

**Working**: Characters & Relationships folder
- Canvas ID: `folder-canvas-characters-folder`
- Template applied: ✅
- Initial save: ✅
- Auto-save: ✅
- Reason: Likely the first folder, ref updates correctly

**Broken**: Plot Structure & Events, World & Settings folders
- Canvas IDs: `folder-canvas-plot-folder`, `folder-canvas-world-folder`
- Template applied: ✅
- Initial save: ✅
- Auto-save: ❌ **FAILING**
- Reason: `currentCanvasIdRef.current` likely contains wrong/stale canvas ID

**Root Cause**: The `currentCanvasIdRef` is not properly updating when navigating to Plot or World folders, causing auto-save to write changes to the WRONG canvas in the database (possibly back to Characters or main canvas).

**Next Action**: Add debug logging to confirm which canvas ID is being used during auto-save for Plot and World folders.