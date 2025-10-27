# Known Issues - DaggerGM

## Supabase JS Client Fetch Failures in Node.js Scripts

**Issue**: Scripts using `@supabase/supabase-js` fail with "TypeError: fetch failed" when run via tsx/Node.js

**Affected Scripts**:

- `scripts/seed-adversaries-mvp.ts` (0/129 adversaries seeded)
- `scripts/generate-embeddings.ts` (0/618 embeddings generated)
- All seeders when run via `npm run seed:daggerheart`

**Error Message**:

```
TypeError: fetch failed
```

**Verification**:

- Direct SQL via Supabase MCP tools works perfectly ✅
- Database has correct credentials in `.env.test.local` ✅
- Same credentials work in Vitest integration tests ✅
- Issue only occurs in standalone Node.js/tsx scripts ❌

**Root Cause**: Unknown - potentially:

1. Node.js v22 fetch implementation incompatibility
2. SSL/TLS certificate issues with remote Supabase
3. Network configuration issue
4. Supabase JS client configuration issue

**Current Workaround**:

- Use Supabase MCP tools for database operations
- Run seeders directly via test files instead of standalone scripts
- Embeddings generation can be done via Edge Functions or alternative approach

**Data Status** (as of 2025-10-26):

- ✅ 618/760 entries seeded successfully (Phases 1-3)
  - 192 weapons
  - 9 classes
  - 34 armor
  - 189 abilities
  - 60 items
  - 60 consumables
  - 18 ancestries
  - 18 subclasses
  - 19 environments
  - 9 domains
  - 9 communities
  - 1 frame
- ❌ 0/129 adversaries (fetch error)
- ❌ 0/618 embeddings generated (fetch error)

**Impact**:

- Low - Content database is 81% populated (618/760)
- Embeddings are a Phase 4 enhancement (semantic search)
- Core functionality (manual queries) works fine

**Priority**: Medium - Can be addressed after MVP launch

**Next Steps**:

1. Investigate Node.js fetch polyfill options
2. Try alternative Supabase client configuration
3. Consider generating embeddings via Supabase Edge Function
4. Seed adversaries via integration test or manual SQL approach

---

**Created**: 2025-10-26
**Last Updated**: 2025-10-26
