# Node Settings Specification

## Overview
Right-click context menu for node-specific settings. Accessed by right-clicking on a selected node.

## Image Nodes
- Toggle header/title text
- Toggle caption at bottom
- Image fit: contain | cover | fill

## Text Nodes
- (No specific settings - only global settings)

## Character Nodes
- Toggle profile picture visibility
- Picture shape: circle | square | rounded square

## Event Nodes
- Toggle duration field visibility
- Expand/collapse summary by default

## Location Nodes
- (No specific settings - only global settings)

## Folder Nodes
- Icon selection (folder, book, archive, box, etc.)
- Collapse/expand children by default

## List Nodes
- Layout: single column | two columns | grid
- Auto-sort: manual | alphabetical | by type

## Table Nodes
- Toggle header row
- Alternate row colors

## All Nodes (Global Settings)
Available for every node type:
- Lock position (prevent dragging)
- Duplicate node
- Delete node
- Change layer (bring to front / send to back)

## Implementation Plan

### Phase 1: Context Menu UI Component
- Create ContextMenu component
- Position at mouse click location
- Close on click outside or ESC key
- Handle node-specific vs global settings

### Phase 2: Node State Extensions
- Add settings properties to Node type
- Update default node creation with settings
- Persist settings in node data

### Phase 3: Settings Implementation by Type
1. Global settings (all nodes)
2. Image nodes
3. Character nodes
4. Event nodes
5. Folder nodes
6. List nodes
7. Table nodes

### Phase 4: Visual Updates
- Update node rendering based on settings
- Ensure settings persist across sessions
- Add undo/redo support for settings changes
