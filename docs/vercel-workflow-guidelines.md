# Vercel Workflow Guidelines

## Overview

Vercel Workflow provides durable execution for TypeScript functions that:
- Resume automatically after crashes or deployments
- Survive failures through deterministic replay
- Maintain state across minutes to months

---

## Core Concepts

### Workflows (`'use workflow'`)

Stateful functions that coordinate multi-step logic.

```typescript
export async function chatflowGenerationWorkflow(description: string) {
  'use workflow'

  const schema = await generateSchema(description)
  const validated = await validateSchema(schema)
  const chatflow = await saveChatflow(validated)

  return chatflow
}
```

### Steps (`'use step'`)

Isolated, retriable operations with automatic retries.

```typescript
async function generateSchema(description: string) {
  'use step'

  return await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages: [{ role: 'user', content: description }]
  })
}
```

### Sleep

Zero-resource pauses for delays.

```typescript
import { sleep } from 'workflow'

await sleep('24h')  // No resources consumed
await sleep('5m')
await sleep('7d')
```

---

## When to Create Steps

**DO create steps for:**
- External API calls (Claude, OCR, webhooks)
- Database writes (critical data)
- Long operations (>5 seconds)

**DON'T create steps for:**
- Simple validation
- Data transformations
- Database reads (unless critical)

---

## Error Handling

### Error Classification

```typescript
import { FatalError, RetryableError } from 'workflow'

async function processDocument(docId: string) {
  'use step'

  try {
    return await textract.analyze(docId)
  } catch (error) {
    if (error.code === 'RATE_LIMIT') {
      throw new RetryableError('Rate limited')  // Auto-retry
    }
    if (error.code === 'NOT_FOUND') {
      throw new FatalError('Document not found')  // Stop workflow
    }
    throw error
  }
}
```

**FatalError** - Unrecoverable (invalid input, not found)
**RetryableError** - Transient (network, rate limit)

---

## Best Practices

### 1. Keep State Small

```typescript
// GOOD - Pass IDs
const resultId = await processDocument(documentId)
return { resultId }

// BAD - Pass large objects
const largeData = await fetchDocument(documentId)
return largeData  // Too large!
```

**Target:** < 100KB per workflow state

### 2. Make Steps Idempotent

```typescript
// GOOD - Check before creating
async function createChatflow(data: Data) {
  'use step'

  const existing = await prisma.chatflow.findUnique({
    where: { shareUrl: data.shareUrl }
  })
  if (existing) return existing

  return await prisma.chatflow.create({ data })
}
```

### 3. Isolate External Calls

```typescript
// GOOD - External call in step
async function callAPI(input: string) {
  'use step'
  return await externalAPI.call(input)
}

// BAD - No retries
export async function workflow() {
  'use workflow'
  await externalAPI.call(input)  // No step!
}
```

### 4. Be Deterministic

```typescript
// BAD - Non-deterministic in workflow
export async function workflow() {
  'use workflow'
  const random = Math.random()  // Different on replay!
}

// GOOD - Non-deterministic in step
async function getRandom() {
  'use step'
  return Math.random()
}
```

---

## Common Patterns

### Sequential Steps

```typescript
const step1 = await firstStep(input)
const step2 = await secondStep(step1)
const step3 = await thirdStep(step2)
```

### Parallel Steps

```typescript
const [a, b, c] = await Promise.all([
  stepA(input),
  stepB(input),
  stepC(input)
])
```

### Conditional Logic

```typescript
const analysis = await analyzeInput(input)

if (analysis.needsApproval) {
  await requestApproval(input)
}

return await processInput(input)
```

---

## IoZen Workflows

### Chatflow Generation

```typescript
export async function chatflowGenerationWorkflow(params: {
  userId: string
  description: string
}) {
  'use workflow'

  const schema = await generateSchemaStep(params.description)
  const validated = await validateSchemaStep(schema)
  const shareUrl = await generateShareUrlStep()

  const chatflow = await saveChatflowStep({
    userId: params.userId,
    schema: validated,
    shareUrl,
    status: 'DRAFT'
  })

  return { chatflowId: chatflow.id }
}
```

---

## Step Count Guidelines

| Workflow | Target Steps |
|----------|-------------|
| Schema generation | 3-5 |
| Form completion | 10-15 |
| Document processing | 5-8 |
| Results interpretation | 3-5 |

**Rule:** If >25 steps, refactor to batch operations.

---

## Observability

Every workflow automatically logs:
- Workflow start/end
- Step execution times
- Input/output payloads
- Errors and retries

View in Vercel Dashboard → AI → Workflows

---

## When to Use Workflows

**USE for:**
- Multi-step processes
- Long-running operations
- Human-in-the-loop scenarios
- Processes that need to survive deployments

**DON'T USE for:**
- Simple CRUD operations
- Real-time responses (<1 second)
- High-frequency operations (>1000/sec)
