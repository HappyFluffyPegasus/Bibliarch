'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

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
    }

    // Handle coming back online
    const handleOnline = () => {
      setIsOnline(true)
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
