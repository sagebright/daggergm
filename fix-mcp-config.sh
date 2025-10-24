#!/bin/bash
# Fix MCP Server Configuration for daggergm
# This script updates .mcp.json with correct configuration

set -e  # Exit on error

echo "🔧 Fixing daggergm MCP Server Configuration..."
echo ""

# Backup existing config
if [ -f .mcp.json ]; then
    echo "📦 Backing up existing .mcp.json to .mcp.json.backup"
    cp .mcp.json .mcp.json.backup
fi

# Read tokens from .env.local
if [ ! -f .env.local ]; then
    echo "❌ ERROR: .env.local not found!"
    echo "Please ensure .env.local exists with the required tokens."
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
echo "   - SUPABASE_ACCESS_TOKEN: ${SUPABASE_TOKEN:0:10}..."
echo "   - GH_MCP_PAT: ${GH_TOKEN:0:20}..."
echo ""

# Create corrected .mcp.json
echo "📝 Writing corrected .mcp.json..."

cat > .mcp.json << EOF
{
  "mcpServers": {
    "supabase": {
      "type": "stdio",
      "command": "node",
      "args": [
        "./node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "$SUPABASE_TOKEN"
      }
    },
    "github": {
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
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com/"
    }
  }
}
EOF

echo "✅ .mcp.json updated successfully!"
echo ""

# Validate JSON syntax
echo "🔍 Validating JSON syntax..."
if python3 -m json.tool .mcp.json > /dev/null 2>&1; then
    echo "✅ JSON syntax is valid"
else
    echo "❌ ERROR: Invalid JSON syntax!"
    echo "Restoring backup..."
    mv .mcp.json.backup .mcp.json
    exit 1
fi

echo ""
echo "🎉 MCP Configuration Fixed!"
echo ""
echo "Next Steps:"
echo "1. Restart Claude Code (close all windows/sessions)"
echo "2. Run: /mcp"
echo "3. Verify all three servers show as connected:"
echo "   ✓ Supabase MCP Server"
echo "   ✓ GitHub MCP Server"
echo "   ✓ Vercel MCP Server"
echo ""
echo "If servers still fail, run:"
echo "   ./fix-cached-mcp-config.sh"
echo ""
