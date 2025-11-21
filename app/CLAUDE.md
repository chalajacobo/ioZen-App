# Claude Code Instructions - IoZen

## Project Overview

IoZen is an AI-powered platform that replaces traditional forms with intelligent chatflows powered by Anthropic's Claude API. Workspace-based multi-tenant architecture.

**Stack:** Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4 (shadcn/ui) + Prisma 6 + Supabase + Anthropic Claude

---

## Core Principles

1. **Simplicity First** - Write code for humans first, machines second
2. **Consistency Over Preference** - Follow established patterns
3. **Type Safety is Non-Negotiable** - No `any` without justification

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated routes
│   ├── (public)/          # Public routes (login, signup)
│   ├── api/               # API routes
│   ├── actions/           # Server actions
│   └── layout.tsx         # Root layout
├── components/
│   ├── features/          # Feature-specific components
│   │   ├── chatflow/      # Chatflow editor, fields
│   │   ├── chat/          # Chat views (admin & public)
│   │   └── workspace/     # Workspace components
│   ├── layout/            # Layout components (nav, header)
│   └── ui/                # Reusable UI (shadcn)
│       ├── button.tsx     # Universal button (root)
│       ├── forms/         # Input, textarea, select, etc.
│       ├── feedback/      # Alerts, toasts, progress
│       ├── data-display/  # Cards, badges, tables
│       ├── layout/        # Dialogs, sheets, panels
│       ├── overlays/      # Tooltips, dropdowns, popovers
│       └── navigation/    # Tabs, toggles
├── lib/                   # Utilities and configurations
│   ├── supabase/
│   ├── api-auth.ts
│   └── utils.ts
├── types/                 # TypeScript type definitions
└── workflows/             # Vercel Workflows
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files/Directories | `kebab-case` | `chatflow-editor.tsx` |
| Components | `PascalCase` | `ChatflowEditor` |
| Functions/Variables | `camelCase` | `createChatflow` |
| Types/Interfaces | `PascalCase` | `ChatflowSchema` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE` |
| Database columns | `snake_case` | `created_at` |
| Private functions | `_camelCase` | `_validateInput` |

---

## Database & Prisma

### CRITICAL: Always Use Migrations

```bash
# GOOD
npx prisma migrate dev --name add_chatflow_status

# BAD - NEVER USE
npx prisma db push
```

### Query Optimization

```typescript
// GOOD - Select only needed fields
const chatflows = await prisma.chatflow.findMany({
  where: { workspaceId },
  select: {
    id: true,
    name: true,
    status: true,
    _count: { select: { submissions: true } }
  }
})

// BAD - Fetching all fields
const chatflows = await prisma.chatflow.findMany({
  where: { workspaceId }
})
```

### Multi-Tenancy Security

```typescript
// GOOD - Always filter by workspace
const chatflow = await prisma.chatflow.findFirst({
  where: {
    id: chatflowId,
    workspaceId: auth.workspaceId  // Security!
  }
})

// BAD - No workspace filter
const chatflow = await prisma.chatflow.findUnique({
  where: { id: chatflowId }
})
```

---

## Authentication & Authorization

### CRITICAL Security Rules

- **Server-side: ALWAYS use `getUser()` NOT `getSession()`** - validates JWT
- Workspace-based multi-tenancy with RLS policies
- Role hierarchy: OWNER > ADMIN > MEMBER

### Patterns

```typescript
// Server components
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// API routes
const { auth, error } = await requireAuth()
const { context, error } = await requireWorkspace(slug)

// Client components
const { workspace, membership } = useWorkspace()
const isAdmin = useHasRole('ADMIN')
```

---

## API Route Standards

### Standard Template

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth'
import prisma from '@/lib/db'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const { auth, error } = await requireAuth()
    if (error) return error

    const body = await req.json()
    const validated = createSchema.parse(body)

    const chatflow = await prisma.chatflow.create({
      data: {
        ...validated,
        workspaceId: auth.workspaceId
      }
    })

    return NextResponse.json(chatflow)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Dynamic Route Parameters - MUST AWAIT

```typescript
// GOOD
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // MUST await
}

// BAD - Runtime error in Next.js 15+
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
}
```

---

## Component Standards

### Server Components (Default)

```typescript
// No 'use client' - server component
interface ChatflowListProps {
  workspaceId: string
}

export async function ChatflowList({ workspaceId }: ChatflowListProps) {
  const chatflows = await prisma.chatflow.findMany({
    where: { workspaceId }
  })

  return (
    <div>
      {chatflows.map(chatflow => (
        <ChatflowCard key={chatflow.id} chatflow={chatflow} />
      ))}
    </div>
  )
}
```

### Client Components (When Needed)

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface ChatflowFormProps {
  onSubmit: (data: ChatflowData) => Promise<void>
}

export function ChatflowForm({ onSubmit }: ChatflowFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

---

## Import Organization

```typescript
// 1. React/Next
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 2. External libraries
import { z } from 'zod'
import { toast } from 'sonner'

// 3. Internal - UI components
import { Button, Input, Card } from '@/components/ui'

