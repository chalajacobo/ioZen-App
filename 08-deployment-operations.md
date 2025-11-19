## 8. Deployment & Operations

### 8.1 Deployment Strategy

**Continuous Deployment Pipeline:**

```
Developer Push
       ↓
GitHub (git push)
       ↓
GitHub Actions (CI)
  ├─ Run Tests
  ├─ Run Linters
  ├─ Build Application
  └─ Security Scans
       ↓
  All Checks Pass?
       ↓ Yes
Vercel (Auto Deploy)
  ├─ Preview (PR)
  ├─ Staging (main branch)
  └─ Production (manual promote or tag)
```

**GitHub Actions Workflow:**
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Type check
        run: pnpm tsc --noEmit
        
      - name: Lint
        run: pnpm lint
        
      - name: Run tests
        run: pnpm test:coverage
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
          
  sonarcloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for SonarCloud
          
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          
  deploy-preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    needs: [test, security, sonarcloud]
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          
  deploy-staging:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: [test, security, sonarcloud]
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          alias-domains: staging.conversational-forms.com
```

### 8.2 Environment Configuration

**Environment Variables Management:**

```bash
# Local Development (.env.local)
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://localhost:5432/forms_dev"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# AI Services (Mock or Dev Keys)
ANTHROPIC_API_KEY="sk-ant-dev..."
OPENAI_API_KEY="sk-dev..."

# AWS (for Textract)
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"

# Feature Flags
NEXT_PUBLIC_FEATURE_DOCUMENT_PROCESSING=true
NEXT_PUBLIC_FEATURE_AI_VALIDATION=false
```

**Vercel Environment Variables (Production):**
- Stored in Vercel dashboard
- Encrypted at rest
- Environment-specific (preview/staging/production)
- Accessible via `process.env`

### 8.3 Monitoring & Observability

**Monitoring Stack:**

**1. Application Performance (Vercel Analytics)**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Metrics Tracked:**
- Core Web Vitals (LCP, FID, CLS)
- Page load times
- API response times
- Error rates

**2. Error Tracking (Sentry)**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event, hint) {
    // Don't send certain errors
    if (event.exception?.values?.[0]?.value?.includes('AbortError')) {
      return null;
    }
    return event;
  },
});
```

**3. Product Analytics (PostHog)**
```typescript
// lib/analytics.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://app.posthog.com',
  });
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  posthog.capture(event, properties);
}

// Usage
trackEvent('form_started', { formId, userId });
trackEvent('form_completed', { formId, userId, duration });
trackEvent('document_uploaded', { formId, documentType });
```

**4. Workflow Monitoring**
```typescript
// Vercel Workflow provides built-in observability
// Access via Vercel dashboard:
// - Execution timeline
// - Step-by-step logs
// - Error details
// - Retry history

// Custom monitoring
export const formCompletionWorkflow = new Workflow('form-completion')
  .step('initialize', async (context) => {
    logger.info('Workflow started', { formId: context.formId });
    // ...
  })
  .step('validate', async (context) => {
    const startTime = Date.now();
    try {
      const result = await validate(context.data);
      logger.info('Validation completed', {
        duration: Date.now() - startTime,
        valid: result.valid,
      });
      return result;
    } catch (error) {
      logger.error('Validation failed', { error, context });
      throw error;
    }
  });
```

**5. Database Monitoring**
- Supabase Dashboard: Query performance, connection pools, slow queries
- Set up alerts for:
  - Connection pool exhaustion
  - Slow queries (>1s)
  - High error rates

### 8.4 Logging Strategy

**Structured Logging:**
```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'conversational-forms' },
  transports: [
    // Console in development
    ...(process.env.NODE_ENV !== 'production'
      ? [new winston.transports.Console({
          format: winston.format.simple(),
        })]
      : []),
    // File in production (or use external service)
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'error.log', level: 'error' }),
          new winston.transports.File({ filename: 'combined.log' }),
        ]
      : []),
  ],
});

// Add context to all logs
export function createLogger(context: Record<string, any>) {
  return {
    debug: (message: string, meta?: Record<string, any>) =>
      logger.debug(message, { ...context, ...meta }),
    info: (message: string, meta?: Record<string, any>) =>
      logger.info(message, { ...context, ...meta }),
    warn: (message: string, meta?: Record<string, any>) =>
      logger.warn(message, { ...context, ...meta }),
    error: (message: string, meta?: Record<string, any>) =>
      logger.error(message, { ...context, ...meta }),
  };
}

// Usage in modules
const logger = createLogger({ module: 'validation-engine' });
logger.info('Validating field', { fieldName, value });
```

