# PHASE 2: MCP Servers Setup

**Execution Command**: `/execute-feature documentation/PHASE_2_mcp_servers_setup.md`

---

## 📋 Overview

Configure Model Context Protocol (MCP) servers to enable direct integration between Claude and external services (Supabase, GitHub, Vercel).

**Goals**:

- Direct database queries and migrations via Supabase MCP
- Monitor CI/CD and manage PRs via GitHub MCP
- Deploy and monitor Vercel deployments
- No CLI tools needed - all via Claude

**Estimated Time**: 20-30 minutes
**Prerequisites**: Access to Supabase, GitHub, and Vercel accounts

---

## 🎯 Success Criteria

- [ ] Supabase MCP configured and working
- [ ] GitHub MCP configured for daggergm repo
- [ ] Vercel MCP configured and working
- [ ] All tokens securely stored
- [ ] Can query database from Claude
- [ ] Can monitor CI runs from Claude
- [ ] Can trigger deploys from Claude

---

## 📝 Tasks

### Task 1: Locate Claude Configuration File

**Find the correct path for your OS**:

```bash
# macOS (most likely)
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Verify it exists or create directory
if [ ! -f "$CONFIG_FILE" ]; then
  mkdir -p "$HOME/Library/Application Support/Claude"
  echo '{"mcpServers":{}}' > "$CONFIG_FILE"
  echo "✅ Created new config file"
else
  echo "✅ Config file already exists"
fi

# Show current config
cat "$CONFIG_FILE"
```

**Windows Path** (if needed):

```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux Path** (if needed):

```
~/.config/Claude/claude_desktop_config.json
```

---

### Task 2: Install Supabase MCP Package

**In your DaggerGM project directory**:

```bash
# Navigate to project root
cd /Users/jmfk/Repos/daggergm

# Install Supabase MCP server
npm install @supabase/mcp-server-supabase

# Verify installation
ls -la node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js
```

**Expected**: File exists at path

---

### Task 3: Generate Supabase Access Token

**Steps**:

1. Open browser: https://supabase.com/dashboard
2. Click your profile (top right)
3. Go to **Access Tokens**
4. Click **Generate New Token**
5. Name: "Claude MCP - DaggerGM"
6. Scopes: Select **all** (or customize):
   - `read:projects`
   - `write:projects`
   - `read:organizations`
7. Click **Create Token**
8. Copy token (starts with `sbp_`)

**Save token temporarily**:

```bash
# Store in variable for next steps
SUPABASE_TOKEN="sbp_your_token_here"
echo "Token saved: ${SUPABASE_TOKEN:0:10}..."
```

⚠️ **Security**: Keep this token secret!

---

### Task 4: Generate GitHub Personal Access Token

**Steps**:

1. Open: https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Name: "Claude MCP - DaggerGM"
4. Expiration: **No expiration** (for development)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `read:org` (Read org and team membership)
6. Click **Generate token**
7. Copy token (starts with `ghp_`)

**Save token temporarily**:

```bash
GITHUB_TOKEN="ghp_your_token_here"
echo "Token saved: ${GITHUB_TOKEN:0:10}..."
```

---

### Task 5: Generate Vercel API Token

**Steps**:

1. Open: https://vercel.com/account/tokens
2. Click **Create Token**
3. Name: "Claude MCP - DaggerGM"
4. Scope: **Full Account** (needed for deploys)
5. Expiration: **No Expiration** (for development)
6. Click **Create**
7. Copy token

**Save token temporarily**:

```bash
VERCEL_TOKEN="your_vercel_token_here"
echo "Token saved: ${VERCEL_TOKEN:0:10}..."
```

---

### Task 6: Configure MCP Servers

**Update Claude configuration file**:

```bash
# Backup existing config
cp "$HOME/Library/Application Support/Claude/claude_desktop_config.json" \
   "$HOME/Library/Application Support/Claude/claude_desktop_config.json.backup"

# Create new config with all MCP servers
cat > "$HOME/Library/Application Support/Claude/claude_desktop_config.json" << 'EOF'
{
  "mcpServers": {
    "supabase": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/Users/jmfk/Repos/daggergm/node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "REPLACE_WITH_SUPABASE_TOKEN"
      }
    },
    "github": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "REPLACE_WITH_GITHUB_TOKEN",
        "GITHUB_OWNER": "sagebright",
        "GITHUB_REPO": "daggergm"
      }
    },
    "vercel": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-vercel"
      ],
      "env": {
        "VERCEL_API_TOKEN": "REPLACE_WITH_VERCEL_TOKEN"
      }
    }
  }
}
EOF

