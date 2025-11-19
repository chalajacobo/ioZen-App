# MVP Scope Definition

**Version:** 1.0  
**Last Updated:** 2025-11-18  
**Status:** Draft

---

## 1. MVP Philosophy

> **"The simplest end-to-end experience that proves IoZen's core value: We're not making forms conversational—we're creating chatflows that replace forms entirely."**

### Core Principle
Build the **absolute minimum** that demonstrates:
1. AI can generate a chatflow structure (json) from natural language that can be used to collect data replacing forms
2. AI can conduct a conversation to collect data based on the json chatflow structure in step 1
3. AI can interpret results and provide insights based on the data collected in step 2
4. The entire flow works in production with real users

### What MVP Is NOT
- ❌ Not a feature-complete product
- ❌ Not production-scale infrastructure
- ❌ Not multi-tenant (single organization only)
- ❌ Not mobile-optimized (desktop-first)
- ❌ Not document processing (text-only for MVP)

### Success Criteria
**MVP is successful if:**
- ✅ 5 beta users complete a chatflow end-to-end
- ✅ Users say "this is easier than traditional forms"
- ✅ No critical bugs in production for 1 day
- ✅ We learn what to build next

---

## 2. MVP User Journey (Single Flow)

### The One Flow We Support

```
Chatflow Creator (Admin)                Chatflow User
      │                                       │
      ▼                                       │
1. Describe chatflow in plain English       │
   "Create an insurance claim chatflow"     │
      │                                       │
      ▼                                       │
2. AI generates chatflow structure          │
   (name, policy #, incident date, etc.)    │
      │                                       │
      ▼                                       │
3. Review & publish chatflow                │
   Get shareable link                       │
      │                                       │
      │────────── Share link ────────────────▶
      │                                       │
      │                                       ▼
      │                              4. Open chatflow link
      │                                       │
      │                                       ▼
      │                              5. AI asks questions
      │                                 one at a time
      │                                       │
      │                                       ▼
      │                              6. User answers in
      │                                 natural language
      │                                       │
      │                                       ▼
      │                              7. AI validates &
      │                                 asks follow-ups
      │                                       │
      │                                       ▼
      │                              8. Submit when complete
      │                                       │
      │◀────── Notification ──────────────────┘
      │
      ▼
9. View submission
   - Raw answers
   - AI-generated summary
   - Key insights
```

---

## 3. MVP Feature Set (Minimal)

### 3.1 Chatflow (Form) Creation (Admin Side)

**Feature:** AI Chatflow Generator
- **Input:** Natural language description (text box)
- **Process:** Claude (Or other LLM in the future) generates chatflow schema json (fields, types, validation)
- **Output:** Editable chatflow preview ui based on the json schema (beautifully formatted and styled)
- **Actions:** Edit field names, mark required, publish

**What's Included:**
- ✅ Text input for chatflow description
- ✅ AI generates 5-15 fields max
- ✅ Field types: text, number, email, date, yes/no
- ✅ Mark fields as required
- ✅ Publish button → generates unique URL
- ✅ Editable chatflow preview ui based on the json schema (beautifully formatted and styled)

**What's NOT Included:**
- ❌ Custom validation rules
- ❌ Conditional logic (branching)
- ❌ File uploads
- ❌ Version history

---

### 3.2 Chatflow Filling (User Side)

**Feature:** Conversational Chatflow Interface
- **Input:** User answers in natural language
- **Process:** AI asks questions, validates, adapts
- **Output:** Completed submission

**What's Included:**
- ✅ Chat-style interface (messages)
- ✅ AI asks one question at a time
- ✅ User types answer (text input)
- ✅ Basic validation (required, format)
- ✅ Progress indicator (3 of 10 questions)
- ✅ Submit button when complete
- ✅ Confirmation message

**What's NOT Included:**
- ❌ Voice input
- ❌ Document upload
- ❌ Image recognition
- ❌ Save & resume later
- ❌ Edit previous answers
- ❌ Multi-language support
- ❌ Accessibility features (WCAG)
- ❌ Mobile optimization

---

### 3.3 Results Viewing (Admin Side)

**Feature:** Submission Dashboard
- **Input:** Completed submissions
- **Process:** AI interprets and summarizes
- **Output:** Readable insights

**What's Included:**
- ✅ List of submissions (table)
- ✅ Click to view details
- ✅ Raw answers displayed
- ✅ AI-generated summary (3-5 sentences)
- ✅ Key insights (bullet points)
- ✅ Export as JSON

**What's NOT Included:**
- ❌ Analytics dashboard
- ❌ Charts/graphs
- ❌ Filtering/search
- ❌ Bulk export (CSV)
- ❌ Webhooks
- ❌ Integrations (Zapier, etc.)
- ❌ Email notifications

---

## 4. Technical Scope (Simplified)

### 4.1 Architecture (MVP Simplifications)

