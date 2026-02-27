<?php
/**
 * AUTOMALL - Admin Panel
 * 
 * GET /backend/api/admin/dashboard.php - Admin dashboard stats
 * GET /backend/api/admin/pending_vehicles.php - Vehicles pending OR/CR approval
 * POST /backend/api/admin/approve_vehicle.php - Approve/Reject vehicle listing
 * GET /backend/api/admin/reports.php - Sales reports & analytics
 * GET /backend/api/admin/accounts.php - List user accounts (e.g. Staff)
 * POST /backend/api/admin/accounts.php - Create staff accounts
 */

require_once '../../config.php';

set_cors_headers();

// =====================================================
// ADMIN DASHBOARD
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'GET' && strpos($_SERVER['REQUEST_URI'], 'dashboard.php') !== false) {
    try {
        // Total stats
        $total_users = fetch_one('SELECT COUNT(*) as count FROM D1_Unified_Accounts')['count'];
        $total_vehicles = fetch_one('SELECT COUNT(*) as count FROM D2_Vehicle_Inventory')['count'];
        $total_slots_occupied = fetch_one('SELECT COUNT(*) as count FROM D5_Slot_Storage WHERE Slot_Status = "Occupied"')['count'];
        $total_transactions = fetch_one('SELECT COUNT(*) as count FROM D4_Transaction_Records')['count'];
        $total_revenue = fetch_one('SELECT COALESCE(SUM(Rent_Amount), 0) as total FROM D7_Billing_Records WHERE Payment_Status = "Paid"')['total'];
        
        // Pending approvals
        $pending_vehicles = fetch_one('SELECT COUNT(*) as count FROM D2_Vehicle_Inventory WHERE Vehicle_Status IN ("Draft", "Pending_Intake")')['count'];
        $pending_offers = fetch_one('SELECT COUNT(*) as count FROM D8_Inquiry_Log WHERE Inquiry_Status = "Pending_Seller"')['count'];
        $overdue_payments = fetch_one('SELECT COUNT(*) as count FROM D7_Billing_Records WHERE Payment_Status = "Overdue"')['count'];

        // Pending offers grouped by seller & vehicle for staff visibility
        $pending_offer_breakdown = fetch_all(
            'SELECT 
                s.User_ID AS Seller_ID,
                s.First_Name AS Seller_First_Name,
                s.Last_Name AS Seller_Last_Name,
                s.Email AS Seller_Email,
                s.Phone_Number AS Seller_Phone,
                v.Vehicle_ID,
                v.Make_Model_Year,
                v.Plate_Number,
                COUNT(il.Inquiry_ID) AS Pending_Offers
             FROM D8_Inquiry_Log il
             JOIN D2_Vehicle_Inventory v ON il.Target_Vehicle_ID = v.Vehicle_ID
             JOIN D1_Unified_Accounts s ON v.Owner_ID = s.User_ID
             WHERE il.Inquiry_Status = "Pending_Seller"
             GROUP BY s.User_ID, v.Vehicle_ID
             ORDER BY Pending_Offers DESC, v.Make_Model_Year ASC'
        );
        
        // Recent transactions (with slot + party details for Lot Manager)
        $recent_sales = fetch_all(
            'SELECT 
                tr.Transaction_ID,
                tr.Vehicle_ID,
                tr.Final_Sale_Price,
                tr.Transaction_Date,
                vi.Assigned_Slot_ID AS Slot_ID,
                vi.Make_Model_Year,
                vi.Plate_Number,
                seller.First_Name AS Seller_First_Name,
                seller.Last_Name AS Seller_Last_Name,
                buyer.First_Name AS Buyer_First_Name,
                buyer.Last_Name AS Buyer_Last_Name
             FROM D4_Transaction_Records tr
             JOIN D1_Unified_Accounts seller ON tr.Seller_ID = seller.User_ID
             LEFT JOIN D1_Unified_Accounts buyer ON tr.Buyer_ID = buyer.User_ID
             JOIN D2_Vehicle_Inventory vi ON tr.Vehicle_ID = vi.Vehicle_ID
             ORDER BY tr.Transaction_Date DESC
             LIMIT 20'
        );
        
        // Vehicle status breakdown
        $vehicle_stats = fetch_all(
            'SELECT Vehicle_Status, COUNT(*) as count 
             FROM D2_Vehicle_Inventory 
             GROUP BY Vehicle_Status'
        );
        
        json_response(success_response([
            'stats' => [
                'total_users' => $total_users,
                'total_vehicles' => $total_vehicles,
                'slots_available' => 60 - $total_slots_occupied,
                'slots_occupied' => $total_slots_occupied,
                'total_transactions' => $total_transactions,
                'total_revenue' => $total_revenue
            ],
            'pending' => [
                'vehicles' => $pending_vehicles,
                'offers' => $pending_offers,
                'payments' => $overdue_payments
            ],
            'recent_sales' => $recent_sales,
            'vehicle_breakdown' => $vehicle_stats,
            'pending_offer_breakdown' => $pending_offer_breakdown
        ], 'Admin dashboard data'), 200);
        
    } catch (Exception $e) {
        error_log('Error in admin/dashboard.php: ' . $e->getMessage());
        error_response('Error retrieving dashboard', 500);
    }
}

