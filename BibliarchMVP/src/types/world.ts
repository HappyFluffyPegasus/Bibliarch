export interface TerrainData {
  width: number
  height: number
  heightMap: number[][] // 2D array of height values
  baseColor: string
}

export interface Building {
  id: string
  type: 'primitive-cube' | 'primitive-plane' | 'preset-house' | 'preset-shop' | 'custom'
  name: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: string
  interiorId?: string // Links to interior 3D space
}

export interface Decoration {
  id: string
  type: 'tree' | 'bush' | 'rock' | 'lamp' | 'bench' | 'custom'
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color?: string
}

export interface PathPoint {
  x: number
  z: number
}

export interface Path {
  id: string
  points: PathPoint[]
  width: number
  color: string
  type: 'road' | 'sidewalk' | 'dirt'
}

export interface World {
  id: string
  storyId: string
  name: string
  terrain: TerrainData
  buildings: Building[]
  decorations: Decoration[]
  paths: Path[]
}

export interface BuildingInterior {
  id: string
  buildingId: string
  name: string
  // Interior-specific data (furniture, decorations, etc.)
  elements: InteriorElement[]
}

export interface InteriorElement {
  id: string
  type: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color?: string
}
