## 9. Security & Compliance

### 9.1 Security Principles

**SP1: Defense in Depth**
Multiple layers of security, no single point of failure

**SP2: Least Privilege**
Users and services have minimum permissions needed

**SP3: Zero Trust**
Never trust, always verify - even internal requests

**SP4: Secure by Default**
Security is the default, not an opt-in

**SP5: Privacy by Design**
Data protection built into every feature

### 9.2 Authentication & Authorization

**Authentication Strategy:**

```typescript
// Using Supabase Auth
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Sign up
async function signUp(email: string, password: string) {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) throw error;
  return data;
}

// Session management (automatic refresh)
const {
  data: { session },
} = await supabase.auth.getSession();

// Multi-factor authentication
await supabase.auth.mfa.enroll({
  factorType: 'totp',
});
```

**Authorization with Row Level Security (RLS):**

```sql
-- Supabase RLS policies

-- Users can only see their organization's data
CREATE POLICY "Users see own org data"
  ON forms
  FOR SELECT
  USING (organization_id = (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Only admins can create forms
CREATE POLICY "Admins create forms"
  ON forms
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND organization_id = forms.organization_id
      AND role = 'admin'
    )
  );

-- Users can only edit their own submissions
CREATE POLICY "Users edit own submissions"
  ON form_submissions
  FOR UPDATE
  USING (user_id = auth.uid());

-- Sensitive data is hidden from non-admins
CREATE POLICY "Admins see all fields"
  ON form_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );
```

**API Authorization:**

```typescript
// Middleware for API routes
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Verify session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Check permissions for protected routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (user?.role !== 'admin' && user?.role !== 'owner') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }
  
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/:path*'],
};
```

**Role-Based Access Control (RBAC):**

```typescript
// Define roles and permissions
enum Role {
  Owner = 'owner',       // Full access
  Admin = 'admin',       // Manage forms, view all submissions
  Editor = 'editor',     // Create/edit forms
  Viewer = 'viewer',     // View only
}

enum Permission {
  CreateForm = 'form:create',
  EditForm = 'form:edit',
  DeleteForm = 'form:delete',
  ViewSubmissions = 'submissions:view',
  ExportData = 'data:export',
  ManageUsers = 'users:manage',
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.Owner]: [
    Permission.CreateForm,
    Permission.EditForm,
    Permission.DeleteForm,
    Permission.ViewSubmissions,
    Permission.ExportData,
    Permission.ManageUsers,
  ],
  [Role.Admin]: [
    Permission.CreateForm,
    Permission.EditForm,
    Permission.ViewSubmissions,
    Permission.ExportData,
  ],
  [Role.Editor]: [
    Permission.CreateForm,
    Permission.EditForm,
  ],
  [Role.Viewer]: [
    Permission.ViewSubmissions,
  ],
};

// Check permissions
function hasPermission(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

// Use in API
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  
  if (!hasPermission(user.role, Permission.DeleteForm)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  await db.form.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
}
```

### 9.3 Data Protection

**Encryption:**

```typescript
// Encrypt sensitive fields before storage
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Use in application
async function storeSSN(userId: string, ssn: string) {
  const encryptedSSN = encrypt(ssn);
  
  await db.user.update({
    where: { id: userId },
    data: { ssn: encryptedSSN },
  });
}
```

**PII Handling:**

```typescript
// Define what is PII
const PII_FIELDS = [
  'ssn',
  'passport_number',
  'drivers_license',
  'credit_card',
  'bank_account',
  'medical_record',
];

// Sanitize logs (never log PII)
function sanitizeForLogging(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };
  
  for (const field of PII_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

// Usage
logger.info('Form submitted', sanitizeForLogging(formData));

// Data retention policy
async function enforceDataRetention() {
  const retentionPeriod = 365; // days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionPeriod);
  
  // Delete old submissions
  await db.formSubmission.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: 'completed',
    },
  });
  
  logger.info('Data retention enforced', { cutoffDate });
}
```

### 9.4 Input Validation & Sanitization

**Validation with Zod:**

```typescript
import { z } from 'zod';

// Define schemas
const FormSubmissionSchema = z.object({
  formId: z.string().uuid(),
  data: z.record(z.unknown()), // Validate against form schema
  userId: z.string().uuid().optional(),
});

const EmailSchema = z.string().email().max(255);
const PhoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);

// Validate all inputs
export async function submitForm(input: unknown) {
  // Validate structure
  const validatedInput = FormSubmissionSchema.parse(input);
  
  // Validate data against form schema
  const form = await db.form.findUnique({
    where: { id: validatedInput.formId },
  });
  
  if (!form) {
    throw new Error('Form not found');
  }
  
  // Validate each field
  for (const [fieldName, fieldValue] of Object.entries(validatedInput.data)) {
    const fieldDef = form.schema.fields.find((f) => f.name === fieldName);
    
    if (!fieldDef) {
      throw new Error(`Unknown field: ${fieldName}`);
    }
    
    validateFieldValue(fieldDef, fieldValue);
  }
  
  // Sanitize before storage
  const sanitizedData = sanitizeData(validatedInput.data);
  
  return db.formSubmission.create({
    data: {
      formId: validatedInput.formId,
      data: sanitizedData,
    },
  });
}
```

