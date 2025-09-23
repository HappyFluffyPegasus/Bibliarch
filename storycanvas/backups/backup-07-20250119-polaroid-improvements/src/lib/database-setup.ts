// Simple database setup helper for users who haven't run the SQL setup
import { createClient } from '@/lib/supabase/client'

export async function checkDatabaseSetup() {
  const supabase = createClient()
  
  try {
    // Test if stories table exists and is accessible
    const { data, error } = await supabase
      .from('stories')
      .select('count', { count: 'exact', head: true })
    
    return {
      storiesTable: !error,
      error: error?.message
    }
  } catch (error) {
    return {
      storiesTable: false,
      error: String(error)
    }
  }
}

export async function createUserProfile(user: any) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || 'Storyteller',
        created_at: new Date().toISOString()
      })
    
    return { success: !error, error: error?.message }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function createBasicTables() {
  // This is a fallback - users should really run the proper SQL setup
  // But this can help in development
  console.log('Database tables need to be set up manually via Supabase SQL editor')
  console.log('Please run the database-setup.sql file in your Supabase SQL editor')
  return false
}