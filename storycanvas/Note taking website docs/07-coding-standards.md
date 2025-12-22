# StoryCanvas Coding Standards & Visual Excellence Guide

## 🎓 Educational Project Philosophy

This is a **high school MVP project** designed to demonstrate technical excellence through **beautiful, readable code** and **stunning visual design**. We prioritize:

- ✅ **Code clarity and education**
- ✅ **Visual beauty and fluid interactions**  
- ✅ **User delight and engagement**
- ❌ ~~Corporate scalability~~
- ❌ ~~Enterprise security~~
- ❌ ~~Production optimization~~

---

## 📝 Code Readability Standards

### 1. Helpful Comments Everywhere

```typescript
// BAD - No context
const n = nodes.filter(n => n.t === 'c')

// GOOD - Explains intent and purpose
// Extract only character nodes from the canvas
// These will be used to populate the character selection dropdown
const characterNodes = canvasNodes.filter(node => node.type === 'character')
```

### 2. Descriptive Variable Names

```typescript
// BAD - Cryptic abbreviations
const cD = { x: 0, y: 0, w: 100, h: 100 }

// GOOD - Self-documenting
const characterNodeDimensions = {
  x: 0,
  y: 0,
  width: 100,
  height: 100
}
```

### 3. Function Documentation

```typescript
/**
 * Animates a node to a new position with a spring effect
 * This creates the satisfying "bounce" when nodes snap to grid
 * 
 * @param node - The Konva node to animate
 * @param targetX - Destination X coordinate
 * @param targetY - Destination Y coordinate
 * @param duration - Animation time in seconds (default: 0.3)
 */
function animateNodeToPosition(
  node: Konva.Node,
  targetX: number,
  targetY: number,
  duration: number = 0.3
) {
  // Implementation with helpful inline comments
}
```

### 4. Component Structure

```typescript
// Every component should follow this clear structure
export const CharacterNode: React.FC<CharacterNodeProps> = ({ 
  character, 
  onEdit, 
  onDelete 
}) => {
  // 1. State declarations - grouped logically
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  // 2. Refs for DOM/Canvas access
  const nodeRef = useRef<Konva.Group>(null)
  
  // 3. Effects - each with a comment explaining purpose
  useEffect(() => {
    // Add subtle pulse animation when node is selected
    // This helps users understand which node has focus
  }, [isSelected])
  
  // 4. Event handlers - named clearly
  const handleDoubleClick = () => {
    // Enter edit mode on double-click
    setIsEditing(true)
  }
  
  // 5. Render with clear structure
  return (
    <Group ref={nodeRef}>
      {/* Visual node representation */}
      <Rect />
      {/* Character name and details */}
      <Text />
    </Group>
  )
}
```

---

## 🎨 Visual Excellence Standards

### 1. Smooth Animations Everywhere

```typescript
// Every interaction should feel responsive and delightful
const nodeAnimation = {
  // Hover effect - subtle scale
  onMouseEnter: () => {
    node.to({
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 0.2,
      easing: Konva.Easings.EaseOut
    })
  },
  
  // Drag start - lift effect
  onDragStart: () => {
    node.to({
      scaleX: 1.1,
      scaleY: 1.1,
      shadowBlur: 15,
      shadowOpacity: 0.3,
      duration: 0.1
    })
  },
  
  // Drag end - satisfying drop
  onDragEnd: () => {
    node.to({
      scaleX: 1,
      scaleY: 1,
      shadowBlur: 5,
      shadowOpacity: 0.1,
      duration: 0.3,
      easing: Konva.Easings.BounceOut
    })
  }
}
```

### 2. Visual Hierarchy

```typescript
// Nodes should have clear visual states
const NodeStyles = {
  default: {
    fill: '#ffffff',
    stroke: '#e2e8f0',
    strokeWidth: 2,
    cornerRadius: 12,
    shadowColor: '#000',
    shadowBlur: 5,
    shadowOpacity: 0.1,
  },
  
  hover: {
    stroke: '#3b82f6',
    strokeWidth: 3,
    shadowBlur: 10,
    shadowOpacity: 0.15,
  },
  
  selected: {
    stroke: '#3b82f6',
    strokeWidth: 4,
    shadowColor: '#3b82f6',
    shadowBlur: 20,
    shadowOpacity: 0.3,
  },
  
  dragging: {
    opacity: 0.8,
    shadowBlur: 25,
    shadowOpacity: 0.4,
    shadowOffsetY: 5,
  }
}
```

