import React, { useEffect, useRef, useState } from 'react'
import { Node } from '../../types'

interface NodeContextMenuProps {
  node: Node
  position: { x: number; y: number }
  onClose: () => void
  onSettingChange: (nodeId: string, setting: string, value: any) => void
  onDuplicate: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onBringToFront: (nodeId: string) => void
  onSendToBack: (nodeId: string) => void
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  node,
  position,
  onClose,
  onSettingChange,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)
  const [isReady, setIsReady] = useState(false)

  // Track double-tap outside for mobile close behavior
  const lastTouchOutsideRef = useRef<{ time: number; x: number; y: number } | null>(null)

  // Adjust position to keep menu on screen
  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect()
      const padding = 10 // Padding from screen edges

      let newX = position.x
      let newY = position.y

      // Adjust horizontal position
      if (position.x + menuRect.width > window.innerWidth - padding) {
        newX = window.innerWidth - menuRect.width - padding
      }
      if (newX < padding) {
        newX = padding
      }

      // Adjust vertical position
      if (position.y + menuRect.height > window.innerHeight - padding) {
        newY = window.innerHeight - menuRect.height - padding
      }
      if (newY < padding) {
        newY = padding
      }

      setAdjustedPosition({ x: newX, y: newY })

      // Longer delay before allowing interactions to prevent double-tap second tap from triggering menu items
      setTimeout(() => setIsReady(true), 350)
    }
  }, [position])

  useEffect(() => {
    // Mouse click outside closes immediately (desktop behavior)
    const handleMouseClickOutside = (e: MouseEvent) => {
      if (!isReady) return

      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    // Touch outside requires double-tap to close (mobile behavior)
    const handleTouchOutside = (e: TouchEvent) => {
      if (!isReady) return

      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        const touch = e.touches[0]
        if (!touch) return

        const now = Date.now()
        const lastTouch = lastTouchOutsideRef.current

        // Check if this is a double-tap (within 400ms and 50px of last touch)
        if (lastTouch) {
          const timeDiff = now - lastTouch.time
          const distance = Math.sqrt(
            Math.pow(touch.clientX - lastTouch.x, 2) +
            Math.pow(touch.clientY - lastTouch.y, 2)
          )

          if (timeDiff < 400 && distance < 50) {
            // Double-tap detected - close the menu
            e.preventDefault()
            e.stopPropagation()
            lastTouchOutsideRef.current = null
            onClose()
            return
          }
        }

        // Record this touch for potential double-tap
        lastTouchOutsideRef.current = {
          time: now,
          x: touch.clientX,
          y: touch.clientY
        }

        // Prevent this single tap from doing anything else
        e.preventDefault()
        e.stopPropagation()
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
    // Separate handlers for mouse (single click) and touch (double tap)
    document.addEventListener('mousedown', handleMouseClickOutside, true)
    document.addEventListener('touchstart', handleTouchOutside, true)
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('mousedown', handleMouseClickOutside, true)
      document.removeEventListener('touchstart', handleTouchOutside, true)
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [onClose, isReady])

  const MenuItem = ({ label, onClick, destructive = false }: { label: string; onClick: () => void; destructive?: boolean }) => (
    <button
      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-accent active:bg-accent transition-colors ${destructive ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20' : 'text-foreground'}`}
      onClick={() => {
        if (!isReady) return
        onClick()
        onClose()
      }}
      onTouchEnd={(e) => {
        if (!isReady) return
        e.preventDefault()
        onClick()
        onClose()
      }}
    >
      {label}
    </button>
  )

  const Divider = () => <div className="border-t border-border my-0.5" />

  const SubMenuItem = ({ label, options }: { label: string; options: { label: string; value: any; current?: boolean }[] }) => (
    <div className="px-3 py-1.5">
      <div className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">{label}</div>
      <div className="flex flex-col gap-0.5">
        {options.map(option => (
          <button
            key={option.value}
            className={`text-left px-2 py-1.5 rounded text-sm ${option.current ? 'bg-primary text-primary-foreground' : 'hover:bg-accent active:bg-accent text-foreground'}`}
            onClick={() => {
              if (!isReady) return
              onSettingChange(node.id, label.toLowerCase().replace(/\s+/g, '_'), option.value)
              onClose()
            }}
            onTouchEnd={(e) => {
              if (!isReady) return
              e.preventDefault()
              onSettingChange(node.id, label.toLowerCase().replace(/\s+/g, '_'), option.value)
              onClose()
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )

  const ToggleMenuItem = ({ label, settingKey, currentValue }: { label: string; settingKey: string; currentValue: boolean }) => (
    <button
      className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent active:bg-accent transition-colors text-foreground flex items-center justify-between"
      onClick={() => {
        if (!isReady) return
        onSettingChange(node.id, settingKey, !currentValue)
        onClose()
      }}
      onTouchEnd={(e) => {
        if (!isReady) return
        e.preventDefault()
        onSettingChange(node.id, settingKey, !currentValue)
        onClose()
      }}
    >
      <span>{label}</span>
      <span className={`text-xs font-medium ${currentValue ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
        {currentValue ? 'ON' : 'OFF'}
      </span>
    </button>
  )

  return (
    <div
      ref={menuRef}
      className="fixed bg-background rounded-md shadow-lg border border-border z-[10000] min-w-[160px] max-w-[220px] py-1"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        touchAction: 'none' // Prevent any touch scrolling on the menu
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {/* Node-specific settings */}
      {node.type === 'image' && (
        <>
          <ToggleMenuItem
            label="Show Header"
            settingKey="show_header"
            currentValue={node.settings?.show_header ?? true}
          />
          <ToggleMenuItem
            label="Show Caption"
            settingKey="show_caption"
            currentValue={node.settings?.show_caption ?? false}
          />
          <SubMenuItem
            label="Image Fit"
            options={[
              { label: 'Contain', value: 'contain', current: (node.settings?.image_fit ?? 'contain') === 'contain' },
              { label: 'Cover', value: 'cover', current: (node.settings?.image_fit ?? 'contain') === 'cover' },
              { label: 'Fill', value: 'fill', current: (node.settings?.image_fit ?? 'contain') === 'fill' }
            ]}
          />
          <Divider />
        </>
      )}

      {node.type === 'character' && (
        <>
          <ToggleMenuItem
            label="Show Profile Picture"
            settingKey="show_profile_picture"
            currentValue={node.settings?.show_profile_picture ?? true}
          />
          <SubMenuItem
            label="Picture Shape"
            options={[
              { label: 'Circle', value: 'circle', current: (node.settings?.picture_shape ?? 'rounded') === 'circle' },
              { label: 'Square', value: 'square', current: (node.settings?.picture_shape ?? 'rounded') === 'square' },
              { label: 'Rounded Square', value: 'rounded', current: (node.settings?.picture_shape ?? 'rounded') === 'rounded' }
            ]}
          />
          <Divider />
        </>
      )}

      {node.type === 'event' && (
        <>
          <ToggleMenuItem
            label="Show Duration Field"
            settingKey="show_duration"
            currentValue={node.settings?.show_duration ?? true}
          />
          <ToggleMenuItem
            label="Expand Summary"
            settingKey="expand_summary"
            currentValue={node.settings?.expand_summary ?? true}
          />
          <Divider />
        </>
      )}

      {node.type === 'folder' && (
        <>
          <SubMenuItem
            label="Icon"
            options={[
              { label: '📁 Folder', value: 'folder', current: (node.settings?.icon ?? 'folder') === 'folder' },
              { label: '📚 Book', value: 'book', current: (node.settings?.icon ?? 'folder') === 'book' },
              { label: '📦 Archive', value: 'archive', current: (node.settings?.icon ?? 'folder') === 'archive' },
              { label: '📦 Box', value: 'box', current: (node.settings?.icon ?? 'folder') === 'box' }
            ]}
          />
          <ToggleMenuItem
            label="Expand by Default"
            settingKey="expand_by_default"
            currentValue={node.settings?.expand_by_default ?? true}
          />
          <Divider />
        </>
      )}


      {node.type === 'table' && (
        <>
          <ToggleMenuItem
            label="Show Header Row"
            settingKey="show_header_row"
            currentValue={node.settings?.show_header_row ?? true}
          />
          <ToggleMenuItem
            label="Alternate Row Colors"
            settingKey="alternate_row_colors"
            currentValue={node.settings?.alternate_row_colors ?? false}
          />
          <Divider />
        </>
      )}

      {/* Global settings for all nodes */}
      <MenuItem label="Duplicate" onClick={() => onDuplicate(node.id)} />
      <MenuItem label="Bring to Front" onClick={() => onBringToFront(node.id)} />
      <MenuItem label="Send to Back" onClick={() => onSendToBack(node.id)} />
      <Divider />
      <MenuItem label="Delete" onClick={() => onDelete(node.id)} destructive />
    </div>
  )
}
