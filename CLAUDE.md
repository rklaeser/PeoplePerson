# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `npm run dev` - Start development server
- `npm run build` - Build production app
- `npm run preview` - Preview production build

### Code Quality

- `npm run check` - Run type checking with svelte-check
- `npm run lint` - Run linting and format checking
- `npm run format` - Format code with Prettier

### Testing

- `npm test` - Run all tests (integration + unit)
- `npm run test:integration` - Run Playwright integration tests
- `npm run test:unit` - Run Vitest unit tests

### Database

- `npm run db:sync` - Sync database schema (run after model changes)
- `npm run db:seed` - Seed database with initial data

## Architecture

### Core Concept

Friendship is an AI-powered friend management app that helps users remember details about their friends. It uses natural language processing to create, search, and update friend information through conversational interfaces.

### Tech Stack

- **Frontend/Backend**: SvelteKit (full-stack framework)
- **Database**: PostgreSQL with Sequelize ORM
- **AI/LLM**: LangChain with Anthropic Claude (claude-sonnet-4-20250514)
- **Styling**: TailwindCSS with DaisyUI components

### Database Models

The app uses four main models with Sequelize associations:

- **Person**: Core friend entity with name, body, intent status, birthday, mnemonic
- **Group**: Categories for organizing friends
- **Journal**: Notes/entries about interactions with friends
- **GroupAssociation**: Many-to-many relationship between Person and Group
- **PersonAssociations**: Self-referential many-to-many for friend-to-friend relationships

### AI Processing Pipeline

The AI system uses Server-Sent Events (SSE) for real-time processing feedback:

1. **Intent Detection** (`detectIntent`) - Determines user action (create/search/update)
2. **Person Identification** (`identifyPerson`) - Matches text to existing friends
3. **Handler Routing** - Routes to appropriate handler based on intent:
   - `PersonCreateHandler` - Creates new friends
   - `PersonSearchHandler` - Searches existing friends
   - `PersonUpdateHandler` - Updates friend information

### Key Services

- **PersonService** (`src/lib/services/personService.server.ts`) - Core CRUD operations for friends
- **LangChain Utils** (`src/lib/langchain/utils.ts`) - AI processing functions
- **Handlers** (`src/lib/handlers/`) - Business logic for different user intents

### API Architecture

- Main AI endpoint: `/api/ai/route/+server.ts` (SSE streaming)
- RESTful endpoints for direct operations: `/api/person/`, `/api/people/`, etc.
- Server-side data loading through SvelteKit's `+page.server.ts` files

### Frontend Structure

- Component-based architecture in `src/lib/components/`
- Route-based pages in `src/routes/`
- Shared stores for state management in `src/lib/stores/`
- Person detail pages with modular components (Associates, Groups, Journal entries, etc.)

### Environment Setup

Requires `DB_URL` environment variable for PostgreSQL connection and `ANTHROPIC_API_KEY` for AI functionality.
