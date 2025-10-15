'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function SetupPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState('')

  const supabase = createClient()

  async function createFeedbackTable() {
    setStatus('running')
    setMessage('Creating feedback table...')
    setDetails('')

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStatus('error')
        setMessage('Please log in first!')
        return
      }

      // Call the setup API endpoint
      const response = await fetch('/api/setup/feedback', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create table')
      }

      setStatus('success')
      setMessage('✅ Feedback table created successfully!')
      setDetails('You can now use the feedback feature. Go to any story page and click the feedback button.')
    } catch (error) {
      console.error('Setup error:', error)
      setStatus('error')
      setMessage('❌ Failed to create feedback table')
      setDetails(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Bibliarch Setup
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Click the button below to set up the feedback system. This will create the necessary database table.
        </p>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">{message}</p>
              {details && <p className="text-sm text-green-700 dark:text-green-300 mt-1">{details}</p>}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 dark:text-red-200">{message}</p>
              {details && (
                <div className="text-sm text-red-700 dark:text-red-300 mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded font-mono overflow-x-auto">
                  {details}
                </div>
              )}
              <p className="text-sm text-red-700 dark:text-red-300 mt-3">
                <strong>Manual Fix:</strong> Go to your Supabase Dashboard → SQL Editor and run the SQL from <code>database-feedback-setup.sql</code>
              </p>
            </div>
          </div>
        )}

        {status === 'running' && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-blue-800 dark:text-blue-200">{message}</p>
          </div>
        )}

        {/* Setup Button */}
        <button
          onClick={createFeedbackTable}
          disabled={status === 'running' || status === 'success'}
          className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg font-semibold hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {status === 'running' ? 'Setting up...' : status === 'success' ? 'Setup Complete!' : 'Create Feedback Table'}
        </button>

        {/* Info */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="font-semibold mb-2 text-gray-900 dark:text-white">What this does:</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>✓ Creates the <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">feedback</code> table in your database</li>
            <li>✓ Sets up proper security policies (RLS)</li>
            <li>✓ Adds indexes for performance</li>
            <li>✓ Enables the feedback feature in your app</li>
          </ul>
        </div>

        {/* Back Link */}
        {status === 'success' && (
          <div className="mt-6 text-center">
            <a
              href="/dashboard"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
