# MCP Server Setup Troubleshooting Guide - daggergm

**Purpose**: Fix MCP server connection issues for Supabase, GitHub, and Vercel
**Status**: 🔧 Troubleshooting Required
**Created**: 2025-10-23

---

## Quick Fix (Run These Scripts)

### Step 1: Fix Project Configuration

```bash
cd /Users/jmfk/Repos/daggergm
./fix-mcp-config.sh
```

This script:

- ✅ Backs up existing `.mcp.json`
- ✅ Reads tokens from `.env.local`
- ✅ Creates corrected `.mcp.json` with proper format
- ✅ Validates JSON syntax

### Step 2: Fix Cached Configuration

```bash
cd /Users/jmfk/Repos/daggergm
./fix-cached-mcp-config.sh
```

This script:

- ✅ Backs up `~/.claude.json`
- ✅ Updates cached MCP config for daggergm project
- ✅ Ensures all three servers are properly configured

### Step 3: Restart and Verify

1. **Restart Claude Code completely** (close all windows/sessions)
2. Open daggergm project in Claude Code
3. Run `/mcp` command
4. Verify all three servers show as **✓ connected**

---

## Issues Found in Original Configuration

### 🔴 Issue 1: Missing `type` Field

**Problem**: MCP server configs were missing the required `type` field

**Original (BROKEN)**:

```json
{
  "supabase": {
    "command": "node",
    "args": ["..."]
  }
}
```

**Fixed**:

```json
{
  "supabase": {
    "type": "stdio",  ← REQUIRED!
    "command": "node",
    "args": ["..."]
  }
}
```

**Impact**: MCP servers won't initialize without the `type` field

---

### 🔴 Issue 2: Environment Variable Substitution Not Supported

**Problem**: Using `${VARIABLE_NAME}` syntax which Claude Code doesn't support

**Original (BROKEN)**:

```json
{
  "env": {
    "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
  }
}
```

**Fixed**:

```json
{
  "env": {
    "SUPABASE_ACCESS_TOKEN": "sbp_ff9a76b54374a81a0d192e5f817b8c79627767d3"
  }
}
```

**Why This Doesn't Work**:

- Claude Code MCP config does NOT read from `.env.local`
- Environment variable substitution (`${VAR}`) is NOT supported
- Variables must be **hardcoded** in the config files
- Tokens in `.env.local` are for the application, not for MCP servers

**Security Note**:

- `.mcp.json` should be in `.gitignore` if it contains tokens
- For daggergm, tokens are already in `.env.local` (also gitignored)
- This is acceptable for local development

---

### 🔴 Issue 3: Wrong Path Syntax

**Problem**: Using `${PROJECT_ROOT}/node_modules/...`

**Original (BROKEN)**:

```json
{
  "args": ["${PROJECT_ROOT}/node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js"]
}
```

**Fixed**:

```json
{
  "args": ["./node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js"]
}
```

**Why**:

- `${PROJECT_ROOT}` is not a recognized variable
- Use relative path `./node_modules/...` instead
- Claude Code resolves relative paths from project directory

---

### 🔴 Issue 4: Vercel Using Wrong Transport

**Problem**: Vercel configured with stdio/npx instead of HTTP

**Original (SUBOPTIMAL)**:

```json
{
  "vercel": {
    "command": "npx",
    "args": ["vercel-mcp"],
    "env": {
      "VERCEL_API_TOKEN": "${VERCEL_TOKEN}"
    }
  }
}
```

**Fixed**:

```json
{
  "vercel": {
    "type": "http",
    "url": "https://mcp.vercel.com/"
  }
}
```

**Why HTTP is Better**:

- ✅ Vercel provides a hosted MCP HTTP endpoint
- ✅ No need to install/run local server
- ✅ Authentication handled via browser OAuth
- ✅ Always up-to-date with latest features
- ✅ Better performance and reliability

---

## Corrected Configuration

### File: `.mcp.json` (Project Config)

```json
{
  "mcpServers": {
    "supabase": {
      "type": "stdio",
      "command": "node",
      "args": ["./node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_ff9a76b54374a81a0d192e5f817b8c79627767d3"
      }
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "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",
        "GITHUB_OWNER": "sagebright",
        "GITHUB_REPO": "daggergm"
      }
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com/"
    }
  }
}
```

---

## Configuration Checklist

### ✅ Supabase MCP Server

**Requirements**:

- [ ] Package installed: `@supabase/mcp-server-supabase`
  ```bash
  ls node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js
  ```
- [ ] Personal Access Token (PAT) from Supabase dashboard
  - Format: `sbp_[40-character-hex]`
  - Get from: https://supabase.com/dashboard/account/tokens
