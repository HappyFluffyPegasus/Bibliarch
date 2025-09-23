// Automatic database setup for development
import { createClient } from '@/lib/supabase/client'

export async function ensureDatabaseSetup() {
  const supabase = createClient()
  
  try {
    // Test if tables exist by doing a simple query
    const { error: storiesError } = await supabase
      .from('stories')
      .select('count', { count: 'exact', head: true })
    
    if (storiesError && storiesError.message.includes('relation') && storiesError.message.includes('does not exist')) {
      console.log('Database tables not found. Please run database setup.')
      return {
        success: false,
        error: 'Database tables not set up. Please run the database-setup.sql script in your Supabase dashboard.',
        needsSetup: true
      }
    }
    
    return { success: true, needsSetup: false }
  } catch (error) {
    console.error('Database connection error:', error)
    return {
      success: false,
      error: 'Cannot connect to database',
      needsSetup: false
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
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Writer',
        created_at: new Date().toISOString()
      }, { onConflict: 'id' })
    
    if (error) {
      console.log('Profile creation error (might be normal):', error.message)
    }
    
    return !error
  } catch (error) {
    console.log('Profile creation failed:', error)
    return false
  }
}