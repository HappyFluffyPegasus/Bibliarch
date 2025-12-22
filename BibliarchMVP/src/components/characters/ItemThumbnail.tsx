'use client'

import { useEffect, useState } from 'react'
import { thumbnailGenerator } from '@/utils/thumbnailGenerator'

interface ItemThumbnailProps {
  meshName: string
  color: string
}

export default function ItemThumbnail({ meshName, color }: ItemThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadThumbnail = async () => {
      setLoading(true)
      setError(false)
      try {
        const url = await thumbnailGenerator.generateThumbnail(meshName, color)
        if (!cancelled) {
          // Check if we got a valid data URL or just a placeholder
          if (url && url.startsWith('data:image')) {
            setThumbnailUrl(url)
          } else {
            setError(true)
          }
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to generate thumbnail for', meshName, ':', err)
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      }
    }

    loadThumbnail()

    return () => {
      cancelled = true
    }
  }, [meshName, color])

  // Show thumbnail if loaded successfully
  if (!loading && thumbnailUrl && !error) {
    return (
      <img
        src={thumbnailUrl}
        alt={meshName}
        className="w-full h-full object-cover"
      />
    )
  }

  // Fallback: show colored box with abbreviated mesh name
  const displayName = meshName
    .replace('Eyes_', '')
    .replace('Eyes', 'Default')
    .replace(' Brows', '')
    .replace(' Mouth', '')
    .replace('Closed', 'Closed')

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${color}, ${adjustBrightness(color, -30)})`
      }}
    >
      <span
        className="text-center px-1 leading-tight"
        style={{
          fontSize: '9px',
          fontWeight: 600,
          color: getContrastColor(color),
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}
      >
        {loading ? '...' : displayName}
      </span>
    </div>
  )
}

// Helper to adjust color brightness
function adjustBrightness(color: string, percent: number): string {
  try {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, Math.max(0, (num >> 16) + amt))
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt))
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  } catch {
    return color
  }
}

// Get contrasting text color (white or black) based on background
function getContrastColor(color: string): string {
  try {
    const num = parseInt(color.replace('#', ''), 16)
    const R = (num >> 16) & 0xFF
    const G = (num >> 8) & 0xFF
    const B = num & 0xFF
    // Calculate luminance
    const luminance = (0.299 * R + 0.587 * G + 0.114 * B) / 255
    return luminance > 0.5 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
  } catch {
    return 'rgba(255,255,255,0.9)'
  }
}
