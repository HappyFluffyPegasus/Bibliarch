"use client"

import { useParams } from "next/navigation"
import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import {
  Film,
  Plus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Trash2,
  MessageSquare,
  Sparkles,
  UserPlus,
  RotateCcw,
  Save,
  ChevronRight,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { SceneCharacter, DialogueLine } from "@/components/scenes/SceneViewer3D"

// Dynamic import for Three.js component (no SSR)
const SceneViewer3D = dynamic(
  () => import("@/components/scenes/SceneViewer3D"),
  { ssr: false, loading: () => <SceneLoadingPlaceholder /> }
)

function SceneLoadingPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-700">
      <div className="text-center">
        <Film className="w-12 h-12 text-gray-400 animate-pulse mx-auto mb-3" />
        <p className="text-gray-400">Loading 3D Scene...</p>
      </div>
    </div>
  )
}

interface Scene {
  id: string
  title: string
  characters: SceneCharacter[]
  dialogue: DialogueLine[]
  duration: number // in seconds
  linkedTimelineEventId?: string
}

interface StoredCharacter {
  id: string
  name: string
  colors: Record<string, string>
}

const DEFAULT_COLORS = [
  "#E07A5F", "#81B29A", "#3D405B", "#F2CC8F", "#577590",
  "#F4A261", "#E76F51", "#2A9D8F", "#264653", "#E9C46A"
]

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export default function ScenesPage() {
  const params = useParams()
  const storyId = params.id as string

  // Scenes state
  const [scenes, setScenes] = useState<Scene[]>([])
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Scene editor state
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const playbackRef = useRef<number | null>(null)

  // Dialog states
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [showAddCharacterDialog, setShowAddCharacterDialog] = useState(false)
  const [showAddDialogueDialog, setShowAddDialogueDialog] = useState(false)

  // Available characters from character creator
  const [availableCharacters, setAvailableCharacters] = useState<StoredCharacter[]>([])

  // New dialogue form
  const [newDialogueCharacterId, setNewDialogueCharacterId] = useState<string>("")
  const [newDialogueText, setNewDialogueText] = useState("")
  const [newDialogueDuration, setNewDialogueDuration] = useState(3)

  // Load data on mount
  useEffect(() => {
    // Load scenes
    const savedScenes = localStorage.getItem(`bibliarch-scenes-${storyId}`)
    if (savedScenes) {
      try {
        const parsed = JSON.parse(savedScenes)
        setScenes(parsed)
        if (parsed.length > 0) {
          setSelectedSceneId(parsed[0].id)
        }
      } catch (e) {
        console.error("Failed to load scenes:", e)
      }
    }

    // Load available characters
    const savedCharacters = localStorage.getItem(`bibliarch-characters-${storyId}`)
    if (savedCharacters) {
      try {
        setAvailableCharacters(JSON.parse(savedCharacters))
      } catch (e) {
        console.error("Failed to load characters:", e)
      }
    }
  }, [storyId])

  // Save scenes
  const saveScenes = useCallback(() => {
    localStorage.setItem(`bibliarch-scenes-${storyId}`, JSON.stringify(scenes))
    setHasUnsavedChanges(false)
  }, [storyId, scenes])

  // Auto-save
  useEffect(() => {
    if (!hasUnsavedChanges) return
    const timeout = setTimeout(saveScenes, 2000)
    return () => clearTimeout(timeout)
  }, [hasUnsavedChanges, saveScenes])

  // Get current scene
  const currentScene = scenes.find(s => s.id === selectedSceneId)

  // Playback loop
  useEffect(() => {
    if (!isPlaying || !currentScene) return

    const startTime = Date.now() - currentTime * 1000
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed >= currentScene.duration) {
        setCurrentTime(currentScene.duration)
        setIsPlaying(false)
        return
      }
      setCurrentTime(elapsed)
      playbackRef.current = requestAnimationFrame(animate)
    }

    playbackRef.current = requestAnimationFrame(animate)

    return () => {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current)
      }
    }
  }, [isPlaying, currentScene])

  // Get current dialogue for subtitle
  const currentDialogue = currentScene?.dialogue.find(d =>
    currentTime >= d.startTime && currentTime < d.startTime + d.duration
  )

  // Scene operations
  const createScene = useCallback(() => {
    const newScene: Scene = {
      id: generateId(),
      title: `Scene ${scenes.length + 1}`,
      characters: [],
      dialogue: [],
      duration: 10
    }
    setScenes(prev => [...prev, newScene])
    setSelectedSceneId(newScene.id)
    setHasUnsavedChanges(true)
  }, [scenes.length])

  const deleteScene = useCallback((id: string) => {
    if (!confirm("Delete this scene?")) return
    setScenes(prev => prev.filter(s => s.id !== id))
    if (selectedSceneId === id) {
      setSelectedSceneId(scenes.find(s => s.id !== id)?.id || null)
    }
    setHasUnsavedChanges(true)
  }, [selectedSceneId, scenes])

  const updateSceneTitle = useCallback((id: string, title: string) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, title } : s))
    setHasUnsavedChanges(true)
  }, [])

  const updateSceneDuration = useCallback((id: string, duration: number) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, duration } : s))
    setHasUnsavedChanges(true)
  }, [])

  // Character operations
  const addCharacterToScene = useCallback((characterId: string) => {
    if (!currentScene) return
    const char = availableCharacters.find(c => c.id === characterId)
    if (!char) return

    // Check if already in scene
    if (currentScene.characters.some(c => c.characterId === characterId)) {
      return
    }

    const colorIndex = currentScene.characters.length % DEFAULT_COLORS.length
    const sceneChar: SceneCharacter = {
      id: generateId(),
      characterId: char.id,
      name: char.name,
      color: char.colors?.body || DEFAULT_COLORS[colorIndex],
      position: [currentScene.characters.length * 2 - 2, 0, 0],
      rotation: 0
    }

    setScenes(prev => prev.map(s =>
      s.id === currentScene.id
        ? { ...s, characters: [...s.characters, sceneChar] }
        : s
    ))
    setShowAddCharacterDialog(false)
    setHasUnsavedChanges(true)
  }, [currentScene, availableCharacters])

  const removeCharacterFromScene = useCallback((sceneCharId: string) => {
    if (!currentScene) return
    setScenes(prev => prev.map(s =>
      s.id === currentScene.id
        ? {
            ...s,
            characters: s.characters.filter(c => c.id !== sceneCharId),
            dialogue: s.dialogue.filter(d => d.characterId !== sceneCharId)
          }
        : s
    ))
    if (selectedCharacterId === sceneCharId) {
      setSelectedCharacterId(null)
    }
    setHasUnsavedChanges(true)
  }, [currentScene, selectedCharacterId])

  const moveCharacter = useCallback((sceneCharId: string, position: [number, number, number]) => {
    if (!currentScene) return
    setScenes(prev => prev.map(s =>
      s.id === currentScene.id
        ? {
            ...s,
            characters: s.characters.map(c =>
              c.id === sceneCharId ? { ...c, position } : c
            )
          }
        : s
    ))
    setHasUnsavedChanges(true)
  }, [currentScene])

  // Dialogue operations
  const addDialogue = useCallback(() => {
    if (!currentScene || !newDialogueCharacterId || !newDialogueText) return

    const sceneChar = currentScene.characters.find(c => c.id === newDialogueCharacterId)
    if (!sceneChar) return

    const newDialogue: DialogueLine = {
      id: generateId(),
      characterId: newDialogueCharacterId,
      characterName: sceneChar.name,
      text: newDialogueText,
      startTime: currentScene.dialogue.length > 0
        ? Math.max(...currentScene.dialogue.map(d => d.startTime + d.duration))
        : 0,
      duration: newDialogueDuration
    }

    // Extend scene duration if needed
    const endTime = newDialogue.startTime + newDialogue.duration
    const newDuration = Math.max(currentScene.duration, endTime + 1)

    setScenes(prev => prev.map(s =>
      s.id === currentScene.id
        ? { ...s, dialogue: [...s.dialogue, newDialogue], duration: newDuration }
        : s
    ))

    setShowAddDialogueDialog(false)
    setNewDialogueCharacterId("")
    setNewDialogueText("")
    setNewDialogueDuration(3)
    setHasUnsavedChanges(true)
  }, [currentScene, newDialogueCharacterId, newDialogueText, newDialogueDuration])

  const deleteDialogue = useCallback((dialogueId: string) => {
    if (!currentScene) return
    setScenes(prev => prev.map(s =>
      s.id === currentScene.id
        ? { ...s, dialogue: s.dialogue.filter(d => d.id !== dialogueId) }
        : s
    ))
    setHasUnsavedChanges(true)
  }, [currentScene])

  // Playback controls
  const handlePlayPause = useCallback(() => {
    if (!currentScene) return
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      if (currentTime >= currentScene.duration) {
        setCurrentTime(0)
      }
      setIsPlaying(true)
    }
  }, [isPlaying, currentTime, currentScene])

  const handleRestart = useCallback(() => {
    setCurrentTime(0)
    setIsPlaying(false)
  }, [])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (isPlaying) {
      setIsPlaying(false)
    }
  }, [isPlaying])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

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
              ({scenes.length})
            </span>
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-500">● Unsaved</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAIDialog(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={saveScenes}
              disabled={!hasUnsavedChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button size="sm" onClick={createScene}>
              <Plus className="w-4 h-4 mr-2" />
              New Scene
            </Button>
          </div>
        </div>
      </header>

      {/* Scene Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scene List Sidebar */}
        <div className="w-52 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Scenes
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {scenes.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                No scenes yet
              </p>
            ) : (
              <ul className="space-y-1">
                {scenes.map((scene) => (
                  <li
                    key={scene.id}
                    onClick={() => {
                      setSelectedSceneId(scene.id)
                      setSelectedCharacterId(null)
                      setCurrentTime(0)
                      setIsPlaying(false)
                    }}
                    className={`group px-3 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-between transition-colors ${
                      selectedSceneId === scene.id
                        ? "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronRight className={`w-3 h-3 flex-shrink-0 ${
                        selectedSceneId === scene.id ? "text-sky-500" : "text-gray-400"
                      }`} />
                      <span className="truncate">{scene.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteScene(scene.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 3D Scene View */}
        <div className="flex-1 flex flex-col">
          {/* 3D Viewport */}
          <div className="flex-1 relative">
            {currentScene ? (
              <>
                <SceneViewer3D
                  characters={currentScene.characters}
                  selectedCharacterId={selectedCharacterId}
                  onSelectCharacter={setSelectedCharacterId}
                  onMoveCharacter={moveCharacter}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                />

                {/* Mode indicator */}
                <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                  {isPlaying
                    ? "Playing..."
                    : selectedCharacterId
                      ? "Drag to move character"
                      : "Click character to select"
                  }
                </div>

                {/* Subtitles */}
                {currentDialogue && (
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-xl">
                    <div className="bg-black/80 text-white px-6 py-3 rounded-lg text-center">
                      <p className="text-xs text-sky-400 mb-1">{currentDialogue.characterName}</p>
                      <p className="text-sm">{currentDialogue.text}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-700">
                <div className="text-center">
                  <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    {scenes.length === 0
                      ? "Create your first scene to get started"
                      : "Select a scene from the sidebar"
                    }
                  </p>
                  {scenes.length === 0 && (
                    <Button onClick={createScene}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Scene
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="h-16 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-4 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRestart}
              disabled={!currentScene}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={handlePlayPause}
              disabled={!currentScene}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            {/* Timeline scrubber */}
            <div className="flex-1 max-w-lg">
              <input
                type="range"
                min={0}
                max={currentScene?.duration || 10}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                disabled={!currentScene}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            <span className="text-sm text-gray-500 w-24 text-right">
              {formatTime(currentTime)} / {formatTime(currentScene?.duration || 0)}
            </span>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-72 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
          {currentScene ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Scene Title
                </label>
                <input
                  type="text"
                  value={currentScene.title}
                  onChange={(e) => updateSceneTitle(currentScene.id, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={currentScene.duration}
                  onChange={(e) => updateSceneDuration(currentScene.id, parseInt(e.target.value) || 10)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Characters section */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-500">
                    Characters ({currentScene.characters.length})
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddCharacterDialog(true)}
                    className="h-6 px-2 text-xs"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                {currentScene.characters.length === 0 ? (
                  <p className="text-xs text-gray-400">No characters in scene</p>
                ) : (
                  <ul className="space-y-1">
                    {currentScene.characters.map((char) => (
                      <li
                        key={char.id}
                        onClick={() => setSelectedCharacterId(char.id)}
                        className={`group flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer ${
                          selectedCharacterId === char.id
                            ? "bg-sky-100 dark:bg-sky-900/50"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: char.color }}
                          />
                          <span>{char.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCharacterFromScene(char.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Dialogue section */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-500">
                    Dialogue ({currentScene.dialogue.length})
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddDialogueDialog(true)}
                    disabled={currentScene.characters.length === 0}
                    className="h-6 px-2 text-xs"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                {currentScene.dialogue.length === 0 ? (
                  <p className="text-xs text-gray-400">No dialogue yet</p>
                ) : (
                  <ul className="space-y-2">
                    {currentScene.dialogue.map((line) => (
                      <li
                        key={line.id}
                        className={`group p-2 rounded border text-xs ${
                          currentDialogue?.id === line.id
                            ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {line.characterName}
                          </span>
                          <button
                            onClick={() => deleteDialogue(line.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">{line.text}</p>
                        <p className="text-gray-400">
                          {formatTime(line.startTime)} - {formatTime(line.startTime + line.duration)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm">
              Select a scene to edit
            </div>
          )}
        </div>
      </div>

      {/* AI Feature Dialog */}
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

      {/* Add Character Dialog */}
      <Dialog open={showAddCharacterDialog} onOpenChange={setShowAddCharacterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Character to Scene</DialogTitle>
            <DialogDescription>
              Select a character from your story to add to this scene.
            </DialogDescription>
          </DialogHeader>
          {availableCharacters.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              No characters created yet. Go to the Characters tab to create some!
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableCharacters.map((char) => {
                const alreadyInScene = currentScene?.characters.some(c => c.characterId === char.id)
                return (
                  <button
                    key={char.id}
                    onClick={() => addCharacterToScene(char.id)}
                    disabled={alreadyInScene}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                      alreadyInScene
                        ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed"
                        : "border-gray-200 dark:border-gray-700 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                    }`}
                  >
                    <span className="font-medium">{char.name}</span>
                    {alreadyInScene && (
                      <span className="text-xs text-gray-400 ml-2">(already in scene)</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowAddCharacterDialog(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Dialogue Dialog */}
      <Dialog open={showAddDialogueDialog} onOpenChange={setShowAddDialogueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dialogue</DialogTitle>
            <DialogDescription>
              Add a line of dialogue to the scene.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Character
              </label>
              <select
                value={newDialogueCharacterId}
                onChange={(e) => setNewDialogueCharacterId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select character...</option>
                {currentScene?.characters.map((char) => (
                  <option key={char.id} value={char.id}>{char.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dialogue Text
              </label>
              <textarea
                value={newDialogueText}
                onChange={(e) => setNewDialogueText(e.target.value)}
                placeholder="What does the character say?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (seconds)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={newDialogueDuration}
                onChange={(e) => setNewDialogueDuration(parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddDialogueDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={addDialogue}
              disabled={!newDialogueCharacterId || !newDialogueText}
            >
              Add Dialogue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