**Use:**
- ✅ Next.js 14 (App Router)
- ✅ Supabase (database + auth)
- ✅ Anthropic Claude (single LLM provider)
- ✅ Vercel (hosting)
- ✅ Vercel Workflow (use simple async functions)
- ✅ Provider abstraction (hardcode Claude)


**Skip for MVP:**

- ❌ Multi-provider fallback
- ❌ Circuit breakers
- ❌ Redis caching
- ❌ Rate limiting
- ❌ Monitoring (Sentry, PostHog)

### 4.2 Database Schema (Minimal)

**Tables:**
1. `users` - Single admin user (hardcoded)
2. `chatflows` - Chatflow definitions
3. `chatflow_submissions` - Collected data
4. `conversation_messages` - Chat history

**Skip for MVP:**
- ❌ Organizations (multi-tenant)
- ❌ Roles/permissions
- ❌ Documents table
- ❌ Validation rules table
- ❌ Workflow executions table

### 4.3 AI Integration (Simple)

**What's Included:**
- ✅ Claude API for chatflow generation
- ✅ Claude API for conversation
- ✅ Claude API for result interpretation
- ✅ Simple prompt templates (hardcoded)

**What's NOT Included:**
- ❌ Prompt optimization
- ❌ Response caching
- ❌ Streaming responses
- ❌ Function calling
- ❌ Embeddings/semantic search
- ❌ Fine-tuned models

---

## 5. MVP Development Phases

### Phase 1: Foundation (Day 1)
**Goal:** Basic infrastructure working

- [ ] Next.js project setup
- [ ] Supabase project + database
- [ ] Authentication (single user)
- [ ] Basic UI components (shadcn/ui)
- [ ] Claude API integration (test)
- [ ] Vercel Workflow setup

**Deliverable:** Can call Claude API from Next.js with Workflow

---

### Phase 2: Chatflow Creation (Day 2)
**Goal:** Admin can create chatflows

- [ ] Chatflow description input page
- [ ] AI chatflow generation endpoint (Workflow)
- [ ] Chatflow preview component
- [ ] Edit chatflow fields (basic)
- [ ] Save chatflow to database
- [ ] Generate shareable link

**Deliverable:** Can create and publish a chatflow

---

### Phase 3: Chatflow Filling (Day 3)
**Goal:** Users can fill chatflows

- [ ] Public chatflow page (no auth)
- [ ] Chat interface component
- [ ] Conversation engine (AI asks questions via Workflow)
- [ ] Answer validation (basic)
- [ ] Progress tracking
- [ ] Submit chatflow

**Deliverable:** Can complete a chatflow end-to-end

---

### Phase 4: Results Viewing (Day 4)
**Goal:** Admin can view submissions

- [ ] Submissions list page
- [ ] Submission detail view
- [ ] AI result interpretation (Workflow)
- [ ] Display summary + insights
- [ ] Export JSON

**Deliverable:** Can view and interpret results

---

### Phase 5: Polish & Deploy (Day 5)
**Goal:** Production-ready MVP

- [ ] Error handling (user-facing)
- [ ] Loading states
- [ ] Basic styling polish
- [ ] Deploy to Vercel
- [ ] Test with 3 beta users
- [ ] Fix critical bugs

**Deliverable:** Live production URL

---

## 6. MVP Constraints & Trade-offs

### What We're Optimizing For
1. **Speed to production** (1 or 2 days max)
2. **End-to-end functionality** (complete flow)
3. **Learning** (validate core hypothesis)
4. **Simplicity** (easy to understand/modify)

### What We're NOT Optimizing For
1. ❌ Scale (1-10 users max)
2. ❌ Performance (< 100 submissions)
3. ❌ Security (basic auth only)
4. ❌ Reliability (downtime acceptable)
5. ❌ Code quality (tech debt acceptable)

### Acceptable Technical Debt
- Hardcoded prompts (not configurable)
- No error recovery (just show error)
- No retry logic (fail fast)
- Inline styles acceptable
- No tests (manual testing only)
- No CI/CD (manual deploy)
- No monitoring (check manually)

### Non-Negotiable Quality
- ✅ AI must work reliably (core value prop)
- ✅ Data must not be lost (database backups)
- ✅ UI must be usable (not broken)
- ✅ Chatflows must be shareable (public URLs)

---

## 7. MVP Success Metrics

### Quantitative Metrics
- **Completion Rate:** > 60% (vs. 30% baseline)
- **Time to Complete:** < 5 minutes (vs. 10+ minutes)
- **Questions Asked:** 5-15 (adaptive, not fixed)
- **User Errors:** < 2 per chatflow (validation works)

### Qualitative Metrics
- **User Feedback:** "Easier than traditional forms"
- **Admin Feedback:** "Chatflow creation is magical, unlike traditional forms"
- **Learning:** "Now we know what to build next"

