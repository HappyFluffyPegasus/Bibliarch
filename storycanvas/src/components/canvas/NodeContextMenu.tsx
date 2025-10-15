import React, { useEffect, useRef } from 'react'
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

  const Divider = () => <div className="border-t border-border my-0.5" />

  const SubMenuItem = ({ label, options }: { label: string; options: { label: string; value: any; current?: boolean }[] }) => (
    <div className="px-3 py-1.5">
      <div className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">{label}</div>
      <div className="flex flex-col gap-0.5">
        {options.map(option => (
          <button
            key={option.value}
            className={`text-left px-2 py-0.5 rounded text-xs ${option.current ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'}`}
            onClick={() => {
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
      className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors text-foreground flex items-center justify-between"
      onClick={() => {
        onSettingChange(node.id, settingKey, !currentValue)
        onClose()
      }}
    >
      <span>{label}</span>
      <span className={`text-[10px] font-medium ${currentValue ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
        {currentValue ? 'ON' : 'OFF'}
      </span>
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