// =====================================================
// PENDING VEHICLES FOR APPROVAL
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'GET' && strpos($_SERVER['REQUEST_URI'], 'pending_vehicles.php') !== false) {
    try {
        $vehicles = fetch_all(
            'SELECT 
                vi.Vehicle_ID,
                vi.Make_Model_Year,
                vi.Plate_Number,
                vi.Engine_Number,
                vi.Chassis_Number,
                vi.Asking_Price,
                vi.Mileage,
                vi.Fuel_Type,
                vi.Color,
                vi.Transmission,
                vi.Description,
                vi.OR_CR_Image_URL,
                vi.Vehicle_Status,
                vi.Created_At,
                ua.First_Name,
                ua.Last_Name,
                ua.Email,
                ua.Phone_Number
             FROM D2_Vehicle_Inventory vi
             JOIN D1_Unified_Accounts ua ON vi.Owner_ID = ua.User_ID
             WHERE vi.Vehicle_Status IN ("Draft", "Pending_Intake")
             ORDER BY vi.Created_At ASC'
        );
        
        json_response(success_response([
            'pending_vehicles' => $vehicles,
            'total_count' => count($vehicles)
        ], 'Pending vehicles retrieved'), 200);
        
    } catch (Exception $e) {
        error_log('Error in pending_vehicles.php: ' . $e->getMessage());
        error_response('Error retrieving pending vehicles', 500);
    }
}

// =====================================================
// APPROVE/REJECT VEHICLE
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'approve_vehicle.php') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!validate_vehicle_id($input['vehicle_id'] ?? null)) {
        error_response('Invalid vehicle_id', 400);
    }
    
    if (!isset($input['action']) || !in_array($input['action'], ['approve', 'reject'])) {
        error_response('Action must be approve or reject', 400);
    }
    
    try {
        $vehicle = fetch_one(
            'SELECT Vehicle_Status, Assigned_Slot_ID FROM D2_Vehicle_Inventory WHERE Vehicle_ID = ?',
            [$input['vehicle_id']]
        );
        
        if (!$vehicle) {
            error_response('Vehicle not found', 404);
        }
        
        $db->beginTransaction();
        
        if ($input['action'] === 'approve') {
            // Find available slot
            $available_slot = fetch_one(
                'SELECT Slot_ID FROM D5_Slot_Storage WHERE Slot_Status = "Available" LIMIT 1'
            );
            
            if (!$available_slot) {
                $db->rollBack();
                error_response('No available slots', 409);
            }
            
            // Assign slot and set vehicle to Available
            update_record(
                'D2_Vehicle_Inventory',
                [
                    'Vehicle_Status' => 'Available',
                    'Assigned_Slot_ID' => $available_slot['Slot_ID']
                ],
                'Vehicle_ID = ?',
                [$input['vehicle_id']]
            );
            
            // Mark slot as occupied
            update_record(
                'D5_Slot_Storage',
                [
                    'Slot_Status' => 'Occupied',
                    'Current_Vehicle_ID' => $input['vehicle_id']
                ],
                'Slot_ID = ?',
                [$available_slot['Slot_ID']]
            );
            
            $response_msg = 'Vehicle approved and published';
            
        } else { // reject
            update_record(
                'D2_Vehicle_Inventory',
                ['Vehicle_Status' => 'Draft'],
                'Vehicle_ID = ?',
                [$input['vehicle_id']]
            );
            
            $response_msg = 'Vehicle rejected. Seller needs to resubmit.';
        }
        
        $db->commit();
        
        json_response(success_response([
            'vehicle_id' => $input['vehicle_id'],
            'action' => $input['action'],
            'message' => $response_msg
        ], 'Vehicle approval processed'), 200);
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log('Error in approve_vehicle.php: ' . $e->getMessage());
        error_response('Error processing approval', 500);
    }
}

