# Changelog

All notable changes to the ioZen project architecture and codebase.

---

## [2025-11-21] Documentation Refactor

### Changed
- **Restructured documentation** into 3-tier hierarchy for improved clarity
- **Split `coding-standards.md`** into focused files:
  - `standards.md` - Core coding standards (simplified from 1,135 → 400 lines)
  - `AI-GUIDELINES.md` - AI agent-specific instructions
  - `quick-reference.md` - Daily development patterns
- **Enhanced `architecture.md`** with visual decision trees and diagrams
- **Reduced total documentation** by 30% while preserving all critical information

### Added
- `docs/quick-reference.md` - Single-page reference for common patterns
- `docs/AI-GUIDELINES.md` - Dedicated AI agent guidelines
- `CHANGELOG.md` - This file, tracking major changes

### Removed
- `plans/refactors/diagnosis.md` - Outdated codebase analysis
- `plans/refactors/refactor-plan.md` - Completed refactor plan
- `app/Refactor plan.md` - Duplicate planning document

---

## [2025-11-20] Phase 1-5: Major Codebase Refactor

### Security Fixes (Phase 0)
- **Fixed 6 unauthenticated API routes** - Added `requireAuth()` and workspace validation
- **Deleted test endpoints** - Removed `api/test-db` and `api/test-workflow`
- **Verified workspace isolation** - All routes now properly filter by `workspaceId`

### Cleanup (Phase 1)
- **Removed dead code** - Deleted orphaned `(auth)` route group
- **Consolidated package managers** - Removed `package-lock.json`, kept `pnpm-lock.yaml`
- **Deleted duplicate routes** - Removed `api/chatflows/` duplicate directory

### API Consolidation (Phase 2)
- **Renamed routes** - `api/chatflow/*` → `api/chatflows/*` (plural, RESTful)
- **Restructured endpoints** - Organized into logical hierarchy
- **Standardized patterns** - All routes use consistent auth and error handling

### Component Reorganization (Phase 3)
- **Feature-based structure** - Moved components to `features/chatflow`, `features/chat`
- **Organized UI components** - Categorized into `forms/`, `feedback/`, `data-display/`, etc.
- **Added barrel exports** - Created `index.ts` files for cleaner imports
- **Updated path aliases** - Added `@/features/*` and `@/ui/*` aliases

### Bug Fixes (Post-Phase 3)
- **Added publish success dialog** - Replaced simple toast with full-featured modal
- **Fixed loading state** - Created skeleton for chatflow editor during AI generation
- **Resolved hydration error** - Fixed DndKit SSR/client mismatch

### Type System Enhancement (Phase 4)
- **Created centralized types** - Added `types/api.ts`, `types/chatflow.ts`, `types/workspace.ts`
- **Enabled strict TypeScript** - Set `strict: true`, `noUncheckedIndexedAccess: true`
- **Eliminated `any` types** - Replaced with proper types across codebase
- **Added runtime validation** - Created type guards with enum validation for `ChatflowSchema`

### Code Patterns (Phase 5)
- **Created utilities** - Added `createApiHandler`, `createAction`, `createObjectAction`
- **Refactored API routes** - Reduced boilerplate by ~40% using new utilities
- **Added code snippets** - Created VSCode snippets for common patterns
- **Standardized error handling** - Centralized error handling in utilities

---

## Future Changes

Track upcoming major changes here:

- [ ] Testing infrastructure (Phase 6)
- [ ] Real-time auto-refresh for chatflow generation
- [ ] Enhanced monitoring and observability
- [ ] Performance optimizations

---

## Notes

This changelog tracks **architectural and structural changes** only. For detailed commit history, see git log.

**Format**: Based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
