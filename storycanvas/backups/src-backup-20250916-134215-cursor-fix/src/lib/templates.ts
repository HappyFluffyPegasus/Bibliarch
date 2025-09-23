// Story templates - static, pre-defined structures

export interface StoryTemplate {
  id: string
  name: string
  description: string
  category: 'beginner' | 'intermediate' | 'advanced'
  features: string[]  // List of what this template provides
  estimatedTime: string  // How long to complete
  nodes: any[]
  connections: any[]
  subCanvases?: Record<string, { nodes: any[], connections: any[] }>  // Pre-built sub-canvases
}

export const storyTemplates: StoryTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start with an empty canvas - perfect for experienced writers who know exactly what they want',
    category: 'advanced',
    features: ['Complete creative freedom', 'No structure constraints', 'Build from scratch'],
    estimatedTime: 'Variable',
    nodes: [],
    connections: []
  },
  {
    id: 'basic',
    name: 'Basic Story Structure',
    description: 'Perfect for beginners - organized sections for characters, plot, and world with helpful prompts',
    category: 'beginner',
    features: ['Character development prompts', 'Plot structure guidance', 'World-building organization', 'Theme exploration'],
    estimatedTime: '2-4 hours to complete',
    nodes: [
      {
        id: 'story-concept',
        x: 840,
        y: 480,
        text: 'Story Concept',
        content: 'What is your story about?',
        width: 320,
        height: 140,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'characters-folder',
        x: 610,
        y: 690,
        text: 'Characters',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'characters-canvas'
      },
      {
        id: 'plot-folder',
        x: 880,
        y: 690,
        text: 'Plot Structure',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'plot-canvas'
      },
      {
        id: 'world-folder',
        x: 1150,
        y: 690,
        text: 'World & Setting',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'world-canvas'
      },
      {
        id: 'themes',
        x: 610,
        y: 860,
        text: 'Themes & Messages',
        content: 'What themes do you want to explore?',
        width: 240,
        height: 160,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'tone-style',
        x: 880,
        y: 860,
        text: 'Tone & Style',
        content: 'How should your story feel?',
        width: 240,
        height: 160,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'inspiration',
        x: 1150,
        y: 860,
        text: 'Inspiration & References',
        content: 'What inspired this story?',
        width: 240,
        height: 160,
        type: 'text',
        color: '#f8fafc'
      }
    ],
    connections: [
      {
        id: 'concept-to-characters',
        from: 'story-concept',
        to: 'characters-folder',
        type: 'leads-to'
      },
      {
        id: 'concept-to-plot',
        from: 'story-concept',
        to: 'plot-folder',
        type: 'leads-to'
      },
      {
        id: 'concept-to-world',
        from: 'story-concept',
        to: 'world-folder',
        type: 'leads-to'
      }
    ],
    subCanvases: {
      'characters-canvas': {
        nodes: [
          {
            id: 'main-character',
            x: 100,
            y: 100,
            text: 'Protagonist',
            type: 'character',
            color: '#f8fafc',
            width: 220,
            height: 140,
            linkedCanvasId: 'protagonist-details',
            attributes: {
              role: 'Protagonist',
              motivation: 'To overcome their greatest challenge and become who they were meant to be',
              traits: ['Determined', 'Brave', 'Growth-oriented', 'Flawed but relatable'],
              goals: ['Achieve their main objective', 'Overcome personal weakness', 'Protect what matters most'],
              fears: ['Failure', 'Losing loved ones', 'Being inadequate', 'Repeating past mistakes'],
              description: 'The central character who drives the plot forward through their choices and growth',
              appearance: 'Describe your protagonist\'s distinctive physical features and how they present themselves to the world',
              backstory: 'What key events in their past shaped who they are today? What experiences drive their current motivations?',
              relationships: [
                {
                  characterName: 'Antagonist',
                  relationshipType: 'enemy',
                  description: 'Primary source of conflict - represents what the protagonist must overcome'
                }
              ],
              arc: 'How will this character grow and change throughout the story? What will they learn?',
              characterTemplate: 'protagonist',
              age: ''
            }
          },
          {
            id: 'antagonist',
            x: 400,
            y: 100,
            text: 'Antagonist',
            type: 'character',
            color: '#f8fafc',
            width: 220,
            height: 140,
            attributes: {
              role: 'Antagonist',
              motivation: 'To achieve their goal which conflicts with the protagonist - they believe they\'re saving the world',
              traits: ['Powerful', 'Cunning', 'Self-righteous', 'Charismatic', 'Ruthlessly determined'],
              goals: ['Stop the protagonist', 'Achieve their master plan', 'Maintain control', 'Prove they\'re right'],
              fears: ['Losing power', 'Being proven wrong', 'Their past catching up', 'Chaos and disorder'],
              description: 'The primary opposition who believes they\'re the hero of their own story - create depth and believable motivations',
              appearance: 'What makes this character intimidating, memorable, or deceptively appealing?',
              backstory: 'What events turned them into an antagonist? What convinced them their way is right?',
              relationships: [
                {
                  characterName: 'Protagonist',
                  relationshipType: 'enemy',
                  description: 'Sees the protagonist as a dangerous obstacle to their righteous cause'
                }
              ],
              arc: 'How will this character evolve? Will they be redeemed, defeated, or something else?',
              characterTemplate: 'antagonist',
              age: ''
            }
          },
          {
            id: 'supporting-cast',
            x: 250,
            y: 300,
            text: 'Supporting Characters',
            content: 'Who else populates your story world?',
            width: 220,
            height: 160,
            type: 'text',
            color: '#f8fafc'
          }
        ],
        connections: [
          {
            id: 'protagonist-antagonist-conflict',
            from: 'main-character',
            to: 'antagonist',
            type: 'conflicts-with'
          }
        ]
      },
      'plot-canvas': {
        nodes: [
          {
            id: 'inciting-incident',
            x: 100,
            y: 100,
            text: 'Inciting Incident',
            content: 'What event kicks off your story?',
            width: 220,
            height: 140,
            type: 'event',
            color: '#fce7f3'
          },
          {
            id: 'rising-action',
            x: 400,
            y: 100,
            text: 'Rising Action',
            content: 'What challenges does your protagonist face?',
            width: 220,
            height: 140,
            type: 'event',
            color: '#fce7f3'
          },
          {
            id: 'midpoint',
            x: 700,
            y: 100,
            text: 'Midpoint',
            content: 'What major event changes everything?',
            width: 220,
            height: 140,
            type: 'event',
            color: '#fce7f3'
          },
          {
            id: 'climax',
            x: 250,
            y: 300,
            text: 'Climax',
            content: 'What is the final confrontation?',
            width: 220,
            height: 140,
            type: 'event',
            color: '#fce7f3'
          },
          {
            id: 'resolution',
            x: 550,
            y: 300,
            text: 'Resolution',
            content: 'How does everything wrap up?',
            width: 220,
            height: 140,
            type: 'event',
            color: '#fce7f3'
          }
        ],
        connections: [
          { id: 'incident-to-rising', from: 'inciting-incident', to: 'rising-action', type: 'leads-to' },
          { id: 'rising-to-midpoint', from: 'rising-action', to: 'midpoint', type: 'leads-to' },
          { id: 'midpoint-to-climax', from: 'midpoint', to: 'climax', type: 'leads-to' },
          { id: 'climax-to-resolution', from: 'climax', to: 'resolution', type: 'leads-to' }
        ]
      },
      'world-canvas': {
        nodes: [
          {
            id: 'primary-setting',
            x: 100,
            y: 100,
            text: 'Primary Setting',
            content: 'Where does most of your story take place?',
            width: 220,
            height: 140,
            type: 'location',
            color: '#f8fafc'
          },
          {
            id: 'world-rules',
            x: 400,
            y: 100,
            text: 'Rules & Logic',
            content: 'What are the rules that govern your story world?',
            width: 220,
            height: 140,
            type: 'text',
            color: '#f8fafc'
          },
          {
            id: 'history-context',
            x: 700,
            y: 100,
            text: 'History & Context',
            content: 'What happened before your story begins?',
            width: 220,
            height: 140,
            type: 'text',
            color: '#f8fafc'
          },
          {
            id: 'key-locations',
            x: 250,
            y: 300,
            text: 'Key Locations',
            content: 'What other important places appear in your story?',
            width: 220,
            height: 140,
            type: 'location',
            color: '#f8fafc'
          },
          {
            id: 'atmosphere-mood',
            x: 550,
            y: 300,
            text: 'Atmosphere & Mood',
            content: 'How should your world feel to readers?',
            width: 220,
            height: 140,
            type: 'text',
            color: '#f8fafc'
          }
        ],
        connections: [
          { id: 'setting-to-rules', from: 'primary-setting', to: 'world-rules', type: 'relates-to' },
          { id: 'history-to-setting', from: 'history-context', to: 'primary-setting', type: 'leads-to' },
          { id: 'setting-to-locations', from: 'primary-setting', to: 'key-locations', type: 'relates-to' },
          { id: 'locations-to-mood', from: 'key-locations', to: 'atmosphere-mood', type: 'relates-to' }
        ]
      }
    }
  }
]

