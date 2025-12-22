# Character Creator - Final UI Design
**Version**: 3.0 - Image-Based Grid System
**Date**: October 25, 2025
**Status**: Implementation Ready

---

## Core Philosophy

**Gacha Life-Inspired Color System**:
- Colors are shared across ALL items in a category
- One "Hair Color" setting affects ALL hair styles
- One "Clothing Color" setting affects ALL clothing items
- Thumbnails dynamically update to show items in the current color

**Image-First Design**:
- Large, visual item previews in 2-column grid
- Icon-based section navigation
- Minimal text, maximum visual clarity
- Click what you see, see what you get

---

## Layout Structure

### Three-Panel Layout

```
┌──────────┬────────────────────────────┬─────────────────────┐
│          │                            │                     │
│Character │      3D Viewport           │  Category Navigation│
│  List    │   (Intelligent Camera)     │   & Item Grid       │
│          │                            │                     │
│ [+ New]  │                            │  ┌─────────────────┐│
│          │    [3D Character]          │  │ 💇 👕 👖 👞 ✨ ││
│ Alice ●  │                            │  │ HAIR TOPS PANTS  │
│ Bob      │    Auto-focuses when       │  └─────────────────┘│
│ Carol    │    category selected       │                     │
│          │                            │  [Color Controls]   │
│          │                            │                     │
│          │                            │  ┌────┬────┐        │
│          │                            │  │Item│Item│        │
│          │                            │  │ 1  │ 2  │        │
│          │                            │  ├────┼────┤        │
│          │                            │  │Item│Item│        │
│          │                            │  │ 3  │ 4  │        │
│          │                            │  └────┴────┘        │
└──────────┴────────────────────────────┴─────────────────────┘
```

---

## Right Panel - Category System

### Top Navigation Strip

**Icon-based horizontal navigation**:
```
┌─────────────────────────────────────────────────┐
│  [💇] [👕] [👖] [👞] [✨] [☰] [🎭]             │
│  HAIR TOPS PANTS SHOES ACCESS BODY POSES        │
└─────────────────────────────────────────────────┘
```

**Categories**:
- 💇 **Hair** - All hairstyles
- 👕 **Tops** - Shirts, jackets, etc.
- 👖 **Pants** - Bottoms, skirts
- 👞 **Shoes** - Footwear
- ✨ **Accessories** - Glasses, hats, wings, etc.
- ☰ **Body** - Skin tone
- 🎭 **Poses** - Animation previews

**Interaction**:
- Click category icon to switch
- Active category highlighted
- Camera auto-positions to relevant body area
- Panel content updates to show category items

---

## Shared Color System

### How It Works

**Each category has ONE shared color setting**:
- All hair items use the **Hair Color**
- All tops use the **Tops Color**
- All pants use the **Pants Color**
- Accessories may have **Accessory Color**

### Color Section Layout

**Appears at top of each category panel**:

```
┌─────────────────────────────────────────┐
│  HAIR COLOR                             │
│  ┌─────────────┐  ┌──────┐  Recent:    │
│  │ Color Wheel │  │ HEX  │  ⬜⬜⬜⬜   │
│  │     🎨      │  │#___  │             │
│  └─────────────┘  └──────┘             │
└─────────────────────────────────────────┘
```

**Features**:
- **Color Wheel** - Visual color picker (hue + saturation/value)
- **HEX Input** - Precise color entry
- **Recent Colors** - Last 4-5 colors used for this category
- **Live Preview** - All item thumbnails update in real-time

### Multi-Channel Support

**For items with multiple colorable parts**:
```
┌─────────────────────────────────────────┐
│  TOPS COLOR                             │
│                                         │
│  Primary Color (Body)                   │
│  ┌─────────────┐  #______              │
│  │     🎨      │                        │
│  └─────────────┘                        │
│                                         │
│  Secondary Color (Trim)                 │
│  ┌─────────────┐  #______              │
│  │     🎨      │                        │
│  └─────────────┘                        │
└─────────────────────────────────────────┘
```

---

## Item Grid - 2 Column Layout

### Grid Structure

