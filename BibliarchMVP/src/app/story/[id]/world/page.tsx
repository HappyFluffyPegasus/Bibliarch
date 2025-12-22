"use client"

import { useParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import {
  Globe,
  Mountain,
  Home,
  TreePine,
  MousePointer,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type {
  ToolType,
  BuildingType,
  DecoType,
  WorldObject,
  TerrainData
} from "@/components/world/WorldViewer3D"

// Dynamic import for Three.js component (no SSR)
const WorldViewer3D = dynamic(
  () => import("@/components/world/WorldViewer3D"),
  { ssr: false, loading: () => <WorldLoadingPlaceholder /> }
)

function WorldLoadingPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-sky-200 to-green-200 dark:from-gray-800 dark:to-gray-700">
      <div className="text-center">
        <Globe className="w-12 h-12 text-gray-400 animate-pulse mx-auto mb-3" />
        <p className="text-gray-500">Loading 3D World...</p>
      </div>
    </div>
  )
}

// Initial terrain (flat 25x25 grid)
function createInitialTerrain(): TerrainData {
  const size = 25
  const heights: number[][] = []
  for (let z = 0; z < size; z++) {
    heights[z] = []
    for (let x = 0; x < size; x++) {
      heights[z][x] = 0
    }
  }
  return { heights, size }
}

const BUILDING_INFO: Record<BuildingType, { label: string; color: string }> = {
  house: { label: "House", color: "#E07A5F" },
  shop: { label: "Shop", color: "#81B29A" },
  tower: { label: "Tower", color: "#3D405B" },
  barn: { label: "Barn", color: "#F2CC8F" }
}

const DECO_INFO: Record<DecoType, { label: string; color: string }> = {
  tree: { label: "Tree", color: "#2D6A4F" },
  rock: { label: "Rock", color: "#6C757D" },
  bush: { label: "Bush", color: "#40916C" },
  lamp: { label: "Lamp", color: "#FFD166" }
}

