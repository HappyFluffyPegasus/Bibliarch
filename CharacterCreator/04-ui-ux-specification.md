# Character Creator - UI/UX Specification
## Gacha Life-Inspired Interface Design

## Document Information
**Project**: Character Creator UI/UX Design
**Design Inspiration**: Gacha Life character customization system
**Target Platform**: Desktop (1920x1080 primary, responsive)
**Last Updated**: 2025-10-23

---

## 1. Design Philosophy

### 1.1 Core Principles

**Intuitive Navigation:**
- Visual first - user sees what they get
- One section at a time - avoid overwhelming
- Clear visual feedback for all interactions
- No hidden features - everything is discoverable

**Gacha Life Inspiration:**
- Section-based editing (head, body, legs, etc.)
- Camera zoom to focus area
- Visual option buttons with previews
- Character list sidebar
- Playful, accessible design
- Immediate visual feedback

**Low-Poly Aesthetic:**
- Clean, minimal UI
- Flat colors with subtle shadows
- Bold, readable typography
- Smooth animations
- Modern but approachable

---

## 2. Overall Layout

### 2.1 Screen Layout (Desktop 1920x1080)

```
┌─────────────────────────────────────────────────────────────┐
│  Character Creator                    [Save] [Export] [User] │ 60px header
├──────────┬──────────────────────────────────────┬───────────┤
│          │                                      │           │
│ Character│                                      │ Right     │
│   List   │           3D Viewer                  │ Panel     │
│          │        (Camera Focus)                │           │
│  240px   │                                      │   400px   │
│          │                                      │           │
│ ┌──────┐ │                                      │ STATE 1:  │
│ │ NEW  │ │                                      │ Section   │
│ └──────┘ │                                      │ Selection │
│          │                                      │           │
│ Alice    │                                      │ [👤 Head] │
│ [img]    │                                      │ [👕 Body] │
│          │                                      │ [👖 Legs] │
│ Bob      │                                      │ [👞 Feet] │
│ [img]    │                                      │ [✨Extra] │
│          │                                      │           │
│ Carol    │                                      │ STATE 2:  │
│ [img]    │                                      │ Item      │
│          │                                      │ Options   │
│ (3/20)   │                                      │ [Header]  │
│          │                                      │ [Options] │
│          │                                      │           │
└──────────┴──────────────────────────────────────┴───────────┘
```

### 2.2 Layout Zones

**Zone 1: Character List (Left - 240px)**
- Fixed width sidebar
- Scrollable character list
- "New Character" button at top
- Character count indicator at bottom
- Minimally collapsible to 60px (icons only)

**Zone 2: 3D Viewer (Center - Dynamic)**
- Takes remaining horizontal space
- Full height (minus header)
- Camera zooms/pans based on selected section
- Orbit controls active but constrained
- Grid floor for reference

**Zone 3: Right Panel (Right - 400px)**
- Fixed width panel
- **Two States:**
  - **State 1: Section Selection** - Shows section buttons (HEAD, BODY, LEGS, FEET, EXTRA)
  - **State 2: Item Options** - Shows options for selected section with navigation header
- Scrollable content area
- Smooth transitions between states

**Zone 4: Header (Top - 60px)**
- Character name (editable)
- Save button
- Export menu
- User menu
- Auto-save indicator

---

## 3. Section-Based Editing System

### 3.1 Section Categories

**Section 1: HEAD**
- Hair styles
- Facial features (future)
- Head size (scale armature)
- Head accessories (hats, glasses, etc.)

**Section 2: BODY**
- Tops/shirts
- Body accessories (jewelry, bags, etc.)
- Torso proportions (scale armature)
- Arm poses

**Section 3: LEGS**
- Bottoms/pants/skirts
- Leg proportions (scale armature)
- Leg poses

**Section 4: FEET**
- Shoes
- Socks (if separate)
- Foot accessories

**Section 5: EXTRA**
- Full body accessories
- Props
- Overall height
- Pose presets
- Advanced armature controls

### 3.2 Right Panel: Section Selection State

**Panel Layout (State 1):**
```
┌─────────────────────────────────────┐
│  CUSTOMIZE CHARACTER                │ Header (50px)
├─────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐  │
│  │       👤                      │  │
│  │      HEAD                     │  │
│  │   Hair, Face, Accessories    │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │       👕                      │  │
│  │      BODY                     │  │
│  │   Tops, Arms, Accessories    │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │       👖                      │  │
│  │      LEGS                     │  │
│  │   Bottoms, Proportions       │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │       👞                      │  │
│  │      FEET                     │  │
│  │   Shoes, Socks               │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │       ✨                      │  │
│  │      EXTRA                    │  │
│  │   Pose, Height, Advanced     │  │
│  └──────────────────────────────┘  │
│                                      │
└─────────────────────────────────────┘
```

**Section Button Design:**
- Width: 360px (fills panel width minus padding)
- Height: 100px
- Spacing: 12px between buttons
- Border radius: 12px
- Vertical stack layout

**Button States:**

**Inactive State:**
```
┌────────────────────────────────┐
│   👤 (32px icon)                │
│   HEAD (20px bold)              │
│   Hair, Face, Accessories       │
│   (14px secondary text)         │
└────────────────────────────────┘
Background: #ffffff
Border: 2px solid #e5e5e5
Text: #1a1a1a
Secondary text: #666666
```

