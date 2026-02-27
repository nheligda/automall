#!/bin/bash
# AUTOMALL - API Testing Script
# Run this script to test all backend endpoints

BASE_URL="http://localhost/automall proj/backend/api"
API_TIMEOUT=10

echo "======================================"
echo "🚗 AUTOMALL - API Testing Suite"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing: $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${BASE_URL}/${endpoint}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓${NC}"
        ((PASSED++))
        
        # Check for success flag
        if echo "$body" | grep -q '"success":true'; then
            echo "  Response: $(echo $body | head -c 100)..."
        else
            echo "  Warning: Success flag not true"
            echo "  Response: $body"
        fi
    else
        echo -e "${RED}✗ (HTTP $http_code)${NC}"
        ((FAILED++))
        echo "  Response: $body"
    fi
    echo ""
}

# Test 1: Health Check (Backend is running)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 1: Connection Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -n "Testing: Backend availability... "
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/get_available_vehicles.php" | grep -q "200"; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED++))
    echo "ERROR: Backend not responding!"
    echo "Make sure:"
    echo "  1. XAMPP Apache is running"
    echo "  2. http://localhost is accessible"
    echo "  3. PHP backend files are in correct location"
    exit 1
fi
echo ""

# Test 2: Database Connection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 2: Database Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "GET" "get_available_vehicles.php" "" \
    "Database connection (via get_available_vehicles)"

# Test 3: API Endpoints
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 3: API Endpoint Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "GET" "get_available_vehicles.php?page=1&limit=10" "" \
    "Get Available Vehicles (Paginated)"

test_endpoint "GET" "get_available_vehicles.php?search=Mitsubishi" "" \
    "Search Vehicles by Make/Model"

test_endpoint "GET" "get_vehicle_detail.php?vehicle_id=1" "" \
    "Get Single Vehicle Detail"

test_endpoint "GET" "get_buyer_appointments.php?user_id=4" "" \
    "Get Buyer Appointments"

# Test 4: OTW Hold (POST)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 4: OTW Hold Tests (Simulated)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Note: This will fail if appointment doesn't exist, which is expected
test_endpoint "POST" "apply_otw_hold.php" \
    '{"user_id":4,"vehicle_id":1,"appointment_id":999}' \
    "Apply OTW Hold (Expected to fail - appointment doesn't exist)"

# Test 5: Error Handling
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 5: Error Handling Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -n "Testing: Invalid vehicle ID... "
response=$(curl -s "$BASE_URL/get_vehicle_detail.php?vehicle_id=invalid")
if echo "$response" | grep -q "error\|Invalid"; then
    echo -e "${GREEN}✓ (Properly rejected)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ (Should have rejected invalid ID)${NC}"
    ((FAILED++))
fi
echo ""

echo -n "Testing: Missing required parameter... "
response=$(curl -s "$BASE_URL/get_buyer_appointments.php")
if echo "$response" | grep -q "error\|Invalid"; then
    echo -e "${GREEN}✓ (Properly rejected)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ (Should have rejected missing parameter)${NC}"
    ((FAILED++))
fi
echo ""

# Test 6: CORS Headers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 6: CORS Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -n "Testing: CORS headers present... "
headers=$(curl -s -I "$BASE_URL/get_available_vehicles.php")
if echo "$headers" | grep -q "Access-Control-Allow"; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} (CORS headers not found - may cause browser issues)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start frontend: npm run dev"
    echo "  2. Open http://localhost:5173"
    echo "  3. Test the OTW flow in browser"
else
    echo ""
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Is XAMPP Apache running? (XAMPP Control Panel)"
    echo "  2. Is MySQL running? (XAMPP Control Panel)"
    echo "  3. Check PHP error logs: C:\\xampp\\apache\\logs\\error.log"
    echo "  4. Run health check: http://localhost/automall proj/backend/health_check.php"
fi

echo ""
