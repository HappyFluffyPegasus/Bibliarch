'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Plus, LogOut, Sparkles, FileText, Clock, Layout, Settings, Trash2, Copy } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { storyTemplates } from '@/lib/templates'
import { ensureDatabaseSetup } from '@/lib/database-init'

type Story = {
  id: string
  title: string
  created_at: string
  updated_at: string
  settings?: any
}

export default function DashboardPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [username, setUsername] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank')
  const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; story: Story | null }>({ show: false, story: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUserAndStories()
  }, [])

  async function loadUserAndStories() {
    setIsLoading(true)
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        alert(`Authentication error: ${userError.message}`)
        router.push('/login')
        return
      }
      
      if (!user) {
        console.log('No user found, redirecting to login')
        router.push('/login')
        return
      }

      console.log('User found:', user.id)

      // Check database setup automatically
      const dbSetup = await ensureDatabaseSetup()
      if (!dbSetup.success) {
        if (dbSetup.needsSetup) {
          alert(`Database Setup Required!\n\nThe database tables haven't been created yet. To fix this:\n\n1. Go to your Supabase project dashboard\n2. Open the SQL Editor\n3. Copy the entire contents of database-setup.sql\n4. Run it in the SQL Editor\n5. Refresh this page\n\nThis is a one-time setup step.`)
        } else {
          alert(`Database Connection Error: ${dbSetup.error}\n\nPlease check:\n• Your .env.local file has correct Supabase credentials\n• Your Supabase project is active\n• Your internet connection is working`)
        }
        return
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error getting profile:', profileError)
        setUsername('Storyteller') // Default if profile doesn't exist yet
      } else if (profile && 'username' in profile) {
        setUsername((profile as any).username || 'Storyteller')
      }

      // Get user's stories
      const { data: userStories, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (storiesError) {
        console.error('Error getting stories:', storiesError)
        setStories([]) // Set empty array on error
      } else if (userStories) {
        console.log('Stories loaded:', userStories.length)
        setStories(userStories)
      } else {
        console.log('No stories found')
        setStories([])
      }
    } catch (error) {
      console.error('Unexpected error in loadUserAndStories:', error)
      setStories([])
    }
    
    setIsLoading(false)
  }

  function createNewStory() {
    setShowTemplateDialog(true)
  }

  async function handleCreateWithTemplate() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Please log in to create a story.')
        return
      }

      const template = storyTemplates.find(t => t.id === selectedTemplate)
      
      const { data: newStory, error } = await supabase
        .from('stories')
        .insert({
          title: `Untitled Story ${stories.length + 1}`,
          user_id: user.id
        } as any)
        .select()
        .single()

      if (error) {
        console.error('Error creating story:', error)
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          alert('Database setup incomplete. Please run the database setup script first.')
        } else {
          alert(`Failed to create story: ${error.message}`)
        }
        return
      }

      if (newStory && template) {
        // Save template nodes as initial canvas data
        if (template.nodes.length > 0) {
          const { error: insertError } = await supabase
            .from('canvas_data')
            .insert({
              story_id: (newStory as any).id,
              canvas_type: 'main',
              nodes: template.nodes,
              connections: template.connections
            } as any)
          
          if (insertError) {
            console.error('Error saving template:', insertError)
            return
          }
          
          console.log('Template saved successfully for story:', (newStory as any).id)
        }

        // Save all sub-canvases with Phase 2 features
        if (template.subCanvases) {
          for (const [canvasId, canvasData] of Object.entries(template.subCanvases)) {
            const { error: subCanvasError } = await supabase
              .from('canvas_data')
              .insert({
                story_id: (newStory as any).id,
                canvas_type: canvasId,
                nodes: canvasData.nodes,
                connections: canvasData.connections
              } as any)
            
            if (subCanvasError) {
              console.error('Error saving sub-canvas:', canvasId, subCanvasError)
            } else {
              console.log('Sub-canvas saved successfully:', canvasId)
            }
          }
        }
        
        // Navigate with a query parameter to indicate it's a new story with template
        router.push(`/story/${(newStory as any).id}?isNew=true&template=${selectedTemplate}`)
      }
      
      setShowTemplateDialog(false)
    } catch (error) {
      console.error('Error in handleCreateWithTemplate:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  async function handleDuplicateStory(story: Story) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('User must be logged in to duplicate stories')
        return
      }

      // Create new story with "(Copy)" suffix
      const { data: newStory, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: `${story.title} (Copy)`,
          user_id: user.id,
          settings: story.settings
        } as any)
        .select()
        .single()

      if (storyError || !newStory) {
        console.error('Error duplicating story:', storyError)
        return
      }

      // Get all canvas data for the original story
      const { data: canvasData, error: canvasError } = await supabase
        .from('canvas_data')
        .select('*')
        .eq('story_id', story.id)

      if (canvasError) {
        console.error('Error fetching canvas data:', canvasError)
        return
      }

      // Copy all canvas data to the new story
      if (canvasData && canvasData.length > 0) {
        const newCanvasData = canvasData.map((canvas: any) => ({
          story_id: (newStory as any).id,
          canvas_type: canvas.canvas_type,
          nodes: canvas.nodes,
          connections: canvas.connections
        }))

        const { error: insertError } = await supabase
          .from('canvas_data')
          .insert(newCanvasData)

        if (insertError) {
          console.error('Error inserting canvas data:', insertError)
          return
        }
      }

      // Add to local state
      setStories([newStory as Story, ...stories])

      // Navigate to the new story
      router.push(`/story/${(newStory as any).id}`)
    } catch (error) {
      console.error('Unexpected error duplicating story:', error)
    }
  }

  async function handleDeleteStory() {
    if (!deleteDialog.story) return

    setIsDeleting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('User must be logged in to delete stories')
        return
      }

      // Delete all canvas data associated with this story
      const { error: canvasError } = await supabase
        .from('canvas_data')
        .delete()
        .eq('story_id', deleteDialog.story.id)

      if (canvasError) {
        console.error('Error deleting canvas data:', canvasError)
        return
      }

      // Delete the story itself
      const { error: storyError } = await supabase
        .from('stories')
        .delete()
        .eq('id', deleteDialog.story.id)
        .eq('user_id', user.id) // Extra safety check

      if (storyError) {
        console.error('Error deleting story:', storyError)
        return
      }

      // Remove from local state
      setStories(stories.filter(s => s.id !== deleteDialog.story?.id))

      setDeleteDialog({ show: false, story: null })
    } catch (error) {
      console.error('Unexpected error deleting story:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50/80 to-blue-50/80 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-sky-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              Bibliarch
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome back, <span className="font-medium">{username}</span>
            </span>
            <ThemeToggle />
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Stories</h2>
          <p className="text-muted-foreground">
            Create and manage your interactive story worlds
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-sky-600 dark:text-blue-400 animate-pulse mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your stories...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Story Card */}
            <Card
              className="border-dashed border-2 hover:border-sky-400 dark:hover:border-blue-500 cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
              onClick={createNewStory}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-sky-600 dark:text-blue-400" />
                </div>
                <CardTitle>Create New Story</CardTitle>
                <CardDescription>
                  Start a new adventure with infinite possibilities
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Story Cards */}
            {stories.map((story) => (
              <div key={story.id} className="relative">
                <Link
                  href={`/story/${story.id}`}
                  className="block"
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <FileText className="w-5 h-5 text-sky-600 dark:text-blue-400" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(story.updated_at)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDuplicateStory(story)
                            }}
                            className="p-1.5 rounded hover:bg-sky-100 dark:hover:bg-blue-900/20 transition-colors group"
                            title="Duplicate story"
                          >
                            <Copy className="w-4 h-4 text-gray-400 group-hover:text-sky-600 dark:group-hover:text-blue-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setDeleteDialog({ show: true, story })
                            }}
                            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group"
                            title="Delete story"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                      <CardTitle className="line-clamp-1">{story.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        Click to open and edit your story
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        Created {formatDate(story.created_at)}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choose a Story Template</DialogTitle>
            <DialogDescription>
              Start with a pre-built structure or begin with a blank canvas
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 my-6">
            {storyTemplates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'ring-2 ring-sky-600 dark:ring-blue-500 bg-sky-50 dark:bg-blue-900/10'
                    : 'hover:border-sky-400 dark:hover:border-blue-500'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Layout className="w-5 h-5 text-sky-600 dark:text-blue-400" />
                    {selectedTemplate === template.id && (
                      <div className="w-5 h-5 rounded-full bg-sky-600 dark:bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWithTemplate}
              className="bg-gradient-to-r from-sky-500 to-blue-600 dark:from-blue-500 dark:to-blue-700"
            >
              Create Story
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.show} onOpenChange={(open) => setDeleteDialog({ show: open, story: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Story?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.story?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
            <div className="flex items-start gap-3">
              <div className="text-red-600 dark:text-red-400 mt-0.5">⚠️</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                  This will permanently delete:
                </p>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <li>• The story and all its content</li>
                  <li>• All canvases (main and nested folders)</li>
                  <li>• All nodes, connections, and data</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ show: false, story: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStory}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Story'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}