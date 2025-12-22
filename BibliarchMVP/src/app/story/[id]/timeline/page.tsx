"use client"

import { useParams } from "next/navigation"
import { Clock, Plus, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStoryStore } from "@/stores/storyStore"

export default function TimelinePage() {
  const params = useParams()
  const storyId = params.id as string
  const { timelineEvents } = useStoryStore()
  const storyEvents = timelineEvents[storyId] || []

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-sky-500" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Timeline
            </h1>
            <span className="text-sm text-gray-500">
              ({storyEvents.length} events)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      </header>

      {/* Timeline Area */}
      <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {/* Timeline Tracks */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="min-w-[2000px] h-full">
            {/* Main Track */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Main Track
                </span>
              </div>
              <div className="h-24 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center px-4">
                {storyEvents.length === 0 ? (
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    No events yet. Click &quot;Add Event&quot; to create your first timeline event.
                  </p>
                ) : (
                  <div className="flex gap-4">
                    {storyEvents
                      .filter((e) => e.track === 0)
                      .sort((a, b) => a.order - b.order)
                      .map((event) => (
                        <div
                          key={event.id}
                          className="px-4 py-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg border border-sky-200 dark:border-sky-800"
                        >
                          <p className="font-medium text-sm">{event.title}</p>
                          {event.duration && (
                            <p className="text-xs text-gray-500">{event.duration}</p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Parallel Track */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Parallel Track
                </span>
                <span className="text-xs text-gray-400">(for simultaneous events)</span>
              </div>
              <div className="h-24 bg-white dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center px-4">
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Drag events here for parallel storylines
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Panel */}
        <div className="h-48 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select an event to view and edit details</p>
            <p className="text-xs mt-1">
              Track character states, relationships, and link scenes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
