'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, MessageSquare, Settings, BarChart3 } from 'lucide-react'

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
