# Refactor Checklist - ioZen

Track your progress through the deep refactor. Check off items as you complete them.

---

## Phase 0: Security Fixes ⏱️ 3-4 hours 🔴 CRITICAL

### Add Authentication to Vulnerable Routes
- [x] Add `requireAuth()` + workspace validation to `api/chatflow/[id]/route.ts`
- [x] Add `requireAuth()` + workspace validation to `api/chatflow/[id]/submissions/route.ts`
- [x] Add `requireAuth()` + workspace validation to `api/chatflow/generate/[id]/route.ts`
- [x] Add `requireAuth()` + workspace validation to `api/chatflow/submission/update/route.ts`
- [x] Add validation (chatflow is published) to `api/chatflow/submit/route.ts`

### Delete Test Endpoints
- [x] Delete `src/app/api/test-db/route.ts`
- [x] Delete `src/app/api/test-workflow/route.ts`

### Verification
- [x] Test: Unauthenticated requests return 401
- [x] Test: Requests to other user's chatflows return 404
- [x] Test: Workspace isolation works correctly
- [x] Run `pnpm build` - should succeed

---

## Phase 1: Cleanup & Dead Code Removal ⏱️ 2-3 hours

### Dead Route Groups & Files
- [x] Delete entire `src/app/(auth)` directory
- [x] ~~Delete `src/components/dashboard/chat-view.tsx`~~ - **KEPT: imported by chatflow-editor.tsx**
- [x] Delete `src/app/api/chatflows/` directory (duplicate)
- [x] Search codebase for any references to `(auth)` routes
- [x] Verify no broken imports

### Root Directory Cleanup
- [x] Delete `package-lock.json` (keep `pnpm-lock.yaml`)

### Verification
- [x] Run `pnpm build` - should succeed
- [x] Run `pnpm tsc --noEmit` - no errors
- [x] Run `pnpm lint` - no new errors (Phase 1 scope files fixed)
- [x] Manual test: Login flow works (done by Jay)
- [x] Manual test: Dashboard loads (done by Jay)

---

## Phase 2: Consolidate API Routes ⏱️ 3-4 hours

### Remove Duplicates
- [x] Delete `src/app/api/chatflows/` directory (duplicate) - Done in Phase 1
- [x] Search for imports of `/api/chatflows/generate`
- [x] Update any client code to use `/api/chatflows/`

### Restructure to Plural Naming
- [x] Create new `src/app/api/chatflows/` directory (plural)
- [x] Move `api/chatflow/route.ts` → `api/chatflows/route.ts`
- [x] Move `api/chatflow/[id]/route.ts` → `api/chatflows/[id]/route.ts`
- [x] Move `api/chatflow/[id]/submissions/route.ts` → `api/chatflows/[id]/submissions/route.ts`
- [x] Move `api/chatflow/generate/route.ts` → `api/chatflows/generate/route.ts`
- [x] Move `api/chatflow/generate/[id]/route.ts` → `api/chatflows/generate/[id]/route.ts`
- [x] Move `api/chatflow/publish/route.ts` → `api/chatflows/publish/route.ts`
- [x] Move `api/chatflow/submission/update/route.ts` → `api/chatflows/submissions/update/route.ts`
- [x] Move `api/chatflow/submit/route.ts` → `api/chatflows/submit/route.ts`
- [x] Delete old `src/app/api/chatflow/` directory

### Update Client References
- [x] Search for `/api/chatflow` in codebase
- [x] Update to `/api/chatflows` (plural)
- [x] Update in `src/components/public-chat-view.tsx`

### Verification
- [x] Run `pnpm build` - successful
- [x] Test: Create new chatflow
- [x] Test: Edit chatflow
- [x] Test: View submissions
- [x] Test: Publish chatflow (working, but the success page when published is not apearing)
- [x] Test: Submit to public chatflow

**Note:** Skipped API utilities creation - can be added in Phase 5 (Code Patterns)

---

## Phase 3: Reorganize Components ✅

**Status**: COMPLETED  
**Priority**: High  
**Estimated Time**: 3-4 hours  
**Actual Time**: ~3 hours

