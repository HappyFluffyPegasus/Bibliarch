# Bibliarch Technical Stack Document

## 1. Core Technology Decisions

### 1.1 Guiding Principles
- **KISS**: Keep It Simple, Stupid
- **MVP First**: Ship fast, iterate later
- **Modern Standards**: Use 2025 best practices
- **Developer Experience**: Quick iteration on Windows laptop
- **Managed Services**: Minimize DevOps overhead

### 1.2 Primary Stack
- **Framework**: Next.js 15 (App Router)
- **Deployment**: Vercel
- **Database**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Package Manager**: pnpm (faster, efficient)

## 2. Frontend Architecture

### 2.1 Next.js Configuration
```javascript
// Core Next.js 15 setup
- App Router for file-based routing
- Server Components by default
- Client Components for interactivity
- API Routes for backend logic
- Static + Dynamic rendering mix
```

### 2.2 Canvas Implementation
**Primary Library**: Konva.js with react-konva
- Battle-tested for complex canvas apps
- Excellent React integration
- Handles drag-drop, zoom, pan natively
- Good performance with many nodes

**Alternative Considered**: Fabric.js
- More complex API
- Konva better for our node-based UI

### 2.3 UI Component Libraries
**Primary**: shadcn/ui
- Copy-paste components (no dependency)
- Tailwind-based styling
- Highly customizable
- Radix UI primitives underneath

**Supporting**:
- Radix UI: Accessible primitives
- Lucide React: Icon library
- React Hook Form: Form management
- Zod: Schema validation

### 2.4 State Management
**Client State**: Zustand
- Simple, lightweight
- TypeScript-first
- No boilerplate
- Persist middleware for local storage

**Server State**: TanStack Query
- Caching and synchronization
- Optimistic updates
- Background refetching
- Mutation management

### 2.5 Styling Architecture
```css
/* Tailwind CSS + CSS Modules hybrid */
- Tailwind for utilities
- CSS Modules for complex components
- CSS Variables for theming
- PostCSS for processing
```

**Theme Structure**:
```typescript
// Theme tokens
colors: {
  light: { bg, text, border, ... },
  dark: { bg, text, border, ... }
}
```

## 3. Backend Architecture

### 3.1 Supabase Setup

**Core Services Used**:
1. **Authentication**
   - Email/password auth
   - Session management
   - Row Level Security (RLS)

2. **Database** (PostgreSQL)
   - User profiles
   - Stories metadata
   - Canvas data (JSONB)
   - Relationships graph

3. **Storage**
   - User uploaded images
   - Mood board assets
   - Character art
   - CDN delivery included

4. **Realtime** (Future)
   - Collaboration features
   - Live presence

### 3.2 Database Schema

```sql
-- Simplified schema
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT,
  created_at TIMESTAMP
)

stories (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  title TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  settings JSONB
)

canvas_data (
  id UUID PRIMARY KEY,
  story_id UUID REFERENCES stories,
  canvas_type TEXT, -- 'main', 'character', 'world', etc
  parent_id UUID, -- for nested canvases
  nodes JSONB, -- node positions, content
  connections JSONB, -- arrows/relationships
  updated_at TIMESTAMP
)

characters (
  id UUID PRIMARY KEY,
  story_id UUID REFERENCES stories,
  profile_data JSONB,
  relationships JSONB,
  ai_context JSONB
)

-- Optimized JSONB for flexibility during MVP
```

### 3.3 API Architecture

**Next.js API Routes**:
```typescript
/api/
  /auth/        -- Supabase auth wrappers
  /stories/     -- CRUD operations
  /canvas/      -- Save/load canvas data
  /ai/          -- AI interaction endpoints
  /import/      -- Document processing
```

**Data Flow**:
1. Client → Next.js API Route
2. API Route → Supabase validation
3. Supabase → Data operation
4. Response → Client with caching

## 4. AI Integration

### 4.1 LLM Provider Options

