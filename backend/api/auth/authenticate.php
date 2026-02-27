<?php
/**
 * AUTOMALL - User Authentication & Authorization
 * 
 * POST /backend/api/auth/register.php - Register new user
 * POST /backend/api/auth/login.php - Login user
 * POST /backend/api/auth/logout.php - Logout (client-side)
 * GET /backend/api/auth/me.php - Get current user
 * POST /backend/api/auth/refresh.php - Refresh JWT token
 */

require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../notifications/notification_service.php';

set_cors_headers();

// =====================================================
// JWT TOKEN FUNCTIONS
// =====================================================

function generate_jwt($user_id, $email, $role) {
    $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
    $payload = json_encode([
        'sub' => $user_id,
        'email' => $email,
        'role' => $role,
        'iat' => time(),
        'exp' => time() + (7 * 24 * 60 * 60) // 7 days
    ]);
    
    $header_encoded = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
    $payload_encoded = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
    
    $signature = hash_hmac(
        'sha256',
        "$header_encoded.$payload_encoded",
        TOKEN_SECRET,
        true
    );
    $signature_encoded = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    
    return "$header_encoded.$payload_encoded.$signature_encoded";
}

function verify_jwt($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    
    $header_encoded = $parts[0];
    $payload_encoded = $parts[1];
    $signature = $parts[2];
    
    // Verify signature
    $expected_signature = hash_hmac(
        'sha256',
        "$header_encoded.$payload_encoded",
        TOKEN_SECRET,
        true
    );
    $expected_signature_encoded = rtrim(strtr(base64_encode($expected_signature), '+/', '-_'), '=');
    
    if ($signature !== $expected_signature_encoded) {
        return null;
    }
    
    // Decode payload
    $payload_decoded = base64_decode(strtr($payload_encoded, '-_', '+/'));
    $payload = json_decode($payload_decoded, true);

    // Ensure payload structure is valid before using
    if (!is_array($payload) || !isset($payload['exp']) || !is_numeric($payload['exp'])) {
        return null;
    }

    // Check expiration
    if ((int) $payload['exp'] < time()) {
        return null;
    }

    return $payload;
}

// =====================================================
// REGISTER ENDPOINT
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'register.php') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validation
    if (!isset($input['email']) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        error_response('Invalid email', 400);
    }
    
    if (!isset($input['password']) || strlen($input['password']) < 8) {
        error_response('Password must be at least 8 characters', 400);
    }
    
    if (!isset($input['first_name']) || empty($input['first_name'])) {
        error_response('First name required', 400);
    }
    
    if (!isset($input['last_name']) || empty($input['last_name'])) {
        error_response('Last name required', 400);
    }
    
    if (!isset($input['phone_number']) || !validate_phone($input['phone_number'])) {
        error_response('Invalid phone number. Format: 09XXXXXXXXX', 400);
    }
    
    if (!isset($input['role']) || !in_array($input['role'], ['Customer', 'Staff'])) {
        $input['role'] = 'Customer'; // Default to customer
    }
    
    try {
        // Check if email already exists
        $existing = fetch_one(
            'SELECT User_ID FROM D1_Unified_Accounts WHERE Email = ?',
            [$input['email']]
        );
        
        if ($existing) {
            error_response('Email already registered', 409);
        }
        
        // Check if phone already exists
        $existing_phone = fetch_one(
            'SELECT User_ID FROM D1_Unified_Accounts WHERE Phone_Number = ?',
            [$input['phone_number']]
        );
        
        if ($existing_phone) {
            error_response('Phone number already registered', 409);
        }
        
        // Hash password using bcrypt
        $password_hash = password_hash($input['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        
        // Insert user
        $user_id = insert_record('D1_Unified_Accounts', [
            'Role' => $input['role'],
            'First_Name' => $input['first_name'],
            'Last_Name' => $input['last_name'],
            'Email' => $input['email'],
            'Phone_Number' => $input['phone_number'],
            'Password_Hash' => $password_hash,
            'Account_Status' => 'Active'
        ]);

        // Create per-user upload folders for OR/CR documents and car photos
        $uploads_root = __DIR__ . '/../../uploads/';
        $user_dir = rtrim($uploads_root, '/\\') . '/user_' . $user_id . '/';
        if (!is_dir($user_dir)) {
            @mkdir($user_dir, 0755, true);
        }
        $orcr_dir = $user_dir . 'orcr/';
        if (!is_dir($orcr_dir)) {
            @mkdir($orcr_dir, 0755, true);
        }
        $cars_dir = $user_dir . 'cars/';
        if (!is_dir($cars_dir)) {
            @mkdir($cars_dir, 0755, true);
        }
        
        // Generate JWT
        $token = generate_jwt($user_id, $input['email'], $input['role']);

        // Optional: welcome email on account creation
        // Disabled by default for easier local testing.
        // To enable later, define ENABLE_WELCOME_EMAIL as true (e.g. in config.php).
        if (defined('ENABLE_WELCOME_EMAIL') && ENABLE_WELCOME_EMAIL) {
            try {
                $full_name = trim($input['first_name'] . ' ' . $input['last_name']);
                NotificationService::send_welcome_email($input['email'], $full_name, $input['role']);
            } catch (Exception $e) {
                error_log('Failed to send welcome email for user '.$user_id.': '.$e->getMessage());
            }
        }
        
        json_response(success_response([
            'user_id' => $user_id,
            'email' => $input['email'],
            'first_name' => $input['first_name'],
            'last_name' => $input['last_name'],
            'role' => $input['role'],
            'token' => $token
        ], 'Registration successful'), 201);
        
    } catch (Exception $e) {
        error_log('Error in register.php: ' . $e->getMessage());
        error_response('Registration failed', 500);
    }
}

// =====================================================
// CHANGE PASSWORD ENDPOINT
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'change_password.php') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['current_password']) || !isset($input['new_password'])) {
        error_response('Current password and new password are required', 400);
    }

    if (strlen($input['new_password']) < 8) {
        error_response('New password must be at least 8 characters', 400);
    }

    $token = get_bearer_token();
    if (!$token) {
        error_response('No token provided', 401);
    }

    $payload = verify_jwt($token);
    if (!$payload || !isset($payload['sub'])) {
        error_response('Invalid or expired token', 401);
    }

    $user_id = $payload['sub'];

    try {
        $user = fetch_one(
            'SELECT User_ID, Password_Hash FROM D1_Unified_Accounts WHERE User_ID = ?',
            [$user_id]
        );

        if (!$user) {
            error_response('User not found', 404);
        }

        $currentValid = false;

        // Primary: bcrypt/modern hashes
        if (password_verify($input['current_password'], $user['Password_Hash'])) {
            $currentValid = true;
        } else {
            // Fallback: legacy SHA2 hashes from seed data
            $legacyHash = hash('sha256', $input['current_password']);
            if (hash_equals($legacyHash, $user['Password_Hash'])) {
                $currentValid = true;
            }
        }

        if (!$currentValid) {
            error_response('Current password is incorrect', 400);
        }

        $newHash = password_hash($input['new_password'], PASSWORD_BCRYPT, ['cost' => 12]);

        update_record(
            'D1_Unified_Accounts',
            ['Password_Hash' => $newHash],
            'User_ID = ?',
            [$user_id]
        );

        json_response(success_response([], 'Password updated successfully'), 200);
    } catch (Exception $e) {
        error_log('Error in change_password.php: ' . $e->getMessage());
        error_response('Password update failed', 500);
    }
}

