'use client'

import React, { useState, useRef, useEffect, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

interface PopoverContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PopoverContext = createContext<PopoverContextType | null>(null)

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Popover({ open = false, onOpenChange, children }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  const isOpen = open !== undefined ? open : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  return (
    <PopoverContext.Provider value={{ open: isOpen, onOpenChange: setOpen }}>
      <div className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export function PopoverTrigger({ children, asChild = false }: PopoverTriggerProps) {
  const context = useContext(PopoverContext)
  if (!context) {
    throw new Error('PopoverTrigger must be used within a Popover')
  }

  const { open, onOpenChange } = context

  if (asChild) {
    const childElement = children as React.ReactElement
    const childProps = childElement.props as { onClick?: (e: React.MouseEvent) => void }
    return React.cloneElement(childElement, {
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        onOpenChange(!open)
        childProps.onClick?.(e)
      }
    })
  }

  return (
    <button onClick={(e) => {
      e.preventDefault()
      onOpenChange(!open)
    }}>
      {children}
    </button>
  )
}

interface PopoverContentProps {
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function PopoverContent({ 
  children, 
  side = 'bottom', 
  align = 'center', 
  className 
}: PopoverContentProps) {
  const context = useContext(PopoverContext)
  const contentRef = useRef<HTMLDivElement>(null)
  
  if (!context) {
    throw new Error('PopoverContent must be used within a Popover')
  }

  const { open, onOpenChange } = context

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [open, onOpenChange])

  if (!open) {
    return null
  }

  const sideClasses = {
    top: 'bottom-full mb-2',
    right: 'left-full ml-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2'
  }

  const alignClasses = {
    start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
    center: side === 'top' || side === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
    end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0'
  }

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 rounded-md border bg-popover text-popover-foreground shadow-lg outline-none',
        sideClasses[side],
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}