```
┌──────────────┬──────────────┐
│              │              │
│   Item 1     │   Item 2     │
│  [Preview]   │  [Preview]   │
│   "Name"     │   "Name"     │
│              │              │
├──────────────┼──────────────┤
│              │              │
│   Item 3     │   Item 4     │
│  [Preview]   │  [Preview]   │
│   "Name"     │   "Name"     │
│              │              │
└──────────────┴──────────────┘
```

### Item Card Specs

**Dimensions**:
- Card Width: 180px
- Card Height: 200px
- Preview Image: 160px × 160px
- Name Label: 18px below image
- Spacing: 12px between cards

**Card States**:

**Unselected**:
```
┌──────────────┐
│              │
│   [Preview]  │
│    Image     │
│  (160x160)   │
│              │
│  Item Name   │
└──────────────┘
Background: #ffffff
Border: 2px solid #e5e5e5
```

**Hover**:
```
┌──────────────┐
│              │
│   [Preview]  │
│              │
│              │
│              │
│  Item Name   │
└──────────────┘
Border: 2px solid #3b82f6
Shadow: 0 4px 8px rgba(59,130,246,0.2)
Scale: 1.02
Transition: 150ms
```

**Selected (Equipped)**:
```
┌──────────────┐
│      ✓       │ ← Checkmark
│   [Preview]  │
│              │
│              │
│              │
│  Item Name   │
└──────────────┘
Background: #eff6ff
Border: 3px solid #3b82f6
Checkmark: Top-right corner
```

---

## Dynamic Thumbnail System

### Thumbnail Generation

**How it works**:
1. When hair color changes to #FF0000 (red)
2. System re-renders ALL hair thumbnails with red color
3. Grid updates in real-time to show red hair
4. User sees exactly what each style looks like in their chosen color

**Technical Implementation**:
```typescript
// When color changes
onColorChange(category: string, color: string) {
  // Update color state
  categoryColors[category] = color

  // Re-generate all thumbnails for this category
  regenerateThumbnails(category, color)

  // Update 3D model in viewport
  updateModelColors(category, color)
}

// Thumbnail generator
regenerateThumbnails(category: string, color: string) {
  items[category].forEach(item => {
    // Render item mesh with new color
    const thumbnail = renderItemWithColor(item.mesh, color)

    // Update UI
    updateItemPreview(item.id, thumbnail)
  })
}
```

**Performance Optimization**:
- Pre-generate thumbnails on app load (default colors)
- Cache rendered thumbnails
- Regenerate only when color actually changes
- Use web workers for thumbnail generation (if needed)
- Consider lower resolution for real-time updates, higher for final display

### Camera Angle for Thumbnails

**Consistent across category**:
- **Hair**: 3/4 front view, eye level
- **Tops**: Front view, torso centered
- **Pants**: Front view, waist to feet
- **Shoes**: Slight angle, ground level
- **Accessories**: Varies by type (glasses: front face view, etc.)

**Lighting**:
- Neutral white lighting
- Subtle shadow for depth
- Transparent background
- Same lighting for all thumbnails in category

---

## Intelligent Camera System

### Auto-Positioning Per Category

**When user selects a category, camera smoothly animates to optimal view**:

```typescript
const cameraPresets = {
  HAIR: {
    position: [0, 1.7, 1.2],
    target: [0, 1.65, 0],
    fov: 40,
    description: "Close-up, head fills 50% of frame"
  },

  TOPS: {
    position: [0, 1.2, 1.8],
    target: [0, 1.1, 0],
    fov: 45,
    description: "Torso view, shoulders to waist visible"
  },

  PANTS: {
    position: [0, 0.8, 2.0],
    target: [0, 0.6, 0],
    fov: 50,
    description: "Lower body, waist to feet"
  },

  SHOES: {
    position: [0.3, 0.3, 1.5],
    target: [0, 0.1, 0],
    fov: 45,
    description: "Feet and ankles prominent"
  },

  ACCESSORIES: {
    position: [0, 1.6, 1.0],
    target: [0, 1.5, 0],
    fov: 40,
    description: "Face/head area for glasses, etc."
  },

  BODY: {
    position: [0, 1.0, 3.5],
    target: [0, 1.0, 0],
    fov: 50,
    description: "Full body view"
  },

  POSES: {
    position: [0, 1.0, 3.5],
    target: [0, 1.0, 0],
    fov: 50,
    description: "Full body to see pose"
  }
}
```

