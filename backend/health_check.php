<?php
/**
 * AUTOMALL - Database Verification & Health Check
 * Run this script to verify backend setup
 */

require_once 'config.php';

echo "=== AUTOMALL Health Check ===\n\n";

// 1. Check PHP Version
echo "1. PHP Version: " . phpversion() . "\n";
if (version_compare(phpversion(), '7.4', '>=')) {
    echo "   ✓ PHP version OK\n";
} else {
    echo "   ✗ PHP 7.4+ required\n";
}

// 2. Check Database Connection
echo "\n2. Database Connection:\n";
try {
    $test_query = $db->query("SELECT 1");
    echo "   ✓ Connected to MySQL\n";
    
    // Get database name
    $db_info = $db->query("SELECT DATABASE() as db_name")->fetch();
    echo "   Database: " . $db_info['db_name'] . "\n";
} catch (Exception $e) {
    echo "   ✗ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// 3. Check Required Tables
echo "\n3. Required Tables:\n";
$required_tables = [
    'D1_Unified_Accounts',
    'D2_Vehicle_Inventory',
    'D3_Master_Calendar',
    'D4_Transaction_Records',
    'D5_Slot_Storage',
    'D7_Billing_Records',
    'D8_Inquiry_Log'
];

foreach ($required_tables as $table) {
    try {
        $result = $db->query("SHOW TABLES LIKE '$table'")->fetch();
        if ($result) {
            echo "   ✓ $table\n";
        } else {
            echo "   ✗ $table (MISSING)\n";
        }
    } catch (Exception $e) {
        echo "   ✗ $table (Error: " . $e->getMessage() . ")\n";
    }
}

// 4. Check Test Data
echo "\n4. Test Data:\n";
try {
    $user_count = $db->query("SELECT COUNT(*) as count FROM D1_Unified_Accounts")->fetch();
    echo "   Users: " . $user_count['count'] . "\n";
    
    $vehicle_count = $db->query("SELECT COUNT(*) as count FROM D2_Vehicle_Inventory")->fetch();
    echo "   Vehicles: " . $vehicle_count['count'] . "\n";
    
    $appointment_count = $db->query("SELECT COUNT(*) as count FROM D3_Master_Calendar")->fetch();
    echo "   Appointments: " . $appointment_count['count'] . "\n";
} catch (Exception $e) {
    echo "   ✗ Error fetching counts\n";
}

// 5. Check File Permissions
echo "\n5. File Permissions:\n";
$backend_files = [
    '../config.php' => 'Backend Config',
    '../api/apply_otw_hold.php' => 'Apply OTW Hold API',
    '../api/get_available_vehicles.php' => 'Get Vehicles API',
];

foreach ($backend_files as $file => $desc) {
    $path = __DIR__ . '/' . $file;
    if (file_exists($path) && is_readable($path)) {
        echo "   ✓ $desc (readable)\n";
    } else {
        echo "   ✗ $desc (not found or not readable)\n";
    }
}

// 6. Test API Endpoints
echo "\n6. API Endpoints Test:\n";
$test_endpoints = [
    'get_available_vehicles.php',
    'get_vehicle_detail.php?vehicle_id=1',
];

foreach ($test_endpoints as $endpoint) {
    $url = "http://localhost/automall proj/backend/api/" . $endpoint;
    $context = stream_context_create(['http' => ['timeout' => 5]]);
    $response = @file_get_contents($url, false, $context);
    
    if ($response) {
        $data = json_decode($response, true);
        if ($data && isset($data['success'])) {
            echo "   ✓ $endpoint\n";
        } else {
            echo "   ? $endpoint (returned data but unclear format)\n";
        }
    } else {
        echo "   ✗ $endpoint (unreachable - ensure Apache is running)\n";
    }
}

// 7. Summary
echo "\n=== Health Check Complete ===\n";
echo "If all checks passed (✓), your AUTOMALL backend is ready!\n";
echo "\nNext steps:\n";
echo "1. Update frontend .env with API_BASE: http://localhost/automall proj/backend/api\n";
echo "2. Run: npm install && npm run dev\n";
echo "3. Open: http://localhost:5173\n";

?>
