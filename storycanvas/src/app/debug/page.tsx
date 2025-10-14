'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    runDiagnostics()
  }, [])

  async function runDiagnostics() {
    const diagnostics: any = {}

    try {
      // Check user authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      diagnostics.user = {
        success: !userError,
        data: user ? { id: user.id, email: user.email } : null,
        error: userError?.message
      }

      if (user) {
        // Check stories table
        try {
          const { data: stories, error: storiesError } = await supabase
            .from('stories')
            .select('*')
            .eq('user_id', user.id)
          
          diagnostics.stories = {
            success: !storiesError,
            count: stories?.length || 0,
            data: stories,
            error: storiesError?.message
          }
        } catch (error) {
          diagnostics.stories = {
            success: false,
            error: `Table access error: ${error}`
          }
        }

        // Check canvas_data table
        try {
          const { data: canvasData, error: canvasError } = await supabase
            .from('canvas_data')
            .select('*')
            .limit(5)
          
          diagnostics.canvas_data = {
            success: !canvasError,
            count: canvasData?.length || 0,
            data: canvasData,
            error: canvasError?.message
          }
        } catch (error) {
          diagnostics.canvas_data = {
            success: false,
            error: `Table access error: ${error}`
          }
        }

        // Check profiles table
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          diagnostics.profile = {
            success: !profileError,
            data: profile,
            error: profileError?.message
          }
        } catch (error) {
          diagnostics.profile = {
            success: false,
            error: `Table access error: ${error}`
          }
        }
      }

      // Check Supabase connection
      try {
        const { data, error } = await supabase.from('stories').select('count', { count: 'exact', head: true })
        diagnostics.connection = {
          success: !error,
          error: error?.message
        }
      } catch (error) {
        diagnostics.connection = {
          success: false,
          error: `Connection error: ${error}`
        }
      }

    } catch (error) {
      diagnostics.generalError = `General error: ${error}`
    }

    setDebugInfo(diagnostics)
    setLoading(false)
  }

  async function createTestStory() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Not authenticated')
      return
    }

    const { data, error } = await supabase
      .from('stories')
      .insert({
        title: `Test Story ${Date.now()}`,
        user_id: user.id
      } as any)
      .select()
      .single()

    if (error) {
      alert(`Error creating test story: ${error.message}`)
    } else {
      alert(`Test story created with ID: ${(data as any)?.id || 'unknown'}`)
      runDiagnostics()
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-8 text-center">
            Loading diagnostics...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>NeighborNotes Database Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runDiagnostics} className="mb-4">
            Refresh Diagnostics
          </Button>
          <Button onClick={createTestStory} className="mb-4 ml-2">
            Create Test Story
          </Button>
        </CardContent>
      </Card>

      {/* User Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className={debugInfo.user?.success ? 'text-green-600' : 'text-red-600'}>
            User Authentication: {debugInfo.user?.success ? 'SUCCESS' : 'FAILED'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.user, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Database Connection */}
      <Card>
        <CardHeader>
          <CardTitle className={debugInfo.connection?.success ? 'text-green-600' : 'text-red-600'}>
            Database Connection: {debugInfo.connection?.success ? 'SUCCESS' : 'FAILED'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.connection, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Stories Table */}
      <Card>
        <CardHeader>
          <CardTitle className={debugInfo.stories?.success ? 'text-green-600' : 'text-red-600'}>
            Stories Table: {debugInfo.stories?.success ? 'SUCCESS' : 'FAILED'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.stories, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Canvas Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className={debugInfo.canvas_data?.success ? 'text-green-600' : 'text-red-600'}>
            Canvas Data Table: {debugInfo.canvas_data?.success ? 'SUCCESS' : 'FAILED'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.canvas_data, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Profiles Table */}
      <Card>
        <CardHeader>
          <CardTitle className={debugInfo.profile?.success ? 'text-green-600' : 'text-red-600'}>
            Profile Table: {debugInfo.profile?.success ? 'SUCCESS' : 'FAILED'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.profile, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}