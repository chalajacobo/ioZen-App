## 7. Testing Strategy

### 7.1 Testing Philosophy

**Test Pyramid:**
```
        ╱╲
       ╱E2E╲         Few (10%) - Expensive, slow, fragile
      ╱────╲
     ╱ Int. ╲        Some (30%) - Moderate cost, moderate speed
    ╱────────╲
   ╱   Unit   ╲      Many (60%) - Cheap, fast, reliable
  ╱────────────╲
```

**Testing Principles:**

**TP1: Test Behavior, Not Implementation**
```typescript
// ❌ BAD - Testing implementation details
test('should call validateEmail function', () => {
  const spy = vi.spyOn(validator, 'validateEmail');
  validator.validate({ email: 'test@example.com' });
  expect(spy).toHaveBeenCalled(); // Brittle - breaks if refactored
});

// ✅ GOOD - Testing behavior
test('should return error for invalid email', () => {
  const result = validator.validate({ email: 'invalid' });
  expect(result.valid).toBe(false);
  expect(result.error).toContain('email');
});
```

**TP2: Arrange-Act-Assert (AAA Pattern)**
```typescript
test('should successfully process valid document', async () => {
  // Arrange
  const documentId = 'doc_123';
  const mockDocument = createMockDocument({ id: documentId, type: 'pdf' });
  vi.mocked(storage.download).mockResolvedValue(mockDocument.buffer);
  
  // Act
  const result = await documentProcessor.process(documentId);
  
  // Assert
  expect(result.success).toBe(true);
  expect(result.extractedText).toBeDefined();
  expect(result.extractedText.length).toBeGreaterThan(0);
});
```

**TP3: One Assertion Per Test (Guideline, Not Rule)**
```typescript
// ✅ Good - Single logical assertion
test('should validate required fields', () => {
  const result = validator.validate({});
  expect(result.errors).toEqual(['name is required', 'email is required']);
});

// ✅ Also good - Related assertions
test('should return validation result with status and errors', () => {
  const result = validator.validate({});
  expect(result.valid).toBe(false); // Related to errors
  expect(result.errors).toHaveLength(2); // Related to valid
});
```

### 7.2 Unit Testing

**What to Unit Test:**
- ✅ Business logic
- ✅ Utility functions
- ✅ Validation logic
- ✅ Data transformations
- ✅ Error handling

**What NOT to Unit Test:**
- ❌ Third-party libraries
- ❌ Framework code (Next.js, React)
- ❌ Trivial getters/setters
- ❌ Configuration files

**Unit Test Structure:**
```typescript
// tests/unit/modules/validation-engine/SemanticValidator.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SemanticValidator } from '@/modules/validation-engine/application/validators/SemanticValidator';
import type { AIProvider } from '@/modules/validation-engine/domain/ports/AIProvider';

describe('SemanticValidator', () => {
  let validator: SemanticValidator;
  let mockAIProvider: AIProvider;
  
  beforeEach(() => {
    // Setup fresh mocks for each test
    mockAIProvider = {
      validate: vi.fn(),
    };
    validator = new SemanticValidator(mockAIProvider);
  });
  
  describe('validateAddress', () => {
    it('should return valid result for real address', async () => {
      // Arrange
      const address = '1600 Pennsylvania Avenue NW, Washington, DC 20500';
      mockAIProvider.validate = vi.fn().mockResolvedValue({
        isValid: true,
        confidence: 0.95,
      });
      
      // Act
      const result = await validator.validateAddress(address);
      
      // Assert
      expect(result.valid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(mockAIProvider.validate).toHaveBeenCalledWith(
        expect.objectContaining({ address })
      );
    });
    
    it('should return invalid result for fake address', async () => {
      // Arrange
      const address = '123 Fake Street, Nowhere, XX 00000';
      mockAIProvider.validate = vi.fn().mockResolvedValue({
        isValid: false,
        confidence: 0.85,
        reason: 'City "Nowhere" does not exist',
      });
      
      // Act
      const result = await validator.validateAddress(address);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not exist');
    });
    
    it('should handle AI provider failure gracefully', async () => {
      // Arrange
      mockAIProvider.validate = vi.fn().mockRejectedValue(
        new Error('API timeout')
      );
      
      // Act
      const result = await validator.validateAddress('Any address');
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('validation service unavailable');
      expect(result.fallbackUsed).toBe(true); // Fell back to basic validation
    });
  });
  
  describe('caching behavior', () => {
    it('should cache validation results', async () => {
      // Arrange
      const address = '1600 Pennsylvania Avenue NW, Washington, DC 20500';
      mockAIProvider.validate = vi.fn().mockResolvedValue({
        isValid: true,
        confidence: 0.95,
      });
      
      // Act
      await validator.validateAddress(address);
      await validator.validateAddress(address); // Same address
      
      // Assert
      expect(mockAIProvider.validate).toHaveBeenCalledTimes(1); // Only called once
    });
    
    it('should not cache failed validations', async () => {
      // Arrange
      mockAIProvider.validate = vi.fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ isValid: true, confidence: 0.95 });
      
      // Act
      await validator.validateAddress('address');
      const result = await validator.validateAddress('address');
      
      // Assert
      expect(mockAIProvider.validate).toHaveBeenCalledTimes(2); // Called twice
      expect(result.valid).toBe(true); // Second call succeeded
    });
  });
});
```