### Directory Structure Created ✅
- [x] Created `src/components/features/chatflow/` directory
- [x] Created `src/components/features/chat/` directory
- [x] Created `src/components/features/workspace/` directory (for future use)
- [x] Created `src/components/ui/forms/` directory
- [x] Created `src/components/ui/feedback/` directory
- [x] Created `src/components/ui/data-display/` directory
- [x] Created `src/components/ui/layout/` directory
- [x] Created `src/components/ui/overlays/` directory
- [x] Created `src/components/ui/navigation/` directory

### Component Moves ✅
- [x] Moved `chatflow-editor.tsx` → `features/chatflow/`
- [x] Moved `field-item.tsx` → `features/chatflow/`
- [x] Moved `field-details-panel.tsx` → `features/chatflow/`
- [x] Moved `chat-view.tsx` → `features/chat/`
- [x] Moved `public-chat-view.tsx` → `features/chat/`
- [x] Moved all 29 UI components to semantic categories
- [x] Deleted old `components/chatflow/` directory
- [x] Deleted old `components/dashboard/` directory

### Barrel Exports ✅
- [x] Created `features/chatflow/index.ts`
- [x] Created `features/chat/index.ts`
- [x] Created `ui/forms/index.ts`
- [x] Created `ui/feedback/index.ts`
- [x] Created `ui/data-display/index.ts`
- [x] Created `ui/layout/index.ts`
- [x] Created `ui/overlays/index.ts`
- [x] Created `ui/navigation/index.ts`
- [x] Updated `ui/index.ts` to re-export from subcategories

### Path Aliases & Imports ✅
- [x] Added `@/features/*` alias to `tsconfig.json`
- [x] Added `@/ui/*` alias to `tsconfig.json`
- [x] Updated imports in all app pages (9 files)
- [x] Updated imports in all feature components (4 files)
- [x] Updated imports in layout components (2 files)
- [x] Updated imports in UI components (3 files)

### Documentation ✅
- [x] Updated `CLAUDE.md` directory structure
- [x] Updated `docs/architecture.md` directory structure
- [x] Updated `docs/coding-standards.md` with new import patterns

### Verification ✅
- [x] Run `pnpm tsc --noEmit` - **0 errors**
- [x] Run `pnpm build` - **successful (Exit code 0)**
- [x] All 23 routes compiled successfully

### Post-Phase 3 Improvements ✅

**Bug Fixes & UX Enhancements** (2025-11-21):

- [x] **Success Dialog** - Added publish success dialog with copy/open link buttons
  - Created Dialog component with success message, URL input, and action buttons
  - Replaced simple toast with full-featured success modal
  - File: `chatflow-editor.tsx`

- [x] **Loading State** - Fixed empty form during AI generation
  - Created `loading.tsx` skeleton for chatflow editor route
  - Shows proper loading UI during data fetching and AI generation
  - File: `app/(app)/w/[workspaceSlug]/chatflows/[id]/loading.tsx`

- [x] **Hydration Fix** - Resolved DndKit hydration mismatch error
  - Added `suppressHydrationWarning` to drag handle elements
  - Fixed `aria-describedby` SSR/client mismatch
  - File: `chatflow-editor.tsx`

---

- [x] Run `pnpm build` - successful
- [x] Test: All pages load correctly
- [x] Test: No console errors
- [x] Manual test: Login flow works (done by Jay)
- [x] Manual test: Dashboard loads (done by Jay)
- [x] Manual test: Create/edit chatflow works
- [x] Manual test: Public chat view works
- [x] Manual test: Publish chatflow (success dialog now working)

---

## Phase 4: Type System Enhancement ✅

**Status**: COMPLETED  
**Priority**: High  
**Estimated Time**: 2-3 hours  
**Actual Time**: ~2.5 hours

### Create Types Directory ✅
- [x] Create `src/types/` directory
- [x] Create `src/types/api.ts`
- [x] Create `src/types/chatflow.ts`
- [x] Create `src/types/workspace.ts`
- [x] Create `src/types/index.ts` barrel export