- [ ] Config includes:
  - `type: "stdio"`
  - Correct path to `stdio.js`
  - `SUPABASE_ACCESS_TOKEN` (NOT `SUPABASE_SERVICE_ROLE_KEY`)

**Test**:

```bash
SUPABASE_ACCESS_TOKEN="sbp_..." node ./node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js --version
```

Expected: `0.4.5` (or current version)

---

### ✅ GitHub MCP Server

**Requirements**:

- [ ] Package available via npx: `@modelcontextprotocol/server-github`
  ```bash
  npx @modelcontextprotocol/server-github --version
  ```
- [ ] GitHub Personal Access Token (classic)
  - Format: `github_pat_...` or `ghp_...`
  - Get from: https://github.com/settings/tokens
  - Scopes needed: `repo`, `read:org`
- [ ] Config includes:
  - `type: "stdio"`
  - `command: "npx"`
  - `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`

**Test**:

```bash
GITHUB_TOKEN="github_pat_..." npx @modelcontextprotocol/server-github
```

Expected: Server starts (press Ctrl+C to exit)

---

### ✅ Vercel MCP Server

**Requirements**:

- [ ] Using HTTP transport (no installation needed)
- [ ] Vercel account access
- [ ] Config includes:
  - `type: "http"`
  - `url: "https://mcp.vercel.com/"`

**Test**:
Authentication happens via OAuth when first using Vercel tools in Claude Code.

---

## Common Issues & Solutions

### Issue: "Status: ✘ failed" for Supabase

**Symptoms**:

- `/mcp` shows Supabase as failed
- No `mcp__supabase__*` tools available

**Diagnosis**:

```bash
# Check package installed
ls node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js

# Check token format
grep SUPABASE_ACCESS_TOKEN .env.local
# Should output: SUPABASE_ACCESS_TOKEN=sbp_...

# Test server manually
SUPABASE_ACCESS_TOKEN="sbp_..." node ./node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js --version
```

**Solutions**:

1. **Missing package**: Run `npm install @supabase/mcp-server-supabase`
2. **Wrong token**: Regenerate PAT from Supabase dashboard
3. **Wrong path**: Use `./node_modules/...` not `${PROJECT_ROOT}/...`
4. **Missing type**: Add `"type": "stdio"` to config
5. **Variable substitution**: Replace `${SUPABASE_ACCESS_TOKEN}` with actual token

---

### Issue: "Status: ✘ failed" for GitHub

**Symptoms**:

- `/mcp` shows GitHub as failed
- No `mcp__github__*` tools available

**Diagnosis**:

```bash
# Test npx package
npx @modelcontextprotocol/server-github --version

# Check token
grep GH_MCP_PAT .env.local
```

**Solutions**:

1. **Package not found**: Install via `npm install -g @modelcontextprotocol/server-github`
2. **Wrong token**: Generate new GitHub PAT with `repo` scope
3. **Token expired**: GitHub PATs can expire - regenerate if needed
4. **Missing type**: Add `"type": "stdio"` to config

---

### Issue: Vercel Shows as Failed

**Symptoms**:

- `/mcp` shows Vercel as failed
- No `mcp__vercel__*` tools available

**Solutions**:

1. **Using stdio instead of HTTP**: Change to HTTP transport
2. **Wrong URL**: Use `https://mcp.vercel.com/` (not `https://mcp.vercel.com/mcp`)
3. **Missing type**: Add `"type": "http"` to config
4. **Auth required**: First use will trigger OAuth flow

---

### Issue: Cached Config Still Using Old Settings

**Symptoms**:

- Fixed `.mcp.json` but still failing
- Config looks correct but servers won't connect

**Root Cause**:
Claude Code caches MCP configs in `~/.claude.json` per-project. Even after fixing `.mcp.json`, the cached config may override it.

**Solution**:

```bash
# Check what's actually being used
python3 -c "
import json
with open('/Users/jmfk/.claude.json', 'r') as f:
    config = json.load(f)
    projects = config.get('projects', {})
    daggergm = projects.get('/Users/jmfk/Repos/daggergm', {})
    mcp = daggergm.get('mcpServers', {})
    print(json.dumps(mcp, indent=2))
"

# If output shows wrong config, run:
./fix-cached-mcp-config.sh
```

---

## Verification Steps

After running fix scripts:

### 1. Check Configuration Files

```bash
# Verify .mcp.json syntax
cat .mcp.json | python3 -m json.tool

# Verify tokens are hardcoded (not ${VARIABLE})
grep -E "SUPABASE_ACCESS_TOKEN|GITHUB_TOKEN" .mcp.json
# Should show actual token values, not ${...}

# Verify type fields exist
grep '"type"' .mcp.json
# Should show "stdio" for Supabase/GitHub, "http" for Vercel
```

### 2. Test MCP Servers Locally

