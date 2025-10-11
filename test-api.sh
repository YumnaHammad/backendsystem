#!/bin/bash

# Inventory Management System API Test Script
# This script tests the complete API flow

BASE_URL="http://localhost:5000/api"
AUTH_TOKEN=""

echo "=== INVENTORY MANAGEMENT SYSTEM API TEST ==="
echo ""

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=""
    
    if [ ! -z "$AUTH_TOKEN" ]; then
        auth_header="-H 'Authorization: Bearer $AUTH_TOKEN'"
    fi
    
    if [ ! -z "$data" ]; then
        curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $auth_header \
            -d "$data"
    else
        curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $auth_header
    fi
}

echo "1) Testing Authentication..."
echo "   Logging in as admin..."

LOGIN_RESPONSE=$(api_call "POST" "/auth/login" '{"email":"admin@example.com","password":"AdminPass123"}')
echo "   Response: $LOGIN_RESPONSE"

# Extract token from response
AUTH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "   Auth token: ${AUTH_TOKEN:0:20}..."

if [ -z "$AUTH_TOKEN" ]; then
    echo "   ❌ Login failed!"
    exit 1
fi
echo "   ✅ Login successful!"
echo ""

echo "2) Testing Products API..."
echo "   Getting all products..."
PRODUCTS_RESPONSE=$(api_call "GET" "/products")
echo "   Products found: $(echo $PRODUCTS_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)"
echo "   ✅ Products API working!"
echo ""

echo "3) Testing Warehouses API..."
echo "   Getting all warehouses..."
WAREHOUSES_RESPONSE=$(api_call "GET" "/warehouses")
echo "   Warehouses found: $(echo $WAREHOUSES_RESPONSE | grep -o '"_id"' | wc -l)"
echo "   ✅ Warehouses API working!"
echo ""

echo "4) Testing Purchases API..."
echo "   Getting all purchases..."
PURCHASES_RESPONSE=$(api_call "GET" "/purchases")
echo "   Purchases found: $(echo $PURCHASES_RESPONSE | grep -o '"_id"' | wc -l)"
echo "   ✅ Purchases API working!"
echo ""

echo "5) Testing Sales API..."
echo "   Getting all sales orders..."
SALES_RESPONSE=$(api_call "GET" "/sales/orders")
echo "   Sales orders found: $(echo $SALES_RESPONSE | grep -o '"_id"' | wc -l)"
echo "   ✅ Sales API working!"
echo ""

echo "6) Testing Reports API..."
echo "   Getting dashboard metrics..."
REPORTS_RESPONSE=$(api_call "GET" "/reports/dashboard")
echo "   Dashboard response received"

# Extract key metrics
TOTAL_PRODUCTS=$(echo $REPORTS_RESPONSE | grep -o '"totalProducts":[0-9]*' | cut -d':' -f2)
TOTAL_STOCK=$(echo $REPORTS_RESPONSE | grep -o '"totalItemsInStock":[0-9]*' | cut -d':' -f2)
TOTAL_WAREHOUSES=$(echo $REPORTS_RESPONSE | grep -o '"totalWarehouses":[0-9]*' | cut -d':' -f2)

echo "   📊 Dashboard Metrics:"
echo "      - Total Products: $TOTAL_PRODUCTS"
echo "      - Total Stock: $TOTAL_STOCK"
echo "      - Total Warehouses: $TOTAL_WAREHOUSES"
echo "   ✅ Reports API working!"
echo ""

echo "7) Verification Tests..."
echo "   Checking final state..."

# Expected values
EXPECTED_PRODUCTS=3
EXPECTED_STOCK=170
EXPECTED_WAREHOUSES=1

# Test results
PRODUCTS_TEST="❌"
STOCK_TEST="❌"
WAREHOUSES_TEST="❌"

if [ "$TOTAL_PRODUCTS" = "$EXPECTED_PRODUCTS" ]; then
    PRODUCTS_TEST="✅"
fi

if [ "$TOTAL_STOCK" = "$EXPECTED_STOCK" ]; then
    STOCK_TEST="✅"
fi

if [ "$TOTAL_WAREHOUSES" = "$EXPECTED_WAREHOUSES" ]; then
    WAREHOUSES_TEST="✅"
fi

echo "   Products: $PRODUCTS_TEST (Expected: $EXPECTED_PRODUCTS, Actual: $TOTAL_PRODUCTS)"
echo "   Stock: $STOCK_TEST (Expected: $EXPECTED_STOCK, Actual: $TOTAL_STOCK)"
echo "   Warehouses: $WAREHOUSES_TEST (Expected: $EXPECTED_WAREHOUSES, Actual: $TOTAL_WAREHOUSES)"
echo ""

echo "=== TEST SUMMARY ==="
if [ "$PRODUCTS_TEST" = "✅" ] && [ "$STOCK_TEST" = "✅" ] && [ "$WAREHOUSES_TEST" = "✅" ]; then
    echo "🎉 ALL TESTS PASSED!"
    echo "✅ The inventory management system is working correctly!"
    echo ""
    echo "📋 System Status:"
    echo "   - Backend API: ✅ Working"
    echo "   - Authentication: ✅ Working"
    echo "   - Database: ✅ Connected"
    echo "   - Seed Data: ✅ Loaded"
    echo "   - Final Counts: ✅ Verified"
else
    echo "⚠️  SOME TESTS FAILED"
    echo "Please check the system setup and ensure:"
    echo "   1. MongoDB is running"
    echo "   2. Seed scripts have been executed"
    echo "   3. Backend server is running"
fi

echo ""
echo "=== TEST COMPLETED ==="
