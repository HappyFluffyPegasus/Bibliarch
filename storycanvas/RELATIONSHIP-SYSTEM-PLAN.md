# **StoryCanvas Relationship System Implementation Plan**

## **Overview**
A visual relationship mapping system where users can connect character profile pictures with colored lines to show different types of relationships, making story planning more intuitive and visual.

---

## **What We're Building:**
A visual map where users can connect character profile pictures with colored lines to show relationships, just like drawing connections on a poster board!

---

## **How It Will Work:**

### **Step 1: The Relationship Canvas**
- **Where**: Add a new section to the "Characters & Relationships" folder
- **What**: A special canvas that automatically shows all characters with their profile pictures
- **Layout**: Characters appear as circles with their uploaded profile pictures inside

### **Step 2: Creating Relationships**
**User clicks a "Connect" button, then:**
1. **Click first character** → their circle gets a blue glow
2. **Click second character** → a line appears between them
3. **Relationship popup opens** asking:
   - What type of relationship? (dropdown menu)
   - How strong? (1-3 dots for weak/medium/strong)
   - Any notes? (text box for details)

### **Step 3: Relationship Types & Colors**
- 🔴 **Red**: Romantic (dating, married, crushes)
- 🔵 **Blue**: Family (siblings, parents, cousins)
- 🟢 **Green**: Friends (best friends, close friends)
- 🟠 **Orange**: Work/Professional (boss, coworker, teammates)
- 🟣 **Purple**: Rivals/Enemies (hate, competition, conflicts)
- ⚫ **Gray**: Other (neighbors, strangers, complicated)

### **Step 4: Line Styles Show Strength**
- **Thick solid line**: Strong relationship
- **Medium line**: Normal relationship
- **Thin dotted line**: Weak/distant relationship

### **Step 5: Interactive Features**
- **Hover over line**: Shows relationship label (like "siblings" or "rivals")
- **Click on line**: Opens details popup to edit or delete
- **Filter buttons**: Hide/show certain relationship types
- **Legend**: Color guide in corner of canvas

---

## **Technical Implementation:**

### **File Changes Needed:**
1. **Add to templates.ts**: New relationship canvas template
2. **Update HTMLCanvas.tsx**: Add relationship mode and connection drawing
3. **New component**: RelationshipModal for editing relationship details
4. **Update character template**: Add "View Relationships" button

### **How the Code Works:**
1. **Character Detection**: System finds all character nodes and their profile pictures
2. **Connection Tool**: New tool mode for drawing relationship lines
3. **Data Storage**: Relationships saved as special connection objects with extra data
4. **Visual Rendering**: Different colored SVG lines drawn between character circles

### **User Interface:**
- **Toolbar button**: "Relationships" mode (like existing text/image tools)
- **Relationship panel**: Shows legend and filter checkboxes
- **Quick add buttons**: Common relationships like "Make them siblings" or "Make them friends"

---

## **User Workflow Example:**
1. Go to Characters & Relationships folder
2. Click "View Relationship Map" button
3. See all characters laid out with their photos
4. Click "Add Relationship" tool
5. Click Mom character, then Dad character
6. Select "Family → Married" from dropdown
7. Red line appears connecting them!
8. Repeat for all character relationships

**Result**: Visual family tree/relationship web that updates automatically when you add new characters!

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