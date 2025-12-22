# Bibliarch MVP Documentation

## Documents

| File | Description |
|------|-------------|
| [01-vision.md](./01-vision.md) | Core concept, philosophy, features, target audience |
| [02-phases.md](./02-phases.md) | Implementation phases and task breakdown |
| [03-technical-decisions.md](./03-technical-decisions.md) | Tech stack, architecture, and key decisions |
| [04-data-models.md](./04-data-models.md) | TypeScript interfaces and data structures |

## Quick Links

### Vision
- Three gameplay modes: Life, Story (manual), AI Story
- AI assists but NEVER dictates story decisions
- Free-form text boxes instead of presets
- Character evolution via timeline states

### Tabs (in implementation order)
1. **Notes** - Bibliarch canvas (copied from website)
2. **Characters** - 3D character creator (copied from Character Creator)
3. **Timeline** - Dedicated timeline editor (NEW)
4. **World** - 3D world builder with terraforming (NEW)
5. **Scenes** - 3D scene editor with playback (NEW)

### Tech Stack
- Next.js 15 + React 19 + TypeScript
- Three.js + React Three Fiber
- Tailwind CSS + shadcn/ui
- Zustand with localStorage persistence

### Key Decisions
- Separate project (don't touch existing code)
- Copy code in, don't share via packages
- localStorage for MVP, Supabase later
- No AI implementation yet (just placeholders)
- Primitive 3D shapes for buildings (user provides assets later)

---

*Last updated: December 2024*