**What to Log:**
```typescript
// ✅ DO log:
logger.info('User authenticated', { userId, method: 'email' });
logger.info('Form submission started', { formId, userId });
logger.warn('Validation failed', { fieldName, reason, attemptCount });
logger.error('AI API request failed', { error, provider, retryCount });

// ❌ DON'T log:
logger.info('User data', { password: 'secret123' }); // PII/secrets
logger.debug('Full request body', { body }); // May contain PII
logger.info('Database query', { sql, params }); // May expose sensitive data
```

**Log Levels:**
- **ERROR:** System errors, exceptions, failures requiring action
- **WARN:** Degraded functionality, retries, potential issues
- **INFO:** Important business events (form started, submission completed)
- **DEBUG:** Detailed diagnostic information (development only)

### 8.5 Alerts & Incident Response

**Alert Configuration:**

```yaml
# Example alert rules (PostHog/Sentry/Custom)

Critical Alerts (Page immediately):
  - Error rate >5% (5min window)
  - API response time p95 >2s
  - Database connection pool >90% utilized
  - AI API failure rate >20%
  - Workflow failure rate >10%

High Alerts (Slack notification):
  - Error rate >2% (15min window)
  - Form abandonment rate >50% (1hr window)
  - Document processing failure rate >5%
  - Slow API endpoints p95 >1s

Medium Alerts (Email):
  - Unusual traffic patterns
  - Cost anomalies (AI API spend spike)
  - Storage approaching limits

Low Alerts (Dashboard only):
  - New feature usage metrics
  - Performance trends
```

**Incident Response Runbook:**

```markdown
# Incident Response Runbook

## Severity Levels

### SEV1 - Critical (Complete outage)
- Response Time: Immediate
- Escalation: Page on-call engineer
- Communication: Update status page every 15min

### SEV2 - High (Partial outage or severe degradation)
- Response Time: 15 minutes
- Escalation: Slack alert to team
- Communication: Update status page every 30min

### SEV3 - Medium (Minor degradation)
- Response Time: 1 hour
- Escalation: GitHub issue
- Communication: Include in weekly summary

## Common Incidents

### Database Connection Pool Exhausted
Symptoms: "Too many clients" errors, connection timeouts
Diagnosis:
  1. Check Supabase dashboard for active connections
  2. Identify long-running queries
  3. Check for connection leaks (unclosed connections)
Resolution:
  1. Temporarily increase connection limit (Supabase settings)
  2. Kill long-running queries if necessary
  3. Deploy connection leak fix
Prevention:
  - Review all database client initialization
  - Ensure proper connection closing in error paths
  - Add connection pool monitoring

### AI API Rate Limiting
Symptoms: 429 errors, timeouts on AI features
Diagnosis:
  1. Check Anthropic/OpenAI dashboard for rate limit status
  2. Review recent traffic patterns
  3. Identify if abuse or legitimate spike
Resolution:
  1. Activate rate limiting on our side if abuse
  2. Contact AI provider for temporary limit increase
  3. Implement request queuing/throttling
Prevention:
  - Implement aggressive caching
  - Add per-user rate limits
  - Monitor AI API usage proactively

### Workflow Execution Failures
Symptoms: High workflow failure rate
Diagnosis:
  1. Check Vercel Workflow dashboard
  2. Identify which step is failing
  3. Review error messages and context
Resolution:
  1. If external API issue: Enable fallback/degraded mode
  2. If code bug: Hotfix and deploy
  3. If data issue: Fix data and retry workflows
Prevention:
  - Better error handling in workflows
  - Comprehensive integration tests
  - Regular dependency updates
```

### 8.6 Backup & Disaster Recovery

**Backup Strategy:**

```yaml
Database (Supabase):
  Automated Backups:
    - Daily backups (retained 7 days)
    - Weekly backups (retained 4 weeks)
    - Monthly backups (retained 12 months)
  Point-in-Time Recovery:
    - Enabled (restore to any point in last 7 days)
  Testing:
    - Monthly restore test to staging environment

Storage (Supabase Storage):
  Document Storage:
    - Replication across Supabase infrastructure
    - Manual exports to S3 (weekly for compliance)
  Testing:
    - Quarterly restore test

Code & Configuration:
  Version Control:
    - All code in GitHub (redundant storage)
    - All infrastructure as code (Vercel config, etc.)
  Secrets:
    - Stored in Vercel (encrypted)
    - Backup in 1Password vault (encrypted)
```

**Disaster Recovery Plan:**

