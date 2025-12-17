'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import FeedbackModal from './FeedbackModal'

interface FeedbackButtonProps {
  onTooltipEnter?: (text: string, x: number) => void
  onTooltipLeave?: () => void
}

export default function FeedbackButton({ onTooltipEnter, onTooltipLeave }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div
        className="relative"
        onMouseEnter={(e) => onTooltipEnter?.('Send Feedback', e.currentTarget.getBoundingClientRect().left)}
        onMouseLeave={() => onTooltipLeave?.()}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <MessageSquare className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
