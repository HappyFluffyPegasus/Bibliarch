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
**Status:** PENDING

**User Report:**
> "When I move a folder node it thinks I'm trying to put the folder inside of one of the contents of the folder. Make this no longer happen anymore."

**Analysis:**
When dragging a folder node, the collision detection incorrectly thinks the folder should be dropped into its own children.

**Fix Needed:**
- Add parent-child relationship check in drop detection
- Prevent a node from being dropped into its own descendants

---

## Priority #3: Mouse Panning Bug
**Status:** PENDING

**User Report:**
> "When using an actual mouse I can't pan around the canvas. Make a differentiation between actual mouse and trackpad."

**Analysis:**
Panning works with trackpad but not with external mouse. Need to detect input device type.

**Fix Needed:**
- Investigate mouse vs trackpad event differences
- Add middle-click drag for mouse panning, or
- Add keyboard modifier (Space + drag) for panning

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
