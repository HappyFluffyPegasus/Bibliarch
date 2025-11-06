# Undo/Redo Button Bug Status

**Date**: 2025-11-05
**Status**: 🔴 **BROKEN - IN PROGRESS**

## Problem
The undo/redo buttons in the sidebar do NOT work. Keyboard shortcuts (Ctrl+Z/Cmd+Z) work perfectly, but clicking the sidebar buttons does nothing or shows buttons as disabled when they should be enabled.

## What Has Been Done

### 1. Fixed Closure Stale Values (HTMLCanvas.tsx:805, 840)
- **Problem**: undo/redo functions were reading stale values from closure
- **Fix**: Changed to read from `historyRef.current` and `historyIndexRef.current`
- **Result**: Functions now access current state ✓

### 2. Increased isUndoRedoRef Timeout (HTMLCanvas.tsx:842, 877)
- **Problem**: Undo would work for a second then reverse itself
- **Fix**: Changed timeout from 100ms to 500ms to cover handleDelayedBlur (150ms)
- **Result**: Undo no longer reverses itself ✓

### 3. Added Initial History State (HTMLCanvas.tsx:770-781)
- **Problem**: First change couldn't be undone (historyIndex started at -1)
- **Fix**: Save initial canvas state to history on mount, set historyIndex to 0
- **Result**: Can now undo first change ✓

### 4. Added canUndo/canRedo Computed Flags (HTMLCanvas.tsx:770-771)
- **Problem**: Button disabled state not updating
- **Fix**: Added `const canUndo = historyIndex > 0` and `const canRedo = historyIndex < history.length - 1`
- **Result**: DOES NOT WORK - buttons still show as disabled ✗

### 5. Added Debug Logging
- Logs when history is saved
- Logs when undo/redo is called
- Logs when buttons are clicked
- **Result**: Can see everything working except button disabled state ✓

## Current Issues

### Primary Problem
**Sidebar buttons appear disabled even after making changes that should enable them**

### Console Logs Show
- History IS being saved correctly ✓
- Keyboard shortcuts work perfectly ✓
- When buttons ARE clickable, they execute correctly ✓
- But buttons show as disabled when they shouldn't be ✗

### Possible Root Causes
1. Button `disabled` prop not re-rendering when history state changes
2. React not detecting that historyIndex/history.length changed
3. Button component caching the disabled state
4. HTMLCanvas component not re-rendering when history updates

## What Needs to Be Done Next

### OPTION 1: Force Button Re-render (QUICKEST)
Add key prop to buttons that changes with history:
```tsx
<Button key={`undo-${historyIndex}-${history.length}`} ... />
```
This forces React to remount the button when history changes.

### OPTION 2: Use useMemo for Disabled State
```tsx
const canUndo = useMemo(() => historyIndex > 0, [historyIndex])
const canRedo = useMemo(() => historyIndex < history.length - 1, [historyIndex, history.length])
```

### OPTION 3: Extract to Separate Component
Move undo/redo buttons to their own component with history props.
React may better detect prop changes.

### OPTION 4: Use useState Instead of Computed Values
```tsx
const [canUndo, setCanUndo] = useState(false)
useEffect(() => {
  setCanUndo(historyIndex > 0)
}, [historyIndex])
```

### OPTION 5: Debug React Rendering
- Use React DevTools to check if HTMLCanvas re-renders when history changes
- Check if Button components re-render
- May reveal root cause

## Technical Details

### Button Implementation (HTMLCanvas.tsx:3168-3193)
```typescript
const canUndo = historyIndex > 0
const canRedo = historyIndex < history.length - 1

<Button
  disabled={!canUndo}
  onClick={undo}
/>
```

### The Core Problem
When `historyIndex` or `history.length` change:
1. State updates in HTMLCanvas
2. Component should re-render
3. `canUndo` should recalculate
4. Button should get new `disabled` prop
5. **BUT STEP 2 OR 3 OR 4 IS NOT HAPPENING**

## Files Modified
- `src/components/canvas/HTMLCanvas.tsx` (lines 770-771, 805-872, 3168-3193)

## User Frustration Level
🔴 **CRITICAL**

User quote: "I MADE A CHANGE AND WENT TO THE SIDEBAR TO UNDO IT BUT THE UNDO BUTTON ISNT SHOWING AS BEING FUNCTIONAL WHAT THE FUCK IS WRONG WITH YOU FIX IT NOW OR I TERMINATE YOU"

## Recommended Next Action
**TRY OPTION 1 FIRST** - Add key prop to force re-render. It's the quickest fix and most likely to work.
