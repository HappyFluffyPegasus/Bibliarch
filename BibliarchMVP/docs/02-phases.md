# Bibliarch MVP - Implementation Phases

## Overview

**Approach**: Sequential - complete each tab fully before moving to the next
**Priority**: All tabs equally important, but built in specific order

---

## Phase 1: Project Setup & Core Structure ✅ COMPLETED

### Tasks
1. ✅ Create `Bibliarch MVP/` folder with Next.js 15 project
2. ✅ Configure Tailwind CSS, TypeScript
3. ✅ Set up folder structure
4. ✅ Create root layout with bottom tab navigation (Gacha-style)
5. ✅ Create Dashboard/Home page (story selection)
6. ✅ Set up Zustand stores (basic structure)
7. ✅ Create placeholder pages for all 5 tabs

### Deliverables
- Working Next.js app with routing
- Dashboard with create/delete story functionality
- Tab navigation between all 5 tabs
- localStorage persistence via Zustand
- Type definitions for all data models

---

## Phase 2: Notes Tab (Copy Bibliarch Canvas) 🔄 NEXT

### Goal
Integrate the full Bibliarch canvas system from the storycanvas project.

### Tasks
1. Copy HTMLCanvas.tsx (10K lines) and all dependencies
2. Copy UI components (button, card, dialog, popover, select, slider, tabs, etc.)
3. Copy providers (color-provider, theme-provider)
4. Copy utilities (color-palette, templates, performance-utils)
5. **Remove timeline node type** from canvas/templates (timeline is separate tab)
6. Update all import paths for new project
7. Create Notes tab page that renders canvas
8. Add master doc upload (.md, .txt, .docx parsing)
9. Implement localStorage persistence for canvas data
10. Test all node types work correctly

### Files to Copy from storycanvas/src/
- `components/canvas/HTMLCanvas.tsx`
- `components/canvas/NodeContextMenu.tsx`
- `components/canvas/ConnectionContextMenu.tsx`
- `components/canvas/SafeStoryCanvas.tsx` (if needed)
- `components/ui/*` (all shadcn components)
- `components/providers/color-provider.tsx`
- `components/providers/theme-provider.tsx`
- `lib/color-palette.ts`
- `lib/performance-utils.ts`
- `lib/templates.ts` (modify to remove timeline)
- `lib/utils.ts`

### Success Criteria
- Canvas renders with all node types (except timeline)
- Can create, edit, delete, move nodes
- Connections work
- Copy/paste works
- Undo/redo works
- Data persists to localStorage
- Master doc upload parses files correctly

---

## Phase 3: Characters Tab (Copy Character Creator)

### Goal
Integrate the 3D character creator from the Character Creator project.

### Tasks
1. Copy Viewer3D.tsx and related components
2. Copy utilities (thumbnailGenerator)
3. Copy model file (Neighbor Base V16.glb) to public/models/
4. Adapt for Next.js (dynamic imports for Three.js)
5. Create Characters tab page with full customization UI
6. Set up character store with localStorage persistence
7. Implement character list management (create, delete, rename)
8. Connect character data to story context

### Files to Copy from Character Creator/character-creator/
- `src/components/Viewer3D.tsx`
- `src/components/ColorWheel.tsx`
- `src/components/TransformControls.tsx`
- `src/components/ItemThumbnail.tsx`
- `src/utils/thumbnailGenerator.ts`
- `public/models/Neighbor Base V16.glb`
- Relevant styles from `src/index.css`

### Success Criteria
- 3D character model renders
- Category tabs work (HAIR, TOPS, etc.)
- Color customization works
- Character list shows all characters for story
- Can create and switch between characters
- Data persists to localStorage

---

## Phase 4: Timeline Tab (NEW)

### Goal
Create a dedicated timeline editor separate from the canvas.

### Tasks
1. Create TimelineEditor component
2. Implement horizontal track layout
3. Create draggable timeline events
4. Implement character state snapshots at each event
5. Add relationship state tracking at each event
6. Add zoom controls
7. Implement scene linking UI (dropdown to link scenes)
8. Support multiple parallel tracks
9. Set up timeline store with localStorage persistence

### Key Components to Create
- `TimelineEditor.tsx` - Main container
- `TimelineTrack.tsx` - Horizontal track with events
- `TimelineEvent.tsx` - Individual event node
- `CharacterStateEditor.tsx` - Edit character state at event
- `RelationshipStateEditor.tsx` - Edit relationships at event

