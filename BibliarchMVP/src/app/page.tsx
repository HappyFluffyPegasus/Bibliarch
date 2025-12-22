"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Book, Trash2, Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useStoryStore } from "@/stores/storyStore"

export default function Dashboard() {
  const router = useRouter()
  const { stories, createStory, deleteStory } = useStoryStore()
  const [newStoryTitle, setNewStoryTitle] = useState("")
  const [newStoryDescription, setNewStoryDescription] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null)

  const handleCreateStory = () => {
    if (!newStoryTitle.trim()) return

    const story = createStory(newStoryTitle.trim(), newStoryDescription.trim())
    setNewStoryTitle("")
    setNewStoryDescription("")
    setIsCreateDialogOpen(false)
    router.push(`/story/${story.id}/notes`)
  }

  const handleDeleteStory = (id: string) => {
    deleteStory(id)
    setStoryToDelete(null)
  }

  const handleOpenStory = (id: string) => {
    router.push(`/story/${id}/notes`)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="w-8 h-8 text-sky-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Bibliarch
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <Upload className="w-4 h-4 mr-2" />
                Import Master Doc
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Stories
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage your story projects
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Story Card */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-sky-400 dark:hover:border-sky-500 cursor-pointer transition-colors bg-white/50 dark:bg-gray-800/50">
                <CardContent className="flex flex-col items-center justify-center h-48 gap-4">
                  <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-sky-500" />
                  </div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Create New Story
                  </span>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Story</DialogTitle>
                <DialogDescription>
                  Give your story a title and optional description.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newStoryTitle}
                    onChange={(e) => setNewStoryTitle(e.target.value)}
                    placeholder="My Amazing Story"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newStoryDescription}
                    onChange={(e) => setNewStoryDescription(e.target.value)}
                    placeholder="A brief description of your story..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateStory} disabled={!newStoryTitle.trim()}>
                  Create Story
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Existing Stories */}
          {stories.map((story) => (
            <Card
              key={story.id}
              className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800"
              onClick={() => handleOpenStory(story.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sky-500" />
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      setStoryToDelete(story.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {story.description && (
                  <CardDescription className="line-clamp-2">
                    {story.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {formatDate(story.updatedAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {stories.length === 0 && (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              No stories yet
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              Create your first story to get started
            </p>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!storyToDelete} onOpenChange={() => setStoryToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Story</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this story? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStoryToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => storyToDelete && handleDeleteStory(storyToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
