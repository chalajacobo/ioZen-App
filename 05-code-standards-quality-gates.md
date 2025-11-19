## 5. Code Standards & Quality Gates

### 5.1 TypeScript Standards

**TS-1: Strict Mode Always**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**TS-2: No `any` Types**
```typescript
// ❌ BAD
function processData(data: any) {
  return data.value;
}

// ✅ GOOD
function processData(data: unknown) {
  if (isValidData(data)) {
    return data.value;
  }
  throw new Error('Invalid data');
}

function isValidData(data: unknown): data is { value: string } {
  return typeof data === 'object' && data !== null && 'value' in data;
}
```

**TS-3: Prefer Interfaces for Objects, Types for Unions**
```typescript
// ✅ Interface for object shapes
interface User {
  id: string;
  email: string;
  name: string;
}

// ✅ Type for unions/intersections
type Status = 'pending' | 'completed' | 'failed';
type UserWithStatus = User & { status: Status };
```

**TS-4: Use Zod for Runtime Validation**
```typescript
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
});

// Infer TypeScript type
type User = z.infer<typeof UserSchema>;

// Validate at runtime
function createUser(data: unknown): User {
  return UserSchema.parse(data); // Throws if invalid
}
```

### 5.2 Code Organization

**Directory Structure:**
```
/app                          # Next.js App Router
  /(auth)                     # Auth routes
    /login
    /signup
  /(dashboard)                # Protected routes
    /forms
    /analytics
  /api                        # API routes
    /trpc/[trpc]             # tRPC endpoint
  
/modules                      # Business logic modules
  /schema-definition
    /domain
      /entities
        FormSchema.ts
        Field.ts
      /value-objects
        ValidationRule.ts
    /application
      /services
        SchemaGeneratorService.ts
      /use-cases
        GenerateSchemaFromPrompt.ts
    /infrastructure
      /ai
        ClaudeSchemaGenerator.ts
      /repositories
        PrismaSchemaRepository.ts
    index.ts                  # Public API
    
/workflows                    # Vercel Workflows
  form-completion.workflow.ts
  document-processing.workflow.ts
  
/lib                          # Shared utilities
  /api                        # API clients
  /utils                      # Helper functions
  /hooks                      # React hooks
  
/components                   # React components
  /ui                         # shadcn/ui components
  /forms                      # Form components
  /chat                       # Chat components
  
/prisma                       # Database
  schema.prisma
  /migrations
  
/tests                        # Tests
  /unit
  /integration
  /e2e
  
/docs                         # Documentation
  /architecture
  /api
  
.env.local                    # Local env vars
.env.example                  # Example env vars
```

