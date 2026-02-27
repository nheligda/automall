<?php
/**
 * AUTOMALL - Get Vehicle Details
 * 
 * GET /backend/api/get_vehicle_detail.php?vehicle_id=1
 * 
 * Response: {
 *   "success": true,
 *   "data": { vehicle details }
 * }
 */

require_once '../config.php';

set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_response('Method not allowed', 405);
}

$vehicle_id = isset($_GET['vehicle_id']) ? (int)$_GET['vehicle_id'] : null;

if (!validate_vehicle_id($vehicle_id)) {
    error_response('Invalid vehicle_id', 400);
}

try {
    $vehicle = fetch_one(
        'SELECT 
            vi.Vehicle_ID,
            vi.Make_Model_Year,
            vi.Asking_Price,
            vi.Mileage,
            vi.Fuel_Type,
            vi.Color,
            vi.Transmission,
            vi.Plate_Number,
            vi.Description,
            vi.Vehicle_Status,
            vi.OR_CR_Image_URL,
            vi.Created_At,
            ua.First_Name AS Seller_First_Name,
            ua.Last_Name AS Seller_Last_Name,
            ua.Phone_Number AS Seller_Phone,
            ua.Email AS Seller_Email,
            ss.Slot_ID
         FROM D2_Vehicle_Inventory vi
         JOIN D1_Unified_Accounts ua ON vi.Owner_ID = ua.User_ID
         LEFT JOIN D5_Slot_Storage ss ON vi.Assigned_Slot_ID = ss.Slot_ID
         WHERE vi.Vehicle_ID = ? AND vi.Vehicle_Status IN ("Available", "On_Hold")',
        [$vehicle_id]
    );
    
    if (!$vehicle) {
        error_response('Vehicle not found or not available', 404);
    }
    
    json_response(success_response($vehicle, 'Vehicle details retrieved'));
    
} catch (Exception $e) {
    error_log('Error in get_vehicle_detail.php: ' . $e->getMessage());
    error_response('Error fetching vehicle details', 500);
}

?>
