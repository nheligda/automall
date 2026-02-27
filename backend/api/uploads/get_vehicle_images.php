<?php
/**
 * AUTOMALL - Get public vehicle photos (car images only)
 * GET /backend/api/uploads/get_vehicle_images.php?vehicle_id=123
 */

require_once '../../config.php';

set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_response('Method not allowed', 405);
}

$vehicle_id = isset($_GET['vehicle_id']) ? (int) $_GET['vehicle_id'] : 0;
if (!validate_vehicle_id($vehicle_id)) {
    error_response('Invalid vehicle_id', 400);
}

// Helper must mirror logic in file_upload.php
function slugify_make_model_local($text, $fallback)
{
    $text = strtolower(trim((string) $text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    $text = trim($text, '-');
    return $text !== '' ? $text : $fallback;
}

try {
    $vehicle = fetch_one(
        'SELECT Vehicle_ID, Owner_ID, Make_Model_Year FROM D2_Vehicle_Inventory WHERE Vehicle_ID = ?',
        [$vehicle_id]
    );

    if (!$vehicle) {
        error_response('Vehicle not found', 404);
    }

    $userId = (int) $vehicle['Owner_ID'];
    $slug = slugify_make_model_local($vehicle['Make_Model_Year'] ?? '', 'vehicle-' . $vehicle['Vehicle_ID']);

    $baseDir = __DIR__ . '/../../uploads/';
    $carDir = rtrim($baseDir, '/\\') . '/user_' . $userId . '/cars/' . $slug . '/';

    $images = [];
    if (is_dir($carDir)) {
        $files = scandir($carDir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png'])) {
                continue;
            }
            $images[] = [
                'filename' => $file,
                'url' => 'uploads/user_' . $userId . '/cars/' . $slug . '/' . $file,
            ];
        }
    }

    json_response(success_response([
        'vehicle_id' => $vehicle_id,
        'image_count' => count($images),
        'images' => $images,
    ], 'Vehicle images loaded'), 200);
} catch (Exception $e) {
    error_log('Error in get_vehicle_images.php: ' . $e->getMessage());
    error_response('Failed to load vehicle images', 500);
}
