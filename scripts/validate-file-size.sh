#!/bin/bash
# File Size Validation Script for DaggerGM
# Enforces 300-line maximum file size

echo "📏 Validating file sizes (DaggerGM: 300-line limit)..."
echo ""

MAX_LINES=300
WARN_LINES=250
FAIL=0
WARNINGS=0

# Check all TypeScript/TSX files in src (excluding auto-generated)
for file in $(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null); do
  # Skip auto-generated type files
  if [[ "$file" == *"/types/supabase.ts" ]] || [[ "$file" == *"database.generated.ts" ]]; then
    continue
  fi

  lines=$(wc -l < "$file" | tr -d ' ')

  if [ "$lines" -gt $MAX_LINES ]; then
    echo "❌ $file: $lines lines (max $MAX_LINES)"
    echo "   → REFACTOR REQUIRED"
    FAIL=1
  elif [ "$lines" -gt $WARN_LINES ]; then
    echo "⚠️  $file: $lines lines (approaching limit)"
    WARNINGS=$((WARNINGS + 1))
  fi
done

echo ""

if [ $FAIL -eq 1 ]; then
  echo "🚨 FILE SIZE VIOLATIONS DETECTED"
  echo ""
  echo "Files must be ≤300 lines. Refactor before committing."
  echo ""
  echo "Refactoring strategies:"
  echo "  1. Split Server/Client code (Server Components vs Client Components)"
  echo "  2. Extract hooks into separate files (useAdventureState.ts)"
  echo "  3. Move utilities to lib/ directory"
  echo "  4. Split large components into smaller components"
  echo "  5. Extract Server Actions to separate actions.ts files"
  echo ""
  exit 1
fi

if [ $WARNINGS -gt 0 ]; then
  echo "⚠️  $WARNINGS file(s) approaching the 300-line limit"
  echo "Consider refactoring soon to avoid violations."
  echo ""
fi

echo "✅ All files within size limits"
exit 0