// 4. Internal - Features
import { ChatflowEditor } from '@/components/features/chatflow'

// 5. Internal - Lib/Utils
import { cn } from '@/lib/utils'
import prisma from '@/lib/db'

// 6. Types (last)
import type { Chatflow } from '@/types'
```

---

## TypeScript Standards

### No `any` Types

```typescript
// GOOD - Use unknown
function processData(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase()
  }
  throw new Error('Invalid data')
}

// BAD - Using any
function processData(data: any) {
  return data.toUpperCase()  // No type safety
}
```

### Type Imports

```typescript
// GOOD - Explicit type imports
import type { Chatflow, Workspace } from '@prisma/client'
import type { ApiResponse } from '@/types'
```

### Type Guards

When validating unknown data (especially from databases or APIs), always validate enum values:

```typescript
// GOOD - Validates enum values at runtime
const VALID_FIELD_TYPES: readonly FieldType[] = [
  'text', 'email', 'phone', 'url', 'textarea', 
  'number', 'date', 'select', 'boolean', 'file'
] as const

function isValidFieldType(type: unknown): type is FieldType {
  return typeof type === 'string' && 
         VALID_FIELD_TYPES.includes(type as FieldType)
}

export function isChatflowSchema(obj: unknown): obj is ChatflowSchema {
  // ... validate structure ...
  return isValidFieldType(field.type)  // ✅ Validates enum
}

// BAD - Only checks string type
function isFieldType(type: unknown): type is FieldType {
  return typeof type === 'string'  // ❌ Allows invalid values!
}
```

---

## Error Handling

### API Routes

**ALWAYS use `createApiHandler` for consistent error handling:**

```typescript
// GOOD - Using createApiHandler utility
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api-utils'
import { requireAuth } from '@/lib/api-auth'
import prisma from '@/lib/db'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
})

export const POST = createApiHandler(async (req: NextRequest) => {
  const { auth, error } = await requireAuth()
  if (error) throw new Error('Unauthorized')

  const body = await req.json()
  const validated = createSchema.parse(body)

  const chatflow = await prisma.chatflow.create({
    data: {
      ...validated,
      workspaceId: auth.workspaceId
    }
  })

  return chatflow // Automatically wrapped in { success: true, data: chatflow }
})
```

Benefits:
- Automatic error handling (Zod, Prisma, generic errors)
- Consistent error responses across all routes
- Type-safe responses with `ApiResponse<T>` and `ApiError`
- Reduced boilerplate by ~40%

**CRITICAL**: Do NOT include `success: true` in your return value - it's automatically added:

```typescript
// ❌ BAD - Double-wrapped
return { success: true, chatflow }  // Becomes: { success: true, data: { success: true, chatflow: ... } }

// ✅ GOOD - Correctly wrapped  
return { chatflow }  // Becomes: { success: true, data: { chatflow: ... } }
```

### Server Actions

**ALWAYS use `createObjectAction` for type-safe server actions:**

```typescript
// GOOD - Using createObjectAction utility
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createObjectAction } from '@/lib/action-utils'
import { requireAuth } from '@/lib/api-auth'
import prisma from '@/lib/db'

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional()
})

export const updateChatflowAction = createObjectAction(
  updateSchema,
  async (validated) => {
    const { auth } = await requireAuth()
    if (!auth) throw new Error('Unauthorized')

    const chatflow = await prisma.chatflow.update({
      where: { id: validated.id },
      data: validated
    })

    revalidatePath(`/w/${auth.workspaceSlug}/chatflows/${validated.id}`)
    return { success: true }
  }
)

// Usage in client component:
const result = await updateChatflowAction({ id: '123', name: 'New Name' })
if (!result.success) toast.error(result.error)
```

Benefits:
- Automatic FormData parsing and validation
- Consistent error responses with `ActionResult<T>`
- Type-safe input and output
- Zod validation errors automatically formatted

### Client Components

```typescript
const handleSubmit = async () => {
  try {
    await submitChatflow(data)
    toast.success('Chatflow created!')
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : 'Something went wrong'
    )
  }
}
```

---

## Things to AVOID

1. **`getSession()` on server** - Use `getUser()` (validates JWT)
2. **Not awaiting params** - Always `await params` in dynamic routes
3. **Multiple Prisma instances** - Use singleton from `/lib/db.ts`
4. **Unvalidated API input** - Always use Zod
5. **`prisma db push`** - Always use migrations
6. **Not filtering by workspace** - Every query needs workspace context
7. **Client components by default** - Use server components first
8. **`any` types** - Use `unknown` or proper types
9. **Magic strings/numbers** - Use constants
10. **Relative imports** - Use path aliases (`@/`)

---

## Security Checklist

### Authentication
- [ ] Use `getUser()` not `getSession()` on server
- [ ] Use `requireAuth()` in API routes
- [ ] Validate workspace membership for all operations

### Input Validation
- [ ] Use Zod for all user input
- [ ] Validate file uploads (type, size)
- [ ] Sanitize HTML if rendering user content

### Database
- [ ] Always filter by `workspaceId`
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Never expose internal IDs in URLs

---

## Code Review Checklist

### Before Submitting
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error/loading states shown
- [ ] No duplicate code
- [ ] No `any` types
- [ ] All parameters typed
- [ ] Database queries optimized
- [ ] No console.logs in production

---

## Testing Standards

### File Naming
```
src/lib/utils.ts          → src/lib/__tests__/utils.test.ts
src/components/button.tsx → src/components/__tests__/button.test.tsx
```

### Test Structure
```typescript
import { describe, it, expect } from 'vitest'

