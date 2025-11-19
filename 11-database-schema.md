# Database Schema

**Version:** 1.0 (MVP)  
**Last Updated:** 2025-11-18  
**Status:** Draft

---

## 1. Schema Overview

### MVP Entities (4 Core Tables)

```
users (1) ──────< chatflows (many)
                    │
                    │ (1)
                    │
                    ▼
              chatflow_submissions (many)
                    │
                    │ (1)
                    │
                    ▼
           conversation_messages (many)
```

**Simplified for MVP:**
- Single user (admin) - no multi-tenant
- No organizations table
- No roles/permissions
- No documents table (text-only MVP)
- No validation_rules table
- No workflow_executions table

---

## 2. Prisma Schema

### Complete Schema Definition

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// USERS
// ============================================================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  chatflows Chatflow[]

  @@map("users")
}

// ============================================================================
// CHATFLOWS
// ============================================================================

model Chatflow {
  id          String         @id @default(cuid())
  name        String
  description String?        // Original user prompt
  schema      Json           // Generated chatflow structure
  status      ChatflowStatus @default(DRAFT)
  shareUrl    String         @unique // Public URL slug
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  // Relations
  userId      String
  user        User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  submissions ChatflowSubmission[]

  @@index([userId])
  @@index([shareUrl])
  @@map("chatflows")
}

enum ChatflowStatus {
  DRAFT      // Being created/edited
  PUBLISHED  // Live and accepting submissions
  ARCHIVED   // No longer accepting submissions
}

// ============================================================================
// CHATFLOW SUBMISSIONS
// ============================================================================

model ChatflowSubmission {
  id              String           @id @default(cuid())
  status          SubmissionStatus @default(IN_PROGRESS)
  data            Json             @default("{}")  // Collected answers
  aiSummary       String?          // AI-generated summary
  aiInsights      Json?            // AI-generated insights (array of strings)
  completedAt     DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  // Relations
  chatflowId      String
  chatflow        Chatflow             @relation(fields: [chatflowId], references: [id], onDelete: Cascade)
  messages        ConversationMessage[]

  @@index([chatflowId])
  @@index([status])
  @@index([createdAt])
  @@map("chatflow_submissions")
}

enum SubmissionStatus {
  IN_PROGRESS  // User is filling out the chatflow
  COMPLETED    // User submitted the chatflow
  ABANDONED    // User left without completing
}

// ============================================================================
// CONVERSATION MESSAGES
// ============================================================================

model ConversationMessage {
  id         String      @id @default(cuid())
  role       MessageRole
  content    String      @db.Text
  fieldName  String?     // Which field this message relates to
  createdAt  DateTime    @default(now())

  // Relations
  submissionId String
  submission   ChatflowSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@index([submissionId])
  @@index([createdAt])
  @@map("conversation_messages")
}

