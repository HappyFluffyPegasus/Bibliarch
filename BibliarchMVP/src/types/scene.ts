export interface PositionKeyframe {
  time: number // in seconds
  position: [number, number, number]
  rotation?: [number, number, number]
}

export interface SceneElement {
  id: string
  type: 'character' | 'prop'
  characterId?: string
  propType?: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  keyframes: PositionKeyframe[]
}

export interface DialogueLine {
  id: string
  characterId: string
  text: string
  startTime: number // in seconds
  duration: number // in seconds
}

export interface CameraKeyframe {
  time: number
  position: [number, number, number]
  target: [number, number, number]
  fov?: number
}

export interface Scene {
  id: string
  storyId: string
  title: string
  description?: string
  linkedTimelineEventId?: string
  duration: number // in seconds
  elements: SceneElement[]
  dialogue: DialogueLine[]
  cameraKeyframes: CameraKeyframe[]
  backgroundMusic?: string
  createdAt: Date
  updatedAt: Date
}
