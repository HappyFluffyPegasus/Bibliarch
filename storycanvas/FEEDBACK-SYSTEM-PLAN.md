# Comprehensive Feedback System Implementation Plan

## 🗄️ Database Schema

### New Table: `feedback`
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- User Info
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,

  -- Feedback Content
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Context (helpful for debugging)
  page_url TEXT,
  browser_info TEXT,
  screen_size TEXT,

  -- Status Tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'in_progress', 'resolved', 'wont_fix', 'duplicate')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Admin Notes
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX feedback_user_id_idx ON feedback(user_id);
CREATE INDEX feedback_status_idx ON feedback(status);
CREATE INDEX feedback_type_idx ON feedback(type);
CREATE INDEX feedback_created_at_idx ON feedback(created_at DESC);

-- RLS Policies
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can create feedback (even if not logged in)
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Only admins can view all feedback (we'll add admin check later)
-- For now, you'll access via service key in admin route
```

---

## 🎨 User-Facing Feedback UI

### 1. **Feedback Button Location**
**Top-right toolbar** (with Settings ⚙️ and Help ❓):
```tsx
<button className="feedback-button">
  <MessageSquare /> {/* Lucide icon */}
  Feedback
</button>
```

### 2. **Feedback Modal Design**
```
┌─────────────────────────────────────────┐
│  Send Feedback                    ✕     │
├─────────────────────────────────────────┤
│                                         │
│  What type of feedback?                 │
│  [  Bug Report  ▼ ]                    │
│                                         │
│  Title                                  │
│  [Brief description of the issue]       │
│                                         │
│  Details                                │
│  ┌─────────────────────────────────┐   │
│  │ Tell us more...                  │   │
│  │                                  │   │
│  │                                  │   │
│  │                                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📧 Your email (optional)               │
│  [email@example.com]                    │
│                                         │
│  [ Cancel ]           [ Submit ] ←─blue │
└─────────────────────────────────────────┘
```

### 3. **Feedback Form Fields**

**Type Dropdown:**
- 🐛 Bug Report - "Something isn't working"
- 💡 Feature Suggestion - "I have an idea"
- 💬 General Feedback - "Other thoughts"

**Auto-Captured Context** (hidden from user):
- Current page URL
- Browser: `navigator.userAgent`
- Screen size: `window.innerWidth x window.innerHeight`
- User info (if logged in): email, username, user_id

**Success State:**
```
┌─────────────────────────────────────────┐
│              ✓ Thank you!               │
├─────────────────────────────────────────┤
│                                         │
│  Your feedback has been submitted.      │
│  We'll review it shortly!               │
│                                         │
│           [ Close ]                     │
└─────────────────────────────────────────┘
```

---

## 🔧 Admin Dashboard Design

### Route: `/admin/feedback`

### **Protected Access**
```typescript
// Middleware to check if user is admin
// Option 1: Hardcode your email
const ADMIN_EMAILS = ['your@email.com'];

// Option 2: Add is_admin column to profiles table
```

### **Dashboard Layout**
```
┌──────────────────────────────────────────────────────────────┐
│  NeighborNotes Admin - Feedback Dashboard                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Filter: [All ▼] [All Types ▼]     Search: [_________] 🔍   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🐛 Bug Report  •  NEW                HIGH            │   │
│  │ Text cursor jumping when typing in nodes            │   │
│  │ by john@example.com • 2 hours ago                   │   │
│  │ [View Details]                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💡 Feature  •  REVIEWING              MEDIUM        │   │
│  │ Add keyboard shortcuts for node creation            │   │
│  │ by sarah_writer • Yesterday                         │   │
│  │ [View Details]                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### **Detailed View (Modal/Sidebar)**
```
┌─────────────────────────────────────────┐
│  Feedback Details                  ✕    │
├─────────────────────────────────────────┤
│                                         │
│  🐛 BUG REPORT                          │
│  Text cursor jumping when typing        │
│                                         │
│  Description:                           │
│  When I type in a text node, the       │
│  cursor keeps jumping to the start...   │
│                                         │
│  ─────────────────────────────────────  │
│  📧 john@example.com                    │
│  👤 john_writer                         │
│  🕐 Jan 9, 2025 3:42 PM                │
│  📍 /story/abc123                       │
│  💻 Chrome 120 on Windows               │
│  📐 1920x1080                           │
│  ─────────────────────────────────────  │
│                                         │
│  Status: [  New  ▼ ]                   │
│  Priority: [ High ▼ ]                  │
│                                         │
│  Admin Notes:                           │
│  ┌─────────────────────────────────┐   │
│  │ Internal notes...                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [ Delete ]             [ Save ]        │
└─────────────────────────────────────────┘
```

---

## 📁 File Structure

```
src/
├── app/
│   ├── api/
│   │   └── feedback/
│   │       └── route.ts              # POST endpoint for submissions
│   └── admin/
│       └── feedback/
│           └── page.tsx              # Admin dashboard
│
├── components/
│   ├── feedback/
│   │   ├── FeedbackButton.tsx       # Trigger button
│   │   ├── FeedbackModal.tsx        # Submission form
│   │   └── FeedbackList.tsx         # Admin list view
│   └── admin/
│       └── ProtectedRoute.tsx       # Admin auth wrapper
│
└── lib/
    └── feedback/
        ├── types.ts                  # TypeScript types
        └── actions.ts                # Server actions for admin updates
```

---

## 🔐 Security Considerations

### 1. **Rate Limiting**
```typescript
// Prevent spam: Max 5 submissions per IP per hour
// Use Vercel Edge Config or simple in-memory cache
```

### 2. **Input Validation**
```typescript
// Zod schema
const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'other']),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  email: z.string().email().optional(),
});
```

### 3. **Admin Authentication**
```typescript
// Check if user is admin before showing dashboard
// Option A: Hardcode emails
const isAdmin = session?.user?.email === 'your@email.com';

// Option B: Add to database
// ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
```

### 4. **Sanitization**
```typescript
// Sanitize user input to prevent XSS
import DOMPurify from 'isomorphic-dompurify';
const clean = DOMPurify.sanitize(description);
```

---

## 🚀 Implementation Steps

### **Phase 1: Database Setup** (10 min)
1. Run SQL to create `feedback` table
2. Set up RLS policies
3. Test with manual insert

### **Phase 2: User-Facing UI** (1-2 hours)
1. Create `FeedbackButton.tsx` component
2. Add to top-right toolbar (alongside Settings/Help)
3. Create `FeedbackModal.tsx` with form
4. Implement form validation with Zod
5. Add API route `/api/feedback` for submissions
6. Test submission flow end-to-end
7. Add success/error toast notifications

### **Phase 3: Admin Dashboard** (2-3 hours)
1. Create `/admin/feedback` page
2. Add admin authentication check
3. Fetch all feedback from database
4. Build list view with filtering
5. Create detail modal for viewing/editing
6. Add status/priority update functionality
7. Add search capability
8. Test admin workflows

### **Phase 4: Polish** (30 min)
1. Add loading states
2. Error handling
3. Responsive design
4. Keyboard shortcuts (Esc to close)
5. Analytics tracking (optional)

---

## 🎯 Feature Enhancements (Optional)

### Later Additions:
1. **Email Notifications**: Get notified when new feedback arrives
2. **Screenshot Upload**: Users can attach images
3. **Reply System**: Admin can respond to feedback
4. **Public Roadmap**: Users see what's being worked on
5. **Voting System**: Users upvote suggestions
6. **Auto-categorization**: AI categorizes feedback type
7. **GitHub Integration**: Create issues from feedback

---

## 📊 Database Queries You'll Use

### **Get All Feedback (Admin)**
```typescript
const { data } = await supabase
  .from('feedback')
  .select('*')
  .order('created_at', { ascending: false });
```

### **Filter by Status**
```typescript
const { data } = await supabase
  .from('feedback')
  .select('*')
  .eq('status', 'new')
  .order('created_at', { ascending: false });
```

### **Search**
```typescript
const { data } = await supabase
  .from('feedback')
  .select('*')
  .or(`title.ilike.%${query}%,description.ilike.%${query}%`);
```

### **Update Status**
```typescript
await supabase
  .from('feedback')
  .update({ status: 'resolved', resolved_at: new Date() })
  .eq('id', feedbackId);
```

---

## 🎨 UI Component Details

### **Color Coding by Type**
- 🐛 **Bug**: Red/pink background (`bg-red-50` border `border-red-200`)
- 💡 **Feature**: Blue background (`bg-blue-50` border `border-blue-200`)
- 💬 **General**: Gray background (`bg-gray-50` border `border-gray-200`)

### **Status Badges**
- **NEW**: Blue badge with dot
- **REVIEWING**: Yellow badge
- **IN_PROGRESS**: Orange badge
- **RESOLVED**: Green badge
- **WONT_FIX**: Gray badge

### **Priority Indicators**
- 🔴 **Critical**: Red
- 🟠 **High**: Orange
- 🟡 **Medium**: Yellow
- 🟢 **Low**: Green

---

## ✅ Testing Checklist

**User Flow:**
- [ ] Can open feedback modal from toolbar
- [ ] All form fields validate correctly
- [ ] Can submit as logged-in user (auto-fills email)
- [ ] Can submit as anonymous user
- [ ] See success message after submission
- [ ] Modal closes after success

**Admin Flow:**
- [ ] Only admin can access `/admin/feedback`
- [ ] Can view all feedback submissions
- [ ] Can filter by type and status
- [ ] Can search feedback
- [ ] Can update status and priority
- [ ] Can add admin notes
- [ ] Changes persist to database

**Edge Cases:**
- [ ] Rate limiting prevents spam
- [ ] Long descriptions don't break UI
- [ ] Special characters are sanitized
- [ ] Works on mobile
- [ ] Keyboard navigation works

---

## 🚦 Launch Checklist

Before launching:
1. ✅ Database table created
2. ✅ RLS policies configured
3. ✅ Your email added to admin list
4. ✅ Rate limiting enabled
5. ✅ Test submissions from production
6. ✅ Admin dashboard accessible
7. ✅ Error handling in place

---

## 📝 Notes

- Keep it simple for MVP - no screenshot uploads initially
- Admin dashboard uses your email for now (can add is_admin column later)
- Rate limiting prevents spam but isn't hardcore enterprise-level
- Blue theme matches existing app design
- Works for both logged-in and anonymous users
