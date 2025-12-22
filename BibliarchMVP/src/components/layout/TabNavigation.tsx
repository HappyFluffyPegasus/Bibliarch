"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  FileText,
  Users,
  Clock,
  Globe,
  Film,
  Home
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  icon: React.ReactNode
  path: string
}

interface TabNavigationProps {
  storyId?: string
}

export function TabNavigation({ storyId }: TabNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()

  // If no story is selected, don't show tabs
  if (!storyId) return null

  const tabs: Tab[] = [
    {
      id: "notes",
      label: "Notes",
      icon: <FileText className="w-5 h-5" />,
      path: `/story/${storyId}/notes`,
    },
    {
      id: "characters",
      label: "Characters",
      icon: <Users className="w-5 h-5" />,
      path: `/story/${storyId}/characters`,
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: <Clock className="w-5 h-5" />,
      path: `/story/${storyId}/timeline`,
    },
    {
      id: "world",
      label: "World",
      icon: <Globe className="w-5 h-5" />,
      path: `/story/${storyId}/world`,
    },
    {
      id: "story",
      label: "Story",
      icon: <Film className="w-5 h-5" />,
      path: `/story/${storyId}/scenes`,
    },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-4">
        {/* Home button */}
        <button
          onClick={() => router.push("/")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all",
            "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">Home</span>
        </button>

        {/* Tab buttons */}
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => router.push(tab.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all",
              isActive(tab.path)
                ? "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            {tab.icon}
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
