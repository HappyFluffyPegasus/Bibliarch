# User Bug Reports - Priority Ranked

This document tracks user-reported bugs and their fix status.

---

## Priority #1: Navigation/Data Loss Bug
**Status:** FIXED

**User Report:**
> "Characters & Relationship and Events are broken! When you click on the arrow to go to that tab, it lags and shows the main page (main page like the page will all on buttons) I lost so much progress from this bug, on the Event page we had over 100 characters added and info added in. This bug is making my best-friend & I want to change websites."

**Root Cause:**
Race condition where navigation happened before data was saved:
1. Canvas data wasn't cleared before navigation (showed old data briefly)
2. Arrow click handlers didn't wait for save to complete
3. Cache was too long (30 seconds), serving stale data

**Fixes Applied:**
1. `src/app/story/[id]/page.tsx` - Added `setCanvasData(null)` before `setCurrentCanvasId()` in both `handleNavigateToCanvas` and `handleNavigateBack`
2. `src/components/canvas/HTMLCanvas.tsx` - Changed all 8 navigation arrow handlers from `handleSave(...)` to `await onSave(...)`:
   - Folder node arrow (line ~8862)
   - Location node arrow (line ~6556)
   - Event node arrow (line ~6912)
   - Character node arrow (line ~7679)
   - Child character in list (line ~8257)
   - Child location in list (line ~8382)
   - Child event in list (line ~8491)
   - Child folder in list (line ~8715)
3. `src/lib/hooks/useSupabaseQuery.ts` - Reduced cache time from 30s to 5s

---

## Priority #2: Folder Self-Nesting Bug
**Status:** FIXED

**User Report:**
> "When I move a folder node it thinks I'm trying to put the folder inside of one of the contents of the folder. Make this no longer happen anymore."

**Root Cause:**
When dragging a folder, the collision detection didn't check if the target node was:
1. Visually inside the dragged folder's original bounds
2. A sibling in the same list container

**Fixes Applied:**
1. Added check to skip list containers that were inside the dragged node's original bounds (lines ~1973-1986)
2. Added check to skip folder/character targets that overlapped with the dragged node's original bounds (lines ~2041-2054)
3. Added check to skip sibling nodes in the same list container (lines ~2056-2060)

---

## Priority #3: Mouse Panning Bug
**Status:** FIXED

**User Report:**
> "When using an actual mouse I can't pan around the canvas. Make a differentiation between actual mouse and trackpad."

**Root Cause:**
1. Pan tool didn't work with left-click (only middle/right mouse)
2. In select mode, left-click started selection box instead of panning
3. Mouse wheel detection threshold was too high (50), missing some mice

**Fixes Applied:**
1. Made pan tool work properly with left-click (lines ~1513-1520)
2. Added Space+drag panning - hold Space and drag to pan (common design tool pattern)
3. Added `isSpaceHeld` state to track Space key (lines ~196, 1359-1392)
4. Lowered mouse wheel detection threshold from 50 to 20 (line ~922)
5. Improved scroll multiplier for different deltaMode values (line ~930)
6. Updated help text to explain panning options

---

## Priority #4: Pasted Text Color Bug
**Status:** PENDING

**User Report:**
> "When I copy paste text into the website from outside of it the text is the same color as outside instead of adhering to the color palette system."

**Analysis:**
ContentEditable preserves HTML formatting from clipboard. Need to strip formatting on paste.

**Fix Needed:**
- Add `onPaste` handler to all contentEditable elements
- Strip HTML formatting and paste as plain text
- Or use `e.clipboardData.getData('text/plain')` instead of default paste

---

## Change Log

### January 4, 2026
- Fixed Priority #1: Navigation race condition and data loss bug
  - Cleared canvas data before navigation
  - Made arrow handlers await saves
  - Reduced cache time to 5 seconds
- Fixed Priority #2: Folder self-nesting bug
  - Skip targets that were inside dragged node's original bounds
  - Skip sibling nodes in same list container
- Fixed Priority #3: Mouse panning bug
  - Added Space+drag panning
  - Made pan tool work with left-click
  - Improved mouse wheel detection
