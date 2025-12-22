# Character Creator - Technical Specification & Plan

## Document Information
**Project**: Custom Character Creator for Story-Sim Game
**Phase**: Foundation - Character Creation Only
**Version**: 1.0
**Last Updated**: 2025-10-23

---

## 1. Executive Summary

### 1.1 Purpose
Build a standalone 3D character creator that allows users to design custom low-poly characters for their story-simulation game. Characters will be created from modular Blender-exported assets and saved to integrate with an existing notes system.

### 1.2 Scope
**In Scope:**
- 3D character viewer with orbit controls
- Asset swapping system (hair, clothes, accessories)
- Armature controls (pose + scale)
- Character save/load to Supabase database
- Support for up to 20 characters per user (Later a greater number)
- Animations (Mixamo integration soon)

**Out of Scope (Future Phases):**
- Integration with existing StoryCanvas notes system
- Game modes (Life/Story modes)
- AI features
- World rendering
- Character interactions

### 1.3 Deliverables
1. Web-based character creator application
2. Integration with existing Supabase backend
3. Character configuration save/load system
4. Asset management system
5. UI for character customization
6. Documentation for future Electron packaging

---

## 2. Technical Architecture

### 2.1 Technology Stack

**Frontend Framework:**
- **Base**: HTML5 + Modern JavaScript (ES6+)
- **3D Rendering**: Three.js (r160+)
- **UI Framework**: React 19 (matches existing Next.js setup)
- **Styling**: Tailwind CSS (matches existing stack)
- **State Management**: Zustand (lightweight, matches existing stack)

**Backend Integration:**
- **Database**: Supabase PostgreSQL (existing)
- **Storage**: Supabase Storage for GLB files
- **Auth**: Supabase Auth (existing system)

**Development:**
- **Language**: TypeScript with JSDoc comments
- **Build Tool**: Vite (fast, simple)
- **Package Manager**: npm (matches existing)

**Future Packaging:**
- **Desktop**: Electron (planned)
- **Distribution**: Standalone executable

### 2.2 Project Structure
```
CC/
├── public/
│   └── models/
│       └── Neighbor Base V12.glb
├── src/
│   ├── components/
│   │   ├── Viewer3D.tsx          # Three.js scene component
│   │   ├── AssetPanel.tsx        # Asset selection UI
│   │   ├── ArmatureControls.tsx  # Bone manipulation sliders
│   │   ├── CharacterList.tsx     # Saved characters sidebar
│   │   └── SaveLoadPanel.tsx     # Save/load/export controls
│   ├── lib/
│   │   ├── three-setup.ts        # Three.js initialization
│   │   ├── model-loader.ts       # GLB loading and caching
│   │   ├── asset-manager.ts      # Asset visibility toggling
│   │   ├── armature-controller.ts # Bone manipulation
│   │   └── supabase.ts           # Database client (existing)
│   ├── store/
│   │   └── character-store.ts    # Zustand state management
│   ├── types/
│   │   └── character.ts          # TypeScript definitions
│   └── App.tsx                    # Main application
├── 01-vision.md                   # Overall game vision
├── 02-character-creator-spec.md   # This document
├── 03-tech.md                     # Notes system tech doc
├── project_info.md                # Confirmed details
└── package.json
```

### 2.3 Architecture Diagram
```
┌─────────────────────────────────────────────────┐
│              Character Creator UI                │
│  ┌──────────────┐  ┌───────────┐  ┌──────────┐ │
│  │ Asset Panel  │  │  3D View  │  │ Armature │ │
│  │ - Hair       │  │ (Three.js)│  │ Controls │ │
│  │ - Clothes    │  │           │  │ - Pose   │ │
│  │ - Access.    │  │           │  │ - Scale  │ │
│  └──────────────┘  └───────────┘  └──────────┘ │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │      Character List & Save/Load          │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↓ ↑
              ┌───────────────┐
              │    Zustand    │
              │  State Store  │
              └───────────────┘
                      ↓ ↑
              ┌───────────────┐
              │   Supabase    │
              │  - Database   │
              │  - Storage    │
              └───────────────┘
                      ↓ ↑
              ┌───────────────┐
              │  Notes System │
              │ (StoryCanvas) │
              └───────────────┘
```

---

## 3. Data Structures