echo "✅ Config file created (tokens need to be replaced)"
```

---

### Task 7: Insert Tokens into Config

**⚠️ IMPORTANT**: Replace tokens manually to avoid exposing them in shell history

**Option A: Manual Edit** (Recommended):

```bash
# Open config file in editor
open -a "TextEdit" "$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Manually replace:
# - REPLACE_WITH_SUPABASE_TOKEN → Your sbp_ token
# - REPLACE_WITH_GITHUB_TOKEN → Your ghp_ token
# - REPLACE_WITH_VERCEL_TOKEN → Your Vercel token
```

**Option B: Using sed** (Advanced - clears history after):

```bash
# ONLY if you're comfortable with command line
sed -i '' "s/REPLACE_WITH_SUPABASE_TOKEN/$SUPABASE_TOKEN/" \
  "$HOME/Library/Application Support/Claude/claude_desktop_config.json"

sed -i '' "s/REPLACE_WITH_GITHUB_TOKEN/$GITHUB_TOKEN/" \
  "$HOME/Library/Application Support/Claude/claude_desktop_config.json"

sed -i '' "s/REPLACE_WITH_VERCEL_TOKEN/$VERCEL_TOKEN/" \
  "$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Clear sensitive variables
unset SUPABASE_TOKEN
unset GITHUB_TOKEN
unset VERCEL_TOKEN

# Clear bash history of token commands
history -d $(history 1)
```

---

### Task 8: Verify Configuration

**Check file permissions** (should be read-only to you):

```bash
# Set restrictive permissions
chmod 600 "$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Verify
ls -la "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
```

**Expected**: `-rw-------` (owner read/write only)

**Verify JSON syntax**:

```bash
# Check for JSON errors
python3 -m json.tool "$HOME/Library/Application Support/Claude/claude_desktop_config.json" > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ JSON syntax is valid"
else
  echo "❌ JSON syntax error - fix before continuing"
fi
```

---

### Task 9: Restart Claude Desktop

**⚠️ CRITICAL**: MCP servers only load on startup

**Steps**:

1. Quit Claude Desktop completely (Cmd+Q)
2. Wait 3 seconds
3. Reopen Claude Desktop
4. Wait for it to fully load

**Verification**: You should see a small indicator that MCP servers are loading

---

### Task 10: Test Supabase MCP

**In a new Claude conversation**, try these commands:

```
Test 1: List projects
"Can you list my Supabase projects?"

Expected: Shows your Supabase projects

Test 2: List tables
"Show me the tables in my DaggerGM database"

Expected: Lists tables (if database exists)

Test 3: Execute query
"Execute this SQL query: SELECT version()"

Expected: Returns PostgreSQL version
```

**If any test fails**, see Troubleshooting section

---

### Task 11: Test GitHub MCP

**In Claude, try these commands**:

```
Test 1: List branches
"Show me the branches in the daggergm repository"

Expected: Lists branches (main, feature branches, etc.)

Test 2: Recent commits
"Show me the 5 most recent commits"

Expected: Recent commit history

Test 3: CI status
"What's the status of the latest GitHub Actions run?"

Expected: Latest workflow run status

Test 4: Open PRs
"List all open pull requests"

Expected: Open PRs (or "No open PRs")
```

---

### Task 12: Test Vercel MCP

**In Claude, try these commands**:

```
Test 1: List projects
"Show me my Vercel projects"

Expected: Your Vercel projects including daggergm

Test 2: Recent deployments
"Show me the 3 most recent deployments for daggergm"

Expected: Recent deployment history

Test 3: Deployment status
"What's the status of the latest deployment?"

Expected: Current deployment status (ready/building/error)
```

---

### Task 13: Document MCP Setup

**Create file**: `documentation/MCP_SETUP_DAGGERGM.md`

**Content**:

```markdown
# MCP Servers - DaggerGM Configuration

## Configured Servers

### Supabase MCP

- **Purpose**: Database queries, migrations, RLS policy checks
- **Token Location**: Claude config (sbp\_\*)
- **Test Command**: "List my Supabase projects"

### GitHub MCP

- **Purpose**: PR management, CI/CD monitoring, code search
- **Token Location**: Claude config (ghp\_\*)
- **Scope**: sagebright/daggergm repository
- **Test Command**: "Show GitHub workflow status"

### Vercel MCP

- **Purpose**: Deploy management, logs, environment variables
- **Token Location**: Claude config
- **Test Command**: "List Vercel deployments"

## Common Operations

### Database

- "Show tables in DaggerGM database"
- "Execute SQL: SELECT \* FROM adventures LIMIT 5"
- "Check for tables missing RLS policies"
- "Generate types from database schema"

### CI/CD

- "What's the status of the latest CI run?"
- "Show me failing test logs"
- "List recent workflow runs"
- "Watch the current CI run"

### Deployment

- "Deploy to Vercel"
- "Show latest deployment logs"
- "List environment variables"
- "Check domain configuration"

## Security Notes

- Tokens stored in: `~/Library/Application Support/Claude/claude_desktop_config.json`
- File permissions: 600 (owner read/write only)
- **Never commit tokens to git**
- Rotate tokens every 90 days

## Token Rotation

When rotating tokens:

