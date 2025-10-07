# Issue #002: SvelteKit to React Migration Plan

## Objective
Migrate the frontend from SvelteKit to React with Vite, while maintaining the FastAPI backend and improving the development experience.

## Target Architecture

### Frontend Stack (New)
- **React 18** - UI library
- **Vite** - Build tool and dev server (fast HMR, better DX than Create React App)
- **TypeScript** - Type safety
- **React Query (TanStack Query v5)** - Server state management
- **React Router v6** - Client-side routing
- **Tailwind CSS + DaisyUI** - Styling (keep existing)
- **Axios** - HTTP client (better TypeScript support than fetch)

### Backend Stack (Keep)
- **FastAPI** - Python web framework
- **SQLModel/SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **Pydantic** - Data validation

### Remove
- **SvelteKit** - Full-stack framework
- **Sequelize** - Node.js ORM (no longer needed)
- **Svelte components** - Will be converted to React
- **SvelteKit adapters** - Not needed with Vite

## Migration Steps

### Phase 1: Setup New React Project

```bash
# Create new React app with Vite
npm create vite@latest frontend -- --template react-ts

# Project structure
/PeoplePerson
  /frontend          # New React app
    /src
      /components    # React components
      /pages        # Page components
      /hooks        # Custom React hooks
      /services     # API services
      /types        # TypeScript types
      /utils        # Utilities
    /public         # Static assets
  /api              # Keep existing FastAPI
  /plan             # Documentation
```

### Phase 2: Core Dependencies Installation

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-query": "^5.51.0",
    "@tanstack/react-query-devtools": "^5.51.0",
    "react-router-dom": "^6.26.0",
    "axios": "^1.7.0",
    "tailwindcss": "^3.4.0",
    "daisyui": "^4.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

### Phase 3: Configuration Files

#### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Phase 4: Core Setup Files

#### React Query Provider (src/providers/QueryProvider.tsx)
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
```

#### API Client (src/services/api.ts)
```typescript
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Phase 5: Component Migration Map

| SvelteKit Component | React Component | Notes |
|-------------------|-----------------|-------|
| `src/routes/+page.svelte` | `src/pages/Home.tsx` | Main landing page |
| `src/routes/person/[id]/+page.svelte` | `src/pages/Person/PersonDetail.tsx` | Person detail view |
| `src/routes/group/[id]/+page.svelte` | `src/pages/Group/GroupDetail.tsx` | Group detail view |
| `src/lib/components/*.svelte` | `src/components/*` | Reusable components |
| `+layout.svelte` | `src/layouts/MainLayout.tsx` | App layout wrapper |

### Phase 6: React Query Hooks Examples

#### usePeople.ts
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/api'

export function usePeople() {
  return useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const { data } = await apiClient.get('/people')
      return data
    }
  })
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (person: PersonCreate) => {
      const { data } = await apiClient.post('/people', person)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    }
  })
}
```

### Phase 7: Router Setup (src/App.tsx)
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryProvider } from '@/providers/QueryProvider'
import MainLayout from '@/layouts/MainLayout'
import Home from '@/pages/Home'
import PersonDetail from '@/pages/Person/PersonDetail'

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="person/:id" element={<PersonDetail />} />
            <Route path="group/:id" element={<GroupDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  )
}
```

## Migration Checklist

### Immediate Actions
- [ ] Create new Vite + React + TypeScript project
- [ ] Set up project structure
- [ ] Install core dependencies
- [ ] Configure Vite proxy for API
- [ ] Set up Tailwind + DaisyUI
- [ ] Create React Query provider
- [ ] Set up React Router

### Component Migration (Priority Order)
1. [ ] Layout components (navigation, footer)
2. [ ] Home page
3. [ ] Person list/search components
4. [ ] Person detail page
5. [ ] Group components
6. [ ] Auth components (login, register)
7. [ ] AI chat interface

### API Integration
- [ ] Create API service layer with Axios
- [ ] Define TypeScript types from FastAPI models
- [ ] Create React Query hooks for each endpoint
- [ ] Implement error handling
- [ ] Add loading states

### Features to Preserve
- [ ] Natural language person creation/search
- [ ] Real-time SSE updates for AI processing
- [ ] Person management (CRUD)
- [ ] Group management
- [ ] Journal/history entries
- [ ] Authentication flow

### Cleanup
- [ ] Remove all SvelteKit files
- [ ] Remove Sequelize models and config
- [ ] Update package.json scripts
- [ ] Update README
- [ ] Update CLAUDE.md
- [ ] Remove unused dependencies

## Benefits of This Migration

### Why Vite?
- **Faster HMR** - Near-instant hot module replacement
- **Better DX** - Superior development experience vs CRA
- **ESBuild** - Lightning-fast bundling
- **Native ESM** - Modern module handling
- **Built-in TypeScript support**

### Why React Query?
- **Powerful caching** - Intelligent background refetching
- **Optimistic updates** - Better UX
- **Built-in loading/error states**
- **Devtools** - Excellent debugging experience
- **Automatic refetching** - On focus, reconnect, etc.

### Why This Stack?
- **Separation of concerns** - Clear frontend/backend split
- **Better ecosystem** - React has more libraries/components
- **Easier hiring** - React developers more common
- **FastAPI focus** - Can optimize Python backend without frontend concerns
- **Type safety** - End-to-end TypeScript on frontend

## Potential Challenges

1. **SSE Implementation** - Need to handle Server-Sent Events for AI streaming
2. **Auth Migration** - Firebase auth integration needs careful handling
3. **File-based routing loss** - Need to manually define routes
4. **Form handling** - Need library like React Hook Form
5. **SEO considerations** - Losing SSR capabilities of SvelteKit

## Timeline Estimate

- **Week 1**: Setup and core infrastructure
- **Week 2**: Component migration and routing
- **Week 3**: API integration and React Query setup
- **Week 4**: Testing, bug fixes, and cleanup

**Total: ~4 weeks for complete migration**

## Next Steps

1. Decide on migration approach (gradual vs full rewrite)
2. Set up new React project structure
3. Begin with authentication and core components
4. Progressively migrate features
5. Run both apps in parallel during transition