// =====================================================
// ANALYTICS & REPORTS
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'GET' && strpos($_SERVER['REQUEST_URI'], 'reports.php') !== false) {
    try {
        // Revenue by month
        $monthly_revenue = fetch_all(
            'SELECT 
                DATE_FORMAT(Payment_Date, "%Y-%m") as month,
                SUM(Rent_Amount) as revenue,
                COUNT(*) as transactions
             FROM D7_Billing_Records 
             WHERE Payment_Status = "Paid"
             GROUP BY DATE_FORMAT(Payment_Date, "%Y-%m")
             ORDER BY month DESC
             LIMIT 12'
        );
        
        // Top sellers
        $top_sellers = fetch_all(
            'SELECT 
                ua.User_ID,
                ua.First_Name,
                ua.Last_Name,
                COUNT(vi.Vehicle_ID) as vehicles_sold,
                SUM(tr.Final_Sale_Price) as total_sales
             FROM D4_Transaction_Records tr
             JOIN D1_Unified_Accounts ua ON tr.Seller_ID = ua.User_ID
             JOIN D2_Vehicle_Inventory vi ON tr.Vehicle_ID = vi.Vehicle_ID
             GROUP BY tr.Seller_ID
             ORDER BY total_sales DESC
             LIMIT 10'
        );
        
        // Popular vehicles
        $popular_vehicles = fetch_all(
            'SELECT 
                vi.Vehicle_ID,
                vi.Make_Model_Year,
                COUNT(il.Inquiry_ID) as inquiries,
                COUNT(DISTINCT ap.Appointment_ID) as viewings
             FROM D2_Vehicle_Inventory vi
             LEFT JOIN D8_Inquiry_Log il ON vi.Vehicle_ID = il.Target_Vehicle_ID
             LEFT JOIN D3_Master_Calendar ap ON vi.Vehicle_ID = ap.Target_Vehicle_ID
             WHERE vi.Vehicle_Status = "Available"
             GROUP BY vi.Vehicle_ID
             ORDER BY inquiries DESC
             LIMIT 10'
        );
        
        json_response(success_response([
            'monthly_revenue' => $monthly_revenue,
            'top_sellers' => $top_sellers,
            'popular_vehicles' => $popular_vehicles
        ], 'Reports retrieved'), 200);
        
    } catch (Exception $e) {
        error_log('Error in reports.php: ' . $e->getMessage());
        error_response('Error retrieving reports', 500);
    }
}

// =====================================================
// SLOT DETAILS (Lot Manager)
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'GET' && strpos($_SERVER['REQUEST_URI'], 'slot_details.php') !== false) {
    $slot_id = isset($_GET['slot_id']) ? (int) $_GET['slot_id'] : 0;

    if ($slot_id <= 0 || $slot_id > 60) {
        error_response('Invalid slot_id', 400);
    }

    try {
        $slot = fetch_one(
            'SELECT 
                ss.Slot_ID,
                ss.Slot_Status,
                ss.Current_Vehicle_ID,
                vi.Vehicle_ID,
                vi.Make_Model_Year,
                vi.Plate_Number,
                vi.Asking_Price,
                vi.Mileage,
                vi.Fuel_Type,
                vi.Color,
                vi.Transmission,
                vi.Vehicle_Status,
                vi.OR_CR_Image_URL,
                ua.First_Name,
                ua.Last_Name,
                ua.Phone_Number
             FROM D5_Slot_Storage ss
             LEFT JOIN D2_Vehicle_Inventory vi ON ss.Current_Vehicle_ID = vi.Vehicle_ID
             LEFT JOIN D1_Unified_Accounts ua ON vi.Owner_ID = ua.User_ID
             WHERE ss.Slot_ID = ?'
            ,
            [$slot_id]
        );

        if (!$slot) {
            error_response('Slot not found', 404);
        }

        $response = [
            'slot' => [
                'Slot_ID' => (int) $slot['Slot_ID'],
                'Slot_Status' => $slot['Slot_Status'],
                'Current_Vehicle_ID' => $slot['Current_Vehicle_ID'],
            ],
        ];

        if (!empty($slot['Vehicle_ID'])) {
            $response['vehicle'] = [
                'Vehicle_ID' => (int) $slot['Vehicle_ID'],
                'Make_Model_Year' => $slot['Make_Model_Year'],
                'Plate_Number' => $slot['Plate_Number'],
                'Asking_Price' => $slot['Asking_Price'],
                'Mileage' => $slot['Mileage'],
                'Fuel_Type' => $slot['Fuel_Type'],
                'Color' => $slot['Color'],
                'Transmission' => $slot['Transmission'],
                'Vehicle_Status' => $slot['Vehicle_Status'],
                'OR_CR_Image_URL' => $slot['OR_CR_Image_URL'],
            ];

            $response['seller'] = [
                'First_Name' => $slot['First_Name'],
                'Last_Name' => $slot['Last_Name'],
                'Phone_Number' => $slot['Phone_Number'],
            ];
        }

        json_response(success_response($response, 'Slot details retrieved'), 200);

    } catch (Exception $e) {
        error_log('Error in slot_details.php: ' . $e->getMessage());
        error_response('Error retrieving slot details', 500);
    }
}

// =====================================================
// ACCOUNT MANAGEMENT (Admin-only UI usage)
// =====================================================

