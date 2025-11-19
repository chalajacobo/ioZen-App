# IoZen MVP

AI-powered chatflows that replace traditional forms.

## Tech Stack

- **Framework:** Next.js 16 + React 19
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma 6
- **AI:** Anthropic Claude
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20.19.5
- pnpm 10.22.0
- Supabase account
- Anthropic API key

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Anthropic
ANTHROPIC_API_KEY="sk-ant-..."
```

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run database migrations (after setting up Supabase)
pnpm prisma migrate dev

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
app/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── chatflow/    # Chatflow-specific components
│   │   └── chat/        # Chat interface components
│   ├── lib/             # Utilities and configurations
│   │   ├── supabase.ts  # Supabase client
│   │   ├── anthropic.ts # Claude client
│   │   └── utils.ts     # Helper functions
│   └── types/           # TypeScript types
├── prisma/
│   └── schema.prisma    # Database schema
└── public/              # Static assets
```

## Development

```bash
# Run development server
pnpm dev

# Run type checking
pnpm tsc --noEmit

# Run linting
pnpm lint

# Format code
pnpm format
```

## Deployment

```bash
# Deploy to Vercel
vercel --prod
```

## Documentation

See the `/docs` folder in the parent directory for detailed documentation:

- `10-mvp-scope-definition.md` - MVP scope and timeline
- `11-database-schema.md` - Database design
- `12-ux-design-system.md` - Design system
- `13-visual-prototype.md` - UI specifications
