// Quick script to check user count
// Run with: node check-users.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local file
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')

// Parse environment variables
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    env[key] = value
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
  console.log('Checking user count...\n')

  // Count profiles
  const { count: profileCount, error: profileError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  if (profileError) {
    console.error('Error counting profiles:', profileError.message)
  } else {
    console.log(`📊 Total users in profiles table: ${profileCount}`)
  }

  // Get auth users count (requires service role key)
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.log(`⚠️  Cannot access auth users (requires service role key): ${authError.message}`)
  } else {
    console.log(`🔐 Total authenticated users: ${authData.users.length}`)
  }

  // Get recent users
  const { data: recentUsers, error: recentError } = await supabase
    .from('profiles')
    .select('username, email, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!recentError && recentUsers) {
    console.log('\n📅 5 Most Recent Users:')
    recentUsers.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.username || user.email} - ${new Date(user.created_at).toLocaleDateString()}`)
    })
  }
}

checkUsers().catch(console.error)
