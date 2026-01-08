# FIX-001: Resolve Supabase JS Client Fetch Failures in Node.js Scripts

**Command**: Manual investigation
**Status**: Not Started
**Priority**: P2-Medium (Non-blocking)
**Estimated Time**: 2-3 hours

---

## Quick Start

```bash
# This is an investigation task, not directly executable
# Follow investigation steps below to diagnose and fix
```

---

## Problem Statement

Scripts using `@supabase/supabase-js` fail with "TypeError: fetch failed" when run via tsx/Node.js. This affects content seeding and embeddings generation.

**Error Message**:

```
TypeError: fetch failed
```

**Affected Scripts**:

- `scripts/seed-adversaries-mvp.ts` (0/129 adversaries seeded)
- `scripts/generate-embeddings.ts` (0/618 embeddings generated)
- All seeders when run via `npm run seed:daggerheart`

**Current State**:

- ✅ Direct SQL via Supabase MCP tools works perfectly
- ✅ Database has correct credentials in `.env.test.local`
- ✅ Same credentials work in Vitest integration tests
- ❌ Issue only occurs in standalone Node.js/tsx scripts

---

## Impact

**Current Workaround**: Use Supabase MCP tools or integration tests for database operations

**Missing Content**:

- 0/129 adversaries (not seeded)
- 0/618 embeddings (not generated)
- Total: 81% content database populated (618/760)

**Business Impact**: LOW

- Core functionality (manual queries) works fine
- Embeddings are a Phase 4 enhancement (semantic search)
- Can be addressed after MVP launch

---

## Investigation Steps

### Step 1: Isolate the Issue (30 min)

1. **Test with different Node.js versions**:

   ```bash
   nvm use 20
   npm run seed:adversaries
   nvm use 22
   npm run seed:adversaries
   ```

2. **Test with native fetch vs undici**:

   ```bash
   # Add to script
   import fetch from 'undici'
   # Or try node-fetch
   npm install node-fetch@2
   ```

3. **Check SSL/TLS certificates**:
   ```bash
   NODE_TLS_REJECT_UNAUTHORIZED=0 npm run seed:adversaries
   # If this works, it's a certificate issue
   ```

### Step 2: Try Alternative Supabase Client Config (30 min)

```typescript
// Try different client configurations
const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
  },
  global: {
    fetch: fetch, // Explicitly pass fetch
  },
})
```

### Step 3: Use Supabase Admin Client (30 min)

```typescript
// Instead of regular client, try admin client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
```

### Step 4: Generate Embeddings via Edge Function (1 hour)

Alternative approach if fetch issue persists:

1. Create Supabase Edge Function for embeddings:

   ```bash
   supabase functions new generate-embeddings
   ```

2. Call Edge Function from script:
   ```typescript
   // Script just triggers Edge Function
   const { data } = await supabase.functions.invoke('generate-embeddings')
   ```

---

## Acceptance Criteria

- [ ] Root cause identified (Node.js version, SSL, fetch implementation, etc.)
- [ ] Solution implemented and documented
- [ ] 129 adversaries successfully seeded
- [ ] 618 embeddings successfully generated
- [ ] Content database at 100% (760/760)
- [ ] Scripts run reliably in CI/CD

---

## Alternative Solutions

### Option A: Use Supabase MCP Tools (Quick)

- Manually seed via MCP commands
- Skip embeddings for MVP (Phase 4 feature)
- **Time**: 1 hour
- **Pros**: Immediate fix
- **Cons**: Manual process, not automated

### Option B: Migrate to Integration Tests (Medium)

- Convert seed scripts to integration tests
- Run via Vitest (which works)
- **Time**: 2 hours
- **Pros**: Uses working infrastructure
- **Cons**: Hacky, not ideal architecture

### Option C: Fix Fetch Issue (Ideal)

- Debug and fix root cause
- **Time**: 2-3 hours (uncertain)
- **Pros**: Proper fix, reusable solution
- **Cons**: Unknown complexity

---

## Definition of Done

- [ ] 129 adversaries seeded successfully
- [ ] 618 embeddings generated successfully
- [ ] Seed scripts run without errors
- [ ] Root cause documented in this file
- [ ] Solution documented for future reference
- [ ] CI/CD can run seeders (if needed)

---

## Related Documentation

- **Known Issues**: [docs/KNOWN_ISSUES.md](../KNOWN_ISSUES.md)
- **Supabase JS Docs**: https://supabase.com/docs/reference/javascript
- **Node.js Fetch**: https://nodejs.org/api/globals.html#fetch

---

**Created**: 2025-11-07 (from KNOWN_ISSUES.md)
**Priority**: P2 (can be deferred post-MVP)
**Impact**: Low (workarounds available)
