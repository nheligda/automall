<?php
/**
 * AUTOMALL - Schedule Viewing Appointment
 *
 * POST /backend/api/schedule_appointment.php
 * Body JSON:
 *   - user_id: int (buyer)
 *   - vehicle_id: int
 *   - schedule_datetime: string (ISO/local datetime)
 */

require_once '../config.php';

set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

$user_id = isset($input['user_id']) ? (int)$input['user_id'] : null;
$vehicle_id = isset($input['vehicle_id']) ? (int)$input['vehicle_id'] : null;
$schedule_datetime = $input['schedule_datetime'] ?? null;

if (!validate_user_id($user_id)) {
    error_response('Invalid user_id', 400);
}

if (!validate_vehicle_id($vehicle_id)) {
    error_response('Invalid vehicle_id', 400);
}

if (!$schedule_datetime || !is_string($schedule_datetime)) {
    error_response('schedule_datetime is required', 400);
}

try {
    // Normalise datetime string to MySQL DATETIME format
    $timestamp = strtotime($schedule_datetime);
    if ($timestamp === false) {
        error_response('Invalid schedule_datetime format', 400);
    }
    $schedule = date('Y-m-d H:i:s', $timestamp);

    // Ensure vehicle exists and is available for viewing
    $vehicle = fetch_one(
        'SELECT Vehicle_ID, Vehicle_Status FROM D2_Vehicle_Inventory WHERE Vehicle_ID = ?',
        [$vehicle_id]
    );

    if (!$vehicle) {
        error_response('Vehicle not found', 404);
    }

    if (!in_array($vehicle['Vehicle_Status'], ['Available', 'On_Hold'], true)) {
        error_response('Vehicle is not available for viewing', 409);
    }

    // Insert appointment into D3_Master_Calendar
    $appointment_id = insert_record('D3_Master_Calendar', [
        'User_ID' => $user_id,
        'Target_Vehicle_ID' => $vehicle_id,
        'Appt_Type' => 'Viewing',
        'Schedule_DateTime' => $schedule,
        'Has_Trade_In' => false,
        'Appt_Status' => 'Scheduled',
    ]);

    json_response(success_response([
        'appointment_id' => $appointment_id,
        'user_id' => $user_id,
        'vehicle_id' => $vehicle_id,
        'schedule_datetime' => $schedule,
    ], 'Appointment scheduled successfully'), 201);
} catch (Exception $e) {
    error_log('Error in schedule_appointment.php: ' . $e->getMessage());
    error_response('Failed to schedule appointment', 500);
}

?>
