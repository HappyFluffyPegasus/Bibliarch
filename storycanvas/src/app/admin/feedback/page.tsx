'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Search, Filter, X, Eye } from 'lucide-react'
import Link from 'next/link'
import type { Feedback, FeedbackType, FeedbackStatus, FeedbackPriority } from '@/lib/feedback/types'

// Configure your admin email here
const ADMIN_EMAIL = 'stellanovacole@gmail.com'

export default function AdminFeedbackPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)

  // Local state for editing
  const [editedStatus, setEditedStatus] = useState<FeedbackStatus>('new')
  const [editedPriority, setEditedPriority] = useState<FeedbackPriority | ''>('')
  const [editedNotes, setEditedNotes] = useState('')

  // Check admin access
  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin (by email)
    if (user.email === ADMIN_EMAIL) {
      setIsAdmin(true)
      loadFeedback()
    } else {
      router.push('/dashboard')
    }
  }

  async function loadFeedback() {
    setIsLoading(true)

    // Admin uses service role key to bypass RLS
    // Since we can't use service key on client, we'll need to create an API route
    // For now, let's use the regular client (you'll need to add a policy for admins)
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading feedback:', error)
    } else {
      setFeedback(data || [])
      setFilteredFeedback(data || [])
    }

    setIsLoading(false)
  }

  // Filter feedback
  useEffect(() => {
    let filtered = feedback

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(f => f.type === typeFilter)
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(f =>
        f.title.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query) ||
        f.user_email?.toLowerCase().includes(query) ||
        f.user_name?.toLowerCase().includes(query)
      )
    }

    setFilteredFeedback(filtered)
  }, [feedback, statusFilter, typeFilter, searchQuery])

  async function updateFeedback(id: string, updates: Partial<Feedback>) {
    const { error } = await supabase
      .from('feedback')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Error updating feedback:', error)
      alert('Failed to update feedback')
    } else {
      // Refresh data
      loadFeedback()
      setSelectedFeedback(null)
    }
  }

  async function deleteFeedback(id: string) {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting feedback:', error)
      alert('Failed to delete feedback')
    } else {
      loadFeedback()
      setSelectedFeedback(null)
    }
  }

  const getTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case 'bug': return '🐛'
      case 'feature': return '💡'
      case 'general': return '💬'
      default: return '📝'
    }
  }

  const getTypeColor = (type: FeedbackType) => {
    switch (type) {
      case 'bug': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
      case 'feature': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
      case 'general': return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusBadge = (status: FeedbackStatus) => {
    const styles = {
      new: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      reviewing: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      in_progress: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      resolved: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      wont_fix: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      duplicate: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getPriorityColor = (priority?: FeedbackPriority) => {
    if (!priority) return ''
    switch (priority) {
      case 'critical': return 'text-red-600 dark:text-red-400'
      case 'high': return 'text-orange-600 dark:text-orange-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
    }
  }

  if (!isAdmin || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold">Feedback Dashboard</h1>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
              {filteredFeedback.length} items
            </span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | 'all')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="wont_fix">Won't Fix</option>
            <option value="duplicate">Duplicate</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FeedbackType | 'all')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="bug">🐛 Bug</option>
            <option value="feature">💡 Feature</option>
            <option value="general">💬 General</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="p-6 space-y-3">
        {filteredFeedback.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No feedback found
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div
              key={item.id}
              className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getTypeColor(item.type)}`}
              onClick={() => {
                setSelectedFeedback(item)
                // Initialize edit state with current values
                setEditedStatus(item.status)
                setEditedPriority(item.priority || '')
                setEditedNotes(item.admin_notes || '')
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{getTypeIcon(item.type)}</span>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    {getStatusBadge(item.status)}
                    {item.priority && (
                      <span className={`text-sm font-medium uppercase ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-sm opacity-75 line-clamp-2 mb-2">{item.description}</p>
                  <div className="flex items-center gap-4 text-xs opacity-60">
                    {item.user_email && <span>📧 {item.user_email}</span>}
                    {item.user_name && <span>👤 {item.user_name}</span>}
                    <span>🕐 {new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <Eye className="w-5 h-5 opacity-50" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getTypeIcon(selectedFeedback.type)}</span>
                    <h2 className="text-2xl font-bold">{selectedFeedback.title}</h2>
                  </div>
                  {getStatusBadge(selectedFeedback.status)}
                </div>
                <button
                  onClick={() => {
                    setSelectedFeedback(null)
                    // Reset edit state
                    setEditedStatus('new')
                    setEditedPriority('')
                    setEditedNotes('')
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedFeedback.description}</p>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm">
                  {selectedFeedback.user_email && <p>📧 {selectedFeedback.user_email}</p>}
                  {selectedFeedback.user_name && <p>👤 {selectedFeedback.user_name}</p>}
                  <p>🕐 {new Date(selectedFeedback.created_at).toLocaleString()}</p>
                  {selectedFeedback.page_url && <p>📍 {selectedFeedback.page_url}</p>}
                  {selectedFeedback.browser_info && <p>💻 {selectedFeedback.browser_info}</p>}
                  {selectedFeedback.screen_size && <p>📐 {selectedFeedback.screen_size}</p>}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value as FeedbackStatus)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="wont_fix">Won't Fix</option>
                    <option value="duplicate">Duplicate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={editedPriority}
                    onChange={(e) => setEditedPriority(e.target.value as FeedbackPriority | '')}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">No Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Admin Notes</label>
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 resize-none"
                    placeholder="Internal notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => deleteFeedback(selectedFeedback.id)}
                    className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      updateFeedback(selectedFeedback.id, {
                        status: editedStatus,
                        priority: editedPriority || undefined,
                        admin_notes: editedNotes
                      })
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg hover:from-sky-600 hover:to-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