// =====================================================
// UPDATE PROFILE ENDPOINT
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'update_profile.php') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);

    $token = get_bearer_token();
    if (!$token) {
        error_response('No token provided', 401);
    }

    $payload = verify_jwt($token);
    if (!$payload || !isset($payload['sub'])) {
        error_response('Invalid or expired token', 401);
    }

    $user_id = $payload['sub'];

    // Fetch current user to optionally enforce immutable email domain
    // for internal roles (Staff/Admin) while allowing customers to
    // change their email addresses freely.
    $current = fetch_one(
        'SELECT Email, Role FROM D1_Unified_Accounts WHERE User_ID = ?',
        [$user_id]
    );

    if (!$current) {
        error_response('User not found', 404);
    }

    $updates = [];

    if (isset($input['email'])) {
        if (!is_string($input['email']) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            error_response('Invalid email', 400);
        }

        // For Staff/Admin, enforce same email domain (e.g. @automall.com).
        // For Customers (buyer/seller), allow full email change including domain.
        if (isset($current['Role']) && in_array($current['Role'], ['Staff', 'Admin'], true)) {
            $currentDomain = '';
            $newDomain = '';

            if (strpos($current['Email'], '@') !== false) {
                $currentDomain = substr(strrchr($current['Email'], '@'), 1);
            }

            if (strpos($input['email'], '@') !== false) {
                $newDomain = substr(strrchr($input['email'], '@'), 1);
            }

            if ($currentDomain !== '' && $newDomain !== '' && strtolower($currentDomain) !== strtolower($newDomain)) {
                error_response('Email domain cannot be changed for this account', 400);
            }
        }

        // Ensure email is unique across other accounts
        $existing = fetch_one(
            'SELECT User_ID FROM D1_Unified_Accounts WHERE Email = ? AND User_ID != ?',
            [$input['email'], $user_id]
        );

        if ($existing) {
            error_response('Email already registered', 409);
        }

        $updates['Email'] = $input['email'];
    }

    if (isset($input['first_name'])) {
        if ($input['first_name'] === '' || !is_string($input['first_name'])) {
            error_response('First name is required', 400);
        }
        $updates['First_Name'] = $input['first_name'];
    }

    if (isset($input['last_name'])) {
        if ($input['last_name'] === '' || !is_string($input['last_name'])) {
            error_response('Last name is required', 400);
        }
        $updates['Last_Name'] = $input['last_name'];
    }

    if (isset($input['phone_number'])) {
        if ($input['phone_number'] !== null && $input['phone_number'] !== '' && !validate_phone($input['phone_number'])) {
            error_response('Invalid phone number. Format: 09XXXXXXXXX', 400);
        }
        $updates['Phone_Number'] = $input['phone_number'];
    }

    if (empty($updates)) {
        error_response('No valid fields to update', 400);
    }

    try {
        update_record(
            'D1_Unified_Accounts',
            $updates,
            'User_ID = ?',
            [$user_id]
        );

        $updated = fetch_one(
            'SELECT User_ID, First_Name, Last_Name, Email, Phone_Number, Role FROM D1_Unified_Accounts WHERE User_ID = ?',
            [$user_id]
        );

        json_response(success_response([
            'user_id' => $updated['User_ID'],
            'first_name' => $updated['First_Name'],
            'last_name' => $updated['Last_Name'],
            'email' => $updated['Email'],
            'phone_number' => $updated['Phone_Number'],
            'role' => $updated['Role'],
        ], 'Profile updated successfully'), 200);
    } catch (Exception $e) {
        error_log('Error in update_profile.php: ' . $e->getMessage());
        error_response('Profile update failed', 500);
    }
}

