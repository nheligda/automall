<?php
/**
 * AUTOMALL - Apply OTW (On-The-Way) Soft Hold
 * 
 * POST /backend/api/apply_otw_hold.php
 * 
 * Receives: JSON {
 *   "user_id": int,
 *   "vehicle_id": int,
 *   "appointment_id": int
 * }
 * 
 * Response: {
 *   "success": true/false,
 *   "message": string,
 *   "data": {
 *     "vehicle_id": int,
 *     "vehicle_status": string,
 *     "hold_expiry": datetime
 *   }
 * }
 */

require_once '../config.php';

set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

// Validation
if (!isset($input['user_id']) || !validate_user_id($input['user_id'])) {
    error_response('Invalid user_id', 400);
}

if (!isset($input['vehicle_id']) || !validate_vehicle_id($input['vehicle_id'])) {
    error_response('Invalid vehicle_id', 400);
}

if (!isset($input['appointment_id']) || !is_numeric($input['appointment_id'])) {
    error_response('Invalid appointment_id', 400);
}

$user_id = $input['user_id'];
$vehicle_id = $input['vehicle_id'];
$appointment_id = $input['appointment_id'];

try {
    // Step 1: Verify appointment exists and belongs to user
    $appointment = fetch_one(
        'SELECT * FROM D3_Master_Calendar 
         WHERE Appointment_ID = ? AND User_ID = ? AND Target_Vehicle_ID = ?',
        [$appointment_id, $user_id, $vehicle_id]
    );
    
    if (!$appointment) {
        error_response('Appointment not found or unauthorized', 404);
    }
    
    if ($appointment['Appt_Status'] !== 'Scheduled') {
        error_response('Appointment is not in Scheduled status', 400);
    }
    
    // Step 2: Check if vehicle is still available
    $vehicle = fetch_one(
        'SELECT Vehicle_ID, Vehicle_Status, Assigned_Slot_ID FROM D2_Vehicle_Inventory 
         WHERE Vehicle_ID = ?',
        [$vehicle_id]
    );
    
    if (!$vehicle) {
        error_response('Vehicle not found', 404);
    }
    
    if ($vehicle['Vehicle_Status'] !== 'Available') {
        error_response(
            'Vehicle is no longer available. Status: ' . $vehicle['Vehicle_Status'],
            409
        );
    }
    
    // Step 3: Calculate 2-hour expiry time
    $hold_expiry = add_hours(2);
    
    // Step 4: Update vehicle status to On_Hold (START TRANSACTION for data integrity)
    $db->beginTransaction();
    
    update_record(
        'D2_Vehicle_Inventory',
        [
            'Vehicle_Status' => 'On_Hold',
            'Hold_Expiry' => $hold_expiry
        ],
        'Vehicle_ID = ?',
        [$vehicle_id]
    );
    
    // Step 5: Update appointment status to OTW_Confirmed
    update_record(
        'D3_Master_Calendar',
        [
            'Appt_Status' => 'OTW_Confirmed',
            'Confirmation_Sent_At' => date('Y-m-d H:i:s')
        ],
        'Appointment_ID = ?',
        [$appointment_id]
    );
    
    $db->commit();
    
    // Step 6: Log this action (optional but recommended for audit trail)
    $log_message = "OTW Hold applied: User $user_id confirmed for Vehicle $vehicle_id. Expires: $hold_expiry";
    error_log($log_message);
    
    // Step 7: Return success response
    json_response(
        success_response([
            'vehicle_id' => $vehicle_id,
            'vehicle_status' => 'On_Hold',
            'hold_expiry' => $hold_expiry,
            'message' => 'Vehicle is now on hold. You have 2 hours to arrive at the showroom.'
        ], 'OTW Hold successfully applied'),
        200
    );
    
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Database error in apply_otw_hold.php: ' . $e->getMessage());
    error_response('Database error: ' . ($GLOBALS['API_DEBUG'] ? $e->getMessage() : 'Failed to apply hold'), 500);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Error in apply_otw_hold.php: ' . $e->getMessage());
    error_response('An error occurred: ' . ($GLOBALS['API_DEBUG'] ? $e->getMessage() : 'Please try again'), 500);
}

?>
