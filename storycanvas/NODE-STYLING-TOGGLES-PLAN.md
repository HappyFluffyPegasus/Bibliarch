# 🎨 **Essential Node Styling Toggles - Implementation Plan**

**Date**: September 29, 2025
**Feature**: Core Visual Customization for Node Appearance
**Priority**: High Impact Visual Enhancement

---

## **🎯 Essential Toggles Only**

### **📐 Core Visual Structure (Priority 1)**

#### **1. Sharp vs Rounded Corners**
```css
/* Sharp */
border-radius: 0px;

/* Rounded */
border-radius: 8px;
```
**Impact**: Completely changes visual feel (modern vs classic)
**Necessity**: High - Fundamental design preference

#### **2. Outline Toggle**
```css
/* With Outline */
border: 2px solid var(--node-border-default);

/* No Outline */
border: none;
box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* Subtle definition */
```
**Impact**: Clean borderless vs defined structure
**Necessity**: High - Major visual distinction

#### **3. Shadow Toggle**
```css
/* With Shadow */
box-shadow: 0 2px 8px rgba(0,0,0,0.15);

/* No Shadow */
box-shadow: none;
```
**Impact**: Flat design vs dimensional depth
**Necessity**: High - Affects entire canvas feel

### **📝 Content & Spacing (Priority 2)**

#### **4. Text Weight**
```css
/* Normal */
font-weight: 400;

/* Bold */
font-weight: 600;
```
**Impact**: Content emphasis and readability
**Necessity**: Medium - User preference for text prominence

#### **5. Node Padding**
```css
/* Compact */
padding: 8px 12px;

/* Spacious */
padding: 16px 20px;
```
**Impact**: Information density vs breathing room
**Necessity**: Medium - Affects workflow and aesthetics

#### **6. Text Alignment**
```css
/* Left Aligned */
text-align: left;

/* Center Aligned */
text-align: center;
```
**Impact**: Professional layout preference
**Necessity**: Medium - Layout consistency choice

---

## **🛠️ Implementation Architecture**

### **Data Structure:**
```typescript
interface NodeStylePreferences {
  // Core visual toggles
  corners: 'sharp' | 'rounded'           // border-radius
  outlines: 'visible' | 'hidden'        // border visibility
  shadows: 'enabled' | 'disabled'       // drop shadow

  // Content toggles
  textWeight: 'normal' | 'bold'         // font-weight
  padding: 'compact' | 'spacious'       // internal spacing
  textAlign: 'left' | 'center'          // text alignment
}
```

### **CSS System:**
```css
/* Base node classes with CSS variables */
.node-base {
  border-radius: var(--node-border-radius, 8px);
  border: var(--node-border, 2px solid var(--node-border-default));
  box-shadow: var(--node-shadow, 0 2px 8px rgba(0,0,0,0.15));
  padding: var(--node-padding, 12px 16px);
  font-weight: var(--node-font-weight, 400);
  text-align: var(--node-text-align, left);
}

/* Toggle-specific modifier classes */
.node-sharp { --node-border-radius: 0px; }
.node-rounded { --node-border-radius: 8px; }

.node-outlined { --node-border: 2px solid var(--node-border-default); }
.node-borderless {
  --node-border: none;
  --node-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.node-shadowed { --node-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.node-flat { --node-shadow: none; }

.node-compact { --node-padding: 8px 12px; }
.node-spacious { --node-padding: 16px 20px; }

.node-bold { --node-font-weight: 600; }
.node-normal { --node-font-weight: 400; }

.node-center { --node-text-align: center; }
.node-left { --node-text-align: left; }
```

---

## **🎛️ User Interface Design**

### **Toggle Panel Location:**
**Right Sidebar Section** - Below existing controls
```
┌─────────────────────────┐
│ [Existing Tools]       │
├─────────────────────────┤
│ 🎨 NODE STYLE          │
├─────────────────────────┤
│ Corners  [○] [●]       │ ← Sharp/Rounded
│          Sharp Rounded  │
├─────────────────────────┤
│ Outline  [●] [○]       │ ← Show/Hide
│          Show  Hide     │
├─────────────────────────┤
│ Shadow   [●] [○]       │ ← On/Off
│          On    Off      │
├─────────────────────────┤
│ Text     [●] [○]       │ ← Normal/Bold
│          Normal Bold    │
├─────────────────────────┤
│ Padding  [●] [○]       │ ← Compact/Spacious
│          Compact Roomy  │
├─────────────────────────┤
│ Align    [●] [○]       │ ← Left/Center
│          Left Center    │
└─────────────────────────┘
```

### **Toggle Component:**
```typescript
interface StyleToggle {
  label: string
  options: [string, string]              // [option1, option2]
  current: string
  onChange: (value: string) => void
  icons?: [JSX.Element, JSX.Element]     // Optional icons
}

// Example usage
<StyleToggle
  label="Corners"
  options={['sharp', 'rounded']}
  current={stylePrefs.corners}
  onChange={(value) => updateStyle('corners', value)}
  icons={[<Square />, <RoundedSquare />]}
/>
```

---

## **⚙️ Technical Implementation**

