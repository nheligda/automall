<?php
/**
 * AUTOMALL - File Upload Service
 * 
 * POST /backend/api/uploads/upload_document.php - Upload OR/CR image
 * POST /backend/api/uploads/upload_vehicle_images.php - Upload vehicle photos
 */

require_once '../../config.php';

set_cors_headers();

// Upload configuration
define('UPLOAD_DIR', '../../uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'application/pdf']);
define('ALLOWED_EXT', ['jpg', 'jpeg', 'png', 'pdf']);

// Create base upload directory if not exists
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

// Helper to create a safe folder name from make/model text
function slugify_make_model($text, $fallback)
{
    $text = strtolower(trim((string) $text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    $text = trim($text, '-');
    return $text !== '' ? $text : $fallback;
}

// =====================================================
// UPLOAD OR/CR DOCUMENT
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'upload_document.php') !== false) {
    
    if (!isset($_FILES['document']) || $_FILES['document']['error'] !== UPLOAD_ERR_OK) {
        error_response('No file uploaded or upload error', 400);
    }
    
    $file = $_FILES['document'];
    $input = json_decode($_POST['data'] ?? '{}', true);
    
    if (!validate_vehicle_id($input['vehicle_id'] ?? null)) {
        error_response('Invalid vehicle_id', 400);
    }
    
    // Validate file
    if ($file['size'] > MAX_FILE_SIZE) {
        error_response('File too large. Maximum: 5MB', 400);
    }
    
    $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($file_ext, ALLOWED_EXT)) {
        error_response('Invalid file type. Allowed: jpg, png, pdf', 400);
    }
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mime_type, ALLOWED_TYPES)) {
        error_response('Invalid MIME type', 400);
    }
    
    try {
        // Verify vehicle exists and get owner + model
        $vehicle = fetch_one(
            'SELECT Vehicle_ID, Owner_ID, Make_Model_Year FROM D2_Vehicle_Inventory WHERE Vehicle_ID = ?',
            [$input['vehicle_id']]
        );
        
        if (!$vehicle) {
            error_response('Vehicle not found', 404);
        }
        
        $userId = (int) $vehicle['Owner_ID'];
        $slug = slugify_make_model($vehicle['Make_Model_Year'] ?? '', 'vehicle-' . $vehicle['Vehicle_ID']);

        // Directory structure: uploads/user_<id>/orcr/<car-model>/
        $userDir = rtrim(UPLOAD_DIR, '/\\') . '/user_' . $userId . '/';
        $upload_dir = $userDir . 'orcr/' . $slug . '/';

        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        // Generate unique filename
        $filename = 'orcr_' . $vehicle['Vehicle_ID'] . '_' . time() . '.' . $file_ext;
        $upload_path = $upload_dir . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $upload_path)) {
            error_response('Failed to save file', 500);
        }
        
        // Update vehicle with image URL (staff-only document)
        $image_url = 'uploads/user_' . $userId . '/orcr/' . $slug . '/' . $filename;
        update_record(
            'D2_Vehicle_Inventory',
            [
                'OR_CR_Image_URL' => $image_url,
                'Vehicle_Status' => 'Pending_Intake'
            ],
            'Vehicle_ID = ?',
            [$input['vehicle_id']]
        );
        
        json_response(success_response([
            'vehicle_id' => $input['vehicle_id'],
            'filename' => $filename,
            'image_url' => $image_url,
            'message' => 'Document uploaded. Waiting for admin review.'
        ], 'Document uploaded successfully'), 201);
        
    } catch (Exception $e) {
        // Delete file if query fails
        if (file_exists($upload_path)) {
            unlink($upload_path);
        }
        error_log('Error in upload_document.php: ' . $e->getMessage());
        error_response('Upload failed', 500);
    }
}

// =====================================================
// UPLOAD VEHICLE IMAGES (Multiple)
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'upload_vehicle_images.php') !== false) {
    
    if (!isset($_FILES['images']) || empty($_FILES['images']['name'][0])) {
        error_response('No images uploaded', 400);
    }
    
    $input = json_decode($_POST['data'] ?? '{}', true);
    
    if (!validate_vehicle_id($input['vehicle_id'] ?? null)) {
        error_response('Invalid vehicle_id', 400);
    }
    
    try {
        $vehicle = fetch_one(
            'SELECT Vehicle_ID, Owner_ID, Make_Model_Year FROM D2_Vehicle_Inventory WHERE Vehicle_ID = ?',
            [$input['vehicle_id']]
        );
        
        if (!$vehicle) {
            error_response('Vehicle not found', 404);
        }
        
        $uploaded = [];

        $userId = (int) $vehicle['Owner_ID'];
        $slug = slugify_make_model($vehicle['Make_Model_Year'] ?? '', 'vehicle-' . $vehicle['Vehicle_ID']);

        // Directory structure: uploads/user_<id>/cars/<car-model>/
        $userDir = rtrim(UPLOAD_DIR, '/\\') . '/user_' . $userId . '/';
        $upload_dir = $userDir . 'cars/' . $slug . '/';

        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        
        // Process multiple files
        for ($i = 0; $i < count($_FILES['images']['name']); $i++) {
            $file = [
                'name' => $_FILES['images']['name'][$i],
                'tmp_name' => $_FILES['images']['tmp_name'][$i],
                'size' => $_FILES['images']['size'][$i],
                'error' => $_FILES['images']['error'][$i],
                'type' => $_FILES['images']['type'][$i]
            ];
            
            // Validate
            if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > MAX_FILE_SIZE) {
                continue;
            }
            
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png'])) {
                continue;
            }
            
            // Save file
            $filename = 'vehicle_' . time() . '_' . $i . '.' . $ext;
            $path = $upload_dir . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $path)) {
                $uploaded[] = [
                    'filename' => $filename,
                    'url' => 'uploads/user_' . $userId . '/cars/' . $slug . '/' . $filename
                ];
            }
        }
        
        if (empty($uploaded)) {
            error_response('No valid images could be uploaded', 400);
        }
        
        json_response(success_response([
            'vehicle_id' => $input['vehicle_id'],
            'uploaded_count' => count($uploaded),
            'images' => $uploaded
        ], count($uploaded) . ' image(s) uploaded successfully'), 201);
        
    } catch (Exception $e) {
        error_log('Error in upload_vehicle_images.php: ' . $e->getMessage());
        error_response('Upload failed', 500);
    }
}

// =====================================================
// DELETE UPLOAD
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['filename']) || empty($input['filename'])) {
        error_response('Filename required', 400);
    }
    
    // Prevent directory traversal
    if (strpos($input['filename'], '..') !== false || strpos($input['filename'], '/') !== false) {
        error_response('Invalid filename', 400);
    }
    
    $filepath = UPLOAD_DIR . $input['filename'];
    
    if (!file_exists($filepath)) {
        error_response('File not found', 404);
    }
    
    if (unlink($filepath)) {
        json_response(success_response([], 'File deleted'), 200);
    } else {
        error_response('Failed to delete file', 500);
    }
}

?>
