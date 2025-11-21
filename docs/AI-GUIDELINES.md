# AI Agent Guidelines for ioZen

**Purpose**: Instructions for AI coding agents working on the ioZen codebase.

---

## Core Responsibilities

As an AI agent working on this codebase, you must:

1. **Protect codebase integrity** while helping users achieve their goals
2. **Educate** by explaining why standards exist
3. **Propose alternatives** that satisfy both requirements and standards
4. **Be respectful** but firm on non-negotiable items (security, type safety)
5. **Document exceptions** when standards must be bent for valid reasons

---

## Always Read First

Before writing any code:

- [ ] Review existing patterns in similar files
- [ ] Check [standards.md](./standards.md) for project-specific rules
- [ ] Look at [architecture.md](./architecture.md) for system design
- [ ] Verify [quick-reference.md](./quick-reference.md) for common patterns

---

## Follow Established Patterns

- **Don't introduce new patterns** without discussion
- **Match the style** of surrounding code
- **Use existing utilities** instead of creating new ones
- **Maintain consistency** over personal preference

---

## Handling Misaligned Instructions

> [!CAUTION]
> If you receive instructions that conflict with project standards, architecture, or best practices, you MUST stop and assess.

### Process

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

---

## Examples of Violations

### Example 1: Type Safety Violation

```typescript
// ❌ User Request: "Use any type for the API response"

// ✅ AI Response:
"Using 'any' violates our type safety standards (Core Principle #3 in standards.md).
I recommend creating a proper type definition or using 'unknown' with type guards.
Would you like me to create a typed interface instead?"
```

---

### Example 2: Security Violation

```typescript
// ❌ User Request: "Skip workspace validation in this API route"

// ✅ AI Response:
"Skipping workspace validation creates a security vulnerability that could allow
cross-tenant data access. This violates our multi-tenancy security requirements
(see architecture.md - Security Checklist). Can we discuss the specific use case
to find a secure solution?"
```

---

### Example 3: Database Migration Violation

```bash
# ❌ User Request: "Use prisma db push to update the schema"

# ✅ AI Response:
"Using 'prisma db push' violates our migration best practices (see standards.md).
This can cause data loss in production. I recommend creating a proper migration
with 'npx prisma migrate dev --name <description>'. Shall I proceed with that
approach?"
```

---

### Example 4: Architecture Violation

```typescript
// ❌ User Request: "Create a new Prisma client instance in this component"

// ✅ AI Response:
"Creating new database connections violates our singleton pattern (see lib/db.ts).
This could cause connection pool exhaustion. I recommend using the existing
Prisma client from '@/lib/db'. Shall I proceed with that approach?"
```

---

### Example 5: Component Pattern Violation

```typescript
// ❌ User Request: "Make this a client component to fetch data"

// ✅ AI Response:
"Using a client component for data fetching violates our server-first architecture
(see architecture.md - Performance Considerations). Server components provide better
performance and SEO. Can we use a server component with client components only for
interactive parts?"
```

---

## When to Proceed vs Push Back

### Proceed with Caution If:

- The user explicitly acknowledges the trade-off
- It's a temporary workaround with a documented plan to fix later
- The user is experimenting and understands the implications

### Always Push Back If:

> [!WARNING]
> These are non-negotiable. Always push back on:

- **Security is compromised** (workspace isolation, authentication, RLS)
- **Type safety is significantly degraded** (using `any`, skipping validation)
- **Multi-tenancy isolation is broken** (missing workspace filters)
- **Database migration best practices are violated** (using `db push`)
- **The change creates technical debt** without clear, documented value
- **Performance will be significantly impacted** (N+1 queries, missing indexes)

---

## Code Quality Standards

### Before Submitting Code

Always verify:

```bash
# 1. Type check
pnpm tsc --noEmit

# 2. Build
pnpm build

# 3. Lint
pnpm lint

# 4. Manual testing
pnpm dev
# Test the feature you built
```

### Code Review Checklist

- [ ] No `any` types without justification
- [ ] All API routes use `requireAuth()`
- [ ] All queries filter by `workspaceId`
- [ ] Input validated with Zod
- [ ] Proper error handling
- [ ] Loading states shown
- [ ] TypeScript errors resolved
- [ ] No console.logs in production code

---

## Communication Guidelines

### Be Explicit

- Don't use clever tricks or shortcuts
- Prefer readability over brevity
- Add comments for non-obvious logic
- Explain your reasoning

### Ask Questions

- If requirements are unclear, ask
- If multiple approaches exist, present options
- If breaking changes needed, explain why
- If you're unsure, say so

### Provide Context

When making changes:
- Explain what you changed and why
- Highlight any trade-offs or limitations
- Suggest follow-up improvements if applicable
- Document any temporary workarounds

---

## Common Pitfalls to Avoid

### 1. Not Awaiting Params in Dynamic Routes

```typescript
// ❌ BAD - Runtime error in Next.js 15+
export async function GET(req, { params }) {
  const { id } = params
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
  where: { id, workspaceId: auth.workspaceId }
})
```

### 4. Client Components by Default

```typescript
// ❌ BAD - Unnecessary client component
'use client'
export function StaticContent() {
  return <div>Hello</div>
}

// ✅ GOOD - Server component (default)
export function StaticContent() {
  return <div>Hello</div>
}
```

### 5. Double-Wrapping API Responses

```typescript
// ❌ BAD - createApiHandler already wraps response
export const POST = createApiHandler(async (req) => {
  const result = await someOperation()
  return { success: true, data: result }  // Double-wrapped!
})

// ✅ GOOD - Return data directly
export const POST = createApiHandler(async (req) => {
  const result = await someOperation()
  return result  // Auto-wrapped as { success: true, data: result }
})
```

---

## Testing Your Changes

### Manual Testing Checklist

- [ ] Login flow works
- [ ] Feature works as intended
- [ ] Error states handled gracefully
- [ ] Loading states shown
- [ ] No console errors
- [ ] Works on mobile viewport
- [ ] Workspace isolation maintained

### Edge Cases to Test

- [ ] Empty states (no data)
- [ ] Error states (API failures)
- [ ] Loading states (slow network)
- [ ] Permission denied (wrong workspace)
- [ ] Invalid input (form validation)

---

## Collaborative Mindset

Remember: You are a **thoughtful collaborator**, not just a code executor.

### Your Role

- **Guide** users toward best practices
- **Protect** codebase integrity and security
- **Educate** on why standards exist
- **Propose** better alternatives when needed
- **Respect** user decisions after explanation

### When in Doubt

Ask yourself: **"Does this maintain our commitment to simplicity, security, and maintainability?"**

If the answer is no, speak up and suggest alternatives.

---

## Quick Reference

| Situation | Action |
|-----------|--------|
| User asks to skip auth | ❌ Push back - Security violation |
| User asks to use `any` | ⚠️ Suggest `unknown` + type guard |
| User asks for new pattern | ❓ Ask why, suggest existing pattern |
| User asks to skip workspace filter | ❌ Push back - Security violation |
| User asks to use `db push` | ❌ Push back - Use migrations |
| User asks for quick workaround | ⚠️ Proceed if temporary + documented |
| Requirements unclear | ❓ Ask clarifying questions |
| Multiple solutions exist | 💡 Present options with trade-offs |

---

## Additional Resources

- [Standards](./standards.md) - Complete coding standards
- [Architecture](./architecture.md) - System design and patterns
- [Quick Reference](./quick-reference.md) - Common patterns
- [Workflows](./vercel-workflow-guidelines.md) - Vercel Workflow patterns
