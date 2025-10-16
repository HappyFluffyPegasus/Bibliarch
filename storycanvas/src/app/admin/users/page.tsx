'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Users, Calendar, Mail } from 'lucide-react'

interface UserStats {
  totalUsers: number
  recentUsers: Array<{
    id: string
    username: string | null
    email: string | null
    created_at: string
  }>
}

export default function AdminUsersPage() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUserStats()
  }, [])

  async function loadUserStats() {
    try {
      const supabase = createClient()

      // Get total user count
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      if (countError) throw countError

      // Get recent users
      const { data: recentUsers, error: recentError } = await supabase
        .from('profiles')
        .select('id, username, email, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentError) throw recentError

      setStats({
        totalUsers: count || 0,
        recentUsers: recentUsers || []
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user stats')
      console.error('Error loading user stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading user statistics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={loadUserStats}>Retry</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">User Statistics</h1>
          <p className="text-muted-foreground">Overview of registered users</p>
        </div>

        {/* Stats Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-4xl font-bold">{stats?.totalUsers}</p>
              <p className="text-muted-foreground">Total Registered Users</p>
            </div>
          </div>
        </Card>

        {/* Recent Users */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
          <div className="space-y-3">
            {stats?.recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">{user.username || 'No username'}</p>
                    {user.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
