'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { WifiOff, Wifi } from 'lucide-react'

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [hasShownOfflineWarning, setHasShownOfflineWarning] = useState(false)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    // Handle going offline
    const handleOffline = () => {
      setIsOnline(false)
      setHasShownOfflineWarning(true)

      toast.error('You are offline', {
        description: 'Changes won\'t be saved until you reconnect',
        icon: <WifiOff className="w-4 h-4" />,
        duration: Infinity, // Keep showing until dismissed or back online
        id: 'offline-status' // Unique ID to prevent duplicates
      })
    }

    // Handle coming back online
    const handleOnline = () => {
      setIsOnline(true)

      // Only show reconnection message if we previously showed offline warning
      if (hasShownOfflineWarning) {
        // Dismiss the offline toast
        toast.dismiss('offline-status')

        toast.success('You\'re back online!', {
          description: 'Auto-save has resumed',
          icon: <Wifi className="w-4 h-4" />,
          duration: 3000
        })
      }
    }

    // Add event listeners
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // Cleanup
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [hasShownOfflineWarning])

  return (
    <>
      {/* Persistent offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 dark:bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>You are offline - Changes won't be saved until you reconnect</span>
        </div>
      )}
      {children}
    </>
  )
}
