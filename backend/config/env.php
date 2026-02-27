<?php

/**
 * Environment Variables Configuration
 */

$envFile = __DIR__ . '/../.env';

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($lines as $line) {
        if (strpos($line, '=') === false || strpos($line, '#') === 0) {
            continue;
        }

        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        
        putenv("$key=$value");
    }
}

// Set defaults if not in .env
if (!getenv('DB_HOST')) {
    putenv('DB_HOST=localhost');
    putenv('DB_USER=root');
    putenv('DB_PASSWORD=');
    putenv('DB_NAME=automall_db');
    putenv('JWT_SECRET=your_jwt_secret_key');
    putenv('CORS_ORIGIN=http://localhost:5173');
}
