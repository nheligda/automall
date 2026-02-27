<?php

namespace App\Controllers;

use App\Models\Vehicle;

/**
 * VehicleController - Handle vehicle-related endpoints
 */
class VehicleController extends BaseController
{
    private $vehicleModel;

    public function __construct($db)
    {
        parent::__construct($db);
        $this->vehicleModel = new Vehicle($db);
    }

    /**
     * Get available vehicles (marketplace listing)
     */
    public function getAvailable()
    {
        try {
            $pagination = $this->getPaginationParams();

            // Get filters from query params
            $filters = [];
            if (isset($_GET['min_price'])) $filters['min_price'] = (float)$_GET['min_price'];
            if (isset($_GET['max_price'])) $filters['max_price'] = (float)$_GET['max_price'];
            if (isset($_GET['fuel_type'])) $filters['fuel_type'] = $_GET['fuel_type'];
            if (isset($_GET['make'])) $filters['make'] = $_GET['make'];

            $vehicles = $this->vehicleModel->filterVehicles(
                $filters,
                $pagination['limit'],
                $pagination['offset']
            );

            $total = $this->vehicleModel->countAvailable();

            return $this->successResponse([
                'vehicles' => $vehicles,
                'pagination' => [
                    'page' => $pagination['page'],
                    'limit' => $pagination['limit'],
                    'total' => $total,
                    'pages' => ceil($total / $pagination['limit'])
                ]
            ], 'Vehicles retrieved successfully', 200);
        } catch (\Exception $e) {
            error_log("Get Available Vehicles Error: " . $e->getMessage());
            return $this->errorResponse('Failed to retrieve vehicles', 500);
        }
    }

    /**
     * Get vehicle detail
     */
    public function getDetail()
    {
        try {
            $vehicleId = isset($_GET['id']) ? (int)$_GET['id'] : null;
            $this->validateVehicleId($vehicleId);

            $vehicle = $this->vehicleModel->findById($vehicleId);

            if (!$vehicle) {
                return $this->errorResponse('Vehicle not found', 404);
            }

            return $this->successResponse($vehicle, 'Vehicle retrieved successfully', 200);
        } catch (\Exception $e) {
            error_log("Get Vehicle Detail Error: " . $e->getMessage());
            return $this->errorResponse('Failed to retrieve vehicle', 500);
        }
    }

    /**
     * Search vehicles
     */
    public function search()
    {
        try {
            $searchTerm = isset($_GET['q']) ? $_GET['q'] : '';
            
            if (strlen($searchTerm) < 2) {
                return $this->errorResponse('Search term must be at least 2 characters', 400);
            }

            $pagination = $this->getPaginationParams();

            $vehicles = $this->vehicleModel->searchVehicles(
                $searchTerm,
                $pagination['limit'],
                $pagination['offset']
            );

            return $this->successResponse([
                'vehicles' => $vehicles,
                'pagination' => [
                    'page' => $pagination['page'],
                    'limit' => $pagination['limit'],
                    'total' => count($vehicles)
                ]
            ], 'Search completed successfully', 200);
        } catch (\Exception $e) {
            error_log("Search Vehicles Error: " . $e->getMessage());
            return $this->errorResponse('Search failed', 500);
        }
    }

    /**
     * Get vehicles by seller
     */
    public function getBySeller()
    {
        try {
            $token = $this->getBearerToken();
            if (!$token) {
                return $this->errorResponse('Unauthorized', 401);
            }

            // Get current user (seller)
            $seller = $this->verifyRole(['Customer']);
            if (is_string($seller)) {
                return $this->errorResponse($seller, 403);
            }

            $vehicles = $this->vehicleModel->getVehiclesBySeller($seller['ID']);

            return $this->successResponse([
                'vehicles' => $vehicles,
                'total' => count($vehicles)
            ], 'Seller vehicles retrieved successfully', 200);
        } catch (\Exception $e) {
            error_log("Get Seller Vehicles Error: " . $e->getMessage());
            return $this->errorResponse('Failed to retrieve seller vehicles', 500);
        }
    }

    /**
     * Verify role helper
     */
    private function verifyRole($allowedRoles = [])
    {
        // This should use AuthService - simplified for example
        return ['ID' => 1, 'Role' => 'Customer'];
    }
}
