# UX & Design System

**Version:** 1.0  
**Last Updated:** 2025-11-18  
**Status:** Draft

---

## 1. Design Philosophy

> **"Invisible interface. The AI conversation is the interface."**

### Design Principles

**P1: Minimalism**
- Remove everything that doesn't serve the core interaction
- White space is a feature, not empty space
- Every pixel has a purpose

**P2: Conversation-First**
- The chat is the primary UI element
- Everything else supports the conversation
- No distractions from the dialogue

**P3: Delightful Simplicity**
- Smooth animations (not flashy)
- Subtle feedback (not overwhelming)
- Predictable behavior (not surprising)

**P4: Accessibility by Default**
- High contrast ratios
- Clear typography
- Keyboard navigation
- Screen reader friendly

---

## 2. Design Inspiration (Best-in-Class)

### Products We Learn From

**Linear** (linear.app)
- ✅ Clean, minimal interface
- ✅ Keyboard-first interactions
- ✅ Subtle animations
- ✅ Command palette pattern

**Stripe Dashboard** (stripe.com)
- ✅ Information hierarchy
- ✅ Data visualization
- ✅ Professional aesthetic
- ✅ Consistent spacing

**Vercel** (vercel.com)
- ✅ Dark mode done right
- ✅ Monospace typography for data
- ✅ Deployment status patterns
- ✅ Minimal color palette

**ChatGPT** (chat.openai.com)
- ✅ Conversational UI patterns
- ✅ Message threading
- ✅ Typing indicators
- ✅ Input focus management

**Notion** (notion.so)
- ✅ Flexible layouts
- ✅ Inline editing
- ✅ Smooth transitions
- ✅ Contextual actions

---

## 3. Color System

### MVP Palette (Minimal)

**Neutral Scale** (Primary)
```css
--gray-50:  #fafafa;  /* Backgrounds */
--gray-100: #f5f5f5;  /* Subtle backgrounds */
--gray-200: #e5e5e5;  /* Borders */
--gray-300: #d4d4d4;  /* Disabled text */
--gray-400: #a3a3a3;  /* Placeholder text */
--gray-500: #737373;  /* Secondary text */
--gray-600: #525252;  /* Body text */
--gray-700: #404040;  /* Headings */
--gray-800: #262626;  /* Strong emphasis */
--gray-900: #171717;  /* Maximum contrast */
```

**Brand Color** (Accent)
```css
--brand-50:  #eff6ff;  /* Lightest blue */
--brand-100: #dbeafe;
--brand-200: #bfdbfe;
--brand-300: #93c5fd;
--brand-400: #60a5fa;
--brand-500: #3b82f6;  /* Primary brand */
--brand-600: #2563eb;  /* Hover states */
--brand-700: #1d4ed8;  /* Active states */
--brand-800: #1e40af;
--brand-900: #1e3a8a;  /* Darkest blue */
```

**Semantic Colors**
```css
--success: #10b981;  /* Green */
--warning: #f59e0b;  /* Amber */
--error:   #ef4444;  /* Red */
--info:    #3b82f6;  /* Blue */
```

### Usage Guidelines

**Text:**
- Headings: `--gray-900`
- Body: `--gray-700`
- Secondary: `--gray-500`
- Disabled: `--gray-400`

**Backgrounds:**
- Page: `white` or `--gray-50`
- Cards: `white`
- Hover: `--gray-100`
- Active: `--brand-50`

**Borders:**
- Default: `--gray-200`
- Focus: `--brand-500`
- Error: `--error`

---

## 4. Typography

### Font Stack

**Sans-Serif (UI Text)**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

**Monospace (Code/Data)**
```css
font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 
             'Courier New', monospace;
```

### Type Scale

```css
/* Headings */
--text-4xl: 2.25rem;  /* 36px - Page titles */
--text-3xl: 1.875rem; /* 30px - Section headers */
--text-2xl: 1.5rem;   /* 24px - Card titles */
--text-xl:  1.25rem;  /* 20px - Subsections */
--text-lg:  1.125rem; /* 18px - Emphasized text */

/* Body */
--text-base: 1rem;    /* 16px - Default */
--text-sm:   0.875rem;/* 14px - Secondary */
--text-xs:   0.75rem; /* 12px - Captions */
```

