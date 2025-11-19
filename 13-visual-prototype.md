# Visual Prototype Specification

**Version:** 1.0  
**Last Updated:** 2025-11-18  
**Status:** Draft

---

## Overview

This document provides detailed visual specifications for the IoZen MVP interface. Since image generation is unavailable, this serves as a comprehensive text-based prototype that developers and designers can use to build the actual UI.

---

## Screen 1: Chatflow Creation

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  IoZen                                    [User Menu ▼]      │ ← Header (60px height)
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    (centered, max-width: 600px)             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │  Create New Chatflow                                │    │ ← Heading (36px, semibold)
│  │                                                      │    │
│  │  Describe your chatflow in plain English:          │    │ ← Label (14px)
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │ Create an insurance claim chatflow with...  │  │    │ ← Textarea (120px height)
│  │  │                                              │  │    │
│  │  │                                              │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                                                      │    │
│  │  Example: "Create an insurance claim chatflow      │    │ ← Helper text (12px, gray)
│  │  with policy number, incident date, description"   │    │
│  │                                                      │    │
│  │                    [Generate Chatflow]              │    │ ← Button (blue, 48px height)
│  │                                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Specifications

**Colors:**
- Background: `#ffffff` (white)
- Card background: `#ffffff` (white)
- Card border: `#e5e5e5` (light gray)
- Heading text: `#171717` (almost black)
- Label text: `#525252` (medium gray)
- Helper text: `#a3a3a3` (light gray)
- Button background: `#3b82f6` (blue)
- Button text: `#ffffff` (white)
- Button hover: `#2563eb` (darker blue)

**Typography:**
- Heading: Inter, 36px, 600 weight, 1.2 line-height
- Label: Inter, 14px, 500 weight, 1.5 line-height
- Textarea: Inter, 16px, 400 weight, 1.5 line-height
- Helper text: Inter, 12px, 400 weight, 1.5 line-height
- Button: Inter, 16px, 500 weight

**Spacing:**
- Page padding: 32px
- Card padding: 48px
- Gap between elements: 24px
- Card border-radius: 12px
- Button border-radius: 8px

**Interactions:**
- Textarea focus: Blue ring (2px, `#3b82f6`)
- Button hover: Background darkens to `#2563eb`
- Button active: Scale to 98%

---

## Screen 2: Chatflow Preview

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  IoZen                                    [User Menu ▼]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    (centered, max-width: 700px)             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │  Generated Chatflow Preview                         │    │ ← Heading
│  │                                                      │    │
│  │  ┌────────────────────────────────────────────┐    │    │
│  │  │  ☐ Policy Number                           │    │    │ ← Field item
│  │  │     text • required                         │    │    │
│  │  ├────────────────────────────────────────────┤    │    │
│  │  │  ☐ Incident Date                           │    │    │
│  │  │     date • required                         │    │    │
│  │  ├────────────────────────────────────────────┤    │    │
│  │  │  ☐ Description                             │    │    │
│  │  │     text • optional                         │    │    │
│  │  └────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │                                                      │    │
│  │  [Edit]                         [Publish Chatflow]  │    │ ← Buttons
│  │                                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Specifications

**Field Items:**
- Background: `#fafafa` (very light gray)
- Border: `#e5e5e5`
- Border-radius: 8px
- Padding: 16px
- Gap between items: 1px (creates divider effect)

**Field Typography:**
- Field name: Inter, 16px, 500 weight, `#171717`
- Field metadata: Inter, 14px, 400 weight, `#737373`

**Buttons:**
- Edit button (ghost): Border `#e5e5e5`, text `#525252`, hover bg `#f5f5f5`
- Publish button (primary): Background `#3b82f6`, text white

**Checkbox:**
- Size: 20px × 20px
- Border: 2px, `#d4d4d4`
- Border-radius: 4px
- Checked: Background `#3b82f6`, white checkmark

---

## Screen 3: Chatflow Conversation (User Filling)

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Insurance Claim Chatflow                                    │ ← Header (minimal)
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    (centered, max-width: 800px)             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Progress: 3 of 10 questions                        │    │ ← Progress header
│  │  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │ ← Progress bar (30%)
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │  ┌──┐                                               │    │
│  │  │AI│  What is your policy number?                  │    │ ← AI message
│  │  └──┘  Just now                                      │    │
│  │                                                      │    │
│  │                                                      │    │
│  │                      ┌──┐                           │    │
│  │         POL-123456789│JD│                           │    │ ← User message
│  │                2:34 PM└──┘                           │    │
│  │                                                      │    │
│  │                                                      │    │
│  │  ┌──┐                                               │    │
│  │  │AI│  Thank you. When did the incident occur?      │    │ ← AI message
│  │  └──┘  2:34 PM                                       │    │
│  │                                                      │    │
│  │                                                      │    │
│  │  ┌──┐                                               │    │
│  │  │AI│  ● ● ●                                        │    │ ← Typing indicator
│  │  └──┘                                                │    │
│  │                                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │ Type your answer...                   [Send] │          │ ← Input (sticky bottom)
│  └──────────────────────────────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Specifications

**Progress Bar:**
- Height: 8px
- Background: `#e5e5e5`
- Fill: `#3b82f6`
- Border-radius: 4px
- Smooth transition: 300ms

**AI Message Bubble:**
- Background: `#f5f5f5` (light gray)
- Text color: `#171717`
- Border-radius: 16px (rounded-tl-none for first message)
- Padding: 12px 16px
- Max-width: 70%
- Avatar: 32px circle, `#dbeafe` background, blue icon

**User Message Bubble:**
- Background: `#3b82f6` (blue)
- Text color: `#ffffff` (white)
- Border-radius: 16px (rounded-tr-none)
- Padding: 12px 16px
- Max-width: 70%
- Aligned right
- Avatar: 32px circle, `#d4d4d4` background, initials