1. Generate new token in service dashboard
2. Update Claude config file
3. Restart Claude Desktop
4. Test with simple command
5. Revoke old token

## Troubleshooting

### MCP server not responding

- Restart Claude Desktop
- Check config file JSON syntax
- Verify token hasn't expired

### "Unauthorized" errors

- Regenerate token with correct scopes
- Verify token in config file
- Check for extra whitespace in token

### Supabase MCP path errors

- Verify npm package installed
- Check absolute path is correct
- Run: `ls /Users/jmfk/Repos/daggergm/node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js`

---

**Last Updated**: 2025-10-23
**Config File**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Backup**: `~/Library/Application Support/Claude/claude_desktop_config.json.backup`
```

---

### Task 14: Security Verification

**Ensure configuration is secure**:

```bash
# 1. Check file permissions
stat -f "%Sp %N" "$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# 2. Verify config is NOT in git
cd /Users/jmfk/Repos/daggergm
grep -r "claude_desktop_config.json" .gitignore || echo "⚠️  Add to .gitignore"

# 3. Add to gitignore if needed
cat >> .gitignore << 'EOF'

# Claude MCP Configuration
**/claude_desktop_config.json
EOF

# 4. Clear shell history of tokens
history -c
```

---

## ✅ Validation Checklist

After setup, verify all tests pass:

- [ ] Supabase MCP lists projects
- [ ] Supabase MCP executes SQL queries
- [ ] GitHub MCP lists branches
- [ ] GitHub MCP shows CI status
- [ ] Vercel MCP lists projects
- [ ] Vercel MCP shows deployments
- [ ] Config file has 600 permissions
- [ ] Config file NOT in git
- [ ] Backup config exists
- [ ] Documentation created

---

## 🐛 Troubleshooting

### MCP Server Not Loading

**Symptom**: Claude doesn't show tools from MCP server

**Solutions**:

1. **Restart Claude Desktop** (required after config changes)
2. **Check file path**: Verify absolute path to stdio.js
   ```bash
   ls -la /Users/jmfk/Repos/daggergm/node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js
   ```
3. **Check JSON syntax**: Use JSON validator
4. **Check logs**: Look in Claude Desktop developer console

---

### Invalid Token Errors

**Symptom**: "Unauthorized" or "Invalid token" errors

**Solutions**:

1. **Regenerate token** with correct scopes
2. **Check for whitespace**: Tokens should have no spaces
3. **Verify format**:
   - Supabase: `sbp_...`
   - GitHub: `ghp_...`
   - Vercel: varies
4. **Check expiration**: Regenerate if expired

---

### Command Not Found (npx)

**Symptom**: "npx: command not found"

**Solutions**:

1. **Verify Node.js installed**:
   ```bash
   node --version  # Should show v20.x
   which npx       # Should show path
   ```
2. **Use full path to npx**:
   ```json
   "command": "/usr/local/bin/npx"
   ```

---

### Supabase Path Not Found

**Symptom**: "Cannot find module" for Supabase MCP

**Solutions**:

1. **Reinstall package**:
   ```bash
   npm install @supabase/mcp-server-supabase
   ```
2. **Verify path**:
   ```bash
   ls /Users/jmfk/Repos/daggergm/node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js
   ```
3. **Check permissions**:
   ```bash
   chmod -R 755 node_modules/@supabase/mcp-server-supabase
   ```

---

### GitHub MCP Shows Wrong Repo

**Symptom**: Shows different repository than daggergm

**Solution**: Verify config has:

```json
"GITHUB_OWNER": "sagebright",
"GITHUB_REPO": "daggergm"
```

---

## 📊 Expected Results

**Before MCP Setup**:

- Need GitHub CLI for CI monitoring
- Need Supabase CLI for database queries
- Need Vercel CLI for deployments
- Multiple authentication systems

**After MCP Setup**:

- Query database directly from Claude
- Monitor CI/CD from Claude
- Trigger deployments from Claude
- Single authentication per service
- No CLI tools needed

---

## 🔐 Security Best Practices

### Token Management

1. **Store securely**: Only in Claude config file
2. **Set permissions**: 600 (owner read/write only)
3. **Never commit**: Add to .gitignore
4. **Rotate regularly**: Every 90 days minimum
5. **Use minimum scopes**: Only what's needed

### File Protection

```bash
# Set restrictive permissions on Claude directory
chmod 700 "$HOME/Library/Application Support/Claude/"
chmod 600 "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
```

### Token Scope Recommendations

**Supabase**:

- Development: `all`
- Production: Limit to specific projects

**GitHub**:

- `repo` - Required for private repos
- `workflow` - Required for CI/CD
- `read:org` - Optional for team info

**Vercel**:

- Full Account - Required for deployments
- Consider project-specific tokens for production

---

**Last Updated**: 2025-10-23
**Execution Time**: 20-30 minutes
**Difficulty**: Easy
**Prerequisites**: Account access to Supabase, GitHub, Vercel
