<?php
/**
 * AUTOMALL - Transactions & Payments
 * 
 * Core staff processes (DFD):
 * - Process 16: Execute Sale & Print Certificates
 *   -> Implemented by /backend/api/transactions/complete_sale.php
 *      Records the sale in D4_Transaction_Records, updates D2_Vehicle_Inventory,
 *      frees D5_Slot_Storage, closes related D8_Inquiry_Log entries and
 *      returns a structured "certificate" payload that front-end staff can
 *      render/print as the official sale certificate.
 * 
 * - Slot rental payment and billing history are also exposed here for staff.
 * 
 * POST /backend/api/transactions/complete_sale.php - Record completed sale & return certificate data
 * POST /backend/api/transactions/record_payment.php  - Record slot rental payment
 * GET  /backend/api/transactions/get_billing.php     - Get billing history
 */

require_once '../../config.php';

set_cors_headers();

// =====================================================
// COMPLETE SALE / TRANSACTION
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'complete_sale.php') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validation
    if (!validate_vehicle_id($input['vehicle_id'] ?? null)) {
        error_response('Invalid vehicle_id', 400);
    }

    if (!validate_user_id($input['seller_id'] ?? null)) {
        error_response('Invalid seller_id', 400);
    }

    if (!validate_user_id($input['facilitated_by'] ?? null)) {
        error_response('Invalid facilitated_by (staff ID)', 400);
    }

    if (!isset($input['final_sale_price']) || !validate_decimal($input['final_sale_price'])) {
        error_response('Invalid final_sale_price', 400);
    }

    // Optional: link to a specific inquiry / blind offer (D8)
    $inquiryId = isset($input['inquiry_id']) && is_numeric($input['inquiry_id'])
        ? (int)$input['inquiry_id']
        : null;

    try {
        // Get vehicle (must still be on lot and not already sold)
        $vehicle = fetch_one(
            'SELECT Vehicle_ID, Assigned_Slot_ID, Vehicle_Status, Make_Model_Year, Asking_Price 
             FROM D2_Vehicle_Inventory WHERE Vehicle_ID = ?',
            [$input['vehicle_id']]
        );

        if (!$vehicle) {
            error_response('Vehicle not found', 404);
        }

        if ($vehicle['Vehicle_Status'] === 'Sold') {
            error_response('Vehicle is already sold', 409);
        }

        // If sale is tied to a specific inquiry/offer, sanity-check that record
        $inquiry = null;
        if ($inquiryId) {
            $inquiry = fetch_one(
                'SELECT Inquiry_ID, Buyer_ID, Target_Vehicle_ID, Inquiry_Status, Offer_Amount, Counter_Offer 
                 FROM D8_Inquiry_Log WHERE Inquiry_ID = ?',
                [$inquiryId]
            );

            if (!$inquiry) {
                error_response('Linked inquiry not found', 404);
            }

            if ((int)$inquiry['Target_Vehicle_ID'] !== (int)$input['vehicle_id']) {
                error_response('Inquiry does not match vehicle being sold', 400);
            }

            // If buyer_id is not explicitly provided, default to the inquiry buyer
            if (empty($input['buyer_id']) && !empty($inquiry['Buyer_ID'])) {
                $input['buyer_id'] = (int)$inquiry['Buyer_ID'];
            }
        }

        $db->beginTransaction();

        // Record transaction into D4_Transaction_Records
        $transaction_id = insert_record('D4_Transaction_Records', [
            'Vehicle_ID' => $input['vehicle_id'],
            'Seller_ID' => $input['seller_id'],
            'Buyer_ID' => $input['buyer_id'] ?? null,
            'Facilitated_By' => $input['facilitated_by'],
            'Final_Sale_Price' => $input['final_sale_price'],
            'Transaction_Date' => date('Y-m-d H:i:s'),
            'Payment_Method' => $input['payment_method'] ?? 'Cash',
            'Notes' => $input['notes'] ?? null
        ]);

        // Update vehicle status in D2 (sold, remove any OTW hold)
        update_record(
            'D2_Vehicle_Inventory',
            [
                'Vehicle_Status' => 'Sold',
                'Hold_Expiry' => null
            ],
            'Vehicle_ID = ?',
            [$input['vehicle_id']]
        );

        // Free up the physical slot in D5, if any
        if (!empty($vehicle['Assigned_Slot_ID'])) {
            update_record(
                'D5_Slot_Storage',
                [
                    'Slot_Status' => 'Available',
                    'Current_Vehicle_ID' => null
                ],
                'Slot_ID = ?',
                [$vehicle['Assigned_Slot_ID']]
            );
        }

        // Close related inquiries (D8)
        if ($inquiryId && $inquiry) {
            // Mark the primary inquiry as completed / closed won
            update_record(
                'D8_Inquiry_Log',
                [
                    'Inquiry_Status' => 'Sale_Completed',
                ],
                'Inquiry_ID = ?',
                [$inquiryId]
            );

            // Any competing offers on the same vehicle become lost
            update_record(
                'D8_Inquiry_Log',
                [
                    'Inquiry_Status' => 'Lost_To_Other_Buyer',
                ],
                'Target_Vehicle_ID = ? AND Inquiry_ID != ? AND Inquiry_Status IN ("Pending_Seller", "Countered", "Accepted")',
                [$input['vehicle_id'], $inquiryId]
            );
        } else {
            // No specific inquiry linked: mark open offers on this unit as withdrawn
            update_record(
                'D8_Inquiry_Log',
                ['Inquiry_Status' => 'Withdrawn'],
                'Target_Vehicle_ID = ? AND Inquiry_Status IN ("Pending_Seller", "Countered")',
                [$input['vehicle_id']]
            );
        }

        // Build certificate payload (joins D4 + D2 + D1) for front-end printing
        $certificate = fetch_one(
            'SELECT 
                tr.Transaction_ID,
                tr.Transaction_Date,
                tr.Final_Sale_Price,
                tr.Payment_Method,
                tr.Notes,
                vi.Vehicle_ID,
                vi.Make_Model_Year,
                vi.Plate_Number,
                vi.Color,
                vi.Mileage,
                vi.Fuel_Type,
                vi.Transmission,
                ua_seller.User_ID   AS Seller_ID,
                ua_seller.First_Name AS Seller_First_Name,
                ua_seller.Last_Name  AS Seller_Last_Name,
                ua_seller.Email      AS Seller_Email,
                ua_seller.Phone_Number AS Seller_Phone,
                ua_buyer.User_ID    AS Buyer_ID,
                ua_buyer.First_Name AS Buyer_First_Name,
                ua_buyer.Last_Name  AS Buyer_Last_Name,
                ua_buyer.Email      AS Buyer_Email,
                ua_buyer.Phone_Number AS Buyer_Phone,
                ua_staff.User_ID    AS Staff_ID,
                ua_staff.First_Name AS Staff_First_Name,
                ua_staff.Last_Name  AS Staff_Last_Name
             FROM D4_Transaction_Records tr
             JOIN D2_Vehicle_Inventory vi ON tr.Vehicle_ID = vi.Vehicle_ID
             JOIN D1_Unified_Accounts ua_seller ON tr.Seller_ID = ua_seller.User_ID
             LEFT JOIN D1_Unified_Accounts ua_buyer ON tr.Buyer_ID = ua_buyer.User_ID
             LEFT JOIN D1_Unified_Accounts ua_staff ON tr.Facilitated_By = ua_staff.User_ID
             WHERE tr.Transaction_ID = ?',
            [$transaction_id]
        );

        $db->commit();

        json_response(success_response([
            'transaction_id' => $transaction_id,
            'vehicle_id' => $input['vehicle_id'],
            'final_sale_price' => $input['final_sale_price'],
            'transaction_date' => $certificate['Transaction_Date'] ?? date('Y-m-d H:i:s'),
            'certificate' => $certificate,
            'message' => 'Sale completed successfully'
        ], 'Transaction recorded'), 201);

    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log('Error in complete_sale.php: ' . $e->getMessage());
        error_response('Error completing sale', 500);
    }
}

