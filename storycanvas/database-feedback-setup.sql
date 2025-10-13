-- ====================================
-- STORYCANVAS FEEDBACK SYSTEM SETUP
-- ====================================
-- Copy this ENTIRE file and paste it into:
-- Supabase Dashboard → SQL Editor → New Query
-- Then click RUN or press Cmd/Ctrl + Enter
-- ====================================

-- Drop existing table and policies if they exist (for clean reinstall)
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP TABLE IF EXISTS feedback;

-- Create the feedback table
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

-- Create indexes for performance
CREATE INDEX feedback_user_id_idx ON feedback(user_id);
CREATE INDEX feedback_status_idx ON feedback(status);
CREATE INDEX feedback_type_idx ON feedback(type);
CREATE INDEX feedback_created_at_idx ON feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit feedback (logged in or anonymous)
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to update their own feedback
CREATE POLICY "Users can update own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Feedback table created successfully!';
  RAISE NOTICE 'You can now use the feedback feature in StoryCanvas.';
END $$;
