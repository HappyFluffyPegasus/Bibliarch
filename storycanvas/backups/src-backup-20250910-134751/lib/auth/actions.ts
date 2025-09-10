// Authentication actions for StoryCanvas
// Simple auth - no email confirmations, just straight signup and login

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  
  // Extract form data
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  // First try to sign in (in case user exists)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (!signInError) {
    // User exists and password is correct
    redirect('/dashboard')
    return
  }

  // Sign up the user - Supabase will auto-confirm if settings are correct
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      }
    }
  })

  if (error) {
    // If email exists but password is wrong, try to be helpful
    if (error.message.includes('already registered')) {
      return { error: 'Email already exists. Try signing in instead.' }
    }
    return { error: error.message }
  }

  // Create or update the profile with username
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      username,
      email: email,
      updated_at: new Date().toISOString()
    })

    // Auto sign in after signup
    await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  // Redirect to dashboard after successful signup
  redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  // Extract form data
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Sign in the user
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Redirect to dashboard after successful login
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  
  // Sign out the user
  await supabase.auth.signOut()
  
  // Redirect to home page
  redirect('/')
}