### 3.1 Character Configuration Schema

```typescript
interface CharacterConfig {
  id: string                    // UUID
  user_id: string              // From Supabase Auth
  character_profile_id?: string // Link to notes system character
  name: string
  created_at: Date
  updated_at: Date

  // Asset selections
  assets: {
    baseBody: string           // Mesh name
    hair?: string              // Mesh name or null
    top?: string
    bottom?: string
    shoes?: string
    accessories?: string[]     // Multiple accessories
  }

  // Armature state
  armatures: {
    pose: BoneTransform[]      // Pose armature bone rotations
    scale: BoneTransform[]     // Scale armature bone scales
  }

  // Camera state (for thumbnail)
  camera: {
    position: [number, number, number]
    target: [number, number, number]
    zoom: number
  }

  // Metadata
  thumbnail?: string           // Base64 or URL
  glb_url?: string            // Supabase Storage URL
}

interface BoneTransform {
  boneName: string
  rotation?: [number, number, number]  // Euler angles
  scale?: [number, number, number]     // XYZ scale
  position?: [number, number, number]  // XYZ position
}
```

### 3.2 Asset Catalog Schema

```typescript
interface AssetCatalog {
  baseBody: string[]           // Available base body options
  hair: AssetOption[]
  tops: AssetOption[]
  bottoms: AssetOption[]
  shoes: AssetOption[]
  accessories: AssetOption[]
}

interface AssetOption {
  id: string                   // Unique identifier
  name: string                 // Display name
  meshName: string            // Actual mesh name in GLB
  category: string            // Asset category
  thumbnail?: string          // Preview image
}
```

### 3.3 Supabase Database Schema

```sql
-- New table for character creator
CREATE TABLE character_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  character_profile_id UUID REFERENCES characters(id) ON DELETE SET NULL,

  name TEXT NOT NULL,

  -- Main configuration stored as JSONB
  config JSONB NOT NULL,

  -- Quick access fields (denormalized for queries)
  thumbnail_url TEXT,
  glb_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_character_models_user_id ON character_models(user_id);

-- Index for character profile links
CREATE INDEX idx_character_models_profile_id ON character_models(character_profile_id);

-- RLS Policies (Row Level Security)
ALTER TABLE character_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own character models"
  ON character_models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own character models"
  ON character_models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own character models"
  ON character_models FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own character models"
  ON character_models FOR DELETE
  USING (auth.uid() = user_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_character_models_updated_at
  BEFORE UPDATE ON character_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 4. Core Features Specification

### 4.1 3D Viewer

**Requirements:**
- Load and display GLB model from Blender export
- Orbit camera controls (rotate, pan, zoom)
- Proper lighting for low-poly aesthetic
- Grid floor for spatial reference
- Smooth 60fps performance
- Responsive canvas (fills available space)

**Technical Implementation:**
```typescript
// Three.js Scene Setup
- PerspectiveCamera (FOV: 50, aspect: auto)
- WebGLRenderer with antialiasing
- OrbitControls from three/examples
- Lighting:
  - AmbientLight (0.6 intensity)
  - DirectionalLight (0.8 intensity)
  - HemisphereLight for natural look
- GridHelper for ground reference
```

**Camera Defaults:**
```typescript
position: [0, 1.6, 3]    // Eye level, 3 units back
target: [0, 1, 0]        // Look at torso height
near: 0.1
far: 1000
```

### 4.2 Asset Management System

**Requirements:**
- Parse GLB file to identify all meshes
- Categorize meshes based on naming convention
- Toggle visibility of specific meshes
- Only one asset per category active (except accessories)
- Real-time updates in 3D view
- Asset selection persists in state

**Mesh Naming Convention Detection:**
```typescript
// Expected naming patterns (to be confirmed with actual GLB)
Base_Body_*
Hair_*
Top_*
Bottom_*
Shoes_*
Accessory_*

