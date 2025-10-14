# **NeighborNotes Relationship System Implementation Plan**

## **Overview**
A visual relationship mapping system using a special relationship canvas node that contains character profile pictures connected with colored lines to show different types of relationships, making story planning more intuitive and visual.

---

## **What We're Building:**
A special relationship canvas node (like how image nodes contain images or text nodes contain text) that acts as a mini-canvas for relationship mapping with automatically populated character profile pictures!

---

## **How It Will Work:**

### **Step 1: The Relationship Canvas Node**
- **What**: A special node type that acts like a "canvas within a canvas"
- **Where**: Can be placed anywhere, but typically in "Characters & Relationships" folder
- **Function**: Contains an internal relationship mapping area with character profile pictures
- **Layout**: Profile pictures appear as circles inside this dedicated node space

### **Step 2: Character Selection System**
**User opens the relationship canvas node and sees:**
1. **Character Selection Interface** → dropdown/list showing all character names from the story
2. **Auto-Population** → when user selects a character name, their profile picture automatically appears in the node
3. **Profile Picture Sources** → pictures are pulled from existing character nodes' `profileImageUrl` field
4. **Contained System** → everything happens inside this special relationship node

### **Step 3: Creating Relationships**
**User clicks a "Connect" button within the relationship node, then:**
1. **Click first profile picture** → circle gets a blue glow
2. **Click second profile picture** → a line appears between them
3. **Relationship popup opens** asking:
   - What type of relationship? (dropdown menu)
   - How strong? (1-3 dots for weak/medium/strong)
   - Any notes? (text box for details)

### **Step 4: Relationship Types & Colors**
- 🔴 **Red**: Romantic (dating, married, crushes)
- 🔵 **Blue**: Family (siblings, parents, cousins)
- 🟢 **Green**: Friends (best friends, close friends)
- 🟠 **Orange**: Work/Professional (boss, coworker, teammates)
- 🟣 **Purple**: Rivals/Enemies (hate, competition, conflicts)
- ⚫ **Gray**: Other (neighbors, strangers, complicated)

### **Step 5: Line Styles Show Strength**
- **Thick solid line**: Strong relationship
- **Medium line**: Normal relationship
- **Thin dotted line**: Weak/distant relationship

### **Step 6: Interactive Features**
- **Hover over line**: Shows relationship label (like "siblings" or "rivals")
- **Click on line**: Opens details popup to edit or delete
- **Filter buttons**: Hide/show certain relationship types
- **Legend**: Color guide in corner of canvas

---

## **Technical Implementation:**

### **New Node Type Required:**
1. **Add 'relationship-canvas' node type**: Special node that contains an internal canvas area
2. **Character Selection System**: Dropdown/interface to select from all character nodes in the story
3. **Auto-Population**: System automatically pulls `profileImageUrl` from selected character nodes
4. **Internal Canvas Logic**: Handles positioning, connections, and interactions within the node
5. **Profile Picture Management**: Displays character profile pictures as circular nodes inside the relationship canvas node

### **File Changes Needed:**
1. **Update HTMLCanvas.tsx**: Add new 'relationship-canvas' node type with internal canvas rendering
2. **New component**: RelationshipCanvasNode for the internal relationship mapping interface
3. **Character Detection System**: Function to find all character nodes across the story and extract their data
4. **Update templates.ts**: Replace relationship canvas template with relationship-canvas node type
5. **Internal Connection System**: Handle relationships within the relationship canvas node (not main canvas)

### **How the Code Works:**
1. **Character Detection**: System scans all story canvases to find character nodes and their profile pictures
2. **Selection Interface**: User picks characters from a list, system auto-adds their profile pictures to internal canvas
3. **Contained Canvas**: All relationship mapping happens inside the special node, not on main canvas
4. **Data Storage**: Relationships saved within the relationship canvas node data structure
5. **Visual Rendering**: SVG lines drawn between profile pictures inside the relationship canvas node

