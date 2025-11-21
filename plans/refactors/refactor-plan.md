# Deep Refactor Implementation Plan - ioZen

**Goal**: Transform codebase into state-of-the-art, simple, elegant, and maintainable architecture
**Timeline**: 4-5 days
**Approach**: Security first, then incremental refactoring with tests after each phase

---

## Phase 0: Security Fixes (3-4 hours) 🔴 CRITICAL

**Goal**: Fix authentication vulnerabilities in API routes

### 0.1 Add Authentication to Vulnerable Routes

**CRITICAL**: These routes have NO authentication and bypass workspace isolation:

| Route | Required Fix |
|-------|--------------|
| `api/chatflow/[id]/route.ts` | Add `requireAuth()` + workspace validation |
| `api/chatflow/[id]/submissions/route.ts` | Add `requireAuth()` + workspace validation |
| `api/chatflow/generate/[id]/route.ts` | Add `requireAuth()` + workspace validation |
| `api/chatflow/submission/update/route.ts` | Add `requireAuth()` + workspace validation |
| `api/chatflow/submit/route.ts` | Validate chatflow is published, add rate limiting |

**Implementation for each route**:

```typescript
import { requireAuth } from '@/lib/api-auth'
import prisma from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  // Verify workspace ownership
  const chatflow = await prisma.chatflow.findFirst({
    where: {
      id,
      workspaceId: auth.workspaceId  // Critical security check
    }
  })

  if (!chatflow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(chatflow)
}
```

### 0.2 Delete Test Endpoints

```bash
rm src/app/api/test-db/route.ts
rm src/app/api/test-workflow/route.ts
```

**Why**: These expose database structure and environment information.

### 0.3 Verification

```bash
# Test unauthorized access returns 401
curl -X GET http://localhost:3000/api/chatflow/[valid-id]
# Expected: 401 Unauthorized

# Test workspace isolation
# Login as User A, try to access User B's chatflow
# Expected: 404 Not Found
```

---

## Phase 1: Cleanup & Dead Code Removal (2-3 hours)

**Goal**: Remove all dead code and unused files

### 1.1 Delete Dead Route Groups

```bash
# Delete orphaned auth route group
rm -rf src/app/(auth)

# Verify no imports reference these files
grep -r "(auth)" src/
```

**Files to delete**:
- [DELETE] `src/app/(auth)/` - Entire directory (contains mock data and orphaned routes)
- [KEEP] `src/components/dashboard/chat-view.tsx` - Imported by chatflow-editor.tsx
- [DELETE] `src/app/api/chatflows/` - Duplicate directory

---

### 1.2 Clean Root Directory

```bash
# Delete empty/unused files
rm "Refactor plan.md"

# Choose package manager (pnpm recommended)
rm package-lock.json  # Keep pnpm-lock.yaml
```

---

### 1.3 Verification

```bash
# Build to ensure nothing broke
pnpm build

# Check for broken imports
pnpm tsc --noEmit
```

---

## Phase 2: Consolidate API Routes (3-4 hours)

**Goal**: Single source of truth for chatflow APIs

### 2.1 Merge Duplicate Routes

**Problem**: `/api/chatflow/generate` AND `/api/chatflows/generate`

**Solution**: Keep `/api/chatflow/*`, delete `/api/chatflows/*`

```bash
# Delete duplicate
rm -rf src/app/api/chatflows
```

**Update imports** in:
- Any client code calling `/api/chatflows/generate`

---

### 2.2 Restructure Chatflow API

**Current**:
```
api/chatflow/
├── [id]/route.ts
├── [id]/submissions/route.ts
├── generate/[id]/route.ts
├── generate/route.ts
├── publish/route.ts
├── route.ts
├── submission/update/route.ts
└── submit/route.ts
```

