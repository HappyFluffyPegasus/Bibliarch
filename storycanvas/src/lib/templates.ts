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
        childIds: ['characters-folder', 'plot-folder', 'world-folder', 'themes-references-folder']
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
        parentId: 'story-development'
      },
      {
        id: 'themes-references-folder',
        x: 120,
        y: 570,
        text: 'Themes & References',
        content: 'Write your content here...',
        width: 310,
        height: 90,
        type: 'folder',
        parentId: 'story-development'
      },

      // Image node beside the story development
      {
        id: 'cover-image',
        x: 500,
        y: 200,
        text: 'Cover Concept',
        width: 300,
        height: 300,
        type: 'image'
      },

      // Story overview text node under the image
      {
        id: 'story-overview',
        x: 500,
        y: 520,
        text: 'Story Overview',
        content: 'Write your story overview here...',
        width: 300,
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
        to: 'themes-references-folder',
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
  // Characters & Relationships folder template
  'characters-folder': {
    nodes: [
      {
        id: 'characters-list',
        x: 100,
        y: 100,
        text: 'Characters',
        width: 380,
        height: 440,
        type: 'list',
        childIds: ['character-1', 'character-2', 'character-3', 'character-4', 'character-5']
      },
      {
        id: 'character-1',
        x: 120,
        y: 120,
        text: 'Character',
        width: 320,
        height: 72,
        type: 'character',
        parentId: 'characters-list'
      },
      {
        id: 'character-2',
        x: 120,
        y: 202,
        text: 'Character',
        width: 320,
        height: 72,
        type: 'character',
        parentId: 'characters-list'
      },
      {
        id: 'character-3',
        x: 120,
        y: 284,
        text: 'Character',
        width: 320,
        height: 72,
        type: 'character',
        parentId: 'characters-list'
      },
      {
        id: 'character-4',
        x: 120,
        y: 366,
        text: 'Character',
        width: 320,
        height: 72,
        type: 'character',
        parentId: 'characters-list'
      },
      {
        id: 'character-5',
        x: 120,
        y: 448,
        text: 'Character',
        width: 320,
        height: 72,
        type: 'character',
        parentId: 'characters-list'
      }
    ],
    connections: []
  },
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
  'plot-folder': {
    nodes: [
      {
        id: 'image-reference',
        x: 400,
        y: 100,
        text: '',
        width: 300,
        height: 220,
        type: 'image'
      },
      {
        id: 'timeline-folder',
        x: 400,
        y: 340,
        text: 'Timeline',
        width: 300,
        height: 90,
        type: 'folder',
        linkedCanvasId: 'folder-canvas-timeline-folder'
      },
      {
        id: 'themes-motifs',
        x: 100,
        y: 100,
        text: 'Themes / Motifs',
        content: 'Jot recurring imagery, symbols, or foreshadowing ideas.',
        width: 280,
        height: 180,
        type: 'text'
      },
      {
        id: 'conflict-stakes',
        x: 720,
        y: 100,
        text: 'Conflict & Stakes',
        content: 'Track how conflict escalates and what\'s at risk.',
        width: 280,
        height: 180,
        type: 'text'
      },
      {
        id: 'visual-anchor',
        x: 100,
        y: 300,
        text: 'Visual Anchor',
        content: 'Reminder to add/match imagery to scenes.',
        width: 280,
        height: 180,
        type: 'text'
      },
      {
        id: 'checklist-table',
        x: 720,
        y: 300,
        text: 'Checklist',
        width: 280,
        height: 270,
        type: 'table',
        tableData: [
          { col1: 'Unfinished scenes or unresolved beats', col2: '☐' },
          { col1: '', col2: '☐' },
          { col1: '', col2: '☐' },
          { col1: '', col2: '☐' },
          { col1: '', col2: '☐' }
        ]
      },
      {
        id: 'note-1',
        x: 100,
        y: 500,
        text: 'Note',
        content: '',
        width: 280,
        height: 140,
        type: 'text'
      },
      {
        id: 'note-2',
        x: 410,
        y: 450,
        text: 'Note',
        content: '',
        width: 280,
        height: 140,
        type: 'text'
      },
      {
        id: 'note-3',
        x: 720,
        y: 500,
        text: 'Note',
        content: '',
        width: 280,
        height: 140,
        type: 'text'
      }
    ],
    connections: []
  },
  character: {
    nodes: [
      {
        id: 'character-design',
        x: 100,
        y: 100,
        text: 'Character Design',
        width: 300,
        height: 200,
        type: 'image'
      },
      {
        id: 'character-info',
        x: 100,
        y: 320,
        text: '',
        width: 300,
        height: 200,
        type: 'table',
        tableData: [
          { col1: 'Name', col2: '' },
          { col1: 'Age', col2: '' },
          { col1: 'Height', col2: '' },
          { col1: 'Weight', col2: '' },
          { col1: 'Role', col2: '' },
          { col1: 'Occupation', col2: '' },
          { col1: 'Species', col2: '' }
        ]
      },
      {
        id: 'backstory',
        x: 450,
        y: 100,
        text: 'Backstory',
        content: 'What is their history and past?',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'beginning-of-story',
        x: 450,
        y: 290,
        text: 'Beginning of Story',
        content: 'Who are they at the start?',
        width: 280,
        height: 140,
        type: 'text'
      },
      {
        id: 'end-of-story',
        x: 760,
        y: 290,
        text: 'End of Story',
        content: 'Who have they become?',
        width: 280,
        height: 140,
        type: 'text'
      },
      {
        id: 'themes',
        x: 760,
        y: 100,
        text: 'Themes',
        content: 'What themes do they represent?',
        width: 280,
        height: 140,
        type: 'text'
      },
      {
        id: 'motivations',
        x: 450,
        y: 460,
        text: 'Motivations',
        content: 'What drives this character?',
        width: 280,
        height: 140,
        type: 'text'
      },
      {
        id: 'morality',
        x: 760,
        y: 460,
        text: 'Morality',
        content: 'What are their moral principles?',
        width: 280,
        height: 140,
        type: 'text'
      }
    ],
    connections: [
      {
        id: 'arc-connection',
        from: 'beginning-of-story',
        to: 'end-of-story',
        type: 'character-arc'
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