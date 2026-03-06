# Mise — Build Roadmap

> The meta-rule: Build Phase 1 and use it every time you cook for 2 weeks before touching Phase 2.
> Real usage will teach you more than any planning session.

---

## Phase 1: The Core Loop
**Goal:** Get recipes in — from any source — and build your library.

### Build
- User auth (sign up / sign in)
- Voice memo recording → AI transcription → AI-structured recipe
- Import from link (recipe websites, YouTube, Instagram/TikTok paste)
- Import from image (photo of a recipe card, book page, or screenshot → AI extraction)
- Manual entry (text fallback)
- Review & edit screen before saving (shared across all input methods)
- Basic recipe feed (your own library)
- AI auto-tag suggestions on the review screen (accepted/rejected before saving)

### Must Figure Out Before Phase 2
- [ ] **AI quality bar** — Does Claude structure messy voice memos well enough that editing takes under 2 minutes? If not, tweak the prompt before moving on.
- [ ] **Image extraction quality** — Does Claude Vision reliably extract ingredients and steps from a photo of a recipe book? Test with 20 real photos before shipping.
- [ ] **Recipe data model** — Nail the schema now. Getting this wrong means refactoring everything. Key questions: How are ingredients stored? Are steps ordered objects or free text? How are quantities linked to steps?
- [ ] **Mobile framework decision** — React Native + Expo vs Flutter vs Swift. One-time foundational call. (See Tech Stack doc.)
- [ ] **Voice transcription service** — Whisper API (OpenAI) vs Deepgram vs on-device. Test with your accent and cooking vocabulary.
- [ ] **Auth provider** — Supabase Auth vs Firebase Auth. Decide early, hard to migrate.
- [ ] **Instagram/TikTok blocking** — These platforms actively block scraping. Decide on approach before building: (a) user copies text and pastes it, (b) browser share sheet extension, (c) official API (limited). Don't build a scraper you'll have to throw away.
- [ ] **Duplicate detection** — If a user imports the same link or image twice, what happens?

---

## Phase 2: Tagging
**Goal:** Build a tag system that makes every recipe in your library organised and filterable.

### Build
- Tag management UI: view, edit, rename, and delete tags across your library
- Manual tag editing on any saved recipe
- Custom tags (user-defined, saved to their personal tag library for reuse)
- Tag browsing in the feed (filter the home feed by tag)
- System tag categories: Cuisine, Meal type, Main ingredient, Dietary, Effort

### Must Figure Out Before Phase 3
- [ ] **Auto-tag quality** — Are AI-suggested tags accurate enough to accept without editing, or do users always tweak them? Measure edit rate on first 50 recipes.
- [ ] **Tag taxonomy** — How many system tag categories is too many? Test with your own library. If you end up with 30 tags and never use most of them, simplify.
- [ ] **Custom vs. system tags** — Should custom tags look different from system tags in the UI? Decide before building the tag editor.
- [ ] **Tag editing UX** — Inline editing on the recipe card vs. a dedicated tag screen. Which is faster in practice?

---

## Phase 3: Search
**Goal:** Make your library findable — fast.

### Build
- Free text search — AI-powered semantic search that finds the most relevant recipes even with vague or partial queries ("something with leftover chicken", "that pasta I made last month")
- Search by ingredient (find all recipes that use a specific ingredient)
- Tag-based filtering (filter by cuisine, meal type, dietary, effort)
- Combined queries (free text + tag filter at the same time)

### Must Figure Out Before Phase 4
- [ ] **Search backend** — Full-text search in Postgres (pg_trgm / tsvector) vs. embedding-based semantic search (pgvector + Claude embeddings). Full-text is simpler; semantic is more powerful for vague queries. Test both on your own library before deciding.
- [ ] **Query quality** — Does "something light and quick" return useful results? Define 10 test queries and set a quality bar before shipping.
- [ ] **Search vs. scroll** — After 2 weeks of using the feed, do you actually need search, or is scrolling fast enough at your library size? Let usage drive the priority.
- [ ] **Ingredient search granularity** — Should "tomato" match recipes with "cherry tomatoes" or "sun-dried tomatoes"? Decide on fuzzy matching rules upfront.

---

## Phase 4: Recipe Detail View
**Goal:** Make reading a recipe before cooking a great experience.

### Build
- Full recipe screen: hero photo, title, time, servings, source attribution (link or image origin)
- Ingredients list with quantities
- Steps list (scrollable)
- Personal notes — add timestamped notes to any recipe ("more lemon next time")
- Source link — tap to open the original URL for imported recipes

