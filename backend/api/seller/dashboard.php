<?php
/**
 * AUTOMALL - Seller Dashboard
 * 
 * GET /backend/api/seller/dashboard.php?user_id=3
 * Returns all seller's vehicles and inquiries
 */

require_once '../../config.php';

set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_response('Method not allowed', 405);
}

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

if (!validate_user_id($user_id)) {
    error_response('Invalid user_id', 400);
}

try {
    // Get seller info
    $seller = fetch_one(
        'SELECT User_ID, First_Name, Last_Name, Email, Phone_Number 
         FROM D1_Unified_Accounts WHERE User_ID = ?',
        [$user_id]
    );
    
    if (!$seller) {
        error_response('Seller not found', 404);
    }
    
    // Get seller's vehicles
    $vehicles = fetch_all(
        'SELECT 
            Vehicle_ID,
            Make_Model_Year,
            Asking_Price,
            Vehicle_Status,
            Assigned_Slot_ID,
            Created_At
         FROM D2_Vehicle_Inventory 
         WHERE Owner_ID = ? 
         ORDER BY Created_At DESC',
        [$user_id]
    );
    
    // Get vehicle counts by status
    $status_counts = fetch_all(
        'SELECT Vehicle_Status, COUNT(*) as count 
         FROM D2_Vehicle_Inventory 
         WHERE Owner_ID = ? 
         GROUP BY Vehicle_Status',
        [$user_id]
    );
    
    $status_summary = [];
    foreach ($status_counts as $count) {
        $status_summary[$count['Vehicle_Status']] = $count['count'];
    }
    
    // Get blind offers for seller's vehicles
    $inquiries = fetch_all(
        'SELECT 
            il.Inquiry_ID,
            il.Buyer_ID,
            il.Target_Vehicle_ID,
            il.Offer_Amount,
            il.Inquiry_Status,
            il.Created_At,
            ua.First_Name,
            ua.Last_Name,
            ua.Phone_Number,
            vi.Make_Model_Year
         FROM D8_Inquiry_Log il
         JOIN D1_Unified_Accounts ua ON il.Buyer_ID = ua.User_ID
         JOIN D2_Vehicle_Inventory vi ON il.Target_Vehicle_ID = vi.Vehicle_ID
         WHERE vi.Owner_ID = ? 
         ORDER BY il.Created_At DESC
         LIMIT 20',
        [$user_id]
    );
    
    // Get billing info
    $billing = fetch_all(
        'SELECT 
            Billing_ID,
            Vehicle_ID,
            Rent_Amount,
            Rent_Due_Date,
            Payment_Status,
            Created_At
         FROM D7_Billing_Records 
         WHERE Seller_ID = ? 
         ORDER BY Rent_Due_Date DESC
         LIMIT 10',
        [$user_id]
    );
    
    // Calculate totals
    $total_vehicles = count($vehicles);
    $pending_income = fetch_one(
        'SELECT COALESCE(SUM(Rent_Amount), 0) as total 
         FROM D7_Billing_Records 
         WHERE Seller_ID = ? AND Payment_Status IN ("Pending_Verification", "Overdue")',
        [$user_id]
    );
    
    json_response(success_response([
        'seller' => $seller,
        'vehicles' => $vehicles,
        'status_summary' => $status_summary,
        'total_vehicles' => $total_vehicles,
        'inquiries' => $inquiries,
        'billing_records' => $billing,
        'pending_income' => $pending_income['total']
    ], 'Seller dashboard data retrieved'), 200);
    
} catch (Exception $e) {
    error_log('Error in seller/dashboard.php: ' . $e->getMessage());
    error_response('Error retrieving dashboard', 500);
}

?>
