# Tech Stack

## Frontend Framework
- **Next.js 16** - React framework using App Router for file-based routing, server components, and API routes
- **React 19** - UI library for component-based interface development
- **TypeScript** - Static typing for type safety and improved developer experience

## Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework for rapid UI development
- **CSS Modules** (if needed) - Scoped styling for complex components alongside Tailwind

## Visual Libraries
- **ReactFlow** - Node-based visual editor library for canvas view (v2+)
  - Used for the visual waypoint canvas with drag-drop connections
  - Provides auto-layout algorithms and node positioning

## Backend & Database
- **Supabase** - Backend-as-a-service platform providing:
  - **PostgreSQL** - Relational database for storing items, achievements, user data
  - **Row-Level Security (RLS)** - Database-level security policies
  - **Real-time Subscriptions** - Live data updates across clients

## Authentication
- **Supabase Auth** - Managed authentication service
  - Email/password authentication
  - Social provider support (Google, GitHub, etc.)
  - Session management and JWT tokens

## State Management
- **React Hooks** - useState, useEffect, useContext for local component state
- **Context API** - For global state (theme, user preferences)
- **Supabase Real-time** - For syncing database state across clients (v3+)

## Data Validation
- **Zod** - TypeScript-first schema validation for API inputs and form validation

## Development Tools
- **ESLint** - Code linting and quality checks
- **Prettier** (optional) - Code formatting
- **TypeScript Compiler** - Type checking

## Testing (Future)
- **Jest** - Unit testing framework
- **React Testing Library** - Component testing
- **Playwright** or **Cypress** - End-to-end testing

## Deployment & Hosting
- **Vercel** - Hosting platform optimized for Next.js
  - Automatic deployments from Git
  - Edge network CDN
  - Serverless functions for API routes

## Storage Strategy
- **Phase 1 (MVP v1)**: Browser localStorage for quick iteration and testing
- **Phase 2 (v3+)**: Supabase PostgreSQL for production with authentication
- **Migration utilities**: Built to transition from localStorage to Supabase

## API Layer
- **Next.js API Routes** - Serverless functions for backend logic
- **Supabase Client SDK** - Direct client-to-database queries with RLS
- **REST endpoints** (via Supabase) - Auto-generated from database schema

## Code Organization
- **App Router structure** - Next.js 16 app directory convention
- **Component-based architecture** - Reusable React components
- **Custom hooks** - Shared logic extraction (useQuickAdd, useAchievements, etc.)
- **Type definitions** - Centralized TypeScript types and interfaces

## Performance Optimization
- **React Server Components** - Reduce client-side JavaScript bundle
- **Dynamic imports** - Code splitting for lazy loading
- **Virtualized scrolling** - For large item lists (v3+)
- **Optimistic UI updates** - Immediate feedback before server confirmation

## Key Dependencies (package.json)
```json
{
  "dependencies": {
    "next": "^16.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "@supabase/supabase-js": "^2.x",
    "reactflow": "^11.x",
    "zod": "^3.x",
    "tailwindcss": "^4.x"
  }
}
```

## Architecture Decisions

### Why Next.js App Router?
- Modern React patterns with server components
- Built-in routing and API layers
- Excellent Vercel integration for deployment
- Strong TypeScript support

### Why Supabase?
- Open-source alternative to Firebase
- Full PostgreSQL power with relational data
- Real-time subscriptions for live updates
- Built-in auth and RLS for security
- Easy local development with Docker

### Why localStorage First?
- Rapid MVP iteration without backend complexity
- No authentication required for initial testing
- Easy to migrate to Supabase later
- Users can try the app immediately

### Why ReactFlow?
- Purpose-built for node-based visual editors
- Handles complex canvas interactions (pan, zoom, connect)
- Auto-layout capabilities
- Active community and good documentation

### Why Tailwind CSS 4?
- Rapid prototyping with utility classes
- Consistent design system
- Minimal custom CSS needed
- Easy responsive design
- Small production bundle with tree-shaking