**Proposed** (RESTful):
```
api/chatflows/
├── route.ts                    # GET /api/chatflows (list), POST (create)
├── [id]/
│   ├── route.ts               # GET, PATCH, DELETE /api/chatflows/:id
│   ├── generate/route.ts      # POST /api/chatflows/:id/generate
│   ├── publish/route.ts       # POST /api/chatflows/:id/publish
│   └── submissions/
│       ├── route.ts           # GET, POST /api/chatflows/:id/submissions
│       └── [submissionId]/
│           └── route.ts       # GET, PATCH /api/chatflows/:id/submissions/:submissionId
└── submit/route.ts            # POST /api/chatflows/submit (public endpoint)
```

**Changes**:
1. Rename `chatflow` → `chatflows` (plural, RESTful convention)
2. Move `generate/[id]` → `[id]/generate`
3. Move `submission/update` → `[id]/submissions/[submissionId]`
4. Consolidate CRUD operations in `[id]/route.ts`

---

### 2.3 Create API Middleware

**New file**: `src/app/api/chatflows/_middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireWorkspace } from '@/lib/api-auth'

export async function withAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    const { auth, error } = await requireAuth()
    if (error) return error

    return handler(req, { ...context, auth })
  }
}

export async function withWorkspace(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    const { auth, error } = await requireAuth()
    if (error) return error

    const { id } = await context.params
    const chatflow = await prisma.chatflow.findUnique({
      where: { id },
      include: { workspace: true }
    })

    if (!chatflow) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        profileId_workspaceId: {
          profileId: auth.user.id,
          workspaceId: chatflow.workspaceId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler(req, { ...context, auth, chatflow, membership })
  }
}
```

**Usage**:
```typescript
export const GET = withWorkspace(async (req, { chatflow }) => {
  return NextResponse.json(chatflow)
})
```

---

## Phase 3: Reorganize Components (4-5 hours)

**Goal**: Feature-based component organization

### 3.1 New Structure

```
src/components/
├── features/
│   ├── chatflow/
│   │   ├── chatflow-editor.tsx
│   │   ├── field-item.tsx
│   │   ├── field-details-panel.tsx
│   │   └── index.ts
│   ├── chat/
│   │   ├── chat-view.tsx
│   │   ├── public-chat-view.tsx
│   │   └── index.ts
│   └── workspace/
│       ├── workspace-selector.tsx
│       └── index.ts
├── layout/
│   ├── container.tsx
│   ├── navigation.tsx
│   ├── page-header.tsx
│   └── index.ts
└── ui/
    ├── forms/
    │   ├── input.tsx
    │   ├── textarea.tsx
    │   ├── select.tsx
    │   └── index.ts
    ├── feedback/
    │   ├── alert-dialog.tsx
    │   ├── toast.tsx
    │   └── index.ts
    ├── data-display/
    │   ├── card.tsx
    │   ├── badge.tsx
    │   ├── avatar.tsx
    │   └── index.ts
    └── index.ts
```

---

### 3.2 Move Files

```bash
# Create new structure
mkdir -p src/components/features/{chatflow,chat,workspace}

# Move chatflow components
mv src/components/chatflow/chatflow-editor.tsx src/components/features/chatflow/
mv src/components/chatflow/field-item.tsx src/components/features/chatflow/
mv src/components/dashboard/field-details-panel.tsx src/components/features/chatflow/

# Move chat components
mv src/components/dashboard/chat-view.tsx src/components/features/chat/
mv src/components/public-chat-view.tsx src/components/features/chat/

# Delete old folders
rm -rf src/components/chatflow
rm -rf src/components/dashboard

# Create barrel exports
cat > src/components/features/chatflow/index.ts << 'EOF'
export { ChatflowEditor } from './chatflow-editor'
export { FieldItem } from './field-item'
export { FieldDetailsPanel } from './field-details-panel'
EOF
```

---

### 3.3 Organize UI Components

