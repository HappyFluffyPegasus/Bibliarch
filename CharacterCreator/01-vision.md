# Game Vision Document
## Project Codename: [To Be Named]

## High-Level Concept

**Genre**: AI-Powered Story Simulation + Life Sandbox
**Elevator Pitch**: "The Sims meets Gacha Life meets Character.AI"

A game where users bring characters from their own stories to life on a new planet. Characters rebuild their societies, live their lives, and act out story plots through AI-driven scenes with real movements and dialogue.

---

## Core Concept

### The Setting
- Characters from pre-existing stories are transported to a new planet
- They attempt to rebuild their same society and resume their lives
- The planet becomes a living sandbox where story meets simulation

### The Player Experience
Players create their story worlds through three integrated systems:
1. **Story Notes System** (completed) - Deep worldbuilding and character development
2. **Character Creator** (in progress) - Visual character design with 3D models
3. **Living World** (future) - Characters brought to life in two modes

---

## Two Game Modes

### Mode 1: Life/Sandbox Mode
**"The Sims" aspect**
- Characters live day-to-day lives on the planet
- Build homes, form relationships, work jobs
- Sandbox gameplay with autonomy and player direction
- Characters maintain their personalities from the story
- Society rebuilding mechanics

**Features**:
- Free-roam environment
- Character needs and wants
- Social interactions
- Building/crafting
- Life progression

### Mode 2: Story/Studio Mode
**"Character.AI meets Gacha Life" aspect**
- User simulates the actual plot of their story
- AI takes from story notes and generates plotlines as scenes
- Scenes are translated into character movements and dialogue
- Like directing a movie of your own story

**Features**:
- AI-driven plot generation from user notes
- Scene-by-scene story progression
- Automated character animation and dialogue
- Cutscene creation
- Story timeline management

---

## Three Integrated Systems

### System 1: Story Notes (COMPLETED ✓)
**Technology**: Next.js + Supabase (StoryCanvas)

**Purpose**:
- Deep character profiles and development
- Story worldbuilding and lore
- Relationship mapping
- Plot planning and timelines
- AI context database

**Key Features**:
- Node-based canvas for organization
- Character relationship graphs
- JSONB storage for flexible data
- Import from Word/PDF/Google Docs

**Status**: Fully functional, tech stack documented in `03-tech.md`

---

### System 2: Character Creator (IN PROGRESS ⚙️)
**Technology**: Three.js + GLB models

**Purpose**:
- Visual design of characters from the notes system
- Create 3D models for use in both game modes
- Customizable appearance matching story descriptions
- Export characters for the game engine

**Key Features**:
- Modular asset system (hair, clothes, accessories)
- Dual armature system:
  - Pose armature (animations, movements)
  - Scale armature (height, head size, proportions)
- Uniform naming convention for all assets
- Mixamo animation integration (planned)
- Character export to game engine

**Current Status**:
- ✓ Blender models created with uniform naming
- ✓ Base body + changeable assets in one GLB file
- ✓ Dual armature system implemented
- ⏳ Character creator UI needed
- ⏳ Asset toggle system needed
- ⏳ Armature controls needed
- ⏳ Mixamo animation integration planned
- ⏳ Export/save system needed

**Integration Points**:
- Links to character profiles from Notes System
- Exports characters for Game Engine
- Saves character configurations to Supabase

---

### System 3: Living World / Custom Game Engine (FUTURE 🔮)
**Technology**: Custom-built with AI (NO Unity/Unreal/Godot)

**Why Custom Engine?**
- Entire codebase must be AI-generated
- Traditional game engines can't be fully coded by AI
- Maximum flexibility for AI-to-game pipeline
- Built specifically for this project's unique needs

**Likely Tech Stack**:
- Three.js or Babylon.js for 3D rendering
- Custom physics (simple, low-poly appropriate)
- Electron for desktop packaging
- Node.js backend for AI integration
- Same Supabase database

**Purpose**:
- Render the actual game world
- Run both Life/Sandbox and Story/Studio modes
- Bring characters to life with AI-driven behavior

**Key Features (Planned)**:
- 3D world rendering (low poly style)
- Character AI behavior (autonomous life simulation)
- AI-to-animation pipeline (story scenes → character actions)
- Dialogue system
- Building/crafting mechanics
- Social simulation
- Story scene player

**Integration Points**:
- Imports characters from Character Creator
- Reads story data and character profiles from Notes System
- Uses OpenAI API for:
  - Character behavior AI
  - Plot generation from notes
  - Dialogue generation
  - Scene direction

---

## How Everything Works Together

### The Full Pipeline

```
User writes story notes →
  Stored in Notes System (Supabase) →
    Creates characters in Character Creator →
      Exports 3D models with configs →
        Imports into Game Engine →
          AI reads notes for context →
            Generates living characters + story scenes
```

### Example User Flow

1. **Planning Phase** (Notes System)
   - User creates character "Alice" with detailed personality
   - Writes relationships: "Alice is enemies with Bob"
   - Plans story arc: "Alice must save the colony"

