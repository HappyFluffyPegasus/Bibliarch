'use client'

import { Button } from '@/components/ui/button'
import { Sparkles, Bitcoin, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import FeedbackButton from '@/components/feedback/FeedbackButton'
import dynamic from 'next/dynamic'

// Load canvas dynamically (client-only)
const HTMLCanvas = dynamic(
  () => import('@/components/canvas/HTMLCanvas'),
  { ssr: false }
)

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:to-gray-900">
      {/* Header - Same as dashboard */}
      <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-2 md:px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-sky-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              Bibliarch
            </h1>
          </div>

          <div className="flex items-center gap-1 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 md:h-9 md:w-9 p-0"
              title="Support Bibliarch"
            >
              <a
                href="https://pay.zaprite.com/pl_mTYYPoOo2S"
                target="_blank"
                rel="noreferrer noopener"
              >
                <Bitcoin className="w-5 h-5" style={{ transform: 'rotate(0deg)' }} />
              </a>
            </Button>
            <div className="md:block"><FeedbackButton /></div>
            <div className="md:block"><ThemeToggle /></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 min-h-[calc(100vh-200px)] flex flex-col justify-center">
          {/* Main Heading - What is this for */}
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
            Visual Story Planning
            <span className="block mt-2 bg-gradient-to-r from-sky-500 to-blue-600 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              For Writers Who Think Visually
            </span>
          </h2>

          {/* Subtext - How it helps */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Plan characters, map relationships, organize timelines, and build your story world on an infinite canvas. No more scattered notes or confusing spreadsheets.
          </p>

          {/* CTA Button */}
          <div className="pt-8">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg"
              >
                Go to Dashboard
              </Button>
            </Link>
          </div>

        </div>

        {/* Feature Preview Section */}
        <div className="mt-32 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 opacity-100">
            {/* Feature 1 */}
            <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 mx-auto rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Visual Editing</h3>
              <p className="text-sm text-muted-foreground">
                Drag, connect, and arrange your story elements on an infinite visual canvas
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 mx-auto rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Creative Freedom</h3>
              <p className="text-sm text-muted-foreground">
                Write whatever you want. No restrictions, no judgment—just pure creative expression
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 mx-auto rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Infinite Organization</h3>
              <p className="text-sm text-muted-foreground">
                Folders, sub-canvases, and nested structures for complex story worlds
              </p>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-8">
            <h3 className="text-3xl font-bold">Try Bibliarch Now</h3>
            <div className="flex items-center justify-center gap-2 text-sky-600 dark:text-sky-400">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">
                Demo Mode: Changes made here will not be saved
              </p>
            </div>
          </div>

          {/* Canvas Demo Container */}
          <div
            className="shadow-2xl demo-container-outer"
            style={{
              height: '600px',
              backgroundColor: '#f5f5f5',
              border: '2px solid #333',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <style dangerouslySetInnerHTML={{__html: `
              .demo-canvas * {
                --background: 0 0% 96% !important;
                --color-canvas-bg: #f5f5f5 !important;
              }
              .demo-container-outer > div:first-of-type {
                overflow: hidden;
                position: relative;
                width: 100%;
                height: 100%;
              }
              /* Hide floating UI elements in demo */
              .demo-container-outer .fixed {
                display: none !important;
              }
            `}} />
            <div style={{ width: '100%', height: '100%', colorScheme: 'light', backgroundColor: '#f5f5f5' }}>
              <div className="demo-canvas" style={{ width: '100%', height: '100%' }}>
                <HTMLCanvas
                storyId="demo"
                currentCanvasId="main"
                canvasPath={[]}
                currentFolderId={null}
                currentFolderTitle={null}
                initialNodes={[
                  // Story Development list container
                  {
                    id: 'story-development',
                    x: 20,
                    y: 20,
                    text: 'Story Development',
                    width: 350,
                    height: 430,
                    type: 'list',
                    childIds: ['character-node', 'character-node-2', 'location-node', 'folder-node']
                  },
                  {
                    id: 'character-node',
                    x: 40,
                    y: 60,
                    text: 'Character',
                    content: '',
                    width: 310,
                    height: 72,
                    type: 'character',
                    parentId: 'story-development'
                  },
                  {
                    id: 'character-node-2',
                    x: 40,
                    y: 142,
                    text: 'Character',
                    content: '',
                    width: 310,
                    height: 72,
                    type: 'character',
                    parentId: 'story-development'
                  },
                  {
                    id: 'location-node',
                    x: 40,
                    y: 224,
                    text: 'Location',
                    content: '',
                    width: 310,
                    height: 90,
                    type: 'location',
                    parentId: 'story-development'
                  },
                  {
                    id: 'folder-node',
                    x: 40,
                    y: 324,
                    text: 'Folder',
                    content: 'Create sub-canvases for complex projects',
                    width: 310,
                    height: 100,
                    type: 'folder',
                    parentId: 'story-development'
                  },
                  // Image node
                  {
                    id: 'cover-image',
                    x: 380,
                    y: 20,
                    text: '',
                    width: 390,
                    height: 300,
                    type: 'image'
                  },
                  // Text Note
                  {
                    id: 'text-note',
                    x: 780,
                    y: 20,
                    text: 'Text Note',
                    content: 'Free-form notes and ideas',
                    width: 320,
                    height: 300,
                    type: 'text'
                  },
                  // Event node
                  {
                    id: 'event-node',
                    x: 380,
                    y: 330,
                    text: 'Event',
                    title: 'Event',
                    summary: 'Plot story moments and timelines',
                    width: 280,
                    height: 340,
                    type: 'event',
                    durationText: ''
                  },
                  // Table node
                  {
                    id: 'table-node',
                    x: 670,
                    y: 330,
                    text: '',
                    width: 440,
                    height: 150,
                    type: 'table',
                    tableData: [
                      { col1: 'Type', col2: 'Purpose' },
                      { col1: 'Table', col2: 'Structured data' },
                      { col1: 'Rows', col2: 'Track details' }
                    ]
                  },
                  // Quick note
                  {
                    id: 'quick-note',
                    x: 670,
                    y: 490,
                    text: 'Quick note...',
                    content: '',
                    width: 260,
                    height: 80,
                    type: 'note'
                  }
                ]}
                initialConnections={[
                  {
                    id: 'conn-1',
                    from: 'folder-node',
                    to: 'event-node'
                  }
                ]}
                onSave={() => {}} // No-op for demo
                onNavigateToCanvas={() => {}} // No-op for demo
                onStateChange={() => {}} // No-op for demo
                canvasWidth={3000}
                canvasHeight={2000}
                initialShowHelp={false}
              />
              </div>
            </div>
          </div>
        </div>

        {/* Donation Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <div className="bg-sky-50 dark:bg-sky-950/20 border-2 border-sky-200 dark:border-sky-800 rounded-2xl p-8 md:p-12 text-center shadow-xl">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Support Bibliarch's Development</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Bibliarch is free and open for all writers. If you find it valuable, consider supporting its continued development.
            </p>
            <a
              href="https://pay.zaprite.com/pl_mTYYPoOo2S"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg"
              >
                Donate
              </Button>
            </a>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t mt-24 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-4">
          <div className="flex justify-center gap-6">
            <a href="https://pay.zaprite.com/pl_mTYYPoOo2S" target="_blank" rel="noreferrer noopener" className="hover:text-foreground">
              Support
            </a>
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <a href="mailto:support@bibliarch.com" className="hover:text-foreground">
              Contact
            </a>
          </div>
          <p>&copy; 2025 Bibliarch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
