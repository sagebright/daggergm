#!/bin/bash
# Security Audit Script for DaggerGM
# Validates user isolation (user_id) in all database operations

echo "🔒 Running DaggerGM Security Audit..."
echo ""

FAIL=0

# 1️⃣ Check for Supabase queries missing user_id filtering
echo "📋 Checking database queries for user_id filtering..."

MISSING_USER=$(grep -rn "supabase\.from" src --include="*.ts" --include="*.tsx" 2>/dev/null | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)

  # Check next 10 lines for user_id or getUser()
  if ! sed -n "$linenum,$((linenum+10))p" "$file" 2>/dev/null | grep -q "user_id\|getUser()"; then
    echo "❌ $file:$linenum - Missing user_id filtering"
    echo "1"
  fi
done | grep -c "1")

if [ "$MISSING_USER" -gt 0 ]; then
  echo "❌ Found $MISSING_USER queries without user_id filtering"
  FAIL=1
else
  echo "✅ All database queries include user_id filtering"
fi

echo ""

# 2️⃣ Check Server Actions have authentication
echo "📋 Checking Server Actions for authentication..."

MISSING_AUTH=$(grep -rn "'use server'" src/features --include="*.ts" 2>/dev/null | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)

  # Check if file has getUser() call
  if ! grep -q "getUser()" "$file" 2>/dev/null; then
    echo "❌ $file - Missing authentication check"
    echo "1"
  fi
done | grep -c "1")

if [ "$MISSING_AUTH" -gt 0 ]; then
  echo "❌ Found $MISSING_AUTH Server Actions without authentication"
  FAIL=1
else
  echo "✅ All Server Actions have authentication checks"
fi

echo ""

# 3️⃣ Check for hardcoded user IDs
echo "📋 Checking for hardcoded user IDs..."

HARDCODED=$(grep -rn "user_id.*=.*['\"]" src --include="*.ts" --include="*.tsx" 2>/dev/null | \
  grep -v "user_id: user.id" | \
  grep -v "user_id.*formData" | \
  grep -v "user_id.*params" | \
  grep -v "// " | \
  wc -l | tr -d ' ')

if [ "$HARDCODED" -gt 0 ]; then
  echo "❌ Found $HARDCODED instances of hardcoded user_id values"
  grep -rn "user_id.*=.*['\"]" src --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -v "user_id: user.id" | \
    grep -v "user_id.*formData" | \
    grep -v "user_id.*params" | \
    grep -v "// "
  FAIL=1
else
  echo "✅ No hardcoded user IDs found"
fi

echo ""

# 4️⃣ Check INSERTs include user_id
echo "📋 Checking INSERT operations include user_id..."

MISSING_INSERT_USER=$(grep -rn "\.insert(" src --include="*.ts" --include="*.tsx" 2>/dev/null | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)

  # Check next 5 lines for user_id
  if ! sed -n "$linenum,$((linenum+5))p" "$file" 2>/dev/null | grep -q "user_id"; then
    echo "❌ $file:$linenum - INSERT missing user_id"
    echo "1"
  fi
done | grep -c "1")

if [ "$MISSING_INSERT_USER" -gt 0 ]; then
  echo "❌ Found $MISSING_INSERT_USER INSERT operations without user_id"
  FAIL=1
else
  echo "✅ All INSERT operations include user_id"
fi

echo ""

# 5️⃣ Summary
if [ $FAIL -eq 1 ]; then
  echo "🚨 SECURITY AUDIT FAILED"
  echo "Fix all violations before committing."
  echo ""
  echo "Common fixes:"
  echo "  - Add .eq('user_id', user.id) to all SELECT queries"
  echo "  - Add user_id: user.id to all INSERT operations"
  echo "  - Add const { data: { user } } = await supabase.auth.getUser() to Server Actions"
  echo ""
  exit 1
fi

echo "✅ SECURITY AUDIT PASSED"
echo "All user isolation checks passed."
exit 0
