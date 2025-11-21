# Developer Quick Reference

**Stack**: Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4 + Prisma 6 + Supabase + Claude

---

## Common Patterns

### API Route

```typescript
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api-utils'
import { requireAuth } from '@/lib/api-auth'
import prisma from '@/lib/db'

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
})

export const POST = createApiHandler(async (req: NextRequest) => {
  const { auth } = await requireAuth()
  
  const body = await req.json()
  const validated = schema.parse(body)

  const chatflow = await prisma.chatflow.create({
    data: {
      ...validated,
      workspaceId: auth.workspaceId  // Always filter by workspace
    }
  })

  return chatflow  // Auto-wrapped as { success: true, data: chatflow }
})
```

**Key Points**:
- Use `createApiHandler` for automatic error handling
- Always call `requireAuth()` first
- Always filter by `workspaceId` for multi-tenancy
- Return data directly (handler wraps it)

---

### Server Action

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createObjectAction } from '@/lib/action-utils'
import { requireAuth } from '@/lib/api-auth'
import prisma from '@/lib/db'

const schema = z.object({
  id: z.string(),
  name: z.string().min(1)
})

export const updateChatflowAction = createObjectAction(
  schema,
  async (validated) => {
    const { auth } = await requireAuth()

    const chatflow = await prisma.chatflow.update({
      where: { id: validated.id },
      data: { name: validated.name }
    })

    revalidatePath(`/w/${auth.workspaceSlug}/chatflows/${validated.id}`)
    
    return { success: true }
  }
)
```

**Key Points**:
- Use `createObjectAction` for programmatic calls
- Use `createAction` for FormData submissions
- Always revalidate affected paths
- Return `{ success: true }` or throw error

---

### Server Component (Default)

```typescript
interface ChatflowListProps {
  workspaceId: string
}

export async function ChatflowList({ workspaceId }: ChatflowListProps) {
  const chatflows = await prisma.chatflow.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      status: true,
      _count: { select: { submissions: true } }
    }
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

**When to use**: Static content, data fetching, no interactivity

---

### Client Component

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/ui/button'

interface ChatflowFormProps {
  onSubmit: (data: FormData) => Promise<void>
}

export function ChatflowForm({ onSubmit }: ChatflowFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}
```

**When to use**: User interaction, state management, browser APIs

---

### Database Query

```typescript
// ✅ GOOD - Always filter by workspace
const chatflow = await prisma.chatflow.findFirst({
  where: {
    id: chatflowId,
    workspaceId: auth.workspaceId  // Critical for multi-tenancy
  },
  select: {
    id: true,
    name: true,
    schema: true  // Only select needed fields
  }
})

// ❌ BAD - No workspace filter (security vulnerability)
const chatflow = await prisma.chatflow.findUnique({
  where: { id: chatflowId }
})
```

---

### Real-time Subscription

```typescript
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function ChatflowMonitor({ chatflowId }: { chatflowId: string }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`chatflow-${chatflowId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Chatflow',
          filter: `id=eq.${chatflowId}`
        },
        () => router.refresh()  // Trigger server component re-fetch
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatflowId, router, supabase])

  return null
}
```

---

## Security Checklist

Before merging any code:

- [ ] Use `requireAuth()` in all API routes
- [ ] Filter all queries by `workspaceId`
- [ ] Validate all input with Zod
- [ ] Use `getUser()` not `getSession()` on server
- [ ] Never expose internal IDs in public URLs

---

## Import Order

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

---

## File Organization

```
app/
├── (app)/              # Authenticated routes
├── (public)/           # Public routes (login, signup)
├── api/                # API routes
└── actions/            # Server actions

components/
├── features/           # Feature-specific components
│   ├── chatflow/       # Chatflow editor, fields, panels
│   ├── chat/           # Chat views (admin & public)
│   └── workspace/      # Workspace-related components
├── layout/             # Navigation, containers, headers
└── ui/                 # Reusable UI components (shadcn)
    ├── button.tsx      # Universal button (root)
    ├── forms/          # Input, textarea, select, checkbox
    ├── feedback/       # Alert-dialog, sonner, progress
    ├── data-display/   # Card, badge, avatar, table
    ├── layout/         # Dialog, sheet, panel, scroll-area
    ├── overlays/       # Tooltip, dropdown-menu, popover
    └── navigation/     # Tabs, toggle, toggle-group

lib/
├── supabase/           # Auth clients
├── api-auth.ts         # Auth helpers
├── api-utils.ts        # API handler utilities
├── action-utils.ts     # Server action utilities
├── db.ts               # Prisma singleton
└── utils.ts            # General utilities

types/
├── api.ts              # API response types
├── chatflow.ts         # Chatflow domain types
├── workspace.ts        # Workspace types
└── index.ts            # Barrel export
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

---

## Testing Patterns

### Unit Test (Utility Function)

```typescript
import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })
  
  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar')).toBe('foo')
  })
})
```

### Component Test

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import { Button } from '../button'
import userEvent from '@testing-library/user-event'

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click</Button>)
    await user.click(screen.getByText('Click'))
    
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

### API Handler Test

```typescript
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { createApiHandler } from '../api-utils'

describe('createApiHandler', () => {
  it('returns success response', async () => {
    const handler = createApiHandler(async () => ({
      message: 'Success'
    }))
    
    const req = new NextRequest('http://localhost/api/test')
    const response = await handler(req)
    const data = await response.json()
    
    expect(data).toEqual({
      success: true,
      data: { message: 'Success' }
    })
  })
})
```

### Test Factory

```typescript
import { ProfileFactory } from '@/test/factories'

// Create test data with builder pattern
const profile = new ProfileFactory()
  .withEmail('test@example.com')
  .withName('Test User')
  .build()
```

---

## Common Commands

```bash
# Development
cd /Users/jacobomoreno/Dev/iozen/app
pnpm dev
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm tsc --noEmit          # Type check
pnpm lint                   # Lint code

# Database
npx prisma studio           # View data
npx prisma migrate dev --name description  # Create migration
npx prisma generate         # Regenerate client

# Testing
pnpm test                   # Run tests (watch mode)
pnpm test:ui                # Test UI (visual)
pnpm test:run               # Run once (CI)
pnpm test:coverage          # With coverage report
```

---

## Decision Trees

### Server vs Client Component?

```
Need user interaction (clicks, state, effects)?
├─ Yes → Client Component ('use client')
└─ No → Server Component (default)
```

### When to use Workflows?

```
Operation duration?
├─ >30 seconds → Vercel Workflow
├─ 5-30 seconds → Background job
└─ <5 seconds → Direct execution
```

### When to use Real-time?

```
Need instant UI updates?
├─ Yes + Long operation → Real-time subscription
├─ Yes + User action → Optimistic update
└─ No → Server component refresh
```

---

## Quick Links

- [Full Standards](./standards.md) - Complete coding standards
- [Architecture](./architecture.md) - System design and patterns
- [AI Guidelines](./AI-GUIDELINES.md) - AI agent instructions
- [Workflows](./vercel-workflow-guidelines.md) - Vercel Workflow patterns
- [Cheatsheet](./cheatsheet.md) - Command reference
