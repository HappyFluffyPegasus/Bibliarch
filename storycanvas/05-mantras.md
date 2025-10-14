# NeighborNotes MVP Implementation Mantras

## 🎯 THE PRIME DIRECTIVE
**SHIP THE MVP. NOTHING MORE.**

This is not Google Docs. This is not Notion. This is not production software for enterprise.  
This is an MVP to test if writers want visual story tools with AI characters.  
Every decision must pass the test: "Does this help us validate the core concept?"

---

## ⚡ Core Mantras

### 1. 🚫 NO FEATURE CREEP
```
IF feature NOT in spec THEN skip()
IF user asks for more THEN say("Phase 2")  
IF tempted to add THEN resist()
```

**Examples of what NOT to add:**
- Collaboration features
- Email notifications  
- Password reset flow (use Supabase magic links)
- Advanced permissions
- Export to PDF
- Keyboard shortcuts beyond basics
- Undo/redo beyond one level
- Version history
- Comments on nodes
- Real-time sync
- Mobile responsiveness (desktop only)
- Accessibility beyond basics
- Internationalization
- SEO optimization
- Social sharing

### 2. 💀 KILL COMPLEXITY
```
IF solution.steps > 3 THEN simplify()
IF dependency.size > 100kb THEN reconsider()
IF implementation.time > 2 days THEN cut_scope()
```

**Choose simple over clever:**
- JSONB over normalized schemas
- Polling over WebSockets
- Refresh over complex state sync
- Page reload over complex cache invalidation
- Modal over drawer
- Button over gesture
- Explicit save over auto-merge conflicts

### 3. ✅ WORKING > PERFECT
```
IF works(80%) AND time_saved(5 hours) THEN ship()
IF perfection_cost > mvp_value THEN skip()
IF users_complain LATER THEN fix_in_v2()
```

**Accept these imperfections:**
- Occasional layout jumps
- Save takes 1-2 seconds
- Canvas rerenders fully sometimes
- Import might fail on edge cases
- AI occasionally says something generic
- Some animations are choppy
- Dark mode might miss some elements

### 4. 🏃 SPEED IS FEATURE #1
```
WHILE building DO prioritize(speed)
IF optimization.time > 4 hours THEN defer()
IF performance "good enough" THEN continue()
```

**Time boxing rules:**
- 2 hours max per component
- 4 hours max per feature
- 1 day max per section
- No rabbit holes
- No perfect architecture
- No premature optimization

---

## 🛠️ Technical Mantras

### 5. 📦 USE WHAT EXISTS
```
IF library.exists AND library.works THEN use()
IF needs_custom AND time > 4 hours THEN find_alternative()
NEVER write_from_scratch UNLESS no_choice()
```

**Specific choices:**
- Use Konva's defaults, don't customize deeply
- Use Tailwind's colors, don't create palette
- Use shadcn components as-is
- Use Supabase auth without customization
- Use OpenAI's defaults for AI

### 6. 🗑️ CRUD IS ENOUGH
```
operations = [Create, Read, Update, Delete]
IF operation NOT IN operations THEN skip()
IF fancy_sync_needed THEN use_refresh()
```

**Keep it basic:**
- Create story → Save to DB
- Read story → Load from DB
- Update story → Overwrite in DB
- Delete story → Remove from DB
- No soft deletes
- No change tracking
- No merge algorithms

### 7. 🎨 STYLE LATER
```
IF ui.functional THEN stop()
IF css.time > 30 minutes THEN use_defaults()
IF animation.complex THEN remove()
```

**Styling priorities:**
1. Does it work? ✓ Ship
2. Is it readable? ✓ Ship
3. Is it pretty? → Phase 2

**Use:**
- Tailwind defaults
- System fonts
- Basic shadows
- Standard animations
- Default transitions

### 8. 🔒 SECURITY MINIMUM
```
secure_enough = {
  auth: true,
  sql_injection: prevented,
  xss: sanitized,
  rate_limiting: basic
}
IF secure_enough THEN continue()
```

**Security checklist:**
- ✓ Supabase handles auth
- ✓ Supabase prevents SQL injection  
- ✓ React prevents XSS by default
- ✓ Vercel has basic DDoS protection
- ❌ Don't add complex permission systems
- ❌ Don't add audit logs
- ❌ Don't add encryption beyond defaults

---

## 🧠 AI Integration Mantras

### 9. 🤖 AI SIMPLE MODE
```
context = getAllNotes()
prompt = simplePrompt + context
response = callOpenAI(prompt)
display(response)
// DONE. No fancy orchestration.
```

**AI simplifications:**
- One API call per interaction
- No conversation memory beyond session
- No fine-tuning
- No embeddings for search
- No RAG pipeline
- Simple prompt templates
- Basic error handling ("Try again")

### 10. 💰 COST CONSCIOUS
```
IF ai_call.cost > $0.10 THEN add_limit()
IF user.calls > 100/day THEN block()
IF context > 8000 tokens THEN truncate()
```

**Cost controls:**
- Hard token limits
- Daily quotas per user
- No GPT-4 for simple tasks
- Cache responses aggressively
- Truncate context brutally

---

## 🚀 Deployment Mantras

### 11. 🔄 DEPLOY CONSTANTLY
```
EVERY day.end() DO deploy_to_preview()
EVERY phase.end() DO deploy_to_production()
IF broken THEN rollback() ELSE continue()
```

**Deployment rhythm:**
- Commit every feature
- Deploy every day
- Test in production
- Fix forward, not backward
- No staging environment
- No complex CI/CD

### 12. 📊 MEASURE BASICS ONLY
```
track = {
  signup_count,
  story_count,
  ai_usage_count,
  daily_active_users
}
IF metric NOT IN track THEN ignore()
```

