export interface CharacterAppearance {
  visibleAssets: string[]
  colors: CategoryColors
  transforms?: Record<string, Transform>
}

export interface Transform {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

export interface CategoryColors {
  hair: string
  tops: { primary: string; secondary?: string }
  pants: string
  dresses: string
  shoes: string
  socks: string
  accessories: string
  body: { skinTone: string; eyeColor: string }
}

export interface Character {
  id: string
  storyId: string
  name: string
  createdAt: Date
  appearance: CharacterAppearance
  // Personality and story info (free-form text boxes)
  backstory?: string
  outlookOnLife?: string
  favoriteFood?: string
  favoriteColor?: string
  // Additional free-form fields can be added
  customFields?: Record<string, string>
}
