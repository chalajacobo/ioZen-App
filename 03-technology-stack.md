## 3. Technology Stack

### 3.1 Stack Rationale

**Evaluation Criteria:**
1. Development velocity (MVP → Product)
2. Scalability (1 submission/min → 100 submissions/sec)
3. Developer experience (onboarding, debugging)
4. Total cost of ownership (infrastructure + development time)
5. AI integration ease
6. Community & ecosystem

### 3.2 Core Stack

#### Frontend

```yaml
Framework: Next.js 14 (App Router)
Reason: 
  - Server Components reduce client bundle size
  - Built-in API routes (backend co-located)
  - Excellent TypeScript support
  - Vercel deployment optimization
  - Large community, extensive examples

UI Library: React 18
Reason:
  - Industry standard, large talent pool
  - Concurrent rendering for better UX
  - Excellent AI tool support

Styling: TailwindCSS 3
Reason:
  - Rapid UI development
  - Consistent design system
  - Small bundle size (purged)
  - Mobile-first by default

Component Library: shadcn/ui
Reason:
  - Copy/paste components (no dependency hell)
  - Built on Radix UI (accessible)
  - Customizable with Tailwind
  - TypeScript-first

State Management: 
  - Zustand (global state)
  - React Hook Form (form state)
  - TanStack Query (server state)
Reason:
  - Minimal boilerplate
  - Excellent TypeScript support
  - Small bundle sizes
  - Easy to test

Realtime: Supabase Realtime
Reason:
  - WebSocket abstraction
  - Auto-reconnection
  - Presence tracking
  - Integrated with database
```

#### Backend

```yaml
Runtime: Node.js 20 LTS
Reason:
  - Stable, long-term support
  - Best TypeScript support
  - Excellent AI SDK availability

API Layer: tRPC
Reason:
  - End-to-end type safety
  - No code generation needed
  - Better DX than REST/GraphQL
  - Excellent with Next.js

Validation: Zod
Reason:
  - Runtime type validation
  - Perfect tRPC integration
  - Excellent error messages
  - TypeScript inference

ORM: Prisma
Reason:
  - Type-safe database queries
  - Excellent migrations
  - Great DX (Prisma Studio)
  - Auto-completion everywhere
```

#### Database & Auth

```yaml
Database: Supabase (PostgreSQL 15)
Reason:
  - Managed Postgres (reliability)
  - Built-in Auth (reduces complexity)
  - Storage (document uploads)
  - Realtime (WebSocket layer)
  - Row Level Security (multi-tenant)
  - Excellent TypeScript client

Why not separate services:
  - Auth0 + AWS RDS + S3 = 3 vendors, 3 bills, complex integration
  - Supabase = 1 vendor, 1 bill, seamless integration
```

#### Workflow Orchestration

```yaml
Engine: Vercel Workflow
Reason:
  - Zero infrastructure management
  - Built-in retry/error handling
  - Excellent observability
  - Native TypeScript support
  - Integrated with Vercel deployment

Alternatives considered:
  - Temporal: Too complex for small team
  - Inngest: Great but adds another vendor
  - BullMQ: Need to manage Redis + workers
```

#### AI Services

```yaml
Primary LLM: Anthropic Claude Sonnet 4
Reason:
  - Best reasoning capabilities
  - Excellent for conversational AI
  - Better cost/performance than GPT-4
  - Extended context window (200K tokens)
  - Strong following instructions

Vision AI: OpenAI GPT-4 Vision
Reason:
  - Industry-leading image understanding
  - Excellent document analysis
  - Structured output support

OCR: AWS Textract (primary), Google Document AI (fallback)
Reason:
  - Textract: Best for forms, receipts, IDs
  - Document AI: Best for complex documents
  - Having fallback improves reliability
```

#### Development Tools

```yaml
Language: TypeScript 5 (strict mode)
Linting: ESLint 9
Formatting: Prettier
Testing:
  - Vitest (unit/integration)
  - Playwright (E2E)
  - Testing Library (component)
Package Manager: pnpm
Monorepo: Turborepo (if needed later)
```

#### Infrastructure & DevOps

```yaml
Hosting: Vercel
CI/CD: GitHub Actions
Monitoring:
  - Vercel Analytics (performance)
  - Sentry (error tracking)
  - PostHog (product analytics)
Code Quality: SonarCloud
Security Scanning: Snyk
Version Control: GitHub
```

### 3.3 Complete Dependency List

