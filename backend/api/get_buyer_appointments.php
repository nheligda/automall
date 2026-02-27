<?php
/**
 * AUTOMALL - Get Buyer Appointments
 * 
 * GET /backend/api/get_buyer_appointments.php?user_id=4
 * 
 * Response: {
 *   "success": true,
 *   "data": {
 *     "scheduled": array,
 *     "completed": array
 *   }
 * }
 */

require_once '../config.php';

set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_response('Method not allowed', 405);
}

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

if (!validate_user_id($user_id)) {
    error_response('Invalid user_id', 400);
}

try {
    // Get upcoming/current appointments
    $scheduled = fetch_all(
        'SELECT 
            da.Appointment_ID,
            da.Schedule_DateTime,
            da.Appt_Status,
            da.Has_Trade_In,
            vi.Vehicle_ID,
            vi.Make_Model_Year,
            vi.Asking_Price,
            vi.Color,
            CASE 
                WHEN da.Appt_Status = "OTW_Confirmed" THEN vi.Hold_Expiry
                ELSE NULL
            END as hold_expiry
         FROM D3_Master_Calendar da
         JOIN D2_Vehicle_Inventory vi ON da.Target_Vehicle_ID = vi.Vehicle_ID
         WHERE da.User_ID = ? AND da.Appt_Status IN ("Scheduled", "OTW_Confirmed")
         ORDER BY da.Schedule_DateTime DESC',
        [$user_id]
    );
    
    // Get past appointments
    $completed = fetch_all(
        'SELECT 
            da.Appointment_ID,
            da.Schedule_DateTime,
            da.Appt_Status,
            vi.Vehicle_ID,
            vi.Make_Model_Year,
            vi.Asking_Price
         FROM D3_Master_Calendar da
         JOIN D2_Vehicle_Inventory vi ON da.Target_Vehicle_ID = vi.Vehicle_ID
         WHERE da.User_ID = ? AND da.Appt_Status IN ("Completed", "Cancelled", "No_Show")
         ORDER BY da.Schedule_DateTime DESC
         LIMIT 10',
        [$user_id]
    );
    
    json_response(success_response([
        'scheduled' => $scheduled,
        'completed' => $completed
    ], 'Appointments retrieved'));
    
} catch (Exception $e) {
    error_log('Error in get_buyer_appointments.php: ' . $e->getMessage());
    error_response('Error fetching appointments', 500);
}

?>