if (strpos($_SERVER['REQUEST_URI'], 'accounts.php') !== false) {
    // List accounts (default: Staff; Admin can switch role filter or show all)
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        try {
            $role = isset($_GET['role']) && $_GET['role'] !== ''
                ? $_GET['role']
                : 'Staff';

            $allowed_roles = ['Customer', 'Staff', 'Admin', 'All'];
            if (!in_array($role, $allowed_roles, true)) {
                error_response('Invalid role filter', 400);
            }

            $search = isset($_GET['search']) ? trim($_GET['search']) : '';

                        $query = 'SELECT 
                                                User_ID,
                                                First_Name,
                                                Last_Name,
                                                Email,
                                                Phone_Number,
                                                Role,
                                                Account_Status,
                                                Created_At
                                            FROM D1_Unified_Accounts
                                            WHERE 1 = 1';
                        $params = [];

                        if ($role !== 'All') {
                                $query   .= ' AND Role = ?';
                                $params[] = $role;
                        }

            if ($search !== '') {
                $like = '%' . $search . '%';
                $query .= ' AND (
                              First_Name LIKE ? OR
                              Last_Name LIKE ? OR
                              Email LIKE ? OR
                              Phone_Number LIKE ?
                           )';
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
            }

            $query .= ' ORDER BY Created_At DESC';

            $accounts = fetch_all($query, $params);

            json_response(success_response([
                'accounts' => $accounts,
                'role' => $role,
                'total_count' => count($accounts)
            ], 'Accounts retrieved'), 200);
        } catch (Exception $e) {
            error_log('Error in admin/accounts.php (GET): ' . $e->getMessage());
            error_response('Error retrieving accounts', 500);
        }
    }

    // Create Staff account or update account status
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        // Admin status update (ban/unban) action
        if (isset($input['action']) && $input['action'] === 'update_status') {
            if (!validate_user_id($input['user_id'] ?? null)) {
                error_response('Invalid user_id', 400);
            }

            $status = $input['status'] ?? '';
            $allowed_status = ['Active', 'Suspended', 'Banned'];
            if (!in_array($status, $allowed_status, true)) {
                error_response('Invalid status value', 400);
            }

            try {
                update_record(
                    'D1_Unified_Accounts',
                    ['Account_Status' => $status],
                    'User_ID = ?',
                    [$input['user_id']]
                );

                json_response(success_response([
                    'user_id' => (int)$input['user_id'],
                    'status' => $status,
                ], 'Account status updated'), 200);
            } catch (Exception $e) {
                error_log('Error in admin/accounts.php (STATUS): ' . $e->getMessage());
                error_response('Error updating account status', 500);
            }
        }

        // Basic validation mirrors auth/register.php but locks role to Staff
        if (!isset($input['email']) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            error_response('Invalid email', 400);
        }

        if (!isset($input['password']) || strlen($input['password']) < 8) {
            error_response('Password must be at least 8 characters', 400);
        }

        if (!isset($input['first_name']) || $input['first_name'] === '') {
            error_response('First name required', 400);
        }

        if (!isset($input['last_name']) || $input['last_name'] === '') {
            error_response('Last name required', 400);
        }

        if (!isset($input['phone_number']) || !validate_phone($input['phone_number'])) {
            error_response('Invalid phone number. Format: 09XXXXXXXXX', 400);
        }

        try {
            // Ensure email is unique
            $existing = fetch_one(
                'SELECT User_ID FROM D1_Unified_Accounts WHERE Email = ?',
                [$input['email']]
            );

            if ($existing) {
                error_response('Email already registered', 409);
            }

            // Ensure phone is unique
            $existing_phone = fetch_one(
                'SELECT User_ID FROM D1_Unified_Accounts WHERE Phone_Number = ?',
                [$input['phone_number']]
            );

            if ($existing_phone) {
                error_response('Phone number already registered', 409);
            }

            $password_hash = password_hash($input['password'], PASSWORD_BCRYPT, ['cost' => 12]);

            $user_id = insert_record('D1_Unified_Accounts', [
                'Role' => 'Staff',
                'First_Name' => $input['first_name'],
                'Last_Name' => $input['last_name'],
                'Email' => $input['email'],
                'Phone_Number' => $input['phone_number'],
                'Password_Hash' => $password_hash,
                'Account_Status' => 'Active'
            ]);

            json_response(success_response([
                'user_id' => $user_id,
                'first_name' => $input['first_name'],
                'last_name' => $input['last_name'],
                'email' => $input['email'],
                'phone_number' => $input['phone_number'],
                'role' => 'Staff',
            ], 'Staff account created'), 201);
        } catch (Exception $e) {
            error_log('Error in admin/accounts.php (POST): ' . $e->getMessage());
            error_response('Error creating staff account', 500);
        }
    }
}

?>
