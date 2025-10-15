# 🚀 SETUP FEEDBACK IN 2 MINUTES

You're getting the error because the database table doesn't exist. Here are TWO ways to fix it:

---

## ⚡ METHOD 1: Automatic (Try This First!)

### Go to: `http://localhost:3000/setup`

1. **Navigate to**: `http://localhost:3000/setup` in your browser
2. **Click the button**: "Create Feedback Table"
3. **Done!** The table will be created automatically

If this works, you're all set! ✅

---

## 📝 METHOD 2: Manual (If Method 1 Doesn't Work)

### Step-by-Step with Supabase:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com
   - Select your Bibliarch project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Copy the SQL**
   - Open the file: `database-feedback-setup.sql` (in your project root)
   - Press Ctrl+A to select all
   - Press Ctrl+C to copy

4. **Paste and Run**
   - Paste into the SQL Editor (Ctrl+V)
   - Click "Run" (or press Ctrl+Enter)
   - You should see: "Success. No rows returned" ✅

5. **Verify**
   - Click "Table Editor" in left sidebar
   - You should see a new table called "feedback"

6. **Restart Your Dev Server**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

7. **Test Feedback**
   - Go to any story page
   - Click the feedback button (top right)
   - Submit test feedback
   - Should work now! ✅

---

## ✅ How to Verify It Worked

After running either method:

1. **Check Supabase**: Go to Table Editor → You should see "feedback" table
2. **Test in App**: Submit feedback → Should show success message
3. **Check Admin**: Go to `/admin/feedback` → Should see your test feedback

---

## 🆘 Still Having Issues?

Tell me:
1. Which method you tried
2. What error you got
3. Screenshot of the Supabase Tables list

I'll fix it immediately!
