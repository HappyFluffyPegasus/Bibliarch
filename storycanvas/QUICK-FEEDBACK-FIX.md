# Quick Feedback Fix

You're getting "Failed to submit feedback". Here's how to fix it:

---

## Step 1: Check the Error Details

I just added better error messages. **Try submitting feedback again** and look at:

1. **The error message in the modal** - It should now show more details
2. **Browser Console** (press F12 → Console tab) - Look for red error messages

The error will now tell you exactly what's wrong!

---

## Most Likely Issue: Database Table Doesn't Exist

### Fix: Run the SQL Script in Supabase

1. **Open your Supabase Dashboard** (supabase.com → your project)
2. **Click "SQL Editor"** in the left sidebar
3. **Open this file** in your code editor: `database-feedback-setup.sql`
4. **Copy ALL the SQL** from that file
5. **Paste it** into the Supabase SQL Editor
6. **Click "Run"** (or press Cmd/Ctrl + Enter)

You should see: **"Success. No rows returned"** ✅

---

## Step 2: Restart Your Dev Server

```bash
# In your terminal, stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

## Step 3: Try Again

Submit feedback again. It should work now!

---

## Still Not Working?

Tell me the **exact error message** you see after submitting, and I'll fix it immediately.

Common errors:
- **"relation 'feedback' does not exist"** → You need to run the SQL script
- **"permission denied"** → RLS policy issue (I'll fix)
- **"rate limit exceeded"** → Wait 1 hour or restart dev server
