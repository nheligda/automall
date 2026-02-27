<?php

/**
 * API Router - Handle routing for all endpoints
 */
class Router
{
    private $db;
    private $jwtSecret;
    private $routes = [];

    public function __construct($db, $jwtSecret)
    {
        $this->db = $db;
        $this->jwtSecret = $jwtSecret;
        $this->registerRoutes();
    }

    /**
     * Register all API routes
     */
    private function registerRoutes()
    {
        // Auth routes
        $this->routes = [
            // Authentication
            'POST /api/auth/register' => ['App\Controllers\AuthController', 'register'],
            'POST /api/auth/login' => ['App\Controllers\AuthController', 'login'],
            'GET /api/auth/me' => ['App\Controllers\AuthController', 'getCurrentUser'],
            'POST /api/auth/refresh' => ['App\Controllers\AuthController', 'refreshToken'],

            // Vehicles
            'GET /api/vehicles' => ['App\Controllers\VehicleController', 'getAvailable'],
            'GET /api/vehicles/detail' => ['App\Controllers\VehicleController', 'getDetail'],
            'GET /api/vehicles/search' => ['App\Controllers\VehicleController', 'search'],
            'GET /api/vehicles/seller' => ['App\Controllers\VehicleController', 'getBySeller'],

            // Appointments
            'POST /api/appointments/schedule' => ['App\Controllers\AppointmentController', 'schedule'],
            'GET /api/appointments' => ['App\Controllers\AppointmentController', 'getBuyerAppointments'],
            'GET /api/appointments/upcoming' => ['App\Controllers\AppointmentController', 'getUpcoming'],
            'POST /api/appointments/otw-hold' => ['App\Controllers\AppointmentController', 'applyOTWHold'],
            'POST /api/appointments/release-holds' => ['App\Controllers\AppointmentController', 'releaseExpiredHolds'],
        ];
    }

    /**
     * Route incoming request
     */
    public function route($method, $path)
    {
        $route = "$method $path";

        foreach ($this->routes as $pattern => $handler) {
            if ($this->matchRoute($route, $pattern)) {
                return $this->handleRoute($handler);
            }
        }

        // Route not found
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Route not found']);
        exit;
    }

    /**
     * Match route pattern
     */
    private function matchRoute($route, $pattern)
    {
        $pattern = preg_replace('/\{[^}]+\}/', '[^/]+', $pattern);
        $pattern = '#^' . $pattern . '$#';
        return preg_match($pattern, $route);
    }

    /**
     * Handle route and call controller
     */
    private function handleRoute($handler)
    {
        list($controllerClass, $method) = $handler;

        try {
            // Instantiate controller
            if ($controllerClass === 'App\Controllers\AuthController') {
                $controller = new $controllerClass($this->db, $this->jwtSecret);
            } else {
                $controller = new $controllerClass($this->db);
            }

            // Call controller method
            return $controller->$method();
        } catch (\Exception $e) {
            error_log("Route Handler Error: " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Internal server error']);
            exit;
        }
    }
}
