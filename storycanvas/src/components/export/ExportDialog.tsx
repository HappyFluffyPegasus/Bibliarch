'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, Download } from 'lucide-react'
import { exportAndDownload, defaultExportOptions, type ExportOptions } from '@/lib/export'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storyId: string
  userId: string
  storyTitle: string
}

export function ExportDialog({ open, onOpenChange, storyId, userId, storyTitle }: ExportDialogProps) {
  const [includeOptions, setIncludeOptions] = useState(defaultExportOptions.include)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<{ stage: string; percent: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleIncludeChange = (key: keyof typeof includeOptions, checked: boolean) => {
    setIncludeOptions(prev => ({ ...prev, [key]: checked }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    setProgress({ stage: 'Starting export...', percent: 0 })

    const options: ExportOptions = {
      format: 'plaintext', // Always use plain text for clean output
      include: includeOptions
    }

    try {
      const success = await exportAndDownload(storyId, userId, options, setProgress)

      if (success) {
        setTimeout(() => {
          onOpenChange(false)
          setIsExporting(false)
          setProgress(null)
        }, 500)
      } else {
        setError('Export failed. Please try again.')
        setIsExporting(false)
        setProgress(null)
      }
    } catch (err) {
      console.error('Export error:', err)
      setError(err instanceof Error ? err.message : 'Export failed. Please try again.')
      setIsExporting(false)
      setProgress(null)
    }
  }

  const includeOptionsList = [
    { key: 'characters' as const, label: 'Characters' },
    { key: 'events' as const, label: 'Events' },
    { key: 'locations' as const, label: 'Locations' },
    { key: 'textNotes' as const, label: 'Text notes' },
    { key: 'tables' as const, label: 'Tables' },
    { key: 'lists' as const, label: 'Lists' },
    { key: 'relationshipNodes' as const, label: 'Relationship nodes' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Project
          </DialogTitle>
          <DialogDescription>
            Export "{storyTitle}" as a text document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Include Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include</Label>
            <div className="border border-border rounded-lg p-3 space-y-2 max-h-[250px] overflow-y-auto">
              {includeOptionsList.map(option => (
                <div key={option.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.key}
                    checked={includeOptions[option.key]}
                    onCheckedChange={(checked) => handleIncludeChange(option.key, checked as boolean)}
                  />
                  <Label htmlFor={option.key} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Progress indicator */}
          {isExporting && progress && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress.stage}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-gradient-to-r from-sky-500 to-blue-600 dark:from-blue-500 dark:to-blue-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
