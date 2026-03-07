# Mise — Product Spec v0.1

> Format based on Lenny Rachitsky's PRD template.
> Last updated: 2026-03-01

---

## 1. Background & Problem

### The Problem
Recipes are scattered across Apple Notes, Instagram saves, TikTok bookmarks, and a dozen recipe websites. None of these tools were built for actually cooking from or sharing recipes — they're generic capture tools applied to a specific domain.

The result:
- Recipes you made once and loved are lost or hard to find
- Documenting a recipe you cooked intuitively requires too much effort
- Sharing a recipe looks unprofessional (a screenshot, a voice note, a wall of text)
- Cooking from a saved Instagram post requires switching apps, scrolling through video, and squinting at quantities

### Why Now
Short-form video has made food content explode, but the tooling for saving and managing that content hasn't caught up. The gap between "I cooked something great" and "I have a shareable, reusable recipe" is still entirely manual.

### Target Users (v1)
**Primary:** Home cooks who cook intuitively and want to document their recipes without the friction of writing them up manually.

**Future:** Food content creators and influencers who need a fast pipeline from "I cooked this" to "I posted this."

---

## 2. Success Metrics

### Primary Metric
- WAU - active is a user who upload at least 1 recipe
### Secondary Metrics
- Weekly active recipe uploads per user — if people are uploading, the app is solving the friction problem.
- Recipe-to-cooking-session ratio — are people using what they upload?
- Share events per month — are recipes leaving the app?
- D7 retention — do people come back after the first week?

### Counter Metrics (watch for degradation)
- Edit time after voice upload — if users are spending >3 min editing, the AI isn't good enough
- Upload abandonment rate — if people start an upload and don't finish, the flow has friction

---

## 3. Solution Overview

Mise is a mobile-first recipe management app with three areas: **Upload**, **View**, and **Share**.

The core insight: the hardest part isn't finding recipes, it's capturing your own. Mise removes the documentation friction entirely by letting you speak and the app writes.

---

## 4. Detailed Requirements

### 4.1 Upload

#### 4.1.1 Voice Memo → Recipe
**Flow:**
1. User taps record after cooking
2. Speaks naturally about what they did (ingredients, quantities, steps, timing)
3. AI transcribes (Whisper) then structures into a formatted recipe (Claude)
4. User lands on review/edit screen
5. User confirms or edits, then saves

**Requirements:**
- Recording must work with phone locked (background audio)
- Minimum recording length: 10 seconds
- Maximum recording length: 10 minutes
- Show transcription in real time or immediately after stopping
- AI output must include: recipe name (inferred), ingredient list with quantities, ordered steps, estimated time, serving size (if mentioned)
- Edit screen allows: rename, add/remove ingredients, reorder/edit steps, add notes

**Edge Cases:**
- User stops recording mid-sentence → process what exists, flag incomplete transcription
- Background noise (kitchen sounds, music) → Whisper handles most cases; show confidence warning if quality is low
- User mentions an ingredient but no quantity → store as "to taste" and highlight for user to fill in
- User speaks in a language other than English → transcribe in original language, offer translation toggle
- Recording interrupted by phone call → save partial recording, ask user if they want to continue or process what exists
- User forgets to mention a key step (e.g., oven temp) → AI flags likely missing information as a prompt

#### 4.1.2 Photo Upload
**Flow:**
1. User selects or takes a photo
2. AI enhances: background cleanup + lighting/color correction
3. User sees before/after toggle
4. User accepts or reverts to original
5. Photo attached to recipe

**Requirements:**
- Accept photos from camera roll or live camera
- Show before/after comparison before confirming
- Enhancement must complete in under 10 seconds
- Store both original and enhanced versions (allow revert)
- One photo per recipe (v1)

**Edge Cases:**
- Photo is too dark or blurry → warn user and suggest retaking rather than enhancing a poor source
- User uploads a photo of something other than food → no blocking, but note the system expects food images
- Enhancement makes the photo worse → always allow revert to original
- Large file size → compress before upload, target under 2MB for storage
- No photo added → recipe saves fine, placeholder shown in list view

