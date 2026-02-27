<?php
/**
 * AUTOMALL - Get Vehicles for Current User / Admin View
 *
 * GET /backend/api/get_user_vehicles.php
 *
 * Auth:
 *   - Requires Bearer JWT in Authorization header
 *
 * Query params:
 *   - page: int (default: 1)
 *   - limit: int (default: 20, max: 100)
 *   - search: string (make/model search)
 *   - status: string (Draft, Pending_Intake, Available, On_Hold, Sold)
 *   - owner_id: int (Admin/Staff only, optional filter by owner)
 *
 * Behaviour by role:
 *   - Customer: always sees ONLY their own vehicles (Owner_ID = token.sub)
 *   - Staff/Admin: can see all vehicles; optional owner_id filter
 */

require_once __DIR__ . '/auth/authenticate.php';

// CORS headers are already set in authenticate.php via set_cors_headers()
debug_log('get_user_vehicles.php: start URI=' . ($_SERVER['REQUEST_URI'] ?? '')); 

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_response('Method not allowed', 405);
}

$token = get_bearer_token();
if (!$token) {
    debug_log('get_user_vehicles.php: no bearer token found');
    error_response('No token provided', 401);
}

$payload = verify_jwt($token);
if (!$payload || !isset($payload['sub']) || !isset($payload['role'])) {
    debug_log('get_user_vehicles.php: invalid or expired token payload=' . json_encode($payload));
    error_response('Invalid or expired token', 401);
}

$user_id = (int) $payload['sub'];
$role    = (string) $payload['role'];

try {
    debug_log('get_user_vehicles.php: user_id=' . $user_id . ' role=' . $role);
    // Pagination
    $page  = max(1, isset($_GET['page']) ? (int) $_GET['page'] : 1);
    $limit = min(100, max(1, isset($_GET['limit']) ? (int) $_GET['limit'] : 20));

    $search = isset($_GET['search']) && $_GET['search'] !== ''
        ? '%' . $_GET['search'] . '%'
        : null;

    $status = isset($_GET['status']) && $_GET['status'] !== ''
        ? $_GET['status']
        : null;

    // Normalise allowed statuses to avoid arbitrary values
    $allowed_statuses = ['Draft', 'Pending_Intake', 'Available', 'On_Hold', 'Sold'];
    if ($status !== null && !in_array($status, $allowed_statuses, true)) {
        error_response('Invalid status filter', 400);
    }

    // Optional owner filter for Admin/Staff only
    $owner_id_param = null;
    if (in_array($role, ['Admin', 'Staff'], true) && isset($_GET['owner_id']) && $_GET['owner_id'] !== '') {
        $owner_id_param = (int) $_GET['owner_id'];
        if ($owner_id_param <= 0) {
            error_response('Invalid owner_id', 400);
        }
    }

    // Base query: list vehicles with owner info + slot
    $query = 'SELECT 
                vi.Vehicle_ID,
                vi.Make_Model_Year,
                vi.Asking_Price,
                vi.Mileage,
                vi.Fuel_Type,
                vi.Color,
                vi.Description,
                vi.Plate_Number,
                vi.Vehicle_Status,
                vi.Assigned_Slot_ID,
                vi.Created_At,
                ua.User_ID   AS Owner_ID,
                ua.First_Name AS Owner_First_Name,
                ua.Last_Name  AS Owner_Last_Name,
                ua.Phone_Number AS Owner_Phone,
                ss.Slot_ID
              FROM D2_Vehicle_Inventory vi
              JOIN D1_Unified_Accounts ua ON vi.Owner_ID = ua.User_ID
              LEFT JOIN D5_Slot_Storage ss ON vi.Assigned_Slot_ID = ss.Slot_ID
              WHERE 1 = 1';

    $params = [];

    // Role-based scoping
    if ($role === 'Customer') {
        // Customers only ever see their own vehicles
        $query    .= ' AND vi.Owner_ID = ?';
        $params[] = $user_id;
    } elseif (in_array($role, ['Admin', 'Staff'], true)) {
        // Admin/Staff: optional filter by owner
        if ($owner_id_param !== null) {
            $query    .= ' AND vi.Owner_ID = ?';
            $params[] = $owner_id_param;
        }
    } else {
        // Unknown role: treat as forbidden
        error_response('Unauthorized role for vehicle listing', 403);
    }

    // Status filter, if provided
    if ($status !== null) {
        $query    .= ' AND vi.Vehicle_Status = ?';
        $params[] = $status;
    }

    // Search filter on make/model/year
    if ($search !== null) {
        $query    .= ' AND vi.Make_Model_Year LIKE ?';
        $params[] = $search;
    }

    // Total count for pagination
    $count_query  = 'SELECT COUNT(*) AS total FROM (' . $query . ') AS count_table';
    $count_result = fetch_one($count_query, $params);
    $total        = $count_result ? (int) $count_result['total'] : 0;
    $total_pages  = $total > 0 ? (int) ceil($total / $limit) : 0;

    // Apply pagination
    $offset   = ($page - 1) * $limit;
    $query   .= ' ORDER BY vi.Created_At DESC LIMIT ? OFFSET ?';
    $params[] = $limit;
    $params[] = $offset;

    $vehicles = fetch_all($query, $params);

    debug_log('get_user_vehicles.php: rows=' . count($vehicles));

    json_response(success_response([
        'vehicles'    => $vehicles,
        'total'       => $total,
        'page'        => $page,
        'total_pages' => $total_pages,
        'limit'       => $limit,
    ], 'User vehicles retrieved successfully'));

} catch (Exception $e) {
    error_log('Error in get_user_vehicles.php: ' . $e->getMessage());
    debug_log('get_user_vehicles.php: exception=' . $e->getMessage());
    error_response('Error fetching user vehicles', 500);
}