### Camera Animation

**Smooth transition**:
- Duration: 600-800ms
- Easing: easeInOutCubic
- Properties animated: position, target, FOV
- User can still manually orbit during/after animation

**User Control**:
- User can override auto-position by manually orbiting
- Double-click category icon returns to preset view
- "Reset Camera" button in viewport

---

## Preset System

### Preset Categories

**Preset Panel** (separate tab or modal):
```
┌─────────────────────────────────────┐
│  CHARACTER PRESETS                  │
├─────────────────────────────────────┤
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │Pre │ │Pre │ │Pre │ │Pre │      │
│  │set1│ │set2│ │set3│ │set4│      │
│  └────┘ └────┘ └────┘ └────┘      │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │Pre │ │Pre │ │Pre │ │Pre │      │
│  │set5│ │set6│ │set7│ │set8│      │
│  └────┘ └────┘ └────┘ └────┘      │
│                                     │
└─────────────────────────────────────┘
```

**Preset Types**:

1. **Full Character Presets**
   - Pre-made complete characters
   - All items, colors, poses configured
   - Click to load entire character
   - Great starting point for customization

2. **Style Presets** (Per Category)
   - Hair style bundles (punk, elegant, casual, etc.)
   - Outfit presets (athletic, formal, streetwear, etc.)
   - Color scheme presets (pastels, dark, vibrant, etc.)

3. **User-Created Presets**
   - Save current character as preset
   - Save current category setup as preset
   - Share presets (future feature)

### Preset Card Design

**Preset Card**:
```
┌────────────────┐
│                │
│   [Preview]    │
│  (Character    │
│   Render)      │
│                │
│  "Preset Name" │
│   Category     │
└────────────────┘
Size: 200x240px
Preview: 180x180px
```

**Interaction**:
- Click: Apply preset
- Right-click: Preview without applying
- Hover: Show details tooltip

---

## Item Properties & Layering

### Multiple Items Support

**Just like current spec**:
- Multiple clothing items can be equipped
- Items layer naturally
- No enforced exclusivity (except face features)

### Transform Controls

**For transformable items** (Hair, Skirts, Accessories):
- Small 🔧 icon appears on equipped item card
- Click to open transform overlay
- Same transform UI as previous spec (XYZ position/rotation/scale)

**Transform Overlay**:
```
┌─────────────────────────────────┐
│  Transform Controls             │
├─────────────────────────────────┤
│  Position                       │
│  X: ━━●━━ Y: ━━●━━ Z: ━━●━━   │
│                                 │
│  Rotation                       │
│  X: ━━●━━ Y: ━━●━━ Z: ━━●━━   │
│                                 │
│  Scale                          │
│  X: ━━●━━ Y: ━━●━━ Z: ━━●━━   │
│  🔗 Uniform Scale               │
│                                 │
│  [Reset] [Apply]                │
└─────────────────────────────────┘
```

---

## Subsections

### Clothing Subsections

**Some categories expand into subsections**:

**Example: When clicking 👕 TOPS**:
```
┌─────────────────────────────────────┐
│  [Shirts] [Jackets] [Tank Tops]     │ ← Sub-navigation
└─────────────────────────────────────┘
```

**Example: When clicking 👖 PANTS**:
```
┌─────────────────────────────────────┐
│  [Pants] [Shorts] [Skirts]          │
└─────────────────────────────────────┘
```

**Subsection Icons**:
- Small icons (24px) with labels below
- Horizontal scrollable strip if many subsections
- Active subsection highlighted
- Grid below updates to show subsection items

---

## Complete Category Breakdown

### 💇 Hair
**Subsections**: None (all hair in one grid)
**Color Controls**: Hair Color (Primary)
**Transformable**: Yes (all hair items)
**Camera**: Close-up head view
**Layering**: Usually one hair at a time (but multiple allowed)

