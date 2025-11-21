# Coding Standards - ioZen

**Purpose**: Core coding standards for all contributors  
**Audience**: Developers working on ioZen

---

## Core Principles

### 1. Simplicity First
> "Simplicity is the ultimate sophistication" - Leonardo da Vinci

- Write code for humans first, machines second
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

## File Organization

### Directory Structure

```
app/
├── (app)/              # Authenticated routes
├── (public)/           # Public routes
├── api/                # API routes
└── actions/            # Server actions

components/
├── features/           # Feature-specific components
│   ├── chatflow/       # Chatflow editor, fields, panels
│   ├── chat/           # Chat views (admin & public)
│   └── workspace/      # Workspace-related
├── layout/             # Navigation, containers, headers
└── ui/                 # Reusable UI components (shadcn)
    ├── button.tsx      # Universal button
    ├── forms/          # Input, textarea, select
    ├── feedback/       # Alert-dialog, sonner, progress
    ├── data-display/   # Card, badge, avatar, table
    ├── layout/         # Dialog, sheet, panel
    ├── overlays/       # Tooltip, dropdown-menu, popover
    └── navigation/     # Tabs, toggle, toggle-group

lib/
├── supabase/           # Auth clients
├── api-auth.ts         # Auth helpers
├── api-utils.ts        # API utilities
├── action-utils.ts     # Server action utilities
├── db.ts               # Prisma singleton
└── utils.ts            # General utilities

types/
├── api.ts              # API response types
├── chatflow.ts         # Chatflow domain types
└── index.ts            # Barrel export
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files/Directories | `kebab-case` | `chatflow-editor.tsx` |
| Components | `PascalCase` | `ChatflowEditor` |
| Functions/Variables | `camelCase` | `createChatflow` |
| Types/Interfaces | `PascalCase` | `ChatflowSchema` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE` |
| Database columns | `snake_case` | `created_at` |

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

Use `'use client'` only when you need:
- User interaction (clicks, form input)
- Browser APIs (localStorage, window)
- React hooks (useState, useEffect)
- Event handlers

```typescript
// ✅ GOOD - Client component with clear interactivity
'use client'

import { useState } from 'react'
import { Button } from '@/ui/button'

export function ChatflowForm({ onSubmit }: Props) {
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
```

---

## API Route Standards

### Standard Pattern

```typescript
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
  const { auth } = await requireAuth()
  
  const body = await req.json()
  const validated = createSchema.parse(body)

  const chatflow = await prisma.chatflow.create({
    data: {
      ...validated,
      workspaceId: auth.workspaceId  // Always filter by workspace
    }
  })

  return chatflow  // Auto-wrapped as { success: true, data: chatflow }
})
```

**CRITICAL**: When using `createApiHandler`, **DO NOT** include `success: true` in your return value. The handler automatically wraps your response.

```typescript
// ❌ BAD - Double-wrapped response
return { success: true, chatflow: updated }

// ✅ GOOD - Correctly wrapped
return { chatflow: updated }
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
```

---

## Server Action Standards

### Object-Based Actions (Preferred)

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createObjectAction } from '@/lib/action-utils'
import { requireAuth } from '@/lib/api-auth'
import prisma from '@/lib/db'

const updateChatflowSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  schema: z.record(z.unknown()).optional()
})

export const updateChatflowAction = createObjectAction(
  updateChatflowSchema,
  async (validated) => {
    const { auth } = await requireAuth()

    const chatflow = await prisma.chatflow.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        schema: validated.schema
      }
    })

    revalidatePath(`/w/${auth.workspaceSlug}/chatflows/${validated.id}`)
    
    return { success: true }
  }
)
```

**When to use each:**
- Use `createAction` for traditional form submissions with `FormData`
- Use `createObjectAction` for programmatic calls from React components (preferred)

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

### Multi-Tenancy (CRITICAL)

```typescript
// ✅ GOOD - Always filter by workspace
const chatflow = await prisma.chatflow.findFirst({
  where: {
    id: chatflowId,
    workspaceId: auth.workspaceId  // Security!
  }
})

// ❌ BAD - No workspace filter (SECURITY VULNERABILITY)
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

### Type Guards & Runtime Validation

Type guards provide runtime type safety for `unknown` values. **Always validate enum values** to prevent invalid data.

```typescript
// ✅ GOOD - Type guard with enum validation
const VALID_FIELD_TYPES: readonly FieldType[] = [
  'text', 'email', 'phone', 'url', 'textarea',
  'number', 'date', 'select', 'boolean', 'file'
] as const

function isValidFieldType(type: unknown): type is FieldType {
  return typeof type === 'string' && VALID_FIELD_TYPES.includes(type as FieldType)
}

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
        typeof f.required === 'boolean'
      )
    })
  )
}
```

**Why This Matters:**
- Prevents invalid enum values from passing validation
- Catches data corruption or legacy data issues at runtime
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
import { ChatflowEditor } from '@/features/chatflow'
import type { Chatflow } from '@/types'

// ❌ BAD - Relative paths
import { Button } from '../../../components/ui/button'
```

---

## Error Handling

### API Routes

```typescript
export const POST = createApiHandler(async (req) => {
  const body = await req.json()
  const validated = schema.parse(body)  // Zod throws on validation error
  
  const result = await someOperation(validated)
  return result  // createApiHandler catches and formats errors
})
```

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

## Security Checklist

### Authentication
- [ ] Always use `getUser()` not `getSession()` on server
- [ ] Use `requireAuth()` in all API routes
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
import { revalidatePath } from 'next/cache'

export async function updateChatflow(id: string, data: any) {
  await prisma.chatflow.update({ where: { id }, data })
  revalidatePath(`/w/${workspaceSlug}/chatflows/${id}`)
}
```

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

### Verification
- [ ] Run `pnpm build` - should succeed
- [ ] Run `pnpm tsc --noEmit` - no errors
- [ ] Run `pnpm lint` - no new errors

### Performance
- [ ] No unnecessary re-renders
- [ ] Database queries optimized
- [ ] Images optimized
- [ ] No console.logs in production

---

## Common Pitfalls

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

## Additional Resources

- [Quick Reference](./quick-reference.md) - Common patterns and snippets
- [Architecture](./architecture.md) - System design and patterns
- [AI Guidelines](./AI-GUIDELINES.md) - AI agent instructions
- [Workflows](./vercel-workflow-guidelines.md) - Vercel Workflow patterns
- [Cheatsheet](./cheatsheet.md) - Command reference