### Success Criteria
- Can create/edit/delete timeline events
- Events can be dragged to reorder
- Multiple tracks for parallel events
- Can edit character states at each event
- Can edit relationship states at each event
- Can link scenes to events
- Zoom in/out works
- Data persists to localStorage

---

## Phase 5: World Tab (NEW - 3D)

### Goal
Create a 3D world/neighborhood builder with terraforming and building placement.

### Tasks
1. Create WorldViewer3D with Three.js scene
2. Implement terrain as a plane (flat to start, vertex displacement later)
3. Create primitive building blocks (cubes, planes as placeholders)
4. Implement placement tools (click to place)
5. Add terrain brush for raising/lowering terrain
6. Create top-down mini-map
7. Implement free camera navigation (orbit controls)
8. Set up world store with localStorage persistence

### Key Components to Create
- `WorldViewer3D.tsx` - Main 3D scene
- `WorldEditor.tsx` - Container with tools
- `TerrainEditor.tsx` - Terrain manipulation
- `BuildingPlacer.tsx` - Place/move buildings
- `Primitives.tsx` - Primitive shape definitions

### Building Types (Primitives for MVP)
- `primitive-cube` - Basic cube building
- `primitive-plane` - Flat surface
- `preset-house` - Simple house shape (multiple cubes)
- `preset-shop` - Simple shop shape

### Decoration Types (Primitives for MVP)
- Tree (cone + cylinder)
- Rock (sphere)
- Bush (small sphere)
- Lamp (cylinder + sphere)

### Success Criteria
- 3D terrain renders
- Can place/move/delete buildings
- Can place decorations
- Terrain brush works (raise/lower)
- Mini-map shows overview
- Camera navigation is smooth
- Data persists to localStorage

---

## Phase 6: Story/Scene Tab (NEW - 3D)

### Goal
Create a scene editor where characters can be placed in 3D space and scenes can play back.

### Tasks
1. Create SceneEditor component
2. Implement 3D scene viewer (Three.js)
3. Add character placement in 3D space
4. Implement character movement (drag to move, keyframes for playback)
5. Create free orbit camera controls
6. Add subtitle overlay system
7. Implement scene playback mode (play/pause)
8. Link scenes to timeline events
9. Set up scene store with localStorage persistence

### Key Components to Create
- `SceneEditor.tsx` - Container with tools
- `SceneViewer.tsx` - 3D scene rendering
- `SceneTimeline.tsx` - Scene-specific timeline for keyframes
- `SubtitleOverlay.tsx` - Display dialogue
- `CameraControls.tsx` - Camera manipulation
- `CharacterPlacer.tsx` - Place characters in scene

### Scene Features
- Character positioning (x, y, z)
- Character rotation
- Keyframe-based movement during playback
- Dialogue lines with timing
- Camera keyframes (optional for MVP)
- Background selection (from world or generic)

### Success Criteria
- Can create/edit/delete scenes
- Can place characters in 3D space
- Can move characters by dragging
- Subtitles display during playback
- Play/pause controls work
- Can link scenes to timeline events
- Data persists to localStorage

---

## Phase 7: Final Integration & Polish

### Goal
Ensure all systems work together seamlessly.

### Tasks
1. Ensure all tabs share state properly via Zustand
2. Add AI placeholder buttons with "Not implemented" modals
3. Final UI consistency pass across all tabs
4. Add loading states and error handling
5. Test complete workflow end-to-end
6. Performance optimization if needed
7. Bug fixes from testing

### AI Placeholder Locations
- Notes tab: "Generate from Master Doc" button
- Timeline tab: "AI Fill Gaps" button
- Scenes tab: "Generate with AI" button
- Characters tab: "AI Suggest Personality" button

### Success Criteria
- Can complete full workflow:
  1. Create story from dashboard
  2. Add notes in canvas
  3. Create characters
  4. Build timeline
  5. Create world
  6. Make scenes
  7. Link scenes to timeline
  8. Play back scenes
- All data persists correctly
- UI is polished and consistent
- No crashes or major bugs

---

## Timeline Estimate

**Note**: No specific time estimates - work at your own pace.

**Order of Implementation**:
1. Notes → 2. Characters → 3. Timeline → 4. World → 5. Scenes → 6. Polish

---

*Document created: December 2024*
*For: Bibliarch MVP Development*