### 👕 Tops
**Subsections**:
- Shirts
- Jackets
- Tank Tops
- Sweaters

**Color Controls**: Tops Color (Primary + Secondary for two-tone items)
**Transformable**: No
**Camera**: Torso view
**Layering**: Multiple allowed (layer tank + jacket)

### 👖 Pants
**Subsections**:
- Pants
- Shorts
- Skirts (transformable)

**Color Controls**: Bottoms Color (Primary)
**Transformable**: Skirts only
**Camera**: Lower body view
**Layering**: Multiple allowed

### 👞 Shoes
**Subsections**:
- Shoes
- Socks

**Color Controls**: Shoes Color, Socks Color (separate)
**Transformable**: No
**Camera**: Feet/ground view
**Layering**: Socks + Shoes together

### ✨ Accessories
**Subsections**:
- Glasses
- Hats
- Wings
- Jewelry
- Props

**Color Controls**: Accessory Color (per subsection)
**Transformable**: Yes (all accessories)
**Camera**: Varies by subsection
**Layering**: Multiple allowed

### ☰ Body
**Subsections**: None
**Color Controls**: Skin Tone (color wheel)
**Transformable**: No
**Camera**: Full body view
**Layering**: N/A

### 🎭 Poses
**Subsections**: None (or by mood: Happy, Sad, Action, etc.)
**Color Controls**: None
**Transformable**: No (preview only)
**Camera**: Full body view
**Layering**: N/A (one pose at a time)

---

## Face System

### Separate Face Panel

**Instead of full category, face gets special treatment**:

**Face Button** in main navigation opens **Face Modal**:
```
┌─────────────────────────────────────┐
│  FACE CUSTOMIZATION                 │
├─────────────────────────────────────┤
│  [Eyes] [Eyebrows] [Mouth]          │
├─────────────────────────────────────┤
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │Eye │ │Eye │ │Eye │ │Eye │      │
│  │ 1  │ │ 2  │ │ 3  │ │ 4  │      │
│  └────┘ └────┘ └────┘ └────┘      │
│                                     │
│  Alignment: ⬤ Center  ⬆ Up  ⬇ Down│
│                                     │
└─────────────────────────────────────┘
```

**Face Color Controls**:
- Eye Color
- Eyebrow Color
- (Lip color might be part of mouth image)

**Alignment Presets**:
- Radio buttons for quick position adjustment
- No manual transform sliders

---

## Character List Panel

### Layout

```
┌─────────────────┐
│  [+ NEW]        │ ← New Character Button
├─────────────────┤
│  Alice ●        │ ← Selected
│  ┌───────────┐  │
│  │ Thumbnail │  │
│  └───────────┘  │
│  [Actions...]   │
├─────────────────┤
│  Bob            │
│  ┌───────────┐  │
│  │ Thumbnail │  │
│  └───────────┘  │
│  [Actions...]   │
├─────────────────┤
│  Carol          │
│  ┌───────────┐  │
│  │ Thumbnail │  │
│  └───────────┘  │
│  [Actions...]   │
├─────────────────┤
│  Characters:    │
│  3 / 20         │
└─────────────────┘
```

### Character Card

**Expanded Card**:
```
┌─────────────────┐
│  Alice ●        │
│  ┌───────────┐  │
│  │           │  │
│  │ Thumbnail │  │
│  │ (140x140) │  │
│  │           │  │
│  └───────────┘  │
│                 │
│  [Edit Name]    │
│  [Duplicate]    │
│  [Delete]       │
└─────────────────┘
```

**Actions**:
- Click card: Load character
- Edit Name: Inline text edit
- Duplicate: Create copy
- Delete: Confirm modal → delete

---

## Interaction Flow

### Example: Changing Hair

1. User clicks 💇 **HAIR** icon
2. Camera smoothly animates to head close-up (600ms)
3. Right panel shows:
   - Hair color controls at top
   - 2-column grid of hair styles below
4. User adjusts hair color to purple
5. ALL hair thumbnails regenerate to show purple
6. User clicks "Long Ponytail" item card
7. Hair instantly appears on character in purple
8. User clicks 🔧 icon on equipped hair
9. Transform overlay appears
10. User adjusts hair position slightly
11. User clicks another category

