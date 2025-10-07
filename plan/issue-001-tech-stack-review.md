# Issue #001: Technology Stack Review and Consolidation

## Objective
Review the current technology stack across the entire PeoplePerson application and identify opportunities for consolidation, simplification, and removal of unnecessary technologies.

## Current State Analysis

### Frontend Technologies
- **SvelteKit** - Full-stack framework
- **TailwindCSS** - Utility-first CSS framework
- **DaisyUI** - Component library for Tailwind
- **TypeScript** - Type safety
- **Vite** - Build tool (part of SvelteKit)

### Backend Technologies
- **SvelteKit** - Server-side rendering and API routes
- **FastAPI** - Python web framework (in `/api`)
- **Django** - Python web framework (in `/api`)
- **Node.js** - JavaScript runtime for SvelteKit

### Database & ORM
- **PostgreSQL** - Primary database
- **SQLite** - Local database file (`peopleperson.db`)
- **Sequelize** - ORM for Node.js
- **SQLAlchemy** - ORM for Python (FastAPI)
- **Django ORM** - Built-in Django ORM

### AI/ML
- **LangChain** - LLM orchestration framework
- **Anthropic Claude API** - LLM provider

### Infrastructure & Tools
- **Docker** - Containerization
- **tmux** - Terminal multiplexer for development
- **Make** - Build automation
- **npm** - Package manager
- **pip** - Python package manager

### Testing
- **Playwright** - E2E testing
- **Vitest** - Unit testing

## Identified Issues

### 1. **Duplicate Backend Frameworks**
- Currently have THREE backend solutions: SvelteKit API routes, FastAPI, and Django
- This creates maintenance overhead and confusion
- Different authentication systems, different ORMs, different deployment requirements

### 2. **Multiple ORMs**
- Sequelize (Node.js)
- SQLAlchemy (Python/FastAPI)
- Django ORM (Python/Django)
- Each requires separate model definitions and migrations

### 3. **Mixed Database Systems**
- PostgreSQL as primary
- SQLite file present but purpose unclear
- Multiple connection configurations needed

### 4. **Language Split**
- JavaScript/TypeScript (SvelteKit)
- Python (Django/FastAPI)
- Increases complexity for development and deployment

## Recommendations

### Priority 1: Backend Consolidation
**Option A: Full SvelteKit (Recommended)**
- Remove Django and FastAPI entirely
- Use SvelteKit for all API routes
- Single language (TypeScript/JavaScript)
- Unified authentication and session management
- Simpler deployment

**Option B: Python-only Backend**
- Remove SvelteKit backend, keep only as static frontend
- Choose either Django OR FastAPI (not both)
- More complex integration with frontend

### Priority 2: Database/ORM Simplification
- Stick with PostgreSQL only
- Remove SQLite file if not needed
- Use single ORM (Sequelize if SvelteKit, Django ORM if Django)
- Consolidate all model definitions in one place

### Priority 3: Development Environment
- Simplify Docker setup if keeping single backend
- Update Makefile to reflect consolidated stack
- Remove unnecessary dependencies from package.json and requirements.txt

## Action Items

1. [ ] Decision: Choose backend consolidation strategy
2. [ ] Audit all API endpoints across all three systems
3. [ ] Map data models across all ORMs
4. [ ] Plan migration strategy for existing data
5. [ ] Update authentication to single system
6. [ ] Remove unused dependencies
7. [ ] Update documentation (README, CLAUDE.md)
8. [ ] Simplify Docker configuration
9. [ ] Update development commands in Makefile
10. [ ] Test all functionality after consolidation

## Impact Assessment

### Benefits
- Reduced cognitive load for developers
- Faster development cycles
- Easier debugging and maintenance
- Simplified deployment
- Reduced security surface area
- Better performance (fewer services running)

### Risks
- Migration effort required
- Potential for breaking changes
- Need to rewrite some functionality
- Learning curve if team unfamiliar with chosen stack

## Estimated Effort
- Planning: 2-4 hours
- Implementation: 16-24 hours
- Testing: 4-8 hours
- Documentation: 2-4 hours

**Total: 24-40 hours**

## Next Steps
1. Review this analysis with team
2. Make decision on consolidation approach
3. Create detailed migration plan
4. Begin incremental migration