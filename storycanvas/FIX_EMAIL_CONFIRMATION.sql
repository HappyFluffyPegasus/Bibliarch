-- Run this in Supabase SQL Editor to fix email confirmation issues

-- 1. Update any existing unconfirmed users to be confirmed
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- 2. Create a trigger to auto-confirm new users on signup
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_user();

-- 4. Specifically confirm your test users
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email IN ('test@test.com', 'test@test123.com') 
  AND email_confirmed_at IS NULL;

-- 5. Check if it worked
SELECT email, email_confirmed_at, confirmed_at 
FROM auth.users 
WHERE email IN ('test@test.com', 'test@test123.com');