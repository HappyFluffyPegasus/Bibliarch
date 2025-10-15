# **Bibliarch Timeline System Implementation Plan**

## **Overview**
A simplified, storyboard-style timeline system that focuses on visual storytelling rather than precise scheduling. Event nodes become storyboard panels that writers can use to outline their story visually, with duration giving a sense of pacing.

---

## **Storyboard-Style Event Node Design**

### **Visual Layout (Portrait, Storyboard-Like):**
```
┌─────────────────────────┐
│ 📅 Event Title Here    │ ← Title area (larger, bold)
├─────────────────────────┤
│                         │
│ Brief summary of what   │ ← Body text area
│ happens in this event.  │   (expandable, main focus)
│ Multiple lines of       │
│ description text...     │
│                         │
│ Can include character   │
│ actions, dialogue       │
│ snippets, scene         │
│ details, emotional      │
│ beats, plot points...   │
│                         │
│                         │
├─────────────────────────┤
│ ▓▓▓▓▓░░░░░ 3 days      │ ← Duration bar + label
└─────────────────────────┘
```

### **Node Dimensions:**
- **Shape**: Tall rectangle (portrait orientation)
- **Size**: Default 220px wide x 280px tall (taller than wide)
- **Layout**: Title at top, large text area in middle, duration bar at bottom
- **Icon**: Calendar icon in title area (smaller, integrated)

### **Simplified Event Properties:**
```typescript
interface EventNode extends Node {
  type: 'event'
  title: string           // Event title (replaces generic 'text')
  summary: string         // Main description/body text
  duration?: number       // Simple duration (1, 2, 3 days, etc.)
  durationUnit?: 'minutes' | 'hours' | 'days' | 'weeks'
  sequenceOrder?: number  // Optional: manual ordering (1, 2, 3...)
}
```

---

## **Duration System (Simple)**

### **Duration Input Options:**
- **Quick Buttons**: "1 day", "2 days", "1 week" buttons for common durations
- **Custom Input**: Simple number + unit dropdown
- **Visual Feedback**: Duration bar updates in real-time

### **Duration Bar Visualization:**
```
Duration Examples:
▓░░░░░░░░░ 1 day
▓▓▓░░░░░░░ 3 days
▓▓▓▓▓▓▓░░░ 1 week
▓▓▓▓▓▓▓▓▓▓ 2 weeks (max)
```

### **Duration Bar System:**
- **Visual Bar**: Colored progress-style bar at bottom
- **Duration Input**: Simple dropdown or number input
- **Bar Fill**: Longer duration = more filled bar
- **Duration Label**: Shows "3 days" or "2 hours" next to bar

---

## **Timeline Mode (Simplified)**

### **Storyboard Sequence View:**
```
┌───────────────────────────────────────────────────────────────────────────┐
│                         TIMELINE SEQUENCE MODE                            │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│ ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐                │
│ │📅 Event │ →  │📅 Event │ →  │📅 Event │ →  │📅 Event │                │ ← Flow arrows
│ │   #1    │    │   #2    │    │   #3    │    │   #4    │                │
│ │         │    │         │    │         │    │         │                │
│ │ Opening │    │ Conflict│    │ Climax  │    │ Ending  │                │
│ │ scene   │    │ begins  │    │ battle  │    │ scene   │                │
│ │ where   │    │ when... │    │ where   │    │ where   │                │
│ │ protag  │    │         │    │ hero    │    │ loose   │                │
│ │ meets   │    │         │    │ faces   │    │ ends    │                │
│ │ mentor  │    │         │    │ villain │    │ tied up │                │
│ │         │    │         │    │         │    │         │                │
│ │▓▓▓░░░░░░│    │▓▓▓▓▓░░░░│    │▓▓░░░░░░░│    │▓▓▓▓░░░░░│                │ ← Duration bars
│ │ 2 days  │    │ 4 days  │    │ 1 day   │    │ 3 days  │                │
│ └─────────┘    └─────────┘    └─────────┘    └─────────┘                │
│                                                                           │
│ [Manual Mode] [Sequence Mode] | [← Previous] [Next →] | [⊞ Fit All]      │ ← Simple controls
└───────────────────────────────────────────────────────────────────────────┘
```