### 7.3 Integration Testing

**What to Integration Test:**
- ✅ Module interactions
- ✅ Database operations
- ✅ API endpoints
- ✅ Workflow executions

**Integration Test Example:**
```typescript
// tests/integration/workflows/document-processing.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, cleanupTestDatabase } from '@/tests/helpers/database';
import { documentProcessingWorkflow } from '@/workflows/document-processing.workflow';
import { uploadTestDocument } from '@/tests/helpers/storage';

describe('Document Processing Workflow Integration', () => {
  beforeAll(async () => {
    await createTestDatabase();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  it('should process PDF document end-to-end', async () => {
    // Arrange
    const testPDF = await uploadTestDocument('sample-invoice.pdf');
    
    // Act
    const result = await documentProcessingWorkflow.trigger({
      documentId: testPDF.id,
      expectedType: 'invoice',
    });
    
    // Wait for workflow completion (with timeout)
    const completed = await result.waitForCompletion({ timeout: 30000 });
    
    // Assert
    expect(completed.status).toBe('completed');
    expect(completed.result.extracted.data).toMatchObject({
      invoiceNumber: expect.any(String),
      amount: expect.any(Number),
      date: expect.any(String),
    });
    
    // Verify database was updated
    const document = await db.document.findUnique({
      where: { id: testPDF.id },
    });
    expect(document.status).toBe('processed');
    expect(document.extractedData).toBeDefined();
  });
  
  it('should handle OCR failure and retry', async () => {
    // Arrange
    const corruptedPDF = await uploadTestDocument('corrupted.pdf');
    
    // Act & Assert
    const result = await documentProcessingWorkflow.trigger({
      documentId: corruptedPDF.id,
    });
    
    const completed = await result.waitForCompletion({ timeout: 60000 });
    
    // Should have retried 3 times before failing
    expect(completed.status).toBe('failed');
    expect(completed.attempts).toBe(3);
    expect(completed.error).toContain('OCR extraction failed');
  });
});
```

### 7.4 End-to-End Testing