### Define API Types ✅
- [x] Add `ApiResponse<T>` interface
- [x] Add `ApiError` interface
- [x] Add `PaginatedResponse<T>` interface
- [x] Export from `types/api.ts`

### Define Domain Types ✅
- [x] Add `ChatflowWithCount` type
- [x] Add `ChatflowWithWorkspace` type
- [x] Add `ChatflowWithDetails` type
- [x] Add `ChatflowField` interface
- [x] Add `ChatflowSchema` interface
- [x] Add `SubmissionData` type
- [x] Export Prisma types from `types/index.ts`

### Update tsconfig.json ✅
- [x] Set `"strict": true`
- [x] Set `"noUncheckedIndexedAccess": true`
- [x] Set `"noImplicitAny": true`
- [x] Set `"strictNullChecks": true`
- [x] Set `"noImplicitReturns": true`
- [x] Set `"noFallthroughCasesInSwitch": true`
- [x] Set `"forceConsistentCasingInFileNames": true`
- [x] Add `"@/types"` path alias

### Fix Type Errors ✅
- [x] Run `pnpm tsc --noEmit` - zero errors
- [x] Replace `any` with proper types across codebase
- [x] Add type annotations where needed
- [x] Fixed Prisma `Json` type casting issues

### Update Code to Use Types ✅
- [x] Updated API routes to use new types (`chatflows/[id]`, `submit`, `publish`, etc.)
- [x] Updated components to use domain types (`chatflow-editor`, `field-details-panel`, `public-chat-view`)
- [x] Updated workflows to use `ChatflowSchema` (`chatflow-generation`, `test-workflow`)
- [x] Updated submission handling to use `SubmissionData`

### Verification ✅
- [x] Run `pnpm tsc --noEmit` - zero errors
- [x] Run `pnpm build` - successful
- [x] No `any` types in new code

### Type Safety Improvements (2025-11-21) ✅

**Enhanced `isChatflowSchema` type guard for runtime enum validation:**
- [x] Added `VALID_FIELD_TYPES` constant array for allowed FieldType values
- [x] Created `isValidFieldType` helper to validate against FieldType enum at runtime
- [x] Updated `isChatflowSchema` to reject invalid field types (e.g., 'long_text')
- [x] Prevents data corruption and rendering issues from invalid enum values
- [x] Essential for validating Prisma `Json` fields which bypass compile-time checks
- [x] File: `app/src/types/chatflow.ts`
- [x] Documented pattern in `docs/coding-standards.md`

### Post-Phase 4: Auto-refresh Bug Fix ⏱️ 1-2 hours

**Bug:** Chatflow title shows "Generating" but UI doesn't auto-update after AI generation completes. Manual page refresh required.

**Solution:** Implement Supabase Real-time subscription to monitor chatflow updates.

- [ ] Create `ChatflowMonitor` component with real-time subscription
- [ ] Subscribe to `UPDATE` events on `Chatflow` table filtered by `chatflowId`
- [ ] Call `router.refresh()` when chatflow is updated
- [ ] Add monitor to chatflow edit page
- [ ] Update documentation with real-time patterns (architecture.md, coding-standards.md)
- [ ] Test: Verify UI auto-updates after generation without manual refresh

---

## Phase 5: Establish Code Patterns ⏱️ 3-4 hours

### Create Utilities
- [ ] Create `src/lib/api-utils.ts`
- [ ] Add `createApiHandler` function
- [ ] Create `src/lib/action-utils.ts`
- [ ] Add `createAction` function

### Create Templates
- [ ] Create `.vscode/` directory
- [ ] Create `.vscode/component.code-snippets`
- [ ] Add "React Server Component" snippet
- [ ] Add "React Client Component" snippet
- [ ] Add "API Route" snippet

### Refactor Existing Code
- [ ] Update 3-5 API routes to use `createApiHandler`
- [ ] Update 2-3 server actions to use `createAction`
- [ ] Document pattern in CLAUDE.md

### Verification
- [ ] Test refactored API routes
- [ ] Test refactored server actions
- [ ] Verify snippets work in VS Code

---

