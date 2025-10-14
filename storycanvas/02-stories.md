# NeighborNotes User Stories & Design Document

## 1. User Personas

### 1.1 Primary Persona: The Novelist
- **Name**: Sarah, Fiction Author
- **Experience**: 5+ years writing, comfortable with digital tools
- **Goals**: Organize complex multi-book series, keep characters consistent
- **Pain Points**: Lost in scattered notes, character inconsistencies, no visual overview
- **Tech Comfort**: Medium-high

### 1.2 Secondary Persona: The World-Builder
- **Name**: Marcus, Fantasy Writer
- **Experience**: Hobbyist, detailed world creator
- **Goals**: Track elaborate world details, maintain consistency across locations
- **Pain Points**: Linear documents insufficient for interconnected lore
- **Tech Comfort**: High

### 1.3 Tertiary Persona: The Pantser
- **Name**: Jamie, Discovery Writer
- **Experience**: Writes by instinct, discovers story while writing
- **Goals**: Capture ideas quickly, explore character interactions
- **Pain Points**: Rigid structures limit creativity, needs flexibility
- **Tech Comfort**: Medium

## 2. Core User Stories

### 2.1 Account & Setup

#### US-001: First Time Setup
**As** a new user  
**I want** to create an account and see a tutorial  
**So that** I can understand the tool's capabilities without frustration  

**Acceptance Criteria:**
- Account creation takes < 60 seconds
- Tutorial is skippable but comprehensive
- First story creation is guided
- Templates are immediately visible

#### US-002: Story Creation
**As** an author  
**I want** to create separate story spaces  
**So that** my different projects don't interfere with each other  

**Acceptance Criteria:**
- One-click new story creation
- Clear story separation in UI
- No data leakage between stories
- Easy story switching

### 2.2 Canvas & Navigation

#### US-003: Visual Organization
**As** a visual thinker  
**I want** to arrange my notes spatially on an infinite canvas  
**So that** I can see relationships and think non-linearly  

**Acceptance Criteria:**
- Smooth drag and drop
- Zoom in/out functionality
- Nodes snap to grid (optional)
- Canvas saves position automatically

#### US-004: Node Creation
**As** a writer  
**I want** to quickly create different types of nodes  
**So that** I can capture ideas in appropriate formats  

**Acceptance Criteria:**
- Right-click or button to create node
- Type selection (text, image, folder)
- Immediate editing capability
- Clear visual distinction between types

#### US-005: Deep Organization
**As** a detail-oriented writer  
**I want** to create nested folder structures  
**So that** I can organize complex information hierarchically  

**Acceptance Criteria:**
- Click folder node to enter
- Breadcrumb navigation
- Unlimited nesting levels
- Back button functionality

### 2.3 Character Development

#### US-006: Character Creation
**As** a storyteller  
**I want** to create detailed character profiles  
**So that** my characters feel consistent and real  

**Acceptance Criteria:**
- Rich template with prompts
- Optional fields clearly marked
- Image upload for character art
- All fields titled for AI parsing

#### US-007: Character Relationships
**As** an author with multiple characters  
**I want** to map relationships visually  
**So that** I can track complex interpersonal dynamics  

**Acceptance Criteria:**
- Visual relationship chart
- Different relationship types
- One-way and mutual relationships
- Exportable to AI context

#### US-008: Character Secrets
**As** a mystery writer  
**I want** to mark information as secret/hidden  
**So that** the AI knows what characters wouldn't reveal readily  

**Acceptance Criteria:**
- Public/private information toggle
- AI respects secret information
- Secrets visible to author only
- Clear marking in UI

### 2.4 World Building

#### US-009: World Structure
**As** a fantasy author  
**I want** to build nested geographical hierarchies  
**So that** I can detail my world from global to local  

**Acceptance Criteria:**
- World → Country → City navigation
- Consistent template at each level
- Visual geography representation
- Culture/religion subsections

#### US-010: Consistency Checking
**As** a world-builder  
**I want** the AI to know my world rules  
**So that** character actions remain consistent with the world  

