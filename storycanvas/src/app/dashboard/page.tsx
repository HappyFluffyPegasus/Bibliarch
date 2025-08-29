'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, LogOut, Sparkles, FileText, Clock, Layout } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import { storyTemplates } from '@/lib/templates'

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
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUserAndStories()
  }, [])

  async function loadUserAndStories() {
    setIsLoading(true)
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUsername(profile.username || 'Storyteller')
    }

    // Get user's stories
    const { data: userStories } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (userStories) {
      setStories(userStories)
    }
    
    setIsLoading(false)
  }

  function createNewStory() {
    setShowTemplateDialog(true)
  }

  async function handleCreateWithTemplate() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const template = storyTemplates.find(t => t.id === selectedTemplate)
    
    const { data: newStory, error } = await supabase
      .from('stories')
      .insert({
        title: `Untitled Story ${stories.length + 1}`,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating story:', error)
      return
    }

    if (newStory && template) {
      // Save template nodes as initial canvas data
      if (template.nodes.length > 0) {
        const { error: insertError } = await supabase
          .from('canvas_data')
          .insert({
            story_id: newStory.id,
            canvas_type: 'main',
            nodes: template.nodes,
            connections: template.connections
          })
        
        if (insertError) {
          console.error('Error saving template:', insertError)
          toast.error('Failed to save template')
          return
        }
        
        console.log('Template saved successfully for story:', newStory.id)
      }
      
      // Navigate with a query parameter to indicate it's a new story with template
      router.push(`/story/${newStory.id}?isNew=true&template=${selectedTemplate}`)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <OnboardingModal />
      
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              StoryCanvas
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome back, <span className="font-medium">{username}</span>
            </span>
            <ThemeToggle />
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
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
              <Sparkles className="w-8 h-8 text-purple-600 animate-pulse mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your stories...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Story Card */}
            <Card 
              className="border-dashed border-2 hover:border-purple-400 cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
              onClick={createNewStory}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle>Create New Story</CardTitle>
                <CardDescription>
                  Start a new adventure with infinite possibilities
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Story Cards */}
            {stories.map((story) => (
              <Link 
                key={story.id} 
                href={`/story/${story.id}`}
                className="block"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(story.updated_at)}
                      </span>
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
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && stories.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first story and start building amazing narratives
              </p>
              <Button onClick={createNewStory} className="bg-gradient-to-r from-purple-600 to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Story
              </Button>
            </CardContent>
          </Card>
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
                    ? 'ring-2 ring-purple-600 bg-purple-50 dark:bg-purple-950/20' 
                    : 'hover:border-purple-400'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Layout className="w-5 h-5 text-purple-600" />
                    {selectedTemplate === template.id && (
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
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
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Create Story
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}