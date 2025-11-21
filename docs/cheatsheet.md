# Developer Cheatsheet

## Daily Commands

```bash
# Start dev
cd app && pnpm dev

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Build
pnpm build
```

## Git

```bash
# Status
git status

# New feature
git checkout -b feature/my-feature

# Save work
git add .
git commit -m "Add feature"
git push

# Update from main
git checkout main
git pull
git checkout feature/my-feature
git merge main
```

## Database

```bash
# View data
npx prisma studio

# Create migration
npx prisma migrate dev --name description

# Regenerate client
npx prisma generate

# Reset (destroys data)
npx prisma migrate reset
```

## Fixes

```bash
# Clear cache
rm -rf .next && pnpm dev

# Port in use
lsof -ti:3000 | xargs kill -9

# TypeScript errors
# Cursor: Cmd+Shift+P → "TypeScript: Restart TS Server"

# Everything broken
rm -rf node_modules .next
pnpm install
pnpm dev
```

## Prisma Queries

```typescript
// Find many
await prisma.chatflow.findMany({
  where: { workspaceId },
  select: { id: true, name: true }
})

// Find one
await prisma.chatflow.findUnique({
  where: { id }
})

// Create
await prisma.chatflow.create({
  data: { name, workspaceId }
})

// Update
await prisma.chatflow.update({
  where: { id },
  data: { name }
})

// Delete
await prisma.chatflow.delete({
  where: { id }
})
```

## API Route Template

```typescript
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth'

const schema = z.object({ name: z.string().min(1) })

export async function POST(req: Request) {
  const { auth, error } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const data = schema.parse(body)

  // Always filter by workspace
  const result = await prisma.chatflow.create({
    data: { ...data, workspaceId: auth.workspaceId }
  })

  return NextResponse.json(result)
}
```

## Environment Variables

```bash
# Server-side
process.env.DATABASE_URL
process.env.ANTHROPIC_API_KEY

# Client-side (must have NEXT_PUBLIC_ prefix)
process.env.NEXT_PUBLIC_SUPABASE_URL
```
