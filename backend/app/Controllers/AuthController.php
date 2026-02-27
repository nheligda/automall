<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\User;

/**
 * AuthController - Handle authentication endpoints
 */
class AuthController extends BaseController
{
    private $authService;
    private $userModel;

    public function __construct($db, $jwtSecret)
    {
        parent::__construct($db);
        $this->authService = new AuthService($db, $jwtSecret);
        $this->userModel = new User($db);
    }

    /**
     * Register endpoint
     */
    public function register()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            $required = ['firstName', 'lastName', 'email', 'phone', 'password', 'role'];
            $this->validateRequired($data, $required);

            // Validate password length
            if (strlen($data['password']) < 8) {
                return $this->errorResponse('Password must be at least 8 characters', 400);
            }

            // Validate phone format
            if (!preg_match('/^(09|\+639)\d{9}$/', $data['phone'])) {
                return $this->errorResponse('Invalid phone number format', 400);
            }

            $result = $this->authService->register(
                $data['firstName'],
                $data['lastName'],
                $data['email'],
                $data['phone'],
                $data['password'],
                $data['role']
            );

            if ($result['success']) {
                return $this->successResponse($result, 'User registered successfully', 201);
            } else {
                return $this->errorResponse($result['message'], 400);
            }
        } catch (\Exception $e) {
            error_log("Register Error: " . $e->getMessage());
            return $this->errorResponse('Registration failed', 500);
        }
    }

    /**
     * Login endpoint
     */
    public function login()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            $this->validateRequired($data, ['email', 'password']);

            $result = $this->authService->login($data['email'], $data['password']);

            if ($result['success']) {
                return $this->successResponse([
                    'token' => $result['token'],
                    'user' => $result['user']
                ], 'Login successful', 200);
            } else {
                return $this->errorResponse($result['message'], 401);
            }
        } catch (\Exception $e) {
            error_log("Login Error: " . $e->getMessage());
            return $this->errorResponse('Login failed', 500);
        }
    }

    /**
     * Get current user
     */
    public function getCurrentUser()
    {
        try {
            $token = $this->getBearerToken();
            
            if (!$token) {
                return $this->errorResponse('Unauthorized', 401);
            }

            $user = $this->authService->getCurrentUser($token);

            if (!$user) {
                return $this->errorResponse('User not found', 404);
            }

            return $this->successResponse($user, 'User retrieved successfully', 200);
        } catch (\Exception $e) {
            error_log("Get Current User Error: " . $e->getMessage());
            return $this->errorResponse('Failed to retrieve user', 500);
        }
    }

    /**
     * Refresh token endpoint
     */
    public function refreshToken()
    {
        try {
            $token = $this->getBearerToken();
            
            if (!$token) {
                return $this->errorResponse('Unauthorized', 401);
            }

            $result = $this->authService->refreshToken($token);

            if ($result['success']) {
                return $this->successResponse([
                    'token' => $result['token'],
                    'user' => $result['user']
                ], 'Token refreshed successfully', 200);
            } else {
                return $this->errorResponse($result['message'], 401);
            }
        } catch (\Exception $e) {
            error_log("Refresh Token Error: " . $e->getMessage());
            return $this->errorResponse('Token refresh failed', 500);
        }
    }

    /**
     * Verify user role
     */
    public function verifyRole($allowedRoles = [])
    {
        $token = $this->getBearerToken();
        
        if (!$token) {
            return $this->errorResponse('Unauthorized', 401);
        }

        $user = $this->authService->getCurrentUser($token);
        
        if (!$user) {
            return $this->errorResponse('User not found', 404);
        }

        if (!empty($allowedRoles) && !in_array($user['Role'], $allowedRoles)) {
            return $this->errorResponse('Forbidden', 403);
        }

        return $user;
    }
}
