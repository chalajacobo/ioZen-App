# Architecture

---

## 2. Architecture

### 2.1 Architectural Principles

**AP1: Start Monolithic, Think Modular**
- Build as a well-structured monolith with clear module boundaries
- Design for eventual microservices extraction (loose coupling, high cohesion)
- Extract services only when proven necessary (document processing likely first)

**AP2: Favor Managed Services Over Custom Infrastructure**
- Use Vercel Workflow over building custom queue systems
- Use Supabase over managing Postgres + Auth + Storage separately
- Use third-party AI APIs over training custom models (initially)

**AP3: Design for Determinism & Idempotency**
- Every step must be deterministic (same inputs → same outputs)
- Steps must be idempotent (safe to retry multiple times)
- No Date.now(), Math.random(), or non-deterministic operations in steps
- Implement proper error classification (FatalError vs RetryableError)
- Every external API call can fail - design accordingly with circuit breakers
- Graceful degradation (AI fails → fallback to rule-based)
- Workflows are automatically resumable by Vercel Workflow (design steps for replay)

**AP4: Optimize for Developer Velocity**
- Shared types across frontend/backend (TypeScript monorepo)
- Hot reload in development
- Fast test suite (<30 seconds for unit tests)
- One-command deployment

**AP5: Security by Design**
- Principle of least privilege (database RLS, API permissions)
- Encrypt sensitive data at rest
- Never log PII
- Rate limiting on all public endpoints
- Input validation at every boundary

**AP6: Provider Abstraction (Plug-and-Play)**
- Modules depend on interfaces, not concrete implementations
- Provider-agnostic design allows swapping LLM/Vision/OCR providers
- Support multiple providers simultaneously (primary + fallback)
- Configuration-driven provider selection
- New providers can be added without changing business logic

**AP7: Optimize for Workflow Efficiency**
- Keep workflow state small (pass IDs, not full objects - target <100KB per workflow)
- Balance step granularity (durability vs cost - target <20 steps per typical workflow)
- Use sleep() for time-based delays (zero resource consumption during pauses)
- Leverage webhooks for external event integration (human-in-the-loop, async processes)
- Design steps as logical durability boundaries, not every function call
- Store large data (documents, images) in Supabase, pass references between steps


### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Web App (Next.js 14)              Mobile Web (Responsive)      │
│  - Form Builder Interface          - Optimized Chat UI          │
│  - Admin Dashboard                 - Touch-first Design          │
│  - Analytics & Reports             - Offline Capability          │
│                                                                  │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ HTTPS / WebSocket (Realtime)
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API / APPLICATION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Next.js App Router + tRPC                                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Routes / tRPC Procedures                 │  │
│  │  /api/forms/*        - Form CRUD operations              │  │
│  │  /api/conversations/* - Chat interactions                │  │
│  │  /api/documents/*    - Document upload/processing        │  │
│  │  /api/analytics/*    - Reporting & insights              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Domain Modules (Clean Architecture)                            │
│                                                                  │
│  /modules                                                        │
│    ├─ schema-definition/         AI generates form schemas      │
│    │   ├─ domain/                Entities, value objects        │
│    │   ├─ application/            Use cases, services           │
│    │   └─ infrastructure/         AI integrations               │
│    │                                                             │
│    ├─ conversation-engine/       Manages chat interactions      │
│    │   ├─ domain/                Conversation entities          │
│    │   ├─ application/            Question generation           │
│    │   └─ infrastructure/         Claude API integration        │
│    │                                                             │
│    ├─ validation-engine/         Multi-level validation         │
│    │   ├─ domain/                Validation rules               │
│    │   ├─ application/            Validation orchestration      │
│    │   └─ infrastructure/         AI validators, OCR            │
│    │                                                             │
│    ├─ document-processing/       OCR + extraction               │
│    │   ├─ domain/                Document entities              │
│    │   ├─ application/            Processing pipeline           │
│    │   └─ infrastructure/         Textract, Vision API          │
│    │                                                             │
│    └─ results-interpretation/    AI analyzes submissions        │
│        ├─ domain/                Interpretation models          │
│        ├─ application/            Analysis services             │
│        └─ infrastructure/         AI analysis APIs              │
│                                                                  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 WORKFLOW ORCHESTRATION LAYER                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Vercel Workflows                                               │
│                                                                  │
│  /workflows                                                      │
│    ├─ form-completion.workflow.ts                              │
│    │   → Orchestrates entire form filling process              │
│    │                                                             │
│    ├─ document-processing.workflow.ts                          │
│    │   → OCR → Extraction → Validation → Auto-fill             │
│    │                                                             │
│    ├─ validation-pipeline.workflow.ts                          │
│    │   → Basic → Business → AI → Cross-field validation        │
│    │                                                             │
│    └─ results-interpretation.workflow.ts                       │
│        → Analysis → Insights → Webhooks                         │
│                                                                  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATA & INFRASTRUCTURE LAYER                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Supabase (PostgreSQL + Auth + Storage + Realtime)         │
│                                                                  │
│  Database Tables:                                               │
│    ├─ organizations          Multi-tenant isolation             │
│    ├─ users                  User accounts & roles              │
│    ├─ forms                  Form definitions & schemas         │
│    ├─ form_submissions       Collected data & status            │
│    ├─ conversation_messages  Chat history                       │
│    ├─ documents              Uploaded files & extraction        │
│    ├─ validation_rules       Custom validation logic            │
│    └─ workflow_executions    Workflow state & history           │
│                                                                  │
│  Row Level Security (RLS):   Organization-based isolation       │
│  Realtime:                   Live updates to chat UI            │
│  Storage:                    Document uploads (5GB limit/org)   │
│                                                                  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Provider Abstraction Layer:                                   │
│    ├─ ILLMProvider           Abstract LLM interface            │
│    │   ├─ Anthropic Claude   (Implementation)                 │
│    │   ├─ OpenAI GPT-4       (Implementation)                 │
│    │   ├─ Cohere             (Implementation)                 │
│    │   └─ (Future: Self-hosted)                               │
│    │                                                           │
│    ├─ IVisionProvider        Abstract Vision API interface     │
│    │   ├─ OpenAI GPT-4 Vision  (Implementation)               │
│    │   ├─ Google Vertex AI   (Implementation)                 │
│    │   └─ Anthropic Claude Vision (Implementation)            │
│    │                                                           │
│    └─ ITextExtractionProvider  Abstract OCR interface         │
│        ├─ AWS Textract       (Primary implementation)         │
│        ├─ Google Document AI (Fallback implementation)        │
│        ├─ Azure Form Recognizer (Implementation)              │
│        └─ Tesseract (Local fallback)                          │
│                                                                  │
│  Provider Configuration:                                       │
│    - Environment-based provider selection                      │
│    - Per-organization provider preferences                     │
│    - Automatic failover (primary → fallback)                   │
│    - Provider health monitoring & circuit breakers             │
│                                                                  │
│  Monitoring & Observability:                                    │
│    ├─ Workflow Observability (Built-in):                       │
│    │   • Automatic step execution traces                       │
│    │   • Input/output logging for all steps                    │
│    │   • Failure analysis and retry tracking                   │
│    │   • Zero instrumentation required                         │
│    ├─ Vercel Analytics      Performance monitoring             │
│    ├─ Sentry                Application error tracking         │
│    └─ PostHog               Product analytics & funnels        │
│                                                                  │
│  Quality & Security:                                            │
│    ├─ SonarCloud            Code quality metrics               │
│    └─ Snyk                  Dependency vulnerability scanning  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Module Boundaries & Responsibilities

**Critical Principle:** Each module is a **bounded context** with clear inputs/outputs.

#### Schema Definition Module

**Responsibility:** Convert natural language → structured form schemas

**Public Interface:**
```typescript
interface ISchemaDefinitionService {
  generateSchema(prompt: string, options?: GenerationOptions): Promise<FormSchema>;
  refineSchema(schemaId: string, refinement: string): Promise<FormSchema>;
  validateSchema(schema: FormSchema): ValidationResult;
  suggestImprovements(schema: FormSchema): Suggestion[];
}
```

**Dependencies:**
- ✅ ILLMProvider (for schema generation - provider-agnostic)
- ❌ No dependencies on other modules
- ❌ No dependencies on concrete AI providers

**Consumed By:**
- Form builder UI
- Conversation engine (to know what to ask)

---

#### Conversation Engine Module

**Responsibility:** Conduct intelligent conversations to collect form data

**Public Interface:**
```typescript
interface IConversationService {
  startConversation(formId: string, userId: string): Promise<Conversation>;
  sendMessage(conversationId: string, message: string): Promise<Response>;
  generateQuestion(field: FieldDefinition, context: ConversationContext): Promise<Question>;
  handleClarification(conversationId: string, clarification: string): Promise<Response>;
  resumeConversation(conversationId: string): Promise<Conversation>;
}
```

**Dependencies:**
- ✅ Schema Definition (to read form structure)
- ✅ Validation Engine (to validate responses)
- ✅ ILLMProvider (for question generation - provider-agnostic)
- ❌ No dependencies on concrete AI providers

**Consumed By:**
- Chat UI
- Form completion workflow

---

#### Validation Engine Module

**Responsibility:** Multi-level validation of user inputs

**Public Interface:**
```typescript
interface IValidationService {
  validateField(field: string, value: any, rules: ValidationRules): Promise<ValidationResult>;
  validateDocument(documentId: string, expectedType: string): Promise<DocumentValidation>;
  validateCrossField(fields: Record<string, any>, rules: CrossFieldRule[]): Promise<ValidationResult>;
  extractFromDocument(documentId: string, fields: string[]): Promise<ExtractionResult>;
}
```

**Validation Levels:**
1. **Basic:** Type, format, required checks (synchronous)
2. **Business Rules:** Custom logic, database lookups (synchronous)
3. **AI Semantic:** Does this make sense? (async, AI-powered)
4. **Cross-Field:** Relationships between fields (synchronous)
5. **Document:** OCR + extraction + verification (async, workflow)

**Dependencies:**
- ✅ ILLMProvider (semantic validation - provider-agnostic)
- ✅ ITextExtractionProvider (OCR - provider-agnostic)
- ✅ IVisionProvider (image analysis - provider-agnostic)
- ❌ No dependencies on concrete AI providers

**Consumed By:**
- Conversation engine
- Validation pipeline workflow

---

#### Document Processing Module

**Responsibility:** Extract structured data from documents

**Public Interface:**
```typescript
interface IDocumentProcessingService {
  processDocument(documentId: string): Promise<ProcessingResult>;
  detectDocumentType(documentId: string): Promise<DocumentType>;
  extractFields(documentId: string, documentType: DocumentType): Promise<ExtractedData>;
  verifyAuthenticity(documentId: string): Promise<AuthenticityCheck>;
}
```

**Processing Pipeline:**
1. Download from storage
2. Detect document type (AI vision)
3. OCR text extraction
4. Structured field extraction (AI)
5. Fraud/tampering detection
6. Store results

**Dependencies:**
- ✅ Supabase Storage
- ✅ ITextExtractionProvider (OCR - provider-agnostic)
- ✅ IVisionProvider (document analysis - provider-agnostic)
- ❌ No dependencies on concrete providers

**Consumed By:**
- Document processing workflow
- Conversation engine (for auto-fill)

---

#### Results Interpretation Module

**Responsibility:** Transform collected data → actionable insights

**Public Interface:**
```typescript
interface IResultsInterpretationService {
  analyzeSubmission(submissionId: string): Promise<Interpretation>;
  generateSummary(submissionId: string): Promise<Summary>;
  detectAnomalies(submissionId: string): Promise<Anomaly[]>;
  suggestActions(submissionId: string): Promise<Action[]>;
  compareToBaseline(submissionId: string): Promise<Comparison>;
}
```

**Interpretation Types:**
- **Summary:** Natural language overview of submission
- **Risk Assessment:** Flags, confidence scores
- **Recommendations:** Next steps for user
- **Anomaly Detection:** Outliers, inconsistencies
- **Trend Analysis:** Patterns across submissions

**Dependencies:**
- ✅ ILLMProvider (for analysis - provider-agnostic)
- ✅ Database (for historical comparisons)
- ❌ No dependencies on concrete AI providers

**Consumed By:**
- Admin dashboard
- Results interpretation workflow
- Webhook dispatchers

---

### 2.4 Provider Abstraction Layer

**Critical Principle:** Business logic modules never depend on concrete providers. They depend on abstract interfaces, enabling plug-and-play provider swapping.

#### Provider Interfaces

**ILLMProvider Interface:**
```typescript
interface ILLMProvider {
  name: string;
  health(): Promise<ProviderHealth>;
  
  // Text completion
  complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;
  
  // Structured output
  generateStructured<T>(
    prompt: string,
    schema: ZodSchema<T>
  ): Promise<T>;
  
  // Streaming support
  stream(request: LLMCompletionRequest): AsyncIterable<string>;
  
  // Embeddings (for semantic search)
  embed(text: string): Promise<number[]>;
}
```

**IVisionProvider Interface:**
```typescript
interface IVisionProvider {
  name: string;
  health(): Promise<ProviderHealth>;
  
  // Image analysis
  analyzeImage(request: VisionAnalysisRequest): Promise<VisionAnalysisResponse>;
  
  // Document understanding
  extractDocumentFields(
    image: Buffer,
    expectedFields: string[]
  ): Promise<Record<string, any>>;
  
  // Object detection
  detectObjects(image: Buffer): Promise<DetectedObject[]>;
}
```

**ITextExtractionProvider Interface:**
```typescript
interface ITextExtractionProvider {
  name: string;
  health(): Promise<ProviderHealth>;
  
  // OCR text extraction
  extractText(document: Buffer, options?: ExtractionOptions): Promise<ExtractedText>;
  
  // Form field extraction
  extractFormFields(
    document: Buffer,
    formType: string
  ): Promise<Record<string, any>>;
  
  // Table extraction
  extractTables(document: Buffer): Promise<ExtractedTable[]>;
}
```

#### Provider Registry & Configuration

**Provider Registry Pattern:**
```typescript
// lib/providers/registry.ts
class ProviderRegistry {
  private llmProviders: Map<string, ILLMProvider> = new Map();
  private visionProviders: Map<string, IVisionProvider> = new Map();
  private textExtractionProviders: Map<string, ITextExtractionProvider> = new Map();
  
  // Register providers
  registerLLMProvider(name: string, provider: ILLMProvider): void;
  registerVisionProvider(name: string, provider: IVisionProvider): void;
  registerTextExtractionProvider(name: string, provider: ITextExtractionProvider): void;
  
  // Get providers (with fallback)
  getLLMProvider(organizationId?: string): ILLMProvider;
  getVisionProvider(organizationId?: string): IVisionProvider;
  getTextExtractionProvider(organizationId?: string): ITextExtractionProvider;
  
  // Health checks
  checkAllProviders(): Promise<ProviderHealthReport>;
}
```

**Configuration System:**
```typescript
// Provider configuration (environment variables or database)
interface ProviderConfig {
  llm: {
    primary: 'anthropic' | 'openai' | 'cohere';
    fallback: 'anthropic' | 'openai' | 'cohere';
    organizationOverrides?: Record<string, 'anthropic' | 'openai' | 'cohere'>;
  };
  vision: {
    primary: 'openai' | 'google' | 'anthropic';
    fallback: 'openai' | 'google' | 'anthropic';
  };
  textExtraction: {
    primary: 'aws-textract' | 'google-document-ai' | 'azure';
    fallback: 'aws-textract' | 'google-document-ai' | 'azure' | 'tesseract';
  };
}
```

#### Provider Implementations

**Implementation Structure:**
```
/lib/providers
  /llm
    /anthropic
      AnthropicProvider.ts         (implements ILLMProvider)
      AnthropicProvider.test.ts
    /openai
      OpenAIProvider.ts            (implements ILLMProvider)
      OpenAIProvider.test.ts
    /cohere
      CohereProvider.ts            (implements ILLMProvider)
      CohereProvider.test.ts
    index.ts                       (exports all LLM providers)
  
  /vision
    /openai
      OpenAIVisionProvider.ts      (implements IVisionProvider)
    /google
      GoogleVisionProvider.ts      (implements IVisionProvider)
    /anthropic
      AnthropicVisionProvider.ts   (implements IVisionProvider)
    index.ts
  
  /text-extraction
    /aws-textract
      AWSTextractProvider.ts       (implements ITextExtractionProvider)
    /google-document-ai
      GoogleDocumentAIProvider.ts  (implements ITextExtractionProvider)
    /azure
      AzureFormRecognizerProvider.ts (implements ITextExtractionProvider)
    /tesseract
      TesseractProvider.ts         (implements ITextExtractionProvider - local fallback)
    index.ts
  
  registry.ts                      (Provider registry & factory)
  health.ts                        (Provider health checks)
  circuit-breaker.ts               (Circuit breaker pattern)
```

#### Adding a New Provider

**Steps to Add New Provider:**

1. **Create Implementation:**
```typescript
// lib/providers/llm/new-provider/NewProvider.ts
import { ILLMProvider, LLMCompletionRequest, LLMCompletionResponse } from '../types';

export class NewProvider implements ILLMProvider {
  name = 'new-provider';
  
  async health(): Promise<ProviderHealth> {
    // Check provider availability
  }
  
  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    // Implement completion logic
  }
  
  // ... implement other interface methods
}
```

2. **Register Provider:**
```typescript
// lib/providers/registry.ts
import { NewProvider } from './llm/new-provider';

// On application startup
registry.registerLLMProvider('new-provider', new NewProvider({
  apiKey: process.env.NEW_PROVIDER_API_KEY,
}));
```

3. **Update Configuration:**
```typescript
// Add to ProviderConfig type
llm: {
  primary: 'anthropic' | 'openai' | 'new-provider';  // Add option
}
```

4. **No Changes to Business Logic Required:** All modules automatically get access to new provider via interface.

#### Multi-Provider Support & Failover

**Failover Strategy:**
```typescript
class ProviderWithFallback {
  constructor(
    private primary: ILLMProvider,
    private fallback: ILLMProvider,
    private circuitBreaker: CircuitBreaker
  ) {}
  
  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    try {
      // Try primary provider
      if (this.circuitBreaker.isOpen(this.primary.name)) {
        throw new Error('Circuit breaker open');
      }
      
      const response = await this.primary.complete(request);
      this.circuitBreaker.recordSuccess(this.primary.name);
      return response;
      
    } catch (error) {
      this.circuitBreaker.recordFailure(this.primary.name);
      
      // Fallback to secondary
      if (this.circuitBreaker.isOpen(this.fallback.name)) {
        throw new Error('All providers unavailable');
      }
      
      const response = await this.fallback.complete(request);
      this.circuitBreaker.recordSuccess(this.fallback.name);
      return response;
    }
  }
}
```

**Circuit Breaker Pattern:**
- Tracks provider health
- Opens circuit after N consecutive failures
- Attempts reset after timeout
- Prevents cascading failures

#### Provider Selection Strategy

**Selection Logic:**
1. **Organization-level overrides** (if configured)
2. **Primary provider** (from config)
3. **Automatic failover** (if primary unhealthy)
4. **Cost optimization** (select cheaper provider if performance acceptable)
5. **Feature-specific** (use provider with specific capabilities)

**Example:**
```typescript
// Organization can configure preferred provider
const orgConfig = await db.organization.findUnique({
  where: { id: organizationId },
  select: { providerPreferences: true }
});

// Use org preference or fallback to default
const provider = registry.getLLMProvider(organizationId, {
  preferCostEffective: true,
  requireFeatures: ['streaming', 'function-calling']
});
```

---

### 2.5 Data Flow Architecture

**Example: Complete Form Submission Flow**

```
┌─────────────┐
│   User      │
│  (Mobile)   │
└──────┬──────┘
       │
       │ 1. Starts conversation
       ▼
┌──────────────────────────────────────────────┐
│  Next.js API Route                           │
│  POST /api/conversations/start               │
└──────┬───────────────────────────────────────┘
       │
       │ 2. Triggers workflow
       ▼
┌──────────────────────────────────────────────┐
│  Vercel Workflow                             │
│  formCompletionWorkflow.trigger()            │
└──────┬───────────────────────────────────────┘
       │
       │ 3. Load form schema
       ▼
┌──────────────────────────────────────────────┐
│  Step: initialize                            │
│  - Fetch form from DB                        │
│  - Create conversation record                │
│  - Return context                            │
└──────┬───────────────────────────────────────┘
       │
       │ 4. Generate first question
       ▼
┌──────────────────────────────────────────────┐
│  Step: generate-question                     │
│  - ConversationService.generateQuestion()    │
│  - Uses ILLMProvider (provider-agnostic)     │
│  - Provider registry selects best provider   │
│  - Returns question to user                  │
└──────┬───────────────────────────────────────┘
       │
       │ 5. Workflow pauses, waiting for response
       │
┌──────┴───────────────────────────────────────┐
│  User responds                               │
│  POST /api/conversations/:id/message         │
└──────┬───────────────────────────────────────┘
       │
       │ 6. Resume workflow with user response
       ▼
┌──────────────────────────────────────────────┐
│  Step: validate-response                     │
│  - ValidationService.validateField()         │
│  - Multiple validation levels                │
└──────┬───────────────────────────────────────┘
       │
       │ 7a. If valid → store & continue
       │ 7b. If invalid → return error, re-ask
       ▼
┌──────────────────────────────────────────────┐
│  Step: store-response                        │
│  - Save to form_submissions.data (JSONB)     │
│  - Update progress                           │
└──────┬───────────────────────────────────────┘
       │
       │ 8. Check if more fields needed
       │
       ▼
┌──────────────────────────────────────────────┐
│  Decision: All fields collected?             │
│  - If no → Loop to generate-question         │
│  - If yes → Continue to document processing  │
└──────┬───────────────────────────────────────┘
       │
       │ 9. User uploads documents (async)
       ▼
┌──────────────────────────────────────────────┐
│  Step: process-documents                     │
│  - Triggers documentProcessingWorkflow       │
│  - Runs in parallel for multiple docs        │
│  - OCR + extraction + validation             │
└──────┬───────────────────────────────────────┘
       │
       │ 10. Auto-fill extracted data
       ▼
┌──────────────────────────────────────────────┐
│  Step: merge-extracted-data                  │
│  - Merge OCR results into submission         │
│  - Flag conflicts for user review            │
└──────┬───────────────────────────────────────┘
       │
       │ 11. Final validation pass
       ▼
┌──────────────────────────────────────────────┐
│  Step: final-validation                      │
│  - Cross-field validation                    │
│  - Business rule validation                  │
│  - Completeness check                        │
└──────┬───────────────────────────────────────┘
       │
       │ 12. Interpret results
       ▼
┌──────────────────────────────────────────────┐
│  Step: interpret-results                     │
│  - ResultsInterpretationService.analyze()    │
│  - Generate summary & recommendations        │
│  - Detect anomalies                          │
└──────┬───────────────────────────────────────┘
       │
       │ 13. Finalize & notify
       ▼
┌──────────────────────────────────────────────┐
│  Step: finalize                              │
│  - Mark submission as complete               │
│  - Trigger webhooks                          │
│  - Send confirmation email                   │
│  - Log to analytics                          │
└──────────────────────────────────────────────┘
```

**Key Architectural Decisions:**

1. **Workflow as Orchestrator:** Workflows coordinate modules but don't contain business logic
2. **Modules as Services:** Business logic lives in modules, invoked by workflows
3. **Database as Source of Truth:** All state persisted to Supabase, workflows are stateless
4. **Realtime Updates:** Supabase Realtime pushes updates to UI as workflow progresses
5. **Resumability:** User can close browser at any point, workflow continues and is resumable
6. **Provider Abstraction:** All modules depend on interfaces, not concrete providers - enables plug-and-play
7. **Multi-Provider Support:** Primary + fallback providers with automatic failover and circuit breakers
8. **Configuration-Driven:** Provider selection via environment variables or per-organization settings

---

### 2.6 Workflow Temporal Patterns & Advanced Features

This section covers Vercel Workflow's powerful capabilities that enable long-running processes, event-driven resumption, and automatic observability.

#### 2.6.1 Workflow Duration Categories

**Synchronous Workflows (<30 seconds):**
- Form schema generation from natural language
- Real-time field validation
- Question generation for conversation
- Pattern: Sequential steps, immediate execution, no sleep()
- Example: User requests form creation → schema generated → returned in <10s

**Asynchronous Workflows (30s - 1 hour):**
- Document OCR processing (Textract can take minutes)
- Multi-document batch processing
- Results interpretation with AI analysis
- Pattern: Long-running steps with progress updates via Supabase Realtime
- Example: User uploads 5 documents → processed in parallel → 2-3 minutes total

**Long-Duration Workflows (>1 hour):**
- Form completion reminders (24h, 48h delays)
- Scheduled report generation (weekly/monthly)
- Compliance deadline tracking
- Pattern: sleep() between steps, webhook resumption for external events
- Example: User starts form → abandons → sleep(24h) → reminder sent

---

#### 2.6.2 🚀 POWERFUL FEATURE #1: Zero-Resource Time Delays with sleep()

**Capability:**
Vercel Workflow can pause for minutes, hours, days, or even months **without consuming any compute resources**. During sleep periods, no servers are running, no costs are incurred.

**Use Cases in Our Platform:**

**1. Form Completion Reminders (Post-MVP v1.1)**
```typescript
import { sleep } from "workflow";

export async function formReminderWorkflow(submissionId: string) {
  "use workflow";

  // Check if form is incomplete
  const submission = await getSubmission(submissionId);

  if (submission.status !== 'completed') {
    // Sleep for 24 hours - ZERO resources consumed during this time
    await sleep("24h");

    // Check again after 24 hours
    if (await isStillIncomplete(submissionId)) {
      await sendReminderEmail(submissionId);

      // Sleep for another 48 hours
      await sleep("48h");

      // Final reminder
      if (await isStillIncomplete(submissionId)) {
        await sendFinalReminder(submissionId);
      }
    }
  }
}
```

**2. Rate Limit Handling**
```typescript
export async function documentProcessingWorkflow(documentId: string) {
  "use workflow";

  try {
    const result = await extractWithTextract(documentId);
    return result;
  } catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      // Sleep until rate limit resets - no resources used
      await sleep("5m");

      // Retry after rate limit period
      return await extractWithTextract(documentId);
    }
    throw error;
  }
}
```

**3. Scheduled Operations**
```typescript
export async function weeklyReportWorkflow(organizationId: string) {
  "use workflow";

  while (true) {
    // Generate weekly report
    await generateReport(organizationId);

    // Sleep for 7 days - workflow stays alive but uses zero resources
    await sleep("7d");
  }
}
```

**Benefits:**
- ✅ No polling required (traditional approach: cron job checks every minute)
- ✅ Zero cost during sleep periods (vs keeping servers running)
- ✅ Exact timing (sleep for "24h 30m 15s")
- ✅ Workflow context preserved across sleep periods

**When to Use:**
- Delayed notifications or reminders
- Rate limit backoff strategies
- Scheduled recurring tasks
- Multi-day approval processes
- Compliance deadline tracking

---

#### 2.6.3 🚀 POWERFUL FEATURE #2: Webhook-Based Event Resumption

**Capability:**
Workflows can pause and wait for external events (human approvals, payment confirmations, third-party callbacks) for indefinite periods. The workflow resumes automatically when a webhook is triggered.

**Use Cases in Our Platform:**

**1. Human-in-the-Loop Claim Approval (Post-MVP v1.2)**
```typescript
import { createWebhook, fetch } from "workflow";

export async function claimApprovalWorkflow(submissionId: string) {
  "use workflow";

  // Analyze submission with AI
  const submission = await getSubmission(submissionId);
  const analysis = await analyzeSubmission(submission);

  if (analysis.requiresHumanReview) {
    // Create unique webhook URL for this approval
    const webhook = createWebhook();

    // Send approval request to claims adjuster with webhook URL
    await sendApprovalRequest(submissionId, {
      callbackUrl: webhook.url,
      reviewerEmail: analysis.assignedAdjuster,
      deadline: "72h"
    });

    // ⏸️ WORKFLOW PAUSES HERE (could be hours/days)
    // Zero resources consumed while waiting
    // When adjuster clicks approve/reject → webhook triggered → workflow resumes
    const { request } = await webhook;
    const decision = await request.json();

    // Continue based on decision
    if (decision.approved) {
      await processApprovedClaim(submissionId);
      await notifyClaimant(submissionId, 'approved');
    } else {
      await rejectClaim(submissionId, decision.reason);
      await notifyClaimant(submissionId, 'rejected', decision.reason);
    }
  } else {
    // AI approved - process automatically
    await processApprovedClaim(submissionId);
  }

  return { submissionId, status: 'completed' };
}
```

**2. Payment Verification**
```typescript
export async function paymentVerificationWorkflow(orderId: string) {
  "use workflow";

  const webhook = createWebhook();

  // Initiate payment with Stripe, provide webhook URL
  await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    body: JSON.stringify({
      amount: 50000, // $500.00
      callback_url: webhook.url
    })
  });

  // Wait for Stripe to call webhook (could be minutes or hours)
  const { request } = await webhook;
  const paymentResult = await request.json();

  if (paymentResult.status === 'succeeded') {
    await activateSubscription(orderId);
  } else {
    await handlePaymentFailure(orderId, paymentResult.error);
  }
}
```

**3. Multi-Party Approval Workflow**
```typescript
export async function multiPartyApprovalWorkflow(submissionId: string) {
  "use workflow";

  const approvers = ['manager@company.com', 'director@company.com', 'cfo@company.com'];
  const approvals = [];

  for (const approver of approvers) {
    const webhook = createWebhook();
    await sendApprovalRequest(approver, webhook.url);

    // Wait for this approver's decision
    const { request } = await webhook;
    const decision = await request.json();

    approvals.push({ approver, decision });

    // If anyone rejects, stop workflow
    if (!decision.approved) {
      await handleRejection(submissionId, approver);
      return { status: 'rejected', rejectedBy: approver };
    }
  }

  // All approved
  await finalizeApproval(submissionId);
  return { status: 'approved', approvals };
}
```

**Benefits:**
- ✅ Eliminates polling (traditional approach: check database every 30 seconds)
- ✅ Zero resources during wait (vs keeping WebSocket connections alive)
- ✅ Unlimited wait time (hours, days, weeks)
- ✅ Type-safe webhook payloads
- ✅ Automatic retry if webhook fails

**When to Use:**
- Human approval workflows
- Payment processing callbacks
- Third-party integrations (Stripe, Twilio, etc.)
- Multi-day processes (insurance claims often take weeks)
- External system dependencies

---

#### 2.6.4 🚀 POWERFUL FEATURE #3: Built-in Observability (Zero Instrumentation)

**Capability:**
Every workflow execution is automatically traced, logged, and monitored **without writing any instrumentation code**. All step inputs, outputs, errors, and retries are captured.

**What Gets Tracked Automatically:**

```typescript
export async function formCompletionWorkflow(formId: string) {
  "use workflow";

  // ✅ Automatically logged: workflow started, input: formId

  const schema = await generateSchema(formId);
  // ✅ Automatically logged:
  //    - Step "generateSchema" started
  //    - Input: formId
  //    - Output: schema object
  //    - Duration: 2.3s
  //    - Status: success

  const answers = await collectAnswers(schema);
  // ✅ Automatically logged: all step details

  // If this step fails and retries:
  const processed = await processDocuments(answers.documentIds);
  // ✅ Automatically logged:
  //    - Attempt 1: failed (network timeout)
  //    - Attempt 2: failed (rate limit)
  //    - Attempt 3: success
  //    - Total retries: 2
  //    - Final duration: 45s

  return { submissionId: processed.id };
  // ✅ Automatically logged: workflow completed, output, total duration
}
```

**Observability Dashboard Access:**
- Vercel Dashboard: Real-time workflow execution viewer
- WDK CLI: Query workflow history from terminal
- Programmatic API: Fetch workflow logs for custom dashboards

**What You Can See:**
1. **Execution Timeline:** Visual timeline of all steps
2. **Step Details:** Input/output for every step
3. **Error Analysis:** Stack traces, retry attempts, failure reasons
4. **Performance Metrics:** Duration per step, bottleneck identification
5. **State Snapshots:** Workflow state at any point in time

**Separation of Concerns:**

```typescript
// Workflow observability: AUTOMATIC (Vercel Workflow)
export async function formCompletionWorkflow(formId: string) {
  "use workflow";
  // All steps traced automatically - no code needed
  const result = await processForm(formId);
  return result;
}

// Application observability: MANUAL (PostHog, Sentry)
async function processForm(formId: string) {
  "use step";

  // Track business metrics manually
  posthog.capture('form_completion_started', { formId });

  try {
    const result = await doWork(formId);

    // Track success
    posthog.capture('form_completion_succeeded', {
      formId,
      duration: result.duration
    });

    return result;
  } catch (error) {
    // Track errors
    sentry.captureException(error, { extra: { formId } });
    throw error;
  }
}
```

**Observability Strategy:**

| Layer | Tool | Purpose | Implementation |
|-------|------|---------|----------------|
| **Workflow Execution** | Vercel Workflow | Step traces, retries, failures | Automatic |
| **Application Metrics** | PostHog | User funnels, completion rates | Manual events |
| **Error Tracking** | Sentry | Application errors, bugs | Manual capture |
| **Performance** | Vercel Analytics | Page load, API latency | Automatic |

**Benefits:**
- ✅ No instrumentation code required
- ✅ Complete execution history retained
- ✅ Debug production issues easily (see exact state at failure)
- ✅ Performance profiling built-in
- ✅ Compliance audit trails (see who did what, when)

---

#### 2.6.5 State Size Management

**Critical Principle:** Keep workflow state small. Pass IDs, not full objects.

**Why This Matters:**
Workflow persists all step inputs/outputs for deterministic replay. Large payloads increase:
- Storage costs ($0.50 per GB/month)
- Network transfer time between steps
- Serialization overhead

**Anti-Pattern (Expensive):**

```typescript
// ❌ DON'T pass large data between steps
export async function documentProcessingWorkflow(documentId: string) {
  "use workflow";

  // Downloads 5MB image into workflow state
  const imageBuffer = await downloadImage(documentId);

  // Passes 5MB through workflow state
  const ocrResult = await ocrStep(imageBuffer);

  // Another 2MB in workflow state
  return ocrResult; // Now 7MB stored in workflow state!
}
```

**Best Practice (Efficient):**

```typescript
// ✅ DO pass IDs, retrieve data in steps
export async function documentProcessingWorkflow(documentId: string) {
  "use workflow";

  // Only ID stored in workflow state (50 bytes)
  const resultId = await ocrStep(documentId);

  // Small summary returned (1KB)
  return { resultId, status: 'completed' };
}

async function ocrStep(documentId: string) {
  "use step";

  // Download inside step (not in workflow state)
  const imageBuffer = await storage.download(documentId);

  // Process
  const result = await textract.analyze(imageBuffer);

  // Store result in Supabase (not workflow state)
  const resultId = await db.ocrResults.create({
    documentId,
    data: result
  });

  // Return small metadata only
  return resultId;
}
```

**State Size Guidelines:**

| Data Type | Workflow State | Supabase Storage | Reason |
|-----------|---------------|------------------|--------|
| IDs (documentId, userId) | ✅ Pass directly | N/A | Small (50 bytes) |
| Small metadata (name, status) | ✅ Pass directly | N/A | <1KB acceptable |
| Form schemas | ✅ Pass directly | N/A | Usually <10KB |
| Images, PDFs | ❌ Never | ✅ Store, pass ID | Large (MB) |
| OCR results (full text) | ❌ Never | ✅ Store, pass ID | Can be large |
| Conversation history | ⚠️ Pass summary | ✅ Store full | Only last N messages |

**Target:** <100KB per workflow execution state

---

#### 2.6.6 Error Classification & Handling

**Critical Distinction:** Fatal vs Retryable errors

**Import Workflow Error Types:**
```typescript
import { FatalError, RetryableError } from "workflow";
```

**FatalError - Halt Workflow (Unrecoverable):**

Use when the error indicates a permanent problem that retrying won't fix.

```typescript
async function validateFormSchema(schemaId: string) {
  "use step";

  const schema = await db.forms.findUnique({ where: { id: schemaId } });

  if (!schema) {
    // Fatal: form doesn't exist, retrying won't help
    throw new FatalError(`Form ${schemaId} not found`);
  }

  if (!isValidSchema(schema)) {
    // Fatal: schema is malformed, retrying won't fix it
    throw new FatalError('Schema validation failed: missing required fields');
  }

  return schema;
}
```

**Fatal Error Examples:**
- Resource not found (form, user, organization)
- Invalid input data (malformed schema, corrupt document)
- Business rule violations (policy expired, user unauthorized)
- Configuration errors (missing API keys, invalid settings)

**RetryableError - Auto-Retry (Transient):**

Use when the error might succeed if retried (network issues, rate limits, temporary outages).

```typescript
async function extractWithTextract(documentId: string) {
  "use step";

  try {
    const result = await textract.analyzeDocument(documentId);
    return result;
  } catch (error) {
    if (error.code === 'RateLimitExceeded') {
      // Retryable: temporary rate limit, will reset
      throw new RetryableError('Textract rate limit exceeded, will retry');
    }

    if (error.code === 'NetworkTimeout') {
      // Retryable: temporary network issue
      throw new RetryableError('Network timeout, will retry');
    }

    if (error.code === 'InvalidDocument') {
      // Fatal: document is corrupt, retrying won't fix
      throw new FatalError('Document is invalid and cannot be processed');
    }

    // Default: retryable (conservative approach)
    throw new RetryableError(error.message);
  }
}
```

**Retryable Error Examples:**
- Network timeouts or connection errors
- Rate limits (AI APIs, OCR services)
- Temporary service outages (503 errors)
- Database deadlocks or connection pool exhaustion
- Transient cloud infrastructure issues

**Retry Behavior:**
- Automatic exponential backoff (1s, 2s, 4s, 8s...)
- Configurable max retry attempts
- Workflow observability shows all retry attempts

**Combined with Circuit Breaker:**

```typescript
async function generateWithLLM(prompt: string) {
  "use step";

  const provider = registry.getLLMProvider(); // Gets primary or fallback

  try {
    const result = await provider.complete(prompt);
    return result;
  } catch (error) {
    if (circuitBreaker.isOpen(provider.name)) {
      // Circuit open: switch to fallback immediately
      throw new RetryableError(`${provider.name} circuit breaker open`);
    }

    if (error.status === 429) {
      // Rate limit: retryable
      circuitBreaker.recordFailure(provider.name);
      throw new RetryableError('LLM rate limit exceeded');
    }

    if (error.status === 401) {
      // Auth error: fatal (API key invalid)
      throw new FatalError('LLM authentication failed - check API key');
    }

    // Unknown error: retryable
    throw new RetryableError(error.message);
  }
}
```

---

#### 2.6.7 Step Granularity Guidelines

**Critical Trade-off:** Every step costs money and adds overhead, but provides durability.

**Pricing Context:**
- $25 per 1,000,000 steps
- At MVP scale (1,000 submissions/month): negligible
- At enterprise scale (100,000 submissions/month): still <$50/month

**When to Create a Step:**

✅ **External API calls** (durability protects against failures)
```typescript
async function generateSchema(prompt: string) {
  "use step"; // ✅ Claude API call - needs retry
  return await llmProvider.complete(prompt);
}
```

✅ **Database writes** (important state changes)
```typescript
async function saveSubmission(data: SubmissionData) {
  "use step"; // ✅ Critical data - needs durability
  return await db.submissions.create({ data });
}
```

✅ **Long-running operations** (>5 seconds)
```typescript
async function processLargeDocument(documentId: string) {
  "use step"; // ✅ OCR can take minutes - needs resume capability
  return await textract.analyze(documentId);
}
```

✅ **Logical durability boundaries** (checkpoints in workflow)
```typescript
export async function formCompletionWorkflow(formId: string) {
  "use workflow";

  const schema = await generateSchema(formId); // Step 1
  const answers = await collectAnswers(schema); // Step 2 (many user interactions, but one step)
  const validated = await validateSubmission(answers); // Step 3
  const saved = await saveSubmission(validated); // Step 4

  // ~4 steps total - good granularity
}
```

**When NOT to Create a Step:**

❌ **Cheap validation logic** (use regular functions)
```typescript
// ❌ DON'T make every validation a step
function validateEmail(email: string): boolean {
  // Regular function - runs instantly
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

❌ **Simple data transformations**
```typescript
// ❌ DON'T make transformations steps
function formatPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}
```

❌ **Database reads** (unless critical)
```typescript
// ⚠️ Usually don't need step for reads
async function getForm(formId: string): Promise<Form> {
  return await db.forms.findUnique({ where: { id: formId } });
}
```

❌ **Quick operations** (<1 second)
```typescript
// ❌ Too granular
async function calculateTotal(items: Item[]) {
  "use step"; // Overkill - this is instant
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Cost Optimization Example:**

```typescript
// ❌ EXPENSIVE: 15 questions × 3 steps each = 45 steps per form
export async function formCompletionWorkflow(formId: string) {
  "use workflow";

  for (const question of questions) {
    const answer = await askQuestion(question); // Step 1
    await validateAnswer(answer); // Step 2
    await saveAnswer(answer); // Step 3
  }
}

// ✅ OPTIMIZED: ~6 steps per form
export async function formCompletionWorkflow(formId: string) {
  "use workflow";

  // Generate all questions (1 step)
  const questions = await generateAllQuestions(formId);

  // Collect answers (user interactions - no steps needed, just waiting)
  const answers = [];
  for (const question of questions) {
    const answer = await waitForUserInput(question); // Not a step
    const isValid = validateAnswerSync(answer); // Not a step (instant)
    if (isValid) answers.push(answer);
  }

  // Batch save (1 step instead of 15)
  await saveAllAnswers(answers);

  // Process documents if any (1 step)
  if (answers.documents.length > 0) {
    await processDocuments(answers.documents);
  }

  // Final validation (1 step)
  await finalValidation(answers);
}
```

**Target Step Counts:**

| Workflow Type | Target Steps | Rationale |
|--------------|--------------|-----------|
| Form schema generation | 2-3 | Generate → Validate → Save |
| Form completion | 10-15 | Questions + Documents + Validation |
| Document processing | 5-8 | Upload → OCR → Extract → Validate |
| Results interpretation | 3-5 | Analyze → Generate insights → Notify |
| Reminder workflow | 3-5 | Check status → Sleep → Send reminder |

**Rule of Thumb:** If a workflow has >25 steps, refactor to batch operations.

---

#### 2.6.8 Summary: Leveraging Vercel Workflow's Power

**Three Game-Changing Capabilities:**

1. **💤 Zero-Resource Sleep** → Eliminates cron jobs, enables multi-day workflows, no cost during pauses
2. **🔔 Webhook Resumption** → Human-in-the-loop approvals, payment callbacks, zero polling
3. **📊 Built-in Observability** → Complete execution traces, zero instrumentation code

**Architectural Impact:**

These features fundamentally change how we design workflows:

| Traditional Approach | With Vercel Workflow | Benefit |
|---------------------|---------------------|---------|
| Cron job checks every 5 min | `sleep("24h")` | 99.7% fewer executions |
| Poll database for approvals | Webhook resumption | Zero polling overhead |
| Manual logging + tracing | Built-in observability | Zero instrumentation |
| Keep servers for long jobs | Suspend with zero cost | 100% cost reduction during pauses |
| Complex state management | Automatic persistence | Developer velocity |

**MVP Implementation Strategy:**

- **Week 1-12 (MVP):** Use basic sequential workflows, establish patterns
- **Week 13+ (Post-MVP):** Add reminder workflows with sleep()
- **Month 4-5 (v1.1):** Implement human-in-the-loop with webhooks
- **Month 6+ (v1.2+):** Advanced multi-party approval workflows

**Key Takeaway:**
Vercel Workflow is not just a task queue—it's a stateful orchestration platform that enables complex, long-running processes that were previously impractical or expensive to build.

---

