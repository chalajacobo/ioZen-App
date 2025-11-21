# IoZen Documentation

## Quick Reference

| Doc | Description |
|-----|-------------|
| [Quick Reference](quick-reference.md) | Daily patterns and snippets |
| [Architecture](architecture.md) | System design, layers, patterns |
| [Standards](standards.md) | Coding standards for all developers |
| [AI Guidelines](AI-GUIDELINES.md) | AI agent instructions |
| [Workflows](vercel-workflow-guidelines.md) | Vercel Workflow patterns |
| [Cheatsheet](cheatsheet.md) | Common commands |
| [Vision](vision-product-philosophy.md) | Product philosophy |

## AI Agent Instructions

- **Claude Code**: See [app/CLAUDE.md](../app/CLAUDE.md)
- **AI Agents**: See [AI Guidelines](AI-GUIDELINES.md)
- **Other Developers**: See [Standards](standards.md)

## Stack

Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4 (shadcn/ui) + Prisma 6 + Supabase + Claude

## Key Principles

1. **Simplicity First** - Write for humans, not machines
2. **Consistency** - Follow established patterns
3. **Type Safety** - No `any` without justification
4. **Security** - Always filter by workspace, use `getUser()` not `getSession()`