// =====================================================
// LOGIN ENDPOINT
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'login.php') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['email']) || !isset($input['password'])) {
        error_response('Email and password required', 400);
    }
    
    try {
        // Find user by email
        $user = fetch_one(
            'SELECT User_ID, First_Name, Last_Name, Email, Role, Account_Status, Password_Hash 
             FROM D1_Unified_Accounts WHERE Email = ?',
            [$input['email']]
        );
        
        if (!$user) {
            error_response('Invalid email or password', 401);
        }
        
        // Check account status
        if ($user['Account_Status'] !== 'Active') {
            error_response('Account is ' . strtolower($user['Account_Status']), 403);
        }
        
        // Verify password
        $passwordValid = false;

        // Primary: bcrypt/modern hashes (used by new registrations)
        if (password_verify($input['password'], $user['Password_Hash'])) {
            $passwordValid = true;
        } else {
            // Fallback: legacy SHA2 hashes from seed data (automall_schema.sql)
            // Seed users were created with: SHA2('password', 256)
            $legacyHash = hash('sha256', $input['password']);
            if (hash_equals($legacyHash, $user['Password_Hash'])) {
                $passwordValid = true;

                // Optional: transparently upgrade legacy hash to bcrypt for this user
                try {
                    $newHash = password_hash($input['password'], PASSWORD_BCRYPT, ['cost' => 12]);
                    update_record('D1_Unified_Accounts',
                        ['Password_Hash' => $newHash],
                        'User_ID = ?',
                        [$user['User_ID']]
                    );
                } catch (Exception $e) {
                    // If rehash fails, still allow login using the legacy hash
                    error_log('Password rehash failed for user '.$user['User_ID'].': '.$e->getMessage());
                }
            }
        }

        if (!$passwordValid) {
            error_response('Invalid email or password', 401);
        }
        
        // Generate JWT
        $token = generate_jwt($user['User_ID'], $user['Email'], $user['Role']);
        
        json_response(success_response([
            'user_id' => $user['User_ID'],
            'email' => $user['Email'],
            'first_name' => $user['First_Name'],
            'last_name' => $user['Last_Name'],
            'role' => $user['Role'],
            'token' => $token
        ], 'Login successful'), 200);
        
    } catch (Exception $e) {
        error_log('Error in login.php: ' . $e->getMessage());
        error_response('Login failed', 500);
    }
}

// =====================================================
// GET CURRENT USER ENDPOINT
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'GET' && strpos($_SERVER['REQUEST_URI'], 'me.php') !== false) {
    $token = get_bearer_token();
    
    if (!$token) {
        error_response('No token provided', 401);
    }
    
    $payload = verify_jwt($token);
    if (!$payload) {
        error_response('Invalid or expired token', 401);
    }
    
    try {
        $user = fetch_one(
            'SELECT User_ID, First_Name, Last_Name, Email, Role, Phone_Number, Account_Status, Created_At 
             FROM D1_Unified_Accounts WHERE User_ID = ?',
            [$payload['sub']]
        );
        
        if (!$user) {
            error_response('User not found', 404);
        }
        
        json_response(success_response($user, 'User retrieved'), 200);
        
    } catch (Exception $e) {
        error_response('Error retrieving user', 500);
    }
}

// =====================================================
// REFRESH TOKEN ENDPOINT
// =====================================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'refresh.php') !== false) {
    $token = get_bearer_token();
    
    if (!$token) {
        error_response('No token provided', 401);
    }
    
    $payload = verify_jwt($token);
    if (!$payload) {
        error_response('Invalid or expired token', 401);
    }
    
    try {
        // Generate new token
        $new_token = generate_jwt($payload['sub'], $payload['email'], $payload['role']);
        
        json_response(success_response([
            'token' => $new_token
        ], 'Token refreshed'), 200);
        
    } catch (Exception $e) {
        error_response('Token refresh failed', 500);
    }
}