2. **Design Phase** (Character Creator)
   - User designs Alice's 3D appearance
   - Chooses hair, outfit, height
   - Links to Alice's note profile
   - Exports character

3. **Play Phase** (Game Engine)
   - **Life Mode**: Alice autonomously lives life, reacts to Bob based on relationship notes
   - **Story Mode**: User triggers story arc, AI generates scenes where Alice saves colony, characters act it out with animations

---

## Technical Architecture Vision

### Data Flow

**Notes System** ←→ **Supabase Database** ←→ **Character Creator**
                                ↓
                          **Game Engine**
                                ↓
                          **OpenAI API**

### Shared Database Schema (Supabase)

```sql
-- Existing (from Notes System)
stories (story metadata, settings)
characters (profiles, relationships, AI context)
canvas_data (worldbuilding nodes)

-- New (for Character Creator)
character_models (
  id UUID,
  character_id UUID, -- links to notes system
  model_config JSONB, -- asset selections, armature settings
  glb_url TEXT, -- Supabase Storage URL
  preview_image TEXT
)

-- Future (for Game Engine)
game_saves (world state, character positions)
story_scenes (AI-generated scenes from notes)
```

### AI Integration Points

**OpenAI API Usage**:
1. ✓ **Notes System**: Character profile generation, writing assistance
2. **Character Creator**: Suggest character appearance from notes (future)
3. **Game Engine - Life Mode**: Character behavior AI, dialogue generation
4. **Game Engine - Story Mode**:
   - Read story notes + character data
   - Generate plot scenes with stage directions
   - Convert to character animations and dialogue

---

## Development Phases

### Phase 1: Foundation (CURRENT)
- ✓ Notes System (completed)
- ⚙️ Character Creator (in progress)
  - Build 3D viewer/editor
  - Asset toggle system
  - Armature controls
  - Save to database
  - Link to notes

### Phase 2: Character Pipeline
- Mixamo animation integration
- Character export system
- Preview renders
- Batch character creation

### Phase 3: Game Engine Setup
- Choose game engine technology
- Import character system
- Basic 3D world
- Character placement

### Phase 4: Story Mode
- AI plot generation from notes
- Scene-to-animation pipeline
- Dialogue system
- Story timeline player

### Phase 5: Life Mode
- Character AI behavior
- Autonomous actions
- Social simulation
- Building mechanics

---

## Character Creator Integration Requirements

### Must-Have Features for Game Integration

**Data Structure**:
- Character configurations saved to Supabase
- Links to character profiles in Notes System
- Version control for character designs
- Export format compatible with game engine

**Asset Management**:
- All assets must be swappable at runtime
- Armature compatibility with Mixamo animations
- Consistent naming for automated processing
- LOD levels for performance (future)

**Export Capabilities**:
- Individual character GLB export
- Batch export for full cast
- Include: model, textures, armature, configuration
- Metadata for game engine (character ID, asset list)

**UI Requirements**:
- Visual asset selection (dropdowns/grid)
- Real-time preview
- Armature sliders (pose + scale)
- Link to character notes
- Save/load system

---

## Questions to Resolve

### Technical Decisions ✓ CONFIRMED:
1. **Game engine choice** - NO GAME ENGINE - Custom code entirely by AI
2. **Character Creator deployment** - Standalone desktop app (final), web-based for development
3. **Asset loading** - All in GLB for now
4. **Animation pipeline** - Mixamo (future phase)

### Design Decisions ✓ CONFIRMED:
1. **Character art style** - Low poly
2. **Scope** - 20 characters max per user
3. **Current phase** - Character creator ONLY (no game modes, no AI integration yet)

---

## Success Metrics (for school project demo)

**Character Creator**:
- Create a character in under 5 minutes
- Swap between 10+ different asset options
- Adjust armature settings smoothly
- Export ready-to-use character

**Full Vision Demo**:
- Show 3+ characters from notes
- Demonstrate both game modes concept
- AI generates a story scene
- Characters act it out (even if basic)

---

## Current Focus

**Phase**: Character Creator ONLY
**Timeline**: Foundation first, game modes later

**Immediate Goals**:
- ✓ Export GLB from Blender (completed)
- ⚙️ Build Three.js character viewer
- ⚙️ Asset toggle system (show/hide different parts)
- ⚙️ Armature controls (pose + scale sliders)
- ⚙️ Save/load character configurations
- ⚙️ Integration with existing Supabase database
- ⚙️ Link to character profiles from Notes System

**Development Approach**:
- Build as web app initially (faster development)
- Package as Electron desktop app later
- Keep code compatible with future custom game engine
- Support up to 20 characters per user

**NOT in Current Scope**:
- ❌ Game modes (Life/Story)
- ❌ AI integration
- ❌ Animations (Mixamo comes later)
- ❌ Full game engine
- ❌ World building

**Next Steps After Character Creator**:
1. Mixamo animation integration
2. Character export/import system
3. Begin custom game engine prototyping