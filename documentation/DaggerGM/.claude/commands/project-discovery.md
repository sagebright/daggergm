# Project Discovery Interview

**Purpose**: Conduct structured interview to capture project requirements for infrastructure generation.

**Deliverable**: `project-interview.json` with complete answers

**Next Steps After This Command**:

1. Review/edit `project-interview.json`
2. Run `/generate-infrastructure-plan`
3. Run `/generate-project-configs`
4. Run `/generate-project-docs`

---

## Interview Questions

I'll ask you questions in 6 categories. Please answer concisely but thoroughly.

---

### Category 1: Project Basics (5 questions)

**Q1: What's the project name?**
(Example: "DaggerGM", "ShopifyClone", "AnalyticsDashboard")

**Q2: One-sentence description of what it does?**
(Example: "AI-powered adventure generator for Daggerheart TTRPG")

**Q3: Who are the target users?**
(Example: "Game Masters", "E-commerce sellers", "Data analysts")

**Q4: What's the core value proposition?**
(Example: "Frame-aware adventure generation with Focus Mode editing")

**Q5: What's the business model?**
(Example: "One-time credit purchases", "Monthly subscription", "Free with ads")

---

### Category 2: Team Experience (6 questions)

**Q6: Have you used Next.js before?**

- [ ] No, never
- [ ] Yes, Pages Router (Next.js 12 or earlier)
- [ ] Yes, App Router (Next.js 13-15)

**Q7: Have you used TypeScript before?**

- [ ] No, never
- [ ] Yes, but not strict mode
- [ ] Yes, with strict mode

**Q8: What backend frameworks do you know?**
(Check all that apply)

- [ ] Express.js
- [ ] Fastify
- [ ] NestJS
- [ ] Hono
- [ ] Next.js Server Actions
- [ ] Other: **\_\_\_**

**Q9: What databases have you used?**
(Check all that apply)

- [ ] PostgreSQL (raw SQL)
- [ ] PostgreSQL (Prisma/Drizzle)
- [ ] Supabase
- [ ] MongoDB
- [ ] MySQL
- [ ] Firebase
- [ ] Other: **\_\_\_**

**Q10: What state management libraries do you know?**
(Check all that apply)

- [ ] React Context API
- [ ] Redux
- [ ] Zustand
- [ ] Jotai
- [ ] Recoil
- [ ] MobX
- [ ] Other: **\_\_\_**

**Q11: What testing frameworks have you used?**
(Check all that apply)

- [ ] Jest
- [ ] Vitest
- [ ] Playwright
- [ ] Cypress
- [ ] Testing Library
- [ ] Other: **\_\_\_**

---

### Category 3: Domain & Features (6 questions)

**Q12: What industry/domain is this project in?**
(Example: "Gaming/TTRPG", "E-commerce", "SaaS", "Healthcare", "Finance")

**Q13: List 5-7 core features (one per line)**
Example:

- User authentication
- AI-powered content generation
- PDF export
- Real-time collaboration
- Payment processing

**Q14: Describe the data model (main entities and relationships)**
Example:

```
User → hasMany → Adventures
Adventure → hasMany → Movements
Movement → hasOne → CombatEncounter
```

**Q15: Any complex UX requirements?**
(Check all that apply)

- [ ] Real-time collaboration (like Google Docs)
- [ ] Complex animations/transitions
- [ ] Drag-and-drop interfaces
- [ ] Mobile-first with gestures
- [ ] Offline-first (PWA)
- [ ] Canvas/WebGL rendering
- [ ] Other: **\_\_\_**

**Q16: Any AI/ML integration?**
(Check all that apply)

- [ ] No AI features
- [ ] LLM text generation (OpenAI, Anthropic, etc.)
- [ ] Image generation (DALL-E, Midjourney, etc.)
- [ ] Speech-to-text / Text-to-speech
- [ ] Embeddings / Vector search
- [ ] Other: **\_\_\_**

**Q17: Any specialized content generation needs?**
(Example: "Adventures must respect narrative Frames", "Product descriptions need SEO optimization")

---

### Category 4: Architecture & Infrastructure (7 questions)

**Q18: Is this multi-tenant or single-tenant?**

- [ ] Single-tenant (one user/org per deployment)
- [ ] Multi-tenant (many users/orgs share infrastructure)

**Q19: Do you need guest/unauthenticated access?**

- [ ] No, all features require login
- [ ] Yes, limited features for guests
- [ ] Yes, full features with token-based access

**Q20: What authentication method?**

- [ ] Email/password
- [ ] Social OAuth (Google, GitHub, etc.)
- [ ] Magic link (passwordless)
- [ ] SSO/SAML (enterprise)
- [ ] Other: **\_\_\_**

