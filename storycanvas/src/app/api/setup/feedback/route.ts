import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('=== Feedback Table Setup API Called ===')

  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('User authenticated:', user.id)

    // Create the feedback table using raw SQL
    // We need to use the SQL query method
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create feedback table if it doesn't exist
        CREATE TABLE IF NOT EXISTS feedback (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

          user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          user_email TEXT,
          user_name TEXT,

          type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general', 'other')),
          title TEXT NOT NULL,
          description TEXT NOT NULL,

          page_url TEXT,
          browser_info TEXT,
          screen_size TEXT,

          status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'in_progress', 'resolved', 'wont_fix', 'duplicate')),
          priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),

          admin_notes TEXT,
          resolved_at TIMESTAMP WITH TIME ZONE,
          resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
        );

        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON feedback(user_id);
        CREATE INDEX IF NOT EXISTS feedback_status_idx ON feedback(status);
        CREATE INDEX IF NOT EXISTS feedback_type_idx ON feedback(type);
        CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback(created_at DESC);

        -- Enable RLS
        ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
        DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;

        -- Create policies
        CREATE POLICY "Anyone can submit feedback"
          ON feedback FOR INSERT
          WITH CHECK (true);

        CREATE POLICY "Users can view own feedback"
          ON feedback FOR SELECT
          USING (auth.uid() = user_id OR user_id IS NULL);
      `
    })

    if (createError) {
      console.error('Table creation error:', createError)

      // If rpc doesn't exist, we need a different approach
      // Try direct table check instead
      const { error: checkError } = await supabase
        .from('feedback')
        .select('id')
        .limit(1)

      if (checkError) {
        return NextResponse.json(
          {
            error: 'Could not create table automatically',
            details: 'Please run the SQL script manually in Supabase Dashboard → SQL Editor',
            sqlFile: 'database-feedback-setup.sql'
          },
          { status: 500 }
        )
      }

      // Table exists, we're good
      console.log('Table already exists (check succeeded)')
    }

    // Verify the table was created
    const { error: verifyError } = await supabase
      .from('feedback')
      .select('id')
      .limit(1)

    if (verifyError) {
      console.error('Verification error:', verifyError)
      return NextResponse.json(
        {
          error: 'Table creation failed',
          details: verifyError.message,
          hint: 'Please run the SQL script manually in Supabase Dashboard → SQL Editor. File: database-feedback-setup.sql'
        },
        { status: 500 }
      )
    }

    console.log('✅ Feedback table verified successfully')
    return NextResponse.json({
      success: true,
      message: 'Feedback table created successfully'
    })

  } catch (error) {
    console.error('=== Setup Error ===')
    console.error(error)
    return NextResponse.json(
      {
        error: 'Setup failed',
        details: error instanceof Error ? error.message : String(error),
        hint: 'Please run the SQL script manually in Supabase Dashboard → SQL Editor. File: database-feedback-setup.sql'
      },
      { status: 500 }
    )
  }
}