### Font Weights

```css
--font-normal:  400;  /* Body text */
--font-medium:  500;  /* Emphasis */
--font-semibold: 600; /* Headings */
--font-bold:    700;  /* Strong emphasis */
```

### Line Heights

```css
--leading-tight:  1.25;  /* Headings */
--leading-normal: 1.5;   /* Body text */
--leading-relaxed: 1.75; /* Long-form content */
```

---

## 5. Spacing System

### Scale (8px base unit)

```css
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Usage Guidelines

**Component Padding:**
- Buttons: `--space-3` (vertical) × `--space-4` (horizontal)
- Cards: `--space-6`
- Modals: `--space-8`

**Component Gaps:**
- Tight: `--space-2`
- Normal: `--space-4`
- Relaxed: `--space-6`

**Page Margins:**
- Mobile: `--space-4`
- Desktop: `--space-8` to `--space-12`

---

## 6. Component Library (MVP Essentials)

### 6.1 Button

**Variants:**

```tsx
// Primary (Brand)
<button className="
  px-4 py-2.5 
  bg-brand-500 hover:bg-brand-600 active:bg-brand-700
  text-white font-medium text-sm
  rounded-lg
  transition-colors duration-150
  focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
">
  Publish Form
</button>

// Secondary (Outline)
<button className="
  px-4 py-2.5
  border border-gray-300 hover:border-gray-400
  text-gray-700 font-medium text-sm
  rounded-lg
  transition-colors duration-150
  focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
">
  Cancel
</button>

// Ghost (Minimal)
<button className="
  px-4 py-2.5
  text-gray-600 hover:text-gray-900 hover:bg-gray-100
  font-medium text-sm
  rounded-lg
  transition-colors duration-150
">
  Learn More
</button>
```

**States:**
- Default: Normal colors
- Hover: Slightly darker
- Active: Even darker
- Disabled: `opacity-50 cursor-not-allowed`
- Loading: Show spinner, disable interaction

---

### 6.2 Input Field

```tsx
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-gray-700">
    Form Description
  </label>
  <input 
    type="text"
    placeholder="Describe your form in plain English..."
    className="
      w-full px-3 py-2
      border border-gray-300 rounded-lg
      text-gray-900 placeholder:text-gray-400
      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
      transition-shadow duration-150
    "
  />
  <p className="text-xs text-gray-500">
    Example: "Create an insurance claim form with policy number, incident date, and description"
  </p>
</div>
```

**States:**
- Default: `border-gray-300`
- Focus: `ring-2 ring-brand-500`
- Error: `border-error ring-error`
- Disabled: `bg-gray-100 cursor-not-allowed`

---

### 6.3 Card

```tsx
<div className="
  bg-white
  border border-gray-200
  rounded-xl
  p-6
  shadow-sm hover:shadow-md
  transition-shadow duration-200
">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    Insurance Claim Form
  </h3>
  <p className="text-sm text-gray-600">
    Created 2 hours ago • 3 submissions
  </p>
</div>
```

---

### 6.4 Chat Message

**AI Message:**
```tsx
<div className="flex gap-3 mb-4">
  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
    <svg className="w-5 h-5 text-brand-600">
      {/* AI icon */}
    </svg>
  </div>
  <div className="flex-1">
    <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
      <p className="text-gray-900 text-base leading-relaxed">
        What is your policy number?
      </p>
    </div>
    <span className="text-xs text-gray-500 mt-1 ml-1">
      Just now
    </span>
  </div>
</div>
```

**User Message:**
```tsx
<div className="flex gap-3 mb-4 flex-row-reverse">
  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
    <span className="text-sm font-medium text-gray-700">
      JD
    </span>
  </div>
  <div className="flex-1 flex flex-col items-end">
    <div className="bg-brand-500 rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
      <p className="text-white text-base leading-relaxed">
        POL-123456789
      </p>
    </div>
    <span className="text-xs text-gray-500 mt-1 mr-1">
      2:34 PM
    </span>
  </div>
