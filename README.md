# Fellowship

Notice of incomplete CSS: Fellowship is an application I'm building for my own learning. Some features may be underdeveloped as what supports my learning doesn't neccesarily track one to one with what makes a great app.

Remember names and anything else. Study your friends, be a better friend.

## Why?
"Become genuinely interested in other people"

"She smiled, she laughed, she waved. Using the reminders and lists she kept in her notebook, she asked after families, new births, and favorite axehounds. She inquired about trade situations, took notes on which lighteyes seemed to be avoiding others. In short, she acted like a queen." - Brandon Sanderson describing Navani Kholin, Rhythm of War

Why not Siri?
Siri intents handle stricyl formated comands like "play my audiobook" and not unstructured comands like "find my mate with the blonde hair who doesn't have a job".

## Creating a project

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

Outline of pwa llm feature

# Fellowship – Project Architecture Summary

## Architecture Decisions

| Topic | Decision |
|:------|:---------|
| **Frontend framework** | SvelteKit |
| **Frontend mode** | PWA (Progressive Web App), no server-side rendering (`ssr = false`) |
| **Voice input** | Web Speech API (native browser capture) |
| **Backend architecture** | Two backends:<br>- Web backend (database CRUD)<br>- LLM backend (natural language parsing) |
| **LLM handling** | Backend receives text → sends it to LLM (e.g., OpenAI) → parses into structured JSON |
| **Database operations** | Structured fields from LLM used to query or create friend records |
| **User interaction flow** | Speak → Transcribe → Send to backend → Parse → Search database → Return/display/speak result |
| **Siri native integration** | Not using native Siri Intents (too rigid for messy natural language) |
| **Hosting and deployment** | Frontend as static files; backends as separate API containers |

---

## Key Technologies

| Area | Tool |
|:-----|:----|
| **Frontend** | SvelteKit + Web Speech API |
| **Backend (Web)** | Express or Fastify (CRUD operations) |
| **Backend (LLM)** | Express or Fastify (LLM parsing operations) |
| **LLM API** | OpenAI API (GPT-4o or similar) |
| **Database** | Supabase / Postgres with DrizzleORM |
| **PWA features** | Offline support, installable on iPhone |

---

## Design Philosophy

- **Voice-first interaction** (natural conversation, not rigid commands)
- **LLM handles messy human input** (not Siri Intents)
- **Frontend is lightweight and easily deployable**
- **Backends are cleanly separated for scalability**
- **PWA provides installability without App Store requirements**

---

## User Flow Summary

1. User taps the microphone button.
2. Speech is captured and transcribed in-browser.
3. Transcribed text is sent to `/agent/parse` on the LLM backend.
4. LLM parses text into structured fields (e.g., name, location, description).
5. Structured fields are sent to the Web backend to query or create database entries.
6. Result is returned and optionally read back to the user with SpeechSynthesis.

---

# ✅ Ready to Build Fellowship 🚀

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

Function calling could be used to let the model query the database for possible matches are return the highest ranking 3
https://platform.openai.com/docs/guides/function-calling/function-calling?api-mode=responses

What models
Start with OpenAI, can do local model next. Can have models compare.

Can give the prompt examples
