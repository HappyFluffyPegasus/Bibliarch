"use client"

import { useParams } from "next/navigation"
import { TabNavigation } from "@/components/layout/TabNavigation"

export default function StoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const storyId = params.id as string

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="main-content">
        {children}
      </div>
      <TabNavigation storyId={storyId} />
    </div>
  )
}
