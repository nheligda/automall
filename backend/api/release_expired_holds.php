<?php
/**
 * AUTOMALL - Release Expired OTW Holds
 * 
 * POST /backend/api/release_expired_holds.php
 * 
 * CRON JOB or called periodically to free up holds that expired
 * This should be called every few minutes (recommend: every 5-10 minutes)
 * 
 * Response: {
 *   "success": true/false,
 *   "released_count": int,
 *   "vehicles": array
 * }
 */

require_once '../config.php';

set_cors_headers();

try {
    // Step 1: Find all vehicles with expired holds
    $expired_vehicles = fetch_all(
        'SELECT Vehicle_ID, Hold_Expiry FROM D2_Vehicle_Inventory 
         WHERE Vehicle_Status = "On_Hold" AND Hold_Expiry < NOW()'
    );
    
    if (empty($expired_vehicles)) {
        json_response(success_response(
            ['released_count' => 0, 'vehicles' => []],
            'No expired holds found'
        ));
    }
    
    $db->beginTransaction();
    
    foreach ($expired_vehicles as $vehicle) {
        // Step 2: Update vehicle status back to Available
        update_record(
            'D2_Vehicle_Inventory',
            [
                'Vehicle_Status' => 'Available',
                'Hold_Expiry' => null
            ],
            'Vehicle_ID = ?',
            [$vehicle['Vehicle_ID']]
        );
        
        // Step 3: Update related appointment status
        update_record(
            'D3_Master_Calendar',
            ['Appt_Status' => 'No_Show'],
            'Target_Vehicle_ID = ? AND Appt_Status = "OTW_Confirmed"',
            [$vehicle['Vehicle_ID']]
        );
        
        error_log("Auto-released OTW hold for Vehicle {$vehicle['Vehicle_ID']} (expired at {$vehicle['Hold_Expiry']})");
    }
    
    $db->commit();
    
    json_response(success_response([
        'released_count' => count($expired_vehicles),
        'vehicles' => array_column($expired_vehicles, 'Vehicle_ID')
    ], count($expired_vehicles) . ' expired hold(s) released'));
    
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Error in release_expired_holds.php: ' . $e->getMessage());
    error_response('Error releasing expired holds', 500);
}

?>
