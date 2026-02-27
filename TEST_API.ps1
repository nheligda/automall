# AUTOMALL - API Testing Script (PowerShell)
# Run this script to test all backend endpoints

$BaseUrl = "http://localhost/automall proj/backend/api"
$Passed = 0
$Failed = 0

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🚗 AUTOMALL - API Testing Suite (PowerShell)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Data,
        [string]$Description
    )
    
    Write-Host "Testing: $Description... " -NoNewline
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri "$BaseUrl/$Endpoint" -Method GET -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri "$BaseUrl/$Endpoint" -Method POST `
                -Headers @{"Content-Type" = "application/json"} `
                -Body $Data -ErrorAction Stop
        }
        
        $statusCode = $response.StatusCode
        $body = $response.Content
        
        if ($statusCode -eq 200) {
            Write-Host "✓" -ForegroundColor Green
            $script:Passed++
            
            if ($body | Select-String -Pattern '"success":true') {
                Write-Host "  Response: $(($body | Select-String -Pattern '.{1,80}').Line)"
            } else {
                Write-Host "  Warning: Success flag not true"
            }
        } else {
            Write-Host "✗ (HTTP $statusCode)" -ForegroundColor Red
            $script:Failed++
        }
    } catch {
        Write-Host "✗ (Error: $_)" -ForegroundColor Red
        $script:Failed++
    }
    Write-Host ""
}

# PHASE 1: Connection Tests
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PHASE 1: Connection Tests" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host -NoNewline "Testing: Backend availability... "
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/get_available_vehicles.php" `
        -Method GET -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "✗" -ForegroundColor Red
        $Failed++
    }
} catch {
    Write-Host "✗" -ForegroundColor Red
    $Failed++
    Write-Host "ERROR: Backend not responding!"
    Write-Host "Make sure:"
    Write-Host "  1. XAMPP Apache is running"
    Write-Host "  2. http://localhost is accessible"
    Write-Host "  3. PHP backend files are in correct location"
    exit 1
}
Write-Host ""

# PHASE 2: Database Tests
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PHASE 2: Database Tests" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Test-Endpoint "GET" "get_available_vehicles.php" "" `
    "Database connection (via get_available_vehicles)"

# PHASE 3: API Endpoints
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PHASE 3: API Endpoint Tests" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Test-Endpoint "GET" "get_available_vehicles.php?page=1&limit=10" "" `
    "Get Available Vehicles (Paginated)"

Test-Endpoint "GET" "get_available_vehicles.php?search=Mitsubishi" "" `
    "Search Vehicles by Make/Model"

Test-Endpoint "GET" "get_vehicle_detail.php?vehicle_id=1" "" `
    "Get Single Vehicle Detail"

Test-Endpoint "GET" "get_buyer_appointments.php?user_id=4" "" `
    "Get Buyer Appointments"

# PHASE 4: OTW Hold (POST)
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PHASE 4: OTW Hold Tests (Simulated)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$otpBody = @{
    user_id = 4
    vehicle_id = 1
    appointment_id = 999
} | ConvertTo-Json

Test-Endpoint "POST" "apply_otw_hold.php" $otpBody `
    "Apply OTW Hold (Expected to fail - appointment doesn't exist)"

# PHASE 5: Error Handling
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PHASE 5: Error Handling Tests" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host -NoNewline "Testing: Invalid vehicle ID... "
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/get_vehicle_detail.php?vehicle_id=invalid" `
        -Method GET -ErrorAction SilentlyContinue
    if ($response.Content | Select-String -Pattern "error|Invalid") {
        Write-Host "✓ (Properly rejected)" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "✗ (Should have rejected)" -ForegroundColor Red
        $Failed++
    }
} catch {
    Write-Host "✓ (Properly rejected)" -ForegroundColor Green
    $Passed++
}
Write-Host ""

# PHASE 6: Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Test Results" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "Passed: " -NoNewline
Write-Host "$Passed" -ForegroundColor Green

Write-Host "Failed: " -NoNewline
Write-Host "$Failed" -ForegroundColor Red

Write-Host ""

if ($Failed -eq 0) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Start frontend: npm run dev"
    Write-Host "  2. Open http://localhost:5173"
    Write-Host "  3. Test the OTW flow in browser"
} else {
    Write-Host "✗ Some tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "  1. Is XAMPP Apache running? (XAMPP Control Panel)"
    Write-Host "  2. Is MySQL running? (XAMPP Control Panel)"
    Write-Host "  3. Check PHP error logs: C:\xampp\apache\logs\error.log"
    Write-Host "  4. Run health check: http://localhost/automall proj/backend/health_check.php"
}

Write-Host ""