### 3. Color Palette

```css
/* Use a cohesive, beautiful color system */
:root {
  /* Primary - Deep blue for primary actions */
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  
  /* Canvas - Subtle, non-distracting */
  --canvas-bg: #fafafa;
  --canvas-grid: #f0f0f0;
  
  /* Nodes - Clean whites with subtle shadows */
  --node-bg: #ffffff;
  --node-border: #e2e8f0;
  --node-shadow: rgba(0, 0, 0, 0.1);
  
  /* Text - High contrast, readable */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  
  /* Accent colors for different node types */
  --character-accent: #8b5cf6;
  --world-accent: #10b981;
  --plot-accent: #f59e0b;
  --mood-accent: #ec4899;
}

/* Dark mode should feel premium */
[data-theme="dark"] {
  --canvas-bg: #0f172a;
  --canvas-grid: #1e293b;
  --node-bg: #1e293b;
  --node-border: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
}
```

### 4. Micro-interactions

```typescript
// Every action should provide immediate feedback
const MicroInteractions = {
  // Button press effect
  buttonPress: {
    scale: 0.95,
    duration: 0.1,
  },
  
  // Node connection preview
  connectionPreview: {
    strokeDasharray: [5, 5],
    strokeDashoffset: {
      from: 0,
      to: 10,
      duration: 0.5,
      loop: true
    }
  },
  
  // Success feedback
  saveSuccess: {
    // Brief green flash on the node
    fill: '#10b981',
    duration: 0.2,
    yoyo: true,
  },
  
  // Subtle canvas reactions
  canvasClick: {
    // Ripple effect at click point
    ripple: true,
    rippleDuration: 0.6,
    rippleOpacity: 0.2
  }
}
```

---

## 🎯 UX Best Practices

### 1. Intuitive Interactions

```typescript
// Every interaction should be discoverable
const InteractionPatterns = {
  // Single click - Select
  onClick: 'select',
  
  // Double click - Edit
  onDoubleClick: 'edit',
  
  // Right click - Context menu
  onRightClick: 'contextMenu',
  
  // Drag - Move
  onDrag: 'move',
  
  // Shift + Drag - Multi-select
  onShiftDrag: 'multiSelect',
  
  // Hover - Preview/Highlight
  onHover: 'highlight'
}
```

### 2. Visual Feedback

```typescript
// Users should always know what's happening
const FeedbackStates = {
  loading: {
    cursor: 'wait',
    opacity: 0.6,
    spinner: true
  },
  
  draggable: {
    cursor: 'move',
    hoverScale: 1.02
  },
  
  editable: {
    cursor: 'text',
    borderStyle: 'dashed'
  },
  
  connecting: {
    cursor: 'crosshair',
    linePreview: true
  }
}
```

### 3. Smooth Transitions

```typescript
// Nothing should "jump" or feel jarring
const TransitionDefaults = {
  duration: 300, // ms
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Smooth ease
  
  // Stagger animations for multiple elements
  stagger: 50, // ms between each element
  
  // Enter/exit animations
  enter: {
    opacity: [0, 1],
    scale: [0.9, 1],
    duration: 400
  },
  
  exit: {
    opacity: [1, 0],
    scale: [1, 0.9],
    duration: 200
  }
}
```

---

## 💎 Canvas Beauty Standards

### 1. Node Design Principles

```typescript
// Nodes should feel tangible and delightful
const NodeDesign = {
  // Soft, rounded corners
  cornerRadius: 12,
  
  // Subtle shadows for depth
  shadow: {
    color: 'rgba(0, 0, 0, 0.1)',
    blur: 10,
    offsetY: 2
  },
  
  // Gradient backgrounds for character nodes
  characterGradient: {
    start: '#8b5cf6',
    end: '#7c3aed',
    direction: 'diagonal'
  },
  
  // Glass morphism effect for selected nodes
  glassMorphism: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  }
}
```

### 2. Connection Lines

