# Architecture

## Overview

IoZen is a monolithic Next.js application with modular boundaries designed for eventual service extraction.

**Stack:** Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4 (shadcn/ui) + Prisma 6 + Supabase + Anthropic Claude

---

## Architectural Principles

1. **Start Monolithic, Think Modular** - Clear module boundaries, loose coupling
2. **Managed Services Over Custom** - Vercel Workflow, Supabase, third-party AI APIs
3. **Determinism & Idempotency** - Every step reproducible and safe to retry
4. **Security by Design** - RLS, principle of least privilege, input validation everywhere

---

## System Layers

```
┌─────────────────────────────────────┐
│         CLIENT LAYER                │
│  Next.js App Router + React 19      │
│  Server Components (default)        │
│  Client Components (when needed)    │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         API LAYER                   │
│  /api/* routes                      │
│  Zod validation                     │
│  requireAuth() / requireWorkspace() │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      BUSINESS LOGIC LAYER           │
│  /lib - Utilities & services        │
│  /workflows - Vercel Workflows      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         DATA LAYER                  │
│  Prisma ORM                         │
│  Supabase PostgreSQL + Auth + RLS   │
└─────────────────────────────────────┘
```

---

## Database Schema

### Core Models

- **Profile** - User synced from Supabase Auth (UUID)
- **Workspace** - Multi-tenant container (CUID, unique slug)
- **WorkspaceMember** - Membership with roles (OWNER/ADMIN/MEMBER)
- **Chatflow** - Form definition with JSONB schema
- **ChatflowSubmission** - Collected responses
- **ConversationMessage** - Chat history
- **AuditLog** - All data changes

### Key Patterns

- Row Level Security (RLS) on all tables
- Signup trigger auto-creates profile + workspace
- Always filter queries by `workspaceId`
- CUID for IDs, snake_case columns

---

## Authentication Flow

```
User Signup
    │
    ▼
Supabase Auth creates user
    │
    ▼
Database trigger fires
    │
    ├─► Create profile
    ├─► Create workspace
    └─► Create membership (OWNER)
```

### Security Rules

- Server-side: Always use `getUser()` not `getSession()`
- API routes: Use `requireAuth()` helper
- Validate workspace membership for all operations

---

## Workflow Architecture

Vercel Workflows handle long-running and async operations.

### Workflow Characteristics

- **Durable** - Survives deployments, crashes, restarts
- **Retriable** - Automatic retry with exponential backoff
- **Observable** - Built-in logging of all inputs/outputs

### Step Granularity

Create steps for:
- External API calls (Claude, OCR)
- Database writes (critical data)
- Long operations (>5 seconds)

Don't create steps for:
- Simple validation
- Data transformations
- Database reads

### Error Classification

```typescript
// Fatal - stop workflow
throw new FatalError('Invalid input')

// Retryable - auto-retry
throw new RetryableError('Rate limited')
```

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated routes
│   ├── (public)/          # Public routes
│   ├── api/               # API routes
│   └── auth/              # Auth callbacks
├── components/
│   ├── features/          # Feature-specific components
│   │   ├── chatflow/      # Chatflow editor, fields, panels
│   │   ├── chat/          # Chat views (admin & public)
│   │   └── workspace/     # Workspace-related components
│   ├── layout/            # Navigation, containers, headers
│   └── ui/                # Reusable UI components (shadcn)
│       ├── button.tsx     # Universal button component
│       ├── forms/         # Form inputs and controls
│       ├── feedback/      # User feedback (alerts, toasts)
│       ├── data-display/  # Data presentation (cards, tables)
│       ├── layout/        # Layout containers (dialogs, sheets)
│       ├── overlays/      # Floating UI (tooltips, dropdowns)
│       └── navigation/    # Navigation elements (tabs, toggles)
├── lib/
│   ├── supabase/          # Auth clients
│   ├── api-auth.ts        # Auth helpers
│   ├── db.ts              # Prisma singleton
│   └── utils.ts           # Utilities
├── types/                 # TypeScript types
└── workflows/             # Vercel Workflows
```

---

## API Design

### RESTful Conventions

```
GET    /api/chatflows              # List
POST   /api/chatflows              # Create
GET    /api/chatflows/:id          # Read
PATCH  /api/chatflows/:id          # Update
DELETE /api/chatflows/:id          # Delete
POST   /api/chatflows/:id/publish  # Action
```

### Standard Pattern

```typescript
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth'

const schema = z.object({ name: z.string().min(1) })

export async function POST(req: Request) {
  const { auth, error } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const validated = schema.parse(body)

  // Always filter by workspace
  const result = await prisma.chatflow.create({
    data: { ...validated, workspaceId: auth.workspaceId }
  })

  return NextResponse.json(result)
}
```

---

## Performance Considerations

1. **Server Components by default** - Only use `'use client'` when needed
2. **Select specific fields** - Don't fetch entire records
3. **Proper indexing** - Index foreign keys and common queries
4. **Workflow state < 100KB** - Pass IDs, not full objects

---

## Security Checklist

- [ ] Use `getUser()` not `getSession()` on server
- [ ] Use `requireAuth()` in all API routes
- [ ] Filter all queries by `workspaceId`
- [ ] Validate all input with Zod
- [ ] Never expose internal IDs in URLs
- [ ] RLS policies on all tables