enum MessageRole {
  AI    // Message from the AI
  USER  // Message from the user
}
```

---

## 3. Data Models Explained

### 3.1 User Model

**Purpose:** Admin who creates forms

**Fields:**
- `id`: Unique identifier (CUID)
- `email`: Login email (unique)
- `name`: Display name (optional)
- `createdAt`: Account creation timestamp
- `updatedAt`: Last modification timestamp

**MVP Simplification:**
- No password field (using Supabase Auth)
- No role field (single admin)
- No organizationId (no multi-tenant)

---

### 3.2 Form Model

**Purpose:** Form definition created by admin

**Fields:**
- `id`: Unique identifier
- `name`: Form title (e.g., "Insurance Claim Form")
- `description`: Original prompt from admin
- `schema`: JSON structure of form fields
- `status`: DRAFT | PUBLISHED | ARCHIVED
- `shareUrl`: Unique slug for public URL (e.g., "claim-form-abc123")
- `userId`: Foreign key to creator
- `createdAt`: Creation timestamp
- `updatedAt`: Last modification timestamp

**Schema JSON Structure:**
```json
{
  "fields": [
    {
      "name": "policyNumber",
      "label": "Policy Number",
      "type": "text",
      "required": true,
      "placeholder": "Enter your policy number"
    },
    {
      "name": "incidentDate",
      "label": "Incident Date",
      "type": "date",
      "required": true
    },
    {
      "name": "description",
      "label": "Description",
      "type": "text",
      "required": false,
      "placeholder": "Describe what happened"
    }
  ]
}
```

**Field Types (MVP):**
- `text` - Single line text
- `number` - Numeric input
- `email` - Email validation
- `date` - Date picker
- `boolean` - Yes/No question

---

### 3.3 FormSubmission Model

**Purpose:** User's responses to a form

**Fields:**
- `id`: Unique identifier
- `status`: IN_PROGRESS | COMPLETED | ABANDONED
- `data`: JSON object with field answers
- `aiSummary`: AI-generated summary (nullable)
- `aiInsights`: AI-generated insights array (nullable)
- `completedAt`: Submission timestamp (nullable)
- `formId`: Foreign key to form
- `createdAt`: Started timestamp
- `updatedAt`: Last modification timestamp

**Data JSON Structure:**
```json
{
  "policyNumber": "POL-123456",
  "incidentDate": "2024-03-15",
  "description": "I was stopped at a red light when another vehicle rear-ended me."
}
```

**AI Insights JSON Structure:**
```json
[
  "High severity incident",
  "Police report filed",
  "No injuries reported",
  "Estimated damage: $5,000"
]
```

---

### 3.4 ConversationMessage Model

**Purpose:** Chat history between AI and user

**Fields:**
- `id`: Unique identifier
- `role`: AI | USER
- `content`: Message text
- `fieldName`: Which field being discussed (nullable)
- `submissionId`: Foreign key to submission
- `createdAt`: Message timestamp

**Example Messages:**
```typescript
// AI asks question
{
  role: "AI",
  content: "What is your policy number?",
  fieldName: "policyNumber"
}

// User responds
{
  role: "USER",
  content: "POL-123456",
  fieldName: "policyNumber"
}