```typescript
// Connections should be elegant and clear
const ConnectionStyle = {
  // Bezier curves for organic feel
  type: 'bezier',
  
  // Animated dash for active connections
  activeDash: {
    strokeDasharray: [10, 5],
    animation: 'flow'
  },
  
  // Gradient along connection line
  gradient: {
    from: 'sourceNodeColor',
    to: 'targetNodeColor'
  },
  
  // Arrow heads that scale with zoom
  arrow: {
    pointerLength: 8,
    pointerWidth: 10,
    fill: 'auto'
  }
}
```

### 3. Canvas Grid

```typescript
// Subtle grid that doesn't distract
const GridStyle = {
  // Dot grid, not lines
  type: 'dots',
  
  // Adaptive opacity based on zoom
  opacity: {
    min: 0.1,
    max: 0.3,
    zoomFactor: 'inverse'
  },
  
  // Spacing that feels right
  spacing: 20,
  
  // Subtle animation on canvas pan
  parallax: {
    enabled: true,
    factor: 0.05
  }
}
```

---

## 🚀 Performance Without Complexity

### Simple Optimizations

```typescript
// Basic performance that matters for smooth UX
const SimpleOptimizations = {
  // Debounce saves
  autoSave: debounce(saveToLocalStorage, 1000),
  
  // Throttle drag updates
  onDrag: throttle(updateNodePosition, 16), // 60fps
  
  // Lazy load images
  images: {
    loading: 'lazy',
    placeholder: 'blur'
  },
  
  // Only render visible nodes (simple viewport check)
  renderNodes: nodes.filter(node => isInViewport(node))
}
```

---

## 📚 File Organization

```
src/
├── components/
│   ├── canvas/
│   │   ├── Canvas.tsx          // Main canvas component
│   │   ├── CanvasControls.tsx  // Zoom, pan controls
│   │   └── GridBackground.tsx  // Beautiful grid
│   │
│   ├── nodes/
│   │   ├── TextNode.tsx        // Basic text node
│   │   ├── CharacterNode.tsx   // Character profile node
│   │   ├── ImageNode.tsx       // Mood board images
│   │   └── NodeBase.tsx        // Shared node behaviors
│   │
│   └── ui/
│       ├── Button.tsx           // Beautiful button
│       ├── Modal.tsx            // Smooth modal
│       └── Tooltip.tsx          // Helpful tooltips
│
├── hooks/
│   ├── useCanvas.ts            // Canvas state management
│   ├── useAnimation.ts         // Animation helpers
│   └── useDragDrop.ts          // Drag behavior
│
├── utils/
│   ├── animations.ts           // Animation presets
│   ├── colors.ts               // Color system
│   └── geometry.ts             // Position calculations
│
└── styles/
    ├── globals.css             // Base styles
    ├── themes.css              // Light/dark themes
    └── animations.css          // Keyframe animations
```

---

## ✨ The Final Touch

### Making It Memorable

```typescript
// Small details that make the project stand out
const MemorableDetails = {
  // Custom cursor on canvas
  canvasCursor: 'custom-grab-cursor.svg',
  
  // Particle effect on node creation
  onCreate: 'particle-burst',
  
  // Sound effects (subtle)
  sounds: {
    nodeConnect: 'soft-click.mp3',
    nodeCreate: 'pop.mp3',
    save: 'success-chime.mp3'
  },
  
  // Easter egg animations
  konami: 'rainbow-nodes-mode',
  
  // Smooth page transitions
  pageTransition: 'fade-scale',
  
  // Loading states that delight
  loadingAnimation: 'creative-spinner'
}
```

---

## 🎯 Remember

This is a **school project** meant to:
1. **Showcase your coding skills** through clear, documented code
2. **Demonstrate design sense** with beautiful visuals
3. **Create something memorable** that stands out
4. **Learn and have fun** while building

**Don't worry about:**
- Handling 10,000 users
- Perfect security
- Database optimization
- Cross-browser support for IE
- Mobile responsiveness (unless you want to)

**Do focus on:**
- Making it beautiful
- Making it smooth
- Making it intuitive
- Making it impressive
- Making the code educational

The goal is to create something that makes people say "Wow, a high school student built this?"