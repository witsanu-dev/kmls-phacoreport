<?php
require_once __DIR__ . '/../config/database.php';

try {
    $db = getDbConnection();
    $type = trim($_GET['type'] ?? '');

    $sql = "SELECT id, provider_type, title, first_name, last_name, license_no, provider_id, position 
            FROM provider 
            WHERE is_active = 1";
    $params = [];

    if ($type !== '') {
        $sql .= " AND provider_type = ?";
        $params[] = $type;
    }

    $sql .= " ORDER BY id ASC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $providers = $stmt->fetchAll();

    $formatted = array_map(function($row) {
        $fullName = trim(($row['title'] ?? '') . $row['first_name'] . ' ' . $row['last_name']);
        return [
            'id' => (int)$row['id'],
            'provider_type' => $row['provider_type'],
            'name' => $fullName,
            'title' => $row['title'] ?? '',
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'license_no' => $row['license_no'] ?? '',
            'provider_id' => $row['provider_id'] ?? '',
            'position' => $row['position'] ?? ''
        ];
    }, $providers);

    sendJsonResponse([
        'success' => true,
        'data' => $formatted
    ]);

} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'message' => $e->getMessage()
    ], 500);
}