## Phase 6: Add Testing Infrastructure ⏱️ 2-3 hours

### Install Dependencies
- [ ] Run `pnpm add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react`
- [ ] Run `pnpm add -D @vitest/ui` (optional)

### Create Configuration
- [ ] Create `vitest.config.ts`
- [ ] Create `src/test/setup.ts`
- [ ] Create `src/test/utils.tsx` (test utilities)

### Add Example Tests
- [ ] Create `src/lib/__tests__/utils.test.ts`
- [ ] Create `src/lib/__tests__/api-utils.test.ts`
- [ ] Create `src/components/ui/__tests__/button.test.tsx`

### Update package.json
- [ ] Add `"test": "vitest"` script
- [ ] Add `"test:ui": "vitest --ui"` script
- [ ] Add `"test:coverage": "vitest --coverage"` script

### Verification
- [ ] Run `pnpm test` - all tests pass
- [ ] Run `pnpm test:ui` - UI opens
- [ ] Coverage report generates

---

## Phase 7: Documentation & Standards ⏱️ 2 hours

### Environment Setup
- [ ] Create `.env.example` from [.env](file:///Users/jacobomoreno/Dev/iozen/app/.env)
- [ ] Remove sensitive values
- [ ] Document all required variables
- [ ] Add comments explaining each variable

### Update Documentation
- [ ] Update [CLAUDE.md](file:///Users/jacobomoreno/Dev/iozen/app/CLAUDE.md) with new patterns
- [ ] Add component organization section
- [ ] Add API route patterns section
- [ ] Add testing requirements section
- [ ] Add import ordering rules

### Create Contributing Guide
- [ ] Create `CONTRIBUTING.md`
- [ ] Document code organization
- [ ] Document naming conventions
- [ ] Document commit process
- [ ] Add "before committing" checklist

### Update README
- [ ] Update project structure section
- [ ] Add testing instructions
- [ ] Add contribution guidelines link
- [ ] Update scripts documentation

### Verification
- [ ] All docs are up to date
- [ ] New developer can follow setup
- [ ] Examples are accurate

---

## Final Verification ✅

### Build & Type Check
- [ ] Run `pnpm tsc --noEmit` - zero errors
- [ ] Run `pnpm lint` - zero errors
- [ ] Run `pnpm build` - successful
- [ ] Check build output for warnings

### Manual Testing
- [ ] Login flow works
- [ ] Signup flow works
- [ ] Create workspace
- [ ] Create chatflow with AI
- [ ] Edit chatflow
- [ ] Publish chatflow
- [ ] Submit to chatflow (public)
- [ ] View submissions
- [ ] Navigation works
- [ ] All pages load

### Code Quality
- [ ] No dead code remaining
- [ ] No duplicate logic
- [ ] Consistent patterns used
- [ ] All files properly organized
- [ ] All imports use path aliases
- [ ] All components have proper types

### Documentation
- [ ] README is accurate
- [ ] CLAUDE.md is updated
- [ ] CONTRIBUTING.md exists
- [ ] .env.example exists
- [ ] All patterns documented

---

## Post-Refactor

### Git Commit
- [ ] Review all changes
- [ ] Create meaningful commit messages
- [ ] Push to feature branch
- [ ] Create pull request

### Team Communication
- [ ] Share refactor summary
- [ ] Document breaking changes
- [ ] Update team on new patterns
- [ ] Schedule code walkthrough

---

## Metrics

Track improvements:

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Security vulnerabilities | 6 routes | 0 | [ ] |
| Dead files | 6 | 0 | [ ] |
| Route groups | 3 | 2 | [ ] |
| API inconsistencies | 4 | 0 | [ ] |
| Test coverage | 0% | >30% | [ ] |
| `any` types | 9 | 0 | [ ] |
| Type errors | ___ | 0 | [ ] |
| Component organization | Flat | Feature-based | [ ] |

---

## Notes

Use this section to track issues, decisions, or questions during refactor:

```
[Date] [Note]
Example: 2025-11-20 - Decided to keep public submit endpoint at /api/chatflow/submit for backward compatibility
```
