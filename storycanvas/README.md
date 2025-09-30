# 🎨 **StoryCanvas - Visual Story Planning Tool**

**Status**: Active Development
**Version**: Master State (September 29, 2025)
**Priority**: This is a [Next.js](https://nextjs.org) visual story planning application

---

## 🚨 **IMPORTANT: MASTER BACKUP AVAILABLE**

**Primary Backup Location**: `./backups/backup-MASTER-STATE-20250929/`
**Documentation**: See `MASTER-BACKUP-README.md` in the backup directory
**Use this backup** for all restoration and reference needs

---

## 🚀 **Getting Started**

### **Development Server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

**Note**: User runs their own separate server - do not start your own server for this project.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### **Project Structure**
- **Main Canvas**: `src/components/canvas/HTMLCanvas.tsx`
- **Templates**: `src/lib/templates.ts`
- **Documentation**: `01-Progress-Report.md` (comprehensive status)

---

## ✅ **Current Feature Set**

### **Core Canvas System**
- ✅ **Complete Node System** - Text, Character, Event, Location, Folder, List, Image, Table nodes
- ✅ **Seamless Text Editing** - Click-to-edit with natural cursor behavior
- ✅ **Auto-Scaling Nodes** - Dynamic sizing based on content
- ✅ **Modern Drag System** - Click-and-hold dragging without visual handles
- ✅ **Layer/Z-Index System** - Up/down arrow controls for node layering

### **Advanced Features**
- ✅ **Character Profile Pictures** - Upload, cropping, and display system
- ✅ **Single-Click Arrow Navigation** - Navigate into folders/characters
- ✅ **List Container System** - Drag nodes into organizational containers
- ✅ **Image Node System** - Manual resize with aspect ratio preservation
- ✅ **Table Node System** - Dynamic rows/columns with clean borders
- ✅ **Template System** - Simplified story structure templates

### **State & Persistence**
- ✅ **Zustand State Management** - Complete state persistence
- ✅ **Auto-Save System** - 2-second debounced saving to Supabase
- ✅ **Undo/Redo System** - Full history management
- ✅ **Multiple Canvas Support** - Navigate between different canvases

---

## ⚠️ **Known Issues**

### **Critical Issues**
1. **Navigation Looping** - Character nodes (especially in lists) create infinite loops
2. **Save System** - Changes inside character canvases may not persist properly
3. **Timeline System** - Event nodes have typing backwards issue
4. **Folder Navigation** - May show wrong content/breadcrumbs in some cases

*See `01-Progress-Report.md` for detailed issue descriptions and attempted fixes.*

---

## 📋 **Planned Features**

### **Priority Systems to Implement**
1. **Timeline System** - Storyboard-style event nodes with duration bars
2. **Relationship System** - Visual character relationship mapping
3. **Advanced Analytics** - Story structure analysis tools
4. **Real-time Collaboration** - Multi-user editing capabilities

*See implementation plans: `TIMELINE-SYSTEM-PLAN.md` and `RELATIONSHIP-SYSTEM-PLAN.md`*

---

## 🛠️ **Tech Stack**

- **Frontend**: Next.js 15, React 19, TypeScript
- **Canvas System**: HTML-based canvas with custom node rendering
- **UI Framework**: Tailwind CSS, Radix UI components
- **State Management**: Zustand
- **Backend**: Supabase (authentication & database)
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)

---

## 📚 **Documentation**

### **Primary Documentation**
- **`01-Progress-Report.md`** - Complete development history and current status
- **`MASTER-BACKUP-README.md`** - Master backup restoration instructions
- **`01-PRODUCT-SPECIFICATION.md`** - Product vision and requirements

### **Implementation Plans**
- **`TIMELINE-SYSTEM-PLAN.md`** - Storyboard timeline system design
- **`RELATIONSHIP-SYSTEM-PLAN.md`** - Character relationship mapping design
- **`03-PHASED-IMPLEMENTATION-PLAN.md`** - Development roadmap

### **User Research**
- **`02-USER-STORIES.md`** - User personas and use cases
- **`04-WHAT-NOT-TO-INCLUDE.md`** - Features to avoid

---

## 🔧 **Development Guidelines**

### **Making Changes**
1. **Create backup** before major changes
2. **Test thoroughly** - especially text editing and navigation
3. **Update documentation** - keep progress report current
4. **Preserve working features** - avoid regressions

### **Debugging Issues**
1. Check `01-Progress-Report.md` for known issues and attempted fixes
2. Use console logging to trace navigation and save operations
3. Test in multiple browsers and scenarios
4. Verify database persistence in Supabase

### **Key Files to Monitor**
- `src/components/canvas/HTMLCanvas.tsx` - Main canvas component (2500+ lines)
- `src/lib/templates.ts` - Story templates and node structures
- `src/app/story/[id]/page.tsx` - Canvas page with navigation logic
- `src/app/globals.css` - Styling for contentEditable and node systems

---

## 📊 **Project Status**

**Development Period**: September 15-29, 2025 (14 days intensive development)
**Total Backups**: 22+ backup iterations
**Current State**: Advanced visual story planning tool with sophisticated node system
**Next Priority**: Fix critical navigation and save issues

---

## 🎯 **Success Metrics**

**User Experience Goals**: ✅ Achieved
- Seamless text editing, intuitive node management, visual story organization

**Technical Goals**: ✅ Achieved
- Type safety, performance optimization, maintainable architecture

**Outstanding Goals**: ⏳ In Progress
- Navigation stability, save system reliability, timeline implementation

---

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.