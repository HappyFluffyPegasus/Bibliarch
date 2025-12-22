# Updated Design Specification
**Version**: 2.0 - Polished & Finalized
**Date**: October 24, 2025
**Status**: Ready for Implementation

---

## Overview

This document defines the complete UI/UX design for the 3D Character Creator, eliminating unnecessary complexity while maintaining full customization power. This spec is optimized for AI-assisted development.

---

## Core Design Rules

### Mesh Architecture
* ✅ Every item is a **standalone mesh** with origin at mesh center
* ✅ **Multiple clothing items simultaneously** allowed (layer multiple shirts, etc.)
* ✅ Items are independent - no enforced exclusivity except face features

### Transform Controls Policy
**Transformable Items** (full XYZ position/rotation/scale):
- Hair (all styles)
- Skirts
- Accessories (glasses, future items)
- Any item flagged as `transformable: true`

**Non-Transformable Items** (color-only):
- Standard clothing (shirts, pants, socks, shoes)
- Body (skin tone only)

### Color System
- **Color wheel** (hue + saturation/value) instead of swatches
- All items support recoloring (if material allows)
- Multi-channel selector for items with multiple colorable parts

### Face System
- **Image replacement** system (not transforms)
- Small rig-alignment presets only
- Categories: Eyes, Eyebrows, Mouth
- **One active asset per category** (mutually exclusive)

---

## UI Layout

### Three-Column Structure

```
┌─────────────┬──────────────────────────┬─────────────────┐
│             │                          │                 │
│  Character  │       3D Viewport        │  Category Tabs  │
│    List     │   (Orbit/Pan/Zoom)       │   & Item List   │
│             │                          │                 │
│  [+ New]    │    [3D Model Here]       │  ☰ Body         │
│             │                          │  👤 Face        │
│  Alice ●    │    Click mesh to         │  💇 Hair        │
│  Bob        │    select & highlight    │  👕 Clothing    │
│  Carol      │                          │  ✨ Accessories │
│             │                          │  🎭 Poses       │
│             │                          │                 │
└─────────────┴──────────────────────────┴─────────────────┘
```

### Left Panel: Character List
- **Add** new character
- **Duplicate** existing character
- **Delete** character
- **Select** character (switches entire workspace to that character)
- Selected character marked with ● indicator

### Center: 3D Viewport
- Orbit, pan, zoom controls
- **Click mesh to select** and highlight it
- Selected mesh shows visual highlight
- 3D transform gizmo visible when editing transformable items

### Right Panel: Category Tabs
Vertical tab strip (Sims CAS style):
- **Body** - Skin tone only
- **Face** - Eyes, Eyebrows, Mouth (image sets)
- **Hair** - Single-piece hairstyles
- **Clothing** (expandable sub-tabs)
  - Tops
  - Bottoms
  - Skirts *(transformable)*
  - Socks
  - Shoes
- **Accessories**
  - Glasses *(transformable)*
  - *(Future items)*
- **Poses** - Animation previews only (no rig editing)

---

## Item Row Layout

Each item in the list follows this exact structure:

```
┌────────────────────────────────────────────────────────────┐
│ [Icon] [Item Name]  [🎨 Color] [🔧 Transform (if allowed)] │
└────────────────────────────────────────────────────────────┘
```

### Components:
- **Icon**: 80x80px thumbnail preview
- **Item Name**: Display name
- **Color Wheel Button**: 🎨 Opens color picker
- **Transform Button**: 🔧 Only visible on transformable items

---

## Transform Overlay

**Appears for**: Hair, Skirts, Accessories (glasses), and any `transformable: true` items

**Layout**: Side panel or overlay next to item row

### Controls Required:

**Position (XYZ)**
- X: ━━━●━━━ [-10 to +10]
- Y: ━━━●━━━ [-10 to +10]
- Z: ━━━●━━━ [-10 to +10]

**Rotation (XYZ)**
- X: ━━━●━━━ [-180° to +180°]
- Y: ━━━●━━━ [-180° to +180°]
- Z: ━━━●━━━ [-180° to +180°]

**Scale (XYZ)**
- X: ━━━●━━━ [0.5 to 2.0]
- Y: ━━━●━━━ [0.5 to 2.0]
- Z: ━━━●━━━ [0.5 to 2.0]
- 🔗 Uniform Scale Toggle (lock aspect ratio)

**Gizmo Controls**
- Mode Toggle: `Move | Rotate | Scale`
- Space Toggle: `Local | World`
- 3D gizmo visible in viewport during editing

**Actions**
- ↺ Reset to Default
- ✓ Apply (or auto-apply on change)

### Skirt-Specific Notes
Skirts use the **exact same controls** as hair/accessories. Full XYZ transform freedom to allow users to position/adjust as needed.

---

## Color Wheel System

**Available for**: All items (including non-transformable clothing)

### Layout:
```
┌─────────────────────────────┐
│  ⭕ Hue Wheel                │
│  ┌─────────┐                │
│  │ Sat/Val │                │
│  │  Square │                │
│  └─────────┘                │
│                             │
│  HEX: #______               │
│                             │
│  Recent Colors:             │
│  ⬜⬜⬜⬜⬜                   │
│                             │
│  Multi-Channel Selector:    │
│  ○ Primary  ○ Secondary     │
│  (if applicable)            │
└─────────────────────────────┘
```

