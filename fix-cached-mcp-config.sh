#!/bin/bash
# Fix Cached MCP Server Configuration in ~/.claude.json
# This fixes the most common MCP connection issue

set -e  # Exit on error

echo "🔧 Fixing Cached MCP Configuration in ~/.claude.json..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ ERROR: .env.local not found!"
    exit 1
fi

# Extract tokens
SUPABASE_TOKEN=$(grep "^SUPABASE_ACCESS_TOKEN=" .env.local | cut -d= -f2)
GH_TOKEN=$(grep "^GH_MCP_PAT=" .env.local | cut -d= -f2)

if [ -z "$SUPABASE_TOKEN" ]; then
    echo "❌ ERROR: SUPABASE_ACCESS_TOKEN not found in .env.local"
    exit 1
fi

if [ -z "$GH_TOKEN" ]; then
    echo "❌ ERROR: GH_MCP_PAT not found in .env.local"
    exit 1
fi

echo "✅ Found tokens in .env.local"
echo ""

# Backup ~/.claude.json
if [ -f ~/.claude.json ]; then
    echo "📦 Backing up ~/.claude.json to ~/.claude.json.backup"
    cp ~/.claude.json ~/.claude.json.backup
fi

# Run Python script to update cached config
echo "📝 Updating cached MCP configuration..."

python3 << EOF
import json

# Read the cached state file
with open('/Users/jmfk/.claude.json', 'r') as f:
    config = json.load(f)

# Ensure projects key exists
if 'projects' not in config:
    config['projects'] = {}

# Ensure daggergm project exists
project_path = '/Users/jmfk/Repos/daggergm'
if project_path not in config['projects']:
    config['projects'][project_path] = {}

project = config['projects'][project_path]

# Ensure mcpServers exists
if 'mcpServers' not in project:
    project['mcpServers'] = {}

# Update all three MCP servers
project['mcpServers']['supabase'] = {
    "type": "stdio",
    "command": "node",
    "args": [
        "./node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js"
    ],
    "env": {
        "SUPABASE_ACCESS_TOKEN": "$SUPABASE_TOKEN"
    }
}

project['mcpServers']['github'] = {
    "type": "stdio",
    "command": "npx",
    "args": [
        "@modelcontextprotocol/server-github"
    ],
    "env": {
        "GITHUB_TOKEN": "$GH_TOKEN",
        "GITHUB_OWNER": "sagebright",
        "GITHUB_REPO": "daggergm"
    }
}

project['mcpServers']['vercel'] = {
    "type": "http",
    "url": "https://mcp.vercel.com/"
}

# Write back
with open('/Users/jmfk/.claude.json', 'w') as f:
    json.dump(config, f, indent=2)

print("✅ Updated cached MCP configuration for daggergm")
EOF

echo ""
echo "🎉 Cached MCP Configuration Fixed!"
echo ""
echo "Next Steps:"
echo "1. Restart Claude Code completely"
echo "2. Run: /mcp"
echo "3. All three servers should now show as connected:"
echo "   ✓ Supabase MCP Server"
echo "   ✓ GitHub MCP Server"
echo "   ✓ Vercel MCP Server"
echo ""
echo "If still failing, check:"
echo "   - Supabase MCP package installed: ls node_modules/@supabase/mcp-server-supabase/"
echo "   - GitHub MCP package: npx @modelcontextprotocol/server-github --version"
echo ""
