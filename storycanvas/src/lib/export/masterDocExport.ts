// Master doc export orchestration

import { Packer } from 'docx'
import { createClient } from '@/lib/supabase/client'
import type { ExportOptions, StoryMetadata } from './types'
import { fetchAllCanvasData } from './canvasTraversal'
import { formatAsDocx } from './formatters/docxFormatter'

/**
 * Fetch story metadata
 */
async function fetchStoryMetadata(storyId: string, userId: string): Promise<StoryMetadata | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('stories')
    .select('id, title, bio')
    .eq('id', storyId)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching story metadata:', error)
    return null
  }

  return data
}

/**
 * Download a file to the user's computer
 */
export function downloadFile(content: Blob | string, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}

/**
 * Generate filename for export
 */
function generateFilename(storyTitle: string): string {
  const sanitizedTitle = storyTitle
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)

  const date = new Date().toISOString().split('T')[0]

  return `${sanitizedTitle}_export_${date}.docx`
}

/**
 * Default export options with everything enabled
 */
export const defaultExportOptions: ExportOptions = {
  format: 'plaintext',
  include: {
    characters: true,
    events: true,
    locations: true,
    textNotes: true,
    tables: true,
    lists: true,
    relationshipNodes: true
  }
}

/**
 * Main export function - orchestrates the entire export process
 */
export async function exportProject(
  storyId: string,
  userId: string,
  options: ExportOptions = defaultExportOptions,
  onProgress?: (progress: { stage: string; percent: number }) => void
): Promise<{ blob: Blob; filename: string } | null> {
  try {
    // Stage 1: Fetch story metadata
    onProgress?.({ stage: 'Fetching story info...', percent: 10 })
    const story = await fetchStoryMetadata(storyId, userId)
    if (!story) {
      throw new Error('Story not found')
    }

    // Stage 2: Fetch all canvas data
    onProgress?.({ stage: 'Loading canvases...', percent: 30 })
    const allCanvases = await fetchAllCanvasData(storyId)

    // Stage 3: Generate document
    onProgress?.({ stage: 'Generating document...', percent: 60 })

    const doc = formatAsDocx(story, allCanvases, options)

    // Stage 4: Convert to blob
    onProgress?.({ stage: 'Creating file...', percent: 80 })
    const blob = await Packer.toBlob(doc)

    const filename = generateFilename(story.title)

    onProgress?.({ stage: 'Complete!', percent: 100 })

    return {
      blob,
      filename
    }
  } catch (error) {
    console.error('Export failed:', error)
    throw error
  }
}

/**
 * Convenience function to export and immediately download
 */
export async function exportAndDownload(
  storyId: string,
  userId: string,
  options: ExportOptions = defaultExportOptions,
  onProgress?: (progress: { stage: string; percent: number }) => void
): Promise<boolean> {
  try {
    const result = await exportProject(storyId, userId, options, onProgress)

    if (result) {
      downloadFile(result.blob, result.filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      return true
    }

    return false
  } catch (error) {
    console.error('Export and download failed:', error)
    return false
  }
}