#### 4.1.3 Link Import
**Flow:**
1. User pastes a URL or shares from another app via share sheet
2. App detects source type (website, YouTube, Instagram, TikTok)
3. AI extracts and structures the recipe
4. User reviews and saves (same review/edit screen as voice)

**Supported Sources:**
| Source | Method | Fallback |
| --- | --- | --- |
| Recipe websites | Scrape HTML + Claude parse | Manual paste |
| YouTube | Extract description + auto-transcript + Claude | Manual paste |
| Instagram | Manual paste (v1) | — |
| TikTok | Manual paste (v1) | — |

**Edge Cases:**
- URL is behind a paywall (NYT Cooking) → show clear error, offer manual paste fallback
- Recipe website uses heavy JavaScript rendering → headless browser fallback or graceful failure
- YouTube video has no transcript → extract from description only; warn that recipe may be incomplete
- Link is broken or returns 404 → show error, offer manual entry
- Imported recipe is in metric units, user prefers imperial → unit conversion toggle (or vice versa)
- Same link imported twice → detect duplicate by URL, ask user if they want to update or keep both

#### 4.1.4 Manual Entry
- Text-based form as fallback for all upload methods
- Fields: name, ingredients (structured list), steps, tags, photo, notes

#### 4.1.5 Auto-Tagging
**Auto-generated tag categories:**
- **Cuisine:** Italian, Asian, Middle Eastern, Mexican, etc.
- **Meal type:** Breakfast, Lunch, Dinner, Snack, Dessert
- **Main ingredient:** Chicken, Pasta, Vegetables, Fish, etc.
- **Dietary:** Vegetarian, Vegan, Gluten-free, Dairy-free
- **Effort:** Quick (under 30 min), Weekend project
- **Audience:** Kids-friendly

**Requirements:**
- Auto-tags shown as suggestions on review screen, not silently applied
- User can accept all, remove individual, or add custom tags
- Custom tags saved to user's tag library for reuse

**Edge Cases:**
- Recipe fits multiple cuisine categories → show all, let user deselect
- User's custom tag conflicts with a system tag name → allow it, they coexist
- No tags can be inferred → prompt user to add at least one manually

---

### 4.2 View

#### 4.2.1 Recipe Library
**Requirements:**
- Default sort: most recently added/viewed
- Search: by name (v1), by tag (v1), by ingredient (v2)
- Each card shows: photo (or placeholder), name, primary tag, estimated time
- Pull-to-refresh

**Edge Cases:**
- Empty library (new user) → onboarding prompt to upload first recipe
- Search returns no results → suggest related tags or clear search
- Very long recipe list (100+) → pagination or infinite scroll, no performance degradation

#### 4.2.2 Step-by-Step Cooking Mode
**Flow:**
1. User opens recipe and taps "Start Cooking"
2. Screen switches to full-screen step view
3. One step displayed at a time with large text
4. Ingredients mentioned in the step are underlined/tappable
5. Tapping an ingredient shows a popup: quantity + preparation ("3 onions, thinly sliced")
6. Swipe or tap to advance to next step
7. Screen wake lock activated for duration of session

**Requirements:**
- Wake lock: prevent screen from sleeping while in cooking mode
- Step progress indicator (e.g., "Step 3 of 7")
- "Jump to step" via step list overlay
- Previous step navigation
- Ingredient popup dismisses on tap outside
- Exit cooking mode returns to recipe detail view

**Edge Cases:**
- User gets a phone call mid-cooking → cooking mode pauses, resumes on return
- Step is very long (multiple sub-actions) → allow scroll within a step
- Recipe has no structured steps (imported as block text) → display as single "step," prompt user to structure it
- User loses connectivity mid-cook → all data already loaded, works fully offline
- Ingredient referenced in step not found in ingredient list → show step text as-is, no broken link

---

### 4.3 Share

#### 4.3.1 PDF Export
**Output:** Clean recipe card — photo (if exists), recipe name, servings, time, ingredients list, numbered steps, tags.

**Requirements:**
- Generated on-device or server-side (under 5 seconds)
- Shared via native iOS/Android share sheet
- File name: `[recipe-name]-mise.pdf`

**Edge Cases:**
- No photo → layout adjusts gracefully, no blank box
- Very long recipe (15+ ingredients, 12+ steps) → multi-page PDF, consistent layout
- Special characters in recipe name → sanitize for filename

