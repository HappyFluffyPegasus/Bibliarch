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
        x: 350,
        y: 50,
        text: 'Story Concept',
        content: 'What is your story about? Write a 2-3 sentence summary of your main idea. This will be your North Star as you develop everything else.\n\nExample: "A young wizard discovers they\'re the key to stopping an ancient evil, but using their power means sacrificing their humanity. They must choose between saving the world and staying true to themselves."',
        width: 320,
        height: 140,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'characters-folder',
        x: 150,
        y: 250,
        text: 'Characters',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'characters-canvas'
      },
      {
        id: 'plot-folder',
        x: 420,
        y: 250,
        text: 'Plot Structure',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'plot-canvas'
      },
      {
        id: 'world-folder',
        x: 690,
        y: 250,
        text: 'World & Setting',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'world-canvas'
      },
      {
        id: 'themes',
        x: 150,
        y: 420,
        text: 'Themes & Messages',
        content: 'What deeper meanings do you want to explore? What questions does your story ask?\n\n• What does your story say about human nature?\n• What moral or philosophical questions arise?\n• What emotions do you want readers to feel?\n• What will readers think about after finishing?',
        width: 240,
        height: 160,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'tone-style',
        x: 420,
        y: 420,
        text: 'Tone & Style',
        content: 'How should your story feel to readers?\n\n• Tone: Dark? Hopeful? Mysterious? Humorous?\n• Pacing: Fast-paced action? Slow contemplative?\n• Voice: First person? Third person? Present? Past?\n• Style: Simple? Descriptive? Dialogue-heavy?',
        width: 240,
        height: 160,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'inspiration',
        x: 690,
        y: 420,
        text: 'Inspiration & References',
        content: 'What inspired this story? Keep track of your influences:\n\n• Books, movies, shows that inspired you\n• Real events or people that sparked ideas\n• Themes or concepts you want to explore\n• Visual inspiration (add images later!)',
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
            content: 'Who else populates your story world?\n\n• Allies and friends of the protagonist\n• Mentors or guides\n• Love interests\n• Family members\n• Minor characters with important roles\n\nFor each, consider: What role do they serve in the protagonist\'s journey?',
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
            content: 'What event kicks off your story and disrupts your protagonist\'s normal life?\n\nThis should:\n• Happen early (within first 10-15% of story)\n• Force the protagonist to take action\n• Set the main conflict in motion\n• Be directly connected to the climax',
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
            content: 'What challenges and obstacles does your protagonist face?\n\nKey events that:\n• Increase tension and stakes\n• Reveal character depth\n• Develop relationships\n• Build toward the climax\n• Test the protagonist\'s resolve',
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
            content: 'What major revelation or event changes everything?\n\nThis should:\n• Occur around the middle of your story\n• Shift the protagonist\'s understanding\n• Raise the stakes significantly\n• Change the direction of the plot\n• Often reveals false assumptions',
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
            content: 'What is the final confrontation or moment of highest tension?\n\nThis is where:\n• The protagonist faces their greatest challenge\n• The main conflict reaches its peak\n• Everything you\'ve built leads to this moment\n• The protagonist must use everything they\'ve learned',
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
            content: 'How does everything wrap up?\n\nShow:\n• How the conflict is resolved\n• What the protagonist has learned\n• How the world has changed\n• What happens to major characters\n• The new normal after the journey',
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
            content: 'Where does most of your story take place?\n\n• Physical location and description\n• Time period (past, present, future)\n• Cultural and social environment\n• What makes this place unique?\n• How does the setting affect the characters?',
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
            content: 'What are the rules that govern your story world?\n\n• Physical laws (realistic or fantastical?)\n• Social structures and hierarchies\n• Economic systems\n• Political systems\n• Magic or technology rules (if applicable)',
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
            content: 'What happened before your story begins?\n\n• Important historical events\n• How the current world came to be\n• Past conflicts or changes\n• Family histories\n• Cultural traditions and beliefs',
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
            content: 'What other important places appear in your story?\n\n• Where does the protagonist live?\n• Where do important events happen?\n• Places that reveal character or advance plot\n• Locations that create atmosphere or mood\n• Symbolic or meaningful places',
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
            content: 'How should your world feel to readers?\n\n• Overall tone: dark, bright, mysterious, cozy?\n• Sensory details: sounds, smells, textures\n• Weather and seasons\n• Colors and visual imagery\n• Emotional resonance of places',
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
  },
  {
    id: 'novel',
    name: 'Novel Template',
    description: 'Comprehensive structure for novel writing with detailed character arcs, plot development, and chapter organization',
    category: 'intermediate',
    features: ['Detailed character development', 'Chapter-by-chapter planning', 'Advanced plot structure', 'Theme integration', 'Research organization'],
    estimatedTime: '4-8 hours to complete',
    nodes: [
      {
        id: 'premise',
        x: 400,
        y: 30,
        text: 'Novel Premise',
        content: 'What is your novel about in one powerful paragraph?\n\nYour premise should include:\n• Who is your protagonist?\n• What do they want?\n• What stands in their way?\n• What\'s at stake if they fail?\n\nExample: "When a reluctant dragon trainer discovers her village\'s dark secret about dragon extinction, she must choose between exposing the truth and losing everything she loves, or staying silent and watching her bond with the last dragon slowly kill them both."',
        width: 320,
        height: 160,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'characters-folder',
        x: 100,
        y: 250,
        text: 'Character Development',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'novel-characters-canvas'
      },
      {
        id: 'plot-folder',
        x: 370,
        y: 250,
        text: 'Plot Architecture',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'novel-plot-canvas'
      },
      {
        id: 'world-folder',
        x: 640,
        y: 250,
        text: 'World & Setting',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'novel-world-canvas'
      },
      {
        id: 'chapters-folder',
        x: 910,
        y: 250,
        text: 'Chapter Planning',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'chapters-canvas'
      },
      {
        id: 'themes-analysis',
        x: 100,
        y: 420,
        text: 'Themes & Symbolism',
        content: 'What deeper meanings will enrich your novel?\n\n• Central theme: What\'s your main message?\n• Sub-themes: What other ideas support this?\n• Symbolic elements: Objects, colors, or motifs that represent deeper meaning\n• Character growth themes: How do characters embody your themes?\n• Social/cultural commentary: What does your story say about the world?',
        width: 240,
        height: 160,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'voice-style',
        x: 370,
        y: 420,
        text: 'Voice & Style Guide',
        content: 'How will you tell this story?\n\n• Narrative voice: First person? Third person? Multiple POVs?\n• Tense: Past or present?\n• Tone: Serious, humorous, dark, hopeful?\n• Style: Literary, commercial, genre-specific?\n• Chapter length and pacing preferences\n• Any unique narrative techniques you want to use?',
        width: 240,
        height: 160,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'research-bible',
        x: 640,
        y: 420,
        text: 'Research & References',
        content: 'Everything you need to know for authenticity:\n\n• Historical facts or time period details\n• Technical knowledge for your setting\n• Cultural research for diverse characters\n• Real locations that inspire your settings\n• Expert contacts or resources\n• Books, articles, documentaries for reference',
        width: 240,
        height: 160,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'market-audience',
        x: 910,
        y: 420,
        text: 'Audience & Market',
        content: 'Who will read your novel?\n\n• Target age group: YA, Adult, Middle Grade?\n• Genre: Literary fiction, romance, fantasy, thriller?\n• Comparable titles: What published books are similar?\n• Word count goal: Typical for your genre\n• Reader expectations: What do fans of this genre want?\n• Unique selling points: What makes your novel special?',
        width: 240,
        height: 160,
        type: 'text',
        color: '#f8fafc'
      }
    ],
    connections: [
      {
        id: 'premise-to-characters',
        from: 'premise',
        to: 'characters-folder',
        type: 'leads-to'
      },
      {
        id: 'premise-to-plot',
        from: 'premise',
        to: 'plot-folder',
        type: 'leads-to'
      },
      {
        id: 'premise-to-world',
        from: 'premise',
        to: 'world-folder',
        type: 'leads-to'
      },
      {
        id: 'plot-to-chapters',
        from: 'plot-folder',
        to: 'chapters-folder',
        type: 'leads-to'
      },
      {
        id: 'themes-to-characters',
        from: 'themes-analysis',
        to: 'characters-folder',
        type: 'relates-to'
      },
      {
        id: 'research-to-world',
        from: 'research-bible',
        to: 'world-folder',
        type: 'relates-to'
      }
    ],
    subCanvases: {
      'novel-characters-canvas': {
        nodes: [
          {
            id: 'protagonist',
            x: 100,
            y: 100,
            text: 'Main Character',
            type: 'character',
            color: '#f8fafc',
            width: 220,
            height: 140,
            attributes: {
              role: 'Protagonist',
              motivation: 'What does your protagonist want more than anything? What drives every decision they make?',
              traits: ['Determined', 'Flawed', 'Relatable', 'Growing'],
              goals: ['Primary goal', 'Secondary objectives', 'Hidden desires'],
              fears: ['Greatest fear', 'What could destroy them', 'Internal doubts'],
              description: 'Your novel\'s central character who readers will follow through the entire journey',
              appearance: 'Physical description: height, build, distinctive features, style',
              backstory: 'Childhood, formative experiences, key relationships, defining moments',
              relationships: [
                { characterName: 'Love Interest', relationshipType: 'romantic', description: 'Developing romantic connection' },
                { characterName: 'Mentor/Guide', relationshipType: 'mentor', description: 'Learning from wise guide' }
              ],
              arc: 'Character transformation: who they start as vs. who they become',
              characterTemplate: 'protagonist',
              age: ''
            }
          },
          {
            id: 'love-interest',
            x: 400,
            y: 100,
            text: 'Love Interest',
            type: 'character',
            color: '#f8fafc',
            width: 220,
            height: 140,
            attributes: {
              role: 'Love Interest',
              motivation: 'Their own goals beyond just romance - what do they want in life?',
              traits: ['Attractive', 'Independent', 'Complementary to protagonist'],
              goals: ['Personal ambitions', 'Relationship goals', 'Career/life objectives'],
              fears: ['Heartbreak', 'Loss of independence', 'Not being good enough'],
              description: 'A fully-developed character who enhances the protagonist\'s journey',
              appearance: 'What draws the protagonist to them? Physical and stylistic details',
              backstory: 'Their history, past relationships, what shaped their worldview',
              relationships: [
                { characterName: 'Main Character', relationshipType: 'romantic', description: 'Developing romantic connection' }
              ],
              arc: 'How does the relationship change both characters?',
              characterTemplate: 'love-interest',
              age: ''
            }
          },
          {
            id: 'mentor-figure',
            x: 250,
            y: 280,
            text: 'Mentor/Guide',
            type: 'character',
            color: '#f8fafc',
            width: 220,
            height: 140,
            attributes: {
              role: 'Mentor',
              motivation: 'To guide and prepare the protagonist, often driven by past failure or duty',
              traits: ['Wise', 'Patient', 'Experienced', 'Sometimes flawed'],
              goals: ['Teach important lessons', 'Protect the protagonist', 'Redeem past mistakes'],
              fears: ['Student failing', 'History repeating', 'Being too late to help'],
              description: 'The wise guide who provides crucial wisdom at key moments',
              appearance: 'Often older with kind but knowing eyes, carries weight of experience',
              backstory: 'Their own hero\'s journey, what they learned, why they now teach',
              relationships: [
                { characterName: 'Main Character', relationshipType: 'mentor', description: 'Teacher and guide relationship' }
              ],
              arc: 'Often must let go and trust the protagonist to succeed alone',
              characterTemplate: 'mentor',
              age: ''
            }
          },
          {
            id: 'antagonist',
            x: 550,
            y: 100,
            text: 'Antagonist',
            type: 'character',
            color: '#f8fafc',
            width: 220,
            height: 140,
            attributes: {
              role: 'Antagonist',
              motivation: 'Complex goals that oppose the protagonist - they believe they are right',
              traits: ['Intelligent', 'Charismatic', 'Ruthless when necessary', 'Self-justified'],
              goals: ['Achieve their vision', 'Stop the protagonist', 'Prove their worldview correct'],
              fears: ['Being proven wrong', 'Losing everything they\'ve built', 'Their dark past exposed'],
              description: 'A complex villain with understandable motivations and believable methods',
              appearance: 'Commanding presence, perhaps deceptively charming or intimidating',
              backstory: 'What experiences convinced them their way is the only way?',
              relationships: [
                { characterName: 'Main Character', relationshipType: 'enemy', description: 'Central opposition and conflict' }
              ],
              arc: 'Escalating conflict until final confrontation - defeat, redemption, or victory?',
              characterTemplate: 'antagonist',
              age: ''
            }
          }
        ],
        connections: [
          {
            id: 'protagonist-love-interest',
            from: 'protagonist',
            to: 'love-interest',
            type: 'romantic'
          },
          {
            id: 'mentor-protagonist',
            from: 'mentor-figure',
            to: 'protagonist',
            type: 'mentor'
          },
          {
            id: 'protagonist-antagonist-conflict',
            from: 'protagonist',
            to: 'antagonist',
            type: 'conflicts-with'
          }
        ]
      }
    }
  },
  {
    id: 'screenplay',
    name: 'Screenplay',
    description: 'Professional film/TV script structure with industry-standard formatting and story beats',
    category: 'intermediate',
    features: ['Three-act structure', 'Professional formatting', 'Character arcs', 'Scene planning', 'Industry guidelines'],
    estimatedTime: '3-6 hours to complete',
    nodes: [
      {
        id: 'logline',
        x: 390,
        y: 50,
        text: 'Logline',
        content: 'Write your one-sentence story pitch. What is your movie about in 25 words or less?',
        width: 320,
        height: 100,
        type: 'text',
        color: '#f8fafc'
      },
      {
        id: 'characters-folder',
        x: 100,
        y: 200,
        text: 'Characters',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'screenplay-characters-canvas'
      },
      {
        id: 'acts-folder',
        x: 390,
        y: 200,
        text: 'Three Acts',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'acts-canvas'
      },
      {
        id: 'scenes-folder',
        x: 680,
        y: 200,
        text: 'Scenes',
        width: 240,
        height: 120,
        type: 'folder',
        color: '#f8fafc',
        linkedCanvasId: 'scenes-canvas'
      },
      {
        id: 'locations',
        x: 245,
        y: 370,
        text: 'Locations',
        content: 'Describe the key locations in your screenplay. What makes each setting important to the story?',
        width: 240,
        height: 120,
        type: 'location',
        color: '#f8fafc'
      },
      {
        id: 'dialogue-beats',
        x: 535,
        y: 370,
        text: 'Dialogue Beats',
        content: 'Key dialogue moments, memorable quotes, and character voice notes that define your screenplay.',
        width: 240,
        height: 120,
        type: 'text',
        color: '#f8fafc'
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
    ],
    subCanvases: {
      'screenplay-characters-canvas': {
        nodes: [
          {
            id: 'hero',
            x: 100,
            y: 100,
            text: 'Hero/Protagonist',
            type: 'character',
            color: '#f8fafc',
            width: 220,
            height: 140,
            attributes: {
              role: 'Protagonist',
              motivation: 'Clear, visual goal that drives the screenplay - what do they want to achieve?',
              traits: ['Active', 'Decisive', 'Visually interesting', 'Relatable'],
              goals: ['External goal (plot)', 'Internal goal (character arc)', 'Relationship goal'],
              fears: ['Failure', 'Loss', 'Being exposed'],
              description: 'The active protagonist who drives the visual story forward',
              appearance: 'Castable, distinctive look - how will they appear on screen?',
              backstory: 'Concise but important - what shaped them into who they are now?',
              relationships: [
                { characterName: 'Antagonist', relationshipType: 'enemy', description: 'Central conflict of the screenplay' }
              ],
              arc: 'Clear transformation visible in actions and choices',
              characterTemplate: 'protagonist',
              age: ''
            }
          },
          {
            id: 'villain',
            x: 400,
            y: 100,
            text: 'Antagonist',
            type: 'character',
            color: '#f8fafc',
            width: 220,
            height: 140,
            attributes: {
              role: 'Antagonist',
              motivation: 'Clear opposing goal that creates visual conflict with hero',
              traits: ['Powerful', 'Threatening', 'Intelligent', 'Visually striking'],
              goals: ['Defeat the hero', 'Achieve their plan', 'Maintain power'],
              fears: ['Losing control', 'Being defeated', 'Past trauma'],
              description: 'Compelling opposition that creates strong visual and dramatic conflict',
              appearance: 'Memorable, perhaps intimidating - how will they dominate scenes?',
              backstory: 'What turned them into the antagonist? Keep it concise but powerful',
              relationships: [
                { characterName: 'Hero/Protagonist', relationshipType: 'enemy', description: 'Central conflict of the screenplay' }
              ],
              arc: 'Escalating threat until final confrontation',
              characterTemplate: 'antagonist',
              age: ''
            }
          },
          {
            id: 'love-interest',
            x: 250,
            y: 280,
            text: 'Love Interest',
            type: 'character',
            color: '#f8fafc',
            width: 220,
            height: 140,
            attributes: {
              role: 'Love Interest',
              motivation: 'Their own compelling goals that create romantic tension',
              traits: ['Attractive', 'Strong-willed', 'Independent', 'Screen presence'],
              goals: ['Personal mission', 'Career ambitions', 'Family obligations'],
              fears: ['Vulnerability', 'Losing independence', 'Being hurt again'],
              description: 'More than just romance - a character with their own story arc',
              appearance: 'Visually appealing and distinctive - how do they look on screen?',
              backstory: 'What makes them right for the hero? What creates initial conflict?',
              relationships: [
                { characterName: 'Hero/Protagonist', relationshipType: 'romantic', description: 'Romantic subplot that enhances main story' }
              ],
              arc: 'Growth through relationship while maintaining independence',
              characterTemplate: 'love-interest',
              age: ''
            }
          }
        ],
        connections: [
          {
            id: 'hero-villain-conflict',
            from: 'hero',
            to: 'villain',
            type: 'conflicts-with'
          },
          {
            id: 'hero-love-interest',
            from: 'hero',
            to: 'love-interest',
            type: 'romantic'
          }
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
  'novel-characters-canvas': {
    nodes: [
      {
        id: 'protagonist',
        x: 100,
        y: 100,
        text: 'Main Character',
        type: 'character',
        color: '#f8fafc',
        width: 220,
        height: 140,
        attributes: {
          role: 'Protagonist',
          motivation: 'What does your protagonist want more than anything? What drives every decision they make?',
          traits: ['Determined', 'Flawed', 'Relatable', 'Growing'],
          goals: ['Primary goal', 'Secondary objectives', 'Hidden desires'],
          fears: ['Greatest fear', 'What could destroy them', 'Internal doubts'],
          description: 'Your novel\'s central character who readers will follow through the entire journey',
          appearance: 'Physical description: height, build, distinctive features, style',
          backstory: 'Childhood, formative experiences, key relationships, defining moments',
          relationships: [
            { characterName: 'Love Interest', relationshipType: 'romantic', description: 'Developing romantic connection' },
            { characterName: 'Mentor/Guide', relationshipType: 'mentor', description: 'Learning from wise guide' },
            { characterName: 'Antagonist', relationshipType: 'enemy', description: 'Central opposition and conflict' }
          ],
          arc: 'Character transformation: who they start as vs. who they become',
          characterTemplate: 'protagonist',
          age: ''
        }
      },
      {
        id: 'love-interest',
        x: 400,
        y: 100,
        text: 'Love Interest',
        type: 'character',
        color: '#f8fafc',
        width: 220,
        height: 140,
        attributes: {
          role: 'Love Interest',
          motivation: 'Their own goals beyond just romance - what do they want in life?',
          traits: ['Attractive', 'Independent', 'Complementary to protagonist'],
          goals: ['Personal ambitions', 'Relationship goals', 'Career/life objectives'],
          fears: ['Heartbreak', 'Loss of independence', 'Not being good enough'],
          description: 'A fully-developed character who enhances the protagonist\'s journey',
          appearance: 'What draws the protagonist to them? Physical and stylistic details',
          backstory: 'Their history, past relationships, what shaped their worldview',
          relationships: [
            { characterName: 'Main Character', relationshipType: 'romantic', description: 'Developing romantic connection' }
          ],
          arc: 'How does the relationship change both characters?',
          characterTemplate: 'love-interest',
          age: ''
        }
      },
      {
        id: 'mentor-figure',
        x: 250,
        y: 280,
        text: 'Mentor/Guide',
        type: 'character',
        color: '#f8fafc',
        width: 220,
        height: 140,
        attributes: {
          role: 'Mentor',
          motivation: 'To guide and prepare the protagonist, often driven by past failure or duty',
          traits: ['Wise', 'Patient', 'Experienced', 'Sometimes flawed'],
          goals: ['Teach important lessons', 'Protect the protagonist', 'Redeem past mistakes'],
          fears: ['Student failing', 'History repeating', 'Being too late to help'],
          description: 'The wise guide who provides crucial wisdom at key moments',
          appearance: 'Often older with kind but knowing eyes, carries weight of experience',
          backstory: 'Their own hero\'s journey, what they learned, why they now teach',
          relationships: [
            { characterName: 'Main Character', relationshipType: 'mentor', description: 'Teacher and guide relationship' }
          ],
          arc: 'Often must let go and trust the protagonist to succeed alone',
          characterTemplate: 'mentor',
          age: ''
        }
      },
      {
        id: 'antagonist',
        x: 550,
        y: 100,
        text: 'Antagonist',
        type: 'character',
        color: '#f8fafc',
        width: 220,
        height: 140,
        attributes: {
          role: 'Antagonist',
          motivation: 'Complex goals that oppose the protagonist - they believe they are right',
          traits: ['Intelligent', 'Charismatic', 'Ruthless when necessary', 'Self-justified'],
          goals: ['Achieve their vision', 'Stop the protagonist', 'Prove their worldview correct'],
          fears: ['Being proven wrong', 'Losing everything they\'ve built', 'Their dark past exposed'],
          description: 'A complex villain with understandable motivations and believable methods',
          appearance: 'Commanding presence, perhaps deceptively charming or intimidating',
          backstory: 'What experiences convinced them their way is the only way?',
          relationships: [
            { characterName: 'Main Character', relationshipType: 'enemy', description: 'Central opposition and conflict' }
          ],
          arc: 'Escalating conflict until final confrontation - defeat, redemption, or victory?',
          characterTemplate: 'antagonist',
          age: ''
        }
      }
    ],
    connections: [
      {
        id: 'protagonist-love-interest',
        from: 'protagonist',
        to: 'love-interest', 
        type: 'romantic'
      },
      {
        id: 'mentor-protagonist',
        from: 'mentor-figure',
        to: 'protagonist',
        type: 'mentor'
      },
      {
        id: 'protagonist-antagonist-conflict',
        from: 'protagonist',
        to: 'antagonist',
        type: 'conflicts-with'
      }
    ]
  },
  'screenplay-characters-canvas': {
    nodes: [
      {
        id: 'hero',
        x: 100,
        y: 100,
        text: 'Hero/Protagonist',
        type: 'character',
        color: '#f8fafc',
        width: 220,
        height: 140,
        attributes: {
          role: 'Protagonist',
          motivation: 'Clear, visual goal that drives the screenplay - what do they want to achieve?',
          traits: ['Active', 'Decisive', 'Visually interesting', 'Relatable'],
          goals: ['External goal (plot)', 'Internal goal (character arc)', 'Relationship goal'],
          fears: ['Failure', 'Loss', 'Being exposed'],
          description: 'The active protagonist who drives the visual story forward',
          appearance: 'Castable, distinctive look - how will they appear on screen?',
          backstory: 'Concise but important - what shaped them into who they are now?',
          relationships: [
            { characterName: 'Antagonist', relationshipType: 'enemy', description: 'Central conflict of the screenplay' },
            { characterName: 'Love Interest', relationshipType: 'romantic', description: 'Romantic subplot that enhances main story' }
          ],
          arc: 'Clear transformation visible in actions and choices',
          characterTemplate: 'protagonist',
          age: ''
        }
      },
      {
        id: 'villain',
        x: 400,
        y: 100,
        text: 'Antagonist',
        type: 'character',
        color: '#f8fafc',
        width: 220,
        height: 140,
        attributes: {
          role: 'Antagonist',
          motivation: 'Clear opposing goal that creates visual conflict with hero',
          traits: ['Powerful', 'Threatening', 'Intelligent', 'Visually striking'],
          goals: ['Defeat the hero', 'Achieve their plan', 'Maintain power'],
          fears: ['Losing control', 'Being defeated', 'Past trauma'],
          description: 'Compelling opposition that creates strong visual and dramatic conflict',
          appearance: 'Memorable, perhaps intimidating - how will they dominate scenes?',
          backstory: 'What turned them into the antagonist? Keep it concise but powerful',
          relationships: [
            { characterName: 'Hero/Protagonist', relationshipType: 'enemy', description: 'Central conflict of the screenplay' }
          ],
          arc: 'Escalating threat until final confrontation',
          characterTemplate: 'antagonist',
          age: ''
        }
      },
      {
        id: 'love-interest',
        x: 250,
        y: 280,
        text: 'Love Interest',
        type: 'character',
        color: '#f8fafc',
        width: 220,
        height: 140,
        attributes: {
          role: 'Love Interest',
          motivation: 'Their own compelling goals that create romantic tension',
          traits: ['Attractive', 'Strong-willed', 'Independent', 'Screen presence'],
          goals: ['Personal mission', 'Career ambitions', 'Family obligations'],
          fears: ['Vulnerability', 'Losing independence', 'Being hurt again'],
          description: 'More than just romance - a character with their own story arc',
          appearance: 'Visually appealing and distinctive - how do they look on screen?',
          backstory: 'What makes them right for the hero? What creates initial conflict?',
          relationships: [
            { characterName: 'Hero/Protagonist', relationshipType: 'romantic', description: 'Romantic subplot that enhances main story' }
          ],
          arc: 'Growth through relationship while maintaining independence',
          characterTemplate: 'love-interest',
          age: ''
        }
      }
    ],
    connections: [
      {
        id: 'hero-villain-conflict',
        from: 'hero',
        to: 'villain',
        type: 'conflicts-with'
      },
      {
        id: 'hero-love-interest',
        from: 'hero',
        to: 'love-interest',
        type: 'romantic'
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
        content: 'Age, appearance, background, occupation, family...',
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
        content: 'How does this character think, feel, and act? What makes them unique?',
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
        content: 'What does this character want? What drives them forward?',
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
        content: 'How does this character relate to others? Friends, enemies, family...',
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
        content: 'How will this character change throughout the story?',
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
        content: 'What does this place look like? Size, layout, key features...',
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
        content: 'What feeling does this place evoke? Cozy, threatening, mysterious...',
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
        content: 'Why is this location important to your story? What happens here?',
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
        content: 'What happened here in the past? Who built it and why?',
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