// Auto-categorization logic
const categorize = (meshName: string): string => {
  if (meshName.startsWith('Base_')) return 'baseBody'
  if (meshName.startsWith('Hair_')) return 'hair'
  if (meshName.startsWith('Top_')) return 'top'
  if (meshName.startsWith('Bottom_')) return 'bottom'
  if (meshName.startsWith('Shoes_')) return 'shoes'
  if (meshName.startsWith('Accessory_')) return 'accessories'
  return 'unknown'
}
```

**Asset Switching Logic:**
```typescript
// When user selects new hair
1. Hide current hair mesh (if any)
2. Show selected hair mesh
3. Update state
4. Mark as modified (enable save button)
```

### 4.3 Armature Controls

**Requirements:**
- Two separate armature systems:
  - **Pose Armature**: Bone rotations for character pose
  - **Scale Armature**: Bone scales for proportions (height, head size)
- UI sliders for each controllable bone
- Real-time updates in 3D view
- Reset to default pose/scale
- Smooth interpolation on changes

**Controllable Bones (to be confirmed from GLB):**
```typescript
// Pose Armature (rotations)
- Head
- Neck
- Spine (upper, mid, lower)
- Shoulders (L/R)
- Arms (L/R)
- Hands (L/R)
- Hips
- Legs (L/R)
- Feet (L/R)

// Scale Armature (scales)
- Height (overall)
- Head size
- Torso length
- Arm length
- Leg length
```

**UI Controls:**
```typescript
// Slider component for each bone
<Slider
  label="Head Rotation X"
  min={-45}
  max={45}
  step={1}
  value={headRotX}
  onChange={(value) => updateBone('Head', 'rotationX', value)}
/>