#### 4.3.2 Instagram Share
**Output:** Full-size food photo (enhanced if available) + pre-written caption text copied to clipboard.

**Caption includes:**
- Recipe name
- 2–3 sentence description (AI-generated from recipe)
- Key ingredients callout
- Hashtags (auto-generated from tags)

**Requirements:**
- One tap to copy caption
- One tap to save photo to camera roll
- User can edit caption before copying
- Opens Instagram app if installed (as optional shortcut)

**Edge Cases:**
- No photo → prompt user to add a photo before sharing to Instagram
- Caption is too long for Instagram (2,200 char limit) → truncate with warning
- Instagram not installed → share photo + caption via standard share sheet

---

## 5. Out of Scope (v1)

- Shared collections / family cookbook
- Recipe ratings or comments
- Nutritional information
- Grocery list generation from recipe ingredients
- Meal planning / calendar
- In-app social feed
- Video recipes
- Multiple photos per recipe
- Instagram carousel / designed post (just photo + text)
- Web app (mobile only)

---

## 6. Technical Stack

### Frontend
**React Native with Expo**
- Native iOS/Android app from day one
- Expo managed workflow for fast iteration
- Expo AV for voice recording
- Expo Sharing / Share Extension for link import

### Backend
**Supabase**
- **Database:** Supabase PostgreSQL — relational model for recipes, ingredients, steps, tags
- **Auth:** Supabase Auth with Google OAuth provider — no custom auth code
- **Storage:** Supabase Storage for recipe photos (original + enhanced)
- **Server-side logic:** Supabase Edge Functions (Deno/TypeScript) for AI orchestration

### AI Services
| Task | Service | Notes |
| --- | --- | --- |
| Voice transcription | OpenAI Whisper API | Core feature, unavoidable external dependency |
| Recipe structuring | Claude Haiku (claude-haiku-4-5) | 20x cheaper than Sonnet — test quality first, upgrade if needed |
| Image enhancement | **Cut from v1** | Upload as-is, add AI enhancement in Phase 4 |
| Link/text extraction | Claude Haiku | Same model, different prompt |
| Auto-tag generation | Claude Haiku | Bundled into structuring call, no extra cost |
| Instagram caption | Claude Haiku | Short prompt, negligible cost |

### What's Cut for Leanness (v1)
- Image AI enhancement → Phase 4
- Instagram/TikTok scraping → manual paste only
- PDF generation → Phase 5

### Architecture
```
React Native (Expo)
    ↓
Supabase
  ├── Auth (Google OAuth)
  ├── PostgreSQL (recipes, users, tags)
  ├── Storage (recipe photos)
  └── Edge Functions
         ↓ AI calls
    OpenAI Whisper + Claude Haiku
```

### What This Eliminates
- No Docker setup for local dev
- No custom API server
- No manual OAuth implementation
- No manual file storage setup

### Estimated Cost at Small Scale
Supabase free tier + AI APIs at cents per recipe upload

---

## 7. Open Questions

| # | Question | Owner | Priority |
| --- | --- | --- | --- |
| 1 | How will Instagram/TikTok import work? Manual paste is the fallback but is it good enough? | Product | High |
| 2 | What's the right Claude prompt to reliably structure voice memo transcriptions? | Engineering | High |
| 3 | Which image enhancement service gives the best quality/cost ratio? | Engineering | Medium |
| 4 | Should ingredient-step linking be AI-inferred at generation time or manually tagged in the editor? | Product | Medium |
| 5 | What happens to a recipe if a user deletes their account? | Product/Legal | Medium |
| 6 | Do we need offline mode beyond cooking (e.g., offline upload queue)? | Product | Low |
| 7 | What is the monetization model? Free, freemium, subscription? | Business | Low (v1) |

---

## 8. Launch Plan (v1)

1. **Alpha (Phase 1–2):** Solo use for 2 weeks. Cook from the app every day.
2. **Closed beta (Phase 3–4):** Invite 5 friends/family. Observe, don't explain.
3. **Soft launch (Phase 5–6):** Open to wider circle. Collect feedback before public.
4. **Public:** Only after closed beta validates the core loop.
