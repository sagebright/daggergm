# Generate PRP for DaggerGM

## Feature file: $ARGUMENTS

Generate a comprehensive PRP for DaggerGM feature implementation focused on AI-driven adventure generation. This is a greenfield project requiring careful architectural decisions and LLM integration patterns.

## 🔍 Research Process

### 1. **Architecture Analysis**

- Research Next.js 14+ App Router patterns
- Supabase RLS best practices for multi-tenant apps
- Vector search implementation with pgvector
- LLM streaming vs batch generation patterns
- React Server Components vs Client Components

### 2. **External Research Required**

- Supabase Auth + RLS documentation
- pgvector similarity search algorithms
- OpenAI function calling for structured output
- MCP (Model Context Protocol) server specs
- Markdown export libraries for React
- TurboTax-style form UX patterns

### 3. **DaggerGM Specific Context**

- Daggerheart TTRPG rules structure
- Adventure module conventions
- Stat block formatting standards
- GM preparation workflows
- One-shot vs campaign differences

## 🎯 PRP Generation Guidelines

### Critical Context for AI Agent

```yaml
Project Type: Greenfield SaaS application
Stack: Next.js 14 + Supabase + OpenAI
Domain: TTRPG adventure generation
Users: Game Masters (technical and non-technical)
Constraints:
  - LLM-agnostic architecture required
  - RLS mandatory on all data
  - Mobile-first responsive design
  - Export must work offline
```

### Architecture Decisions to Document

1. **State Management Pattern**
   - Client state (Zustand/Redux/Context)
   - Server state (React Query/SWR)
   - Form state (React Hook Form/Formik)

2. **API Design**
   - tRPC vs GraphQL vs REST
   - Real-time updates (WebSockets/SSE)
   - File upload strategy

3. **LLM Integration**
   - Streaming vs polling
   - Context window management
   - Fallback strategies
   - Cost optimization

4. **Testing Strategy**
   - Unit tests (Vitest)
   - Integration tests (Playwright)
   - LLM mock strategies
   - RLS testing approach

### Implementation Blueprint Structure

```
1. Project Setup
   - Next.js with TypeScript
   - Supabase project creation
   - Environment configuration
   - Git repository setup

2. Database Schema
   - User profiles with RLS
   - Adventures table design
   - Vector content storage
   - Migration strategy

3. Authentication Flow
   - Supabase Auth setup
   - Protected routes
   - Session management
   - RLS policies

4. Core Features (in order)
   - Guided question flow
   - Adventure scaffold generation
   - Lock/revise mechanism
   - Content expansion
   - Export functionality

5. LLM Integration
   - Provider abstraction
   - Prompt templates
   - Error handling
   - Rate limiting

6. Premium Features
   - Subscription management
   - MCP server setup
   - Usage tracking
```

### Validation Gates for DaggerGM

```bash
# Development checks
npm run type-check          # TypeScript validation
npm run lint                # ESLint + Prettier
npm run test                # Unit tests
npm run test:integration    # Playwright tests

# Supabase checks
npm run db:types            # Generate types
npm run db:test             # Test RLS policies

# Build validation
npm run build               # Next.js production build
npm run analyze             # Bundle size check

# Security validation
npm audit                   # Dependency vulnerabilities
npm run test:security       # OWASP checks
```

## 📊 PRP Quality Metrics for DaggerGM

### Success Criteria

```
TECHNICAL REQUIREMENTS:
□ All database operations use RLS (100%)
□ LLM responses < 10 seconds (95th percentile)
□ Mobile responsive (all breakpoints)
□ Export works offline
□ Zero runtime type errors

USER EXPERIENCE:
□ First adventure < 10 minutes
□ Scaffold satisfaction > 80%
□ Export success rate > 95%
□ Error recovery graceful

ARCHITECTURE:
□ LLM provider swappable
□ State management consistent
□ Testing strategy comprehensive
□ Performance optimized
□ Security hardened
```

### DaggerGM-Specific Considerations

```
DOMAIN KNOWLEDGE:
□ Adventure structure correct
□ Stat blocks properly formatted
□ Encounters balanced
□ GM notes helpful
□ Export formatting clean

INTEGRATION POINTS:
□ Supabase Auth working
□ Vector search accurate
□ LLM context managed
□ Export formats valid
□ MCP server compatible
```

## 🚨 Critical Implementation Order

1. **Foundation** (Do NOT skip)
   - Supabase project with RLS
   - Next.js app with TypeScript
   - Basic auth flow
   - Database schema

2. **Core Loop** (MVP)
   - Question flow UI
   - Scaffold generation
   - Lock/revise mechanism
   - Basic export

3. **Enhancement** (Polish)
   - Full content expansion
   - Markdown formatting
   - Error handling
   - Mobile optimization

4. **Premium** (Monetization)
   - Subscription setup
   - MCP integration
   - Usage limits
   - Analytics

## 📋 Research URLs to Include in PRP

```yaml
Essential Documentation:
  - https://nextjs.org/docs/app
  - https://supabase.com/docs/guides/auth/row-level-security
  - https://github.com/pgvector/pgvector
  - https://platform.openai.com/docs/guides/structured-outputs
  - https://github.com/modelcontextprotocol/servers

UI/UX References:
  - https://turbotax.intuit.com (form flow)
  - https://www.typeform.com (question UX)
  - https://github.com/tailwindlabs/headlessui
  - https://www.radix-ui.com/primitives

Testing Resources:
  - https://vitest.dev/guide/
  - https://playwright.dev/docs/test-components
  - https://github.com/supabase/supabase-js/tree/master/test
```

## 🎯 Final PRP Checklist

Before saving the PRP, ensure:

- [ ] All architectural decisions documented
- [ ] Implementation order crystal clear
- [ ] Validation gates executable
- [ ] External documentation linked
- [ ] Error scenarios covered
- [ ] Performance targets defined
- [ ] Security measures specified
- [ ] Testing strategy complete
- [ ] Rollback procedures included
- [ ] Success metrics measurable

**Target Confidence**: 9/10 for greenfield implementation
**Save as**: `PRPs/daggergm_{feature-name}.md`

Remember: DaggerGM is a greenfield project. Every architectural decision impacts the entire system. Document thoroughly!