```json
{
  "name": "conversational-forms-platform",
  "version": "0.1.0",
  "dependencies": {
    // Core Framework
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    
    // API & Data Fetching
    "@trpc/server": "^10.45.0",
    "@trpc/client": "^10.45.0",
    "@trpc/react-query": "^10.45.0",
    "@trpc/next": "^10.45.0",
    "@tanstack/react-query": "^5.28.0",
    
    // Database & Auth
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "@prisma/client": "^5.10.0",
    
    // Workflow
    "@vercel/workflow": "^0.1.0",
    
    // Validation
    "zod": "^3.22.4",
    
    // State Management
    "zustand": "^4.5.0",
    "react-hook-form": "^7.50.0",
    
    // UI Components
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "lucide-react": "^0.344.0",
    
    // AI SDKs
    "@anthropic-ai/sdk": "^0.20.0",
    "openai": "^4.28.0",
    "@aws-sdk/client-textract": "^3.525.0",
    
    // Utilities
    "date-fns": "^3.3.0",
    "nanoid": "^5.0.5",
    
    // Monitoring
    "@sentry/nextjs": "^7.100.0",
    "posthog-js": "^1.107.0"
  },
  "devDependencies": {
    // TypeScript
    "typescript": "^5.3.3",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    
    // Linting & Formatting
    "eslint": "^8.56.0",
    "eslint-config-next": "14.2.0",
    "prettier": "^3.2.5",
    "prettier-plugin-tailwindcss": "^0.5.11",
    
    // Testing
    "vitest": "^1.2.0",
    "@vitest/ui": "^1.2.0",
    "@testing-library/react": "^14.2.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@playwright/test": "^1.41.0",
    
    // Build Tools
    "prisma": "^5.10.0",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35"
  }
}
```

### 3.4 Architecture Decision Records (ADRs)

**ADR Format:**
```markdown
# ADR-XXX: Title

Date: YYYY-MM-DD
Status: Accepted | Rejected | Superseded
Deciders: Name(s)

## Context
What is the issue we're facing?

## Decision
What did we decide?

## Consequences
What becomes easier/harder as a result?

## Alternatives Considered
What else did we evaluate?
```

**ADR-001: Use Vercel Workflow for Orchestration**

```markdown
Date: 2025-11-15
Status: Accepted
Deciders: CTO

Context:
Need to orchestrate multi-step workflows (form completion, document processing).
Options: Vercel Workflow, Temporal, Inngest, BullMQ + custom coordination.

Decision:
Use Vercel Workflow as primary orchestration engine.

Consequences:
✅ Easier: Zero infrastructure, built-in observability, automatic retries
✅ Faster: No setup needed, focus on business logic
❌ Harder: Vendor lock-in to Vercel (mitigated by clean module boundaries)
❌ Harder: Less flexibility than Temporal (acceptable tradeoff for simplicity)

Alternatives Considered:
- Temporal: Too complex for team size, operational overhead too high
- Inngest: Good alternative, but adds another vendor (Vercel already chosen for hosting)
- BullMQ: Would need to build orchestration layer ourselves (accidental complexity)
```

**ADR-002: Monolithic Architecture with Module Boundaries**

```markdown
Date: 2025-11-15
Status: Accepted
Deciders: CTO

Context:
Need to decide between microservices vs monolith for initial architecture.

Decision:
Build as modular monolith with clear bounded contexts, designed for eventual extraction.

Consequences:
✅ Easier: Faster development, shared types, simpler deployment
✅ Easier: Easier to refactor early-stage code
✅ Easier: One codebase to understand
❌ Harder: Need discipline to maintain module boundaries
❌ Harder: May need refactoring when extracting services

Alternatives Considered:
- Microservices from day 1: Premature optimization, too much overhead for 2-3 person team
- Serverless functions per feature: Too granular, cold start issues
```

**ADR-003: tRPC Over REST/GraphQL**

```markdown
Date: 2025-11-15
Status: Accepted
Deciders: CTO

Context:
Need API layer between frontend and backend.

Decision:
Use tRPC for type-safe API layer.

Consequences:
✅ Easier: End-to-end type safety, no code generation
✅ Easier: Better DX than REST (auto-completion)
✅ Easier: Excellent with Next.js + TypeScript
❌ Harder: Less familiar to developers from REST background
❌ Harder: Not suitable for public API (need REST wrapper if needed later)

Alternatives Considered:
- REST: Manual type definitions, more boilerplate, prone to drift
- GraphQL: Overkill for our use case, adds complexity
```

---