**Don't track:**
- Detailed user flows
- Conversion funnels
- A/B tests
- Heat maps
- Session recordings
- Detailed error logs

---

## 🎮 User Experience Mantras

### 13. 🔄 REFRESH IS FINE
```
IF sync.complex THEN tell_user("Please refresh")
IF conflict.exists THEN last_write_wins()
IF state.confused THEN reload_page()
```

**Acceptable UX compromises:**
- "Please refresh the page"
- "Your changes might take a moment"
- "If you don't see changes, try again"
- Loading spinners everywhere
- Full page reloads for navigation

### 14. 📝 TEMPLATES ARE STATIC
```
templates = loadFromCode()
customization = "Delete what you don't want"
IF user.wants_different THEN say("Delete and add your own")
```

**Template philosophy:**
- Hard-coded in the app
- No template marketplace
- No template customization UI
- No template sharing
- User deletes what they don't need

### 15. 💾 SAVE AGGRESSIVELY
```
onChange() => setTimeout(save, 500ms)
onBlur() => save()
beforeUnload() => save()
IF save.fails THEN retry(3 times)
```

**Data philosophy:**
- Save everything constantly
- Overwrite without merging
- No conflict resolution
- Last write wins
- No undo beyond browser default

---

## 🐛 Bug Handling Mantras

### 16. 🔥 KNOWN ISSUES ARE OKAY
```
bugs = []
IF bug.severity < "data_loss" THEN bugs.push(bug)
IF bugs.length < 10 THEN continue_building()
```

**Acceptable bugs for MVP:**
- Canvas occasionally jumpy
- Dark mode misses some text
- Import fails on special characters
- AI sometimes breaks character
- Relationships chart overlaps sometimes
- Timeline gets messy with many events

### 17. 🚨 ERROR = RELOAD
```
try {
  doThing()
} catch {
  alert("Something went wrong. Please refresh.")
  location.reload()
}
```

**Error handling strategy:**
- Catch errors at boundaries
- Show generic message
- Suggest page refresh
- Don't debug in production
- Don't create complex recovery

---

## 📋 Decision Making Mantras

### 18. ⚡ DECIDE IN 5 MINUTES
```
IF decision.time > 5 minutes THEN flip_coin()
IF blocked > 1 hour THEN pick_simpler_path()
IF arguing.with_self THEN choose_first_instinct()
```

**Decision examples:**
- Color scheme? → Tailwind defaults
- Database structure? → One big JSONB
- State management? → Whatever works first
- Component library? → First one that demos well
- Animation library? → None, use CSS

### 19. 👤 ONE USER PERSONA
```
user = "Sarah the fiction writer"
IF feature.helps(sarah) THEN build()
ELSE skip()
```

**Not building for:**
- Screenwriters (different format needs)
- Game designers (need mechanics)
- Academics (need citations)
- Poets (different structure)
- Journalists (need facts)
- Teams (need collaboration)

### 20. 📅 TIME BOXES ARE LAW
```
deadline = Date.now() + (8 * WEEKS)
IF Date.now() > deadline THEN ship_as_is()
IF feature.pushes_deadline THEN cut()
```

**Schedule is sacred:**
- Week 1-2: Canvas works
- Week 3-4: Templates work
- Week 5-6: Features work
- Week 7-8: AI works
- Week 8 ends: SHIP

---

## 🎬 Final Mantras

### 21. 🏁 DONE > PERFECT
```javascript
while (!shipped) {
  buildFeature()
  if (worksEnough()) {
    nextFeature()
  }
}
ship()
celebrate()
iterate_later()
```

### 22. 🎯 VALIDATE THE CORE IDEA
**The only question that matters:**
"Do writers want a visual canvas with AI character simulation?"

Everything else is noise.

### 23. 🚢 DEFAULT TO SHIPPING
When in doubt, ship it.  
When worried, ship it.  
When uncertain, ship it.  
When it's 80% done, ship it.

---

## ⛔ ANTI-PATTERNS TO AVOID

### The Perfectionist Trap
❌ "Let me just refactor this..."  
❌ "The architecture could be cleaner..."  
❌ "What if we need to scale to millions..."  
✅ "It works. Moving on."

### The Feature Creeper
❌ "Wouldn't it be cool if..."  
❌ "Users might want..."  
❌ "Other apps have..."  
✅ "Not in spec. Next."

### The Optimization Obsession
❌ "This could be 10ms faster..."  
❌ "Let me optimize this query..."  
❌ "We should cache everything..."  
✅ "Fast enough. Continue."

### The Edge Case Hunter
❌ "What if someone uploads a 10GB file..."  
❌ "What if they create 10,000 nodes..."  
❌ "What if they have 500 characters..."  
✅ "Normal use case works. Ship."

### The Library Researcher
❌ "Let me evaluate 5 libraries..."  
❌ "There might be a better option..."  
❌ "I should benchmark these..."  
✅ "First one works. Use it."

---

## 💭 WHEN STUCK, REMEMBER:

**This is an MVP.**
- It doesn't need to be pretty
- It doesn't need to be fast  
- It doesn't need to be scalable
- It doesn't need to be maintainable
- It NEEDS to answer: "Do writers want this?"

**Your job is to:**
1. Build what's specified
2. Make it work enough
3. Ship it to users
4. Learn if they care

**Everything else is procrastination.**

---

## 📌 THE FINAL MANTRA

```
IF specced THEN build()
IF NOT specced THEN skip()
IF built THEN ship()
IF NOT perfect THEN ship_anyway()

// The End. Now go build.
```

Remember: Every hour spent on unspecified features is an hour stolen from validating the core idea. The graveyard of startups is full of perfect code that nobody wanted.

**SHIP THE MVP. LEARN. ITERATE.**

Nothing else matters.