# IMPORTANT: Supabase Setup for No Email Confirmation

## Required Settings in Supabase Dashboard

1. **Go to Authentication > Providers > Email**
   - DISABLE "Confirm email" 
   - DISABLE "Secure email change"
   - DISABLE "Secure password change"

2. **Go to Authentication > Email Templates**
   - You can ignore all email templates since we're not using email confirmation

3. **Go to Authentication > URL Configuration**
   - Add `http://localhost:3000` to Redirect URLs
   - Add your production URL when deploying

4. **SQL to run in SQL Editor to bypass email confirmation:**

```sql
-- Allow users to sign up without email confirmation
ALTER TABLE auth.users 
ALTER COLUMN email_confirmed_at 
SET DEFAULT now();

-- Update existing users to be confirmed
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;
```

## Testing Account
- Email: test@test.com (or any email)
- Password: any password (no restrictions)
- Username: any username

## If Still Having Issues

Run this in SQL Editor to manually confirm a user:
```sql
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now()
WHERE email = 'test@test123.com';
```