// Organized in collapsible sections
- Upper Body
- Lower Body
- Proportions (Scale)
```

### 4.4 Save/Load System

**Requirements:**
- Save character configuration to Supabase
- Load existing characters from database
- Character list sidebar
- Create new character (reset to defaults)
- Duplicate character
- Delete character
- Auto-save on changes (debounced)
- Manual save button
- Export character as JSON

**Save Flow:**
```typescript
1. User makes changes (asset/armature)
2. State updates via Zustand
3. Debounced save triggers (2 seconds after last change)
4. Generate thumbnail (canvas screenshot)
5. Serialize configuration to JSON
6. Upsert to Supabase character_models table
7. Show save confirmation
```

**Load Flow:**
```typescript
1. User selects character from list
2. Fetch config from Supabase
3. Parse JSON configuration
4. Apply asset selections (show/hide meshes)
5. Apply armature transforms
6. Update camera position
7. Load complete
```

### 4.5 Character List Sidebar

**Requirements:**
- Display all user's characters (max 20)
- Character thumbnails
- Character names (editable)
- Creation date
- Last modified date
- Click to load
- Visual indication of currently loaded character
- Search/filter by name
- Sort by: name, date created, date modified

**UI Layout:**
```
┌─────────────────────────┐
│  My Characters (3/20)   │
├─────────────────────────┤
│ [+] New Character       │
├─────────────────────────┤
│ ┌─────┐ Alice           │
│ │ img │ Created: 10/20  │
│ └─────┘ Modified: 10/23 │ ← Selected
├─────────────────────────┤
│ ┌─────┐ Bob             │
│ │ img │ Created: 10/21  │
│ └─────┘ Modified: 10/22 │
├─────────────────────────┤
│ ┌─────┐ Carol           │
│ │ img │ Created: 10/22  │
│ └─────┘ Modified: 10/22 │
└─────────────────────────┘
```

### 4.6 Integration with Notes System

**Requirements:**
- Link character model to character profile in notes system
- Fetch character names from notes for auto-fill
- Display character description from notes (read-only)
- Optional: Suggest appearance from notes using AI (future)

**Link Flow:**
```typescript
1. User creates new character in creator
2. Option to "Link to Story Character"
3. Dropdown shows characters from notes system
4. Select character profile
5. Auto-fill name from profile
6. Store character_profile_id in config
7. Display link in UI
```

---

## 5. User Interface Specification

### 5.1 Layout

**Desktop Layout (1920x1080):**
```
┌────────────────────────────────────────────────────────┐
│  Character Creator                    [User] [Settings] │
├──────────┬────────────────────────────┬────────────────┤
│          │                            │                │
│ Character│                            │   Asset        │
│ List     │      3D Viewer             │   Panel        │
│          │    (Three.js Canvas)       │                │
│ [New]    │                            │ Hair:          │
│          │                            │  ○ Style 1     │
│ Alice    │                            │  ● Style 2     │
│ Bob      │                            │  ○ Style 3     │
│ Carol    │                            │                │
│          │                            │ Top:           │
│          │                            │  ● Shirt 1     │
│ (3/20)   │                            │  ○ Shirt 2     │
│          │                            │                │
├──────────┴────────────────────────────┴────────────────┤
│            Armature Controls                            │
│  [Pose] [Scale]                                         │
│  Head Rot X:  [────●─────] 0°                          │
│  Head Rot Y:  [─────●────] 5°                          │
│                                        [Reset] [Save]   │
└────────────────────────────────────────────────────────┘
```

**Responsive Breakpoints:**
- Desktop: 1200px+ (3-column layout)
- Tablet: 768px-1199px (2-column, collapsible sidebar)
- Mobile: <768px (1-column, tabs for panels)

### 5.2 Color Scheme

**Following Existing StoryCanvas Theme:**
```css
:root {
  /* Light Mode */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent: #3b82f6;
  --border: #e5e5e5;

  /* Dark Mode */
  --dark-bg-primary: #1a1a1a;
  --dark-bg-secondary: #2a2a2a;
  --dark-text-primary: #ffffff;
  --dark-text-secondary: #a0a0a0;
  --dark-accent: #60a5fa;
  --dark-border: #404040;

  /* 3D Scene */
  --scene-bg: #2a2a2a;
  --grid-color: #404040;
}
```

### 5.3 Components Breakdown

**Component 1: Viewer3D**
- Three.js canvas
- Auto-resize on window change
- Loading spinner while model loads
- FPS counter (dev mode)

**Component 2: AssetPanel**
- Collapsible sections per category
- Radio buttons for single-select (hair, top, bottom, shoes)
- Checkboxes for multi-select (accessories)
- Thumbnail previews (if available)
- "None" option to hide category

**Component 3: ArmatureControls**
- Tabs: Pose | Scale
- Accordion sections for body regions
- Slider inputs with numeric display
- Reset to default button (per bone or all)
- Copy/paste pose (JSON)

**Component 4: CharacterList**
- Virtualized list (if >20 items in future)
- Thumbnail generation on save
- Inline name editing
- Right-click context menu (duplicate, delete, export)
- Drag-to-reorder (future)

**Component 5: SaveLoadPanel**
- Current character name (editable)
- Link to notes character (dropdown)
- Save button (disabled if no changes)
- Auto-save indicator
- Export options (JSON, GLB future)

---

## 6. Technical Implementation Plan

### 6.1 Phase 1: Project Setup (Week 1)

**Tasks:**
1. Initialize Vite + React + TypeScript project
2. Install dependencies (Three.js, Zustand, Tailwind, Supabase)
3. Set up project structure (folders, files)
4. Configure Tailwind CSS
5. Set up Supabase client (use existing config)
6. Create base layout components
7. Set up dev environment

**Deliverables:**
- Working dev server
- Basic UI layout (no 3D yet)
- Supabase connection verified

**Code Example:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001  // Different from Next.js (3000)
  }
})
```

### 6.2 Phase 2: 3D Viewer Foundation (Week 1-2)

**Tasks:**
1. Create Three.js scene setup
2. Implement basic camera and lighting
3. Load GLB file (Neighbor Base V12.glb)
4. Add OrbitControls
5. Render loop
6. Responsive canvas sizing
7. Basic UI to inspect loaded model

**Deliverables:**
- Working 3D viewer
- Model loads and displays
- Camera controls functional
- Model structure inspection (console log all meshes and bones)

**Code Example:**
```typescript
// lib/three-setup.ts
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export function createScene(canvas: HTMLCanvasElement) {
  // Scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x2a2a2a)

  // Camera
  const camera = new THREE.PerspectiveCamera(
    50,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 1.6, 3)

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
  })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)

  // Controls
  const controls = new OrbitControls(camera, canvas)
  controls.target.set(0, 1, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 5)
  scene.add(directionalLight)

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4)
  scene.add(hemiLight)

  // Grid
  const grid = new THREE.GridHelper(10, 10, 0x404040, 0x404040)
  scene.add(grid)

  return { scene, camera, renderer, controls }
}
```

### 6.3 Phase 3: Model Analysis & Asset System (Week 2)

