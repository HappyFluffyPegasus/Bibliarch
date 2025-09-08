# StoryCanvas MVP Product Specification

## 1. Product Vision & Core Concept

### 1.1 Product Identity
- **Name**: StoryCanvas (working title)
- **Type**: Writer-focused AI story development platform
- **Target Users**: Fiction authors, storytellers, narrative designers
- **Core Value**: Visual note-taking meets AI character simulation

### 1.2 MVP Scope Definition
- **Included**: Web-based visual canvas, structured story notes, AI chat simulation
- **Excluded**: 3D character visualization, collaborative features, publishing tools
- **Future Vision**: 3D characters acting out scenes based on notes and AI direction

## 2. Core Feature Set

### 2.1 Visual Canvas System

#### Canvas Properties
- Infinite, free-range spatial layout
- Drag-to-position interface
- Pan and zoom navigation
- Grid-optional background
- Customizable background color
- Light/dark mode toggle (full UI inversion)

#### Node System
**Base Node Types:**
1. **Text Node**
   - Bold title (same font size as body)
   - Body content with rich text
   - Resizable dimensions
   - Custom background color
   - Border styling options

2. **Image Node**
   - Drag-drop upload functionality
   - Aspect ratio preservation
   - Manual resize capability
   - Bottom caption/header field
   - Supported formats: JPG, PNG, GIF, WebP

3. **Folder/Link Node**
   - Appears as standard node (not folder icon)
   - Custom image + title display
   - Click-through to nested canvas
   - Unlimited nesting depth
   - Back navigation breadcrumbs

4. **Special Purpose Nodes**
   - Timeline Node (see §2.4)
   - Mood Board Node (see §2.5)
   - Relationship Chart Node (see §2.6)

#### Connection System
- **Arrow Types:**
  - Unidirectional (sequence/causation)
  - Bidirectional (association/relation)
- **Properties:**
  - Drag-to-create interface
  - Curved or straight options
  - Label/annotation capability
  - AI-interpretable semantics

### 2.2 Story Organization Structure

#### Hierarchy
1. **Account Level**: User profile and settings
2. **Story Level**: Separate story universes (no cross-contamination)
3. **Section Level**: Major story components
4. **Node Level**: Individual content pieces

#### Default Story Sections (Template)
- Characters
- Worldbuilding
- Plot
- Mood Board
- Themes
- General Notes (user-created)

### 2.3 Character Management

#### Character Index Board
- Grid/list layout of character tiles
- Profile image + name per tile
- Click-through to individual profiles
- Add new character function

#### Character Profile Template
**Required Fields:**
- Name
- Basic Info (age, gender, appearance)
- Personality traits
- Likes/Dislikes

**Extended Fields:**
- Motivations (internal/external)
- Backstory
- Character arc
- Relationships (links to other characters)
- Secrets/Hidden aspects
- Speaking patterns
- Behavioral quirks
- Character-specific mood board

#### Character Data Structure for AI
- All fields must be titled for AI parsing
- Hierarchical relationship mapping
- Secret/public information flagging
- Dialogue pattern indicators

### 2.4 Worldbuilding System

#### World Template Structure
**Top Level:**
- World name
- Geography overview
- Cultural overview
- Technology level
- Magic/supernatural rules (if applicable)

**Geography Branch:**
- Continents/regions
- Countries (nested folders)
- Cities (within countries)
- Notable locations

**Culture Branch:**
- Religions/belief systems
- Languages
- Social structures
- Customs/traditions

**Mythology/History Branch:**
- Creation myths
- Historical events
- Folklore
- "True" vs believed information markers

#### Country/Region Templates
- Name and location
- Government type
- Economy
- Culture (localized)
- Notable figures
- Country-specific mood board
- Human Development Index equivalent

### 2.5 Plot Development Tools

#### Plot Structure Components
- Plot summary node
- Timeline system (primary feature)
- Chapter/scene breakdown
- Plot threads tracking
- Conflict mapping

#### Timeline Specifications
- **Linear baseline** with time markers
- **Branching support** for alternate timelines
- **Node content**: Text primary, images optional
- **Auto-connectors** between sequential events
- **Merge/diverge points** clearly marked
- **Click-through** for detailed event notes
- **Multiple timeline views**: Story-wide, character-specific, location-specific

### 2.6 Relationship Mapping

#### Visual Relationship Chart
- **Display**: Circular character portraits
- **Connections**: Typed arrows between characters
- **Types**: Love, hate, family, alliance, rivalry, custom
- **Sidebar form** for relationship entry
- **Auto-layout algorithm** for clean display
- **Structured data export** for AI consumption

#### Relationship Properties
- Relationship strength indicators
- One-way vs mutual relationships
- Hidden vs known relationships
- Evolution over timeline capability

### 2.7 Mood Board System
- Story-level mood board
- Character-specific mood boards
- Location-specific mood boards
- Drag-drop image collections
- Color palette extraction
- Style reference organization
- Global mood board as index to others

## 3. AI/LLM Integration

### 3.1 Chat Simulation System
**Core Functionality:**
- Character.AI-style chat rooms
- Multi-character simultaneous interaction
- Scene prompt interpretation ("Ellie and Nonna go for a walk")

