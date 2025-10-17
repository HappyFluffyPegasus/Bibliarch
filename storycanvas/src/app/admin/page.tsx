'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, MessageSquare, Settings, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AdminSection {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: string
}

const adminSections: AdminSection[] = [
  {
    title: 'User Management',
    description: 'View registered users and user statistics',
    href: '/admin/users',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
  },
  {
    title: 'Feedback',
    description: 'View and manage user feedback submissions',
    href: '/admin/feedback',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
  }
]

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      const supabase = createClient()

      // Check if current user is admin
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error checking admin status:', profileError)
        setError('Failed to verify admin status')
        setLoading(false)
        return
      }

      if (!profile?.is_admin) {
        setError('Access denied: Admin privileges required')
        setLoading(false)
        return
      }

      setIsAdmin(true)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify admin access')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Verifying admin access...</p>
      </div>
    )
  }

  if (error || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="text-red-500 mb-4">{error || 'Access denied'}</p>
          <Link href="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage your application and view analytics</p>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex flex-col h-full">
                  <div className={`p-3 rounded-lg w-fit mb-4 ${section.color}`}>
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
                  <p className="text-muted-foreground flex-1">{section.description}</p>
                  <div className="mt-4">
                    <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      View →
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Quick Stats
          </h2>
          <p className="text-muted-foreground">
            Click on a section above to view detailed statistics and management options.
          </p>
        </Card>
      </div>
    </div>
  )
}