**Tasks:**
1. Inspect loaded GLB to identify all meshes
2. Identify naming patterns
3. Identify armature bones
4. Create asset catalog from mesh names
5. Build asset-manager.ts to toggle visibility
6. Create AssetPanel UI component
7. Test asset switching

**Deliverables:**
- Complete asset catalog (JSON)
- Working asset toggle system
- UI to select assets
- Visual confirmation in 3D view

**Code Example:**
```typescript
// lib/model-loader.ts
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export async function loadModel(url: string) {
  const loader = new GLTFLoader()

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        // Inspect structure
        const meshes: THREE.Mesh[] = []
        const bones: THREE.Bone[] = []

        gltf.scene.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            meshes.push(node)
          }
          if (node instanceof THREE.Bone) {
            bones.push(node)
          }
        })

        console.log('Loaded meshes:', meshes.map(m => m.name))
        console.log('Loaded bones:', bones.map(b => b.name))

        resolve({ scene: gltf.scene, meshes, bones, gltf })
      },
      undefined,
      reject
    )
  })
}
```

### 6.4 Phase 4: Armature Controls (Week 3)

**Tasks:**
1. Identify pose armature vs scale armature
2. Create bone manipulation functions
3. Build ArmatureControls UI component
4. Implement sliders for rotations
5. Implement sliders for scales
6. Add reset functionality
7. Test and refine ranges

**Deliverables:**
- Working bone manipulation
- Slider UI for all controllable bones
- Reset to default pose
- Smooth real-time updates

**Code Example:**
```typescript
// lib/armature-controller.ts
export function setBoneRotation(
  bone: THREE.Bone,
  axis: 'x' | 'y' | 'z',
  degrees: number
) {
  const radians = THREE.MathUtils.degToRad(degrees)

  switch(axis) {
    case 'x': bone.rotation.x = radians; break
    case 'y': bone.rotation.y = radians; break
    case 'z': bone.rotation.z = radians; break
  }
}

export function setBoneScale(
  bone: THREE.Bone,
  axis: 'x' | 'y' | 'z',
  scale: number
) {
  switch(axis) {
    case 'x': bone.scale.x = scale; break
    case 'y': bone.scale.y = scale; break
    case 'z': bone.scale.z = scale; break
  }
}
```

### 6.5 Phase 5: State Management (Week 3)

**Tasks:**
1. Create Zustand store for character state
2. Implement state for asset selections
3. Implement state for armature transforms
4. Connect UI components to store
5. Implement dirty state tracking
6. Add undo/redo (optional)

**Deliverables:**
- Centralized state management
- All components connected to store
- State persists during session
- Modified indicator

**Code Example:**
```typescript
// store/character-store.ts
import { create } from 'zustand'
import { CharacterConfig } from '../types/character'

interface CharacterStore {
  currentCharacter: CharacterConfig | null
  characters: CharacterConfig[]
  isDirty: boolean

  // Actions
  setAsset: (category: string, meshName: string) => void
  setBoneTransform: (armature: string, boneName: string, transform: any) => void
  saveCharacter: () => Promise<void>
  loadCharacter: (id: string) => Promise<void>
  createNewCharacter: () => void
  deleteCharacter: (id: string) => Promise<void>
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  currentCharacter: null,
  characters: [],
  isDirty: false,

  setAsset: (category, meshName) => {
    set((state) => ({
      currentCharacter: {
        ...state.currentCharacter!,
        assets: {
          ...state.currentCharacter!.assets,
          [category]: meshName
        }
      },
      isDirty: true
    }))
  },

  // ... more actions
}))
```

### 6.6 Phase 6: Database Integration (Week 4)