### 3.2 Context Ingestion
**Data Sources:**
- All story notes (complete graph)
- Character profiles and relationships
- World rules and constraints
- Plot timeline and events
- Arrow semantics (sequence vs association)
- Mood board tags/descriptions

**Context Boundaries:**
- Strict story separation (no cross-story leakage)
- User-specific adaptation only
- No global model training on user content

### 3.3 Writing Style Requirements
**Mandatory Characteristics:**
- Narration-heavy default
- Professional prose quality
- No "cringey" writing patterns
- Show don't tell principle

**Behavioral Rules:**
- Characters keep secrets naturally
- Deflection/avoidance when appropriate
- Lies when character-consistent
- Dialogue-heavy only when contextually warranted
- Subtext and implication over direct statement

### 3.4 Style Adaptation
- Learns from user's writing patterns
- Vocabulary and phrase preferences
- Excludes grammar errors from learning
- Maintains style within user's session only

## 4. Import/Export Capabilities

### 4.1 Import Functions
- Word documents (.docx)
- Google Docs (via API or export)
- Plain text files
- Previous novel/notes for context
- Style learning from imported content

### 4.2 Data Usage from Imports
- Gap filling in new notes
- Writing style extraction
- Character/world detail augmentation
- No propagation to other users

## 5. User Account System

### 5.1 Account Features
- Email/password authentication
- Profile creation and editing
- Username selection
- Progress auto-save
- Multiple story management

### 5.2 Settings Panel
- Light/dark mode toggle
- Default colors selection
- Canvas preferences
- AI behavior preferences
- Data export options

### 5.3 Analytics (MVP Admin View)
- User count tracking
- Story creation metrics
- Feature usage patterns
- Session duration data

## 6. Template Requirements

### 6.1 Design Principles
- Aesthetically pleasing layouts
- No overlapping nodes
- Logical grouping
- Clear visual hierarchy
- Appropriate spacing

### 6.2 Content Rules
- Prompts only (no filled content)
- Clear placeholder text
- Required field indicators
- Purpose explanations
- Example formats shown

### 6.3 Customization
- Full rearrangement capability
- Color scheme changes
- Node sizing flexibility
- Template save as custom

## 7. Tutorial System

### 7.1 Onboarding Flow
**First Launch:**
1. Welcome screen
2. Account creation
3. Interface overview
4. Node type demonstrations
5. Connection creation
6. Story structure explanation
7. AI feature introduction

### 7.2 Tutorial Content
- Canvas navigation basics
- Node creation and editing
- Title importance for AI
- Folder/link node navigation
- Relationship chart creation
- Timeline building
- AI chat usage
- Best practices guide

### 7.3 Accessibility
- Skip option for experienced users
- Revisitable from help menu
- Interactive practice mode
- Tooltip system for ongoing help

## 8. Technical Specifications

### 8.1 Node Persistence
- Auto-save every action
- Version history (basic)
- Undo/redo capability
- Conflict resolution

### 8.2 Performance Requirements
- Canvas with 1000+ nodes
- Smooth drag operations
- Quick navigation between boards
- Responsive AI chat (< 3s initial response)

### 8.3 Data Structure
- Hierarchical JSON storage
- Relationship graph database
- Efficient AI context packaging
- Image CDN integration

## 9. Quality Standards

### 9.1 Visual Polish
- Consistent spacing
- Aligned elements
- Smooth animations
- Professional typography
- Clear iconography

### 9.2 User Experience
- Intuitive first use
- Minimal learning curve
- Clear error messages
- Helpful empty states
- Progress indicators

### 9.3 AI Output Quality
- Grammatically correct
- Stylistically consistent
- Character-voice accurate
- Context-aware responses
- Natural dialogue flow

## 10. Explicit Non-Goals (MVP)

### 10.1 Deferred Features
- 3D character visualization
- Collaborative editing
- Mobile applications
- Offline mode
- Advanced formatting (tables, etc.)
- Direct canvas image drops (without nodes)
- Earth preset world template

### 10.2 Constraints
- English language only (MVP)
- Desktop/laptop focused (not mobile-first)
- Single user per story
- No real-time collaboration
- No publishing/export to ebook

## 11. Success Metrics

### 11.1 User Engagement
- Account creation rate
- Stories created per user
- Nodes created per story
- AI chat usage frequency
- Session duration

### 11.2 Quality Indicators
- Tutorial completion rate
- Feature discovery rate
- User retention (7-day, 30-day)
- Error rate reduction
- Support ticket volume

## 12. Edge Cases & Clarifications

### 12.1 Data Handling
- Large imports (> 100k words)
- Circular relationship references
- Timeline paradoxes
- Conflicting character information

### 12.2 AI Behavior
- Contradictory character instructions
- Explicit content requests
- Cross-story character requests
- Style mimicry limitations

### 12.3 Canvas Limits
- Maximum zoom levels
- Node size boundaries
- Connection count limits
- Nesting depth practical maximum

## 13. Implementation Priorities

### 13.1 Core MVP Must-Haves
1. Canvas with basic nodes
2. Story structure/templates
3. Character profiles
4. Basic AI chat
5. Account system

### 13.2 High Priority Additions
1. Relationship charts
2. Timeline system
3. Import functionality
4. Mood boards
5. Enhanced AI context

### 13.3 Nice-to-Have Polish
1. Advanced styling options
2. Keyboard shortcuts
3. Export features
4. Template marketplace
5. Community features