---

## **Event Node Editing (In-Place)**

### **Title Editing:**
- Click title to edit inline (like current text nodes)
- Larger, bold font for event titles
- Auto-save on blur
- Placeholder: "Event Title"

### **Summary Editing:**
- Click body area to edit (main content area)
- Multi-line text input
- Auto-expanding text area
- Placeholder: "Describe what happens in this event..."
- Supports rich content: character actions, dialogue snippets, scene details, emotional beats, plot points

### **Duration Editing:**
- Click duration bar/label to open simple duration picker
- Dropdown with common options: "30 min", "1 hour", "2 hours", "1 day", "2 days", "1 week"
- Or simple number input + unit selector

---

## **Sequence Mode Features**

### **Auto-Arrangement:**
- Events automatically arrange left-to-right in sequence
- Flow arrows connect events in order
- Drag to reorder sequence
- No complex date calculations needed

### **Simple Controls:**
- **Manual Mode**: Free positioning (current canvas mode)
- **Sequence Mode**: Auto-arranged timeline flow
- **Navigation**: Previous/Next buttons to scroll through long sequences
- **Fit All**: Auto-zoom to show all events

---

## **Storyboard Integration**

### **Visual Storytelling Focus:**
- Events look like storyboard panels (portrait orientation)
- Focus on "what happens" rather than "when exactly"
- Duration gives sense of pacing without exact timing
- Summary area encourages detailed scene description

### **Story Flow:**
- Events connect visually with flow arrows
- Clear beginning → middle → end progression
- Easy to see story pacing through duration bars
- Simple reordering by dragging events

### **Content Organization:**
- **Title**: Brief, punchy event name
- **Summary**: Rich description area for:
  - Character actions and motivations
  - Key dialogue snippets
  - Scene setting and mood
  - Plot developments
  - Emotional beats
  - Visual details

---

## **Implementation Phases**

### **Phase 1: Enhanced Event Node Layout**
- Redesign event nodes with portrait orientation (220px w × 280px h)
- Create title/summary/duration layout
- Add duration input system with simple picker
- Implement visual duration bar

### **Phase 2: Sequence Mode**
- Add timeline mode toggle button
- Implement auto-arrangement of events in sequence
- Add flow arrows between events
- Create navigation controls

### **Phase 3: Polish & Usability**
- Add quick duration buttons
- Implement drag-to-reorder in sequence mode
- Add fit-all and navigation controls for long sequences
- Polish visual styling and interactions

---

## **Technical Requirements**

### **New Node Type Structure:**
```typescript
interface EventNode extends Node {
  type: 'event'
  title: string
  summary: string
  duration?: number
  durationUnit?: 'minutes' | 'hours' | 'days' | 'weeks'
  sequenceOrder?: number
  width: 220     // Fixed width
  height: 280    // Fixed height (taller than wide)
}
```

### **Timeline Mode State:**
```typescript
interface TimelineState {
  isTimelineMode: boolean
  sequenceOrder: string[]  // Array of event node IDs in sequence
  autoArrange: boolean
}
```

---

## **User Workflow Example:**

1. **Create Event**: User clicks "Event" tool and places event node on canvas
2. **Add Content**: User clicks title area, types "Hero's Journey Begins"
3. **Add Summary**: User clicks body area, types detailed scene description
4. **Set Duration**: User clicks duration bar, selects "2 days" from dropdown
5. **Sequence Mode**: User toggles to sequence mode to see story flow
6. **Reorder**: User drags events to reorder sequence as needed
7. **Navigate**: User uses navigation controls to scroll through long story

**Result**: Visual storyboard of story events with clear pacing and flow, perfect for writers planning their narrative structure!