```bash
# Test Supabase
SUPABASE_ACCESS_TOKEN="sbp_..." \
  node ./node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js --version

# Test GitHub
GITHUB_TOKEN="github_pat_..." \
  GITHUB_OWNER="sagebright" \
  GITHUB_REPO="daggergm" \
  npx @modelcontextprotocol/server-github
# Press Ctrl+C to exit

# Vercel (HTTP - no local test needed)
# Authentication happens in Claude Code
```

### 3. Restart and Verify in Claude Code

```bash
# 1. Close all Claude Code windows/sessions
# 2. Reopen in daggergm project
# 3. Run /mcp command
```

**Expected Output**:

```
Supabase MCP Server
Status: ✓ connected

GitHub MCP Server
Status: ✓ connected

Vercel MCP Server
Status: ✓ connected
```

### 4. Test Actual Connection

Ask Claude Code:

- "List my Supabase projects"
- "List issues in the daggergm GitHub repo"
- "List my Vercel projects"

All should work without errors.

---

## Comparison with Working Setup (bachlezard)

The bachlezard project has **working** MCP configuration. Key differences:

### bachlezard (WORKING) ✅

```json
{
  "supabase": {
    "type": "stdio",                    ← HAS type field
    "command": "node",
    "args": ["./node_modules/..."],     ← Relative path, no ${VAR}
    "env": {
      "SUPABASE_ACCESS_TOKEN": "sbp_..." ← Hardcoded token
    }
  }
}
```

### daggergm (BROKEN) ❌

```json
{
  "supabase": {
                                        ← MISSING type field
    "command": "node",
    "args": ["${PROJECT_ROOT}/..."],    ← Variable substitution
    "env": {
      "SUPABASE_ACCESS_TOKEN": "${...}" ← Variable substitution
    }
  }
}
```

---

## Security Considerations

### Token Storage

**Current Approach**:

- Tokens stored in both `.env.local` and `.mcp.json`
- Both files are in `.gitignore`
- Safe for local development

**Why Tokens Must Be in .mcp.json**:

- Claude Code MCP loader doesn't read `.env` files
- No environment variable substitution support
- Direct values required in config

**Best Practices**:

1. ✅ Keep `.mcp.json` in `.gitignore`
2. ✅ Use project-specific tokens (not personal main account)
3. ✅ Rotate tokens every 90 days
4. ✅ Revoke tokens if exposed
5. ✅ Use read-only scopes when possible

### Token Scopes

**Supabase PAT**:

- Access to: All projects in account
- Scope: Database queries, storage, functions
- Rotation: Every 90 days recommended

**GitHub PAT**:

- Required scopes: `repo`, `read:org`
- Optional: `workflow` (for Actions), `read:packages`
- Expiration: Set to 90 days

**Vercel**:

- OAuth-based (no token in config)
- Scoped to authenticated user
- Revoke via: https://vercel.com/account/tokens

---

## Related Documentation

- **Supabase MCP Setup**: `/Users/jmfk/Repos/bachlezard/documentation/ops/SUPABASE_MCP_SETUP.md`
- **MCP Protocol Docs**: https://modelcontextprotocol.io/
- **Claude Code MCP Docs**: https://docs.claude.com/en/docs/claude-code/mcp
- **Supabase MCP Server**: https://github.com/supabase/mcp-server-supabase
- **GitHub MCP Server**: https://github.com/modelcontextprotocol/servers

---

## Summary: What Was Wrong

### Critical Issues (Blocking)

1. ❌ **Missing `type` field** - Servers won't initialize
2. ❌ **Environment variable substitution** - `${VAR}` not supported
3. ❌ **Wrong path syntax** - `${PROJECT_ROOT}` not recognized

### Suboptimal Issues (Working but not ideal)

4. ⚠️ **Vercel using stdio** - HTTP transport is better

### All Fixed By

- Running `./fix-mcp-config.sh`
- Running `./fix-cached-mcp-config.sh`
- Restarting Claude Code

---

## Quick Reference

### File Locations

```
Project Config:    /Users/jmfk/Repos/daggergm/.mcp.json
Cached Config:     /Users/jmfk/.claude.json
Environment Vars:  /Users/jmfk/Repos/daggergm/.env.local
Fix Scripts:       /Users/jmfk/Repos/daggergm/fix-*.sh
```

### Commands

```bash
# Fix everything
./fix-mcp-config.sh && ./fix-cached-mcp-config.sh

# Check status
/mcp

# Validate config
cat .mcp.json | python3 -m json.tool

# Test Supabase server
SUPABASE_ACCESS_TOKEN="sbp_..." node ./node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js --version
```

---

**Status**: Ready to fix - Run the scripts and restart Claude Code
**Maintainer**: Development Team
**Created**: 2025-10-23
**Next Review**: After fix is applied