**Tasks:**
1. Create Supabase migration for character_models table
2. Run migration on database
3. Implement save function (upsert)
4. Implement load function (fetch by ID)
5. Implement list function (fetch all user's characters)
6. Implement delete function
7. Test RLS policies
8. Handle errors gracefully

**Deliverables:**
- Working save to database
- Working load from database
- Character list populates from DB
- Error handling and loading states

**Code Example:**
```typescript
// lib/character-db.ts
import { supabase } from './supabase'
import { CharacterConfig } from '../types/character'

export async function saveCharacter(config: CharacterConfig) {
  const { data, error } = await supabase
    .from('character_models')
    .upsert({
      id: config.id,
      user_id: config.user_id,
      name: config.name,
      config: config,
      thumbnail_url: config.thumbnail,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function loadCharacter(id: string) {
  const { data, error } = await supabase
    .from('character_models')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data.config as CharacterConfig
}

export async function listCharacters(userId: string) {
  const { data, error } = await supabase
    .from('character_models')
    .select('id, name, thumbnail_url, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}
```

### 6.7 Phase 7: Polish & Features (Week 4-5)

**Tasks:**
1. Thumbnail generation (canvas screenshot)
2. Auto-save with debouncing
3. Character name editing
4. Link to notes system characters
5. Export character as JSON
6. Keyboard shortcuts
7. Loading states and spinners
8. Error messages and validation
9. Responsive design
10. Dark mode support

**Deliverables:**
- Polished UI/UX
- All features complete
- Responsive on all screen sizes
- Error handling complete

### 6.8 Phase 8: Testing & Documentation (Week 5)

**Tasks:**
1. Test all features thoroughly
2. Test on different screen sizes
3. Test with 20 characters
4. Performance testing
5. Write user guide
6. Write developer documentation
7. Create demo video/screenshots
8. Prepare for handoff

**Deliverables:**
- Fully tested application
- User documentation
- Developer documentation
- Demo materials

---

## 7. Integration with Existing Systems

### 7.1 Supabase Integration

**Reuse Existing Setup:**
- Use same Supabase project as StoryCanvas
- Reuse auth tokens (users already logged in)
- Share user accounts
- New table: character_models

**Environment Variables:**
```bash
# .env (reuse from StoryCanvas)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Auth Flow:**
```typescript
// User is already authenticated via StoryCanvas
// Character creator checks auth state
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  // Redirect to StoryCanvas login
  window.location.href = 'http://localhost:3000/login'
}
```

### 7.2 Link to Notes System

**Character Profile Link:**
```typescript
// Fetch characters from notes system
const { data: characters } = await supabase
  .from('characters')
  .select('id, profile_data->name, profile_data->description')
  .eq('story_id', currentStoryId)

// Display in dropdown for linking
<select onChange={(e) => linkToProfile(e.target.value)}>
  <option value="">No link</option>
  {characters.map(char => (
    <option value={char.id}>{char.name}</option>
  ))}
