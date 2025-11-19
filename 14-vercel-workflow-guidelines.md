# Vercel Workflow Implementation Guidelines

**Version:** 1.0  
**Last Updated:** 2025-11-18  
**Purpose:** Comprehensive guide for implementing Vercel Workflow in IoZen

---

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Installation & Setup](#installation--setup)
4. [Workflow Patterns](#workflow-patterns)
5. [Best Practices](#best-practices)
6. [IoZen-Specific Implementation](#iozen-specific-implementation)
7. [Error Handling & Retries](#error-handling--retries)
8. [Observability & Monitoring](#observability--monitoring)
9. [Performance & Optimization](#performance--optimization)
10. [Common Pitfalls](#common-pitfalls)

---

## 1. Overview

### What is Vercel Workflow?

Vercel Workflow (built on the open-source Workflow Development Kit) provides **durable execution** for TypeScript/JavaScript functions. It allows you to write async/await code that:

- **Resumes automatically** after deployments, crashes, or pauses
- **Survives failures** through deterministic replay
- **Maintains state** across minutes to months
- **Requires zero infrastructure** management (no queues, no state stores)

### Key Value Propositions

1. **Reliability-as-Code:** Built-in retries, state persistence, and failure recovery
2. **Zero Infrastructure:** No message queues, no state databases, no worker pools
3. **Observability Built-In:** Every step, input, output, and error is automatically logged
4. **Idiomatic JavaScript:** Write normal async/await code with two simple directives

---

## 2. Core Concepts

### 2.1 Workflows (`'use workflow'`)

A **workflow** is a stateful function that coordinates multi-step logic over time.

**Characteristics:**
- Remembers its progress (durable state)
- Can pause and resume (even after deployments)
- Compiles into a route that orchestrates execution
- All inputs/outputs recorded in an event log
- Deterministic replay on interruption

**When to Use:**
- Logic that needs to pause/resume
- Processes spanning minutes to months
- Multi-step orchestration
- Human-in-the-loop scenarios

**Example:**
```typescript
export async function chatflowGenerationWorkflow(description: string) {
  'use workflow';
  
  // Step 1: Generate schema
  const schema = await generateChatflowSchema(description);
  
  // Step 2: Validate schema
  const validated = await validateSchema(schema);
  
  // Step 3: Save to database
  const chatflow = await saveChatflow(validated);
  
  return chatflow;
}
```

---

### 2.2 Steps (`'use step'`)

A **step** is a stateless function that runs a unit of durable work inside a workflow.

**Characteristics:**
- Built-in retries (automatic for transient failures)
- Survives network errors and process crashes
- Compiles into an isolated API route
- Workflow suspends (zero resources) while step executes
- Resumes automatically when step completes

**When to Use:**
- External API calls
- Database operations
- AI model invocations
- Any isolated, retriable operation

**Example:**
```typescript
async function generateChatflowSchema(description: string) {
  'use step';
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages: [{
      role: 'user',
      content: `Generate a chatflow schema for: ${description}`
    }]
  });
  
  return JSON.parse(response.content[0].text);
}
```

---

### 2.3 Sleep

**Sleep** pauses a workflow for a specified duration **without consuming compute resources**.

**Characteristics:**
- Zero resource consumption during sleep
- Workflow pauses and resumes when time expires
- Useful for delays (hours, days, weeks)

**When to Use:**
- Delayed actions (e.g., follow-up emails)
- Waiting periods (e.g., cooldown timers)
- Rate limiting (e.g., spacing API calls)

**Example:**
```typescript
import { sleep } from 'workflow';

export async function delayedNotificationWorkflow(userId: string) {
  'use workflow';
  
  await sendInitialEmail(userId);
  
  // Wait 7 days without consuming resources
  await sleep('7 days');
  
  await sendFollowUpEmail(userId);
}
```

**Supported Formats:**
- `'5 seconds'`, `'5s'`
- `'10 minutes'`, `'10m'`
- `'2 hours'`, `'2h'`
- `'3 days'`, `'3d'`
- `'1 week'`, `'1w'`
- Milliseconds: `5000` (5 seconds)

---

### 2.4 Hooks (Human-in-the-Loop)

**Hooks** let workflows wait for external events (user actions, webhooks, third-party APIs).

**Characteristics:**
- Workflow pauses until external data arrives
- No polling or message queues required
- Type-safe event payloads
- Automatic resumption when event received

**When to Use:**
- Human approvals
- User confirmations
- Webhook responses
- Third-party callbacks

**Example:**
```typescript
import { defineHook } from 'workflow';

// Define hook with type-safe payload
const approvalHook = defineHook<{
  decision: 'approved' | 'rejected';
  notes?: string;
}>();

export async function chatflowApprovalWorkflow(chatflowId: string) {
  'use workflow';
  
  const chatflow = await fetchChatflow(chatflowId);
  
  // Wait for human approval
  const events = approvalHook.create({
    token: chatflowId,
  });
  
  for await (const event of events) {
    if (event.decision === 'approved') {
      await publishChatflow(chatflow);
      break;
    } else {
      await archiveChatflow(chatflow);
      break;
    }
  }
}

// Resume workflow from API route
export async function POST(req: Request) {
  const { chatflowId, decision, notes } = await req.json();
  
  await approvalHook.resume(chatflowId, {
    decision,
    notes,
  });
  
  return new Response('OK');
}
```

---

## 3. Installation & Setup

### 3.1 Install Package

```bash
pnpm add workflow
```

**Note:** As of 2025-11-18, the `workflow` package is not yet available on npm. Vercel Workflow is in Beta. For now, we'll use simple async functions with similar patterns.

### 3.2 Next.js Integration

Workflows automatically compile into API routes in Next.js.

**File Structure:**
```
app/
├── workflows/
│   ├── chatflow-generation.ts
│   ├── conversation-engine.ts
│   └── result-interpretation.ts
└── api/
    └── workflows/
        └── [workflow]/
            └── route.ts
```

### 3.3 Environment Variables

No special environment variables needed for Workflow itself. It uses your existing Vercel infrastructure.

---

## 4. Workflow Patterns

### 4.1 Sequential Steps

Execute steps one after another.

```typescript
export async function sequentialWorkflow(input: string) {
  'use workflow';
  
  const step1Result = await step1(input);
  const step2Result = await step2(step1Result);
  const step3Result = await step3(step2Result);
  
  return step3Result;
}
```

---

### 4.2 Parallel Steps

Execute multiple steps concurrently (they'll run in parallel).

```typescript
export async function parallelWorkflow(input: string) {
  'use workflow';
  
  const [result1, result2, result3] = await Promise.all([
    step1(input),
    step2(input),
    step3(input),
  ]);
  
  return { result1, result2, result3 };
}
```

---

### 4.3 Conditional Logic

Branch based on step results.

```typescript
export async function conditionalWorkflow(input: string) {
  'use workflow';
  
  const analysis = await analyzeInput(input);
  
  if (analysis.needsApproval) {
    const approval = await requestApproval(input);
    if (!approval.approved) {
      return { status: 'rejected' };
    }
  }
  
  const result = await processInput(input);
  return { status: 'completed', result };
}
```

---

### 4.4 Loops & Iteration

Iterate over collections or retry until condition met.

```typescript
export async function iterativeWorkflow(items: string[]) {
  'use workflow';
  
  const results = [];
  
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
    
    // Optional: Add delay between iterations
    await sleep('1 second');
  }
  
  return results;
}
```

---

### 4.5 Retry with Backoff

Implement custom retry logic with exponential backoff.

```typescript
export async function retryWorkflow(input: string) {
  'use workflow';
  
  let attempt = 0;
  const maxAttempts = 3;
  
  while (attempt < maxAttempts) {
    try {
      const result = await unreliableStep(input);
      return result;
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) throw error;
      
      // Exponential backoff: 1s, 2s, 4s
      await sleep(`${Math.pow(2, attempt)} seconds`);
    }
  }
}
```

---

## 5. Best Practices

### 5.1 Single Responsibility Principle

**✅ DO:** Create focused workflows for specific tasks.

```typescript
// Good: Focused workflows
export async function emailDripWorkflow(userId: string) { ... }
export async function webPushWorkflow(userId: string) { ... }
export async function smsNotificationWorkflow(userId: string) { ... }
```

**❌ DON'T:** Create mega-workflows that do everything.

```typescript
// Bad: Mega-workflow
export async function notificationMegaWorkflow(userId: string) {
  // Handles email, push, SMS, in-app, etc.
  // Too complex, hard to maintain
}
```

---

### 5.2 Isolate External Calls in Steps

**✅ DO:** Wrap external API calls in `'use step'` functions.

```typescript
async function callAnthropicAPI(prompt: string) {
  'use step';
  return await anthropic.messages.create({ ... });
}

async function saveToDatabase(data: any) {
  'use step';
  return await prisma.chatflow.create({ data });
}
```

**❌ DON'T:** Call external APIs directly in workflows.

```typescript
export async function badWorkflow() {
  'use workflow';
  // Don't do this - no automatic retries
  const result = await anthropic.messages.create({ ... });
}
```

---

### 5.3 Keep State Size Manageable

**✅ DO:** Store only essential data in workflow state.

```typescript
export async function goodWorkflow(chatflowId: string) {
  'use workflow';
  
  // Store only IDs, not full objects
  const schema = await generateSchema(chatflowId);
  const chatflow = await saveChatflow(schema);
  
  return { chatflowId: chatflow.id }; // Small state
}
```

**❌ DON'T:** Store large objects or binary data.

```typescript
export async function badWorkflow(chatflowId: string) {
  'use workflow';
  
  const largeData = await fetchLargeDataset(); // 10MB+
  return largeData; // State too large!
}
```

**State Size Limits:**
- Keep workflow state < 1MB
- For large data, store in database and pass IDs

---

### 5.4 Idempotency

Ensure steps are idempotent (safe to retry).

**✅ DO:** Design steps to be safely retriable.

```typescript
async function createChatflow(data: any) {
  'use step';
  
  // Idempotent: Check if already exists
  const existing = await prisma.chatflow.findUnique({
    where: { shareUrl: data.shareUrl }
  });
  
  if (existing) return existing;
  
  return await prisma.chatflow.create({ data });
}
```

**❌ DON'T:** Create side effects that can't be retried.

```typescript
async function badStep() {
  'use step';
  
  // Not idempotent: Increments every retry
  await prisma.counter.update({
    where: { id: 1 },
    data: { count: { increment: 1 } }
  });
}
```

---

### 5.5 Error Classification

Distinguish between retriable and fatal errors.

```typescript
async function smartStep(input: string) {
  'use step';
  
  try {
    return await externalAPI.call(input);
  } catch (error) {
    // Retriable errors (network, rate limit)
    if (error.code === 'NETWORK_ERROR' || error.code === 'RATE_LIMIT') {
      throw error; // Let workflow retry
    }
    
    // Fatal errors (invalid input)
    if (error.code === 'INVALID_INPUT') {
      throw new FatalError('Invalid input, cannot retry');
    }
    
    throw error;
  }
}
```

---

### 5.6 Store Workflow IDs

Track active workflows for users.

```typescript
export async function startChatflowWorkflow(userId: string, description: string) {
  const workflowId = await chatflowWorkflow.start({ userId, description });
  
  // Store workflow ID in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      activeWorkflows: {
        push: workflowId
      }
    }
  });
  
  return workflowId;
}

// Later: Cancel or check status
export async function cancelUserWorkflow(userId: string, workflowId: string) {
  await chatflowWorkflow.cancel(workflowId);
  
  // Remove from user's active workflows
  await prisma.user.update({
    where: { id: userId },
    data: {
      activeWorkflows: {
        set: user.activeWorkflows.filter(id => id !== workflowId)
      }
    }
  });
}
```

---

## 6. IoZen-Specific Implementation

### 6.1 Chatflow Generation Workflow

```typescript
// app/workflows/chatflow-generation.ts
export async function chatflowGenerationWorkflow(params: {
  userId: string;
  description: string;
}) {
  'use workflow';
  
  // Step 1: Generate schema with AI
  const schema = await generateChatflowSchemaStep(params.description);
  
  // Step 2: Validate schema
  const validated = await validateSchemaStep(schema);
  
  // Step 3: Create unique share URL
  const shareUrl = await generateShareUrlStep();
  
  // Step 4: Save to database
  const chatflow = await saveChatflowStep({
    userId: params.userId,
    name: extractName(params.description),
    description: params.description,
    schema: validated,
    shareUrl,
    status: 'DRAFT',
  });
  
  return { chatflowId: chatflow.id, shareUrl };
}

// Steps
async function generateChatflowSchemaStep(description: string) {
  'use step';
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Generate a chatflow schema JSON for: ${description}`
    }]
  });
  
  return JSON.parse(response.content[0].text);
}

async function validateSchemaStep(schema: any) {
  'use step';
  
  // Validate with Zod
  const ChatflowSchemaValidator = z.object({
    fields: z.array(z.object({
      name: z.string(),
      label: z.string(),
      type: z.enum(['text', 'number', 'email', 'date', 'boolean']),
      required: z.boolean(),
      placeholder: z.string().optional(),
    }))
  });
  
  return ChatflowSchemaValidator.parse(schema);
}

async function saveChatflowStep(data: any) {
  'use step';
  
  return await prisma.chatflow.create({ data });
}
```

---

### 6.2 Conversation Engine Workflow

```typescript
// app/workflows/conversation-engine.ts
export async function conversationWorkflow(params: {
  submissionId: string;
  chatflowId: string;
}) {
  'use workflow';
  
  const chatflow = await fetchChatflowStep(params.chatflowId);
  const fields = chatflow.schema.fields;
  const collectedData: Record<string, any> = {};
  
  for (const field of fields) {
    // Ask question
    await saveMessageStep({
      submissionId: params.submissionId,
      role: 'AI',
      content: generateQuestion(field),
      fieldName: field.name,
    });
    
    // Wait for user response (hook)
    const userResponse = await waitForUserResponseStep(params.submissionId, field.name);
    
    // Validate response
    const validated = await validateResponseStep(userResponse, field);
    
    collectedData[field.name] = validated;
    
    // Update submission data
    await updateSubmissionDataStep(params.submissionId, collectedData);
  }
  
  // Mark as completed
  await completeSubmissionStep(params.submissionId);
  
  return { submissionId: params.submissionId, data: collectedData };
}
```

---

### 6.3 Result Interpretation Workflow

```typescript
// app/workflows/result-interpretation.ts
export async function resultInterpretationWorkflow(submissionId: string) {
  'use workflow';
  
  const submission = await fetchSubmissionStep(submissionId);
  
  // Generate AI summary
  const summary = await generateSummaryStep(submission.data);
  
  // Generate insights
  const insights = await generateInsightsStep(submission.data);
  
  // Save results
  await saveInterpretationStep(submissionId, {
    aiSummary: summary,
    aiInsights: insights,
  });
  
  return { summary, insights };
}

async function generateSummaryStep(data: Record<string, any>) {
  'use step';
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Summarize this chatflow submission in 3-5 sentences: ${JSON.stringify(data)}`
    }]
  });
  
  return response.content[0].text;
}
```

---

## 7. Error Handling & Retries

### 7.1 Automatic Retries

Steps automatically retry on transient failures.

**Default Behavior:**
- Network errors: Retry with exponential backoff
- Timeouts: Retry up to 3 times
- 5xx errors: Retry
- 4xx errors: Don't retry (fatal)

### 7.2 Custom Error Handling

```typescript
class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableError';
  }
}

class FatalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FatalError';
  }
}

async function smartStep(input: string) {
  'use step';
  
  try {
    return await externalAPI.call(input);
  } catch (error: any) {
    if (error.code === 'RATE_LIMIT') {
      throw new RetryableError('Rate limited, will retry');
    }
    
    if (error.code === 'INVALID_INPUT') {
      throw new FatalError('Invalid input, cannot proceed');
    }
    
    throw error;
  }
}
```

---

## 8. Observability & Monitoring

### 8.1 Built-In Logging

Every step, input, output, and error is automatically logged.

**Access Logs:**
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Navigate to **AI** → **Workflows**
4. View real-time execution traces

### 8.2 What's Logged Automatically

- Workflow start/end times
- Step execution times
- Input/output payloads
- Errors and stack traces
- Sleep durations
- Hook events

### 8.3 Custom Logging

Add custom logs within steps:

```typescript
async function loggingStep(input: string) {
  'use step';
  
  console.log('Processing input:', input);
  
  const result = await process(input);
  
  console.log('Result:', result);
  
  return result;
}
```

---

## 9. Performance & Optimization

### 9.1 Minimize State Size

**Problem:** Large state increases replay time and storage costs.

**Solution:** Store only IDs, fetch data in steps.

```typescript
// ✅ Good: Minimal state
export async function efficientWorkflow(chatflowId: string) {
  'use workflow';
  
  const schema = await generateSchema(chatflowId);
  const saved = await saveChatflow(schema);
  
  return { chatflowId: saved.id }; // Small state
}

// ❌ Bad: Large state
export async function inefficientWorkflow(chatflowId: string) {
  'use workflow';
  
  const fullChatflow = await fetchFullChatflow(chatflowId); // 1MB object
  return fullChatflow; // Large state!
}
```

---

### 9.2 Parallelize Independent Steps

```typescript
export async function parallelWorkflow(input: string) {
  'use workflow';
  
  // Run independent steps in parallel
  const [schema, validation, metadata] = await Promise.all([
    generateSchema(input),
    validateInput(input),
    fetchMetadata(input),
  ]);
  
  return { schema, validation, metadata };
}
```

---

### 9.3 Use Sleep for Rate Limiting

```typescript
export async function rateLimitedWorkflow(items: string[]) {
  'use workflow';
  
  const results = [];
  
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
    
    // Rate limit: 1 request per second
    await sleep('1 second');
  }
  
  return results;
}
```

---

## 10. Common Pitfalls

### 10.1 ❌ Forgetting `'use step'` for External Calls

**Problem:** No automatic retries, failures crash workflow.

```typescript
// Bad
export async function badWorkflow() {
  'use workflow';
  const result = await externalAPI.call(); // No retries!
}

// Good
async function externalAPIStep() {
  'use step';
  return await externalAPI.call(); // Automatic retries
}

export async function goodWorkflow() {
  'use workflow';
  const result = await externalAPIStep();
}
```

---

### 10.2 ❌ Non-Deterministic Code in Workflows

**Problem:** Workflows must be deterministic for replay.

```typescript
// Bad: Non-deterministic
export async function badWorkflow() {
  'use workflow';
  const randomValue = Math.random(); // Different on replay!
  const timestamp = Date.now(); // Different on replay!
}

// Good: Deterministic
export async function goodWorkflow() {
  'use workflow';
  const randomValue = await generateRandomStep(); // Deterministic
  const timestamp = await getCurrentTimeStep(); // Deterministic
}
```

---

### 10.3 ❌ Large Payloads in State

**Problem:** Increases replay time and storage costs.

```typescript
// Bad
export async function badWorkflow() {
  'use workflow';
  const largeFile = await fetchLargeFile(); // 10MB
  return largeFile; // State too large!
}

// Good
export async function goodWorkflow() {
  'use workflow';
  const fileId = await uploadLargeFile(); // Returns ID only
  return { fileId }; // Small state
}
```

---

### 10.4 ❌ Not Handling Fatal Errors

**Problem:** Workflow retries forever on fatal errors.

```typescript
// Bad
async function badStep(input: string) {
  'use step';
  return await externalAPI.call(input); // Retries even on 400 errors
}

// Good
async function goodStep(input: string) {
  'use step';
  
  try {
    return await externalAPI.call(input);
  } catch (error: any) {
    if (error.status === 400) {
      throw new FatalError('Invalid input, cannot retry');
    }
    throw error; // Retry other errors
  }
}
```

---

## Summary: Quick Reference

### When to Use Workflows

- ✅ Multi-step processes
- ✅ Long-running operations (minutes to months)
- ✅ Human-in-the-loop scenarios
- ✅ External API orchestration
- ✅ Processes that need to survive deployments

### When NOT to Use Workflows

- ❌ Simple CRUD operations
- ❌ Real-time responses (< 1 second)
- ❌ Stateless operations
- ❌ High-frequency operations (> 1000/sec)

### Key Directives

- `'use workflow'` - Durable, stateful function
- `'use step'` - Retriable, isolated operation
- `sleep()` - Zero-resource pause
- `defineHook()` - Wait for external events

### Best Practices Checklist

- [ ] One workflow = one responsibility
- [ ] External calls wrapped in `'use step'`
- [ ] State size < 1MB
- [ ] Steps are idempotent
- [ ] Errors classified (retriable vs. fatal)
- [ ] Workflow IDs stored for tracking
- [ ] Deterministic code only in workflows

---

**Ready to implement Vercel Workflow in IoZen!**