**Hover State:**
```
┌────────────────────────────────┐
│   👤                            │
│   HEAD                          │
│   Hair, Face, Accessories       │
└────────────────────────────────┘
Background: #f9fafb
Border: 2px solid #3b82f6
Transform: translateX(8px)
Transition: 200ms
Cursor: pointer
```

**Navigation Active State (when in options view):**
```
┌────────────────────────────────┐
│   👤                            │
│   HEAD  ← Currently viewing     │
│   Hair, Face, Accessories       │
└────────────────────────────────┘
Background: #eff6ff (light blue)
Border: 3px solid #3b82f6
Left accent: 5px solid #3b82f6
```

### 3.3 Right Panel: Item Options State

**Panel Layout (State 2):**
```
┌─────────────────────────────────────┐
│  ← Back    👤 HEAD      [Next →]   │ Navigation Header (60px)
├─────────────────────────────────────┤
│                                      │
│  Hair Style                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │ 1  │ │ 2  │ │ 3  │ │ 4  │       │
│  └────┘ └────┘ └────┘ └────┘       │
│  ┌────┐ ┌────┐ ┌────┐               │
│  │ 5  │ │ 6  │ │None│               │
│  └────┘ └────┘ └────┘               │
│                                      │
│  Head Accessories                    │
│  ┌────┐ ┌────┐ ┌────┐               │
│  │Hat │ │Cap │ │None│               │
│  └────┘ └────┘ └────┘               │
│                                      │
│  Size & Proportions                  │
│  Head Size  [──────●──] 100%        │
│                                      │
└─────────────────────────────────────┘
```

**Navigation Header:**
- Height: 60px
- Three sections: Back button, Current section indicator, Next button
- Allows quick switching between sections without returning to section selection

**Header Components:**

**Back Button:**
```
┌──────────┐
│ ← Back   │
└──────────┘
- Returns to Section Selection state (State 1)
- Resets camera to full body view
- Hover: background highlight
```

**Current Section Indicator:**
```
┌─────────────────┐
│   👤 HEAD       │
└─────────────────┘
- Shows current section icon + name
- Click: dropdown menu to jump to another section
- Visual: slightly raised/highlighted
```

**Next Button:**
```
┌──────────┐
│ Next → │
└──────────┘
- Cycles to next section (HEAD → BODY → LEGS → FEET → EXTRA → HEAD)
- Camera animates to new section
- Options panel updates to new section
- Hover: background highlight
```

**Alternative: Horizontal Tab Navigation:**
```
┌─────────────────────────────────────┐
│ ←  [👤] [👕] [👖] [👞] [✨]  →     │
│     ^^^                              │
│   Active                             │
└─────────────────────────────────────┘
- Shows all 5 sections as tabs
- Active section highlighted
- Click any tab to switch
- Arrows scroll if tabs don't fit
```

**Transition Behavior:**
```
When switching sections via header:
1. Current options fade out (200ms)
2. Camera animates to new section (800ms)
3. New options fade in (200ms)
4. Active tab/button updates
5. Total feels smooth and continuous
```

---

## 4. Camera Zoom Behavior

### 4.1 Section-Specific Camera Positions

When a section button is clicked, the camera smoothly animates to a predefined position that optimally frames that body part.

**HEAD Section:**
```typescript
camera.position: [0, 1.7, 1.2]   // Close-up, eye level
camera.target: [0, 1.65, 0]      // Look at face
camera.fov: 40                    // Narrow FOV for close-up
duration: 800ms                   // Smooth animation
easing: easeInOutCubic
```
- Character's head fills 60% of viewport
- Face clearly visible
- Hair fully in frame
- Grid fades to 20% opacity (less distraction)

**BODY Section:**
```typescript
camera.position: [0.5, 1.2, 1.5]  // Slight angle, torso level
camera.target: [0, 1.1, 0]        // Look at chest area
camera.fov: 45
duration: 800ms
```
- Torso and arms visible
- Includes shoulders to waist
- Enough room to see clothing details

**LEGS Section:**
```typescript
camera.position: [0.3, 0.7, 1.5]  // Lower angle
camera.target: [0, 0.6, 0]        // Look at hips/legs
camera.fov: 50
duration: 800ms
```
- Hips to knees in focus
- Full leg silhouette visible
- Floor grid more visible (leg placement reference)

**FEET Section:**
```typescript
camera.position: [0.5, 0.3, 1.2]  // Very low angle
camera.target: [0, 0.2, 0]        // Look at feet
camera.fov: 45
duration: 800ms
```
- Feet and ankles prominent
- Floor grid visible for grounding
- Shoe details clear

**EXTRA Section (Full Body):**
```typescript
camera.position: [0, 1, 3]        // Default full view
camera.target: [0, 1, 0]          // Center of character
camera.fov: 50
duration: 800ms
```
- Full character visible head to toe
- Proportions clearly visible
- Enough space to see overall composition

### 4.2 Camera Animation

