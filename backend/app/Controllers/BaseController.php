<?php

namespace App\Controllers;

/**
 * BaseController - Abstract base class for all controllers
 * Provides common utility methods
 */
abstract class BaseController
{
    protected $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Send JSON success response
     */
    protected function successResponse($data, $message = 'Success', $statusCode = 200)
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }

    /**
     * Send JSON error response
     */
    protected function errorResponse($message, $statusCode = 400)
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
        exit;
    }

    /**
     * Validate required fields
     */
    protected function validateRequired($data, $required)
    {
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $this->errorResponse("Missing required field: $field", 400);
            }
        }
    }

    /**
     * Get Bearer token from Authorization header
     */
    protected function getBearerToken()
    {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            $parts = explode(' ', $headers['Authorization']);
            if (count($parts) === 2 && $parts[0] === 'Bearer') {
                return $parts[1];
            }
        }

        return null;
    }

    /**
     * Validate user ID parameter
     */
    protected function validateUserId($id)
    {
        if (!$id || !is_numeric($id)) {
            $this->errorResponse('Invalid user ID', 400);
        }
    }

    /**
     * Validate vehicle ID parameter
     */
    protected function validateVehicleId($id)
    {
        if (!$id || !is_numeric($id)) {
            $this->errorResponse('Invalid vehicle ID', 400);
        }
    }

    /**
     * Validate page and limit parameters
     */
    protected function getPaginationParams()
    {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

        $page = max(1, $page);
        $limit = min($limit, 100); // Max 100 per page

        $offset = ($page - 1) * $limit;

        return ['page' => $page, 'limit' => $limit, 'offset' => $offset];
    }
}
