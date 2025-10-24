# DaggerGM - AI-Powered Daggerheart Adventure Generator

DaggerGM is a SaaS platform that revolutionizes TTRPG adventure preparation through AI-guided generation with Frame-aware content creation and semantic search capabilities. Built on Next.js 14 with Server Actions, Supabase, and GPT-4, the platform enables Game Masters to generate, refine, and export complete one-shot adventures in under 10 minutes.

## 🚀 Getting Started

[![CI](https://github.com/sagebright/daggergm/actions/workflows/ci.yml/badge.svg)](https://github.com/sagebright/daggergm/actions/workflows/ci.yml)
[![Docker CI](https://github.com/sagebright/daggergm/actions/workflows/docker-ci.yml/badge.svg)](https://github.com/sagebright/daggergm/actions/workflows/docker-ci.yml)

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- Stripe account (for payments)

### Environment Setup

1. Copy `.env.local.example` to `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your credentials:
   - Supabase project URL and keys
   - OpenAI API key
   - Stripe keys (optional for MVP testing)

### Database Setup

1. Create a new Supabase project

2. Run the database migrations:

   ```bash
   # In Supabase SQL editor, run the migrations in order:
   # 1. supabase/migrations/00001_initial_schema.sql
   # 2. supabase/migrations/00002_rls_policies.sql
   ```

3. Generate TypeScript types:
   ```bash
   SUPABASE_PROJECT_ID=your-project-id npm run db:types
   ```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
daggergm/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth routes (login, signup)
│   ├── (dashboard)/       # Protected routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn)
│   └── features/         # Feature-specific components
├── lib/                   # Core utilities
│   ├── supabase/         # Supabase client
│   ├── llm/              # LLM abstraction
│   ├── auth/             # Auth utilities
│   └── validation/       # Zod schemas
├── types/                 # TypeScript types
├── supabase/             # Database migrations
└── __tests__/            # Test files
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests (requires running dev server)
npx playwright test
```

## 🔒 Security

- All database tables have Row Level Security (RLS) enabled
- Server Actions are validated with Zod schemas
- Guest sessions use secure tokens
- API rate limiting is implemented (optional with Redis)

## 🚀 Deployment

The application is designed to deploy on Vercel with Supabase Cloud.

### Production Checklist

- [ ] Set all environment variables in Vercel
- [ ] Run database migrations in production
- [ ] Configure Stripe webhooks
- [ ] Enable Supabase email authentication
- [ ] Set up monitoring (Vercel Analytics)

## 📝 Development Workflow

1. **Feature Development**
   - Create feature branch from `main`
   - Implement with proper TypeScript types
   - Add tests for new functionality
   - Ensure RLS policies are tested

2. **Code Quality**
   - Pre-commit hooks run linting and formatting
   - All Server Actions must have Zod validation
   - Components should be properly typed

3. **Database Changes**
   - Create numbered migration files
   - Test RLS policies thoroughly
   - Update TypeScript types after schema changes

## 🤝 Contributing

Please see the contributing guidelines in the PRP document for detailed information on:

- Architecture decisions
- Code standards
- Testing requirements
- Security considerations

## 📄 License

Copyright (c) 2025 DaggerGM. All rights reserved.

<!-- Deployment trigger: 2025-09-10 13:00 -->

# CI Test Trigger
