<?php
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

// Enforce Role-Based Access Control
requireWritePermission();

// Handle JSON input or standard POST data
$inputRaw = file_get_contents('php://input');
$jsonData = json_decode($inputRaw, true);
$data = is_array($jsonData) ? $jsonData : $_POST;

$id = isset($data['id']) ? (int)$data['id'] : 0;
if (!$id) {
    sendJsonResponse(['success' => false, 'message' => 'Invalid or missing Patient ID (id)'], 400);
}

try {
    $db = getDbConnection();
    
    // Check if patient exists
    $stmtCheck = $db->prepare("SELECT id, fname, lname, status FROM screen WHERE id = ?");
    $stmtCheck->execute([$id]);
    $patient = $stmtCheck->fetch();
    
    if (!$patient) {
        sendJsonResponse(['success' => false, 'message' => 'Patient record not found'], 404);
    }
    
    // Check duplicate queue number
    if (isset($data['queue']) && (int)$data['queue'] > 0) {
        $qVal = (int)$data['queue'];
        $stmtDup = $db->prepare("SELECT id, pname, fname, lname FROM screen WHERE queue = ? AND id != ?");
        $stmtDup->execute([$qVal, $id]);
        $dup = $stmtDup->fetch();
        if ($dup) {
            $dupName = trim(($dup['pname'] ?? '') . ' ' . ($dup['fname'] ?? '') . ' ' . ($dup['lname'] ?? ''));
            sendJsonResponse([
                'success' => false,
                'message' => "ลำดับคิวผ่าตัดหมายเลข {$qVal} ซ้ำกับผู้ป่วยคุณ \"{$dupName}\" (ID #{$dup['id']}) กรุณาระบุลำดับคิวใหม่"
            ], 400);
        }
    }
    
    // Prepare update parameters
    $fields = [];
    $params = [];
    
    $allowedFields = [
        'queue'               => 'int',
        'surgery_date'        => 'string',
        'status'              => 'string',
        'ward'                => 'string',
        'va_right_eye'        => 'string',
        'va_left_eye'         => 'string',
        'lens_power'          => 'string',
        'lens_type'           => 'string',
        'lens_serial_no'      => 'string',
        'lens_lot_no'         => 'string',
        'lens_expiry_date'    => 'string',
        'complication'        => 'string',
        'surgeon'             => 'string',
        'scrub_nurse'         => 'string',
        'circulating_nurse_1' => 'string',
        'circulating_nurse_2' => 'string',
        'surgery_start_time'  => 'string',
        'surgery_end_time'    => 'string',
        'surgery_method'      => 'string',
        'note'                => 'string'
    ];
    
    foreach ($allowedFields as $field => $type) {
        if (array_key_exists($field, $data)) {
            $val = $data[$field];
            if ($val === '' || $val === null) {
                $fields[] = "`{$field}` = NULL";
            } else {
                $fields[] = "`{$field}` = ?";
                $params[] = ($type === 'int') ? (int)$val : trim($val);
            }
        }
    }
    
    if (empty($fields)) {
        sendJsonResponse(['success' => false, 'message' => 'No fields provided to update'], 400);
    }
    
    $sql = "UPDATE screen SET " . implode(', ', $fields) . " WHERE id = ?";
    $params[] = $id;
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    // Touch live update state file to signal real-time clients instantly via SSE
    $lastUpdateFile = __DIR__ . '/last_update.json';
    $updateData = [
        'timestamp' => microtime(true),
        'patient_id' => $id,
        'patient_name' => trim(($patient['fname'] ?? '') . ' ' . ($patient['lname'] ?? '')),
        'old_status' => $patient['status'] ?? '',
        'new_status' => $data['status'] ?? ($patient['status'] ?? ''),
        'updated_at' => date('Y-m-d H:i:s')
    ];
    file_put_contents($lastUpdateFile, json_encode($updateData, JSON_UNESCAPED_UNICODE));
    
    sendJsonResponse([
        'success' => true,
        'message' => 'อัปเดตข้อมูลผู้ป่วยสำเร็จ',
        'data' => $updateData
    ]);
    
} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'message' => $e->getMessage()
    ], 500);
}