**Q21: What authentication provider?**

- [ ] Supabase Auth
- [ ] Auth0
- [ ] Firebase Auth
- [ ] Clerk
- [ ] Custom (JWT tokens)
- [ ] Other: **\_\_\_**

**Q22: Any real-time requirements?**

- [ ] No real-time features
- [ ] Yes, real-time updates (WebSockets)
- [ ] Yes, but polling is acceptable

**Q23: What 3rd-party APIs will you integrate?**
(Example: "Stripe for payments", "OpenAI for generation", "Twilio for SMS")

**Q24: Any existing infrastructure to preserve?**

- [ ] No, starting from scratch
- [ ] Yes, existing database schema
- [ ] Yes, existing API contracts
- [ ] Yes, existing authentication system
- [ ] Other: **\_\_\_**

---

### Category 5: Constraints & Preferences (6 questions)

**Q25: What's the timeline?**

- [ ] 1-2 weeks (MVP)
- [ ] 1-2 months (Full product)
- [ ] 3-6 months (Complex system)
- [ ] Other: **\_\_\_**

**Q26: What test coverage target?**

- [ ] 80% (standard)
- [ ] 90% (high quality)
- [ ] 95% (very high quality)
- [ ] 99% (production-critical)

**Q27: What file size limit preference?**

- [ ] 500 lines (relaxed)
- [ ] 300 lines (strict)
- [ ] 200 lines (very strict)
- [ ] Other: **\_\_\_**

**Q28: What deployment target?**

- [ ] Vercel
- [ ] AWS (EC2, Lambda, etc.)
- [ ] Google Cloud
- [ ] Docker (self-hosted)
- [ ] Other: **\_\_\_**

**Q29: Any performance requirements?**
(Example: "Must load in <2s", "Support 10k concurrent users")

**Q30: Any compliance requirements?**
(Check all that apply)

- [ ] GDPR (EU data privacy)
- [ ] HIPAA (healthcare)
- [ ] SOC 2 (security)
- [ ] PCI DSS (payment data)
- [ ] Other: **\_\_\_**

---

### Category 6: Open-Ended (3 questions)

**Q31: What's the most complex/risky part of this project?**
(Example: "LLM hallucinations", "Real-time sync conflicts", "Payment processing")

**Q32: What similar projects exist that you admire?**
(Example: "Like Notion but for adventures", "Like Stripe Dashboard but for analytics")

**Q33: Any other context I should know?**
(Open-ended - anything else relevant)

---

## Post-Interview Processing

Once you've answered all questions, I will:

1. **Save answers** to `project-interview.json`
2. **Analyze** for missing information or contradictions
3. **Clarify** any ambiguities before proceeding
4. **Recommend** running `/generate-infrastructure-plan` next

---

## Example Output Format

After answering, I'll create this file:

```json
{
  "metadata": {
    "generated_at": "2025-10-18T10:30:00Z",
    "version": "1.0.0"
  },
  "project_basics": {
    "name": "YourProjectName",
    "description": "Your one-sentence description",
    "target_users": "Your target users",
    "value_proposition": "Core value prop",
    "business_model": "Business model"
  },
  "team_experience": {
    "nextjs": "none | pages-router | app-router",
    "typescript": "none | basic | strict",
    "backend_frameworks": ["express", "fastify"],
    "databases": ["postgresql", "supabase"],
    "state_management": ["zustand"],
    "testing": ["vitest", "playwright"]
  },
  "domain": {
    "industry": "Your industry",
    "core_features": ["Feature 1", "Feature 2"],
    "data_model": "User → hasMany → Adventures",
    "ux_requirements": ["real-time", "mobile-first"],
    "ai_integration": ["llm-generation"],
    "specialized_needs": "Your specialized needs"
  },
  "architecture": {
    "tenancy": "multi-tenant",
    "guest_access": true,
    "auth_method": "email-password",
    "auth_provider": "supabase",
    "realtime": false,
    "third_party_apis": ["stripe", "openai"],
    "existing_infrastructure": ["database-schema"]
  },
  "constraints": {
    "timeline": "1-2 months",
    "coverage_target": 99,
    "file_size_limit": 300,
    "deployment_target": "vercel",
    "performance_requirements": "Load in <2s",
    "compliance": ["gdpr"]
  },
  "open_ended": {
    "riskiest_part": "LLM hallucinations",
    "similar_projects": "Like Notion but for adventures",
    "other_context": "Any additional context"
  }
}
```

---

**Command Version**: 1.0.0
**Last Updated**: 2025-10-18
**Next Command**: `/generate-infrastructure-plan`