### **User Interface:**
- **Relationship Canvas Node**: Special node type available in toolbar (like text, image, character nodes)
- **Internal Interface**: Character selection dropdown, connection tools, and legend all contained within the node
- **Profile Picture Display**: Circular character images arranged inside the relationship canvas node area

---

## **User Workflow Example:**
1. Create character nodes throughout your story (with profile pictures uploaded)
2. Add a "Relationship Canvas" node to your canvas (new node type from toolbar)
3. Double-click the relationship canvas node to open its internal interface
4. See character selection dropdown populated with all your story's character names
5. Select "Alice" from dropdown → her profile picture appears as a circle in the canvas
6. Select "Bob" from dropdown → his profile picture appears as a circle in the canvas
7. Click "Connect" tool within the relationship canvas node
8. Click Alice's profile picture, then Bob's profile picture
9. Select "Friends → Best Friends" from relationship popup
10. Green line appears connecting their profile pictures inside the node!
11. Repeat to build your complete relationship network

**Result**: Self-contained relationship mapping node with all your character relationships visualized using their actual profile pictures!

---

## **Implementation Phases:**

### **Phase 1: Basic Structure**
- [ ] Add relationship canvas template to templates.ts
- [ ] Create relationship map view in Characters & Relationships folder
- [ ] Display character nodes with profile pictures in circular layout

### **Phase 2: Connection System**
- [ ] Add relationship connection tool to toolbar
- [ ] Implement click-to-connect functionality
- [ ] Create relationship data structure for storage

### **Phase 3: Relationship Types**
- [ ] Create relationship modal/popup for editing
- [ ] Implement color-coded relationship types
- [ ] Add line styles for relationship strength

### **Phase 4: Interactive Features**
- [ ] Add hover tooltips for relationship labels
- [ ] Implement filter system for relationship types
- [ ] Add relationship legend/key
- [ ] Create edit/delete functionality for existing relationships

### **Phase 5: Polish & Enhancement**
- [ ] Add quick relationship buttons
- [ ] Implement auto-layout algorithms for character positioning
- [ ] Add relationship statistics/summary view
- [ ] Create export/print functionality for relationship maps

---

## **Data Structures:**

### **Relationship Connection Object:**
```typescript
interface RelationshipConnection {
  id: string
  fromCharacterId: string
  toCharacterId: string
  relationshipType: 'romantic' | 'family' | 'friends' | 'professional' | 'rivals' | 'other'
  strength: 1 | 2 | 3  // weak, medium, strong
  label: string        // "married", "siblings", "best friends", etc.
  notes?: string       // additional details
  isBidirectional: boolean  // true for mutual relationships
}
```

### **Character Node Extensions:**
```typescript
interface CharacterNode extends Node {
  profileImageUrl?: string
  relationshipPosition?: { x: number, y: number }  // position on relationship map
}
```

---

## **Visual Design Specifications:**

### **Character Representation:**
- **Circle diameter**: 80px
- **Profile picture**: Cropped to circle, 70px diameter
- **Border**: 5px, color matches character theme
- **Hover effect**: Subtle glow and scale up 10%

### **Relationship Lines:**
- **Strong**: 4px line width
- **Medium**: 2px line width
- **Weak**: 1px dotted line
- **Colors**: Use hex values for consistent theming

### **UI Layout:**
- **Main canvas**: Center area for character circles and connections
- **Left panel**: Relationship tools and filters
- **Right panel**: Legend and relationship statistics
- **Bottom bar**: Quick relationship buttons

---

## **Success Metrics:**
- Users can create relationships in under 3 clicks
- Relationship map automatically updates when characters are added/removed
- Visual clarity: relationship types are immediately recognizable
- Performance: Smooth interaction with 50+ characters and 100+ relationships

---

## **Future Enhancements:**
- **Relationship templates**: Pre-built family trees, friend groups, etc.
- **Character groups**: Visual clustering of related characters
- **Timeline integration**: Show how relationships change over story timeline
- **AI suggestions**: Suggest likely relationships based on character roles
- **Import/Export**: Share relationship maps between projects