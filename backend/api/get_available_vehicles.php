<?php
/**
 * AUTOMALL - Get Available Vehicles for Buyer Marketplace
 * 
 * GET /backend/api/get_available_vehicles.php
 * Query params:
 *   - page: int (default: 1)
 *   - limit: int (default: 20, max: 100)
 *   - search: string (make/model search)
 *   - min_price: decimal
 *   - max_price: decimal
 *   - fuel_type: string
 * 
 * Response: {
 *   "success": true,
 *   "data": {
 *     "vehicles": array,
 *     "total": int,
 *     "page": int,
 *     "total_pages": int
 *   }
 * }
 */

require_once '../config.php';

set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_response('Method not allowed', 405);
}

try {
    // Parse query parameters
    $page = max(1, isset($_GET['page']) ? (int)$_GET['page'] : 1);
    $limit = min(100, max(1, isset($_GET['limit']) ? (int)$_GET['limit'] : 20));
    $search = isset($_GET['search']) ? '%' . $_GET['search'] . '%' : null;
    $min_price = isset($_GET['min_price']) ? (float)$_GET['min_price'] : null;
    $max_price = isset($_GET['max_price']) ? (float)$_GET['max_price'] : null;
    $fuel_type = isset($_GET['fuel_type']) ? $_GET['fuel_type'] : null;
    $min_mileage = isset($_GET['min_mileage']) ? (int)$_GET['min_mileage'] : null;
    $max_mileage = isset($_GET['max_mileage']) ? (int)$_GET['max_mileage'] : null;
    $color = isset($_GET['color']) ? trim($_GET['color']) : null;
    
    // Build base query
    $query = 'SELECT 
                vi.Vehicle_ID,
                vi.Make_Model_Year,
                vi.Asking_Price,
                vi.Mileage,
                vi.Fuel_Type,
                vi.Color,
                vi.Transmission,
                vi.Plate_Number,
                vi.Description,
                vi.Created_At,
                ua.First_Name AS Seller_First_Name,
                ua.Last_Name AS Seller_Last_Name,
                ua.Phone_Number AS Seller_Phone,
                ss.Slot_ID
              FROM D2_Vehicle_Inventory vi
              JOIN D1_Unified_Accounts ua ON vi.Owner_ID = ua.User_ID
              LEFT JOIN D5_Slot_Storage ss ON vi.Assigned_Slot_ID = ss.Slot_ID
              WHERE vi.Vehicle_Status = "Available"';
    
    $params = [];
    
    // Add search filter
    if ($search) {
        $query .= ' AND vi.Make_Model_Year LIKE ?';
        $params[] = $search;
    }
    
    // Add price filters
    if ($min_price !== null) {
        $query .= ' AND vi.Asking_Price >= ?';
        $params[] = $min_price;
    }
    
    if ($max_price !== null) {
        $query .= ' AND vi.Asking_Price <= ?';
        $params[] = $max_price;
    }
    
    // Add fuel type filter
    if ($fuel_type) {
        $query .= ' AND vi.Fuel_Type = ?';
        $params[] = $fuel_type;
    }

    // Add mileage filters
    if ($min_mileage !== null) {
        $query .= ' AND vi.Mileage >= ?';
        $params[] = $min_mileage;
    }

    if ($max_mileage !== null) {
        $query .= ' AND vi.Mileage <= ?';
        $params[] = $max_mileage;
    }

    // Add color filter (exact match)
    if ($color !== null && $color !== '') {
        $query .= ' AND vi.Color = ?';
        $params[] = $color;
    }
    
    // Get total count
    $count_query = 'SELECT COUNT(*) as total FROM (' . $query . ') as count_table';
    $count_result = fetch_one($count_query, $params);
    $total = $count_result['total'];
    $total_pages = ceil($total / $limit);
    
    // Add pagination
    $offset = ($page - 1) * $limit;
    $query .= ' ORDER BY vi.Created_At DESC LIMIT ? OFFSET ?';
    $params[] = $limit;
    $params[] = $offset;
    
    // Execute query
    $vehicles = fetch_all($query, $params);
    
    json_response(success_response([
        'vehicles' => $vehicles,
        'total' => $total,
        'page' => $page,
        'total_pages' => $total_pages,
        'limit' => $limit
    ], 'Vehicles retrieved successfully'));
    
} catch (Exception $e) {
    error_log('Error in get_available_vehicles.php: ' . $e->getMessage());
    error_response('Error fetching vehicles', 500);
}

?>
