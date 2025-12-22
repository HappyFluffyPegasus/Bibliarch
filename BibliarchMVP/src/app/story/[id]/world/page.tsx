"use client"

import { useParams } from "next/navigation"
import { Globe, Mountain, Home, TreePine, Move, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WorldPage() {
  const params = useParams()
  const storyId = params.id as string

  const tools = [
    { id: "terrain", label: "Terrain", icon: Mountain },
    { id: "building", label: "Building", icon: Home },
    { id: "decoration", label: "Decor", icon: TreePine },
    { id: "move", label: "Move", icon: Move },
  ]

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-sky-500" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              World Builder
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset View
            </Button>
          </div>
        </div>
      </header>

      {/* World Builder Area */}
      <div className="flex-1 flex">
        {/* Tools Sidebar */}
        <div className="w-16 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-4 flex flex-col items-center gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className="w-12 h-12 flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={tool.label}
            >
              <tool.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-[10px] text-gray-500 mt-1">{tool.label}</span>
            </button>
          ))}
        </div>

        {/* 3D World View - Placeholder */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-sky-200 to-green-200 dark:from-gray-800 dark:to-gray-700">
          <div className="text-center bg-white/80 dark:bg-gray-900/80 rounded-xl p-8 backdrop-blur-sm">
            <Globe className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              3D World Builder
            </h2>
            <p className="text-gray-500 dark:text-gray-500 max-w-md">
              The 3D world builder will be integrated here.
              <br />
              Terraform, place buildings, and create your story&apos;s world.
            </p>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-64 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Properties
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Terrain Size
              </label>
              <select className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800">
                <option>Small (100x100)</option>
                <option>Medium (200x200)</option>
                <option>Large (400x400)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Buildings
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["House", "Shop", "Tower", "Barn"].map((building) => (
                  <button
                    key={building}
                    className="px-2 py-3 text-xs text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {building}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Decorations
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Tree", "Rock", "Bush", "Lamp"].map((deco) => (
                  <button
                    key={deco}
                    className="px-2 py-3 text-xs text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {deco}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini-map */}
      <div className="absolute bottom-20 left-20 w-32 h-32 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-green-200 to-green-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
          <span className="text-[10px] text-gray-500">Mini-map</span>
        </div>
      </div>
    </div>
  )
}