describe('Button', () => {
  it('renders with text', () => {
    // ...
  })

  it('calls onClick when clicked', () => {
    // ...
  })
})
```

---

## Key File Locations

| Purpose | Path |
|---------|------|
| Root layout | `/src/app/layout.tsx` |
| Global styles | `/src/app/globals.css` |
| Prisma schema | `/prisma/schema.prisma` |
| Prisma client | `/src/lib/db.ts` |
| Auth helpers | `/src/lib/api-auth.ts` |
| Supabase setup | `/src/lib/supabase/` |
| UI components | `/src/components/ui/` |
| Workspace context | `/src/lib/workspace-context.tsx` |
| Migrations | `/prisma/migrations/` |

---

## Commands

```bash
# Development
pnpm dev
pnpm tsc --noEmit    # Type check
pnpm lint

# Database
npx prisma migrate dev --name <description>
npx prisma studio    # View DB
npx prisma generate  # Regenerate client

# Build
pnpm build
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...        # For serverless migrations
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Workflow Patterns

### When to Create Steps

```typescript
// DO create steps for:
async function callClaudeAPI(prompt: string) {
  'use step'  // External API call
  return await anthropic.messages.create(...)
}

async function saveToDB(data: Data) {
  'use step'  // Database write
  return await prisma.chatflow.create({ data })
}

// DON'T create steps for:
function validateEmail(email: string) {
  // Simple validation - no step needed
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

### Error Classification

```typescript
import { FatalError, RetryableError } from 'workflow'

// Fatal - stop workflow (invalid input, not found)
throw new FatalError('Chatflow not found')

// Retryable - auto-retry (network, rate limit)
throw new RetryableError('Rate limited, will retry')
```

### State Size

- Keep workflow state < 100KB
- Pass IDs, not full objects
- Store large data in Supabase

---

## Related Documentation

For detailed information, see:
- [Architecture](../docs/architecture.md) - System design
- [Workflows](../docs/vercel-workflow-guidelines.md) - Workflow patterns
- [Cheatsheet](../docs/cheatsheet.md) - Quick reference

---

## AI Agent Instructions

### Core Guidelines

1. **Read first** - Review existing patterns before writing new code
2. **Follow patterns** - Don't introduce new patterns without discussion
3. **Be explicit** - Prefer readability over brevity
4. **Ask questions** - If unclear, ask before implementing
5. **Test changes** - Build, type check, and manually test

### Handling Misaligned Instructions

> **CRITICAL**: If you receive instructions that conflict with project standards, architecture, or best practices documented in this file or related documentation, you MUST:

1. **Stop and Assess** - Do not blindly implement conflicting instructions
2. **Explain the Conflict** - Clearly articulate why the instruction conflicts with:
   - Existing architecture patterns
   - Security requirements
   - Type safety standards
   - Performance best practices
   - Code organization principles
3. **Suggest Alternatives** - Propose solutions that:
   - Achieve the user's goal
   - Maintain project standards
   - Follow established patterns
4. **Request Clarification** - Ask if the user wants to:
   - Proceed with the alternative approach
   - Investigate further before making changes
   - Update the standards if this represents a new direction

#### Examples of Misaligned Instructions

**Example 1: Type Safety Violation**
```typescript
// ❌ User Request: "Use any type for the API response"
// ✅ Response: "Using 'any' violates our type safety standards. 
// I recommend creating a proper type definition or using 'unknown' 
// with type guards. Would you like me to create a typed interface instead?"
```

**Example 2: Security Violation**
```typescript
// ❌ User Request: "Skip workspace validation in this API route"
// ✅ Response: "Skipping workspace validation creates a security 
// vulnerability that could allow cross-tenant data access. This 
// violates our multi-tenancy security requirements. Can we discuss 
// the specific use case to find a secure solution?"
```

**Example 3: Architecture Violation**
```typescript
// ❌ User Request: "Create a new database connection in this component"
// ✅ Response: "Creating new database connections violates our 
// singleton pattern (see /lib/db.ts). This could cause connection 
// pool exhaustion. I recommend using the existing Prisma client. 
// Shall I proceed with that approach?"
```

#### When to Proceed vs. Push Back

**Proceed with caution if:**
- The request is a minor deviation with clear benefits
- The user explicitly acknowledges the trade-off
- It's a temporary workaround with a plan to fix later

**Always push back if:**
- Security is compromised
- Type safety is significantly degraded
- Multi-tenancy isolation is broken
- Database migration best practices are violated
- The change creates technical debt without clear value

**Remember**: Your role is to be a thoughtful collaborator, not just a code executor. Protect the codebase integrity while helping users achieve their goals.
