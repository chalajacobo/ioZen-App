# Frontend Development Guidelines

## Design System & Aesthetics
- **Visual Style**: Premium, modern, "v0-inspired".
- **Core Elements**:
  - **Glassmorphism**: Use `backdrop-blur-xl`, `bg-card/50`, and subtle borders (`border-white/10` or `border-border/50`) for cards and panels.
  - **Gradients**: Use subtle background gradients and mesh gradients to add depth. Avoid flat, solid backgrounds for main containers.
  - **Typography**: Use standard Tailwind font utilities. Headings should be `tracking-tight`.
  - **Colors**: Rely on `globals.css` variables (`bg-background`, `text-foreground`, `text-muted-foreground`). Avoid hardcoded hex values.
  - **Animations**: Use `framer-motion` for complex animations or Tailwind `animate-in` / `animate-out` utilities for simple transitions.

## Component Usage
- **Library**: Use `shadcn/ui` components located in `@/components/ui`.
- **Modification**: Do not modify `shadcn/ui` components unless absolutely necessary. Extend them via composition or `className` overrides.
- **Icons**: Use `lucide-react` for icons.

## Layout & Structure
- **Page Layouts**: Use standard Next.js layouts.
- **Spacing**: Use standard Tailwind spacing (e.g., `p-6`, `gap-4`).
- **Responsiveness**: Ensure all designs work on mobile (`sm:` breakpoints).

## Code Style
- **Imports**: Group imports: React/Next.js -> External Libs -> Internal Components -> Utils/Types.
- **Client vs Server**: Use `'use client'` only when interactivity (state, hooks) is required. Default to Server Components.
- **Data Fetching**: Use Server Actions or Supabase Server Client for data fetching in Server Components.

## Reference Files
- **Auth Pages**: `src/app/(public)/login/page.tsx` (Good example of premium design).
- **Card Component**: `src/components/ui/card.tsx` (Standard implementation).