### **State Management:**
```typescript
// Add to existing Zustand store
interface CanvasState {
  // ... existing state
  nodeStylePreferences: NodeStylePreferences

  // Actions
  updateNodeStyle: (key: keyof NodeStylePreferences, value: string) => void
  resetNodeStyles: () => void
}

// Default preferences
const defaultNodeStyles: NodeStylePreferences = {
  corners: 'rounded',
  outlines: 'visible',
  shadows: 'enabled',
  textWeight: 'normal',
  padding: 'compact',
  textAlign: 'left'
}
```

### **CSS Class Application:**
```typescript
// In HTMLCanvas.tsx
const getNodeClasses = (nodeType: string, stylePrefs: NodeStylePreferences) => {
  const baseClasses = 'node-base border-2 rounded-lg p-3'

  const styleClasses = [
    stylePrefs.corners === 'sharp' ? 'node-sharp' : 'node-rounded',
    stylePrefs.outlines === 'visible' ? 'node-outlined' : 'node-borderless',
    stylePrefs.shadows === 'enabled' ? 'node-shadowed' : 'node-flat',
    stylePrefs.textWeight === 'bold' ? 'node-bold' : 'node-normal',
    stylePrefs.padding === 'spacious' ? 'node-spacious' : 'node-compact',
    stylePrefs.textAlign === 'center' ? 'node-center' : 'node-left'
  ].join(' ')

  return `${baseClasses} ${styleClasses}`
}

// Apply to all node rendering
<div className={getNodeClasses(node.type, nodeStylePreferences)}>
  {/* Node content */}
</div>
```

### **Persistence:**
```typescript
// Save preferences to localStorage
const saveStylePreferences = (prefs: NodeStylePreferences) => {
  localStorage.setItem('storycanvas-node-styles', JSON.stringify(prefs))
}

// Load on app initialization
const loadStylePreferences = (): NodeStylePreferences => {
  const saved = localStorage.getItem('storycanvas-node-styles')
  return saved ? JSON.parse(saved) : defaultNodeStyles
}
```

---

## **📋 Implementation Phases**

### **Phase 1: Core Visual Toggles (Week 1)**
- [ ] **CSS System Setup** - CSS variables and modifier classes
- [ ] **Sharp vs Rounded** - Border radius toggle
- [ ] **Outline Toggle** - Border visibility
- [ ] **Shadow Toggle** - Drop shadow on/off
- [ ] **Basic UI Panel** - Simple toggle interface

**Deliverable**: Core visual appearance fully customizable

### **Phase 2: Content & Spacing (Week 2)**
- [ ] **Text Weight Toggle** - Normal vs bold text
- [ ] **Padding Toggle** - Compact vs spacious spacing
- [ ] **Text Alignment** - Left vs center alignment
- [ ] **Polish UI Panel** - Clean, organized toggle interface
- [ ] **Persistence** - Save user preferences

**Deliverable**: Complete node styling system

### **Phase 3: Integration & Polish (Week 3)**
- [ ] **Apply to All Node Types** - Ensure consistency across all nodes
- [ ] **Performance Testing** - CSS changes don't impact performance
- [ ] **Dark Mode Compatibility** - Toggles work in both themes
- [ ] **User Testing** - Verify toggle combinations look good
- [ ] **Documentation** - Update user guides

**Deliverable**: Production-ready styling system

---

## **🎯 Success Criteria**

### **Visual Impact:**
- ✅ **Immediate Difference** - Each toggle creates obvious visual change
- ✅ **Cohesive Combinations** - All toggle combinations look professional
- ✅ **Theme Compatibility** - Works with existing color system

### **User Experience:**
- ✅ **Intuitive Controls** - Toggle purpose is immediately clear
- ✅ **Live Preview** - Changes apply instantly to canvas
- ✅ **Preference Persistence** - Settings remembered between sessions

### **Technical Quality:**
- ✅ **Performance** - No impact on canvas rendering speed
- ✅ **Consistency** - All node types respect style preferences
- ✅ **Maintainability** - Clean CSS architecture for future additions

---

## **🔧 File Changes Required**

### **New Files:**
```
src/components/ui/
├── node-style-panel.tsx      # Main styling toggle panel
└── style-toggle.tsx          # Reusable toggle component

src/lib/
└── node-styles.ts            # Style utilities and defaults
```

### **Modified Files:**
```
src/components/canvas/HTMLCanvas.tsx    # Apply style classes to nodes
src/app/globals.css                     # Add CSS variable system
src/store/canvas-store.ts               # Add style preferences state
```

---

## **💡 Future Considerations**

### **Potential Additions (After Core Implementation):**
- **Icon Size Toggle** - Small vs normal node type icons
- **Animation Toggle** - Disable transitions for performance
- **Hover Effect Intensity** - Subtle vs prominent hover states

### **Advanced Features (Much Later):**
- **Custom Style Presets** - Save multiple style combinations
- **Per-Node-Type Styles** - Different styles for different node types
- **Import/Export Styles** - Share style preferences

---

## **✅ Definition of Done**

- ✅ All 6 essential toggles implemented and functional
- ✅ Clean, intuitive toggle interface in sidebar
- ✅ CSS system uses variables for maintainability
- ✅ All node types respect style preferences
- ✅ Preferences persist between sessions
- ✅ No performance regressions
- ✅ Works with both light and dark themes
- ✅ User testing confirms toggles improve experience

**This focused implementation provides maximum visual impact with only essential, high-value customization options.**