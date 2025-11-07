import React, { useEffect, useRef } from 'react'

interface Connection {
  id: string
  from: string
  to: string
  type?: 'leads-to' | 'conflicts-with' | 'relates-to' | 'relationship'
}

interface ConnectionContextMenuProps {
  connection: Connection
  position: { x: number; y: number }
  onClose: () => void
  onDelete: (connectionId: string) => void
}

export const ConnectionContextMenu: React.FC<ConnectionContextMenuProps> = ({
  connection,
  position,
  onClose,
  onDelete
}) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    // Use capture phase to ensure we get the event first
    document.addEventListener('mousedown', handleClickOutside, true)
    document.addEventListener('click', handleClickOutside, true)
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
      document.removeEventListener('click', handleClickOutside, true)
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [onClose])

  const MenuItem = ({ label, onClick, destructive = false }: { label: string; onClick: () => void; destructive?: boolean }) => (
    <button
      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors ${destructive ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20' : 'text-foreground'}`}
      onClick={() => {
        onClick()
        onClose()
      }}
    >
      {label}
    </button>
  )

  return (
    <div
      ref={menuRef}
      className="fixed bg-background rounded-md shadow-lg border border-border z-[10000] min-w-[160px] max-w-[220px] py-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <MenuItem label="Delete Connection" onClick={() => onDelete(connection.id)} destructive />
    </div>
  )
}
