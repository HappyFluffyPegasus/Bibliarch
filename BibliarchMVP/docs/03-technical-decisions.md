# Bibliarch MVP - Technical Decisions

## Tech Stack

### Core Framework
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**

**Rationale**: Consistent with existing Bibliarch website. App Router provides modern React patterns.

### 3D Engine
- **Three.js** with **@react-three/fiber** and **@react-three/drei**

**Rationale**:
- Character Creator already uses Three.js
- Good React integration with R3F
- Large community and documentation
- Handles our use cases (character viewer, world builder, scene viewer)

### Styling
- **Tailwind CSS**
- **shadcn/ui components** (copied, not installed as dependency)

**Rationale**: Consistent with Bibliarch website. Copy-paste approach gives full control.

### State Management
- **Zustand** with persist middleware

**Rationale**:
- Simple, lightweight
- TypeScript-first
- Built-in persistence to localStorage
- No boilerplate like Redux

### Database
- **localStorage** for MVP
- **Supabase** decision deferred to later

**Rationale**: Simpler for MVP, no backend setup needed. Can add Supabase later if needed.

---

## Project Structure Decisions

### Separate Project
- Created as `BibliarchMVP/` folder
- **Completely separate** from storycanvas and Character Creator
- Code is **copied in**, not shared via packages

**Rationale**:
- User requirement: "Do NOT touch anything outside"
- Isolation prevents breaking existing website
- Allows independent evolution

### Folder Organization
```
src/
├── app/           # Next.js App Router pages
├── components/    # React components by feature
│   ├── layout/    # Layout components (tabs, navigation)
│   ├── notes/     # Canvas-related components
│   ├── characters/# Character creator components
│   ├── timeline/  # Timeline editor components
│   ├── scenes/    # Scene editor components
│   ├── world/     # World builder components
│   ├── ui/        # Shared UI components
│   └── providers/ # Context providers
├── lib/           # Utilities and helpers
├── stores/        # Zustand stores
└── types/         # TypeScript type definitions
```

---

## UI/UX Decisions

### Tab Navigation
- **Bottom tabs** (Gacha-style)
- 6 views: Home + 5 tabs (Notes, Characters, Timeline, World, Scenes)
- Home button in tab bar returns to dashboard

**Rationale**: User requested Gacha Life-style UI with bottom tabs.

### Color Scheme
- **Blue theme** (sky-500, blue-600)
- Matches existing Bibliarch website
- Light/dark mode support

### Default View
- **Dashboard/Home** is default when opening app
- Shows all stories with create/delete options
- Clicking a story opens Notes tab

---

## Data Model Decisions

### Story Structure
```typescript
Story
├── id, title, description, dates
├── canvasData[]     # Notes tab data (multiple canvases)
├── characters[]     # Character definitions
├── timelineEvents[] # Timeline with character/relationship states
├── scenes[]         # Scene definitions with elements
├── world            # World terrain and buildings
└── masterDocs[]     # Uploaded documents
```

### Timeline Events Include States
Each timeline event stores:
- Character states (description, location, emotional state)
- Relationship states (between characters at that point)
- Optional linked scene

**Rationale**: Allows tracking character evolution over time without losing old versions.

### Scenes Are Separate from Timeline
- Scenes can exist without timeline links
- Scenes can be linked to timeline events (bidirectional)
- One scene per timeline event (for MVP)

**Rationale**: Flexibility for users who want scenes without strict timeline, but allows linking for those who want it.

---

## Canvas Integration Decisions

### Copy Full Canvas Code
- HTMLCanvas.tsx copied entirely (10K+ lines)
- All dependencies copied
- Import paths updated

**Rationale**:
- Canvas is complex, tightly coupled
- Copying ensures it works independently
- Can modify without affecting website

### Remove Timeline Node Type
- Timeline node removed from canvas
- Timeline is its own dedicated tab
- More robust, specialized timeline editor

**Rationale**: User requested "much more composed" timeline with better customization.

---

## Character Creator Integration Decisions

