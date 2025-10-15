# Bibliarch Authentication Upgrade Plan

**Goal:** Add professional authentication features (email confirmation, password reset, password change)

**Estimated Time:** 2-3 hours

---

## Overview

We're upgrading from basic login/signup to a full professional auth system with:
- ✅ Email confirmation when signing up
- ✅ "Forgot password?" flow
- ✅ Settings page to change password
- ✅ Customized email templates with Bibliarch branding

---

## Step 1: Assess Current Setup (5 min)

**What we're doing:** Check what auth pages already exist

**Files to examine:**
- `/src/app/login/page.tsx` - Current login page
- `/src/app/signup/page.tsx` - Current signup page (if exists)
- `/src/app/settings/page.tsx` - Settings page (probably doesn't exist yet)

**What we're looking for:**
- How is Supabase currently being used?
- What components exist?
- What's the current user flow?

---

## Step 2: Add Forgot Password Flow (30 min)

### 2a. Update Login Page
**File:** `/src/app/login/page.tsx`

**Add:**
- "Forgot password?" link below login button
- When clicked, show a simple modal/form asking for email
- Call `supabase.auth.resetPasswordForEmail(email)`
- Show success message: "Check your email for reset link!"

### 2b. Create Password Reset Page
**New file:** `/src/app/reset-password/page.tsx`

**What it does:**
- User clicks email link → lands here
- Shows form with "New Password" and "Confirm Password" fields
- On submit, calls `supabase.auth.updateUser({ password: newPassword })`
- Redirects to login with success message

**Code structure:**
```typescript
// Get reset token from URL
// Show password form
// Update password via Supabase
// Redirect to login
```

---

## Step 3: Create Settings Page (45 min)

**New file:** `/src/app/settings/page.tsx`

**Features:**
1. **Account Info Section**
   - Display current email (read-only)
   - Display account creation date

2. **Change Password Section**
   - Field: Current Password
   - Field: New Password
   - Field: Confirm New Password
   - Button: "Update Password"
   - Validates passwords match
   - Calls `supabase.auth.updateUser({ password: newPassword })`

3. **Navigation**
   - Add "Settings" link to main app header/nav
   - Add "Back to Stories" link

**Styling:**
- Use existing components (Card, Button, Input)
- Match Bibliarch design system
- Responsive layout

---

## Step 4: Update Signup Flow (15 min)

**File:** `/src/app/login/page.tsx` (or signup page if separate)

**Changes:**
- After successful signup, DON'T auto-login
- Instead show message:
  ```
  "Account created! Check your email to confirm your account."
  ```
- User must click confirmation link before they can log in
- Add helper text: "Didn't get email? Check spam folder"

**Optional - Resend Confirmation:**
- Add "Resend confirmation email" button
- Calls `supabase.auth.resend({ type: 'signup', email })`

---

## Step 5: Configure Supabase (20 min)

### 5a. Enable Email Confirmation

**In Supabase Dashboard:**
1. Go to **Authentication → Settings**
2. Find **Email Auth** section
3. Toggle ON: "Confirm email"
4. Save changes

### 5b. Set Redirect URLs

**In Supabase Dashboard:**
1. Go to **Authentication → URL Configuration**
2. Add these to "Redirect URLs":
   - `http://localhost:3000/reset-password`
   - `https://yourdomain.com/reset-password` (when deployed)
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (when deployed)

### 5c. Configure Site URL

**In Supabase Dashboard:**
1. Still in **URL Configuration**
2. Set "Site URL" to:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

---

## Step 6: Customize Email Templates (30 min)

**In Supabase Dashboard:**
1. Go to **Authentication → Email Templates**
2. Customize each template:

### Templates to Update:

**A) Confirm Signup**
```
Subject: Welcome to Bibliarch! Confirm your account

Hi there!

Thanks for joining Bibliarch - your visual story planning tool.

Click the link below to confirm your email and start creating:
{{ .ConfirmationURL }}

Happy writing!
- The Bibliarch Team
```

**B) Reset Password**
```
Subject: Reset your Bibliarch password

Hi!

Someone (hopefully you!) requested to reset your Bibliarch password.

Click here to set a new password:
{{ .ConfirmationURL }}

If you didn't request this, you can safely ignore this email.

- The Bibliarch Team
```

**C) Magic Link** (optional - passwordless login)
```
Subject: Your Bibliarch login link

Hi!

Click the link below to sign in to Bibliarch:
{{ .ConfirmationURL }}

This link expires in 1 hour.

- The Bibliarch Team
```

**D) Change Email**
```
Subject: Confirm your new email for Bibliarch

Hi!

You requested to change your email address for Bibliarch.

Click here to confirm your new email:
{{ .ConfirmationURL }}

- The Bibliarch Team
```

---

## Testing Checklist

After implementation, test these flows:

### New User Signup
- [ ] Create account with valid email
- [ ] Check email received
- [ ] Click confirmation link
- [ ] Try to log in (should work after confirmation)
- [ ] Try to log in before confirmation (should fail)

### Forgot Password
- [ ] Click "Forgot password?" on login page
- [ ] Enter email, submit
- [ ] Check email received
- [ ] Click reset link
- [ ] Set new password
- [ ] Log in with new password

### Change Password (Logged In)
- [ ] Go to Settings page
- [ ] Try wrong current password (should fail)
- [ ] Enter correct current password + new password
- [ ] Submit
- [ ] Log out
- [ ] Log in with new password

### Edge Cases
- [ ] Try to use password reset link twice (should fail)
- [ ] Try expired reset link (should fail)
- [ ] Try to signup with existing email (should show error)
- [ ] Resend confirmation email

---

## Files That Will Be Created/Modified

### New Files:
- `/src/app/reset-password/page.tsx` - Password reset page
- `/src/app/settings/page.tsx` - User settings page

### Modified Files:
- `/src/app/login/page.tsx` - Add forgot password link
- Main navigation/header component - Add settings link
- Signup flow - Add email confirmation message

### Configuration:
- Supabase dashboard settings (no code files)
- Email templates (in Supabase)

---

## Notes & Considerations

### Security
- Supabase handles all token generation/validation
- Password reset links expire automatically
- Passwords are never stored in plain text
- Email confirmation prevents fake signups

### User Experience
- Clear error messages for all scenarios
- Loading states for all async operations
- Success confirmations with toast notifications
- Helpful hints ("Check spam folder", etc.)

### Future Enhancements (NOT in this plan)
- Two-factor authentication
- OAuth providers (Google, GitHub)
- Session management (see all devices)
- Account deletion
- Email change flow
- Profile pictures/avatars

---

## Ready to Start?

When you're ready, we'll begin with **Step 1** - examining your current auth setup!
