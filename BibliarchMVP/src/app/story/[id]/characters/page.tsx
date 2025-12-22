"use client"

import { useParams } from "next/navigation"
import { Users, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStoryStore } from "@/stores/storyStore"

export default function CharactersPage() {
  const params = useParams()
  const storyId = params.id as string
  const { characters } = useStoryStore()
  const storyCharacters = characters[storyId] || []

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-sky-500" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Characters
            </h1>
            <span className="text-sm text-gray-500">
              ({storyCharacters.length})
            </span>
          </div>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Character
          </Button>
        </div>
      </header>

      {/* Character Creator Area - Placeholder */}
      <div className="flex-1 flex">
        {/* Character List Sidebar */}
        <div className="w-48 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Characters
          </h3>
          {storyCharacters.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No characters yet
            </p>
          ) : (
            <ul className="space-y-2">
              {storyCharacters.map((char) => (
                <li
                  key={char.id}
                  className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm"
                >
                  {char.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 3D Viewer Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Character Creator
            </h2>
            <p className="text-gray-500 dark:text-gray-500 max-w-md">
              The 3D character creator will be integrated here.
              <br />
              Customize appearance, colors, and accessories.
            </p>
          </div>
        </div>

        {/* Customization Panel */}
        <div className="w-64 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Customization
          </h3>
          <div className="space-y-4">
            {["HAIR", "TOPS", "DRESSES", "PANTS", "SHOES", "ACCESSORIES", "BODY"].map(
              (category) => (
                <button
                  key={category}
                  className="w-full px-3 py-2 text-left text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {category}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
