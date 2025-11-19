## 6. AI-Assisted Development Framework

### 6.1 Working with AI (Claude) Effectively

**Principle: AI as Senior Developer, You as Tech Lead**

You provide:
- ✅ Architecture decisions
- ✅ Requirements & acceptance criteria
- ✅ Code review & quality standards
- ✅ Business logic validation

AI provides:
- ✅ Implementation
- ✅ Test generation
- ✅ Refactoring suggestions
- ✅ Code review (self-review)

### 6.2 Prompt Templates for Development

#### Template 1: Feature Implementation

```markdown
I need to implement [FEATURE NAME] with the following requirements:

CONTEXT:
- Module: [e.g., validation-engine]
- Current architecture: [brief description]
- Integration points: [what this connects to]

REQUIREMENTS:
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

TECHNICAL CONSTRAINTS:
- Must follow [pattern/principle]
- Must integrate with [existing system]
- Performance requirement: [if applicable]

CODE QUALITY REQUIREMENTS:
- TypeScript strict mode (no 'any')
- Follow SOLID principles
- Include comprehensive error handling
- Write tests (>80% coverage)
- Add JSDoc comments for public APIs

DELIVERABLES:
1. Implementation files
2. Unit tests
3. Integration tests (if applicable)
4. Type definitions
5. Brief documentation

Start by outlining your approach, then implement step by step.
Let me review each major component before proceeding.
```

**Example Usage:**
```markdown
I need to implement semantic address validation with the following requirements:

CONTEXT:
- Module: validation-engine
- Current architecture: We have basic validation (format checks), need to add AI-powered semantic validation
- Integration points: ConversationEngine calls this during user response validation

REQUIREMENTS:
1. Validate that street address exists in specified city
2. Validate ZIP code matches city
3. Detect obviously fake addresses ("123 Fake St")
4. Provide confidence score (0-100)
5. Suggest corrections if address is close but not exact

TECHNICAL CONSTRAINTS:
- Must use Claude API for semantic validation
- Should cache results (same address shouldn't be re-validated)
- Must handle API failures gracefully (degradation to format-only validation)
- Response time <2 seconds (p95)

CODE QUALITY REQUIREMENTS:
- TypeScript strict mode (no 'any')
- Follow repository pattern for caching
- Dependency injection for testability
- Comprehensive error handling
- Write tests (>80% coverage)

DELIVERABLES:
1. SemanticAddressValidator class
2. Integration with existing ValidationService
3. Unit tests (mocking Claude API)
4. Integration tests (with real API in staging)
5. Update ValidationService to use new validator

Start by outlining your approach.
```

#### Template 2: Code Review Request

```markdown
Please review the following code for:

QUALITY CHECKS:
- SOLID principle violations
- Code smells
- Potential bugs
- Performance issues
- Security vulnerabilities

CODE:
```typescript
[paste code here]
```

Provide:
1. List of issues (Critical / High / Medium / Low)
2. Specific recommendations with code examples
3. Positive feedback (what's done well)
```

#### Template 3: Refactoring Request

```markdown
This code works but needs refactoring:

CURRENT ISSUES:
- [Issue 1: e.g., "Too complex, cognitive complexity of 25"]
- [Issue 2: e.g., "Violates Single Responsibility Principle"]
- [Issue 3: e.g., "Hard to test due to tight coupling"]

GOALS:
- Improve testability
- Reduce complexity
- Follow SOLID principles
- Maintain existing functionality

CODE:
```typescript
[paste code here]
```

Please refactor while:
1. Preserving all existing functionality
2. Improving test coverage
3. Adding comments where logic is complex
4. Ensuring backward compatibility
```

#### Template 4: Test Generation

```markdown
Generate comprehensive tests for the following code:

CODE:
```typescript
[paste code here]
```

TEST REQUIREMENTS:
- Framework: Vitest
- Coverage target: >90%
- Include:
  - Happy path tests
  - Edge cases
  - Error scenarios
  - Boundary conditions

TEST STRUCTURE:
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Mock external dependencies
- Use test fixtures for complex data

Provide both unit tests and integration tests if applicable.
```

#### Template 5: Documentation Request

```markdown
Generate documentation for the following module/class/function:

CODE:
```typescript
[paste code here]
```

DOCUMENTATION NEEDS:
- JSDoc comments for all public APIs
- README.md for the module
- Usage examples
- Architecture notes (if module-level)

FORMAT:
- Clear and concise
- Include code examples
- Document all parameters and return types
- Note any side effects or important behavior
```

### 6.3 AI Development Workflow

**Step-by-Step Process:**

**1. Requirements Definition (You)**
```markdown
Write clear, detailed requirements in GitHub issue
Include acceptance criteria
Define success metrics
```

**2. Implementation Planning (AI + You)**
```markdown
You: Provide requirements using Template 1
AI: Proposes implementation approach
You: Review approach, suggest modifications
AI: Refines approach
You: Approve to proceed
```

**3. Implementation (AI)**
```markdown
AI: Implements feature following approved approach
AI: Writes tests alongside implementation
AI: Generates documentation
```

