<?php
/**
 * AUTOMALL - Record Walk-in & Trade-in (Process 15)
 *
 * POST /backend/api/record_walkin.php
 * Body JSON:
 *   - staff_id: int (who is logging the walk-in)
 *   - visitor_user_id: int|null (existing buyer/seller account, optional)
 *   - vehicle_id: int (target vehicle the buyer is viewing or selling against)
 *   - schedule_datetime: string (optional; defaults to NOW)
 *   - role: "buyer" | "seller" | "both" (for reporting only)
 *   - has_trade_in: bool
 *   - trade_in_details: string (optional; summary of trade-in unit)
 */

require_once '../config.php';

set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

$staff_id = isset($input['staff_id']) ? (int)$input['staff_id'] : null;
$visitor_user_id = isset($input['visitor_user_id']) && $input['visitor_user_id'] !== ''
    ? (int)$input['visitor_user_id']
    : null;
$vehicle_id = isset($input['vehicle_id']) ? (int)$input['vehicle_id'] : null;
$schedule_datetime = $input['schedule_datetime'] ?? null;
$role = isset($input['role']) && in_array($input['role'], ['buyer', 'seller', 'both'], true)
    ? $input['role']
    : 'buyer';
$has_trade_in = isset($input['has_trade_in']) ? (bool)$input['has_trade_in'] : false;
$trade_in_details = isset($input['trade_in_details']) ? trim((string)$input['trade_in_details']) : null;

if (!validate_user_id($staff_id)) {
    error_response('Invalid staff_id', 400);
}

if (!validate_vehicle_id($vehicle_id)) {
    error_response('Invalid vehicle_id', 400);
}

if ($visitor_user_id !== null && !validate_user_id($visitor_user_id)) {
    error_response('Invalid visitor_user_id', 400);
}

try {
    // Normalise datetime; default to NOW if not supplied
    if ($schedule_datetime) {
        $timestamp = strtotime($schedule_datetime);
        if ($timestamp === false) {
            error_response('Invalid schedule_datetime format', 400);
        }
        $schedule = date('Y-m-d H:i:s', $timestamp);
    } else {
        $schedule = date('Y-m-d H:i:s');
    }

    // Ensure vehicle exists
    $vehicle = fetch_one(
        'SELECT Vehicle_ID, Vehicle_Status FROM D2_Vehicle_Inventory WHERE Vehicle_ID = ?',
        [$vehicle_id]
    );

    if (!$vehicle) {
        error_response('Vehicle not found', 404);
    }

    // Insert appointment into D3_Master_Calendar as Walk_In
    $appointment_id = insert_record('D3_Master_Calendar', [
        'User_ID' => $visitor_user_id,
        'Target_Vehicle_ID' => $vehicle_id,
        'Appt_Type' => 'Walk_In',
        'Schedule_DateTime' => $schedule,
        'Has_Trade_In' => $has_trade_in,
        'Trade_In_Details' => $trade_in_details,
        'Appt_Status' => 'Completed',
    ]);

    json_response(success_response([
        'appointment_id' => $appointment_id,
        'vehicle_id' => $vehicle_id,
        'visitor_user_id' => $visitor_user_id,
        'has_trade_in' => $has_trade_in,
        'role' => $role,
        'schedule_datetime' => $schedule,
    ], 'Walk-in & trade-in recorded'), 201);
} catch (Exception $e) {
    error_log('Error in record_walkin.php: ' . $e->getMessage());
    error_response('Failed to record walk-in', 500);
}

?>
