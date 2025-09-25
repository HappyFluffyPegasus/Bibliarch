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
        height: 540,
        type: 'list',
        childIds: ['characters-folder', 'plot-folder', 'world-folder']
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
  'world-folder': {
    nodes: [
      {
        id: 'map-instructions',
        x: 420,
        y: 100,
        text: 'World Map',
        content: 'Upload a map of your world in the image node below',
        width: 380,
        height: 60,
        type: 'text'
      },
      {
        id: 'world-map-image',
        x: 420,
        y: 180,
        text: '',
        width: 380,
        height: 260,
        type: 'image'
      },
      {
        id: 'global-culture',
        x: 100,
        y: 100,
        text: 'Global Culture',
        content: 'What unites or defines cultures across the world?',
        width: 300,
        height: 130,
        type: 'text'
      },
      {
        id: 'geography-climate',
        x: 100,
        y: 250,
        text: 'Geography & Climate',
        content: 'What are the major landforms, climates, and regions?',
        width: 300,
        height: 130,
        type: 'text'
      },
      {
        id: 'technology-magic',
        x: 100,
        y: 400,
        text: 'Technology & Magic',
        content: 'How advanced is the world, and what role does magic/tech play?',
        width: 300,
        height: 130,
        type: 'text'
      },
      {
        id: 'history-origins',
        x: 820,
        y: 100,
        text: 'History & Origins',
        content: 'What major events shaped this world?',
        width: 300,
        height: 130,
        type: 'text'
      },
      {
        id: 'power-structures',
        x: 820,
        y: 250,
        text: 'Power Structures',
        content: 'Who holds authority (political, magical, religious)?',
        width: 300,
        height: 130,
        type: 'text'
      },
      {
        id: 'conflicts-tensions',
        x: 820,
        y: 400,
        text: 'Conflicts & Tensions',
        content: 'What are the big global threats or rivalries?',
        width: 300,
        height: 130,
        type: 'text'
      },
      {
        id: 'religion-beliefs',
        x: 100,
        y: 550,
        text: 'Religion & Belief Systems',
        content: 'What do people believe in, and how does it affect daily life?',
        width: 300,
        height: 130,
        type: 'text'
      },
      {
        id: 'trade-economy',
        x: 420,
        y: 460,
        text: 'Trade & Economy',
        content: 'What fuels prosperity or scarcity across nations?',
        width: 300,
        height: 130,
        type: 'text'
      },
      {
        id: 'languages-communication',
        x: 420,
        y: 610,
        text: 'Languages & Communication',
        content: 'Are there many languages? A common tongue?',
        width: 300,
        height: 130,
        type: 'text'
      },
      {
        id: 'global-travel',
        x: 740,
        y: 460,
        text: 'Global Travel & Connection',
        content: 'How do people move, migrate, or share ideas?',
        width: 300,
        height: 130,
        type: 'text'
      },
      {
        id: 'values-taboos',
        x: 740,
        y: 610,
        text: 'Values & Taboos',
        content: 'What\'s seen as sacred, shameful, or universally important?',
        width: 300,
        height: 130,
        type: 'text'
      },
      {
        id: 'countries-list',
        x: 1140,
        y: 100,
        text: 'Countries',
        width: 380,
        height: 460,
        type: 'list',
        childIds: ['country-1', 'country-2', 'country-3', 'country-4']
      },
      {
        id: 'country-1',
        x: 1160,
        y: 140,
        text: 'Country 1',
        width: 340,
        height: 90,
        type: 'folder',
        parentId: 'countries-list',
        linkedCanvasId: 'folder-canvas-country-1'
      },
      {
        id: 'country-2',
        x: 1160,
        y: 250,
        text: 'Country 2',
        width: 340,
        height: 90,
        type: 'folder',
        parentId: 'countries-list',
        linkedCanvasId: 'folder-canvas-country-2'
      },
      {
        id: 'country-3',
        x: 1160,
        y: 360,
        text: 'Country 3',
        width: 340,
        height: 90,
        type: 'folder',
        parentId: 'countries-list',
        linkedCanvasId: 'folder-canvas-country-3'
      },
      {
        id: 'country-4',
        x: 1160,
        y: 470,
        text: 'Country 4',
        width: 340,
        height: 90,
        type: 'folder',
        parentId: 'countries-list',
        linkedCanvasId: 'folder-canvas-country-4'
      }
    ],
    connections: []
  },
  'country': {
    nodes: [
      {
        id: 'local-culture',
        x: 100,
        y: 100,
        text: 'Local Culture',
        content: 'What defines the country\'s traditions, customs, and norms?',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'country-geography',
        x: 400,
        y: 100,
        text: 'Geography & Climate',
        content: 'What terrain, natural resources, or weather shape life here?',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'country-history',
        x: 700,
        y: 100,
        text: 'History & Origins',
        content: 'How did this country form? What key events shaped it?',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'country-power',
        x: 100,
        y: 280,
        text: 'Power Structures',
        content: 'Who rules? What systems of government, monarchy, or councils exist?',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'country-religion',
        x: 400,
        y: 280,
        text: 'Religion & Beliefs',
        content: 'Are there dominant faiths, cults, or superstitions?',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'country-tech-magic',
        x: 700,
        y: 280,
        text: 'Technology & Magic',
        content: 'What\'s unique about their level of progress or magical practices?',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'country-trade',
        x: 100,
        y: 460,
        text: 'Trade & Economy',
        content: 'What are the main exports/imports? How wealthy is the nation?',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'country-conflicts',
        x: 400,
        y: 460,
        text: 'Conflicts & Tensions',
        content: 'Rivalries, wars, rebellions, or internal strife.',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'country-languages',
        x: 700,
        y: 460,
        text: 'Languages & Dialects',
        content: 'What\'s spoken here? Any regional slang or secret codes?',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'country-values',
        x: 100,
        y: 640,
        text: 'Values & Taboos',
        content: 'What\'s sacred, shameful, or central to identity?',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'major-cities',
        x: 400,
        y: 640,
        text: 'Major Cities',
        content: 'List the most important or notable urban centers.',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'major-politicians',
        x: 700,
        y: 640,
        text: 'Major Politicians / Leaders',
        content: 'Who are the big names shaping politics?',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'military-defense',
        x: 100,
        y: 820,
        text: 'Military & Defense',
        content: 'What\'s their army/navy like? Are they expansionist or defensive?',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'culture-exports',
        x: 400,
        y: 820,
        text: 'Culture Exports',
        content: 'Music, fashion, food, or art they\'re known for abroad.',
        width: 280,
        height: 160,
        type: 'text'
      },
      {
        id: 'everyday-life',
        x: 700,
        y: 820,
        text: 'Everyday Life',
        content: 'What\'s daily living like for common people vs. elites?',
        width: 280,
        height: 160,
        type: 'text'
      }
    ],
    connections: []
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