### Example: Creating Complete Character

1. User clicks [+ NEW]
2. New character "Untitled 1" appears in list
3. Character shows in viewport (base body)
4. User clicks **PRESETS** button
5. Preset modal opens
6. User clicks "Casual Teen" preset
7. Character loads with preset configuration
8. User clicks 💇 **HAIR** to customize
9. Changes hair color to blue
10. Selects different hair style
11. Clicks 👕 **TOPS**
12. Changes shirt color to match hair
13. Continues customizing...
14. Auto-save triggers (character saved to database)

---

## Color Data Structure

### Per-Character Color Storage

```typescript
interface CharacterColors {
  hair: {
    primary: string // HEX color
  }

  tops: {
    primary: string
    secondary?: string // For two-tone items
  }

  pants: {
    primary: string
  }

  shoes: {
    primary: string
  }

  socks: {
    primary: string
  }

  accessories: {
    glasses?: string
    hats?: string
    // etc.
  }

  body: {
    skinTone: string
  }

  face: {
    eyes: string
    eyebrows: string
  }
}
```

### Color Application Logic

```typescript
// When applying color to character
applyColors(character: Character) {
  // Apply hair color to all equipped hair items
  character.equippedItems
    .filter(item => item.category === 'hair')
    .forEach(item => {
      setMaterialColor(item.mesh, character.colors.hair.primary)
    })

  // Apply tops color
  character.equippedItems
    .filter(item => item.category === 'tops')
    .forEach(item => {
      setMaterialColor(item.mesh, character.colors.tops.primary, 'primary')
      if (character.colors.tops.secondary) {
        setMaterialColor(item.mesh, character.colors.tops.secondary, 'secondary')
      }
    })

  // ... repeat for other categories
}
```

---

## Visual Design

### Color Palette

**UI Colors**:
```css
/* Primary */
--primary-blue: #3b82f6
--primary-blue-dark: #2563eb
--primary-blue-light: #eff6ff

/* Neutrals */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-600: #4b5563
--gray-900: #111827

/* States */
--success: #10b981
--warning: #f59e0b
--error: #ef4444
```

**3D Scene**:
```css
--scene-bg: #e5e7eb /* Light gray */
--grid-color: #d1d5db
--light-ambient: #ffffff
```

### Typography

```css
/* Font Family */
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

/* Sizes */
--text-xs: 11px   /* Small labels */
--text-sm: 13px   /* Item names */
--text-base: 15px /* Body text */
--text-lg: 17px   /* Section headers */
--text-xl: 20px   /* Panel headers */
```

### Spacing

```css
/* Grid */
--grid-gap: 12px
--panel-padding: 16px

/* Cards */
--card-padding: 12px
--card-radius: 8px
```

---

## Responsive Behavior

### Breakpoints

**Desktop (1920px)**:
- Full 3-column layout
- 2-column item grid
- All panels visible

**Desktop Small (1280px)**:
- Character list collapsible
- 2-column item grid maintained
- Smaller panel widths

**Tablet (1024px)**:
- Character list becomes overlay
- 2-column item grid maintained
- Right panel takes more space

**Mobile (768px)**:
- 1-column item grid
- Full-screen panels
- Bottom sheet navigation

---

## Performance Considerations

### Thumbnail Optimization

**Strategy**:
- Generate at 160x160px (display size)
- Use OffscreenCanvas for background rendering
- Cache aggressively
- Lazy load thumbnails outside viewport
- Debounce color changes (update after user stops adjusting)

### 3D Rendering

**Optimization**:
- Frustum culling
- LOD for distant items (if needed)
- Reuse materials where possible
- Limit active lights

### Memory Management

**Strategy**:
- Dispose unused geometries/materials
- Limit cached thumbnails (keep last 50)
- Lazy load item meshes (load on category open)

---

## Technical Architecture

### Component Structure

