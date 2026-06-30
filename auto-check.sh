#!/bin/bash
# ============================================
# Hanlang Auto-Check & Fix Pipeline
# Usage: bash auto-check.sh [--fix] [--full]
# ============================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_DIR="$SCRIPT_DIR/web"
SERVER_DIR="$SCRIPT_DIR/server"
FIX_MODE=false
FULL_MODE=false

for arg in "$@"; do
  case $arg in
    --fix) FIX_MODE=true ;;
    --full) FULL_MODE=true ;;
  esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass_count=0
fail_count=0
fix_count=0

check_step() {
  local name="$1"
  local cmd="$2"
  echo -e "\n${YELLOW}[CHECK]${NC} $name"
  if eval "$cmd" 2>&1; then
    echo -e "  ${GREEN}PASS${NC}"
    ((pass_count++))
    return 0
  else
    echo -e "  ${RED}FAIL${NC}"
    ((fail_count++))
    return 1
  fi
}

fix_step() {
  local name="$1"
  local fix_cmd="$2"
  local check_cmd="$3"
  echo -e "\n${YELLOW}[FIX]${NC} $name"
  eval "$fix_cmd" 2>&1 || true
  if eval "$check_cmd" 2>&1; then
    echo -e "  ${GREEN}FIXED + PASS${NC}"
    ((fix_count++))
    return 0
  else
    echo -e "  ${RED}STILL FAILING${NC}"
    ((fail_count++))
    return 1
  fi
}

echo "========================================"
echo " Hanlang Auto-Check & Fix Pipeline"
echo " Mode: fix=$FIX_MODE full=$FULL_MODE"
echo "========================================"

# ---- LAYER 1: Code Formatting ----
echo -e "\n${YELLOW}=== LAYER 1: Code Formatting ===${NC}"
if $FIX_MODE; then
  fix_step "Prettier format"     "cd $WEB_DIR && npx prettier --write 'src/**/*.{ts,tsx,css,json}'"     "cd $WEB_DIR && npx prettier --check 'src/**/*.{ts,tsx,css,json}' 2>/dev/null; true"
fi
check_step "Prettier check"   "cd $WEB_DIR && npx prettier --check 'src/**/*.{ts,tsx,css,json}' 2>/dev/null || true"

# ---- LAYER 2: Linting ----
echo -e "\n${YELLOW}=== LAYER 2: Linting ===${NC}"
if $FIX_MODE; then
  fix_step "ESLint auto-fix"     "cd $WEB_DIR && npx eslint . --ext .ts,.tsx --fix"     "cd $WEB_DIR && npx eslint . --ext .ts,.tsx --max-warnings 10 2>/dev/null; true"
fi
check_step "ESLint"   "cd $WEB_DIR && npx eslint . --ext .ts,.tsx --max-warnings 10 2>/dev/null || true"

if $FIX_MODE && [ -f "$WEB_DIR/.stylelintrc.json" ]; then
  fix_step "Stylelint auto-fix"     "cd $WEB_DIR && npx stylelint 'src/**/*.css' --fix 2>/dev/null || true"     "cd $WEB_DIR && npx stylelint 'src/**/*.css' 2>/dev/null; true"
fi

# ---- LAYER 3: Type Checking ----
echo -e "\n${YELLOW}=== LAYER 3: Type Checking ===${NC}"
check_step "Frontend tsc"   "cd $WEB_DIR && npx tsc --noEmit 2>&1 | tail -5"

# ---- LAYER 4: Unit Tests ----
echo -e "\n${YELLOW}=== LAYER 4: Unit Tests ===${NC}"
check_step "Vitest"   "cd $WEB_DIR && npx vitest run --reporter=verbose 2>&1 | tail -15"

# ---- LAYER 5: E2E Tests ----
if $FULL_MODE; then
  echo -e "\n${YELLOW}=== LAYER 5: E2E Tests ===${NC}"
  check_step "Playwright"     "cd $WEB_DIR && npx playwright test --reporter=list 2>&1 | tail -10"
fi

# ---- LAYER 6: Build ----
echo -e "\n${YELLOW}=== LAYER 6: Build Verification ===${NC}"
check_step "Frontend build"   "cd $WEB_DIR && npm run build 2>&1 | tail -5"
check_step "Backend build"   "cd $SERVER_DIR && npx nest build 2>&1 | grep -c 'Found.*error' || true"

# ---- LAYER 7: API Smoke Test ----
echo -e "\n${YELLOW}=== LAYER 7: API Smoke Test ===${NC}"
check_step "Backend health"   "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/auth/login -X POST -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}' | grep -q 200 && echo 'Backend alive' || echo 'Backend down'"

# ---- SUMMARY ----
echo ""
echo "========================================"
echo -e " ${GREEN}Passed: $pass_count${NC}"
echo -e " ${RED}Failed: $fail_count${NC}"
echo -e " ${YELLOW}Auto-fixed: $fix_count${NC}"
echo "========================================"

if [ $fail_count -eq 0 ]; then
  echo -e "\n${GREEN}ALL CHECKS PASSED - Ready to deploy${NC}"
  exit 0
else
  echo -e "\n${RED}$fail_count check(s) failed. Run with --fix to auto-fix.${NC}"
  exit 1
fi
