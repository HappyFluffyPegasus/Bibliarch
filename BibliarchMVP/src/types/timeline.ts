export interface CharacterState {
  characterId: string
  stateDescription: string
  location?: string
  emotionalState?: string
}

export interface RelationshipState {
  fromCharacterId: string
  toCharacterId: string
  relationshipType: string
  description: string
  strength: 1 | 2 | 3
}

export interface TimelineEvent {
  id: string
  storyId: string
  title: string
  description: string
  order: number
  track: number // 0 = main track, 1+ = parallel tracks
  duration?: string // "3 days", "instant", etc.
  linkedSceneId?: string
  characterStates: CharacterState[]
  relationshipStates: RelationshipState[]
  color?: string
}
