"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import {
  Clock,
  Plus,
  Trash2,
  ChevronRight,
  FileText,
  Users,
  MapPin,
  Sparkles,
  GripVertical,
  Copy,
  MoreHorizontal,
  BookOpen,
  MessageSquare,
  Target,
  Lightbulb,
  Tag,
  Calendar,
  Link2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStoryStore } from "@/stores/storyStore"

interface StoryEvent {
  id: string
  order: number
  title: string
  summary: string
  script: string
  relevance: string
  notes: string
  location: string
  timeframe: string
  characters: EventCharacter[]
  tags: string[]
  color: string
  linkedSceneId?: string
}

interface EventCharacter {
  id: string
  name: string
  role: string
  emotion: string
  goal: string
}

const EVENT_COLORS = [
  { name: "Blue", value: "#3B82F6", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500" },
  { name: "Green", value: "#10B981", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-500" },
  { name: "Amber", value: "#F59E0B", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500" },
  { name: "Red", value: "#EF4444", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500" },
  { name: "Purple", value: "#8B5CF6", bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-500" },
  { name: "Pink", value: "#EC4899", bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-500" },
]

const PRESET_TAGS = ["Opening", "Rising Action", "Climax", "Falling Action", "Resolution", "Flashback", "Dream", "Conflict", "Romance", "Comedy", "Drama", "Action"]

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export default function TimelinePage() {
  const params = useParams()
  const storyId = params.id as string
  const { stories } = useStoryStore()
  const story = stories.find((s) => s.id === storyId)

  const [events, setEvents] = useState<StoryEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null)
  const [showTagPicker, setShowTagPicker] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`bibliarch-timeline-${storyId}`)
    if (saved) {
      try {
        setEvents(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load timeline:", e)
      }
    }
  }, [storyId])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`bibliarch-timeline-${storyId}`, JSON.stringify(events))
  }, [events, storyId])

  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const selectedColor = EVENT_COLORS.find((c) => c.value === selectedEvent?.color) || EVENT_COLORS[0]

  const handleCreateEvent = () => {
    const newEvent: StoryEvent = {
      id: generateId(),
      order: events.length,
      title: `Event ${events.length + 1}`,
      summary: "",
      script: "",
      relevance: "",
      notes: "",
      location: "",
      timeframe: "",
      characters: [],
      tags: [],
      color: EVENT_COLORS[events.length % EVENT_COLORS.length].value
    }
    setEvents([...events, newEvent])
    setSelectedEventId(newEvent.id)
  }

  const handleUpdateEvent = (id: string, updates: Partial<StoryEvent>) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, ...updates } : e)))
  }

  const handleDeleteEvent = (id: string) => {
    if (confirm("Delete this event? This cannot be undone.")) {
      setEvents(events.filter((e) => e.id !== id))
      if (selectedEventId === id) {
        setSelectedEventId(null)
      }
    }
  }

  const handleDuplicateEvent = (event: StoryEvent) => {
    const newEvent: StoryEvent = {
      ...event,
      id: generateId(),
      order: events.length,
      title: `${event.title} (Copy)`
    }
    setEvents([...events, newEvent])
    setSelectedEventId(newEvent.id)
  }

  const handleAddCharacter = () => {
    if (!selectedEventId) return
    const event = events.find((e) => e.id === selectedEventId)
    if (!event) return

    const newChar: EventCharacter = {
      id: generateId(),
      name: "",
      role: "",
      emotion: "",
      goal: ""
    }
    handleUpdateEvent(selectedEventId, {
      characters: [...event.characters, newChar]
    })
  }

  const handleUpdateCharacter = (charIndex: number, updates: Partial<EventCharacter>) => {
    if (!selectedEventId) return
    const event = events.find((e) => e.id === selectedEventId)
    if (!event) return

    const newChars = [...event.characters]
    newChars[charIndex] = { ...newChars[charIndex], ...updates }
    handleUpdateEvent(selectedEventId, { characters: newChars })
  }

  const handleRemoveCharacter = (charIndex: number) => {
    if (!selectedEventId) return
    const event = events.find((e) => e.id === selectedEventId)
    if (!event) return

    handleUpdateEvent(selectedEventId, {
      characters: event.characters.filter((_, i) => i !== charIndex)
    })
  }

  const handleToggleTag = (tag: string) => {
    if (!selectedEventId) return
    const event = events.find((e) => e.id === selectedEventId)
    if (!event) return

    const newTags = event.tags.includes(tag)
      ? event.tags.filter((t) => t !== tag)
      : [...event.tags, tag]
    handleUpdateEvent(selectedEventId, { tags: newTags })
  }

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    setDraggedEventId(eventId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (!draggedEventId) return

    const draggedIndex = events.findIndex((ev) => ev.id === draggedEventId)
    if (draggedIndex === targetIndex) return

    const newEvents = [...events]
    const [removed] = newEvents.splice(draggedIndex, 1)
    newEvents.splice(targetIndex, 0, removed)

    // Update order values
    newEvents.forEach((ev, i) => {
      ev.order = i
    })

    setEvents(newEvents)
  }

  const handleDragEnd = () => {
    setDraggedEventId(null)
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar - Event List */}
      <aside className="w-80 border-r border-border flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-500" />
              <h1 className="font-semibold text-foreground">Story Timeline</h1>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {events.length} events
            </span>
          </div>
          <Button onClick={handleCreateEvent} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto p-2">
          {events.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground mb-1">No events yet</p>
              <p className="text-xs text-muted-foreground/70">
                Create your first story event to begin outlining your narrative
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {events
                .sort((a, b) => a.order - b.order)
                .map((event, index) => {
                  const color = EVENT_COLORS.find((c) => c.value === event.color) || EVENT_COLORS[0]
                  return (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, event.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedEventId(event.id)}
                      className={`group relative rounded-lg border transition-all cursor-pointer ${
                        selectedEventId === event.id
                          ? `${color.bg} ${color.border} border-2`
                          : "border-transparent hover:bg-muted/50"
                      } ${draggedEventId === event.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start gap-2 p-3">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: event.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <h3 className="font-medium text-sm text-foreground truncate">
                              {event.title || "Untitled"}
                            </h3>
                          </div>
                          {event.summary && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {event.summary}
                            </p>
                          )}
                          {event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {event.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                              {event.tags.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{event.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 flex-shrink-0 transition-colors ${
                            selectedEventId === event.id
                              ? color.text
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content - Event Editor */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedEvent ? (
          <>
            {/* Event Header */}
            <header className={`border-b border-border p-4 ${selectedColor.bg}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={selectedEvent.title}
                    onChange={(e) => handleUpdateEvent(selectedEvent.id, { title: e.target.value })}
                    placeholder="Event Title"
                    className="text-2xl font-bold bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground/50"
                  />
                  <div className="flex items-center gap-3 mt-2">
                    {/* Color Picker */}
                    <div className="flex items-center gap-1">
                      {EVENT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => handleUpdateEvent(selectedEvent.id, { color: color.value })}
                          className={`w-5 h-5 rounded-full transition-all ${
                            selectedEvent.color === color.value
                              ? "ring-2 ring-offset-2 ring-offset-background ring-sky-500 scale-110"
                              : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <div className="h-4 w-px bg-border" />
                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <input
                        type="text"
                        value={selectedEvent.location}
                        onChange={(e) => handleUpdateEvent(selectedEvent.id, { location: e.target.value })}
                        placeholder="Location"
                        className="bg-transparent border-none outline-none w-32 placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <div className="h-4 w-px bg-border" />
                    {/* Timeframe */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <input
                        type="text"
                        value={selectedEvent.timeframe}
                        onChange={(e) => handleUpdateEvent(selectedEvent.id, { timeframe: e.target.value })}
                        placeholder="When"
                        className="bg-transparent border-none outline-none w-32 placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDuplicateEvent(selectedEvent)}
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="text-destructive hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                {selectedEvent.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={`text-xs px-2 py-1 rounded-full ${selectedColor.bg} ${selectedColor.text} ${selectedColor.border} border`}
                  >
                    {tag} ×
                  </button>
                ))}
                <div className="relative">
                  <button
                    onClick={() => setShowTagPicker(!showTagPicker)}
                    className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
                  >
                    + Add Tag
                  </button>
                  {showTagPicker && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-lg shadow-lg z-10 w-48">
                      <div className="flex flex-wrap gap-1">
                        {PRESET_TAGS.filter((t) => !selectedEvent.tags.includes(t)).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              handleToggleTag(tag)
                              setShowTagPicker(false)
                            }}
                            className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Event Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Summary */}
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-sky-500" />
                    <h2 className="font-semibold text-foreground">Summary</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    A brief overview of what happens in this event
                  </p>
                  <textarea
                    value={selectedEvent.summary}
                    onChange={(e) => handleUpdateEvent(selectedEvent.id, { summary: e.target.value })}
                    placeholder="Describe what happens in this event..."
                    className="w-full h-24 p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none"
                  />
                </section>

                {/* Script / Dialogue */}
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <h2 className="font-semibold text-foreground">Script & Dialogue</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Write the dialogue and actions for this scene
                  </p>
                  <textarea
                    value={selectedEvent.script}
                    onChange={(e) => handleUpdateEvent(selectedEvent.id, { script: e.target.value })}
                    placeholder="ALICE: (entering the room) Hey, what's going on here?&#10;&#10;BOB: (nervously) Nothing! Just... working on something.&#10;&#10;[Alice notices the broken vase on the floor]&#10;&#10;ALICE: Is that my grandmother's vase?"
                    className="w-full h-48 p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none font-mono"
                  />
                </section>

                {/* Story Relevance */}
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-amber-500" />
                    <h2 className="font-semibold text-foreground">Story Relevance</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Why does this event matter? How does it advance the plot?
                  </p>
                  <textarea
                    value={selectedEvent.relevance}
                    onChange={(e) => handleUpdateEvent(selectedEvent.id, { relevance: e.target.value })}
                    placeholder="This event is important because...&#10;&#10;• It establishes the conflict between...&#10;• It reveals that the character...&#10;• It sets up the next event where..."
                    className="w-full h-32 p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
                  />
                </section>

                {/* Characters in Scene */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-500" />
                      <h2 className="font-semibold text-foreground">Characters in Scene</h2>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleAddCharacter}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Character
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Who appears in this event and what are they doing?
                  </p>

                  {selectedEvent.characters.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border rounded-lg">
                      <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No characters added</p>
                      <p className="text-xs text-muted-foreground/70">
                        Add characters to track their involvement
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedEvent.characters.map((char, index) => (
                        <div
                          key={char.id}
                          className="p-4 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <input
                              type="text"
                              value={char.name}
                              onChange={(e) => handleUpdateCharacter(index, { name: e.target.value })}
                              placeholder="Character Name"
                              className="font-medium bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50"
                            />
                            <button
                              onClick={() => handleRemoveCharacter(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Role in Scene</label>
                              <input
                                type="text"
                                value={char.role}
                                onChange={(e) => handleUpdateCharacter(index, { role: e.target.value })}
                                placeholder="e.g., Protagonist, Antagonist"
                                className="w-full px-2 py-1.5 text-sm rounded border border-border bg-background"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Emotional State</label>
                              <input
                                type="text"
                                value={char.emotion}
                                onChange={(e) => handleUpdateCharacter(index, { emotion: e.target.value })}
                                placeholder="e.g., Anxious, Excited"
                                className="w-full px-2 py-1.5 text-sm rounded border border-border bg-background"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Goal/Motivation</label>
                              <input
                                type="text"
                                value={char.goal}
                                onChange={(e) => handleUpdateCharacter(index, { goal: e.target.value })}
                                placeholder="e.g., Find the truth"
                                className="w-full px-2 py-1.5 text-sm rounded border border-border bg-background"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Notes */}
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-pink-500" />
                    <h2 className="font-semibold text-foreground">Notes & Ideas</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Additional thoughts, reminders, or ideas for this event
                  </p>
                  <textarea
                    value={selectedEvent.notes}
                    onChange={(e) => handleUpdateEvent(selectedEvent.id, { notes: e.target.value })}
                    placeholder="Any additional notes, ideas, or reminders..."
                    className="w-full h-24 p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 outline-none"
                  />
                </section>

                {/* Scene Link */}
                <section className="pb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4 text-cyan-500" />
                    <h2 className="font-semibold text-foreground">3D Scene</h2>
                  </div>
                  <div className="p-4 rounded-lg border border-dashed border-border bg-muted/30 text-center">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Link a 3D scene to visualize this event
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      Create Scene (Coming Soon)
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Build Your Story Timeline
              </h2>
              <p className="text-muted-foreground mb-6">
                Create events to outline your narrative. Each event can include summaries,
                dialogue scripts, character states, and more.
              </p>
              <Button onClick={handleCreateEvent}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Event
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
