<?php
/**
 * AUTOMALL - Blind Offer Management
 * 
 * POST /backend/api/offers/submit_offer.php - Submit blind offer
 * GET /backend/api/offers/get_offers.php - Get offers for seller
 * POST /backend/api/offers/respond_offer.php - Accept/Reject/Counter offer
 */

require_once '../../config.php';

set_cors_headers();

// =====================================================
// SUBMIT OFFER
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'submit_offer.php') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validation
    if (!validate_user_id($input['buyer_id'] ?? null)) {
        error_response('Invalid buyer_id', 400);
    }
    
    if (!validate_vehicle_id($input['vehicle_id'] ?? null)) {
        error_response('Invalid vehicle_id', 400);
    }
    
    if (!isset($input['offer_amount']) || !validate_decimal($input['offer_amount'])) {
        error_response('Invalid offer amount', 400);
    }
    
    try {
        // Verify vehicle exists and is available
        $vehicle = fetch_one(
            'SELECT Vehicle_ID, Vehicle_Status, Owner_ID, Asking_Price 
             FROM D2_Vehicle_Inventory WHERE Vehicle_ID = ?',
            [$input['vehicle_id']]
        );
        
        if (!$vehicle) {
            error_response('Vehicle not found', 404);
        }
        
        if ($vehicle['Vehicle_Status'] !== 'Available') {
            error_response('Vehicle is not available for offers', 409);
        }
        
        // Check if buyer already has pending offer on this vehicle
        $existing = fetch_one(
            'SELECT Inquiry_ID FROM D8_Inquiry_Log 
             WHERE Buyer_ID = ? AND Target_Vehicle_ID = ? AND Inquiry_Status = "Pending_Seller"',
            [$input['buyer_id'], $input['vehicle_id']]
        );
        
        if ($existing) {
            error_response('You already have a pending offer on this vehicle', 409);
        }
        
        // Create inquiry record
        $inquiry_id = insert_record('D8_Inquiry_Log', [
            'Buyer_ID' => $input['buyer_id'],
            'Target_Vehicle_ID' => $input['vehicle_id'],
            'Offer_Amount' => $input['offer_amount'],
            'Inquiry_Status' => 'Pending_Seller',
            'Message' => $input['message'] ?? null,
            'Response_Deadline' => date('Y-m-d H:i:s', strtotime('+48 hours'))
        ]);
        
        json_response(success_response([
            'inquiry_id' => $inquiry_id,
            'vehicle_id' => $input['vehicle_id'],
            'offer_amount' => $input['offer_amount'],
            'status' => 'Pending_Seller',
            'deadline' => date('Y-m-d H:i:s', strtotime('+48 hours'))
        ], 'Blind offer submitted successfully'), 201);
        
    } catch (Exception $e) {
        error_log('Error in submit_offer.php: ' . $e->getMessage());
        error_response('Offer submission failed', 500);
    }
}

// =====================================================
// GET OFFERS (For Seller)
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'GET' && strpos($_SERVER['REQUEST_URI'], 'get_offers.php') !== false) {
    $seller_id = isset($_GET['seller_id']) ? (int)$_GET['seller_id'] : null;
    
    if (!validate_user_id($seller_id)) {
        error_response('Invalid seller_id', 400);
    }
    
    try {
        // Get all offers on seller's vehicles
        $offers = fetch_all(
            'SELECT 
                il.Inquiry_ID,
                il.Buyer_ID,
                il.Target_Vehicle_ID,
                il.Offer_Amount,
                il.Inquiry_Status,
                il.Counter_Offer,
                il.Created_At,
                il.Response_Deadline,
                ua.First_Name,
                ua.Last_Name,
                ua.Phone_Number,
                ua.Email,
                vi.Make_Model_Year,
                vi.Asking_Price
             FROM D8_Inquiry_Log il
             JOIN D1_Unified_Accounts ua ON il.Buyer_ID = ua.User_ID
             JOIN D2_Vehicle_Inventory vi ON il.Target_Vehicle_ID = vi.Vehicle_ID
             WHERE vi.Owner_ID = ?
             ORDER BY il.Created_At DESC',
            [$seller_id]
        );
        
        // Group by status
        $grouped = [];
        foreach ($offers as $offer) {
            $status = $offer['Inquiry_Status'];
            if (!isset($grouped[$status])) {
                $grouped[$status] = [];
            }
            $grouped[$status][] = $offer;
        }
        
        json_response(success_response([
            'all_offers' => $offers,
            'grouped' => $grouped,
            'total_count' => count($offers)
        ], 'Offers retrieved'), 200);
        
    } catch (Exception $e) {
        error_log('Error in get_offers.php: ' . $e->getMessage());
        error_response('Error retrieving offers', 500);
    }
}

// =====================================================
// RESPOND TO OFFER (Accept/Reject/Counter)
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'respond_offer.php') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['inquiry_id']) || !is_numeric($input['inquiry_id'])) {
        error_response('Invalid inquiry_id', 400);
    }
    
    if (!isset($input['action']) || !in_array($input['action'], ['accept', 'reject', 'counter'])) {
        error_response('Invalid action. Must be: accept, reject, or counter', 400);
    }
    
    if ($input['action'] === 'counter' && (!isset($input['counter_amount']) || !validate_decimal($input['counter_amount']))) {
        error_response('Counter amount required for counter offer', 400);
    }
    
    try {
        // Get inquiry
        $inquiry = fetch_one(
            'SELECT * FROM D8_Inquiry_Log WHERE Inquiry_ID = ?',
            [$input['inquiry_id']]
        );
        
        if (!$inquiry) {
            error_response('Inquiry not found', 404);
        }
        
        if ($inquiry['Inquiry_Status'] !== 'Pending_Seller') {
            error_response('Inquiry is not in Pending_Seller status', 409);
        }
        
        // Handle response based on action
        $db->beginTransaction();
        
        if ($input['action'] === 'accept') {
            update_record(
                'D8_Inquiry_Log',
                ['Inquiry_Status' => 'Accepted'],
                'Inquiry_ID = ?',
                [$input['inquiry_id']]
            );
            
            $response_msg = 'Offer accepted. Proceed to transaction.';
            
        } elseif ($input['action'] === 'reject') {
            update_record(
                'D8_Inquiry_Log',
                ['Inquiry_Status' => 'Rejected'],
                'Inquiry_ID = ?',
                [$input['inquiry_id']]
            );
            
            $response_msg = 'Offer rejected.';
            
        } else { // counter
            update_record(
                'D8_Inquiry_Log',
                [
                    'Inquiry_Status' => 'Countered',
                    'Counter_Offer' => $input['counter_amount'],
                    'Counter_Timestamp' => date('Y-m-d H:i:s'),
                    'Response_Deadline' => date('Y-m-d H:i:s', strtotime('+24 hours'))
                ],
                'Inquiry_ID = ?',
                [$input['inquiry_id']]
            );
            
            $response_msg = 'Counter offer sent. Buyer has 24 hours to respond.';
        }
        
        $db->commit();
        
        json_response(success_response([
            'inquiry_id' => $input['inquiry_id'],
            'action' => $input['action'],
            'new_status' => $inquiry['Inquiry_Status'],
            'message' => $response_msg
        ], 'Offer response recorded'), 200);
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log('Error in respond_offer.php: ' . $e->getMessage());
        error_response('Error responding to offer', 500);
    }
}

?>