### Launch Criteria
**MVP is ready to launch when:**
1. ✅ All 4 phases complete
2. ✅ 3 internal beta tests successful
3. ✅ No data loss bugs
4. ✅ AI responses are coherent
5. ✅ Can demo in < 3 minutes

---

## 8. Post-MVP Roadmap (What's Next)

### v1.1 (Month 2)
- Save & resume chatflows
- Edit previous answers
- Mobile-responsive design
- Basic analytics

### v1.2 (Month 3)
- Document upload (images)
- OCR + extraction
- Multi-page chatflows
- Email notifications

### v1.3 (Month 4)
- Multi-tenant (organizations)
- User roles/permissions
- Chatflow templates
- Conditional logic

### v2.0 (Month 6)
- Advanced validation
- Integrations (Zapier)
- Production-scale infrastructure

---

## 9. MVP Development Principles

### Principle 1: "Hardcode First, Abstract Later"
Don't build abstractions until you need them.

**Example:**
```typescript
// ✅ MVP: Hardcode Claude
const response = await anthropic.messages.create({ ... });

// ❌ Not MVP: Provider abstraction
const provider = registry.getLLMProvider();
const response = await provider.complete({ ... });
```

### Principle 2: "Inline First, Extract Later"
Don't create separate files until code is duplicated 3+ times.

**Example:**
```typescript
// ✅ MVP: Inline prompt
const prompt = `Generate a chatflow for: ${description}`;

// ❌ Not MVP: Separate prompt file
import { CHATFLOW_GENERATION_PROMPT } from '@/prompts/chatflow-generation';
```

### Principle 3: "Manual First, Automate Later"
Don't build automation until manual process is painful.

**Example:**
- ✅ MVP: Deploy manually with `vercel --prod`
- ❌ Not MVP: GitHub Actions CI/CD pipeline

### Principle 4: "Happy Path First, Edge Cases Later"
Build for the 90% case, handle errors later.

**Example:**
```typescript
// ✅ MVP: Assume success
const chatflow = await generateChatflow(description);

// ❌ Not MVP: Comprehensive error handling
try {
  const chatflow = await generateChatflow(description);
} catch (error) {
  if (error instanceof RateLimitError) { ... }
  if (error instanceof ValidationError) { ... }
}
```

---

## 10. MVP Risk Mitigation

### Risk 1: AI Doesn't Work Well
**Mitigation:**
- Test Claude API extensively before building UI
- Have 10+ example prompts that work
- Fallback: Manual chatflow creation (admin edits AI output)

### Risk 2: Takes Longer Than 5 Days
**Mitigation:**
- Cut scope aggressively (remove result interpretation if needed)
- Focus on chatflow filling (core value prop)
- Extend timeline if necessary (better late than broken)

### Risk 3: Users Don't Understand Conversational UI
**Mitigation:**
- Add onboarding tooltip ("Answer in your own words")
- Show example answers
- Fallback: Traditional form fields (defeats purpose of chatflows, but validates need)

### Risk 4: Claude API Costs Too Much
**Mitigation:**
- Estimate: 10 users × 10 chatflows × $0.50 = $50/month (acceptable)
- Monitor costs daily
- Set hard limit in Anthropic dashboard

---

## 11. MVP Launch Checklist

### Pre-Launch (Day 5)
- [ ] All features working end-to-end
- [ ] 3 internal beta tests completed
- [ ] No critical bugs
- [ ] Supabase backups enabled
- [ ] Environment variables secured (Vercel)
- [ ] Custom domain configured (optional)
- [ ] Privacy policy page (basic)
- [ ] Terms of service page (basic)

### Launch Day
- [ ] Deploy to production
- [ ] Test live URL
- [ ] Invite 5 beta users
- [ ] Monitor for errors (manual)
- [ ] Collect feedback (email/call)

### Post-Launch (Day 6-7)
- [ ] Analyze completion rates
- [ ] Review user feedback
- [ ] Prioritize v1.1 features
- [ ] Document learnings
- [ ] Decide: iterate or pivot

---

## 12. Summary: The Simplest IoZen

**MVP in One Sentence:**
> "A single admin can describe a chatflow in plain English, AI generates it, users fill it conversationally, and AI interprets the results—all in 5 days."

**What Makes This MVP Valuable:**
1. **Proves core hypothesis:** AI makes chatflows better than forms
2. **End-to-end experience:** Not just a demo
3. **Production-ready:** Real users, real data
4. **Fast to build:** 5 days, not 5 weeks
5. **Easy to iterate:** Simple codebase, clear next steps

**What We'll Learn:**
- Do users prefer conversational chatflows over traditional forms?
- Does AI generate good chatflow structures?
- What completion rate can we achieve?
- What features do users ask for next?
- Is this a viable business?

**Next Steps:**
1. ✅ Review this MVP scope (you've started)
2. 🎨 Create visual prototype/preview (next)
3. 📋 Finalize database schema with "chatflows" terminology
4. 🚀 Start coding (Day 1)

---

**Ready to create a visual prototype?**