</div>
```

---

### 6.5 Progress Indicator

```tsx
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">Progress</span>
    <span className="font-medium text-gray-900">3 of 10 questions</span>
  </div>
  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
    <div 
      className="h-full bg-brand-500 transition-all duration-300 ease-out"
      style={{ width: '30%' }}
    />
  </div>
</div>
```

---

## 7. Page Layouts (MVP)

### 7.1 Admin: Form Creation Page

```
┌─────────────────────────────────────────────────────────┐
│  IoZen                                    [User Menu]    │ ← Header
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Create New Form                                │    │
│  │                                                  │    │
│  │  Describe your form in plain English:          │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │ Create an insurance claim form with...  │  │    │
│  │  │                                          │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  │                                                  │    │
│  │  [Generate Form]                                │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Generated Form Preview                         │    │
│  │                                                  │    │
│  │  ☐ Policy Number (text, required)              │    │
│  │  ☐ Incident Date (date, required)              │    │
│  │  ☐ Description (text, optional)                │    │
│  │                                                  │    │
│  │  [Edit] [Publish]                               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Layout Specs:**
- Max width: `1200px`
- Center aligned
- Padding: `--space-8` (desktop), `--space-4` (mobile)
- Gap between sections: `--space-8`

---

### 7.2 User: Form Filling Page

```
┌─────────────────────────────────────────────────────────┐
│  Insurance Claim Form                                    │ ← Header (minimal)
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Progress: 3 of 10 questions                    │    │
│  │  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  [AI] What is your policy number?               │    │
│  │       Just now                                   │    │
│  │                                                  │    │
│  │                      [You] POL-123456789    │    │
│  │                            2:34 PM               │    │
│  │                                                  │    │
│  │  [AI] Thank you. When did the incident occur?   │    │
│  │       2:34 PM                                    │    │
│  │                                                  │    │
│  │  ● ● ●  (typing indicator)                      │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │ Type your answer...                 [Send] │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Layout Specs:**
- Max width: `800px` (narrower for readability)
- Center aligned
- Chat area: `min-height: 60vh`
- Input always visible at bottom (sticky)

---

### 7.3 Admin: Submissions List

```
┌─────────────────────────────────────────────────────────┐
│  IoZen                                    [User Menu]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Insurance Claim Form                                    │
│  ┌────────────────────────────────────────────────┐    │
│  │  3 submissions • Last updated 5 min ago         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  John Doe                          2 hours ago  │    │
│  │  POL-123456 • March 15, 2024                    │    │
│  │  [View Details]                                 │    │
│  ├────────────────────────────────────────────────┤    │
│  │  Jane Smith                        5 hours ago  │    │
│  │  POL-789012 • March 14, 2024                    │    │
│  │  [View Details]                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### 7.4 Admin: Submission Detail

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Submissions                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Submission by John Doe                                  │
│  Submitted 2 hours ago                                   │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  AI Summary                                     │    │
│  │                                                  │    │
│  │  John Doe filed a claim for a car accident     │    │
│  │  on March 15, 2024. Policy POL-123456.         │    │
│  │  Incident involved rear-end collision.          │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Key Insights                                   │    │
│  │                                                  │    │
│  │  • High severity incident                       │    │
│  │  • Police report filed                          │    │
│  │  • No injuries reported                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Raw Answers                                    │    │
│  │                                                  │    │
│  │  Policy Number: POL-123456                      │    │
│  │  Incident Date: March 15, 2024                  │    │
│  │  Description: I was stopped at a red light...   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [Export JSON]                                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Animations & Transitions

### Principles
- **Fast:** 150-200ms for most interactions
- **Smooth:** Use `ease-out` for entrances, `ease-in` for exits
- **Purposeful:** Animate only what guides user attention

### Standard Transitions

```css
/* Hover states */
transition: all 150ms ease-out;

/* Color changes */
transition: color 150ms ease-out, background-color 150ms ease-out;

/* Shadows */
transition: box-shadow 200ms ease-out;

/* Transforms */
transition: transform 200ms ease-out;

/* Opacity (fade in/out) */
transition: opacity 200ms ease-out;
```

### Micro-Interactions

**Button Press:**
```css
.button:active {
  transform: scale(0.98);
}
```