**Primary**: OpenAI API
- GPT-4 for quality output
- Function calling for structured data
- Streaming for better UX
- Embeddings for semantic search

**Fallback**: Anthropic Claude
- Similar capabilities
- Good for creative writing
- Backup during outages

### 4.2 Context Management

```typescript
// Context assembly pipeline
interface AIContext {
  story: StoryMetadata
  characters: CharacterProfile[]
  relationships: RelationshipGraph
  worldRules: WorldSettings
  timeline: TimelineEvents[]
  userStyle: StyleProfile
}

// Smart truncation when needed
const prioritizeContext = (
  fullContext: AIContext,
  maxTokens: number
) => {
  // Priority order:
  // 1. Active characters
  // 2. Immediate relationships
  // 3. Relevant world rules
  // 4. Recent timeline
  // 5. Style hints
}
```

### 4.3 Prompt Engineering

**System Prompts Storage**: 
- Stored in codebase for version control
- Injected based on interaction type
- User style dynamically appended

**Streaming Implementation**:
```typescript
// Server-sent events for streaming
export async function POST(req: Request) {
  const stream = await openai.chat.completions.create({
    messages: [...],
    stream: true,
  })
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

## 5. File Processing

### 5.1 Document Import

**Libraries**:
- Mammoth.js: Word doc → HTML
- pdf-parse: PDF text extraction
- Google Docs API: Direct integration

**Processing Pipeline**:
```typescript
1. Upload to Supabase Storage (temp)
2. Next.js API processes file
3. Extract text/structure
4. Parse into nodes/sections
5. Clean up temp storage
6. Return structured data
```

### 5.2 Image Handling

**Upload Flow**:
1. Client-side resize (browser-image-compression)
2. Direct upload to Supabase Storage
3. Generate thumbnails via Supabase Functions
4. Return CDN URLs

**Optimization**:
- WebP format when possible
- Lazy loading with next/image
- Responsive sizes
- CDN caching

## 6. Development Environment

### 6.1 Local Setup (Windows)
```bash
# Required tools
- Node.js 20+ LTS
- pnpm package manager
- Git for Windows
- VS Code with extensions

# Environment variables
.env.local:
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_KEY=
  OPENAI_API_KEY=
