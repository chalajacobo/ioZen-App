# Coding Standards & Best Practices - ioZen

**Purpose**: Ensure all code contributions (human and AI) maintain state-of-the-art quality  
**Audience**: Developers, AI coding agents, code reviewers

---
## Project Overview

IoZen is an AI-powered platform that replaces traditional forms with intelligent chatflows powered by Anthropic's Claude API. Workspace-based multi-tenant architecture.

**Stack:** Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4 (shadcn/ui) + Prisma 6 + Supabase + Anthropic Claude

## Core Principles

### 1. Simplicity First
> "Simplicity is the ultimate sophistication" - Leonardo da Vinci

- **Write code for humans first, machines second**
- Prefer explicit over clever
- One responsibility per function/component
- If it needs a comment to explain, refactor it
- We create MSPs (minimum sellable products) not MVPs

### 2. Consistency Over Preference
- Follow established patterns, even if you prefer different ones
- Don't mix patterns in the same file
- When in doubt, match surrounding code

### 3. Type Safety is Non-Negotiable
- No `any` types without explicit justification
- All function parameters must be typed
- All API responses must be typed
- Use `unknown` instead of `any` when type is truly unknown

---

## File Organization Rules

### Directory Structure

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
│   │   ├── chatflow/      # Chatflow editor, fields, panels
│   │   ├── chat/          # Chat views (admin & public)
│   │   └── workspace/     # Workspace-related components
│   ├── layout/            # Layout components (nav, header, etc.)
│   └── ui/                # Reusable UI components (shadcn)
│       ├── button.tsx     # Universal button (root)
│       ├── forms/         # Input, textarea, select, checkbox, etc.
│       ├── feedback/      # Alert-dialog, sonner, progress, skeleton
│       ├── data-display/  # Card, badge, avatar, table, calendar
│       ├── layout/        # Dialog, sheet, panel, scroll-area
│       ├── overlays/      # Tooltip, dropdown-menu, popover, command
│       └── navigation/    # Tabs, toggle, toggle-group
├── lib/                   # Utilities and configurations
│   ├── supabase/
│   ├── api-auth.ts
│   ├── api-utils.ts
│   └── utils.ts
├── types/                 # TypeScript type definitions
│   ├── api.ts
│   ├── chatflow.ts
│   └── index.ts
└── workflows/             # Vercel Workflows
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files/Directories | `kebab-case` | [chatflow-editor.tsx](file:///Users/jacobomoreno/Dev/iozen/app/src/components/chatflow/chatflow-editor.tsx) |
| Components | `PascalCase` | `ChatflowEditor` |
| Functions/Variables | `camelCase` | `createChatflow` |
| Types/Interfaces | `PascalCase` | `ChatflowSchema` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE` |
| Database columns | `snake_case` | `created_at` |
| Private functions | `_camelCase` | `_validateInput` |

### File Naming Rules

```typescript
// ✅ GOOD
chatflow-editor.tsx          // Component
use-chatflow.ts              // Hook
api-utils.ts                 // Utility
chatflow.types.ts            // Types (if not in /types)

// ❌ BAD
ChatflowEditor.tsx           // PascalCase for files
chatflowEditor.tsx           // camelCase for files
chatflow_editor.tsx          // snake_case for files
```

---

## Component Standards

### Server Components (Default)

```typescript
// ✅ GOOD - Server component (no 'use client')
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
// ✅ GOOD - Client component with clear interactivity
'use client'

import { useState } from 'react'
import { Button } from '@/ui/forms'

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

### Component Organization

```typescript
// ✅ GOOD - Organized structure
'use client'

// 1. Imports (grouped)
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { Button, Input } from '@/ui/forms'
import { Card } from '@/ui/data-display'
import { cn } from '@/lib/utils'

import type { Chatflow } from '@/types'

// 2. Types/Interfaces
interface Props {
  chatflow: Chatflow
  onUpdate: (data: Partial<Chatflow>) => Promise<void>
}

// 3. Constants
const VALIDATION_SCHEMA = z.object({
  name: z.string().min(1)
})

// 4. Component
export function ChatflowEditor({ chatflow, onUpdate }: Props) {
  // Hooks first
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  // Effects
  useEffect(() => {
    // ...
  }, [])

  // Event handlers
  const handleSave = async () => {
    // ...
  }

  // Render
  return <div>...</div>
}

// 5. Sub-components (if small and not reusable)
function EditorToolbar() {
  return <div>...</div>
}
```

---

## API Route Standards

### RESTful Conventions

```
GET    /api/chatflows              # List all
POST   /api/chatflows              # Create new
GET    /api/chatflows/:id          # Get one
PATCH  /api/chatflows/:id          # Update
DELETE /api/chatflows/:id          # Delete
POST   /api/chatflows/:id/publish  # Action
GET    /api/chatflows/:id/submissions
```

### Standard API Route Template

```typescript
// ✅ GOOD - Using utilities
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api-utils'
import { requireAuth } from '@/lib/api-auth'
import prisma from '@/lib/db'
import type { ApiResponse } from '@/types'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
})

export const POST = createApiHandler(async (req: NextRequest) => {
  const { auth } = await requireAuth()
  
  const body = await req.json()
  const validated = createSchema.parse(body)

  const chatflow = await prisma.chatflow.create({
    data: {
      ...validated,
      workspaceId: auth.workspaceId
    }
  })

  return chatflow
})

export const GET = createApiHandler(async (req: NextRequest) => {
  const { auth } = await requireAuth()

  const chatflows = await prisma.chatflow.findMany({
    where: { workspaceId: auth.workspaceId },
    select: {
      id: true,
      name: true,
      status: true,
      _count: { select: { submissions: true } }
    }
  })

  return chatflows
})
```

**CRITICAL**: When using `createApiHandler`, **DO NOT** include `success: true` in your return value. The handler automatically wraps your response as `{ success: true, data: <your return> }`.

```typescript
// ❌ BAD - Double-wrapped response
export const PATCH = createApiHandler(async (req) => {
  const updated = await prisma.chatflow.update({ ... })
  return { 
    success: true,  // ❌ Creates { success: true, data: { success: true, ... } }
    chatflow: updated 
  }
})

// ✅ GOOD - Correctly wrapped
export const PATCH = createApiHandler(async (req) => {
  const updated = await prisma.chatflow.update({ ... })
  return { chatflow: updated }  // ✅ Becomes { success: true, data: { chatflow: ... } }
})
```

### Dynamic Route Parameters

```typescript
// ✅ GOOD - Always await params
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // MUST await
  // ...
}

// ❌ BAD - Not awaiting params
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }  // Wrong type
) {
  const { id } = params  // Runtime error in Next.js 15+
}
```

---

## Server Action Standards

### Standard Pattern

```typescript
// ✅ GOOD - Using action utility
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createAction } from '@/lib/action-utils'
import { requireAuth } from '@/lib/api-auth'
import prisma from '@/lib/db'

const updateChatflowSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).optional(),
  schema: z.record(z.any()).optional()
})

export const updateChatflowAction = createAction(
  updateChatflowSchema,
  async (data) => {
    const { auth } = await requireAuth()

    const chatflow = await prisma.chatflow.update({
      where: { id: data.id },
      data: {
        name: data.name,
        schema: data.schema
      }
    })

    revalidatePath(`/w/${auth.workspaceSlug}/chatflows/${data.id}`)

    return chatflow
  }
)
```

### Object-Based Actions (Preferred)

For programmatic calls from client components, use `createObjectAction` instead of `createAction`:

```typescript
// ✅ GOOD - Using createObjectAction for direct object passing
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createObjectAction } from '@/lib/action-utils'
import { requireAuth } from '@/lib/api-auth'
import prisma from '@/lib/db'

const updateChatflowSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  schema: z.record(z.unknown()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional()
})

export const updateChatflowAction = createObjectAction(
  updateChatflowSchema,
  async (validated) => {
    const { auth } = await requireAuth()
    if (!auth) throw new Error('Unauthorized')

    const chatflow = await prisma.chatflow.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        schema: validated.schema,
        status: validated.status
      }
    })

    revalidatePath(`/w/${auth.workspaceSlug}/chatflows/${validated.id}`)
    
    return { success: true }
  }
)

// Usage in client component:
const handleSave = async () => {
  const result = await updateChatflowAction({
    id: chatflow.id,
    name: chatflowName,
    schema: { fields }
  })
  
  if (!result.success) {
    toast.error(result.error)
  }
}
```

**When to use each:**
- Use `createAction` for traditional form submissions with `FormData`
- Use `createObjectAction` for programmatic calls from React components (preferred for modern apps)

---

## Real-time Subscription Standards

### Standard Pattern

```typescript
// ✅ GOOD - Clean real-time subscription
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface RealtimeMonitorProps {
  resourceId: string
  table: string
}

export function RealtimeMonitor({ resourceId, table }: RealtimeMonitorProps) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-${resourceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter: `id=eq.${resourceId}`
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [resourceId, table, router, supabase])

  return null
}
```

### Best Practices

1. **Always clean up subscriptions**
   ```typescript
   // ✅ GOOD - Cleanup in useEffect return
   return () => {
     supabase.removeChannel(channel)
   }
   ```

2. **Use specific filters**
   ```typescript
   // ✅ GOOD - Filter by specific ID
   filter: `id=eq.${chatflowId}`
   
   // ❌ BAD - Too broad
   filter: `workspaceId=eq.${workspaceId}`
   ```

3. **Trigger server re-fetch, don't update state directly**
   ```typescript
   // ✅ GOOD - Let server component handle data
   router.refresh()
   
   // ❌ BAD - Updating client state from real-time
   setData(payload.new)
   ```

4. **Use unique channel names**
   ```typescript
   // ✅ GOOD - Unique per resource
   .channel(`chatflow-${chatflowId}`)
   
   // ❌ BAD - Generic name
   .channel('updates')
   ```

### Real-time + Server Components Pattern

```typescript
// ✅ GOOD - Separation of concerns

// Server component (fetches data)
export default async function ChatflowPage({ params }) {
  const { id } = await params
  const chatflow = await getChatflow(id)
  
  return (
    <>
      <ChatflowMonitor chatflowId={id} />
      <ChatflowEditor chatflow={chatflow} />
    </>
  )
}

// Client component (monitors changes)
'use client'
function ChatflowMonitor({ chatflowId }: { chatflowId: string }) {
  // Real-time subscription logic
  return null
}
```

---

## Database & Prisma Standards

### Always Use Migrations

```bash
# ✅ GOOD
npx prisma migrate dev --name add_chatflow_status

# ❌ BAD - NEVER USE
npx prisma db push
```

### Query Optimization

```typescript
// ✅ GOOD - Select only needed fields
const chatflows = await prisma.chatflow.findMany({
  where: { workspaceId },
  select: {
    id: true,
    name: true,
    status: true,
    _count: {
      select: { submissions: true }
    }
  }
})

// ❌ BAD - Fetching all fields
const chatflows = await prisma.chatflow.findMany({
  where: { workspaceId }
})
```

### Multi-Tenancy

```typescript
// ✅ GOOD - Always filter by workspace
const chatflow = await prisma.chatflow.findFirst({
  where: {
    id: chatflowId,
    workspaceId: auth.workspaceId  // Security!
  }
})

// ❌ BAD - No workspace filter
const chatflow = await prisma.chatflow.findUnique({
  where: { id: chatflowId }
})
```

---

## TypeScript Standards

### Type Definitions

```typescript
// ✅ GOOD - Explicit types
interface ChatflowFormData {
  name: string
  description?: string
  fields: ChatflowField[]
}

function createChatflow(data: ChatflowFormData): Promise<Chatflow> {
  // ...
}

// ❌ BAD - Implicit any
function createChatflow(data) {
  // ...
}
```

### Avoid `any`

```typescript
// ✅ GOOD - Use unknown
function processData(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase()
  }
  throw new Error('Invalid data')
}

// ❌ BAD - Using any
function processData(data: any) {
  return data.toUpperCase()  // No type safety
}
```

### Type Imports

```typescript
// ✅ GOOD - Explicit type imports
import type { Chatflow, Workspace } from '@prisma/client'
import type { ApiResponse } from '@/types'

// ✅ ALSO GOOD - Mixed imports
import { useState } from 'react'
import type { FC } from 'react'
```

### Type Guards & Runtime Validation

Type guards provide runtime type safety for `unknown` values. **Always validate enum values** to prevent invalid data.

```typescript
// ✅ GOOD - Type guard with enum validation
const VALID_FIELD_TYPES: readonly FieldType[] = [
  'text',
  'email',
  'phone',
  'url',
  'textarea',
  'number',
  'date',
  'select',
  'boolean',
  'file'
] as const

function isValidFieldType(type: unknown): type is FieldType {
  return typeof type === 'string' && VALID_FIELD_TYPES.includes(type as FieldType)
}

// Use in complex type guard
export function isChatflowSchema(obj: unknown): obj is ChatflowSchema {
  if (!obj || typeof obj !== 'object') return false
  const schema = obj as Partial<ChatflowSchema>
  return (
    Array.isArray(schema.fields) &&
    schema.fields.every((field: unknown) => {
      if (!field || typeof field !== 'object') return false
      const f = field as Partial<ChatflowField>
      return (
        typeof f.id === 'string' &&
        isValidFieldType(f.type) &&  // ✅ Validates against enum
        typeof f.label === 'string' &&
        typeof f.name === 'string' &&
        typeof f.required === 'boolean'
      )
    })
  )
}

// ❌ BAD - Only checks if it's a string (allows invalid values)
export function isChatflowSchema(obj: unknown): obj is ChatflowSchema {
  // ...
  return typeof f.type === 'string'  // ❌ Doesn't validate enum values!
}
```

**Why This Matters:**
- Prevents invalid enum values from passing validation (e.g., 'long_text' instead of 'textarea')
- Catches data corruption or legacy data issues at runtime
- Provides better error messages for invalid data
- Essential for database `Json` fields that bypass TypeScript compile-time checks

---

## Import Organization

### Standard Order

```typescript
// 1. React/Next
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 2. External libraries
import { z } from 'zod'
import { toast } from 'sonner'

// 3. Internal - UI components
import { Button } from '@/ui/button'
import { Input, Textarea } from '@/ui/forms'
import { Card } from '@/ui/data-display'

// 4. Internal - Features
import { ChatflowEditor } from '@/features/chatflow'
import { ChatView } from '@/features/chat'

// 5. Internal - Lib/Utils
import { cn } from '@/lib/utils'
import prisma from '@/lib/db'

// 6. Types (last)
import type { Chatflow } from '@/types'
```

### Path Aliases

```typescript
// ✅ GOOD - Use aliases
import { Button } from '@/ui/button'
import { Input } from '@/ui/forms'
import { ChatflowEditor } from '@/features/chatflow'
import { createChatflow } from '@/lib/chatflow'
import type { Chatflow } from '@/types'

// ❌ BAD - Relative paths
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/forms/input'
```

---

## Error Handling

### API Routes

```typescript
// ✅ GOOD - Comprehensive error handling
export const POST = createApiHandler(async (req) => {
  try {
    const body = await req.json()
    const validated = schema.parse(body)
    
    const result = await someOperation(validated)
    return result
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Validation failed')
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Duplicate entry')
      }
    }
    throw error  // Re-throw unknown errors
  }
})
```

### Client Components

```typescript
// ✅ GOOD - User-friendly errors
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

## Testing Standards

### Test File Naming

```
src/lib/utils.ts          → src/lib/__tests__/utils.test.ts
src/components/button.tsx → src/components/__tests__/button.test.tsx
```

### Test Structure

```typescript
// ✅ GOOD - Descriptive tests
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    
    screen.getByText('Click').click()
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('shows loading state', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

---

## Performance Best Practices

### 1. Use Server Components by Default

```typescript
// ✅ GOOD - Server component for static content
export async function ChatflowList() {
  const chatflows = await getChatflows()
  return <div>{/* ... */}</div>
}

// ❌ BAD - Client component unnecessarily
'use client'
export function ChatflowList() {
  const [chatflows, setChatflows] = useState([])
  useEffect(() => {
    fetchChatflows().then(setChatflows)
  }, [])
  return <div>{/* ... */}</div>
}
```

### 2. Optimize Database Queries

```typescript
// ✅ GOOD - Select only needed fields
const chatflows = await prisma.chatflow.findMany({
  select: {
    id: true,
    name: true,
    status: true
  }
})

// ✅ GOOD - Use includes wisely
const chatflow = await prisma.chatflow.findUnique({
  where: { id },
  include: {
    _count: { select: { submissions: true } }
  }
})
```

### 3. Use Proper Caching

```typescript
// ✅ GOOD - Revalidate paths
import { revalidatePath } from 'next/cache'

export async function updateChatflow(id: string, data: any) {
  await prisma.chatflow.update({ where: { id }, data })
  revalidatePath(`/w/${workspaceSlug}/chatflows/${id}`)
}
```

---

## Security Checklist

### Authentication
- [ ] Always use [getUser()](file:///Users/jacobomoreno/Dev/iozen/app/src/lib/supabase/server.ts#51-67) not `getSession()` on server
- [ ] Use [requireAuth()](file:///Users/jacobomoreno/Dev/iozen/app/src/lib/supabase/server.ts#68-84) in API routes
- [ ] Validate workspace membership for all operations

### Input Validation
- [ ] Use Zod for all user input
- [ ] Validate file uploads (type, size)
- [ ] Sanitize HTML if rendering user content

### Database
- [ ] Always filter by `workspaceId`
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Never expose internal IDs in URLs (use slugs/shareUrls)

---

## Code Review Checklist

Before submitting code:

### Functionality
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error states handled
- [ ] Loading states shown

### Code Quality
- [ ] No duplicate code
- [ ] Functions are small and focused
- [ ] Naming is clear and descriptive
- [ ] No magic numbers/strings

### TypeScript
- [ ] No `any` types
- [ ] All parameters typed
- [ ] Return types specified
- [ ] Proper null checks

### Testing
- [ ] Unit tests added for utilities
- [ ] Component tests for complex logic
- [ ] Manual testing completed

### Verification
- [ ] Run `pnpm build` - should succeed
- [ ] Run `pnpm tsc --noEmit` - no errors
- [ ] Run `pnpm lint` - no new errors

### Performance
- [ ] No unnecessary re-renders
- [ ] Database queries optimized
- [ ] Images optimized
- [ ] No console.logs in production

### Documentation
- [ ] Complex logic commented
- [ ] README updated if needed
- [ ] API changes documented

---

## AI Agent Instructions

When an AI coding agent works on this codebase:

### 1. Always Read First
- Review existing patterns before writing new code
- Check [CLAUDE.md](file:///Users/jacobomoreno/Dev/iozen/app/CLAUDE.md) for project-specific rules
- Look at similar files for reference

### 2. Follow Established Patterns
- Don't introduce new patterns without discussion
- Match the style of surrounding code
- Use existing utilities instead of creating new ones

### 3. Be Explicit
- Don't use clever tricks or shortcuts
- Prefer readability over brevity
- Add comments for non-obvious logic

### 4. Ask Questions
- If requirements are unclear, ask
- If multiple approaches exist, present options
- If breaking changes needed, explain why

### 5. Test Your Changes
- Build the project (`npm run build`)
- Type check (`npm run tsc --noEmit`)
- Run tests if they exist
- Manually test the feature

---

## Common Pitfalls to Avoid

### 1. Not Awaiting Params in Dynamic Routes
```typescript
// ❌ BAD
export async function GET(req, { params }) {
  const { id } = params  // Error in Next.js 15+
}

// ✅ GOOD
export async function GET(req, { params }) {
  const { id } = await params
}
```

### 2. Using getSession() Instead of getUser()
```typescript
// ❌ BAD - Doesn't validate JWT
const { data: { session } } = await supabase.auth.getSession()

// ✅ GOOD - Validates JWT signature
const { data: { user } } = await supabase.auth.getUser()
```

### 3. Not Filtering by Workspace
```typescript
// ❌ BAD - Security vulnerability
const chatflow = await prisma.chatflow.findUnique({
  where: { id }
})

// ✅ GOOD - Multi-tenant safe
const chatflow = await prisma.chatflow.findFirst({
  where: { id, workspaceId }
})
```

### 4. Client Components by Default
```typescript
// ❌ BAD - Unnecessary client component
'use client'
export function StaticContent() {
  return <div>Hello</div>
}

// ✅ GOOD - Server component
export function StaticContent() {
  return <div>Hello</div>
}
```

---

## AI Agent Guidelines

### Handling Misaligned Instructions

> **CRITICAL**: If you receive instructions that conflict with project standards, architecture, or best practices documented in this file or related documentation, you MUST:

1. **Stop and Assess** - Do not blindly implement conflicting instructions
2. **Explain the Conflict** - Clearly articulate why the instruction conflicts with:
   - Existing architecture patterns
   - Security requirements (multi-tenancy, authentication, RLS)
   - Type safety standards (no `any` types)
   - Performance best practices
   - Code organization principles
   - Database migration requirements
3. **Suggest Alternatives** - Propose solutions that:
   - Achieve the user's goal
   - Maintain project standards
   - Follow established patterns
   - Preserve security and type safety
4. **Request Clarification** - Ask if the user wants to:
   - Proceed with the alternative approach
   - Investigate further before making changes
   - Update the standards if this represents a new direction

### Examples of Misaligned Instructions

**Example 1: Type Safety Violation**
```typescript
// ❌ User Request: "Use any type for the API response"
// ✅ Response: "Using 'any' violates our type safety standards (Core Principle #3). 
// I recommend creating a proper type definition or using 'unknown' with type guards. 
// Would you like me to create a typed interface instead?"
```

**Example 2: Security Violation**
```typescript
// ❌ User Request: "Skip workspace validation in this API route"
// ✅ Response: "Skipping workspace validation creates a security vulnerability 
// that could allow cross-tenant data access. This violates our multi-tenancy 
// security requirements (see Database & Prisma section). Can we discuss the 
// specific use case to find a secure solution?"
```

**Example 3: Database Migration Violation**
```typescript
// ❌ User Request: "Use prisma db push to update the schema"
// ✅ Response: "Using 'prisma db push' violates our migration best practices 
// (see Database section). This can cause data loss in production. I recommend 
// creating a proper migration with 'prisma migrate dev --name <description>'. 
// Shall I proceed with that approach?"
```

**Example 4: Architecture Violation**
```typescript
// ❌ User Request: "Create a new Prisma client instance in this component"
// ✅ Response: "Creating new database connections violates our singleton pattern 
// (see /lib/db.ts). This could cause connection pool exhaustion. I recommend 
// using the existing Prisma client. Shall I proceed with that approach?"
```

### When to Proceed vs. Push Back

**Proceed with caution if:**
- The user explicitly acknowledges the trade-off
- It's a temporary workaround with a documented plan to fix later

**Always push back if:**
- **Security is compromised** (workspace isolation, authentication, RLS)
- **Type safety is significantly degraded** (using `any`, skipping validation)
- **Multi-tenancy isolation is broken** (missing workspace filters)
- **Database migration best practices are violated** (using `db push`)
- **The change creates technical debt** without clear, documented value
- **Performance will be significantly impacted** (N+1 queries, missing indexes)

### Collaborative Approach

Remember: Your role is to be a **thoughtful collaborator**, not just a code executor. 

- **Protect codebase integrity** while helping users achieve their goals
- **Educate** by explaining why standards exist
- **Propose alternatives** that satisfy both requirements and standards
- **Be respectful** but firm on non-negotiable items (security, type safety)
- **Document exceptions** when standards must be bent for valid reasons

When in doubt, ask: **"Does this maintain our commitment to simplicity, security, and maintainability?"**

---

## Conclusion

These standards ensure:
- **Consistency** across the codebase
- **Maintainability** for future developers
- **Performance** for end users
- **Security** for all stakeholders
- **Quality** that stands the test of time

When in doubt, ask: "Is this simple, clear, and maintainable?"