**4. Self-Review (AI)**
```markdown
You: Request code review using Template 2
AI: Reviews its own code
AI: Identifies and fixes issues
You: Verify fixes
```

**5. Human Review (You)**
```markdown
You: Review for business logic correctness
You: Check architecture alignment
You: Validate against requirements
You: Run code locally, test manually
```

**6. Iteration (AI + You)**
```markdown
You: Request changes if needed
AI: Makes modifications
Repeat until approved
```

**7. Quality Gates (Automated)**
```markdown
Push to GitHub
GitHub Actions run quality gates
Fix any failures
Merge when green
```

### 6.4 Context Management with AI

**Problem:** AI has limited context window. How to provide necessary context efficiently?

**Solution: Context Layers**

**Layer 1: Always Include (Standards)**
```markdown
I'm building a conversational forms platform. Key context:

Architecture:
- Next.js 14 monolith with modular structure
- Vercel Workflow for orchestration
- Supabase for database/auth/storage
- TypeScript strict mode

Standards:
- Follow SOLID principles
- Test coverage >80%
- No 'any' types
- Dependency injection for testability

[Then provide specific task...]
```

**Layer 2: Module Context (When Needed)**
```markdown
Working in the validation-engine module:

Structure:
/modules/validation-engine/
  /domain - Entities and value objects
  /application - Services and use cases
  /infrastructure - External integrations

Current capabilities:
- Basic validation (format, required, range)
- Business rule validation
- Cross-field validation

[Then provide specific task...]
```

**Layer 3: Specific Context (Always)**
```markdown
Current file: ValidationService.ts

This service orchestrates all validation types. It:
- Accepts a field name and value
- Runs appropriate validators based on field type
- Returns comprehensive validation result

I need to add semantic validation...
[specific task]
```

**Optimization: Use File Artifacts**
```markdown
Instead of pasting large files repeatedly:

"Refer to the ValidationService.ts file I shared earlier.
I need to modify the validateField method to..."
```

### 6.5 Common AI Development Patterns

**Pattern 1: Iterative Refinement**
```markdown
Session 1: "Build basic structure of [feature]"
Session 2: "Add error handling to [feature]"
Session 3: "Add tests for [feature]"
Session 4: "Optimize performance of [feature]"
Session 5: "Add documentation for [feature]"
```

**Pattern 2: Test-Driven with AI**
```markdown
Step 1: "Write comprehensive tests for [feature] that doesn't exist yet"
Step 2: "Now implement [feature] to make these tests pass"
Step 3: "Refactor implementation while keeping tests green"
```

**Pattern 3: Review-Refactor Loop**
```markdown
Step 1: AI implements feature
Step 2: "Review this code for SOLID violations"
Step 3: AI identifies issues
Step 4: "Refactor to address issues"
Step 5: "Review refactored code"
Step 6: Repeat until quality standards met
```

**Pattern 4: Incremental Building**
```markdown
Step 1: "Create domain entities for [feature]"
  → Review & approve
Step 2: "Create repository interface"
  → Review & approve
Step 3: "Implement repository with Prisma"
  → Review & approve
Step 4: "Create service layer"
  → Review & approve
Step 5: "Create use case"
  → Review & approve
Step 6: "Write tests for all layers"
  → Review & approve
```

### 6.6 Prompt Library for Common Tasks

**Creating a New Module:**
```markdown
Create a new module following our architecture:

MODULE NAME: [name]
RESPONSIBILITY: [single clear responsibility]
PUBLIC API: [interfaces it exposes]
DEPENDENCIES: [what it depends on]

STRUCTURE:
/modules/[name]/
  /domain - Entities, value objects, domain logic
  /application - Services, use cases
  /infrastructure - External integrations, repositories
  index.ts - Public API exports

REQUIREMENTS:
- Follow clean architecture principles
- All dependencies injected
- Comprehensive tests
- Full TypeScript typing
- JSDoc for public APIs

Start with domain layer, then application, then infrastructure.
```

**Adding API Endpoint:**
```markdown
Add a new tRPC endpoint:

ENDPOINT: [name]
METHOD: [query | mutation]
INPUT: [TypeScript type]
OUTPUT: [TypeScript type]
AUTHENTICATION: [required | optional | none]

BUSINESS LOGIC:
[describe what it should do]

ERROR CASES:
- [case 1]: return [error type]
- [case 2]: return [error type]

VALIDATION:
- [validation rule 1]
- [validation rule 2]

Include input validation with Zod and comprehensive tests.
```

**Creating Workflow:**
```markdown
Create a Vercel Workflow:

WORKFLOW NAME: [name]
PURPOSE: [what it orchestrates]

STEPS:
1. [step name]: [what it does]
2. [step name]: [what it does]
3. [step name]: [what it does]

ERROR HANDLING:
- [step X] fails → [retry | compensate | fail workflow]

CONTEXT FLOW:
[what data flows between steps]

Requirements:
- Type-safe context
- Proper error handling
- Idempotent steps (safe to retry)
- Comprehensive tests

Implement step by step, with tests for each.
```