# Feedback System Setup Instructions

## ✅ What's Been Done

The feedback system has been fully integrated! Here's what was created:

### Files Created:
- ✅ `database-feedback-setup.sql` - Database schema
- ✅ `src/lib/feedback/types.ts` - TypeScript types
- ✅ `src/components/feedback/FeedbackModal.tsx` - User feedback form
- ✅ `src/components/feedback/FeedbackButton.tsx` - Feedback button
- ✅ `src/app/api/feedback/route.ts` - API endpoint
- ✅ `src/app/admin/feedback/page.tsx` - Admin dashboard
- ✅ Updated `src/app/story/[id]/page.tsx` - Added feedback button

---

## 🚀 Setup Steps (Do These Now!)

### Step 1: Create Database Table

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file `database-feedback-setup.sql` in your project root
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run**

**Expected Result**: You should see "Success. No rows returned" - this is correct!

---

### Step 2: Configure Admin Email

Open `src/app/admin/feedback/page.tsx` and find line 12:

```typescript
const ADMIN_EMAIL = 'your@email.com' // TODO: Change this to your email
```

**Change it to your actual email address:**

```typescript
const ADMIN_EMAIL = 'youremail@example.com'
```

This controls who can access the admin dashboard at `/admin/feedback`.

---

### Step 3: Test the Feedback Flow

1. **Start your dev server** (if not already running)
2. **Open a story** in NeighborNotes
3. **Look for the feedback button** - It's next to the theme toggle in the top-right
4. **Click it and submit test feedback**:
   - Try submitting as a logged-in user
   - Try different feedback types (Bug, Feature, General)
5. **Check the admin dashboard** at `/admin/feedback`

---

## 🎨 What Users Will See

### Feedback Button
- Located in top-right toolbar (next to theme toggle)
- MessageSquare icon
- Opens modal on click

### Feedback Modal
- Type selector (Bug, Feature, General)
- Title field
- Description textarea
- Optional email field (auto-filled if logged in)
- Submit button with loading state
- Success message after submission

### Admin Dashboard (`/admin/feedback`)
- Only accessible by admin email
- Filter by status and type
- Search functionality
- Click any feedback to view details
- Update status, priority, and add admin notes
- Delete feedback

---

## 🔒 Security Features Included

✅ **Rate Limiting**: 5 submissions per hour per user/IP
✅ **Input Validation**: Using Zod schemas
✅ **Admin Protection**: Only specified email can access admin dashboard
✅ **RLS Policies**: Users can only see their own feedback (admins see all)

---

## 📊 Testing Checklist

**User Flow:**
- [ ] Feedback button appears in top-right toolbar
- [ ] Modal opens when clicked
- [ ] All form fields work correctly
- [ ] Can submit feedback as logged-in user
- [ ] Can submit feedback as anonymous user (email optional)
- [ ] Success message appears after submission
- [ ] Modal closes after success

**Admin Flow:**
- [ ] Can access `/admin/feedback` with admin email
- [ ] Non-admins redirected to dashboard
- [ ] Can view all feedback submissions
- [ ] Can filter by type and status
- [ ] Can search feedback
- [ ] Can update status and priority
- [ ] Can add admin notes
- [ ] Can delete feedback

---

## 🎯 Common Issues & Solutions

### "Cannot read feedback table"
**Problem**: Database table not created
**Solution**: Run the SQL script in Supabase SQL Editor

### "Not authorized to access admin dashboard"
**Problem**: Email doesn't match ADMIN_EMAIL
**Solution**: Update ADMIN_EMAIL in `/app/admin/feedback/page.tsx`

### "Rate limit exceeded"
**Problem**: Submitted too many test feedbacks
**Solution**: Wait 1 hour or restart dev server (rate limit is in-memory)

### "Feedback button not showing"
**Problem**: Component import issue
**Solution**: Restart dev server

---

## 🚀 Ready to Launch!

Once you've completed the setup steps above, your feedback system is ready for production!

**To access admin dashboard in production:**
- Navigate to: `yourdomain.com/admin/feedback`
- Make sure you're logged in with the admin email

---

## 🎨 Optional Enhancements (Later)

Want to add more features? Consider:

1. **Email Notifications**: Get emailed when new feedback arrives
2. **Screenshot Uploads**: Let users attach images
3. **Reply System**: Respond to feedback in-app
4. **Public Roadmap**: Show users what's being worked on
5. **Voting System**: Let users upvote suggestions

All these are documented in `FEEDBACK-SYSTEM-PLAN.md`!

---

**Need Help?** Check the full implementation plan in `FEEDBACK-SYSTEM-PLAN.md`