```
App
├── CharacterList
│   ├── NewCharacterButton
│   └── CharacterCard[]
│
├── Viewport3D
│   ├── Scene
│   ├── Camera (with presets)
│   ├── Controls
│   └── Character
│
└── RightPanel
    ├── CategoryNav
    │   └── CategoryIcon[]
    │
    ├── ColorSection
    │   ├── ColorWheel
    │   ├── HexInput
    │   └── RecentColors
    │
    ├── SubsectionNav (if applicable)
    │
    └── ItemGrid
        └── ItemCard[]
            ├── Thumbnail
            ├── Name
            └── TransformButton (if transformable)
```

### State Management

```typescript
interface AppState {
  // Characters
  characters: Character[]
  activeCharacter: string // ID

  // UI State
  activeCategory: Category
  activeSubsection?: string

  // Colors (per character)
  characterColors: Map<string, CharacterColors>

  // Items
  availableItems: Map<Category, Item[]>
  equippedItems: Map<string, EquippedItem[]> // Per character

  // Camera
  cameraPreset: CameraPreset

  // Thumbnails
  thumbnailCache: Map<string, ImageData>
}
```

---

## Implementation Phases

### Phase 1: Core Layout ✨
- [ ] Three-panel layout
- [ ] Category navigation icons
- [ ] Basic 2-column grid
- [ ] Character list panel
- [ ] 3D viewport setup

### Phase 2: Color System 🎨
- [ ] Color wheel component
- [ ] Shared color state management
- [ ] Color application to 3D models
- [ ] Recent colors storage
- [ ] Multi-channel color support

### Phase 3: Dynamic Thumbnails 📸
- [ ] Thumbnail generator
- [ ] Offscreen canvas rendering
- [ ] Color-aware thumbnail regeneration
- [ ] Thumbnail caching system
- [ ] Lazy loading

### Phase 4: Camera System 📷
- [ ] Camera preset definitions
- [ ] Smooth animation system
- [ ] Auto-positioning on category change
- [ ] Manual override support
- [ ] Reset functionality

### Phase 5: Item System 👕
- [ ] Item grid component
- [ ] Item card component
- [ ] Selection/equipping logic
- [ ] Multiple item support
- [ ] Subsection navigation

### Phase 6: Transform Controls 🔧
- [ ] Transform overlay UI
- [ ] XYZ sliders
- [ ] 3D gizmo integration
- [ ] Transform state persistence
- [ ] Reset to defaults

### Phase 7: Presets System 🎁
- [ ] Preset data structure
- [ ] Full character presets
- [ ] Category presets
- [ ] User preset saving
- [ ] Preset application logic

### Phase 8: Polish & Performance ✨
- [ ] Animations and transitions
- [ ] Loading states
- [ ] Error handling
- [ ] Performance optimization
- [ ] Responsive design

---

## Success Criteria

### Usability
- [ ] User can change category in < 1 second
- [ ] Color change updates all thumbnails in < 500ms
- [ ] Item selection provides instant visual feedback
- [ ] Camera animations feel smooth (60fps)
- [ ] No confusion about which color applies where

### Visual Quality
- [ ] Thumbnails clearly show item with correct color
- [ ] 2-column grid makes good use of space
- [ ] Icons are clear and intuitive
- [ ] Color wheel is easy to use
- [ ] Presets are visually appealing

### Performance
- [ ] 60fps in 3D viewport
- [ ] Thumbnail regeneration < 500ms
- [ ] Category switching < 800ms
- [ ] No memory leaks
- [ ] Smooth on mid-range hardware

---

## Summary

This design provides:

✅ **Image-First Interface** - Large thumbnails in 2-column grid
✅ **Gacha Life Color System** - Shared colors per category
✅ **Dynamic Thumbnails** - Show items in current color settings
✅ **Intelligent Camera** - Auto-positions for each category
✅ **Icon-Based Navigation** - Visual, minimal text
✅ **Preset System** - Quick character creation starting points
✅ **Flexible Layering** - Multiple items per category
✅ **Transform Controls** - For adjustable items
✅ **Scalable Architecture** - Easy to add new categories/items

**Status**: Ready for implementation 🚀

---

*This document supersedes all previous UI specifications.*
**Version**: 3.0 - Final
**Last Updated**: October 25, 2025
