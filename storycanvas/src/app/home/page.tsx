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
        <div className="max-w-4xl mx-auto text-center space-y-8">
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

          {/* Secondary text */}
          <p className="text-sm text-muted-foreground">
            Free to start • No credit card required
          </p>
        </div>

        {/* Feature Preview Section */}
        <div className="mt-24 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 mx-auto rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Character Mapping</h3>
              <p className="text-sm text-muted-foreground">
                Visualize character relationships, personalities, and arcs all in one place
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 mx-auto rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Timeline Planning</h3>
              <p className="text-sm text-muted-foreground">
                Connect events, track plot threads, and see your story's structure at a glance
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
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">
                Demo Mode: Changes made here will not be saved
              </p>
            </div>
          </div>

          {/* Canvas Demo Container */}
          <style dangerouslySetInnerHTML={{__html: `
            .demo-canvas-container .fixed {
              position: absolute !important;
            }
            .demo-canvas-container {
              position: relative;
            }
          `}} />
          <div
            className="border-4 border-sky-500 rounded-lg overflow-hidden shadow-2xl bg-white demo-canvas-container relative"
            style={{ height: '600px' }}
          >
            <div className="w-full h-full bg-white">
              <HTMLCanvas
                storyId="demo"
                currentCanvasId="main"
                canvasPath={[]}
                currentFolderId={null}
                currentFolderTitle={null}
                zoom={0.7}
                initialNodes={[
                  {
                    id: 'char-1',
                    type: 'character',
                    x: 150,
                    y: 100,
                    width: 320,
                    height: 72,
                    text: 'Sarah Chen',
                    content: ''
                  },
                  {
                    id: 'char-2',
                    type: 'character',
                    x: 650,
                    y: 100,
                    width: 320,
                    height: 72,
                    text: 'Marcus Vale',
                    content: ''
                  },
                  {
                    id: 'event-1',
                    type: 'event',
                    x: 150,
                    y: 250,
                    width: 220,
                    height: 280,
                    text: 'Opening Scene',
                    title: 'Opening Scene',
                    summary: 'Sarah discovers the first clue that will change everything...',
                    durationText: 'Day 1'
                  },
                  {
                    id: 'event-2',
                    type: 'event',
                    x: 450,
                    y: 250,
                    width: 220,
                    height: 280,
                    text: 'First Encounter',
                    title: 'First Encounter',
                    summary: 'Sarah and Marcus meet under tense circumstances',
                    durationText: 'Day 3'
                  },
                  {
                    id: 'text-1',
                    type: 'text',
                    x: 1050,
                    y: 200,
                    width: 300,
                    height: 180,
                    text: 'Story Notes',
                    content: 'Click and drag nodes around. Double-click to edit. Try the tools in the sidebar!'
                  }
                ]}
                initialConnections={[
                  {
                    id: 'conn-1',
                    from: 'event-1',
                    to: 'event-2'
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

        {/* Final CTA */}
        <div className="mt-24 text-center space-y-6">
          <h3 className="text-3xl font-bold">Ready to plan your story?</h3>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg"
            >
              Go to Dashboard
            </Button>
          </Link>
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
