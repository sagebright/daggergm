# MCP Token Setup Instructions for DaggerGM

## 🎯 Overview

This guide walks you through generating and inserting the required API tokens for DaggerGM's MCP (Model Context Protocol) server integrations.

**Status**: MCP configuration file has been created with placeholder tokens.

**Location**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Backup Created**: `~/Library/Application Support/Claude/claude_desktop_config.backup.[timestamp].json`

---

## 📋 Required Tokens

You need to generate **3 tokens**:

1. ✅ **Supabase Access Token** (for database operations)
2. ✅ **GitHub Personal Access Token** (for PR/CI/CD management)
3. ✅ **Vercel API Token** (for deployment management)

---

## 🔐 Token Generation Steps

### 1. Supabase Access Token

**Purpose**: Direct database queries, migrations, RLS checks, type generation

**Steps**:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your profile icon (top right)
3. Select **Access Tokens**
4. Click **Generate New Token**
5. Name it: `Claude MCP - DaggerGM`
6. Select scopes: **all** (or customize: `projects.read`, `projects.write`, `sql.read`, `sql.write`)
7. Click **Generate**
8. Copy the token (starts with `sbp_`)

**Token Format**: `sbp_[alphanumeric string]`

**Security Note**: This token has full access to your Supabase projects. Keep it secure.

---

### 2. GitHub Personal Access Token

**Purpose**: PR management, CI/CD monitoring, workflow status checks

**Steps**:

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Name it: `Claude MCP - DaggerGM`
4. Set expiration: **No expiration** (or your preferred duration)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `read:org` (Read org and team membership)
6. Click **Generate token**
7. Copy the token (starts with `ghp_`)

**Token Format**: `ghp_[alphanumeric string]`

**Security Note**: This token can modify workflows and code. Treat as highly sensitive.

---

### 3. Vercel API Token

**Purpose**: Deployment management, build logs, environment variables

**Steps**:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Settings** (top navigation)
3. Click **Tokens** in the sidebar
4. Click **Create Token**
5. Name it: `Claude MCP - DaggerGM`
6. Scope: **Full Account** (or limit to specific projects if available)
7. Expiration: **No Expiration** (or your preferred duration)
8. Click **Create**
9. Copy the token

**Token Format**: Varies (alphanumeric string)

**Security Note**: This token can deploy code and modify production. Keep secure.

---

## 🔧 Token Insertion

### Option 1: Manual Editing (Recommended)

1. Open the config file:

   ```bash
   open "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
   ```

2. Find and replace the following placeholders:
   - `REPLACE_WITH_DAGGERGM_SUPABASE_TOKEN` → Your Supabase token (`sbp_...`)
   - `REPLACE_WITH_GITHUB_TOKEN` → Your GitHub token (`ghp_...`)
   - `REPLACE_WITH_VERCEL_TOKEN` → Your Vercel token

3. Save the file

### Option 2: Command-Line Replacement

```bash
# Set your tokens as environment variables first
export SUPABASE_TOKEN="sbp_your_actual_token_here"
export GITHUB_TOKEN="ghp_your_actual_token_here"
export VERCEL_TOKEN="your_vercel_token_here"

# Replace placeholders
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

sed -i '' "s/REPLACE_WITH_DAGGERGM_SUPABASE_TOKEN/$SUPABASE_TOKEN/" "$CONFIG_FILE"
sed -i '' "s/REPLACE_WITH_GITHUB_TOKEN/$GITHUB_TOKEN/" "$CONFIG_FILE"
sed -i '' "s/REPLACE_WITH_VERCEL_TOKEN/$VERCEL_TOKEN/" "$CONFIG_FILE"

echo "✅ Tokens inserted"
```

---

## 🔍 Verification

### Check Token Insertion

```bash
# View config (tokens will be visible - be careful!)
cat "$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Or check if placeholders remain (should return nothing)
grep "REPLACE_WITH" "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
```

**Expected**: No output from the grep command (all placeholders replaced)

### Validate JSON Syntax

```bash
python3 -m json.tool "$HOME/Library/Application Support/Claude/claude_desktop_config.json" > /dev/null && echo "✅ Valid JSON" || echo "❌ Invalid JSON"
```

