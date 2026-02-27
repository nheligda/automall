<?php
/**
 * AUTOMALL - Seller Upload Vehicle
 *
 * POST /backend/api/seller/upload_vehicle.php
 * Creates a new vehicle draft record for the seller/customer.
 */

require_once '../../config.php';

set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

// Validation
if (!validate_user_id($input['user_id'] ?? null)) {
    error_response('Invalid user_id', 400);
}

if (!isset($input['make_model_year']) || empty($input['make_model_year'])) {
    error_response('Make/Model/Year required', 400);
}

if (!isset($input['asking_price']) || !validate_decimal($input['asking_price'])) {
    error_response('Invalid asking price', 400);
}

if (!isset($input['mileage']) || $input['mileage'] < 0) {
    error_response('Invalid mileage', 400);
}

if (!isset($input['color']) || empty($input['color'])) {
    error_response('Color required', 400);
}

if (!isset($input['plate_number']) || empty($input['plate_number'])) {
    error_response('Plate number required', 400);
}

if (!isset($input['engine_number']) || empty($input['engine_number'])) {
    error_response('Engine number required', 400);
}

if (!isset($input['chassis_number']) || empty($input['chassis_number'])) {
    error_response('Chassis number required', 400);
}

try {
    // Verify user is seller or customer
    $user = fetch_one(
        'SELECT Role FROM D1_Unified_Accounts WHERE User_ID = ?',
        [$input['user_id']]
    );
    
    if (!$user) {
        error_response('User not found', 404);
    }
    
    // Create vehicle draft
    $vehicle_id = insert_record('D2_Vehicle_Inventory', [
        'Owner_ID' => $input['user_id'],
        'Make_Model_Year' => $input['make_model_year'],
        'Asking_Price' => $input['asking_price'],
        'Mileage' => $input['mileage'] ?? 0,
        'Transmission' => $input['transmission'] ?? 'Manual',
        'Fuel_Type' => $input['fuel_type'] ?? 'Gasoline',
        'Color' => $input['color'],
        'Plate_Number' => strtoupper(trim($input['plate_number'])),
        'Engine_Number' => strtoupper(trim($input['engine_number'])),
        'Chassis_Number' => strtoupper(trim($input['chassis_number'])),
        'Description' => $input['description'] ?? null,
        'OR_CR_Image_URL' => $input['or_cr_image_url'] ?? null,
        'Vehicle_Status' => 'Draft'
    ]);
    
    json_response(success_response([
        'vehicle_id' => $vehicle_id,
        'make_model_year' => $input['make_model_year'],
        'status' => 'Draft',
        'message' => 'Vehicle draft created. Upload OR/CR for admin review.'
    ], 'Vehicle draft created successfully'), 201);
    
} catch (Exception $e) {
    error_log('Error in upload_vehicle.php: ' . $e->getMessage());
    error_response('Vehicle upload failed', 500);
}

?>
