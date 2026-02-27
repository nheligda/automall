<?php
/**
 * AUTOMALL - Admin/Staff Vehicle Update (Trade-in Replacement)
 *
 * POST /backend/api/admin/update_vehicle.php
 *
 * Allows staff to update key display fields for an existing vehicle
 * record when a trade-in unit replaces the product being sold.
 */

require_once '../../config.php';

set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

$vehicle_id = $input['vehicle_id'] ?? null;
if (!validate_vehicle_id($vehicle_id)) {
    error_response('Invalid vehicle_id', 400);
}

// Build partial update set based on provided fields
$fields = [];

if (isset($input['make_model_year']) && $input['make_model_year'] !== '') {
    $fields['Make_Model_Year'] = $input['make_model_year'];
}
if (array_key_exists('mileage', $input)) {
    $mileage = (int) $input['mileage'];
    if ($mileage < 0) {
        error_response('Invalid mileage', 400);
    }
    $fields['Mileage'] = $mileage;
}
if (isset($input['fuel_type']) && $input['fuel_type'] !== '') {
    $fields['Fuel_Type'] = $input['fuel_type'];
}
if (isset($input['transmission']) && $input['transmission'] !== '') {
    $fields['Transmission'] = $input['transmission'];
}
if (isset($input['color']) && $input['color'] !== '') {
    $fields['Color'] = $input['color'];
}
if (isset($input['description'])) {
    $fields['Description'] = $input['description'] !== '' ? $input['description'] : null;
}

if (empty($fields)) {
    error_response('No updatable fields provided', 400);
}

try {
    // Ensure vehicle exists
    $existing = fetch_one(
        'SELECT Vehicle_ID FROM D2_Vehicle_Inventory WHERE Vehicle_ID = ?',
        [$vehicle_id]
    );

    if (!$existing) {
        error_response('Vehicle not found', 404);
    }

    update_record('D2_Vehicle_Inventory', $fields, 'Vehicle_ID = ?', [$vehicle_id]);

    json_response(success_response([
        'vehicle_id' => (int) $vehicle_id,
        'updated_fields' => array_keys($fields),
    ], 'Vehicle details updated successfully'));
} catch (Exception $e) {
    error_log('Error in admin/update_vehicle.php: ' . $e->getMessage());
    error_response('Failed to update vehicle details', 500);
}
