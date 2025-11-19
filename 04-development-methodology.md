## 4. Development Methodology

### 4.1 Development Principles

**DP1: Ship Small, Ship Often**
- Target: Deploy to production multiple times per day
- Feature flags for incomplete features
- Continuous delivery over big bang releases

**DP2: Test-Driven Development (Pragmatic TDD)**
- Write tests for all business logic
- Tests are executable documentation
- Don't test implementation details, test behavior
- Integration tests over unit tests for complex workflows

**DP3: Code Review Everything**
- No direct commits to main branch
- All changes via Pull Request
- AI code review first, then human review
- Review for: functionality, tests, documentation, security

**DP4: Documentation as Code**
- Code should be self-documenting (clear names, simple logic)
- Complex logic gets comments explaining "why", not "what"
- API documentation auto-generated from types
- Architecture docs in `/docs` directory

**DP5: Optimize for Deletion**
- Easy to delete code = well-abstracted code
- Avoid premature abstraction
- Delete unused code aggressively
- Measure: "How hard would it be to delete this module?"

### 4.2 Development Workflow

#### Git Branching Strategy

```
main (production)
  ↑
  └─ PR merge (after review + tests pass)
      ↑
      └─ feature/ISSUE-123-add-document-validation
          ↑
          └─ Local development
```

**Branch Naming:**
- `feature/ISSUE-123-short-description` - New features
- `fix/ISSUE-456-bug-description` - Bug fixes
- `refactor/improve-validation-logic` - Refactoring
- `docs/update-api-documentation` - Documentation
- `test/add-missing-tests` - Test additions

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Example:**
```
feat(validation): add semantic validation for addresses

Implement AI-powered address validation that checks if the
address is semantically valid (not just format-valid).

Uses Claude API to verify:
- Street names exist in specified city
- ZIP code matches city
- Building numbers are reasonable

Closes #123
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

#### Pull Request Process

**1. Create PR**
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log or debugging code
- [ ] Tests pass locally
```

**2. Automated Checks (GitHub Actions)**
```yaml
✓ TypeScript compilation
✓ ESLint (no errors)
✓ Prettier (formatted)
✓ Unit tests (>80% coverage)
✓ Integration tests
✓ Build successful
✓ SonarCloud quality gate
```

**3. AI Code Review**
- Paste code into Claude
- Request review for: SOLID violations, security issues, performance problems
- Address issues before human review

**4. Human Review**
- At least 1 approval required
- Focus on: business logic correctness, architecture alignment, UX impact

**5. Merge**
- Squash and merge (clean history)
- Delete branch after merge
- Auto-deploy to staging → manual promote to production

### 4.3 Environment Strategy

```
┌────────────────────────────────────────────────┐
│  Local Development (dev)                       │
│  - Local database (Supabase local)            │
│  - Mock AI APIs (for fast iteration)          │
│  - Hot reload enabled                          │
│  URL: localhost:3000                           │
└────────────────────────────────────────────────┘
                    ↓ git push
┌────────────────────────────────────────────────┐
│  Preview (Vercel preview deployment)           │
│  - Isolated database (Supabase branch)        │
│  - Real AI APIs (rate limited)                │
│  - Unique URL per PR                           │
│  URL: pr-123.vercel.app                        │
└────────────────────────────────────────────────┘
                    ↓ merge to main
┌────────────────────────────────────────────────┐
│  Staging (pre-production)                      │
│  - Staging database (Supabase)                │
│  - Real AI APIs (production keys)             │
│  - Production-like data                        │
│  URL: staging.ourapp.com                       │
└────────────────────────────────────────────────┘
                    ↓ manual promotion
┌────────────────────────────────────────────────┐
│  Production                                     │
│  - Production database                         │
│  - Real AI APIs (production keys)             │
│  - Real customer data                          │
│  URL: app.ourapp.com                           │
└────────────────────────────────────────────────┘
```

**Environment Variables:**
```bash
# .env.local (local dev)
DATABASE_URL="postgresql://localhost:5432/forms_dev"
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
SUPABASE_SERVICE_ROLE_KEY="local_service_key"
ANTHROPIC_API_KEY="sk-ant-mock" # Mock for dev
OPENAI_API_KEY="sk-mock"

# .env.staging
DATABASE_URL="postgresql://[supabase-staging]"
NEXT_PUBLIC_SUPABASE_URL="https://staging.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[staging_key]"
ANTHROPIC_API_KEY="sk-ant-staging"
OPENAI_API_KEY="sk-staging"

# .env.production (Vercel secrets)
DATABASE_URL="[production_database]"
NEXT_PUBLIC_SUPABASE_URL="https://prod.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[prod_key]"
ANTHROPIC_API_KEY="sk-ant-prod"
OPENAI_API_KEY="sk-prod"
```

### 4.4 Issue Tracking & Project Management

**GitHub Projects for Roadmap:**
```
Backlog → Ready → In Progress → In Review → Done
```

**Issue Template:**
```markdown
## Problem
Clear description of the problem or feature request.

## Proposed Solution
How should we solve this?

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes
Any architectural considerations, dependencies, or risks.

## Estimation
Story points: [1, 2, 3, 5, 8, 13]
```

**Labels:**
- `priority: critical` - P0, drop everything
- `priority: high` - P1, this sprint
- `priority: medium` - P2, next sprint
- `priority: low` - P3, backlog
- `type: bug` - Something broken
- `type: feature` - New functionality
- `type: tech-debt` - Refactoring, improvement
- `area: backend` - Backend changes
- `area: frontend` - UI changes
- `area: ai` - AI/ML components
- `area: infrastructure` - DevOps, deployment

---
