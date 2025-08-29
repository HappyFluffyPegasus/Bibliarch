// Story templates - static, pre-defined structures

export interface StoryTemplate {
  id: string
  name: string
  description: string
  nodes: any[]
  connections: any[]
}

export const storyTemplates: StoryTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start with an empty canvas',
    nodes: [],
    connections: []
  },
  {
    id: 'basic',
    name: 'Basic Story Structure',
    description: 'Characters, Plot, and World sections',
    nodes: [
      {
        id: 'characters-folder',
        x: 100,
        y: 100,
        text: 'Characters',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#fef3c7',
        linkedCanvasId: 'characters-canvas'
      },
      {
        id: 'plot-folder',
        x: 400,
        y: 100,
        text: 'Plot',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#fce7f3',
        linkedCanvasId: 'plot-canvas'
      },
      {
        id: 'world-folder',
        x: 700,
        y: 100,
        text: 'World',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#e0e7ff',
        linkedCanvasId: 'world-canvas'
      },
      {
        id: 'notes',
        x: 400,
        y: 300,
        text: 'General Notes',
        width: 240,
        height: 100,
        type: 'text',
        color: '#ffffff'
      }
    ],
    connections: []
  },
  {
    id: 'novel',
    name: 'Novel Template',
    description: 'Complete structure for novel writing',
    nodes: [
      {
        id: 'characters-folder',
        x: 50,
        y: 50,
        text: 'Characters',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#fef3c7',
        linkedCanvasId: 'characters-canvas'
      },
      {
        id: 'world-folder',
        x: 320,
        y: 50,
        text: 'Worldbuilding',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#e0e7ff',
        linkedCanvasId: 'world-canvas'
      },
      {
        id: 'plot-folder',
        x: 590,
        y: 50,
        text: 'Plot Structure',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#fce7f3',
        linkedCanvasId: 'plot-canvas'
      },
      {
        id: 'chapters-folder',
        x: 860,
        y: 50,
        text: 'Chapters',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#d4d4d8',
        linkedCanvasId: 'chapters-canvas'
      },
      {
        id: 'themes',
        x: 185,
        y: 220,
        text: 'Themes & Motifs',
        width: 240,
        height: 100,
        type: 'text',
        color: '#ffffff'
      },
      {
        id: 'timeline',
        x: 455,
        y: 220,
        text: 'Timeline',
        width: 240,
        height: 100,
        type: 'event',
        color: '#fce7f3'
      },
      {
        id: 'mood-board',
        x: 725,
        y: 220,
        text: 'Mood Board',
        width: 240,
        height: 100,
        type: 'text',
        color: '#ffffff'
      },
      {
        id: 'research',
        x: 320,
        y: 360,
        text: 'Research Notes',
        width: 240,
        height: 100,
        type: 'text',
        color: '#ffffff'
      },
      {
        id: 'dialogue',
        x: 590,
        y: 360,
        text: 'Dialogue & Quotes',
        width: 240,
        height: 100,
        type: 'text',
        color: '#ffffff'
      }
    ],
    connections: [
      {
        id: 'conn-1',
        from: 'characters-folder',
        to: 'plot-folder',
        type: 'leads-to'
      },
      {
        id: 'conn-2',
        from: 'world-folder',
        to: 'plot-folder',
        type: 'leads-to'
      }
    ]
  },
  {
    id: 'screenplay',
    name: 'Screenplay',
    description: 'Film or TV script structure',
    nodes: [
      {
        id: 'logline',
        x: 400,
        y: 50,
        text: 'Logline',
        width: 300,
        height: 80,
        type: 'text',
        color: '#ffffff'
      },
      {
        id: 'characters-folder',
        x: 100,
        y: 180,
        text: 'Characters',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#fef3c7',
        linkedCanvasId: 'characters-canvas'
      },
      {
        id: 'acts-folder',
        x: 400,
        y: 180,
        text: 'Three Acts',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#fce7f3',
        linkedCanvasId: 'acts-canvas'
      },
      {
        id: 'scenes-folder',
        x: 700,
        y: 180,
        text: 'Scenes',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#d4d4d8',
        linkedCanvasId: 'scenes-canvas'
      },
      {
        id: 'locations',
        x: 250,
        y: 350,
        text: 'Locations',
        width: 240,
        height: 100,
        type: 'location',
        color: '#e0e7ff'
      },
      {
        id: 'dialogue-beats',
        x: 550,
        y: 350,
        text: 'Dialogue Beats',
        width: 240,
        height: 100,
        type: 'text',
        color: '#ffffff'
      }
    ],
    connections: [
      {
        id: 'conn-1',
        from: 'logline',
        to: 'acts-folder',
        type: 'leads-to'
      },
      {
        id: 'conn-2',
        from: 'acts-folder',
        to: 'scenes-folder',
        type: 'leads-to'
      }
    ]
  }
]