```

### 6.2 Development Workflow
```bash
# Commands
pnpm dev         # Local development
pnpm build       # Production build
pnpm preview     # Test production locally
pnpm deploy      # Vercel deployment
```

### 6.3 Version Control
```
# Git structure
main          → Production (auto-deploy)
develop       → Staging (preview deploy)
feature/*     → Feature branches
```

## 7. Deployment Architecture

### 7.1 Vercel Configuration
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "regions": ["iad1"], // US East default
  "functions": {
    "api/ai/*": {
      "maxDuration": 60 // AI needs time
    }
  }
}
```

### 7.2 Environment Management
- Development: Local .env
- Preview: Vercel preview env
- Production: Vercel production env
- Secrets: Vercel encrypted env vars

### 7.3 Performance Optimization
**Edge Functions** for:
- Authentication checks
- Simple data fetching
- Static content serving

**Serverless Functions** for:
- AI interactions
- Heavy processing
- Database operations

## 8. Security Considerations

### 8.1 Authentication Flow
```typescript
// Supabase RLS policies
- Users can only access own stories
- Public profiles viewable (future)
- API routes verify session
- JWT stored in httpOnly cookies
```

### 8.2 Data Protection
- All user content encrypted at rest (Supabase)
- TLS for all connections
- Input sanitization for XSS
- Rate limiting on API routes
- CORS properly configured

### 8.3 API Security
```typescript
// Middleware protection
export async function middleware(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.redirect('/login')
  }
}
```

## 9. Monitoring & Analytics

### 9.1 Core Metrics (Vercel Analytics)
- Page load times
- API response times
- Error rates
- User sessions

### 9.2 Custom Events (PostHog)
```typescript
// Track key actions
posthog.capture('story_created')
posthog.capture('ai_interaction')
posthog.capture('node_created', { type })
```

### 9.3 Error Tracking (Sentry)
- Client-side errors
- API errors
- Source maps for debugging
- User context attached

## 10. Third-Party Services Summary

### 10.1 Required Services (MVP)
| Service | Purpose | Cost |
|---------|---------|------|
| Vercel | Hosting | Free tier → $20/mo |
| Supabase | Database + Auth | Free tier → $25/mo |
| OpenAI | AI/LLM | Pay-per-use ~$50/mo |
| PostHog | Analytics | Free tier sufficient |

### 10.2 Optional Services
| Service | Purpose | When Needed |
|---------|---------|-------------|
| Sentry | Error tracking | At scale |
| Cloudinary | Advanced image processing | Heavy image use |
| Resend | Transactional email | User notifications |

## 11. Performance Targets

### 11.1 Loading Performance
- Initial load: < 3s (3G connection)
- Canvas load: < 2s
- Node interaction: < 100ms
- AI response start: < 3s

### 11.2 Scalability Targets
- 100 concurrent users (MVP)
- 10,000 nodes per canvas
- 1MB canvas save size
- 50 stories per user

## 12. Development Libraries

### 12.1 Essential NPM Packages
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.x",
    "@supabase/auth-helpers-nextjs": "^0.x",
    "konva": "^9.x",
    "react-konva": "^18.x",
    "zustand": "^4.x",
    "@tanstack/react-query": "^5.x",
    "openai": "^4.x",
    "tailwindcss": "^3.x",
    "@radix-ui/react-*": "latest",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "mammoth": "^1.x",
    "posthog-js": "^1.x"
  }
}
```

### 12.2 Development Dependencies
```json
{
  "devDependencies": {
    "typescript": "^5.x",
    "@types/react": "^18.x",
    "eslint": "^8.x",
    "prettier": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x"
  }
}
```

## 13. Data Flow Architecture

### 13.1 Canvas Save Flow
```
User drags node → 
Konva updates position → 
Debounced save (500ms) → 
Zustand updates local state → 
API call to save → 
Supabase updates JSONB → 
Success confirmation
```

### 13.2 AI Interaction Flow
```
User selects characters → 
Assemble context from all sources → 
Send to OpenAI with system prompt → 
Stream response to client → 
Display with formatting → 
Cache for session
```

### 13.3 Import Flow
```
User uploads file → 
Stream to API route → 
Process with appropriate library → 
Extract structured data → 
Transform to nodes → 
Save to canvas → 
Update UI
```

## 14. Technical Risks & Mitigations

### 14.1 Identified Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Canvas performance with many nodes | High | Virtual scrolling, viewport culling |
| AI API costs | Medium | Token limits, caching, user quotas |
| Large file imports | Low | Chunked processing, progress bars |
| Browser compatibility | Low | Target modern browsers only |

### 14.2 Technical Debt Strategy
**Acceptable for MVP**:
- JSONB for all complex data (refactor later)
- Minimal test coverage (add post-launch)
- Basic error handling (enhance later)
- Simple caching strategy (optimize later)

**Not Acceptable**:
- Security vulnerabilities
- Data loss bugs
- Broken core features
- Terrible performance

## 15. Architecture Decisions Record

### ADR-001: Konva over Fabric.js
**Date**: 2025-01  
**Decision**: Use Konva.js for canvas  
**Reason**: Better React integration, simpler API for our needs  

### ADR-002: Supabase over Custom Backend
**Date**: 2025-01  
**Decision**: Use Supabase BaaS  
**Reason**: Faster MVP, built-in auth, managed infrastructure  

### ADR-003: JSONB over Normalized Tables
**Date**: 2025-01  
**Decision**: Store canvas data as JSONB  
**Reason**: Flexibility during MVP, easy schema evolution  

### ADR-004: Vercel over Self-Hosted
**Date**: 2025-01  
**Decision**: Deploy to Vercel  
**Reason**: Zero DevOps, great DX, automatic scaling  