### Features:
- **Hue Wheel** + **Saturation/Value Square**
- **Hex input** field for precise colors
- **Recent colors** list (per character, last 5-10)
- **Multi-channel selector** for items with multiple colorable parts
- **Live updates** to material as color changes

---

## Multiple Clothing Items Logic

### Layering System:
- ✅ **Multiple items allowed**: Want 2 shirts? Go for it.
- ✅ Each mesh is **independent**
- ✅ Standard clothing auto-positions correctly (no transform needed)
- ✅ Transformable items (skirts) can be adjusted to resolve overlap if desired

### Example Use Cases:
- Layer tank top + jacket
- Wear multiple accessories
- Combine different skirt styles (if transformable)

---

## Hair System

### Properties:
- One mesh per hairstyle
- **Always transformable** (position, rotation, scale)
- **Color wheel** available for all hair
- **Transform overlay** available for all hair

### UI Flow:
1. Select hair from list
2. Hair appears on character
3. Click 🎨 to change color
4. Click 🔧 to adjust position/rotation/scale
5. Use gizmo in viewport for visual adjustment

---

## Accessories System

### Current Items:
- Glasses

### Properties:
- **Always transformable**
- Full position/rotation/scale control
- Color wheel support

### Future Expansion:
- Hats
- Wings
- Props
- Jewelry
- Any item can join this system

---

## Face System (Rig-Toggle)

### Architecture:
**Image plane replacement** system (NOT transform sliders)

### Categories:
1. **Eyes** - One active at a time
2. **Eyebrows** - One active at a time
3. **Mouth** - One active at a time

### Face Alignment Presets:
Instead of transform sliders, provide simple position presets:
- ⬤ Center (default)
- ⬆ Slight Up
- ⬇ Slight Down
- ⬅ Slight Left
- ➡ Slight Right

### How It Works:
1. User selects eye style from list
2. Image plane swaps instantly
3. User selects alignment preset if needed
4. **No manual sliders** - presets only
5. **No makeup overlays** - removed from spec

---

## Equipped Items Strip

### Location:
Top of each category tab

### Display:
```
Currently Equipped:
┌─────┬─────┬─────┐
│Item1│Item2│Item3│  [🎨][🔧]
└─────┴─────┴─────┘
```

### Features:
- Shows all equipped items in current category
- Each item shows thumbnail
- Color Wheel 🎨 and Transform 🔧 buttons (if applicable)
- **Double-click item**: Focus camera on that mesh
- **Click once**: Select for editing (highlights in viewport)

---

## Interaction Patterns

### Selection & Focus:
- **Click mesh in viewport**: Select and highlight
- **Click item in list**: Equip/toggle item
- **Double-click equipped item**: Focus camera on mesh
- **Highlight indicator**: Shows "selected for editing"

### Overlays:
- Transform overlay appears next to selected item
- Color wheel appears as modal/panel
- **Click outside overlay**: Closes overlay

### Bottom Toolbar:
- ↶ Undo
- ↷ Redo
- Other global actions

---

## Content Requirements Per Item

Each item in the system needs:

### Required Data:
```typescript
interface ItemData {
  id: string                    // Unique identifier
  displayName: string           // Human-readable name
  category: string              // 'hair' | 'tops' | 'skirts' | etc.

  // Assets
  thumbnailUrl: string          // 80x80px preview image
  meshFile: string              // Path to mesh file

  // Material system
  materialChannels: {
    name: string                // Display name
    materialName: string        // Three.js material name
    supportsColor: boolean      // Can be recolored?
  }[]

  // Transform system
  transformable: boolean        // Enable transform controls?
  defaultTransform: {
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
  }

  // Face system (if face item)
  facePresets?: {
    center: [number, number, number]
    slightUp: [number, number, number]
    slightDown: [number, number, number]
    slightLeft: [number, number, number]
    slightRight: [number, number, number]
  }
}
```

---

## Technical Notes

### Material System:
- Materials support live color updates
- Multi-channel items have separate material references
- Color changes apply immediately to 3D mesh

### Transform System:
- Gizmo uses Three.js TransformControls
- Transforms stored per character per item
- Reset button restores `defaultTransform` values

### Face System:
- Image planes use UV-mapped quads
- Alignment presets are pre-calculated positions
- Swap is instant (no animation)

---

## What's NOT Included

### Explicitly Removed:
- ❌ Makeup overlays (nuked)
- ❌ CSS-based appearance system (gone)
- ❌ Save/Export UI (handled separately)
- ❌ Manual face transform sliders (presets only)
- ❌ Pose rig editing (previews only)

---

## Future Extensions

### Potential Additions:
- More accessory types (hats, wings, jewelry)
- Additional face categories (nose, ears, markings)
- Prop system (items held in hands)
- Background/environment selection
- Lighting presets

All future items follow the same patterns:
- Categorized in tab system
- Color wheel if applicable
- Transform controls if flagged
- Content data structure as defined above

---

## Summary

This spec provides:
- ✅ Clean, Sims-inspired UI structure
- ✅ Flexible layering system for clothing
- ✅ Transform controls only where needed
- ✅ Color wheel for all recolorable items
- ✅ Simple face alignment presets (no complex sliders)
- ✅ No unnecessary complexity
- ✅ Ready for AI-assisted implementation

**Status**: Ready to implement 🚀

---

*This document supersedes all previous specifications regarding makeup, CSS-based systems, and transform policies.*

**Last Updated**: October 24, 2025
**Version**: 2.0 - Final