**Acceptance Criteria:**
- AI ingests all world notes
- Respects technology levels
- Follows magic/physics rules
- Maintains cultural accuracy

### 2.5 Plot Development

#### US-011: Timeline Creation
**As** a plotter  
**I want** to create visual timelines  
**So that** I can track events and their relationships  

**Acceptance Criteria:**
- Linear timeline with markers
- Branching for alternates
- Click for event details
- Auto-connection between events

#### US-012: Scene Planning
**As** a writer  
**I want** to outline scenes and chapters visually  
**So that** I can see story structure at a glance  

**Acceptance Criteria:**
- Scene nodes with summaries
- Drag to reorder
- Chapter grouping
- Progress tracking

### 2.6 AI Integration

#### US-013: Character Simulation
**As** an author  
**I want** to test character interactions through AI  
**So that** I can explore dialogue and dynamics  

**Acceptance Criteria:**
- Select 2+ characters for scene
- Provide situation prompt
- AI generates in-character interaction
- Narration-heavy output

#### US-014: Style Consistency
**As** a writer with a specific voice  
**I want** the AI to match my writing style  
**So that** generated content feels authentic to my work  

**Acceptance Criteria:**
- Import existing writing samples
- AI adapts to vocabulary/style
- Excludes grammar errors
- User-specific training only

#### US-015: Secret Handling
**As** a writer  
**I want** AI characters to naturally keep secrets  
**So that** interactions feel realistic and maintain tension  

**Acceptance Criteria:**
- Characters don't info-dump
- Natural deflection/avoidance
- Lies when character-appropriate
- Subtext over direct statement

### 2.7 Visual Customization

#### US-016: Theme Selection
**As** a user  
**I want** to choose between light and dark modes  
**So that** I can work comfortably in different environments  

**Acceptance Criteria:**
- Global toggle in settings
- Full UI inversion
- Images remain unchanged
- Preference saved to account

#### US-017: Node Styling
**As** a visual organizer  
**I want** to color-code my nodes  
**So that** I can create visual associations and themes  

**Acceptance Criteria:**
- Color picker for nodes
- Background color customization
- Text color options
- Colors persist on save

### 2.8 Content Import

#### US-018: Document Import
**As** an author with existing work  
**I want** to import my documents  
**So that** I don't have to re-enter information  

**Acceptance Criteria:**
- Support Word/Google Docs
- Parse into appropriate nodes
- Maintain formatting basics
- Progress indicator for large files

#### US-019: Style Learning
**As** a writer  
**I want** the AI to learn from my existing work  
**So that** it can match my voice  

**Acceptance Criteria:**
- Analyze imported documents
- Extract style patterns
- Apply to AI generation
- Keep learning user-specific

### 2.9 Reference Management

#### US-020: Mood Boards
**As** a visual writer  
**I want** to create mood boards  
**So that** I can collect visual inspiration  

**Acceptance Criteria:**
- Drag-drop multiple images
- Arrange freely
- Link to characters/locations
- AI can reference descriptions

#### US-021: Cross-References
**As** an author  
**I want** to link related nodes with arrows  
**So that** I can show connections and dependencies  

**Acceptance Criteria:**
- Draw arrows between nodes
- Directional/bidirectional options
- Labels on connections
- AI understands relationships

## 3. Negative User Stories (What NOT to Do)

### 3.1 Anti-Patterns

#### NUS-001: No Forced Structure
**As** a creative writer  
**I DON'T want** rigid required fields  
**Because** it limits my creative process  

**Design Response:**
- All template fields optional
- Can delete any template element
- Can create custom structures

#### NUS-002: No Cross-Story Contamination
**As** an author with multiple projects  
**I DON'T want** characters from different stories mixing  
**Because** it breaks story integrity  

**Design Response:**
- Strict story boundaries
- No global character pool
- Clear story selection

#### NUS-003: No Public Training
**As** a writer  
**I DON'T want** my work training public AI models  
**Because** my intellectual property must remain mine  

**Design Response:**
- User-specific adaptation only
- No data sharing between accounts
- Clear privacy guarantees