### Copy Full Character Creator
- Viewer3D.tsx and all components copied
- Model file (GLB) copied to public/models/
- Dynamic imports for Three.js (Next.js SSR compatibility)

**Rationale**: Character Creator is self-contained, copying is straightforward.

### No Poses for MVP
- Characters can be moved/positioned
- No pose system (current poses are broken)
- User will make new 3D models eventually

**Rationale**: User said poses don't work with current model, will replace later.

---

## 3D World Decisions

### Primitive Buildings
- Start with simple cubes and planes
- User will provide/download actual assets later
- Focus on functionality over aesthetics

### Terrain System
- Flat plane to start
- Vertex displacement for terraforming
- Height map stored in world data

### Open World with Interior Separation
- Exterior map is continuous/open
- Building interiors are separate 3D spaces
- Clicking building transitions to interior

**Rationale**: User specifically requested open-world exterior with separate interiors.

---

## Scene System Decisions

### Free Orbit Camera
- User can freely rotate/zoom around scene
- No fixed camera angles for MVP
- Camera keyframes optional for playback

### Character Movement
- Drag to position in edit mode
- Keyframe-based movement for playback
- No walking animations (just position changes)

### Subtitle System
- Dialogue lines with start time and duration
- Overlay at bottom of viewport
- Character name + text display

---

## AI Placeholder Strategy

### Placeholder Buttons
All AI features show "Not implemented yet" dialog:
- "Generate with AI" in Scenes tab
- "AI Fill Gaps" in Timeline tab
- "Generate from Master Doc" in Notes tab
- "AI Suggest Personality" in Characters tab

### Future AI Integration
- User will train AI themselves
- Strict rules: AI assists, doesn't dictate
- Will likely use external API (ChatGPT or similar)

---

## Persistence Decisions

### localStorage First
- All data stored in browser localStorage
- Zustand persist middleware handles serialization
- Key: `bibliarch-mvp-storage`

### Date Serialization
- Dates stored as ISO strings
- Deserialized back to Date objects on load
- Custom storage adapter in Zustand

### No Cloud Sync (MVP)
- Data only on local machine
- No cross-device sync
- Supabase integration deferred

### Backup/Restore Feature (MVP)
**Decision**: Manual export/import JSON files for cross-device transfer

**How it works**:
- "Download Backup" button → exports all data as `.json` file
- "Restore from Backup" button → imports JSON file to restore data
- User manually transfers file between devices (email, AirDrop, cloud drive, USB)

**iOS Compatibility**:
| Feature | iOS Safari Behavior |
|---------|---------------------|
| Download backup | Opens share sheet or saves to Files app |
| Upload backup | File picker from Files/iCloud |
| localStorage | Works (~5MB limit, cleared in Private Browsing) |
| Web app | Works in Safari, 3D may be slower on older devices |

**Future Enhancement (Post-MVP)**:
- Optional Supabase cloud sync for users who want seamless cross-device
- PWA (Progressive Web App) for "Add to Home Screen" experience
- Users opt-in to cloud features, localStorage remains primary

---

## Dependencies

### Production Dependencies
```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "three": "^0.180.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.88.0",
  "zustand": "^5.0.0",
  "lucide-react": "^0.553.0",
  "@radix-ui/react-*": "latest",
  "tailwindcss": "^3.4.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^3.0.0",
  "class-variance-authority": "latest",
  "mammoth": "^1.6.0"
}
```

### Dev Dependencies
```json
{
  "typescript": "^5.0.0",
  "@types/react": "^18.0.0",
  "@types/three": "^0.180.0"
}
```

---

## What We're NOT Doing (MVP Scope)

- ❌ Supabase/cloud database
- ❌ User authentication
- ❌ Real-time collaboration
- ❌ AI integration (just placeholders)
- ❌ Mobile responsiveness
- ❌ Character poses/animations
- ❌ Detailed building interiors
- ❌ Voice acting
- ❌ Advanced camera AI
- ❌ Multiple save files (one localStorage store)

---

*Document created: December 2024*
*For: Bibliarch MVP Development*