</select>
```

**Benefits of Linking:**
- Auto-fill character name
- Display character description for reference
- Future: AI suggests appearance from description
- Data consistency across systems

### 7.3 Future Game Engine Integration

**Export Format:**
```json
{
  "character_id": "uuid",
  "name": "Alice",
  "glb_url": "supabase_storage_url",
  "assets": {
    "baseBody": "Base_Female_01",
    "hair": "Hair_Long_Ponytail",
    "top": "Top_Tshirt_Blue",
    "bottom": "Bottom_Jeans_Dark",
    "shoes": "Shoes_Sneakers_White"
  },
  "armatures": {
    "pose": [...],
    "scale": [...]
  },
  "profile_link": "character_profile_id"
}
```

**Game Engine Will:**
1. Fetch character configs from Supabase
2. Load GLB from storage URL
3. Apply asset visibility
4. Apply armature transforms
5. Load Mixamo animations
6. Render in game world

---

## 8. Performance Requirements

### 8.1 Target Metrics

**Load Times:**
- GLB model initial load: < 2 seconds
- Character switch: < 500ms
- Asset toggle: < 100ms (instant)
- Save to database: < 1 second

**Frame Rate:**
- 3D viewer: 60fps minimum
- UI interactions: 60fps
- Armature adjustments: 60fps (smooth)

**Optimization Strategies:**
- GLB caching (load once, reuse)
- Frustum culling (Three.js default)
- Debounced save (2s delay)
- Virtualized character list (if >20)
- Lazy load thumbnails

### 8.2 Browser Support

**Target Browsers:**
- Chrome 90+ (primary)
- Firefox 88+
- Edge 90+
- Safari 14+ (if possible)

**Required Features:**
- WebGL 2.0
- ES6+ JavaScript
- LocalStorage
- Fetch API

---

## 9. Security & Data Privacy

### 9.1 Row Level Security (RLS)

**Supabase RLS Policies:**
- Users can only see their own characters
- Users can only modify their own characters
- Users can only create under their own user_id
- No public access to character_models table

### 9.2 Data Validation

**Client-Side:**
- Character name: 1-50 characters
- Max 20 characters per user
- Valid JSON for config
- Valid UUIDs

**Server-Side:**
- Supabase enforces RLS
- Database constraints on user_id (foreign key)
- Max characters enforced by application logic

### 9.3 No Sensitive Data

**Character configs contain:**
- ✓ Asset selections (safe)
- ✓ Bone transforms (safe)
- ✓ Camera positions (safe)
- ✓ Thumbnails (safe)
- ✗ No passwords, API keys, or PII

---

## 10. Future Enhancements (Post-MVP)

### 10.1 Phase 2 Features

**Animations:**
- Mixamo animation integration
- Animation player in viewer
- Multiple animation clips
- Animation blending

**Advanced Customization:**
- Material/texture swapping
- Color customization (hair, clothes)
- Morph targets (facial expressions)
- Procedural variation

**Export:**
- Export character as GLB
- Export as FBX
- Batch export all characters
- 3D print-ready export

### 10.2 Phase 3 Features

**Social:**
- Share characters with other users
- Character marketplace/gallery
- Import community characters
- Character tags and search

**AI Features:**
- Generate appearance from text description
- Auto-generate character from notes
- Suggest variations
- Pose suggestions

### 10.3 Electron Desktop App

**Packaging:**
```json
{
  "name": "character-creator",
  "main": "electron/main.js",
  "scripts": {
    "electron": "electron .",
    "build:electron": "vite build && electron-builder"
  }
}
```

**Benefits:**
- Offline usage
- Faster file access
- Native file dialogs
- No browser limitations
- Standalone distribution

---

## 11. Development Timeline

### Week 1: Foundation
- ✓ Project setup
- ✓ Basic UI layout
- ⚙️ Three.js viewer
- ⚙️ Load GLB model

### Week 2: Asset System
- ⚙️ Model analysis
- ⚙️ Asset catalog creation
- ⚙️ Asset toggle system
- ⚙️ Asset panel UI

### Week 3: Armatures & State
- ⚙️ Armature controls
- ⚙️ State management
- ⚙️ UI polish

### Week 4: Database & Save
- ⚙️ Supabase integration
- ⚙️ Save/load system
- ⚙️ Character list
- ⚙️ Thumbnails

### Week 5: Polish & Launch
- ⚙️ Final features
- ⚙️ Testing
- ⚙️ Documentation
- ✓ MVP complete

**Total Time: 5 weeks**

---

## 12. Success Criteria

### MVP Launch Checklist

**Core Features:**
- [ ] Load and display 3D character model
- [ ] Toggle between different hair options
- [ ] Toggle between different clothing options
- [ ] Toggle between different accessories
- [ ] Adjust pose armature (at least 5 bones)
- [ ] Adjust scale armature (height, head size)
- [ ] Save character to database
- [ ] Load character from database
- [ ] Display list of saved characters (up to 20)
- [ ] Delete character
- [ ] Edit character name
- [ ] Auto-save on changes

**Integration:**
- [ ] Connected to existing Supabase
- [ ] Uses existing auth system
- [ ] Can link to notes system characters

**Polish:**
- [ ] Responsive on desktop (1920x1080)
- [ ] Smooth 60fps in 3D viewer
- [ ] Loading states for async operations
- [ ] Error messages for failures
- [ ] Thumbnail generation

**Documentation:**
- [ ] User guide (how to use)
- [ ] Developer documentation (how to extend)
- [ ] Known issues documented

### Demo Requirements

**For presentation:**
1. Create 3 unique characters in under 15 minutes
2. Demonstrate asset swapping (live)
3. Demonstrate pose adjustments (live)
4. Show save/load functionality
5. Show character list with 3+ characters
6. Explain future integration with game

---

## 13. Known Limitations & Risks

### 13.1 Current Limitations

**MVP Constraints:**
- Single GLB file (all assets bundled)
- No material/texture customization
- No color changes
- No animations (Mixamo later)
- Desktop-only (no mobile)
- Requires internet (Supabase)

### 13.2 Technical Risks

**High Risk:**
- ❌ **GLB structure unknown** - Need to inspect actual file
  - Mitigation: Build flexible asset detection system
- ⚠️ **Armature naming unknown** - Bone names not confirmed
  - Mitigation: Make bone controls configurable

**Medium Risk:**
- ⚠️ **Performance with 20 characters** - Many thumbnails
  - Mitigation: Lazy loading, virtualized list
- ⚠️ **Three.js learning curve** - Complex API
  - Mitigation: Use examples, start simple

**Low Risk:**
- ✓ Supabase integration (already working in notes system)
- ✓ React/TypeScript (familiar stack)

### 13.3 Mitigation Strategies

**For Unknown GLB Structure:**
1. Build inspector first (Phase 2)
2. Log all meshes and bones
3. Adapt asset system to actual structure
4. Document findings

**For Armature Unknowns:**
1. Make bone controls data-driven
2. Config file for bone definitions
3. Easy to add/remove bones
4. Test with simple rotations first

---

## 14. Questions to Resolve Before Development

### Critical Questions:

1. **GLB Structure (BLOCKING):**
   - What are the actual mesh names in Neighbor Base V12.glb?
   - How are assets organized? (separate meshes? material slots?)
   - What are the armature names?
   - What are the bone names in each armature?

2. **Asset Categories:**
   - What categories exist? (hair, top, bottom, shoes, accessories, other?)
   - How many options per category?
   - Are there dependencies? (e.g., certain tops require certain bottoms?)

3. **Armature Details:**
   - Which bones should be controllable?
   - What are safe rotation/scale ranges?
   - Are there IK constraints to preserve?

### Nice-to-Know Questions:

4. **Notes System Link:**
   - Should linking be required or optional?
   - Can multiple character models link to same profile?

5. **Export Format:**
   - What format does future game engine need?
   - Should we export modified GLB or just config?

---

## 15. Next Steps

### Immediate Actions:

1. **Inspect GLB File:**
   - Load in Three.js inspector
   - Document all mesh names
   - Document all bone names
   - Identify armature structure
   - Take screenshots

2. **Create Asset Catalog:**
   - Based on inspection results
   - Create JSON mapping
   - Define categories

3. **Confirm Requirements:**
   - Review spec with stakeholders
   - Get approval on scope
   - Confirm timeline

4. **Begin Development:**
   - Set up project (Phase 1)
   - Build 3D viewer (Phase 2)
   - Adapt based on findings

---

## Appendix A: Technology References

**Three.js:**
- Docs: https://threejs.org/docs/
- Examples: https://threejs.org/examples/
- GLTFLoader: https://threejs.org/docs/#examples/en/loaders/GLTFLoader

**Zustand:**
- Docs: https://docs.pmnd.rs/zustand/getting-started/introduction
- Persist: https://docs.pmnd.rs/zustand/integrations/persisting-store-data

**Supabase:**
- Docs: https://supabase.com/docs
- RLS: https://supabase.com/docs/guides/auth/row-level-security
- Storage: https://supabase.com/docs/guides/storage

**Vite:**
- Docs: https://vitejs.dev/guide/
- React plugin: https://github.com/vitejs/vite-plugin-react

---

## Appendix B: File Structure Reference

```
CC/
├── public/
│   └── models/
│       └── Neighbor Base V12.glb
├── src/
│   ├── components/
│   │   ├── Viewer3D.tsx
│   │   ├── AssetPanel.tsx
│   │   ├── ArmatureControls.tsx
│   │   ├── CharacterList.tsx
│   │   ├── SaveLoadPanel.tsx
│   │   └── Layout.tsx
│   ├── lib/
│   │   ├── three-setup.ts
│   │   ├── model-loader.ts
│   │   ├── asset-manager.ts
│   │   ├── armature-controller.ts
│   │   ├── character-db.ts
│   │   └── supabase.ts
│   ├── store/
│   │   └── character-store.ts
│   ├── types/
│   │   └── character.ts
│   ├── assets/
│   │   └── asset-catalog.json
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── docs/
│   ├── 01-vision.md
│   ├── 02-character-creator-spec.md
│   ├── 03-tech.md
│   └── project_info.md
├── migrations/
│   └── 001_character_models.sql
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## Document Version History

**v1.0 - 2025-10-23**
- Initial specification
- Complete feature breakdown
- Development plan
- Integration requirements

**Next Review: After GLB inspection**