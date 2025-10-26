# DaggerGM Documentation

**Last Updated**: 2025-10-24
**Organization**: v3.0 (consolidated to docs/)

---

## 🎯 **START HERE**

### **[SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)** ← **READ THIS FIRST**

Comprehensive high-level description of the entire system:

- What DaggerGM does (AI-powered Daggerheart adventure generator)
- Current tech stack (Next.js 15, React 19, Supabase, OpenAI GPT-4)
- Architecture decisions (Server Actions, RLS, credit-based model)
- Database schema, LLM integration, Focus Mode UX
- Testing strategy, deployment, performance targets
- **Use this to understand what the system SHOULD do**

---

## Product Requirements & Planning

### **[PRPs/](PRPs/)** - Product Requirements Documents

- **[daggergm_mvp_implementation.md](PRPs/daggergm_mvp_implementation.md)** (39KB)
  - Original comprehensive MVP implementation plan
  - Detailed database schema with SQL
  - RLS policies, security architecture
  - LLM integration patterns
  - **Note**: Tech stack slightly outdated (see SYSTEM_OVERVIEW for current stack)

- **[INITIAL_daggergm_REVISED.md](PRPs/INITIAL_daggergm_REVISED.md)** (10KB)
  - Initial feature overview with user journey
  - Guided question flow design
  - Core value proposition
  - Decision points and open questions

### **[FEATURES/](FEATURES/)** - Individual Feature Specifications

- **[FEATURE_credit_display.md](FEATURES/FEATURE_credit_display.md)** - Credit balance UI
- **[FEATURE_daggerheart_theme.md](FEATURES/FEATURE_daggerheart_theme.md)** - Brand/theme system
- **[FEATURE_dark_mode.md](FEATURES/FEATURE_dark_mode.md)** - Theme switching
- **[FEATURE_focus_mode.md](FEATURES/FEATURE_focus_mode.md)** - Core editor UX

---

## Architecture & Design Decisions

### **[architecture/](architecture/)** - Technical Architecture Docs

- **[STATE_MANAGEMENT_DECISION.md](architecture/STATE_MANAGEMENT_DECISION.md)** - Why Zustand for Focus Mode
- **[TESTING_STRATEGY.md](architecture/TESTING_STRATEGY.md)** - 80/15/5 distribution (integration/E2E/unit)
- **[GUEST_SYSTEM.md](architecture/GUEST_SYSTEM.md)** - Guest token implementation
- **[SERVER_STATE.md](architecture/SERVER_STATE.md)** - React Query patterns

---

## Operations & Setup

### **[ops/](ops/)** - Operational Documentation

- **[GITHUB_ACTIONS.md](ops/GITHUB_ACTIONS.md)** - CI/CD pipeline
- **[SECRETS_SETUP.md](ops/SECRETS_SETUP.md)** - GitHub secrets configuration

---

## Historical Documentation

### **[archive/](archive/)** - Completed Setup Phases

See [archive/README.md](archive/README.md) for full index

---

## Quick Reference

### For Understanding the Product

1. **[SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)** - Complete system description ⭐
2. **[PRPs/daggergm_mvp_implementation.md](PRPs/daggergm_mvp_implementation.md)** - Detailed implementation plan
3. **[PRPs/INITIAL_daggergm_REVISED.md](PRPs/INITIAL_daggergm_REVISED.md)** - User journey & value prop

### For Development

1. **[/CLAUDE.md](../CLAUDE.md)** - Main AI assistant development guide
2. **[/.claude/commands/](../.claude/commands/)** - Executable workflow commands
3. **[/.claude/skills/](../.claude/skills/)** - Auto-applied development patterns

---

**Version**: 3.0
**All documentation now in docs/ (documentation/ folder removed)**
