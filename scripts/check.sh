#!/bin/bash
echo '========================================'
echo '  hanlang full pipeline check'
echo '========================================'
PASS=0; FAIL=0
p() { echo "  [PASS] $1"; PASS=$((PASS+1)); }
f() { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); }

echo; echo '--- Layer 1: TypeScript ---'
cd /var/www/hanlang-enterprise/server
ERRS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" 2>/dev/null || echo 0)
[ "$ERRS" -eq 0 ] && p "TS: 0 errors" || f "TS: $ERRS errors"

echo; echo '--- Layer 2: Backend build ---'
npx nest build > /dev/null 2>&1 && p "NestJS build OK" || f "NestJS build FAILED"

echo; echo '--- Layer 3: Frontend build ---'
cd /var/www/hanlang-enterprise/web
npx vite build > /dev/null 2>&1 && p "Vite build OK" || f "Vite build FAILED"

echo; echo '--- Layer 4: API smoke ---'
python3 /var/www/hanlang-enterprise/scripts/smoke_test.py 2>&1 | tail -8

echo; echo '--- Layer 5: PM2 ---'
pm2 list 2>/dev/null | grep -q online && p "PM2 online" || f "PM2 offline"

echo; echo "========================================"
echo "  Result: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && echo "  ALL CLEAN" || echo "  NEED FIXES"
echo "========================================"
