'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error caught by error boundary:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Something went wrong!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          An error occurred while loading the page.
        </p>
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
          <p className="font-mono text-sm text-red-900 dark:text-red-200 whitespace-pre-wrap break-words">
            {error.message}
          </p>
          {error.stack && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-red-700 dark:text-red-300">Stack trace</summary>
              <pre className="mt-2 text-xs text-red-800 dark:text-red-400 overflow-auto max-h-60">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-md hover:from-sky-600 hover:to-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}