// AI validates
{
  role: "AI",
  content: "Thank you. When did the incident occur?",
  fieldName: "incidentDate"
}
```

---

## 4. Indexes & Performance

### Indexes Defined

**forms table:**
- `userId` - Find all forms by creator
- `shareUrl` - Fast lookup for public URLs

**form_submissions table:**
- `formId` - Find all submissions for a form
- `status` - Filter by completion status
- `createdAt` - Sort by submission date

**conversation_messages table:**
- `submissionId` - Get all messages for a conversation
- `createdAt` - Sort messages chronologically

### Query Patterns

**Admin Dashboard:**
```typescript
// Get all forms for user
const forms = await prisma.form.findMany({
  where: { userId },
  include: {
    _count: {
      select: { submissions: true }
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

**Form Filling:**
```typescript
// Get form by share URL
const form = await prisma.form.findUnique({
  where: { shareUrl },
  select: { id: true, name: true, schema: true }
});

// Create submission
const submission = await prisma.formSubmission.create({
  data: {
    formId: form.id,
    status: 'IN_PROGRESS'
  }
});
```

**Conversation:**
```typescript
// Get conversation history
const messages = await prisma.conversationMessage.findMany({
  where: { submissionId },
  orderBy: { createdAt: 'asc' }
});

// Add message
await prisma.conversationMessage.create({
  data: {
    submissionId,
    role: 'AI',
    content: 'What is your policy number?',
    fieldName: 'policyNumber'
  }
});
```

---

## 5. Supabase Row Level Security (RLS)

### Security Policies

**MVP Simplification:**
- Single admin user (no RLS needed initially)
- Public forms are truly public (no auth required)
- Admin routes protected by Supabase Auth

**Post-MVP (Multi-Tenant):**
```sql
-- Users can only see their own forms
CREATE POLICY "Users see own forms"
  ON forms FOR SELECT
  USING (user_id = auth.uid());

-- Users can only edit their own forms
CREATE POLICY "Users edit own forms"
  ON forms FOR UPDATE
  USING (user_id = auth.uid());

-- Anyone can view published forms
CREATE POLICY "Public can view published forms"
  ON forms FOR SELECT
  USING (status = 'PUBLISHED');

-- Anyone can create submissions for published forms
CREATE POLICY "Public can create submissions"
  ON form_submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms
      WHERE id = form_id AND status = 'PUBLISHED'
    )
  );
```

---

## 6. Migrations Strategy

### Initial Migration

```bash
# Create migration
npx prisma migrate dev --name init

# Apply to production
npx prisma migrate deploy
```

### Seed Data (Development)

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const user = await prisma.user.upsert({
    where: { email: 'admin@iozen.dev' },
    update: {},
    create: {
      email: 'admin@iozen.dev',
      name: 'Admin User',
    },
  });

  // Create sample form
  const form = await prisma.form.create({
    data: {
      name: 'Insurance Claim Form',
      description: 'Create an insurance claim form with policy number, incident date, and description',
      userId: user.id,
      shareUrl: 'sample-claim-form',
      status: 'PUBLISHED',
      schema: {
        fields: [
          {
            name: 'policyNumber',
            label: 'Policy Number',
            type: 'text',
            required: true,
          },
          {
            name: 'incidentDate',
            label: 'Incident Date',
            type: 'date',
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'text',
            required: false,
          },
        ],
      },
    },
  });

  console.log({ user, form });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 7. Type Safety with Prisma

### Generated Types

```typescript
// Auto-generated by Prisma
import { Form, FormSubmission, ConversationMessage } from '@prisma/client';

// Type-safe queries
const form: Form = await prisma.form.findUnique({ ... });

// Type-safe includes
const formWithSubmissions = await prisma.form.findUnique({
  where: { id },
  include: {
    submissions: {
      include: {
        messages: true
      }
    }
  }
});

// Type for the result
type FormWithSubmissions = Form & {
  submissions: (FormSubmission & {
    messages: ConversationMessage[]
  })[]
};
```

### Zod Validation

```typescript
import { z } from 'zod';

// Form schema validation
export const FormSchemaValidator = z.object({
  fields: z.array(
    z.object({
      name: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(['text', 'number', 'email', 'date', 'boolean']),
      required: z.boolean(),
      placeholder: z.string().optional(),
    })
  ),
});

// Submission data validation
export const SubmissionDataValidator = z.record(z.unknown());
```

---

## 8. Database Constraints

### Unique Constraints
- `users.email` - Prevent duplicate accounts
- `forms.shareUrl` - Prevent URL collisions

### Foreign Key Constraints
- `forms.userId` → `users.id` (CASCADE delete)
- `form_submissions.formId` → `forms.id` (CASCADE delete)
- `conversation_messages.submissionId` → `form_submissions.id` (CASCADE delete)

**Cascade Behavior:**
- Delete user → Delete all their forms → Delete all submissions → Delete all messages
- Delete form → Delete all submissions → Delete all messages
- Delete submission → Delete all messages

---

## 9. Backup & Data Retention

### Supabase Automatic Backups
- Daily backups (7-day retention)
- Point-in-time recovery (7 days)

### Manual Exports
```bash
# Export all data
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Data Retention Policy (Post-MVP)
- Completed submissions: Keep indefinitely
- Abandoned submissions: Delete after 30 days
- Archived forms: Keep metadata, optionally delete submissions

---

## 10. Schema Evolution (Post-MVP)

### v1.1 Additions
```prisma
model FormSubmission {
  // ... existing fields ...
  
  // New fields for save & resume
  resumeToken String? @unique
  lastActivityAt DateTime @default(now())
}
```

### v1.2 Additions
```prisma
model Document {
  id            String   @id @default(cuid())
  submissionId  String
  filePath      String
  extractedData Json?
  status        DocumentStatus @default(PENDING)
  createdAt     DateTime @default(now())
  
  submission FormSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  
  @@index([submissionId])
}

enum DocumentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### v1.3 Additions (Multi-Tenant)
```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  
  users User[]
  forms Form[]
}

model User {
  // ... existing fields ...
  
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  role           UserRole @default(VIEWER)
}

enum UserRole {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}
```

---

## 11. Summary

### MVP Schema (4 Tables)
1. **users** - Admin accounts
2. **forms** - Form definitions
3. **form_submissions** - User responses
4. **conversation_messages** - Chat history

### Key Design Decisions
- ✅ Simple structure (easy to understand)
- ✅ JSON fields for flexibility (schema, data, insights)
- ✅ Cascade deletes (data integrity)
- ✅ Proper indexes (query performance)
- ✅ Enums for status fields (type safety)

### Post-MVP Roadmap
- v1.1: Add resume tokens, activity tracking
- v1.2: Add documents table for file uploads
- v1.3: Add organizations, roles, multi-tenant

---

**Next Steps:**
1. Review this schema (approve or adjust)
2. Create API specification document
3. Start implementation (Week 1)

**Ready to proceed with API design?**