// Sub-canvas templates for expandable nodes
export const subCanvasTemplates: Record<string, { nodes: any[], connections: any[] }> = {
  // Template-specific character canvases
  'characters-canvas': {
    nodes: [
      {
        id: 'main-character',
        x: 100,
        y: 100,
        text: 'Protagonist',
        type: 'character',
        color: '#f8fafc',
        width: 220,
        height: 140,
        linkedCanvasId: 'protagonist-details',
        attributes: {
          role: 'Protagonist',
          motivation: 'To overcome their greatest challenge and become who they were meant to be',
          traits: ['Determined', 'Brave', 'Growth-oriented', 'Flawed but relatable'],
          goals: ['Achieve their main objective', 'Overcome personal weakness', 'Protect what matters most'],
          fears: ['Failure', 'Losing loved ones', 'Being inadequate'],
          description: 'The central character who drives the plot forward',
          appearance: 'Describe your protagonist\'s distinctive physical features',
          backstory: 'What key events shaped who they are today?',
          relationships: [
            { characterName: 'Antagonist', relationshipType: 'enemy', description: 'Primary source of conflict' }
          ],
          arc: 'How will this character grow throughout the story?',
          characterTemplate: 'protagonist',
          age: ''
        }
      },
      {
        id: 'antagonist',
        x: 400,
        y: 100,
        text: 'Antagonist',
        type: 'character',
        color: '#f8fafc',
        width: 220,
        height: 140,
        attributes: {
          role: 'Antagonist',
          motivation: 'To achieve their goal - they believe they\'re right',
          traits: ['Powerful', 'Cunning', 'Self-righteous'],
          goals: ['Stop the protagonist', 'Achieve their plan'],
          fears: ['Losing power', 'Being proven wrong'],
          description: 'Primary opposition with believable motivations',
          appearance: 'What makes them intimidating or memorable?',
          backstory: 'What events created this antagonist?',
          relationships: [
            { characterName: 'Protagonist', relationshipType: 'enemy', description: 'Sees protagonist as obstacle' }
          ],
          arc: 'How will this character be defeated or redeemed?',
          characterTemplate: 'antagonist',
          age: ''
        }
      }
    ],
    connections: [
      {
        id: 'protagonist-antagonist-conflict',
        from: 'main-character',
        to: 'antagonist',
        type: 'conflicts-with'
      }
    ]
  },
  character: {
    nodes: [
      {
        id: 'basic-info',
        x: 100,
        y: 100,
        text: 'Basic Information',
        content: 'Basic character information',
        width: 220,
        height: 120,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'personality',
        x: 400,
        y: 100,
        text: 'Personality Traits',
        content: 'Character personality traits',
        width: 220,
        height: 120,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'motivation',
        x: 100,
        y: 280,
        text: 'Goals & Motivations',
        content: 'Character goals and motivations',
        width: 220,
        height: 120,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'relationships',
        x: 400,
        y: 280,
        text: 'Relationships',
        content: 'Character relationships',
        width: 220,
        height: 120,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'arc',
        x: 250,
        y: 460,
        text: 'Character Arc',
        content: 'Character development arc',
        width: 220,
        height: 120,
        type: 'text',
        color: '#f8fafc'
      }
    ],
    connections: [
      {
        id: 'conn-1',
        from: 'basic-info',
        to: 'personality',
        type: 'relates-to'
      },
      {
        id: 'conn-2',
        from: 'personality',
        to: 'relationships',
        type: 'relates-to'
      },
      {
        id: 'conn-3',
        from: 'motivation',
        to: 'arc',
        type: 'leads-to'
      }
    ]
  },
  location: {
    nodes: [
      {
        id: 'description',
        x: 100,
        y: 100,
        text: 'Physical Description',
        content: 'Physical description',
        width: 220,
        height: 120,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'atmosphere',
        x: 400,
        y: 100,
        text: 'Atmosphere & Mood',
        content: 'Atmosphere and mood',
        width: 220,
        height: 120,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'significance',
        x: 100,
        y: 280,
        text: 'Story Significance',
        content: 'Story significance',
        width: 220,
        height: 120,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'history',
        x: 400,
        y: 280,
        text: 'History & Background',
        content: 'Location history',
        width: 220,
        height: 120,
        type: 'text',
        color: '#f8fafc'
      }
    ],
    connections: [
      {
        id: 'conn-1',
        from: 'description',
        to: 'atmosphere',
        type: 'relates-to'
      },
      {
        id: 'conn-2',
        from: 'history',
        to: 'significance',
        type: 'leads-to'
      }
    ]
  }
}