// =====================================================
// RECORD PAYMENT
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'record_payment.php') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['billing_id']) || !is_numeric($input['billing_id'])) {
        error_response('Invalid billing_id', 400);
    }
    
    if (!isset($input['payment_method']) || empty($input['payment_method'])) {
        error_response('Payment method required', 400);
    }
    
    try {
        $billing = fetch_one(
            'SELECT Billing_ID, Seller_ID, Vehicle_ID, Rent_Amount, Payment_Status 
             FROM D7_Billing_Records WHERE Billing_ID = ?',
            [$input['billing_id']]
        );
        
        if (!$billing) {
            error_response('Billing record not found', 404);
        }
        
        if ($billing['Payment_Status'] === 'Paid') {
            error_response('Payment already recorded', 409);
        }
        
        // Update billing record
        update_record(
            'D7_Billing_Records',
            [
                'Payment_Status' => 'Paid',
                'Payment_Date' => date('Y-m-d H:i:s'),
                'Payment_Method' => $input['payment_method']
            ],
            'Billing_ID = ?',
            [$input['billing_id']]
        );
        
        json_response(success_response([
            'billing_id' => $input['billing_id'],
            'payment_amount' => $billing['Rent_Amount'],
            'payment_date' => date('Y-m-d H:i:s'),
            'message' => 'Payment recorded successfully'
        ], 'Payment processed'), 200);
        
    } catch (Exception $e) {
        error_log('Error in record_payment.php: ' . $e->getMessage());
        error_response('Error recording payment', 500);
    }
}

// =====================================================
// GET BILLING HISTORY
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'GET' && strpos($_SERVER['REQUEST_URI'], 'get_billing.php') !== false) {
    $seller_id = isset($_GET['seller_id']) ? (int)$_GET['seller_id'] : null;
    
    if (!validate_user_id($seller_id)) {
        error_response('Invalid seller_id', 400);
    }
    
    try {
        // Get all billing records
        $billing_records = fetch_all(
            'SELECT 
                br.Billing_ID,
                br.Vehicle_ID,
                br.Rent_Amount,
                br.Rent_Due_Date,
                br.Payment_Status,
                br.Payment_Date,
                br.Created_At,
                vi.Make_Model_Year
             FROM D7_Billing_Records br
             JOIN D2_Vehicle_Inventory vi ON br.Vehicle_ID = vi.Vehicle_ID
             WHERE br.Seller_ID = ?
             ORDER BY br.Rent_Due_Date DESC',
            [$seller_id]
        );
        
        // Summary
        $summary = fetch_one(
            'SELECT 
                COUNT(*) as total_bills,
                SUM(CASE WHEN Payment_Status = "Paid" THEN Rent_Amount ELSE 0 END) as paid_amount,
                SUM(CASE WHEN Payment_Status IN ("Pending_Verification", "Overdue") THEN Rent_Amount ELSE 0 END) as pending_amount,
                SUM(CASE WHEN Payment_Status = "Overdue" THEN Rent_Amount ELSE 0 END) as overdue_amount
             FROM D7_Billing_Records 
             WHERE Seller_ID = ?',
            [$seller_id]
        );
        
        json_response(success_response([
            'billing_records' => $billing_records,
            'summary' => $summary
        ], 'Billing history retrieved'), 200);
        
    } catch (Exception $e) {
        error_log('Error in get_billing.php: ' . $e->getMessage());
        error_response('Error retrieving billing', 500);
    }
}

?>
