<?php

namespace App\Services;

use PDO;
use PDOException;

/**
 * AuthService - Handle authentication logic
 */
class AuthService
{
    private $db;
    private $jwtSecret;

    public function __construct($db, $jwtSecret)
    {
        $this->db = $db;
        $this->jwtSecret = $jwtSecret;
    }

    /**
     * Register new user
     */
    public function register($firstName, $lastName, $email, $phone, $password, $role = 'Customer')
    {
        try {
            // Check if email exists
            $query = "SELECT ID FROM D1_Users WHERE Email = :email LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':email' => $email]);
            
            if ($stmt->fetch()) {
                return ['success' => false, 'message' => 'Email already exists'];
            }

            // Check if phone exists
            $query = "SELECT ID FROM D1_Users WHERE Phone_Number = :phone LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':phone' => $phone]);
            
            if ($stmt->fetch()) {
                return ['success' => false, 'message' => 'Phone number already exists'];
            }

            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

            // Create user
            $this->db->beginTransaction();
            
            $query = "INSERT INTO D1_Users (First_Name, Last_Name, Email, Phone_Number, Password_Hash, Role, Account_Status)
                      VALUES (:first_name, :last_name, :email, :phone, :password, :role, 'Active')";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':first_name' => $firstName,
                ':last_name' => $lastName,
                ':email' => $email,
                ':phone' => $phone,
                ':password' => $hashedPassword,
                ':role' => $role
            ]);

            $userId = $this->db->lastInsertId();
            $this->db->commit();

            return ['success' => true, 'user_id' => $userId, 'message' => 'User registered successfully'];
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Registration Error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Registration failed'];
        }
    }

    /**
     * Login user
     */
    public function login($email, $password)
    {
        try {
            $query = "SELECT ID, First_Name, Last_Name, Email, Phone_Number, Role, Password_Hash, Account_Status
                      FROM D1_Users WHERE Email = :email LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                return ['success' => false, 'message' => 'Invalid email or password'];
            }

            if ($user['Account_Status'] !== 'Active') {
                return ['success' => false, 'message' => 'Account is inactive'];
            }

            if (!password_verify($password, $user['Password_Hash'])) {
                return ['success' => false, 'message' => 'Invalid email or password'];
            }

            // Generate JWT token
            $token = $this->generateJWT($user);

            // Remove password hash from response
            unset($user['Password_Hash']);

            return [
                'success' => true,
                'token' => $token,
                'user' => $user,
                'message' => 'Login successful'
            ];
        } catch (PDOException $e) {
            error_log("Login Error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Login failed'];
        }
    }

    /**
     * Generate JWT token
     */
    public function generateJWT($user)
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $user['ID'],
            'email' => $user['Email'],
            'role' => $user['Role'],
            'iat' => time(),
            'exp' => time() + (7 * 24 * 60 * 60) // 7 days
        ]);

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, $this->jwtSecret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64UrlHeader . '.' . $base64UrlPayload . '.' . $base64UrlSignature;
    }

    /**
     * Verify JWT token
     */
    public function verifyJWT($token)
    {
        try {
            $parts = explode('.', $token);
            
            if (count($parts) !== 3) {
                return false;
            }

            $header = $parts[0];
            $payload = $parts[1];
            $signature = $parts[2];

            $valid_signature = hash_hmac('sha256', "$header.$payload", $this->jwtSecret, true);
            $valid_signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($valid_signature));

            if ($signature !== $valid_signature) {
                return false;
            }

            $decoded = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);

            if ($decoded['exp'] < time()) {
                return false; // Token expired
            }

            return $decoded;
        } catch (\Exception $e) {
            error_log("JWT Verification Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get current user from token
     */
    public function getCurrentUser($token)
    {
        $decoded = $this->verifyJWT($token);
        
        if (!$decoded) {
            return null;
        }

        try {
            $query = "SELECT ID, First_Name, Last_Name, Email, Phone_Number, Role, Account_Status
                      FROM D1_Users WHERE ID = :id LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([':id' => $decoded['user_id']]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get Current User Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Refresh JWT token
     */
    public function refreshToken($token)
    {
        $decoded = $this->verifyJWT($token);
        
        if (!$decoded) {
            return ['success' => false, 'message' => 'Invalid or expired token'];
        }

        try {
            $query = "SELECT ID, First_Name, Last_Name, Email, Phone_Number, Role
                      FROM D1_Users WHERE ID = :id LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([':id' => $decoded['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                return ['success' => false, 'message' => 'User not found'];
            }

            $newToken = $this->generateJWT($user);

            return [
                'success' => true,
                'token' => $newToken,
                'user' => $user
            ];
        } catch (PDOException $e) {
            error_log("Refresh Token Error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Token refresh failed'];
        }
    }
}
