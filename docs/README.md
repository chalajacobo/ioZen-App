# IoZen Documentation

## Quick Reference

| Doc | Description |
|-----|-------------|
| [Architecture](architecture.md) | System design, layers, patterns |
| [Coding Standards](coding-standards.md) | Code conventions for all agents |
| [Workflows](vercel-workflow-guidelines.md) | Vercel Workflow patterns |
| [Cheatsheet](cheatsheet.md) | Common commands |
| [Vision](vision-product-philosophy.md) | Product philosophy |

## AI Agent Instructions

- **Claude Code**: See [app/CLAUDE.md](../app/CLAUDE.md)
- **Other Agents/Humans**: See [Coding Standards](coding-standards.md)

## Stack

Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4 (shadcn/ui) + Prisma 6 + Supabase + Claude

## Key Principles

1. **Simplicity First** - Write for humans, not machines
2. **Consistency** - Follow established patterns
3. **Type Safety** - No `any` without justification
4. **Security** - Always filter by workspace, use `getUser()` not `getSession()`