**E2E with Playwright:**
```typescript
// tests/e2e/form-completion.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Form Completion Flow', () => {
  test('user can complete insurance claim form', async ({ page }) => {
    // Navigate to form
    await page.goto('/forms/insurance-claim');
    
    // Start conversation
    await page.click('[data-testid="start-conversation"]');
    
    // AI asks for name
    await expect(page.locator('[data-testid="ai-message"]').last())
      .toContainText('What is your name?');
    
    // User responds
    await page.fill('[data-testid="message-input"]', 'John Doe');
    await page.click('[data-testid="send-message"]');
    
    // AI asks for policy number
    await expect(page.locator('[data-testid="ai-message"]').last())
      .toContainText('policy number');
    
    await page.fill('[data-testid="message-input"]', 'POL123456');
    await page.click('[data-testid="send-message"]');
    
    // AI asks for incident date
    await expect(page.locator('[data-testid="ai-message"]').last())
      .toContainText('when did the incident occur');
    
    await page.fill('[data-testid="message-input"]', 'March 15, 2024');
    await page.click('[data-testid="send-message"]');
    
    // AI asks for document upload
    await expect(page.locator('[data-testid="ai-message"]').last())
      .toContainText('upload photos');
    
    // Upload document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/accident-photo.jpg');
    
    // Wait for processing indicator
    await expect(page.locator('[data-testid="processing-indicator"]'))
      .toBeVisible();
    
    // Wait for processing to complete
    await expect(page.locator('[data-testid="processing-indicator"]'))
      .not.toBeVisible({ timeout: 30000 });
    
    // AI shows extracted data for confirmation
    await expect(page.locator('[data-testid="extracted-data"]'))
      .toBeVisible();
    
    // Confirm and submit
    await page.click('[data-testid="confirm-submit"]');
    
    // Success message
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Your claim has been submitted');
    
    // Verify submission in dashboard
    await page.goto('/dashboard/submissions');
    await expect(page.locator('[data-testid="submission-list"]').first())
      .toContainText('John Doe');
  });
  
  test('user can resume incomplete form', async ({ page }) => {
    // Start form but don't complete
    await page.goto('/forms/insurance-claim');
    await page.click('[data-testid="start-conversation"]');
    await page.fill('[data-testid="message-input"]', 'Jane Smith');
    await page.click('[data-testid="send-message"]');
    
    // Close browser (simulate user leaving)
    const conversationId = await page.locator('[data-conversation-id]')
      .getAttribute('data-conversation-id');
    await page.close();
    
    // Reopen in new session
    const page2 = await page.context().newPage();
    await page2.goto(`/forms/insurance-claim/resume/${conversationId}`);
    
    // Should see previous messages
    await expect(page2.locator('[data-testid="user-message"]').first())
      .toContainText('Jane Smith');
    
    // Should ask next question (not repeat previous ones)
    await expect(page2.locator('[data-testid="ai-message"]').last())
      .toContainText('policy number');
  });
});
```

### 7.5 Test Helpers & Utilities

**Database Test Helper:**
```typescript
// tests/helpers/database.ts

import { PrismaClient } from '@prisma/client';

let testDb: PrismaClient;

export async function createTestDatabase() {
  testDb = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL,
      },
    },
  });
  
  // Run migrations
  await testDb.$executeRaw`CREATE SCHEMA IF NOT EXISTS test`;
  
  // Seed with test data if needed
  await seedTestData();
  
  return testDb;
}

export async function cleanupTestDatabase() {
  // Clean all tables
  await testDb.$executeRaw`TRUNCATE TABLE form_submissions CASCADE`;
  await testDb.$executeRaw`TRUNCATE TABLE documents CASCADE`;
  await testDb.$executeRaw`TRUNCATE TABLE conversations CASCADE`;
  
  await testDb.$disconnect();
}

export function getTestDb() {
  return testDb;
}

async function seedTestData() {
  // Create test organization
  await testDb.organization.create({
    data: {
      id: 'test-org',
      name: 'Test Organization',
    },
  });
  
  // Create test user
  await testDb.user.create({
    data: {
      id: 'test-user',
      email: 'test@example.com',
      organizationId: 'test-org',
    },
  });
}
```

**Mock Factory:**
```typescript
// tests/helpers/factories.ts

import { faker } from '@faker-js/faker';
import type { Form, FormSubmission, Document } from '@prisma/client';

export function createMockForm(overrides?: Partial<Form>): Form {
  return {
    id: faker.string.uuid(),
    name: faker.company.buzzPhrase(),
    organizationId: 'test-org',
    schema: {
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
      ],
    },
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockSubmission(overrides?: Partial<FormSubmission>): FormSubmission {
  return {
    id: faker.string.uuid(),
    formId: faker.string.uuid(),
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    },
    status: 'in_progress',
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockDocument(overrides?: Partial<Document>): Document {
  return {
    id: faker.string.uuid(),
    submissionId: faker.string.uuid(),
    filePath: faker.system.filePath(),
    extractedData: null,
    status: 'pending',
    createdAt: new Date(),
    ...overrides,
  };
}
```

### 7.6 Test Coverage Requirements

**Minimum Coverage Thresholds:**
```json
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/*.d.ts',
      ],
    },
  },
});
```

**Coverage by Module Type:**
- Business Logic (domain, application): **>90%**
- Infrastructure (repositories, API clients): **>70%**
- UI Components: **>60%** (focus on logic, not rendering)
- Configuration: **0%** (no need to test config files)