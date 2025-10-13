import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { feedbackSchema } from '@/lib/feedback/types'

// Simple rate limiting using in-memory cache
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 5

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(identifier) || []

  // Remove timestamps outside the window
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)

  if (recentTimestamps.length >= MAX_REQUESTS) {
    return false // Rate limit exceeded
  }

  // Add current timestamp
  recentTimestamps.push(now)
  rateLimitMap.set(identifier, recentTimestamps)

  return true
}

export async function POST(request: NextRequest) {
  console.log('=== Feedback API Route Called ===')
  try {
    console.log('Creating Supabase client...')
    const supabase = await createClient()
    console.log('Supabase client created')

    // Get user session (if logged in)
    const { data: { user } } = await supabase.auth.getUser()

    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const identifier = user?.id || ip

    // Check rate limit
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Too many feedback submissions. Please try again later.' },
        { status: 429 }
      )
    }

    console.log('Parsing request body...')
    const body = await request.json()
    console.log('Request body:', body)

    // Validate input
    console.log('Validating input...')
    const result = feedbackSchema.safeParse(body)
    if (!result.success) {
      console.error('Validation failed:', result.error.errors)
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }
    console.log('Validation passed')

    // Get user profile for additional info
    console.log('Getting user profile...')
    let userName = null
    let userEmail = null
    if (user) {
      console.log('User logged in:', user.id)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }

      userName = profile?.username
      userEmail = user.email
      console.log('User info:', { userName, userEmail })
    } else {
      console.log('No user logged in')
    }

    // Insert feedback
    console.log('Inserting feedback into database...')
    const feedbackData = {
      user_id: user?.id || null,
      user_email: userEmail,
      user_name: userName,
      type: result.data.type,
      title: result.data.title,
      description: result.data.description,
      page_url: body.page_url,
      browser_info: body.browser_info,
      screen_size: body.screen_size,
    }
    console.log('Feedback data to insert:', feedbackData)

    const { error: insertError } = await supabase
      .from('feedback')
      .insert(feedbackData)

    if (insertError) {
      console.error('Feedback insertion error:', insertError)
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      })

      // Return more specific error for debugging
      return NextResponse.json(
        {
          error: 'Failed to submit feedback',
          details: insertError.message,
          hint: insertError.code === '42P01' ? 'Database table "feedback" does not exist. Please run the setup SQL script.' : insertError.hint
        },
        { status: 500 }
      )
    }

    console.log('Feedback submitted successfully!')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('=== CAUGHT ERROR ===')
    console.error('Feedback submission error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