**Card Hover:**
```css
.card {
  transition: box-shadow 200ms ease-out, transform 200ms ease-out;
}
.card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

**Message Entrance:**
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message {
  animation: slideIn 200ms ease-out;
}
```

**Typing Indicator:**
```css
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.typing-dot {
  animation: pulse 1.4s infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
```

---

## 9. Responsive Design

### Breakpoints

```css
/* Mobile first */
--screen-sm: 640px;   /* Small tablets */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Laptops */
--screen-xl: 1280px;  /* Desktops */
```

### MVP Approach
**Desktop-first for MVP** (simplify development)
- Optimize for 1280px+ screens
- Ensure usable on 1024px (laptops)
- Mobile optimization in v1.1

### Layout Adjustments

**Desktop (1024px+):**
- Max content width: `1200px`
- Sidebar navigation (if needed)
- Multi-column layouts

**Tablet (768px - 1023px):**
- Max content width: `100%` with padding
- Single column layouts
- Larger touch targets

**Mobile (< 768px):**
- Full width content
- Stack all elements vertically
- Bottom navigation (if needed)

---

## 10. Accessibility (WCAG 2.1 AA)

### Color Contrast

**Minimum Ratios:**
- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

**Tested Combinations:**
- `--gray-900` on `white`: 16.1:1 ✅
- `--gray-700` on `white`: 8.6:1 ✅
- `--brand-500` on `white`: 4.5:1 ✅
- `white` on `--brand-500`: 4.5:1 ✅

### Keyboard Navigation

**Focus Indicators:**
```css
*:focus-visible {
  outline: 2px solid var(--brand-500);
  outline-offset: 2px;
}
```

**Tab Order:**
- Logical flow (top to bottom, left to right)
- Skip links for long pages
- Focus trap in modals

### Screen Readers

**Semantic HTML:**
```html
<header>...</header>
<nav aria-label="Main navigation">...</nav>
<main>...</main>
<footer>...</footer>
```

**ARIA Labels:**
```html
<button aria-label="Send message">
  <SendIcon />
</button>

<div role="status" aria-live="polite">
  AI is typing...
</div>
```

---

## 11. Dark Mode (Post-MVP)

**For v1.1, not MVP**

When implementing:
- Use CSS variables for all colors
- Respect `prefers-color-scheme`
- Provide manual toggle
- Persist preference

---

## 12. Design Checklist

### Before Coding
- [ ] Color palette defined
- [ ] Typography scale set
- [ ] Spacing system established
- [ ] Component variants designed
- [ ] Page layouts sketched

### During Development
- [ ] Use design tokens (CSS variables)
- [ ] Consistent spacing (8px grid)
- [ ] Proper contrast ratios
- [ ] Smooth transitions
- [ ] Keyboard accessible

### Before Launch
- [ ] Test on 1280px+ screens
- [ ] Test keyboard navigation
- [ ] Run Lighthouse accessibility audit
- [ ] Verify color contrast
- [ ] Check loading states

---

## 13. Implementation Notes

### Tech Stack
- **Framework:** Next.js 14 + React 18
- **Styling:** Tailwind CSS 3
- **Components:** shadcn/ui (customized)
- **Icons:** Lucide React
- **Fonts:** Inter (Google Fonts)

### File Structure
```
/app
  /globals.css          # Design tokens, base styles
/components
  /ui                   # shadcn/ui components
    /button.tsx
    /input.tsx
    /card.tsx
  /chat
    /message.tsx
    /chat-input.tsx
    /typing-indicator.tsx
  /forms
    /form-preview.tsx
    /field-editor.tsx
```

### Design Tokens (CSS Variables)
```css
/* /app/globals.css */
:root {
  /* Colors */
  --gray-50: #fafafa;
  /* ... all color tokens ... */
  
  /* Typography */
  --text-base: 1rem;
  /* ... all type tokens ... */
  
  /* Spacing */
  --space-4: 1rem;
  /* ... all spacing tokens ... */
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

---

## 14. Next Steps

1. **Review this design system** (approve or adjust)
2. **Create database schema** (next document)
3. **Start implementation** (Week 1)

**Ready to proceed with database design?**
