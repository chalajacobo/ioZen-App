# Project Structure Recommendation

Based on the [Architecture Document](file:///Users/jacobomoreno/Dev/iozen/02-architecture.md), here's the recommended project structure for the IoZen MVP:

## Recommended Structure

```
iozen/
├── .git/                           # Root-level Git repository ✅
├── .gitignore                      # Root-level ignore rules ✅
├── README.md                       # Project overview ✅
├── SETUP.md                        # Setup instructions ✅
│
├── docs/                           # 📚 All documentation (RECOMMENDED)
│   ├── 01-vision-product-philosophy.md
│   ├── 02-architecture.md
│   ├── 03-technology-stack.md
│   ├── 04-development-methodology.md
│   ├── 05-code-standards-quality-gates.md
│   ├── 06-ai-assisted-development-framework.md
│   ├── 07-testing-strategy.md
│   ├── 08-deployment-operations.md
│   ├── 09-security-compliance.md
│   ├── 10-mvp-scope-definition.md
│   ├── 11-database-schema.md
│   ├── 12-ux-design-system.md
│   ├── 13-visual-prototype.md
│   └── 14-vercel-workflow-guidelines.md
│
└── app/                            # Next.js application
    ├── .gitignore                  # App-specific ignores ✅
    ├── package.json                # Dependencies ✅
    ├── tsconfig.json               # TypeScript config ✅
    ├── next.config.ts              # Next.js config ✅
    │
    ├── prisma/                     # Database layer ✅
    │   ├── schema.prisma           # Database schema
    │   └── migrations/             # Migration history
    │
    ├── public/                     # Static assets ✅
    │   └── ...
    │
    └── src/                        # Application source ✅
        ├── app/                    # Next.js App Router (CURRENT) ✅
        │   ├── layout.tsx
        │   ├── page.tsx
        │   ├── globals.css
        │   └── api/                # API routes (TO ADD)
        │       ├── chatflows/      # Chatflow CRUD
        │       ├── conversations/  # Chat interactions
        │       ├── documents/      # Document processing
        │       └── analytics/      # Reporting
        │
        ├── lib/                    # Shared utilities (CURRENT) ✅
        │   ├── utils.ts            # Helper functions ✅
        │   ├── db.ts               # Prisma client (TO ADD)
        │   └── providers/          # Provider abstraction (TO ADD)
        │       ├── llm/
        │       │   ├── anthropic/
        │       │   │   └── AnthropicProvider.ts
        │       │   └── index.ts
        │       ├── registry.ts
        │       └── types.ts
        │
        ├── modules/                # Business logic modules (TO ADD) 🎯
        │   ├── schema-definition/
        │   │   ├── domain/         # Entities, value objects
        │   │   ├── application/    # Use cases, services
        │   │   └── infrastructure/ # AI integrations
        │   │
        │   ├── conversation-engine/
        │   │   ├── domain/
        │   │   ├── application/
        │   │   └── infrastructure/
        │   │
        │   ├── validation-engine/
        │   │   ├── domain/
        │   │   ├── application/
        │   │   └── infrastructure/
        │   │
        │   ├── document-processing/
        │   │   ├── domain/
        │   │   ├── application/
        │   │   └── infrastructure/
        │   │
        │   └── results-interpretation/
        │       ├── domain/
        │       ├── application/
        │       └── infrastructure/
        │
        ├── workflows/              # Vercel Workflows (TO ADD) 🎯
        │   ├── chatflow-completion.workflow.ts
        │   ├── document-processing.workflow.ts
        │   ├── validation-pipeline.workflow.ts
        │   └── results-interpretation.workflow.ts
        │
        └── components/             # React components (TO ADD)
            ├── ui/                 # Base UI components
            ├── chatflow/           # Chatflow-specific
            └── dashboard/          # Dashboard components
```

## Key Recommendations

### 1. ✅ **Current Structure is Good**

Your current structure is already aligned with best practices:
- ✅ Root-level monorepo with docs + app
- ✅ Next.js App Router in `src/app/`
- ✅ Shared utilities in `src/lib/`
- ✅ Prisma for database
- ✅ TypeScript configuration

### 2. 📁 **Move Documentation to `/docs` (Optional but Recommended)**

**Why:**
- Cleaner root directory
- Standard convention (GitHub recognizes `/docs`)
- Easier to navigate
- Separates "what we're building" from "how we're building it"

**How:**
```bash
mkdir docs
mv *.md docs/
# Keep README.md and SETUP.md at root
mv docs/README.md ./
mv docs/SETUP.md ./
```

### 3. 🎯 **Add Module Structure (For MVP Implementation)**

Based on the architecture document (Section 2.3), you'll need to add:

**`src/modules/`** - Business logic organized by domain:
- Each module follows Clean Architecture (domain/application/infrastructure)
- Modules are bounded contexts with clear interfaces
- No cross-module dependencies (only through interfaces)

**Example for MVP:**
```
src/modules/
└── conversation-engine/
    ├── domain/
    │   ├── entities/
    │   │   ├── Conversation.ts
    │   │   └── Message.ts
    │   └── value-objects/
    │       └── ConversationContext.ts
    ├── application/
    │   ├── services/
    │   │   └── ConversationService.ts
    │   └── interfaces/
    │       └── IConversationService.ts
    └── infrastructure/
        └── claude/
            └── ClaudeConversationProvider.ts
```

### 4. 🔄 **Add Workflows Directory**

**`src/workflows/`** - Vercel Workflow orchestration:
- Workflows coordinate modules but don't contain business logic
- Each workflow is a `.workflow.ts` file
- Workflows call module services

**Example:**
```typescript
// src/workflows/chatflow-completion.workflow.ts
export async function chatflowCompletionWorkflow(chatflowId: string) {
  "use workflow";
  
  const schema = await generateSchema(chatflowId);
  const answers = await collectAnswers(schema);
  const validated = await validateSubmission(answers);
  
  return { chatflowId, status: 'completed' };
}
```

### 5. 🔌 **Add Provider Abstraction**

**`src/lib/providers/`** - Provider abstraction layer (Section 2.4):
- Abstract interfaces for LLM, Vision, OCR providers
- Concrete implementations (Anthropic, OpenAI, etc.)
- Provider registry for dependency injection
- Circuit breaker pattern for failover

## Comparison: Current vs Recommended

| Aspect | Current | Recommended | Priority |
|--------|---------|-------------|----------|
| **Root structure** | Docs at root | Docs in `/docs` | Low (optional) |
| **App structure** | `src/app/` ✅ | Same | ✅ Good |
| **Utilities** | `src/lib/` ✅ | Same | ✅ Good |
| **Business logic** | ❌ Missing | `src/modules/` | 🔴 High (MVP) |
| **Workflows** | ❌ Missing | `src/workflows/` | 🔴 High (MVP) |
| **Providers** | ❌ Missing | `src/lib/providers/` | 🔴 High (MVP) |
| **Components** | ❌ Missing | `src/components/` | 🟡 Medium (MVP) |
| **API routes** | ❌ Missing | `src/app/api/` | 🔴 High (MVP) |

## Implementation Priority

### Phase 1: MVP Foundation (Now - Day 2)
1. ✅ Keep current structure (it's good!)
2. 🔴 Add `src/lib/providers/` for Claude integration
3. 🔴 Add `src/modules/conversation-engine/` for chatflow logic
4. 🔴 Add `src/workflows/` for Vercel Workflow
5. 🔴 Add `src/app/api/` for API routes

### Phase 2: MVP Development (Day 2-5)
6. 🟡 Add `src/components/` for UI components
7. 🟡 Expand modules as needed (validation, document processing)
8. 🟡 Add more workflows

### Phase 3: Post-MVP Cleanup (Optional)
9. 🟢 Move docs to `/docs` directory
10. 🟢 Add testing directories (`__tests__/`, `e2e/`)

## Conclusion

**Your current structure is already well-aligned with the architecture!** The main additions needed are:

1. **`src/modules/`** - For business logic (Clean Architecture)
2. **`src/workflows/`** - For Vercel Workflow orchestration  
3. **`src/lib/providers/`** - For provider abstraction
4. **`src/app/api/`** - For API routes

The documentation at the root level is fine for now. Moving to `/docs` is optional and can be done later if desired.

## Next Steps

1. ✅ GitHub repository is set up and pushed
2. 🔄 Start implementing the module structure as you build MVP features
3. 🔄 Add workflows when you implement chatflow completion
4. 🔄 Add provider abstraction when integrating Claude

The structure will evolve naturally as you implement the MVP features outlined in [10-mvp-scope-definition.md](file:///Users/jacobomoreno/Dev/iozen/10-mvp-scope-definition.md).