**File Naming:**
- Components: `PascalCase.tsx` (e.g., `ChatMessage.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Hooks: `use + PascalCase.ts` (e.g., `useConversation.ts`)
- Tests: `*.test.ts` or `*.spec.ts`

### 5.3 Clean Code Principles

**CC-1: Functions Should Do One Thing**
```typescript
// ❌ BAD - Function does too much
async function processFormSubmission(submissionId: string) {
  const submission = await db.submission.findUnique({ where: { id: submissionId }});
  const validation = await validateData(submission.data);
  if (!validation.valid) {
    await db.submission.update({ where: { id: submissionId }, data: { status: 'invalid' }});
    await sendEmail(submission.userId, 'Validation Failed');
    return;
  }
  const interpretation = await interpretResults(submission.data);
  await db.submission.update({ 
    where: { id: submissionId }, 
    data: { status: 'completed', interpretation } 
  });
  await sendWebhook(submission.formId, { submission, interpretation });
  await sendEmail(submission.userId, 'Submission Complete');
}

// ✅ GOOD - Separate concerns
async function processFormSubmission(submissionId: string) {
  const submission = await getSubmission(submissionId);
  const validation = await validateSubmission(submission);
  
  if (!validation.valid) {
    await handleValidationFailure(submission, validation);
    return;
  }
  
  await handleValidSubmission(submission);
}

async function handleValidSubmission(submission: Submission) {
  const interpretation = await interpretResults(submission.data);
  await saveInterpretation(submission.id, interpretation);
  await notifyStakeholders(submission, interpretation);
}
```

**CC-2: Meaningful Names**
```typescript
// ❌ BAD
const d = new Date();
const t = d.getTime();
const u = await db.user.findMany();

// ✅ GOOD
const currentDate = new Date();
const timestamp = currentDate.getTime();
const users = await db.user.findMany();
```

**CC-3: Avoid Magic Numbers/Strings**
```typescript
// ❌ BAD
if (user.role === 3) {
  // What is role 3?
}

// ✅ GOOD
const USER_ROLES = {
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
} as const;

if (user.role === USER_ROLES.ADMIN) {
  // Clear what this means
}

// ✅ EVEN BETTER - Use enums
enum UserRole {
  Viewer = 'viewer',
  Editor = 'editor',
  Admin = 'admin',
}
```

**CC-4: Error Handling**
```typescript
// ❌ BAD
try {
  const data = await fetchData();
  processData(data);
} catch (e) {
  console.log(e); // Silent failure, no context
}

// ✅ GOOD
try {
  const data = await fetchData();
  processData(data);
} catch (error) {
  if (error instanceof NetworkError) {
    logger.error('Network error while fetching data', { error, context: 'fetchData' });
    throw new ApplicationError('Unable to fetch data', { cause: error });
  }
  
  if (error instanceof ValidationError) {
    logger.warn('Data validation failed', { error, data });
    throw new ApplicationError('Invalid data format', { cause: error });
  }
  
  // Unexpected error
  logger.error('Unexpected error in data processing', { error });
  throw error;
}
```

**CC-5: Dependency Injection**
```typescript
// ❌ BAD - Hard to test, tightly coupled
class ConversationService {
  async generateQuestion(field: Field) {
    const ai = new ClaudeAPI(); // Hardcoded dependency
    return await ai.generate(field);
  }
}

// ✅ GOOD - Testable, loosely coupled
interface IAIProvider {
  generate(prompt: string): Promise<string>;
}

class ConversationService {
  constructor(private aiProvider: IAIProvider) {}
  
  async generateQuestion(field: Field) {
    return await this.aiProvider.generate(this.buildPrompt(field));
  }
}

// Easy to mock in tests
const mockAI: IAIProvider = {
  generate: async () => "What is your name?"
};
const service = new ConversationService(mockAI);
```

### 5.4 SOLID Principles Application

**S - Single Responsibility Principle**
```typescript
// ❌ BAD - Class has multiple responsibilities
class FormService {
  validateForm() { /*...*/ }
  saveToDatabase() { /*...*/ }
  sendEmail() { /*...*/ }
  generatePDF() { /*...*/ }
}

// ✅ GOOD - Each class has one responsibility
class FormValidator {
  validate(form: Form): ValidationResult { /*...*/ }
}

class FormRepository {
  save(form: Form): Promise<void> { /*...*/ }
}

class EmailService {
  send(to: string, subject: string, body: string): Promise<void> { /*...*/ }
}

class PDFGenerator {
  generate(form: Form): Promise<Buffer> { /*...*/ }
}
```

**O - Open/Closed Principle**
```typescript
// ✅ Open for extension, closed for modification
interface ValidationRule {
  validate(value: any): ValidationResult;
}

class EmailValidation implements ValidationRule {
  validate(value: any): ValidationResult {
    // Email validation logic
  }
}

class PhoneValidation implements ValidationRule {
  validate(value: any): ValidationResult {
    // Phone validation logic
  }
}

// Add new validation without modifying existing code
class SSNValidation implements ValidationRule {
  validate(value: any): ValidationResult {
    // SSN validation logic
  }
}
```

**L - Liskov Substitution Principle**
```typescript
// ✅ Subtypes must be substitutable for base types
interface Document {
  process(): Promise<ProcessingResult>;
}

class PDFDocument implements Document {
  async process(): Promise<ProcessingResult> {
    // PDF-specific processing
    return { success: true, extractedText: "..." };
  }
}

class ImageDocument implements Document {
  async process(): Promise<ProcessingResult> {
    // Image-specific processing
    return { success: true, extractedText: "..." };
  }
}

// Can use any Document type interchangeably
function processDocument(doc: Document) {
  return doc.process(); // Works with any Document implementation
}
```

**I - Interface Segregation Principle**
```typescript
// ❌ BAD - Fat interface
interface FormService {
  create(): void;
  update(): void;
  delete(): void;
  validate(): void;
  export(): void;
  import(): void;
  analyze(): void;
}

// ✅ GOOD - Segregated interfaces
interface FormCRUD {
  create(): void;
  update(): void;
  delete(): void;
}

interface FormValidator {
  validate(): void;
}

interface FormExporter {
  export(): void;
  import(): void;
}

interface FormAnalyzer {
  analyze(): void;
}

// Classes implement only what they need
class BasicFormService implements FormCRUD, FormValidator {
  create() { /*...*/ }
  update() { /*...*/ }
  delete() { /*...*/ }
  validate() { /*...*/ }
}
```

**D - Dependency Inversion Principle**
```typescript
// ❌ BAD - High-level module depends on low-level module
class ConversationEngine {
  private claude = new ClaudeAPI(); // Concrete dependency
  
  async ask(question: string) {
    return this.claude.complete(question);
  }
}

// ✅ GOOD - Both depend on abstraction
interface LLMProvider {
  complete(prompt: string): Promise<string>;
}

class ClaudeProvider implements LLMProvider {
  async complete(prompt: string): Promise<string> {
    // Claude-specific implementation
  }
}

class ConversationEngine {
  constructor(private llm: LLMProvider) {} // Depends on abstraction
  
  async ask(question: string) {
    return this.llm.complete(question);
  }
}

// Easy to swap providers
const engine1 = new ConversationEngine(new ClaudeProvider());
const engine2 = new ConversationEngine(new GPTProvider());
```

### 5.5 Quality Gates

**All of these must pass before merge:**

```yaml
Quality Gate: Code Compilation
  - TypeScript compiles with zero errors
  - No type 'any' in new code
  - All imports resolve

Quality Gate: Linting
  - ESLint passes with zero errors
  - Prettier formatting applied
  - No console.log statements (use logger)
  - No commented-out code

Quality Gate: Testing
  - All unit tests pass
  - All integration tests pass
  - Test coverage >80% for new code
  - No skipped tests without justification

Quality Gate: SonarCloud
  - Code Smells: A rating (0-5 smells)
  - Bugs: 0
  - Vulnerabilities: 0
  - Security Hotspots: Reviewed
  - Coverage: >80%
  - Duplications: <3%
  - Maintainability Rating: A

Quality Gate: Security
  - Snyk scan passes (no high/critical vulnerabilities)
  - No hardcoded secrets
  - No SQL injection vectors
  - No XSS vulnerabilities

Quality Gate: Performance
  - Lighthouse score >90 (for UI changes)
  - No bundle size increase >10% (without justification)
  - API response time <200ms p95 (for API changes)

Quality Gate: Accessibility
  - No accessibility violations (axe-core)
  - Keyboard navigation works
  - Screen reader tested (for UI changes)
```

**Enforcement via GitHub Actions:**
```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  pull_request:
    branches: [main]

jobs:
  compile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: pnpm install
      - name: TypeScript compilation
        run: pnpm tsc --noEmit

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run ESLint
        run: pnpm lint
      - name: Check Prettier
        run: pnpm prettier --check .

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: pnpm test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  sonarcloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```