```markdown
# Disaster Recovery Plan

## Recovery Time Objective (RTO): 4 hours
Time to restore service after catastrophic failure

## Recovery Point Objective (RPO): 1 hour
Maximum acceptable data loss

## Scenarios

### Complete Vercel Outage
Probability: Very Low
Impact: Complete service outage
Recovery:
  1. Deploy to backup hosting (Netlify/AWS)
  2. Update DNS records
  3. Migrate environment variables
  Estimated Time: 2-3 hours

### Complete Supabase Outage
Probability: Very Low
Impact: No database/auth/storage access
Recovery:
  1. Restore latest backup to new Supabase project
  2. Update connection strings in Vercel
  3. Verify data integrity
  4. Resume service
  Estimated Time: 3-4 hours

### Data Corruption
Probability: Low
Impact: Partial data loss
Recovery:
  1. Identify scope of corruption
  2. Restore from point-in-time backup
  3. Replay transactions if possible
  4. Notify affected users
  Estimated Time: 2-6 hours

### Security Breach
Probability: Medium
Impact: Potential data exposure
Response:
  1. Immediately isolate affected systems
  2. Rotate all credentials
  3. Investigate breach scope
  4. Notify affected users (legal requirement)
  5. Implement additional security measures
  Estimated Time: Varies
```

### 8.7 Performance Optimization

**Performance Budget:**

```yaml
Web Vitals Targets:
  Largest Contentful Paint (LCP): <2.5s
  First Input Delay (FID): <100ms
  Cumulative Layout Shift (CLS): <0.1
  First Contentful Paint (FCP): <1.8s
  Time to Interactive (TTI): <3.5s

API Performance Targets:
  Simple queries (p50): <50ms
  Complex queries (p50): <200ms
  AI operations (p50): <2s
  Document processing (p50): <10s

Bundle Size Targets:
  Initial JS bundle: <150KB (gzipped)
  Initial CSS: <50KB (gzipped)
  Total page weight: <500KB
```

**Optimization Techniques:**

**1. Code Splitting**
```typescript
// app/forms/[id]/page.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const ChatInterface = dynamic(() => import('@/components/chat/ChatInterface'), {
  loading: () => <ChatSkeleton />,
  ssr: false, // Don't SSR if not needed
});

// Lazy load analytics (non-critical)
const Analytics = dynamic(() => import('@/components/Analytics'), {
  ssr: false,
});

export default function FormPage({ params }) {
  return (
    <>
      <ChatInterface formId={params.id} />
      <Analytics />
    </>
  );
}
```

**2. Image Optimization**
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Conversational forms"
  width={1200}
  height={600}
  priority // LCP image
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

**3. Database Query Optimization**
```typescript
// ❌ BAD - N+1 query
const submissions = await db.formSubmission.findMany();
for (const submission of submissions) {
  const form = await db.form.findUnique({ where: { id: submission.formId }});
  // Process...
}

// ✅ GOOD - Single query with join
const submissions = await db.formSubmission.findMany({
  include: {
    form: true, // Join in single query
  },
});

// ✅ BETTER - Add index
// In Prisma schema:
model FormSubmission {
  // ...
  @@index([formId]) // Index for foreign key
  @@index([createdAt]) // Index for sorting/filtering
}
```

**4. Caching Strategy**
```typescript
// API route caching
export const revalidate = 3600; // Revalidate every hour

export async function GET(request: Request) {
  const forms = await db.form.findMany();
  return Response.json(forms);
}

// Client-side caching with TanStack Query
const { data, isLoading } = useQuery({
  queryKey: ['forms'],
  queryFn: fetchForms,
  staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
});

// AI response caching (in-memory or Redis)
const cache = new Map<string, AIResponse>();

async function getAIResponse(prompt: string): Promise<AIResponse> {
  const cacheKey = hashPrompt(prompt);
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  
  const response = await claude.complete(prompt);
  cache.set(cacheKey, response);
  
  return response;
}
```

**5. React Performance**
```typescript
// Memoization for expensive computations
import { useMemo, useCallback } from 'react';

function ChatInterface({ messages }) {
  // Memoize expensive computation
  const sortedMessages = useMemo(() => {
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  }, [messages]);
  
  // Memoize callbacks to prevent child re-renders
  const handleSendMessage = useCallback((message: string) => {
    sendMessage(message);
  }, [sendMessage]);
  
  return <MessageList messages={sortedMessages} onSend={handleSendMessage} />;
}

// Prevent unnecessary re-renders
import { memo } from 'react';

const MessageItem = memo(function MessageItem({ message }) {
  return <div>{message.text}</div>;
});
```