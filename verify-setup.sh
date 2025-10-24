#!/bin/bash

# Payroll AI - Quick Verification Script
# This script checks if all necessary files and configurations are in place

echo "🔍 Payroll AI - Configuration Verification"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Track status
all_good=true

echo "📁 Checking Project Structure..."
echo "-----------------------------------"

# Check backend files
if [ -d "backend" ]; then
    check_pass "Backend directory exists"
    
    if [ -f "backend/requirements.txt" ]; then
        check_pass "requirements.txt found"
    else
        check_fail "requirements.txt missing"
        all_good=false
    fi
    
    if [ -f "backend/app/main.py" ]; then
        check_pass "main.py found"
    else
        check_fail "main.py missing"
        all_good=false
    fi
    
    if [ -f "backend/.env.example" ]; then
        check_pass ".env.example found"
    else
        check_warn ".env.example missing"
    fi
    
    if [ -f "backend/.env" ]; then
        check_pass "Backend .env configured"
    else
        check_warn "Backend .env not found (create from .env.example)"
    fi
else
    check_fail "Backend directory missing"
    all_good=false
fi

echo ""
echo "🎨 Checking Frontend..."
echo "-----------------------------------"

# Check frontend files
if [ -d "frontend" ]; then
    check_pass "Frontend directory exists"
    
    if [ -f "frontend/package.json" ]; then
        check_pass "package.json found"
    else
        check_fail "package.json missing"
        all_good=false
    fi
    
    if [ -d "frontend/src" ]; then
        check_pass "src directory exists"
    else
        check_fail "src directory missing"
        all_good=false
    fi
    
    if [ -f "frontend/.env.example" ]; then
        check_pass ".env.example found"
    else
        check_warn ".env.example missing"
    fi
    
    if [ -f "frontend/.env.local" ]; then
        check_pass "Frontend .env.local configured"
    else
        check_warn "Frontend .env.local not found (create from .env.example)"
    fi
    
    if [ -d "frontend/node_modules" ]; then
        check_pass "Dependencies installed"
    else
        check_warn "Dependencies not installed (run: npm install)"
    fi
else
    check_fail "Frontend directory missing"
    all_good=false
fi

echo ""
echo "🗄️  Checking Database Migrations..."
echo "-----------------------------------"

if [ -d "supabase/migrations" ]; then
    check_pass "Migrations directory exists"
    
    if [ -f "supabase/migrations/20251023000001_initial_schema.sql" ]; then
        check_pass "Initial schema migration found"
    else
        check_fail "Initial schema migration missing"
        all_good=false
    fi
    
    if [ -f "supabase/migrations/20251023000002_rls_policies.sql" ]; then
        check_pass "RLS policies migration found"
    else
        check_fail "RLS policies migration missing"
        all_good=false
    fi
else
    check_fail "Migrations directory missing"
    all_good=false
fi

echo ""
echo "📚 Checking Documentation..."
echo "-----------------------------------"

if [ -f "README.md" ]; then
    check_pass "README.md found"
else
    check_warn "README.md missing"
fi

if [ -f "DEPLOYMENT.md" ]; then
    check_pass "DEPLOYMENT.md found"
else
    check_warn "DEPLOYMENT.md missing"
fi

if [ -f "FEATURES.md" ]; then
    check_pass "FEATURES.md found"
else
    check_warn "FEATURES.md missing"
fi

if [ -f "PLAN.md" ]; then
    check_pass "PLAN.md found"
else
    check_warn "PLAN.md missing"
fi

echo ""
echo "=========================================="

if [ "$all_good" = true ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Configure environment variables"
    echo "   2. Follow DEPLOYMENT.md for deployment"
    echo "   3. Run migrations in Supabase"
    echo "   4. Deploy backend to Render"
    echo "   5. Deploy frontend to Vercel"
else
    echo -e "${RED}✗ Some checks failed. Please fix the issues above.${NC}"
    exit 1
fi

echo ""
echo "📖 For detailed instructions, see:"
echo "   - DEPLOYMENT.md: Step-by-step deployment guide"
echo "   - FEATURES.md: Complete features documentation"
echo "   - README.md: Quick start guide"
echo ""