**Timestamp:**
- Font: Inter, 12px, `#a3a3a3`
- Margin-top: 4px

**Typing Indicator:**
- Three dots (●), 6px each
- Color: `#a3a3a3`
- Pulse animation: 1.4s infinite
- Stagger delay: 0.2s between dots

**Input Field:**
- Background: `#ffffff`
- Border: 1px `#e5e5e5`
- Border-radius: 24px
- Padding: 12px 16px
- Font: Inter, 16px
- Focus: Blue ring

**Send Button:**
- Background: `#3b82f6`
- Size: 40px × 40px
- Border-radius: 20px (circle)
- Icon: White arrow

---

## Screen 4: Submission Results (Admin View)

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Submissions                                       │ ← Back link
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    (centered, max-width: 900px)             │
│                                                              │
│  Submission by John Doe                                      │ ← Page heading
│  Submitted 2 hours ago                                       │ ← Timestamp
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  AI Summary                                         │    │ ← Card 1
│  │                                                      │    │
│  │  John Doe filed a claim for a car accident on      │    │
│  │  March 15, 2024. Policy POL-123456. Incident       │    │
│  │  involved rear-end collision.                       │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Key Insights                                       │    │ ← Card 2
│  │                                                      │    │
│  │  • High severity incident                           │    │
│  │  • Police report filed                              │    │
│  │  • No injuries reported                             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Raw Answers                                        │    │ ← Card 3
│  │                                                      │    │
│  │  Policy Number: POL-123456                          │    │
│  │  Incident Date: March 15, 2024                      │    │
│  │  Description: I was stopped at a red light when... │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Export JSON]                                               │ ← Action button
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Specifications

**Page Heading:**
- Font: Inter, 30px, 600 weight, `#171717`
- Timestamp: Inter, 14px, 400 weight, `#737373`

**Cards:**
- Background: `#ffffff`
- Border: 1px `#e5e5e5`
- Border-radius: 12px
- Padding: 24px
- Gap between cards: 16px
- Shadow: `0 1px 3px rgba(0,0,0,0.1)`

**Card Headings:**
- Font: Inter, 18px, 600 weight, `#171717`
- Margin-bottom: 12px

**Card Content:**
- Font: Inter, 15px, 400 weight, `#404040`
- Line-height: 1.6

**Bullet Points:**
- Color: `#3b82f6` (blue)
- Spacing: 8px between items

**Data Labels (Raw Answers):**
- Font: Inter, 14px, 600 weight, `#525252`
- Followed by colon

**Export Button:**
- Style: Ghost (outlined)
- Border: 1px `#e5e5e5`
- Text: `#525252`
- Hover: Background `#f5f5f5`

---

## Design Tokens Summary

### Color Palette
```css
--white: #ffffff;
--gray-50: #fafafa;
--gray-100: #f5f5f5;
--gray-200: #e5e5e5;
--gray-300: #d4d4d4;
--gray-400: #a3a3a3;
--gray-500: #737373;
--gray-600: #525252;
--gray-700: #404040;
--gray-900: #171717;
--brand-blue: #3b82f6;
--brand-blue-hover: #2563eb;
--brand-blue-light: #dbeafe;
```

### Typography Scale
```css
--text-xs: 12px;
--text-sm: 14px;
--text-base: 15px;
--text-md: 16px;
--text-lg: 18px;
--text-xl: 24px;
--text-2xl: 30px;
--text-3xl: 36px;
```

### Spacing Scale
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
```

### Border Radius
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

---

## Responsive Behavior (MVP: Desktop-First)

**Desktop (1024px+):**
- All layouts as shown above
- Max content widths enforced
- Generous spacing

**Tablet (768px - 1023px):**
- Reduce max-widths by 20%
- Reduce padding by 25%
- Maintain all functionality

**Mobile (< 768px) - Post-MVP:**
- Stack all elements vertically
- Full-width cards
- Larger touch targets (48px minimum)
- Bottom-fixed input on conversation screen

---

## Animation Specifications

**Page Transitions:**
- Fade in: 200ms ease-out
- Slide up: 200ms ease-out, translateY(10px) → 0

**Button Interactions:**
- Hover: 150ms ease-out
- Active: Scale 0.98, 100ms ease-out

**Message Entrance:**
- Slide up + fade in: 200ms ease-out
- Stagger delay: 100ms between messages

**Typing Indicator:**
- Pulse: 1.4s infinite ease-in-out
- Dot 1: 0ms delay
- Dot 2: 200ms delay
- Dot 3: 400ms delay

**Progress Bar:**
- Width transition: 300ms ease-out

---

## Implementation Notes

### Tech Stack
- **Framework:** Next.js 14 + React 18
- **Styling:** Tailwind CSS 3 (with custom config for design tokens)
- **Components:** shadcn/ui (Button, Input, Card, etc.)
- **Icons:** Lucide React
- **Font:** Inter (Google Fonts)

### Component Hierarchy
```
/components
  /ui
    /button.tsx
    /input.tsx
    /card.tsx
    /progress.tsx
  /chatflow
    /chatflow-creator.tsx
    /chatflow-preview.tsx
    /field-editor.tsx
  /chat
    /chat-container.tsx
    /message-bubble.tsx
    /typing-indicator.tsx
    /chat-input.tsx
  /submissions
    /submission-card.tsx
    /insight-list.tsx
```

---

## Next Steps

1. ✅ Review this visual specification
2. 🎨 Build actual UI components (Day 1-2)
3. 🔗 Connect to backend (Day 3-4)
4. 🚀 Deploy and test (Day 5)

**Ready to start implementation?**