### Must Figure Out Before Phase 5
- [ ] **Notes vs. comments** — Are notes just for yourself, or should they eventually be shareable? Decide now so the data model is right.
- [ ] **Source display** — For image imports, what do you show as the source? Filename? "Scanned from photo"? Custom label the user sets?
- [ ] **Step scroll vs. step-by-step** — Does scrolling through steps on the detail screen make cooking mode feel redundant? Observe real cooking sessions before investing in Phase 5.

---

## Phase 5: Cooking Mode
**Goal:** Make the app actually useful in the kitchen.

### Build
- Step-by-step view (one step at a time, large text)
- Inline ingredient tap → quantity popup ("3 thin sliced onions")
- Screen wake lock (prevent auto-lock while cooking)
- "Jump to step" navigation

### Must Figure Out Before Phase 6
- [ ] **Step-by-step vs scroll** — Do you actually use step-by-step, or do you scroll? Test on yourself with 5 real cooking sessions.
- [ ] **Step granularity** — Does the AI split steps correctly, or do you always merge/split them during editing? May require prompt tuning.
- [ ] **Wake lock reliability** — Test on both iOS and Android. iOS is restrictive about this.
- [ ] **Ingredient-step linking** — How does the app know which ingredients belong to which step? Is this AI-inferred or manually tagged?

---

## Phase 6: Share
**Goal:** Get recipes out of the app and into the world.

### Build
- PDF export (clean recipe card: photo + ingredients + steps)
- Instagram share: food photo + caption text to copy
- Basic share link (view-only web page for non-app users)

### Must Figure Out Before Phase 7
- [ ] **What do people actually share?** — Ask your early users. Is it the PDF, the Instagram post, or a link? Build the most-used one first and do it well.
- [ ] **PDF layout** — Does plain text + photo work, or does it need a designed template? Get feedback before investing in design.
- [ ] **Instagram needs** — Talk to 2–3 food content creators. What does their current posting workflow look like? What would they pay for? This informs whether the influencer market is real.
- [ ] **Share link hosting** — A view-only web page requires a backend web renderer. Is this worth the complexity at this stage?

---

## Phase 8: Multi-User
**Goal:** Let friends and family use the app independently.

### Build
- Invite system (link or email)
- Each user's own account and recipe library
- View recipes shared by others (read-only)
- Optional: comment or save others' recipes

### Must Figure Out Before Going Public
- [ ] **Do friends actually use it?** — Honest answer. If 3 people you invited haven't uploaded a recipe after 4 weeks, understand why before building for more users.
- [ ] **Unexpected feature requests** — What do early users ask for that you didn't anticipate? This is gold.
- [ ] **Influencer use case** — Is there a real pain point that Mise uniquely solves for content creators, or is the personal-use app already the product? Talk to 5 creators before building for them.
- [ ] **Shared collections** — Is there demand for a family cookbook / shared pool, or do people prefer separate libraries?

---

## Phase 9: Party Plan
**Goal:** Turn Mise into the go-to tool for planning a dinner party or any group meal event.

### Build
- Create a "Party" (event with a date, guest count, and theme/notes)
- Pick recipes from your library and assign them to courses (starter, main, dessert, drinks)
- Auto-scale ingredient quantities based on guest count
- Unified shopping list across all party recipes (merged, deduped)
- Cooking timeline: given each recipe's prep/cook time, generate a "start X at Y" schedule so everything finishes together
- Share the party plan with guests (view-only link)

### Must Figure Out Before Going Public
- [ ] **Scaling accuracy** — Scaling baked goods is not linear. How does the app warn users, and does it need recipe-author hints to do this correctly?
- [ ] **Shopping list format** — Grouped by grocery aisle? By recipe? What format do people actually shop from? Test with 3 real dinner party sessions.
- [ ] **Timeline complexity** — Does a simple "start at T minus X minutes" work, or do parallel tasks (oven + stovetop) need a more sophisticated scheduler?
- [ ] **Guest collaboration** — Do guests want to claim a dish ("I'll bring dessert")? Or is host-only simpler and better?
- [ ] **Real usage** — Did planning your own dinner party actually save time vs. winging it? Measure this honestly.

---

## Decision Log
> Record key decisions here as you make them so future-you understands why.

| Date | Decision | Rationale | Alternatives Rejected |
| --- | --- | --- | --- |