**SQL Injection Prevention:**

```typescript
// ✅ SAFE - Using Prisma (parameterized queries)
const users = await db.user.findMany({
  where: {
    email: userInput, // Automatically escaped
  },
});

// ✅ SAFE - Raw query with parameters
const result = await db.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;

// ❌ NEVER DO THIS
const result = await db.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${userInput}'`
);
```

**XSS Prevention:**

```typescript
// React automatically escapes by default
function ChatMessage({ message }) {
  return <div>{message.text}</div>; // Automatically escaped
}

// Be careful with dangerouslySetInnerHTML
function RichTextMessage({ message }) {
  // Sanitize HTML before rendering
  const sanitizedHTML = DOMPurify.sanitize(message.html);
  
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
}

// Content Security Policy (CSP)
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.anthropic.com https://*.supabase.co;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

### 9.5 Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limits for different endpoints
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});

export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 AI requests per minute
  analytics: true,
});

export const formSubmissionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 submissions per hour
  analytics: true,
});

// Use in API route
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  
  const { success, limit, remaining, reset } = await apiRateLimit.limit(ip);
  
  if (!success) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    });
  }
  
  // Process request...
}
```

### 9.6 Security Checklist

**Pre-Deployment Security Checklist:**

```markdown
## Authentication & Authorization
- [ ] All routes require authentication (except public pages)
- [ ] Row Level Security (RLS) enabled on all Supabase tables
- [ ] API endpoints validate user permissions
- [ ] Session tokens have appropriate expiration
- [ ] MFA available for admin accounts
- [ ] Password requirements enforced (min 12 chars, complexity)

## Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] TLS/HTTPS enforced for all connections
- [ ] No PII in logs
- [ ] No secrets in code (all in env vars)
- [ ] Data retention policy implemented
- [ ] Backup encryption enabled

## Input Validation
- [ ] All inputs validated with Zod
- [ ] SQL injection prevented (Prisma/parameterized queries)
- [ ] XSS prevented (React escaping + CSP)
- [ ] File upload restrictions (type, size, content)
- [ ] Rate limiting on all public endpoints
- [ ] CSRF protection enabled

## Monitoring & Response
- [ ] Error tracking configured (Sentry)
- [ ] Security alerts configured
- [ ] Audit logging for sensitive operations
- [ ] Incident response plan documented
- [ ] Security contacts defined

## Dependencies
- [ ] All dependencies up to date
- [ ] Snyk scan passing (no high/critical vulns)
- [ ] No known vulnerable packages
- [ ] Dependency pinning (lock file committed)

## Configuration
- [ ] Debug mode disabled in production
- [ ] Stack traces hidden from users
- [ ] Admin interfaces not publicly accessible
- [ ] CORS properly configured
- [ ] Security headers set (CSP, HSTS, etc.)

## Compliance
- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if CA users)
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Data processing agreements signed
```

### 9.7 Compliance (GDPR/CCPA)

**Data Subject Rights Implementation:**

```typescript
// GDPR Article 15: Right of Access
export async function exportUserData(userId: string) {
  const userData = await db.user.findUnique({
    where: { id: userId },
    include: {
      formSubmissions: true,
      conversations: true,
      documents: true,
    },
  });
  
  // Return in machine-readable format
  return {
    personalData: userData,
    exportDate: new Date().toISOString(),
    format: 'JSON',
  };
}

// GDPR Article 17: Right to Erasure
export async function deleteUserData(userId: string) {
  // Anonymize instead of delete for audit trail
  await db.$transaction([
    // Anonymize user
    db.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@example.com`,
        name: '[DELETED]',
        deletedAt: new Date(),
      },
    }),
    
    // Delete personal data from submissions
    db.formSubmission.updateMany({
      where: { userId },
      data: {
        data: {}, // Clear collected data
      },
    }),
    
    // Delete documents
    db.document.deleteMany({
      where: {
        submission: {
          userId,
        },
      },
    }),
  ]);
  
  logger.info('User data deleted', { userId });
}

// GDPR Article 20: Right to Data Portability
export async function exportUserDataPortable(userId: string) {
  const data = await exportUserData(userId);
  
  // Convert to standard format (e.g., CSV for forms)
  const csv = convertToCSV(data.formSubmissions);
  
  return {
    csv,
    json: data,
  };
}

// Consent Management
export async function updateConsent(userId: string, consent: ConsentPreferences) {
  await db.user.update({
    where: { id: userId },
    data: {
      consent: {
        marketing: consent.marketing,
        analytics: consent.analytics,
        thirdParty: consent.thirdParty,
        updatedAt: new Date(),
      },
    },
  });
  
  // If analytics consent withdrawn, stop tracking
  if (!consent.analytics) {
    posthog.opt_out_capturing();
  }
}
```