---

## 🔄 Restart Claude Desktop

**REQUIRED**: After inserting tokens, you MUST restart Claude Desktop for changes to take effect.

1. Quit Claude Desktop completely (⌘Q)
2. Reopen Claude Desktop
3. Wait 10-15 seconds for MCP servers to initialize

---

## ✅ Testing MCP Integrations

### Test Supabase MCP

In Claude Desktop, try:

```
List my Supabase projects
```

**Expected**: Claude shows your Supabase projects, including DaggerGM

### Test GitHub MCP

In Claude Desktop, try:

```
List open pull requests for daggergm
```

**Expected**: Claude shows open PRs (or confirms there are none)

### Test Vercel MCP

In Claude Desktop, try:

```
List my Vercel projects
```

**Expected**: Claude shows your Vercel projects, including DaggerGM

---

## 🛡️ Security Checklist

After setup:

- [ ] Config file has `600` permissions (owner read/write only)

  ```bash
  ls -l "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
  # Should show: -rw-------
  ```

- [ ] Config file is NOT in any git repository

  ```bash
  # Should return: fatal: not a git repository
  cd "$HOME/Library/Application Support/Claude" && git status 2>&1 | grep "not a git repository"
  ```

- [ ] Tokens are not in your shell history (if using Option 2)

  ```bash
  # Clear sensitive commands from history
  history -d $(history | grep "export.*TOKEN" | awk '{print $1}')
  ```

- [ ] Backup file is secure

  ```bash
  chmod 600 "$HOME/Library/Application Support/Claude/claude_desktop_config.backup."*.json
  ```

- [ ] No tokens accidentally committed to git
  ```bash
  cd /Users/jmfk/Repos/daggergm
  git grep -i "sbp_\|ghp_" || echo "✅ No tokens found in git"
  ```

---

## 🔄 Token Rotation

Best practice: Rotate tokens every 90 days

### To Rotate a Token:

1. Generate new token (follow steps above)
2. Open config file
3. Replace old token with new token
4. Restart Claude Desktop
5. Test integration
6. Revoke old token from service dashboard

---

## ❌ Troubleshooting

### "Unauthorized" or "Invalid token" errors

**Solution**:

1. Verify token was copied correctly (no extra spaces)
2. Check token hasn't expired
3. Verify token has required scopes
4. Regenerate token if needed

### MCP server not loading

**Solution**:

1. Restart Claude Desktop (⌘Q, then reopen)
2. Check JSON syntax: `python3 -m json.tool "$HOME/Library/Application Support/Claude/claude_desktop_config.json"`
3. Check Claude Desktop logs (Help → Developer Tools)
4. Verify file permissions: `ls -l "$HOME/Library/Application Support/Claude/claude_desktop_config.json"`

### "Cannot find module" error

**Solution**:

1. Verify Supabase MCP package is installed:
   ```bash
   cd /Users/jmfk/Repos/daggergm
   ls node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js
   ```
2. Reinstall if needed: `npm install @supabase/mcp-server-supabase`

---

## 📚 Reference Links

- [Supabase Access Tokens](https://supabase.com/dashboard/account/tokens)
- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [Vercel API Tokens](https://vercel.com/account/tokens)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)

---

## 📋 Current Configuration Summary

Your Claude Desktop MCP configuration now includes:

| Server Name           | Purpose                      | Repository | Status            |
| --------------------- | ---------------------------- | ---------- | ----------------- |
| `supabase-daggergm`   | DaggerGM database operations | daggergm   | ⏳ Awaiting token |
| `github-daggergm`     | DaggerGM PR/CI management    | daggergm   | ⏳ Awaiting token |
| `vercel-daggergm`     | DaggerGM deployments         | daggergm   | ⏳ Awaiting token |
| `voiceprints`         | External MCP service         | N/A        | ✅ Active         |
| `supabase-bachlezard` | Bachlezard database          | bachlezard | ✅ Active         |
| `github-bachlezard`   | Bachlezard PR management     | bachlezard | ✅ Active         |

---

**Version**: 2025-10-23
**Phase**: Phase 2 - MCP Servers Setup
**Next Step**: Generate tokens, insert into config, restart Claude Desktop, test integrations