**Smooth Transition:**
```typescript
// When section button clicked
onSectionChange(section) {
  // 1. Animate camera position
  animateCamera({
    from: currentCamera,
    to: sectionCameraPresets[section],
    duration: 800,
    easing: 'easeInOutCubic',
    onUpdate: () => renderer.render(scene, camera)
  })

  // 2. Adjust orbit controls limits
  controls.minDistance = section.minDistance
  controls.maxDistance = section.maxDistance
  controls.minPolarAngle = section.minPolarAngle
  controls.maxPolarAngle = section.maxPolarAngle

  // 3. Update UI
  highlightSectionButton(section)
  showSectionOptions(section)
}
```

**User Control:**
- User can still orbit/pan while zoomed
- Controls are constrained to keep focus area in view
- Double-click section button returns to that section's default view
- "Reset Camera" button returns to full body view

### 4.3 Visual Feedback During Transition

**During camera animation:**
- Section button shows pulsing animation
- Options panel fades out → content changes → fades in
- Character meshes slightly highlight the relevant area
- Subtle UI sound (optional)

**Focus Indicator:**
```
While in HEAD section:
- Faint circular highlight around head (world-space overlay)
- Other body parts slightly desaturated (80% opacity)
- Or: outline shader on focused area
```

---

## 5. Item Options Content (Right Panel State 2)

### 5.1 Content Structure

**Full Panel Layout (State 2):**
```
┌─────────────────────────────────────┐
│  ← Back    👤 HEAD      [Next →]   │ Navigation (60px)
├─────────────────────────────────────┤
│  Hair Style                         │ Content area
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │ (scrollable)
│  │ 1  │ │ 2  │ │ 3  │ │ 4  │       │
│  └────┘ └────┘ └────┘ └────┘       │
│  ┌────┐ ┌────┐ ┌────┐               │
│  │ 5  │ │ 6  │ │None│               │
│  └────┘ └────┘ └────┘               │
│                                      │
│  Head Accessories                    │
│  ┌────┐ ┌────┐ ┌────┐               │
│  │Hat │ │Cap │ │None│               │
│  └────┘ └────┘ └────┘               │
│                                      │
│  Size & Proportions                  │
│  Head Size  [──────●──] 100%        │
│                                      │
└─────────────────────────────────────┘
```

**Content Organization:**
- Navigation header: 60px fixed at top
- Content area: Remaining height, vertically scrollable
- Categories organized vertically
- Each category can be collapsed/expanded

### 5.2 Option Button Design

**Asset Option Button:**
- Size: 90px × 90px
- Grid layout: 4 columns
- Spacing: 8px
- Border radius: 8px

**Button States:**

**Unselected:**
```
┌──────────┐
│          │
│  [Preview]
│   Image  │
│          │
│  "Name"  │
└──────────┘
Background: #ffffff
Border: 2px solid #e5e5e5
Text: #666666
Hover: border → #3b82f6
```

**Selected:**
```
┌──────────┐
│    ✓     │
│  [Preview]
│   Image  │
│          │
│  "Name"  │
└──────────┘
Background: #eff6ff (light blue)
Border: 3px solid #3b82f6
Text: #1e40af (dark blue)
Checkmark: top-right corner
Shadow: 0 2px 8px rgba(59, 130, 246, 0.3)
```

**None Option:**
```
┌──────────┐
│          │
│    ∅     │
│          │
│  "None"  │
└──────────┘
Special styling for "remove item" option
Border: dashed
Icon: circle with slash
```

### 5.3 Visual Previews

**Option 1: 3D Thumbnails (Ideal)**
- Pre-rendered PNG thumbnails of each asset
- Generated when GLB is loaded
- Show asset on neutral base body
- Same camera angle for all thumbnails
- Size: 80x80px
- Transparent background

**Option 2: Live 3D Preview (Advanced)**
- Tiny Three.js canvas per option
- Shows asset rotating slowly
- More interactive but performance-heavy
- Fallback to static thumbnails

**Option 3: Placeholder Icons (Fallback)**
- Generic icons if no preview available
- Text labels
- Color-coded by category

### 5.4 Category Sections

**Collapsible Categories:**
```
▼ Hair Style               ← Expanded
  [option] [option] [option]

▶ Head Accessories         ← Collapsed

▼ Size & Proportions       ← Expanded
  [sliders]
```

**Benefits:**
- Organize many options
- Reduce visual clutter
- User can focus on one category at a time
- Remembers expanded state

### 5.5 Slider Controls (Scale Armature)

**Slider Design:**
```
Head Size
[────────●────────] 100%
50%              150%

Visual feedback:
- Value label updates in real-time
- Character updates immediately in 3D view
- Subtle tick marks at 50%, 100%, 150%
- Reset button (↺) returns to 100%
```

