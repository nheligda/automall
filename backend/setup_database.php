<?php
/**
 * Database Setup Script
 * This script imports the automall_schema.sql file into MySQL
 */

// Database credentials
$db_host = 'localhost';
$db_user = 'root';
$db_password = '';

// Create connection
$conn = new mysqli($db_host, $db_user, $db_password);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Read SQL file
$sql_file = dirname(__DIR__) . '/database/automall_schema.sql';

if (!file_exists($sql_file)) {
    die("SQL file not found: " . $sql_file);
}

$sql_content = file_get_contents($sql_file);

// Execute each statement
$success_count = 0;
$error_count = 0;
$errors = [];

echo "<!DOCTYPE html>
<html>
<head>
    <title>Database Setup</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 5px; max-width: 800px; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        .statement { margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #ddd; }
        pre { background: #f0f0f0; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
<div class='container'>
    <h1>🗄️ AUTOMALL Database Setup</h1>
    <p>Importing database schema...</p>
    <hr>";

// Better parsing that handles DELIMITER
$lines = preg_split('/\n/', $sql_content);
$current_statement = '';
$delimiter = ';';
$in_statement = false;

foreach ($lines as $line) {
    $trimmed = trim($line);
    
    // Skip empty lines and comments
    if (empty($trimmed) || preg_match('/^--/', $trimmed)) {
        continue;
    }
    
    // Handle DELIMITER changes
    if (preg_match('/^DELIMITER\s+(.+)$/i', $trimmed, $matches)) {
        $delimiter = trim($matches[1]);
        continue;
    }
    
    // Add line to current statement
    $current_statement .= $line . "\n";
    
    // Check if statement ends with current delimiter
    if (preg_match('#' . preg_quote($delimiter, '#') . '\s*$#', $trimmed)) {
        $stmt = trim($current_statement);
        if (!empty($stmt)) {
            // Remove the delimiter from the end for execution
            $stmt = preg_replace('#' . preg_quote($delimiter, '#') . '\s*$#', '', $stmt);
            
            if (!empty($stmt) && !preg_match('/^DELIMITER/i', $stmt)) {
                // Execute query
                if ($conn->query($stmt)) {
                    $success_count++;
                    echo "<div class='statement success'>✓ Statement " . ($success_count + $error_count) . " executed successfully</div>";
                } else {
                    $error_count++;
                    echo "<div class='statement error'>✗ Statement " . ($success_count + $error_count) . " failed: " . $conn->error . "</div>";
                }
            }
        }
        $current_statement = '';
        $delimiter = ';'; // Reset delimiter
    }
}

echo "<hr>";
echo "<h2>Results:</h2>";
echo "<p class='info'>✓ Successful: <strong>" . $success_count . "</strong></p>";
if ($error_count > 0) {
    echo "<p class='error'>✗ Failed: <strong>" . $error_count . "</strong></p>";
}

// Check if database was created
$result = $conn->query("SHOW DATABASES LIKE 'automall_db'");
if ($result && $result->num_rows > 0) {
    echo "<p class='success'><strong>✓ Database 'automall_db' successfully created!</strong></p>";
    
    // Check tables
    $conn->select_db('automall_db');
    $tables_result = $conn->query("SHOW TABLES");
    $table_count = $tables_result ? $tables_result->num_rows : 0;
    echo "<p class='success'><strong>✓ Tables created: " . $table_count . "</strong></p>";
    
    if ($table_count > 0) {
        echo "<p class='info'><strong>Tables in automall_db:</strong></p>";
        echo "<ul>";
        while ($table = $tables_result->fetch_row()) {
            echo "<li>" . $table[0] . "</li>";
        }
        echo "</ul>";
    }
} else {
    echo "<p class='error'><strong>✗ Database 'automall_db' was not created!</strong></p>";
}

echo "</div></body></html>";

$conn->close();
?>
