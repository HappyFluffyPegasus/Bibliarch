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
    name: 'Professional Story Planner',
    description: 'A comprehensive, beautifully organized template for serious storytellers - from concept to completion',
    category: 'intermediate',
    features: ['Complete story development workflow', 'Visual organization', 'Character & plot frameworks', 'Theme & conflict mapping'],
    estimatedTime: '3-6 hours to complete',
    nodes: [
      // Story Development list container
      {
        id: 'story-development',
        x: 100,
        y: 200,
        text: 'Story Development',
        width: 350,
        height: 650, // Adjusted to be just a couple px below last node
        type: 'list',
        childIds: ['characters-folder', 'plot-folder', 'world-folder', 'themes-folder']
      },
      {
        id: 'characters-folder',
        x: 120,
        y: 240,
        text: 'Characters & Relationships',
        content: 'Write your content here...',
        width: 310,
        height: 90,
        type: 'folder',
        linkedCanvasId: 'characters-canvas',
        parentId: 'story-development'
      },
      {
        id: 'plot-folder',
        x: 120,
        y: 350,
        text: 'Plot Structure & Events',
        content: 'Write your content here...',
        width: 310,
        height: 90,
        type: 'folder',
        linkedCanvasId: 'plot-canvas',
        parentId: 'story-development'
      },
      {
        id: 'world-folder',
        x: 120,
        y: 460,
        text: 'World & Settings',
        content: 'Write your content here...',
        width: 310,
        height: 90,
        type: 'folder',
        linkedCanvasId: 'world-canvas',
        parentId: 'story-development'
      },
      {
        id: 'themes-folder',
        x: 120,
        y: 570,
        text: 'Themes & Conflicts',
        content: 'Write your content here...',
        width: 310,
        height: 90,
        type: 'folder',
        linkedCanvasId: 'themes-canvas',
        parentId: 'story-development'
      },

      // Image node beside the story development
      {
        id: 'cover-image',
        x: 500,
        y: 200,
        text: 'Cover Concept',
        width: 250,
        height: 200,
        type: 'image'
      },

      // Story overview text node under the image
      {
        id: 'story-overview',
        x: 500,
        y: 420,
        text: 'Story Overview',
        content: 'Write your story overview here...',
        width: 250,
        height: 230,
        type: 'text'
      }
    ],
    connections: [
      {
        id: 'characters-to-plot',
        from: 'characters-folder',
        to: 'plot-folder',
        type: 'leads-to'
      },
      {
        id: 'plot-to-world',
        from: 'plot-folder',
        to: 'world-folder',
        type: 'relates-to'
      },
      {
        id: 'world-to-themes',
        from: 'world-folder',
        to: 'themes-folder',
        type: 'relates-to'
      },
      {
        id: 'development-to-overview',
        from: 'story-development',
        to: 'story-overview',
        type: 'relates-to'
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
            content: 'Who is your main character?',
            type: 'character',
            width: 220,
            height: 140
          },
          {
            id: 'antagonist',
            x: 400,
            y: 100,
            text: 'Antagonist',
            content: 'Who opposes your main character?',
            type: 'character',
            width: 220,
            height: 140
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
            type: 'event'
          },
          {
            id: 'rising-action',
            x: 400,
            y: 100,
            text: 'Rising Action',
            content: 'What challenges does your protagonist face?',
            width: 220,
            height: 140,
            type: 'event'
          },
          {
            id: 'midpoint',
            x: 700,
            y: 100,
            text: 'Midpoint',
            content: 'What major event changes everything?',
            width: 220,
            height: 140,
            type: 'event'
          },
          {
            id: 'climax',
            x: 250,
            y: 300,
            text: 'Climax',
            content: 'What is the final confrontation?',
            width: 220,
            height: 140,
            type: 'event'
          },
          {
            id: 'resolution',
            x: 550,
            y: 300,
            text: 'Resolution',
            content: 'How does everything wrap up?',
            width: 220,
            height: 140,
            type: 'event'
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
            type: 'location'
          },
          {
            id: 'world-rules',
            x: 400,
            y: 100,
            text: 'Rules & Logic',
            content: 'What are the rules that govern your story world?',
            width: 220,
            height: 140,
            type: 'text'
          },
          {
            id: 'history-context',
            x: 700,
            y: 100,
            text: 'History & Context',
            content: 'What happened before your story begins?',
            width: 220,
            height: 140,
            type: 'text'
          },
          {
            id: 'key-locations',
            x: 250,
            y: 300,
            text: 'Key Locations',
            content: 'What other important places appear in your story?',
            width: 220,
            height: 140,
            type: 'location'
          },
          {
            id: 'atmosphere-mood',
            x: 550,
            y: 300,
            text: 'Atmosphere & Mood',
            content: 'How should your world feel to readers?',
            width: 220,
            height: 140,
            type: 'text'
          }
        ],
        connections: [
          { id: 'setting-to-rules', from: 'primary-setting', to: 'world-rules', type: 'relates-to' },
          { id: 'history-to-setting', from: 'history-context', to: 'primary-setting', type: 'leads-to' },
          { id: 'setting-to-locations', from: 'primary-setting', to: 'key-locations', type: 'relates-to' },
          { id: 'locations-to-mood', from: 'key-locations', to: 'atmosphere-mood', type: 'relates-to' }
        ]
      },
      'themes-canvas': {
        nodes: [
          {
            id: 'central-conflict',
            x: 100,
            y: 100,
            text: 'Central Conflict',
            content: 'What is the main conflict driving your story?',
            width: 220,
            height: 140,
            type: 'text'
          },
          {
            id: 'moral-questions',
            x: 400,
            y: 100,
            text: 'Moral Questions',
            content: 'What ethical dilemmas does your story explore?',
            width: 220,
            height: 140,
            type: 'text'
          },
          {
            id: 'character-growth',
            x: 700,
            y: 100,
            text: 'Character Growth',
            content: 'How do your characters change and learn?',
            width: 220,
            height: 140,
            type: 'text'
          },
          {
            id: 'societal-themes',
            x: 250,
            y: 300,
            text: 'Societal Themes',
            content: 'What broader social issues does your story address?',
            width: 220,
            height: 140,
            type: 'text'
          },
          {
            id: 'emotional-core',
            x: 550,
            y: 300,
            text: 'Emotional Core',
            content: 'What emotions should readers feel and why?',
            width: 220,
            height: 140,
            type: 'text'
          }
        ],
        connections: [
          { id: 'conflict-to-moral', from: 'central-conflict', to: 'moral-questions', type: 'relates-to' },
          { id: 'moral-to-growth', from: 'moral-questions', to: 'character-growth', type: 'leads-to' },
          { id: 'conflict-to-societal', from: 'central-conflict', to: 'societal-themes', type: 'relates-to' },
          { id: 'growth-to-emotional', from: 'character-growth', to: 'emotional-core', type: 'leads-to' }
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
        content: 'Who is your main character?',
        type: 'character',
        width: 220,
        height: 140
      },
      {
        id: 'antagonist',
        x: 400,
        y: 100,
        text: 'Antagonist',
        content: 'Who opposes your main character?',
        type: 'character',
        width: 220,
        height: 140
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
        content: 'What are the basics about this character?',
        width: 220,
        height: 120,
        type: 'text'
      },
      {
        id: 'personality',
        x: 400,
        y: 100,
        text: 'Personality',
        content: 'How does this character act and think?',
        width: 220,
        height: 120,
        type: 'text'
      },
      {
        id: 'motivation',
        x: 100,
        y: 280,
        text: 'Goals & Motivations',
        content: 'What does this character want?',
        width: 220,
        height: 120,
        type: 'text'
      },
      {
        id: 'relationships',
        x: 400,
        y: 280,
        text: 'Relationships',
        content: 'How does this character relate to others?',
        width: 220,
        height: 120,
        type: 'text'
      },
      {
        id: 'arc',
        x: 250,
        y: 460,
        text: 'Character Arc',
        content: 'How will this character change?',
        width: 220,
        height: 120,
        type: 'text'
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
        content: 'What does this place look like?',
        width: 220,
        height: 120,
        type: 'text'
      },
      {
        id: 'atmosphere',
        x: 400,
        y: 100,
        text: 'Atmosphere & Mood',
        content: 'How does this place feel?',
        width: 220,
        height: 120,
        type: 'text'
      },
      {
        id: 'significance',
        x: 100,
        y: 280,
        text: 'Story Significance',
        content: 'Why is this place important?',
        width: 220,
        height: 120,
        type: 'text'
      },
      {
        id: 'history',
        x: 400,
        y: 280,
        text: 'History & Background',
        content: 'What happened here before?',
        width: 220,
        height: 120,
        type: 'text'
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