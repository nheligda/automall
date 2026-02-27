<?php
/**
 * AUTOMALL - Configuration & Database Connection
 * Secure PDO connection to MySQL via XAMPP
 */

// Enable output buffering so any stray warnings/notices
// don't get sent before our JSON responses.
if (!ob_get_level()) {
    ob_start();
}

// Ensure a simple logs directory exists for debug output
$__automallLogsDir = __DIR__ . '/logs';
if (!is_dir($__automallLogsDir)) {
    @mkdir($__automallLogsDir, 0755, true);
}

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', ''); // XAMPP default is empty
define('DB_NAME', 'automall_db');
define('DB_CHARSET', 'utf8mb4');

// API Configuration
define('API_DEBUG', true);
define('CORS_ORIGIN', 'http://localhost:5173'); // Vite default
define('TOKEN_SECRET', 'your_jwt_secret_key_here_change_in_production');

// =====================================================
// Database Connection (PDO)
// =====================================================

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    
    $db = new PDO(
        $dsn,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => API_DEBUG ? $e->getMessage() : 'Database connection failed'
    ]));
}

// =====================================================
// CORS Headers
// =====================================================

function set_cors_headers() {
    header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// =====================================================
// Response Helper Functions
// =====================================================

function json_response($data, $status_code = 200) {
    // Ensure no previous buffered output (e.g. PHP warnings)
    // corrupts the JSON payload.
    if (ob_get_length()) {
        ob_clean();
    }
    http_response_code($status_code);
    echo json_encode($data);
    exit();
}

function success_response($data = [], $message = 'Success') {
    return [
        'success' => true,
        'message' => $message,
        'data' => $data
    ];
}

function error_response($message = 'Error', $status_code = 400) {
    json_response([
        'success' => false,
        'error' => $message
    ], $status_code);
}

// Lightweight debug logger for tracing backend issues
function debug_log($message) {
    $file = __DIR__ . '/logs/debug.log';
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;
    @file_put_contents($file, $line, FILE_APPEND);
}

// =====================================================
// Validation Helpers
// =====================================================

function validate_user_id($user_id) {
    return is_numeric($user_id) && $user_id > 0;
}

function validate_vehicle_id($vehicle_id) {
    return is_numeric($vehicle_id) && $vehicle_id > 0;
}

function validate_slot_id($slot_id) {
    return is_numeric($slot_id) && $slot_id >= 1 && $slot_id <= 60;
}

function validate_phone($phone) {
    return preg_match('/^09\d{9}$/', $phone);
}

function validate_decimal($amount) {
    return is_numeric($amount) && $amount >= 0;
}

// =====================================================
// Query Helpers
// =====================================================

function execute_query($query, $params = []) {
    global $db;
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    return $stmt;
}

function fetch_one($query, $params = []) {
    return execute_query($query, $params)->fetch();
}

function fetch_all($query, $params = []) {
    return execute_query($query, $params)->fetchAll();
}

function insert_record($table, $data) {
    global $db;
    $columns = implode(', ', array_keys($data));
    $placeholders = implode(', ', array_fill(0, count($data), '?'));
    $query = "INSERT INTO $table ($columns) VALUES ($placeholders)";
    
    execute_query($query, array_values($data));
    return $db->lastInsertId();
}

function update_record($table, $data, $where, $where_params = []) {
    $set_clause = implode(', ', array_map(fn($k) => "$k = ?", array_keys($data)));
    $query = "UPDATE $table SET $set_clause WHERE $where";
    
    $params = array_merge(array_values($data), $where_params);
    execute_query($query, $params);
}

// =====================================================
// Authentication Helpers
// =====================================================

// Some environments (e.g. certain Windows builds) do not provide
// getallheaders() by default. Define a safe fallback.
if (!function_exists('getallheaders')) {
    function getallheaders(): array {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (strpos($name, 'HTTP_') === 0) {
                $key = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$key] = $value;
            }
        }
        return $headers;
    }
}

function get_bearer_token() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $match = [];
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $match)) {
            return $match[1];
        }
    }
    return null;
}

function verify_user_role($user_id, $required_role) {
    $user = fetch_one('SELECT Role FROM D1_Unified_Accounts WHERE User_ID = ?', [$user_id]);
    return $user && $user['Role'] === $required_role;
}

// =====================================================
// Time Helpers
// =====================================================

function add_hours($hours) {
    return date('Y-m-d H:i:s', strtotime("+$hours hours"));
}

function get_2_hour_alert_time($appointment_datetime) {
    return date('Y-m-d H:i:s', strtotime($appointment_datetime . ' -2 hours'));
}