---

## **Success Metrics:**
- Event creation in under 3 clicks
- Intuitive content editing with rich text support
- Clear visual progression in sequence mode
- Easy reordering and navigation
- Focus on storytelling over scheduling

---

## **Implementation Progress Report**

### **Phase 1: Enhanced Event Node Layout - ✅ COMPLETED**
- ✅ **Event Node Interface**: Added `title?: string`, `summary?: string`, `durationText?: string`, `sequenceOrder?: number` to Node interface
- ✅ **Portrait Layout**: Implemented 220px wide × 280px tall storyboard-style layout with 3 sections:
  - Title area with calendar icon and inline editing
  - Summary area (main content) with multi-line text support
  - Duration input area with free-form text input
- ✅ **Color System Integration**: Event nodes now use chosen color palette instead of individual node colors
- ✅ **Template System**: Created timeline template with 7 preset event nodes in linear horizontal arrangement
- ✅ **Auto-resize Functionality**: Event nodes resize based on content like text nodes
- ✅ **List Container Support**: Event nodes work properly inside list containers

### **Phase 2: Timeline Template - ✅ COMPLETED**
- ✅ **Timeline Folder Template**: Added `'folder-canvas-timeline-folder'` template with 7 connected events
- ✅ **Template Loading Logic**: Updated page.tsx to handle `timeline-folder` cases properly
- ✅ **Linear Layout**: All events arranged in single horizontal line for clear story progression
- ✅ **Instruction Node**: Added explanatory text node with user guidance

### **Major Issues Encountered & Current Status:**

#### **🚨 CRITICAL ISSUE - Typing Backwards Problem (UNRESOLVED)**
**Problem**: When typing in event node title or summary fields, cursor jumps to beginning
**Status**: ❌ **STILL BROKEN** - Multiple attempted fixes have failed

**Attempted Fixes (All Failed):**
1. ❌ **Cursor Position Preservation**: Applied same technique used in working text nodes - cursor still jumps
2. ❌ **Remove Immediate State Updates**: Disabled onInput state updates, only update on blur - still broken
3. ❌ **Remove JSX Content**: Removed `{node.title || 'New Event'}` content from contentEditable divs - still broken
4. ❌ **Empty ContentEditable Pattern**: Made divs completely empty like working text nodes - still broken
5. ❌ **Initialization Effect**: Added proper initialization in useEffect like other nodes - still broken
6. ❌ **Debounced Auto-resize**: Increased delay, removed from onInput, added to blur - still broken

**Current State**: Event nodes have the exact same structure as working text nodes but still exhibit typing backwards behavior

#### **Next Steps Required:**
1. **🔥 URGENT: Debug typing backwards issue** - Need to identify what makes event nodes different from text nodes
2. **Investigate potential causes:**
   - React key conflicts in event node rendering
   - Auto-resize function interference specific to event nodes
   - State management issues in 3-section layout
   - CSS styling conflicts causing re-renders
   - Event handler conflicts between title/summary sections
3. **Consider alternative approaches:**
   - Disable all auto-resize for event nodes temporarily
   - Use refs instead of state for event node content
   - Implement event nodes as separate components
   - Copy working text node implementation exactly

### **Technical Files Modified:**
- **HTMLCanvas.tsx**: Event node rendering, auto-resize logic, cursor preservation, initialization
- **templates.ts**: Timeline template with 7 preset events
- **page.tsx**: Timeline template loading logic
- **layout.tsx**: Removed notification toaster

### **Phase 3: Sequence Mode - ⏳ PENDING**
- ⏸️ **On Hold**: Cannot proceed until typing issue is resolved
- **Planned Features**: Flow arrows, auto-arrangement, navigation controls

### **Critical Blockers:**
1. **Typing backwards issue** prevents basic usability of event nodes
2. User experience is severely impacted - cannot type normally in event fields
3. All advanced timeline features depend on basic text editing working properly