#### NUS-004: No Cringey AI Writing
**As** a professional author  
**I DON'T want** amateur-sounding AI output  
**Because** it's unusable for serious work  

**Design Response:**
- Narration-focused generation
- Professional prose standards
- Style matching capabilities

## 4. User Flows

### 4.1 New User Flow
1. **Landing** → Sign Up → Email Verification
2. **Welcome** → Tutorial Start → Skip Option
3. **First Story** → Template Selection → Name Story
4. **Canvas Introduction** → Node Creation Demo
5. **Character Creation** → Fill Basic Info → Save
6. **AI Introduction** → First Simulation → Success

### 4.2 Returning User Flow
1. **Login** → Story Selection
2. **Canvas Load** → Previous Position Restored
3. **Continue Work** → Add/Edit Nodes
4. **AI Interaction** → Character Simulation
5. **Auto-Save** → Logout

### 4.3 Character Development Flow
1. **Character Section** → Add Character Node
2. **Profile Template** → Fill Prompts
3. **Add Image** → Upload Character Art
4. **Relationships** → Link to Others
5. **Secrets** → Mark Private Info
6. **Test in AI** → Simulation

### 4.4 World Building Flow
1. **World Section** → Create World Node
2. **Geography** → Add Countries
3. **Nest Cities** → Within Countries
4. **Add Culture** → Religion/Customs
5. **Mood Board** → Visual References
6. **AI Context** → Automatic Integration

### 4.5 AI Interaction Flow
1. **Open AI Chat** → Select Characters
2. **Set Scene** → Provide Prompt
3. **Generate** → AI Creates Interaction
4. **Review** → Check Consistency
5. **Iterate** → Adjust and Regenerate

## 5. Error States & Edge Cases

### 5.1 Common Errors

#### ERR-001: Lost Connection
**Scenario**: User loses internet while working  
**Solution**: Local caching, auto-save on reconnect, clear status indication

#### ERR-002: Large Import Failure
**Scenario**: 500k word document import  
**Solution**: Chunked processing, progress bar, partial import option

#### ERR-003: AI Context Overflow
**Scenario**: Too many notes for AI context  
**Solution**: Smart summarization, priority flagging, essential-only mode

### 5.2 Edge Cases

#### EDGE-001: Circular References
**Scenario**: Node A links to B links to A  
**Solution**: Allow it, show warning, breadcrumb escape

#### EDGE-002: Deep Nesting
**Scenario**: 20+ levels deep folder structure  
**Solution**: Performance optimization, navigation shortcuts, search function

#### EDGE-003: Conflicting Information
**Scenario**: Character marked as dead but active in timeline  
**Solution**: Consistency warnings, timeline markers, AI acknowledgment

## 6. Success Metrics

### 6.1 Engagement Metrics
- Time to first node creation: < 2 minutes
- Tutorial completion rate: > 60%
- Daily active users: Growth 10% month-over-month
- AI interactions per session: > 3

### 6.2 Quality Metrics
- AI satisfaction rating: > 4/5 stars
- Character consistency score: > 90%
- Error rate: < 1% of sessions
- Support tickets: < 5% of users

### 6.3 Retention Metrics
- 7-day retention: > 40%
- 30-day retention: > 25%
- Stories with >10 nodes: > 70%
- Returning daily users: > 20%

## 7. Design Principles

### 7.1 Core Principles
1. **Flexibility First**: Never force structure
2. **Visual Thinking**: Spatial = memorable
3. **AI as Partner**: Enhance, don't replace creativity
4. **Privacy Sacred**: User data stays user's
5. **Professional Output**: Quality over quantity

### 7.2 Interaction Principles
1. **Direct Manipulation**: See it, move it
2. **Immediate Feedback**: Every action acknowledged
3. **Progressive Disclosure**: Complexity when needed
4. **Contextual Help**: Guidance without intrusion
5. **Consistent Patterns**: Learn once, use everywhere

### 7.3 AI Principles
1. **Character Integrity**: Stay true to profiles
2. **Narrative Focus**: Show through action
3. **Respect Secrets**: Natural information flow
4. **Style Matching**: Feel like user's work
5. **Context Aware**: Use all available notes