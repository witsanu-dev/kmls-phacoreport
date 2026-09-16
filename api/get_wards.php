<?php
require_once __DIR__ . '/../config/database.php';

try {
    $db = getDbConnection();
    $stmt = $db->query("SELECT id, ward_code, ward_name, ward_type, bed_count FROM wards WHERE is_active = 1 ORDER BY sort_order ASC, id ASC");
    $wards = $stmt->fetchAll();
    
    sendJsonResponse([
        'success' => true,
        'data' => $wards
    ]);
} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'message' => $e->getMessage()
    ], 500);
}
