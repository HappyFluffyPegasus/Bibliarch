import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <h2 className="text-6xl font-bold text-sky-500 mb-4">404</h2>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-md hover:from-sky-600 hover:to-blue-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}