```bash
# Create subcategories
mkdir -p src/components/ui/{forms,feedback,data-display,navigation,layout}

# Move components (examples)
mv src/components/ui/input.tsx src/components/ui/forms/
mv src/components/ui/textarea.tsx src/components/ui/forms/
mv src/components/ui/select.tsx src/components/ui/forms/

mv src/components/ui/alert-dialog.tsx src/components/ui/feedback/
mv src/components/ui/toast.tsx src/components/ui/feedback/
mv src/components/ui/sonner.tsx src/components/ui/feedback/

mv src/components/ui/card.tsx src/components/ui/data-display/
mv src/components/ui/badge.tsx src/components/ui/data-display/
mv src/components/ui/avatar.tsx src/components/ui/data-display/
```

---

### 3.4 Update Imports

**Create path aliases** in [tsconfig.json](file:///Users/jacobomoreno/Dev/iozen/app/tsconfig.json):

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/components/features/*"],
      "@/ui/*": ["./src/components/ui/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

**Update imports**:
```typescript
// Before
import { ChatflowEditor } from '@/components/chatflow/chatflow-editor'

// After
import { ChatflowEditor } from '@/features/chatflow'
```

---

## Phase 4: Type System Enhancement (2-3 hours)

**Goal**: Centralized, strict TypeScript types

### 4.1 Create Types Directory

```bash
mkdir -p src/types
```

**New files**:

#### [NEW] [src/types/api.ts](file:///Users/jacobomoreno/Dev/iozen/app/src/types/api.ts)

```typescript
// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface ApiError {
  error: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
```

#### [NEW] [src/types/chatflow.ts](file:///Users/jacobomoreno/Dev/iozen/app/src/types/chatflow.ts)

```typescript
import type { Chatflow, ChatflowSubmission } from '@prisma/client'

export type ChatflowWithSubmissions = Chatflow & {
  _count: {
    submissions: number
  }
}

export type ChatflowWithWorkspace = Chatflow & {
  workspace: {
    id: string
    name: string
    slug: string
  }
}

export interface ChatflowField {
  id: string
  type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'file' | 'date'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface ChatflowSchema {
  fields: ChatflowField[]
  settings?: {
    theme?: 'light' | 'dark'
    submitButtonText?: string
  }
}
```

#### [NEW] [src/types/index.ts](file:///Users/jacobomoreno/Dev/iozen/app/src/types/index.ts)

```typescript
export * from './api'
export * from './chatflow'
export type { Profile, Workspace, WorkspaceMember } from '@prisma/client'
```

---

### 4.2 Update tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## Phase 5: Establish Code Patterns (3-4 hours)

**Goal**: Consistent patterns across codebase

### 5.1 API Route Template

**Create**: `src/lib/api-utils.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { ApiResponse, ApiError } from '@/types'

export function createApiHandler<T>(
  handler: (req: NextRequest, context: any) => Promise<T>
) {
  return async (req: NextRequest, context: any): Promise<NextResponse<ApiResponse<T> | ApiError>> => {
    try {
      const data = await handler(req, context)
      return NextResponse.json({ success: true, data })
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        )
      }

      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}
```

**Usage**:
```typescript
export const GET = createApiHandler(async (req, { params }) => {
  const { id } = await params
  const chatflow = await prisma.chatflow.findUnique({ where: { id } })
  if (!chatflow) throw new Error('Not found')
  return chatflow
})
```

---

### 5.2 Server Action Template

**Create**: `src/lib/action-utils.ts`

```typescript
import { z } from 'zod'
import type { ApiResponse } from '@/types'

export function createAction<T extends z.ZodType, R>(
  schema: T,
  handler: (data: z.infer<T>) => Promise<R>
): (formData: FormData) => Promise<ApiResponse<R>> {
  return async (formData: FormData) => {
    try {
      const rawData = Object.fromEntries(formData.entries())
      const validated = schema.parse(rawData)
      const result = await handler(validated)
      return { success: true, data: result }
    } catch (error) {
      console.error('Action Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
```

---

### 5.3 Component Template

**Create**: `.vscode/component.code-snippets`

```json
{
  "React Server Component": {
    "prefix": "rsc",
    "body": [
      "interface ${1:ComponentName}Props {",
      "  ${2:prop}: ${3:string}",
      "}",
      "",
      "export async function ${1:ComponentName}({ ${2:prop} }: ${1:ComponentName}Props) {",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  )",
      "}"
    ]
  },
  "React Client Component": {
    "prefix": "rcc",
    "body": [
      "'use client'",
      "",
      "import { useState } from 'react'",
      "",
      "interface ${1:ComponentName}Props {",
      "  ${2:prop}: ${3:string}",
      "}",
      "",
      "export function ${1:ComponentName}({ ${2:prop} }: ${1:ComponentName}Props) {",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  )",
      "}"
    ]
  }
}
```

---

## Phase 6: Add Testing Infrastructure (2-3 hours)

**Goal**: Basic test setup for future development

### 6.1 Install Dependencies

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
```

---

### 6.2 Create Test Configuration

#### [NEW] [vitest.config.ts](file:///Users/jacobomoreno/Dev/iozen/app/vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### [NEW] [src/test/setup.ts](file:///Users/jacobomoreno/Dev/iozen/app/src/test/setup.ts)

```typescript
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

---

### 6.3 Add Example Tests

#### [NEW] [src/lib/__tests__/utils.test.ts](file:///Users/jacobomoreno/Dev/iozen/app/src/lib/__tests__/utils.test.ts)

```typescript
import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })
})
```

---

### 6.4 Update package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Phase 7: Documentation & Standards (2 hours)

**Goal**: Clear guidelines for future development

### 7.1 Update CLAUDE.md

Add sections:
- Component organization rules
- API route patterns
- Testing requirements
- Import ordering

---

### 7.2 Create .env.example

```bash
cp .env .env.example
# Remove sensitive values, keep structure
```

---

### 7.3 Add CONTRIBUTING.md

**New file**: `CONTRIBUTING.md`

```markdown
# Contributing to ioZen

## Code Organization

- Features go in `src/components/features/`
- UI components in `src/components/ui/`
- API routes follow RESTful conventions
- Use barrel exports (`index.ts`)

## Naming Conventions

- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions: `camelCase`
- Types: `PascalCase`

## Before Committing

1. Run tests: `pnpm test`
2. Type check: `pnpm tsc --noEmit`
3. Lint: `pnpm lint`
4. Format: `pnpm format`
```

---

## Verification Checklist

After each phase:

```bash
# 1. Type check
pnpm tsc --noEmit

# 2. Build
pnpm build

# 3. Run tests
pnpm test

# 4. Lint
pnpm lint

# 5. Manual testing
pnpm dev
# Test: Login, create chatflow, view submissions
```

---

## Rollback Plan

If issues arise:

```bash
# Create backup before starting
git checkout -b refactor-backup
git add -A
git commit -m "Pre-refactor backup"

# If needed to rollback
git checkout main
git reset --hard refactor-backup
```

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Security vulnerabilities | 6 routes | 0 |
| Dead files | 6 | 0 |
| Route groups | 3 | 2 |
| API inconsistencies | 4 | 0 |
| Test coverage | 0% | >30% |
| Component organization | Flat | Feature-based |
| Type safety | Medium | High |
| `any` types | 9 | 0 |

---

## Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| 0. Security | 3-4h | 🔴 Critical |
| 1. Cleanup | 2-3h | 🔴 Critical |
| 2. API Routes | 3-4h | 🔴 Critical |
| 3. Components | 4-5h | 🟡 Important |
| 4. Types | 2-3h | 🟡 Important |
| 5. Patterns | 3-4h | 🟡 Important |
| 6. Testing | 2-3h | 🟡 Important |
| 7. Docs | 2h | 🟢 Nice to have |
| **Total** | **22-28h** | **4-5 days** |
