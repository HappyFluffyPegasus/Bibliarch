# StoryCanvas Interactive Setup Instructions

## Manual Setup Required (Interactive Prompts)

### Step 1: Create Next.js Project

```bash
npx create-next-app@latest storycanvas
```

**Interactive prompts - Choose:**
- Would you like to use TypeScript? → **Yes**
- Would you like to use ESLint? → **Yes**
- Would you like to use Tailwind CSS? → **Yes**
- Would you like your code inside a `src/` directory? → **Yes**
- Would you like to use App Router? → **Yes**
- Would you like to use Turbopack? → **No**
- Would you like to customize the import alias? → **No**

```bash
cd storycanvas
```

### Step 2: Initialize shadcn/ui

```bash
npx shadcn@latest init
```

**Interactive prompts - Choose:**
- Which style would you like to use? → **New York**
- Which color would you like to use as the base color? → **Neutral**
- Would you like to use CSS variables for theming? → **Yes**

---

## That's It!

After completing these two interactive setups, I will handle:
- Installing all other dependencies
- Adding shadcn components
- Creating project structure
- Setting up environment files
- Configuring Supabase

Just run the two commands above with the specified options, then I can take over as an agent.