# Bibliarch MVP - Data Models Reference

## Quick Reference

### Story
The top-level container for a project.

```typescript
interface Story {
  id: string
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
}
```

---

## Notes Tab (Canvas)

### Canvas Node
```typescript
interface CanvasNode {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: 'text' | 'character' | 'event' | 'location' | 'folder' |
        'list' | 'image' | 'table' | 'relationship-canvas' |
        'line' | 'compact-text'
  text?: string
  content?: string
  color?: string
  imageUrl?: string
  profileImageUrl?: string
  linkedCanvasId?: string
  parentId?: string
  childIds?: string[]
  zIndex?: number
  // ... additional properties per node type
}
```

### Canvas Connection
```typescript
interface CanvasConnection {
  id: string
  from: string        // Node ID
  to: string          // Node ID
  type?: 'leads-to' | 'conflicts-with' | 'relates-to' | 'relationship'
  label?: string
}
```

### Canvas Data
```typescript
interface CanvasData {
  id: string
  storyId: string
  canvasType: string  // 'main', 'folder-xxx', 'character-xxx'
  nodes: CanvasNode[]
  connections: CanvasConnection[]
}
```

---

## Characters Tab

### Character Appearance
```typescript
interface CharacterAppearance {
  visibleAssets: string[]    // Mesh names that are visible
  colors: CategoryColors
  transforms?: Record<string, Transform>
}

interface Transform {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

interface CategoryColors {
  hair: string
  tops: { primary: string; secondary?: string }
  pants: string
  dresses: string
  shoes: string
  socks: string
  accessories: string
  body: { skinTone: string; eyeColor: string }
}
```

### Character
```typescript
interface Character {
  id: string
  storyId: string
  name: string
  createdAt: Date
  appearance: CharacterAppearance

  // Free-form personality fields (all optional)
  backstory?: string
  outlookOnLife?: string
  favoriteFood?: string
  favoriteColor?: string
  customFields?: Record<string, string>  // Additional user-defined fields
}
```

---

## Timeline Tab

### Character State (at a point in time)
```typescript
interface CharacterState {
  characterId: string
  stateDescription: string  // Free-form text
  location?: string
  emotionalState?: string
}
```

### Relationship State (at a point in time)
```typescript
interface RelationshipState {
  fromCharacterId: string
  toCharacterId: string
  relationshipType: string  // Free-form (not preset)
  description: string
  strength: 1 | 2 | 3      // weak, medium, strong
}
```

### Timeline Event
```typescript
interface TimelineEvent {
  id: string
  storyId: string
  title: string
  description: string
  order: number              // Position on timeline
  track: number              // 0 = main track, 1+ = parallel tracks
  duration?: string          // "3 days", "instant", etc.
  linkedSceneId?: string     // Optional linked scene
  characterStates: CharacterState[]
  relationshipStates: RelationshipState[]
  color?: string
}
```

---

## Scene Tab

### Position Keyframe
```typescript
interface PositionKeyframe {
  time: number  // in seconds
  position: [number, number, number]
  rotation?: [number, number, number]
}
```

### Scene Element
```typescript
interface SceneElement {
  id: string
  type: 'character' | 'prop'
  characterId?: string       // If type is 'character'
  propType?: string          // If type is 'prop'
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  keyframes: PositionKeyframe[]  // For animation during playback
}
```

### Dialogue Line
```typescript
interface DialogueLine {
  id: string
  characterId: string
  text: string
  startTime: number   // in seconds
  duration: number    // in seconds
}
```

### Camera Keyframe
```typescript
interface CameraKeyframe {
  time: number
  position: [number, number, number]
  target: [number, number, number]  // Look-at point
  fov?: number
}
```

### Scene
```typescript
interface Scene {
  id: string
  storyId: string
  title: string
  description?: string
  linkedTimelineEventId?: string
  duration: number              // Total duration in seconds
  elements: SceneElement[]
  dialogue: DialogueLine[]
  cameraKeyframes: CameraKeyframe[]
  backgroundMusic?: string
  createdAt: Date
  updatedAt: Date
}
```

---

## World Tab

### Terrain Data
```typescript
interface TerrainData {
  width: number
  height: number
  heightMap: number[][]  // 2D array of height values
  baseColor: string
}
```

### Building
```typescript
interface Building {
  id: string
  type: 'primitive-cube' | 'primitive-plane' | 'preset-house' | 'preset-shop' | 'custom'
  name: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: string
  interiorId?: string  // Links to interior space (future)
}
```

### Decoration
```typescript
interface Decoration {
  id: string
  type: 'tree' | 'bush' | 'rock' | 'lamp' | 'bench' | 'custom'
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color?: string
}
```

### Path
```typescript
interface PathPoint {
  x: number
  z: number
}

interface Path {
  id: string
  points: PathPoint[]
  width: number
  color: string
  type: 'road' | 'sidewalk' | 'dirt'
}
```

### World
```typescript
interface World {
  id: string
  storyId: string
  name: string
  terrain: TerrainData
  buildings: Building[]
  decorations: Decoration[]
  paths: Path[]
}
```

---

## Master Documents

### Master Doc
```typescript
interface MasterDoc {
  id: string
  storyId: string
  filename: string
  content: string      // Parsed text content
  uploadedAt: Date
}
```

---

## Zustand Store Structure

```typescript
interface StoryState {
  // All stories
  stories: Story[]
  currentStoryId: string | null

  // Story data (indexed by storyId)
  canvasData: Record<string, CanvasData[]>
  characters: Record<string, Character[]>
  timelineEvents: Record<string, TimelineEvent[]>
  scenes: Record<string, Scene[]>
  worlds: Record<string, World>
  masterDocs: Record<string, MasterDoc[]>

  // Actions
  createStory(title, description): Story
  updateStory(id, updates): void
  deleteStory(id): void
  setCurrentStory(id): void

  saveCanvasData(storyId, canvasType, nodes, connections): void
  getCanvasData(storyId, canvasType): CanvasData | undefined

  addCharacter(storyId, character): void
  updateCharacter(storyId, characterId, updates): void
  deleteCharacter(storyId, characterId): void

  addTimelineEvent(storyId, event): void
  updateTimelineEvent(storyId, eventId, updates): void
  deleteTimelineEvent(storyId, eventId): void
  reorderTimelineEvents(storyId, events): void

  addScene(storyId, scene): void
  updateScene(storyId, sceneId, updates): void
  deleteScene(storyId, sceneId): void

  saveWorld(storyId, world): void

  addMasterDoc(storyId, doc): void
  deleteMasterDoc(storyId, docId): void
}
```

---

## localStorage Key

All data persisted under: `bibliarch-mvp-storage`

---

*Document created: December 2024*
*For: Bibliarch MVP Development*