**Slider Specs:**
- Width: 100% of panel (minus padding)
- Height: 40px
- Track: 4px thick
- Thumb: 20px circle
- Color: accent blue (#3b82f6)
- Smooth dragging at 60fps

---

## 6. Character List Sidebar

### 6.1 Character Card Design

**Card Dimensions:**
- Width: 220px (fills sidebar minus padding)
- Height: 100px
- Spacing: 8px between cards
- Border radius: 8px

**Card Layout:**
```
┌─────────────────────────────┐
│ ┌────────┐  Alice           │
│ │        │  Created: 10/20  │
│ │ Thumb  │  Modified: 10/23 │
│ │        │                  │
│ │ 80x80  │  [Edit] [Delete] │
│ └────────┘                  │
└─────────────────────────────┘
```

**Card States:**

**Unselected:**
- Background: #ffffff
- Border: 1px solid #e5e5e5
- Hover: border → #3b82f6, background → #f9fafb

**Selected (Currently Loaded):**
- Background: #eff6ff
- Border: 3px solid #3b82f6
- Shadow: 0 4px 12px rgba(59, 130, 246, 0.2)
- Left border accent: 5px solid #3b82f6

**Modified (Unsaved Changes):**
- Orange dot indicator in top-right
- Tooltip: "Unsaved changes"

### 6.2 New Character Button

```
┌─────────────────────────────┐
│                              │
│         + NEW                │
│   Create Character           │
│                              │
└─────────────────────────────┘
Height: 80px
Background: linear-gradient(135deg, #3b82f6, #8b5cf6)
Text: #ffffff
Icon: Large + symbol
Hover: brightness increase, slight scale
```

### 6.3 Character Counter

```
Bottom of sidebar:
┌─────────────────────────────┐
│  Characters: 3 / 20          │
│  [─────────────────────]     │
│  Progress bar (15% filled)   │
└─────────────────────────────┘
```

**Visual Feedback:**
- Progress bar fills as more characters created
- Warning color when approaching 20
- Full state: disable "New" button, show message

### 6.4 Sidebar Actions

**Collapsible Sidebar:**
- Arrow button to minimize sidebar
- Collapsed state: 60px wide, icons only
- Expands on hover (optional)
- User preference saved

**Right-Click Context Menu:**
```
On character card right-click:
┌─────────────────┐
│ ✎ Rename        │
│ ⎘ Duplicate     │
│ ⬇ Export        │
│ 🗑 Delete       │
└─────────────────┘
```

---

## 7. User Interaction Flows

### 7.1 Creating a New Character

**Flow:**
```
1. User clicks [+ NEW] button
   └─> Confirmation if current character has unsaved changes

2. Camera animates to full body view
   └─> Character resets to default base body
   └─> Right panel shows Section Selection (State 1)

3. Character appears in list as "New Character (1)"
   └─> Name is editable immediately

4. User clicks HEAD button in right panel
   └─> Right panel transitions to Item Options (State 2)
   └─> Navigation header appears with [← Back] [👤 HEAD] [Next →]
   └─> Camera zooms to head (800ms smooth animation)
   └─> Options show hair/accessories

5. User clicks a hair option
   └─> Hair instantly appears on character
   └─> Option button highlights with checkmark
   └─> Character marked as modified (orange dot in list)

6. User clicks [Next →] in header
   └─> Panel transitions to BODY options
   └─> Camera smoothly animates to torso
   └─> Body options (tops, accessories) appear

7. User continues customizing...

8. Auto-save triggers 2 seconds after last change
   └─> Save indicator shows "Saving..."
   └─> Success: "Saved at 2:35 PM"

9. Character thumbnail updates in sidebar

10. User clicks [← Back] in header
    └─> Returns to Section Selection (State 1)
    └─> Camera returns to full body view
```

**Visual Feedback at Each Step:**
- Panel smoothly transitions between states
- Camera smoothly animates
- Options fade in/out
- Character updates instantly
- Save status visible
- No jarring transitions
- Navigation header provides context

### 7.2 Editing an Existing Character

**Flow:**
```
1. User clicks character card in sidebar
   └─> Current character save check

2. Selected character loads
   └─> 3D model updates with saved config
   └─> Camera goes to last used section (or full body)
   └─> Last active section highlighted

3. User clicks different section (e.g., BODY)
   └─> Camera zooms to torso
   └─> Options panel shows tops/accessories
   └─> Currently equipped top is highlighted

4. User changes top
   └─> Old top hides, new top shows
   └─> Character marked as modified

5. Auto-save triggers...
```

### 7.3 Deleting a Character

**Flow:**
```
1. User right-clicks character card → Delete
   OR clicks [Delete] button on card

2. Confirmation modal appears
   ┌─────────────────────────────────┐
   │  Delete "Alice"?                │
   │                                  │
   │  This cannot be undone.          │
   │                                  │
   │  [Cancel]  [Delete Forever]      │
   └─────────────────────────────────┘

3. If confirmed:
   └─> Character fades out from list
   └─> If currently loaded → switch to first remaining character
   └─> Database delete
   └─> Success message: "Alice deleted"

4. Character counter updates: "2 / 20"
```

### 7.4 Adjusting Armature (Scale)

**Flow:**
```
1. User in HEAD section
2. Scrolls down to "Size & Proportions"
3. Drags "Head Size" slider right
   └─> Character's head scales in real-time (60fps)
   └─> Slider value updates: "120%"
   └─> Scale armature bone updates
4. Releases slider
   └─> Character marked as modified
   └─> Auto-save countdown starts
5. User clicks reset button (↺)
   └─> Slider animates back to 100%
   └─> Head scales back to default
```

### 7.5 Navigating Between Sections

**Method 1: Using Next/Back Buttons**
```
1. User viewing HEAD options (State 2)
2. Clicks [Next →] button in header
   └─> Options panel content fades out (200ms)
   └─> Header updates: 👤 HEAD → 👕 BODY
   └─> Camera smoothly animates to torso (800ms)
   └─> Options panel content fades in with body options (200ms)
   └─> Currently equipped top highlighted
3. User can now customize body
4. Clicks [Next →] again → goes to LEGS
5. Process repeats
```

**Method 2: Using Tab Navigation (if implemented)**
```
1. User viewing HEAD options
2. Clicks FEET tab in navigation header
   └─> Active tab indicator moves to FEET
   └─> Options fade out
   └─> Camera jumps to feet view (800ms)
   └─> Feet options fade in
3. Direct navigation to any section
```

**Method 3: Using Back Button**
```
1. User viewing BODY options
2. Clicks [← Back] button
   └─> Panel transitions from State 2 → State 1
   └─> Options fade out, section buttons fade in
   └─> Camera returns to full body view (800ms)
   └─> All 5 section buttons now visible
3. User clicks LEGS button
   └─> Panel transitions State 1 → State 2
   └─> Section buttons fade out, options fade in
   └─> Camera zooms to legs
4. User is now viewing LEGS options
```

**Smooth Transitions:**
- No jarring cuts
- Options don't "pop" in, they fade
- Camera movement uses easing (not linear)
- Visual continuity maintained
- Navigation header provides context
- User always knows which section they're in

---

## 8. Visual Feedback & Micro-interactions

### 8.1 Hover Effects

**All Interactive Elements:**
- Cursor: pointer
- Transition: 150-200ms
- Scale: 1.02-1.05 (subtle)
- Border/shadow changes
- Color shifts

**Examples:**
- Section buttons: scale(1.05) + border
- Option buttons: border color change + lift (shadow)
- Character cards: background color + border
- Sliders: thumb scale increase

### 8.2 Loading States

**Model Loading:**
```
3D Viewer shows:
┌─────────────────────────────┐
│                              │
│         ⟳                    │
│     Loading Model...         │
│                              │
└─────────────────────────────┘
- Spinning icon
- Percentage if available
- Smooth fade-in when loaded
```

**Character Switching:**
```
- Fade out current character (200ms)
- Show small loading indicator
- Load new config
- Fade in new character (200ms)
- Total: <1 second
```

### 8.3 Save States

**Auto-save Indicator (Header):**
```
Idle:       "All changes saved ✓"
Saving:     "Saving... ⟳"
Error:      "Save failed ⚠"
Modified:   "Unsaved changes ●"
```

**Visual States:**
- Idle: gray text, checkmark
- Saving: blue text, spinning icon
- Error: red text, warning icon, retry button
- Modified: orange dot

### 8.4 Empty States

**No Characters Created Yet:**
```
Sidebar shows:
┌─────────────────────────────┐
│                              │
│         👤                   │
│                              │
│  No characters yet           │
│  Create your first!          │
│                              │
│      [+ NEW]                 │
│                              │
└─────────────────────────────┘
```

**No Options in Category:**
```
Options panel:
┌─────────────────────────────┐
│  No accessories available    │
│                              │
│  More options coming soon!   │
└─────────────────────────────┘
```

### 8.5 Success Animations

**When Asset Applied:**
- Brief flash/highlight on character (200ms)
- Option button "pops" into selected state
- Subtle scale animation

**When Character Saved:**
- Save button: checkmark animation
- Character card: thumbnail updates with fade
- Toast notification: "Saved!" (2 seconds)

**When Character Created:**
- Character card slides into list from top
- Gentle bounce animation
- Highlight for 1 second

---

## 9. Responsive Design

### 9.1 Breakpoint Strategy

**Desktop Large (1920px+):**
- Full 3-column layout as specified
- All panels visible
- No scrolling needed (except options panel if many items)

**Desktop Medium (1280px - 1919px):**
- Sidebar: 200px (slightly narrower)
- Options panel: 350px (slightly narrower)
- 3D viewer: remaining space (still comfortable)

**Desktop Small (1024px - 1279px):**
- Sidebar: collapsible, starts collapsed
- Options panel: 320px
- 3D viewer: maximized when sidebar collapsed

**Tablet (768px - 1023px):**
- Sidebar: overlay mode (slides over viewer)
- Options panel: full width overlay (slides up from bottom)
- Section buttons: horizontal scroll
- 3D viewer: full width when panels closed

**Mobile (< 768px):**
- Not primary target, but functional
- Full-screen 3D viewer
- Section buttons: horizontal scroll, bottom sheet
- Options: full-screen modal
- Character list: full-screen overlay
- Focus on portrait mode

### 9.2 Adaptive UI Elements

**Section Buttons on Tablet/Mobile:**
```
Instead of:
[HEAD] [BODY] [LEGS] [FEET] [EXTRA]

Becomes:
[👤] [👕] [👖] [👞] [✨]
(Icons only, labels in tooltip)
Horizontal scroll
```

**Options Panel on Tablet:**
- Swipe up from bottom to reveal
- Swipe down to dismiss
- Floating above 3D viewer
- Semi-transparent backdrop

---

## 10. Accessibility

### 10.1 Keyboard Navigation

**Tab Order:**
1. Header actions (save, export, user menu)
2. Character list
3. Section buttons
4. Options panel
5. Character controls

**Keyboard Shortcuts:**
- `Tab` / `Shift+Tab`: Navigate
- `Enter` / `Space`: Activate button
- `Escape`: Close modal/panel
- `Arrow keys`: Navigate options grid
- `Ctrl+S`: Manual save
- `Ctrl+N`: New character
- `1-5`: Quick switch sections (HEAD=1, BODY=2, etc.)

### 10.2 Screen Reader Support

**ARIA Labels:**
```html
<button aria-label="Head section - Customize hair and face">
  👤 HEAD
</button>

<button
  role="radio"
  aria-checked="true"
  aria-label="Hair style: Long ponytail">
  [Preview Image]
</button>

<div role="status" aria-live="polite">
  Saved at 2:35 PM
</div>
```

### 10.3 Visual Accessibility

**Color Contrast:**
- Text: WCAG AA minimum (4.5:1)
- UI elements: WCAG AA (3:1)
- Focus indicators: high contrast

**Focus Indicators:**
- 3px solid outline
- Color: #2563eb (blue)
- Offset: 2px
- Visible on all interactive elements

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
- Camera transitions: instant instead of animated
- UI transitions: minimal
- Still functional, just less motion

---

## 11. Color System

### 11.1 Color Palette

**Primary Colors:**
```css
--primary-blue: #3b82f6      /* Buttons, accents */
--primary-blue-dark: #2563eb /* Hover states */
--primary-blue-light: #eff6ff /* Backgrounds */
```

**Neutral Colors:**
```css
--gray-50: #f9fafb   /* Subtle backgrounds */
--gray-100: #f3f4f6  /* Card backgrounds */
--gray-200: #e5e7eb  /* Borders */
--gray-300: #d1d5db  /* Disabled states */
--gray-600: #4b5563  /* Secondary text */
--gray-900: #111827  /* Primary text */
```

**Semantic Colors:**
```css
--success: #10b981   /* Save success */
--warning: #f59e0b   /* Unsaved changes */
--error: #ef4444     /* Delete, errors */
--info: #3b82f6      /* Info messages */
```

**3D Scene Colors:**
```css
--scene-bg: #2a2a2a        /* Dark gray */
--grid-color: #404040      /* Medium gray */
--light-ambient: #ffffff   /* White light */
--light-directional: #ffffff
```

### 11.2 Dark Mode (Future)

**Strategy:**
- Detect system preference
- Toggle in user menu
- Swap color variables
- Adjust 3D scene lighting slightly

```css
[data-theme="dark"] {
  --gray-50: #18181b
  --gray-100: #27272a
  --gray-900: #fafafa
  /* ... inverted grays */

  --scene-bg: #18181b
  /* Darker scene for dark mode */
}
```

---

## 12. Typography

### 12.1 Font System

**Font Family:**
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Roboto, 'Helvetica Neue', Arial, sans-serif;

--font-mono: 'SF Mono', Monaco, 'Cascadia Code',
             'Courier New', monospace;
```

**Font Sizes:**
```css
--text-xs: 12px    /* Small labels */
--text-sm: 14px    /* Secondary text */
--text-base: 16px  /* Body text */
--text-lg: 18px    /* Emphasized text */
--text-xl: 20px    /* Section headers */
--text-2xl: 24px   /* Panel headers */
--text-3xl: 30px   /* Page title */
```

**Font Weights:**
```css
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

### 12.2 Text Hierarchy

**Headers:**
- App title: 24px, semibold
- Panel headers: 20px, semibold
- Section headers: 18px, medium
- Category labels: 16px, medium

**Body:**
- Primary text: 16px, normal
- Secondary text: 14px, normal
- Small text: 12px, normal

**Interactive:**
- Buttons: 16px, medium
- Links: 16px, medium, underline on hover
- Input labels: 14px, medium

---

## 13. Animation Specifications

### 13.1 Animation Timing

**Durations:**
```css
--duration-instant: 0ms       /* Disabled/reduced motion */
--duration-fast: 150ms        /* Hover effects */
--duration-normal: 200ms      /* UI transitions */
--duration-slow: 300ms        /* Panel slides */
--duration-camera: 800ms      /* Camera movement */
```

**Easing Functions:**
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)     /* Standard */
--ease-out: cubic-bezier(0, 0, 0.2, 1)           /* Enter */
--ease-in: cubic-bezier(0.4, 0, 1, 1)            /* Exit */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55) /* Playful */
```

### 13.2 Key Animations

**Camera Zoom:**
```typescript
{
  duration: 800ms,
  easing: easeInOutCubic,
  properties: [position, target, fov]
}
```

**Panel Slide In:**
```css
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.panel {
  animation: slideIn 300ms ease-out;
}
```

**Option Select:**
```css
@keyframes selectPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.option.selected {
  animation: selectPop 200ms ease-out;
}
```

**Character Card Appear:**
```css
@keyframes cardAppear {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.character-card {
  animation: cardAppear 300ms ease-out;
}
```

### 13.3 Loading Animations

**Spinner:**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

**Skeleton Loader (for thumbnails):**
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
```

---

## 14. Detailed Component Specs

### 14.1 Section Button Component

```typescript
interface SectionButtonProps {
  section: 'HEAD' | 'BODY' | 'LEGS' | 'FEET' | 'EXTRA'
  icon: string
  label: string
  active: boolean
  modified: boolean
  onClick: () => void
}
```

**Visual States:**
- Default: Gray background, dark gray text
- Hover: Light gray background, border appears
- Active: Blue background, white text, shadow
- Modified: Small orange dot in top-right corner

**Interaction:**
- Click: Activate section, zoom camera
- Double-click: Reset camera for that section
- Keyboard: Enter/Space to activate

### 14.2 Asset Option Button Component

```typescript
interface AssetOptionProps {
  id: string
  name: string
  thumbnailUrl?: string
  category: string
  selected: boolean
  onSelect: (id: string) => void
}
```

**Layout:**
```
┌────────────┐
│ ✓          │ ← Checkmark if selected
│  [Image]   │ ← 70x70px thumbnail
│  "Name"    │ ← 12px text, truncated
└────────────┘
90x90px total
```

**Interaction:**
- Click: Select this option, update character
- Hover: Show tooltip with full name
- Keyboard: Arrow keys to navigate, Enter to select

### 14.3 Character Card Component

```typescript
interface CharacterCardProps {
  id: string
  name: string
  thumbnailUrl?: string
  createdAt: Date
  updatedAt: Date
  selected: boolean
  modified: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}
```

**Layout:**
```
┌──────────────────────────┐
│ ●                        │ ← Orange dot if modified
│ ┌────┐  Alice            │
│ │    │  Created: 10/20   │
│ │img │  Modified: 10/23  │
│ │    │                   │
│ └────┘  [⋮]              │ ← Context menu
└──────────────────────────┘
```

### 14.4 Slider Component

```typescript
interface SliderProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  unit?: string
  onChange: (value: number) => void
  onReset: () => void
}
```

**Layout:**
```
Head Size                    [↺]
[────────●────────────] 100%
50%                    150%
```

**Features:**
- Real-time updates (throttled to 60fps)
- Keyboard: Arrow keys adjust by step
- Click track to jump to value
- Reset button returns to default

---

## 15. Error States & Edge Cases

### 15.1 Load Failures

**GLB Load Error:**
```
┌─────────────────────────────┐
│         ⚠                    │
│  Failed to load model        │
│                              │
│  [Retry]  [Report Issue]     │
└─────────────────────────────┘
```

**Thumbnail Generation Failure:**
- Show placeholder icon
- Character still loads
- Try regeneration on next save

### 15.2 Save Failures

**Database Error:**
```
Toast notification:
┌─────────────────────────────┐
│ ⚠ Save failed               │
│ Check your connection        │
│ [Retry]  [Dismiss]           │
└─────────────────────────────┘
- Persists until resolved
- Auto-retry after 5 seconds
- Changes kept in local state
```

### 15.3 Limit Reached

**20 Characters Limit:**
```
When clicking [+ NEW]:
┌─────────────────────────────┐
│  Character Limit Reached    │
│                              │
│  You have 20/20 characters.  │
│  Delete one to create more.  │
│                              │
│  [OK]                        │
└─────────────────────────────┘
- "New" button disabled
- Visual indicator in counter
```

### 15.4 No Internet Connection

```
Header indicator:
[⚠ Offline - Changes saved locally]

- Character creator continues to work
- Changes saved to browser localStorage
- Sync when connection restored
- Visual warning in header
```

---

## 16. Performance Considerations

### 16.1 3D Rendering

**Frame Rate Targets:**
- Idle: 60fps
- Camera animation: 60fps
- Asset switching: 60fps
- Slider dragging: 60fps (throttled updates)

**Optimizations:**
- Frustum culling (Three.js default)
- Hide off-screen assets completely
- Reduce shadow quality on lower-end devices
- LOD levels if needed (future)

### 16.2 UI Rendering

**React Optimizations:**
- Memoize expensive components
- Virtual scrolling for character list (if >20 in future)
- Debounced search/filter
- Lazy load thumbnails (intersection observer)

### 16.3 Asset Loading

**Strategy:**
- Load GLB once on app start
- Cache in memory
- Preload thumbnails for visible characters
- Lazy load thumbnails for off-screen characters
- Progressive image loading (blur-up)

---

## 17. User Feedback Mechanisms

### 17.1 Toast Notifications

**Usage:**
- Save success
- Save failure
- Character deleted
- Export complete
- Errors

**Design:**
```
┌─────────────────────────────┐
│ ✓ Character saved!          │
└─────────────────────────────┘
Position: Bottom-right
Duration: 2 seconds (auto-dismiss)
Animation: Slide up + fade in
Can be dismissed manually
```

### 17.2 Tooltips

**Usage:**
- Icon-only buttons
- Truncated text
- Keyboard shortcuts
- Disabled states (explain why)

**Design:**
```
Hover over button:
      ┌──────────────┐
      │ Save (Ctrl+S)│
      └──────┬───────┘
           [Button]

Delay: 500ms
Position: Smart (stays on screen)
```

### 17.3 Confirmation Dialogs

**Usage:**
- Delete character
- Discard unsaved changes
- Destructive actions

**Design:**
```
┌────────────────────────────────┐
│  Delete "Alice"?               │
│                                 │
│  This action cannot be undone.  │
│                                 │
│  [Cancel]  [Delete]             │
└────────────────────────────────┘
Modal with backdrop
Focus trap
Escape to cancel
```

---

## 18. First-Time User Experience

### 18.1 Onboarding (Optional)

**Intro Tour (Dismissible):**
```
Step 1: "Welcome! Let's create your first character."
  → Highlights [+ NEW] button

Step 2: "Choose a body section to customize."
  → Highlights section buttons

Step 3: "Select options to customize your character."
  → Highlights options panel

Step 4: "Your changes save automatically!"
  → Highlights save indicator

[Skip Tour]  [Next]
```

### 18.2 Empty State

**First Visit:**
```
┌──────────────────────────────────┐
│                                   │
│          👤                       │
│     Character Creator              │
│                                   │
│  Create unique characters for     │
│  your story world!                │
│                                   │
│     [Create First Character]      │
│                                   │
└──────────────────────────────────┘
```

---

## 19. Implementation Checklist

### 19.1 Phase 1: Layout & Structure
- [ ] Create responsive grid layout
- [ ] Implement character list sidebar
- [ ] Implement section buttons toolbar
- [ ] Implement options panel
- [ ] 3D viewer container
- [ ] Header with actions

### 19.2 Phase 2: 3D Viewer
- [ ] Three.js scene setup
- [ ] Camera controls
- [ ] Section camera presets
- [ ] Camera animation system
- [ ] Lighting setup
- [ ] Grid floor

### 19.3 Phase 3: Section System
- [ ] Section button components
- [ ] Section state management
- [ ] Camera zoom on section change
- [ ] Options panel content switching
- [ ] Active section highlighting

### 19.4 Phase 4: Options Panel
- [ ] Asset option button component
- [ ] Grid layout for options
- [ ] Selected state styling
- [ ] Category sections (collapsible)
- [ ] Slider components
- [ ] Thumbnail loading system

### 19.5 Phase 5: Character List
- [ ] Character card component
- [ ] New character button
- [ ] Character selection
- [ ] Character deletion (with confirmation)
- [ ] Modified indicator
- [ ] Character counter
- [ ] Thumbnail generation

### 19.6 Phase 6: Interactions
- [ ] Asset switching logic
- [ ] Armature slider updates
- [ ] Auto-save system
- [ ] Save status indicator
- [ ] Loading states
- [ ] Error states
- [ ] Toast notifications

### 19.7 Phase 7: Polish
- [ ] Hover effects all elements
- [ ] Smooth transitions
- [ ] Focus indicators
- [ ] Keyboard navigation
- [ ] Tooltips
- [ ] Empty states
- [ ] Responsive design
- [ ] Dark mode (optional)

---

## 20. Success Metrics

### 20.1 Usability Goals

**Learnability:**
- New user creates first character: < 5 minutes
- User understands section system: immediate (visual)
- User finds all features: < 2 minutes exploration

**Efficiency:**
- Switching sections: < 1 second (camera animation)
- Changing asset: instant visual feedback
- Saving character: < 1 second

**Satisfaction:**
- Smooth 60fps animations
- No jarring transitions
- Immediate visual feedback
- Intuitive without instructions

### 20.2 Performance Goals

- Initial load: < 3 seconds
- Section switch: < 1 second
- Asset change: < 100ms
- Maintain 60fps: always
- Thumbnail generation: < 500ms per character

---

## Conclusion

This UI/UX specification defines a **Gacha Life-inspired character creator** with:

✓ **Section-based editing** - Focus on one body area at a time
✓ **Camera zoom system** - Automatic framing for each section
✓ **Visual option selection** - See what you're choosing
✓ **Hierarchical navigation** - Section selection → Item options
✓ **Intuitive layout** - Character list left, 3D center, navigation right
✓ **Smooth transitions** - Panel states, camera movement, content changes
✓ **Contextual navigation** - Back/Next buttons, section switching
✓ **Responsive design** - Works on all screens
✓ **Accessible** - Keyboard navigation, screen readers, reduced motion

### Navigation Summary

**The Right Panel has two states:**

1. **State 1: Section Selection**
   - User sees 5 large section buttons (HEAD, BODY, LEGS, FEET, EXTRA)
   - Camera shows full body
   - Click a section → transitions to State 2

2. **State 2: Item Options**
   - User sees navigation header with Back/Current/Next
   - User sees customization options for selected section
   - Camera zoomed to relevant body part
   - Can navigate between sections using Next button or Back to return to State 1

**This creates an intuitive drill-down pattern:**
```
Section Selection (State 1)
    ↓ Click HEAD button
Item Options for HEAD (State 2)
    ↓ Click Next button
Item Options for BODY (State 2)
    ↓ Click Next button
Item Options for LEGS (State 2)
    ↓ Click Back button
Section Selection (State 1)
```

**Next Steps:**
1. Review and approve this specification
2. Create visual mockups/wireframes (optional)
3. Begin implementation following the phased checklist
4. Test with real GLB model to refine camera positions
5. Iterate based on user feedback

The design prioritizes **visual clarity, hierarchical navigation, immediate feedback, and delightful interactions** to create an engaging Gacha Life-style character creation experience.