export default function WorldPage() {
  const params = useParams()
  const storyId = params.id as string

  // Tool state
  const [tool, setTool] = useState<ToolType>("select")
  const [buildingType, setBuildingType] = useState<BuildingType>("house")
  const [decoType, setDecoType] = useState<DecoType>("tree")

  // World state
  const [objects, setObjects] = useState<WorldObject[]>([])
  const [terrain, setTerrain] = useState<TerrainData>(createInitialTerrain)
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedWorld = localStorage.getItem(`bibliarch-world-${storyId}`)
    if (savedWorld) {
      try {
        const parsed = JSON.parse(savedWorld)
        if (parsed.objects) setObjects(parsed.objects)
        if (parsed.terrain) setTerrain(parsed.terrain)
      } catch (e) {
        console.error("Failed to load world data:", e)
      }
    }
  }, [storyId])

  // Save to localStorage
  const saveWorld = useCallback(() => {
    const worldData = { objects, terrain }
    localStorage.setItem(`bibliarch-world-${storyId}`, JSON.stringify(worldData))
    setHasUnsavedChanges(false)
  }, [storyId, objects, terrain])

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!hasUnsavedChanges) return
    const timeout = setTimeout(saveWorld, 2000)
    return () => clearTimeout(timeout)
  }, [hasUnsavedChanges, saveWorld])

  // Handlers
  const handleAddObject = useCallback((obj: WorldObject) => {
    setObjects(prev => [...prev, obj])
    setHasUnsavedChanges(true)
  }, [])

  const handleDeleteObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id))
    setSelectedObjectId(null)
    setHasUnsavedChanges(true)
  }, [])

  const handleTerrainChange = useCallback((newTerrain: TerrainData) => {
    setTerrain(newTerrain)
    setHasUnsavedChanges(true)
  }, [])

  const handleSelectObject = useCallback((id: string | null) => {
    setSelectedObjectId(id)
  }, [])

  const handleResetTerrain = useCallback(() => {
    if (confirm("Reset terrain to flat? This cannot be undone.")) {
      setTerrain(createInitialTerrain())
      setHasUnsavedChanges(true)
    }
  }, [])

  const handleClearAll = useCallback(() => {
    if (confirm("Clear all objects and reset terrain? This cannot be undone.")) {
      setObjects([])
      setTerrain(createInitialTerrain())
      setSelectedObjectId(null)
      setHasUnsavedChanges(true)
    }
  }, [])

  // Get selected object info
  const selectedObject = objects.find(o => o.id === selectedObjectId)

  // Tool definitions
  const tools = [
    { id: "select" as ToolType, label: "Select", icon: MousePointer },
    { id: "terrain-raise" as ToolType, label: "Raise", icon: ArrowUp },
    { id: "terrain-lower" as ToolType, label: "Lower", icon: ArrowDown },
    { id: "place-building" as ToolType, label: "Build", icon: Home },
    { id: "place-decoration" as ToolType, label: "Decor", icon: TreePine },
    { id: "delete" as ToolType, label: "Delete", icon: Trash2 },
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
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-500">● Unsaved</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetTerrain}
            >
              <Mountain className="w-4 h-4 mr-2" />
              Flatten
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={saveWorld}
              disabled={!hasUnsavedChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </header>

      {/* World Builder Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tools Sidebar */}
        <div className="w-16 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-4 flex flex-col items-center gap-1">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-colors ${
                tool === t.id
                  ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
              title={t.label}
            >
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{t.label}</span>
            </button>
          ))}

          <div className="flex-1" />

          {/* Object count */}
          <div className="text-center text-[10px] text-gray-400 px-2">
            <div>{objects.filter(o => o.type === "building").length} bldg</div>
            <div>{objects.filter(o => o.type === "decoration").length} deco</div>
          </div>
        </div>

        {/* 3D World View */}
        <div className="flex-1 relative">
          <WorldViewer3D
            tool={tool}
            buildingType={buildingType}
            decoType={decoType}
            objects={objects}
            terrain={terrain}
            onAddObject={handleAddObject}
            onDeleteObject={handleDeleteObject}
            onTerrainChange={handleTerrainChange}
            onSelectObject={handleSelectObject}
            selectedObjectId={selectedObjectId}
          />

          {/* Tool hint */}
          <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
            {tool === "select" && "Click objects to select"}
            {tool === "terrain-raise" && "Click & drag to raise terrain"}
            {tool === "terrain-lower" && "Click & drag to lower terrain"}
            {tool === "place-building" && `Click to place ${buildingType}`}
            {tool === "place-decoration" && `Click to place ${decoType}`}
            {tool === "delete" && "Click objects to delete"}
          </div>

          {/* Mini-map placeholder */}
          <div className="absolute bottom-4 left-4 w-32 h-32 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-green-200 to-green-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
              <span className="text-[10px] text-gray-500">Mini-map</span>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-64 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 overflow-y-auto">
          {/* Buildings section */}
          {(tool === "place-building" || tool === "select") && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Buildings
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(BUILDING_INFO) as BuildingType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setBuildingType(type)
                      setTool("place-building")
                    }}
                    className={`px-2 py-3 text-xs text-center border rounded-lg transition-all text-gray-900 dark:text-white ${
                      buildingType === type && tool === "place-building"
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/30 ring-1 ring-sky-500"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded mx-auto mb-1"
                      style={{ backgroundColor: BUILDING_INFO[type].color }}
                    />
                    {BUILDING_INFO[type].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Decorations section */}
          {(tool === "place-decoration" || tool === "select") && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <TreePine className="w-4 h-4" />
                Decorations
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(DECO_INFO) as DecoType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setDecoType(type)
                      setTool("place-decoration")
                    }}
                    className={`px-2 py-3 text-xs text-center border rounded-lg transition-all text-gray-900 dark:text-white ${
                      decoType === type && tool === "place-decoration"
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/30 ring-1 ring-sky-500"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded mx-auto mb-1"
                      style={{ backgroundColor: DECO_INFO[type].color }}
                    />
                    {DECO_INFO[type].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Terrain tools info */}
          {(tool === "terrain-raise" || tool === "terrain-lower") && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Mountain className="w-4 h-4" />
                Terrain Editing
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Click and drag on the terrain to {tool === "terrain-raise" ? "raise" : "lower"} it.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTool("terrain-raise")}
                  className={`flex-1 py-2 text-xs rounded-lg border transition-all text-gray-900 dark:text-white ${
                    tool === "terrain-raise"
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-900/30"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <ArrowUp className="w-4 h-4 mx-auto mb-1" />
                  Raise
                </button>
                <button
                  onClick={() => setTool("terrain-lower")}
                  className={`flex-1 py-2 text-xs rounded-lg border transition-all text-gray-900 dark:text-white ${
                    tool === "terrain-lower"
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-900/30"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <ArrowDown className="w-4 h-4 mx-auto mb-1" />
                  Lower
                </button>
              </div>
            </div>
          )}

          {/* Selected object info */}
          {selectedObject && (
            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selected Object
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="text-gray-700 dark:text-gray-300 capitalize">{selectedObject.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Variant:</span>
                  <span className="text-gray-700 dark:text-gray-300 capitalize">{selectedObject.variant}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Color:</span>
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: selectedObject.color }}
                  />
                </div>
                <button
                  onClick={() => handleDeleteObject(selectedObject.id)}
                  className="w-full mt-2 py-1.5 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-medium text-gray-500 mb-2">Controls</h4>
            <ul className="text-[11px] text-gray-400 space-y-1">
              <li>• Left-click drag to orbit</li>
              <li>• Right-click drag to pan</li>
              <li>• Scroll to zoom</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
