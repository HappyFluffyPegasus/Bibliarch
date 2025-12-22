"use client"

import { useParams } from "next/navigation"
import { Film, Plus, Play, Pause, SkipBack, Camera, MessageSquare, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useStoryStore } from "@/stores/storyStore"

export default function ScenesPage() {
  const params = useParams()
  const storyId = params.id as string
  const { scenes } = useStoryStore()
  const storyScenes = scenes[storyId] || []
  const [showAIDialog, setShowAIDialog] = useState(false)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Film className="w-5 h-5 text-sky-500" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scenes
            </h1>
            <span className="text-sm text-gray-500">
              ({storyScenes.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAIDialog(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Scene
            </Button>
          </div>
        </div>
      </header>

      {/* Scene Editor Area */}
      <div className="flex-1 flex">
        {/* Scene List Sidebar */}
        <div className="w-48 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Scenes
          </h3>
          {storyScenes.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No scenes yet
            </p>
          ) : (
            <ul className="space-y-2">
              {storyScenes.map((scene) => (
                <li
                  key={scene.id}
                  className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {scene.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 3D Scene View - Placeholder */}
        <div className="flex-1 flex flex-col">
          {/* 3D Viewport */}
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 relative">
            <div className="text-center">
              <Film className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                3D Scene Viewer
              </h2>
              <p className="text-gray-500 dark:text-gray-500 max-w-md">
                The 3D scene viewer will be integrated here.
                <br />
                Place characters, set up camera angles, and create your scenes.
              </p>
            </div>

            {/* Camera Controls Overlay */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button variant="secondary" size="icon">
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            {/* Subtitles Preview */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-2 rounded-lg">
              <p className="text-sm text-center">Subtitle preview will appear here</p>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="h-16 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center gap-4 px-4">
            <Button variant="ghost" size="icon">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button size="icon">
              <Play className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" disabled>
              <Pause className="w-4 h-4" />
            </Button>

            {/* Timeline scrubber */}
            <div className="flex-1 max-w-md">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div className="h-2 w-0 bg-sky-500 rounded-full" />
              </div>
            </div>

            <span className="text-sm text-gray-500">0:00 / 0:00</span>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-64 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Scene Properties
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Title
              </label>
              <input
                type="text"
                placeholder="Scene title"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Characters in Scene
              </label>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="w-3 h-3 mr-1" />
                Add Character
              </Button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Dialogue
              </label>
              <Button variant="outline" size="sm" className="w-full">
                <MessageSquare className="w-3 h-3 mr-1" />
                Add Dialogue
              </Button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Link to Timeline
              </label>
              <select className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800">
                <option value="">Select event...</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* AI Feature Placeholder Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500" />
              AI Scene Generation
            </DialogTitle>
            <DialogDescription>
              This feature is not implemented yet.
              <br /><br />
              When complete, AI will be able to:
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Generate scenes from timeline events</li>
                <li>Create dialogue based on character personalities</li>
                <li>Suggest camera angles and movements</li>
                <li>Fill in minor scenes between major plot points</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowAIDialog(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
