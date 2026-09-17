<?php
require_once __DIR__ . '/../config/database.php';

try {
    $db = getDbConnection();
    
    // 1. Single patient lookup by ID
    if (isset($_GET['id']) && !empty($_GET['id'])) {
        $id = (int)$_GET['id'];
        $stmt = $db->prepare("SELECT * FROM screen WHERE id = ?");
        $stmt->execute([$id]);
        $patient = $stmt->fetch();
        if ($patient) {
            sendJsonResponse(['success' => true, 'data' => $patient]);
        } else {
            sendJsonResponse(['success' => false, 'message' => 'Patient not found'], 404);
        }
    }
    
    // 2. Select2 Search Endpoint (combobox search)
    if (isset($_GET['select2']) && $_GET['select2'] === '1') {
        $q = trim($_GET['q'] ?? '');
        $sql = "SELECT id, screening_no, cid, hn, pname, fname, lname, age, status, ward, queue, surgery_date 
                FROM screen WHERE 1=1";
        $params = [];
        
        $orderBy = "ORDER BY id DESC";
        if ($q !== '') {
            if (is_numeric($q)) {
                $numVal = (int)$q;
                $sql .= " AND (screening_no = ? OR id = ? OR screening_no LIKE ? OR cid LIKE ? OR fname LIKE ? OR lname LIKE ? OR hn LIKE ?)";
                $searchTerm = "%{$q}%";
                $params = [$numVal, $numVal, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm];
                $orderBy = "ORDER BY CASE WHEN screening_no = {$numVal} THEN 0 WHEN id = {$numVal} THEN 1 ELSE 2 END, id DESC";
            } else {
                $sql .= " AND (screening_no LIKE ? OR cid LIKE ? OR fname LIKE ? OR lname LIKE ? OR hn LIKE ? OR id LIKE ? OR surgeon LIKE ? OR ward LIKE ? OR surgery_method LIKE ?)";
                $searchTerm = "%{$q}%";
                $params = [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm];
            }
        }
        
        $sql .= " {$orderBy} LIMIT 30";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll();
        
        $formatted = array_map(function($row) {
            $fullName = trim(($row['pname'] ?? '') . ' ' . ($row['fname'] ?? '') . ' ' . ($row['lname'] ?? ''));
            $scrStr = !empty($row['screening_no']) ? " [คัดกรอง: {$row['screening_no']}]" : '';
            $hnStr = !empty($row['hn']) ? " [HN: {$row['hn']}]" : '';
            $cidStr = !empty($row['cid']) ? " [CID: {$row['cid']}]" : '';
            $ageStr = !empty($row['age']) ? " ({$row['age']} ปี)" : '';
            return [
                'id' => $row['id'],
                'text' => "{$fullName}{$ageStr}{$scrStr}{$hnStr}{$cidStr} | สถานะ: " . ($row['status'] ?? 'รอผ่าตัด'),
                'patient' => $row
            ];
        }, $results);
        
        sendJsonResponse(['results' => $formatted]);
    }
    
    // 3. General Listing & Filtering for Dashboard and DataTables
    $status = trim($_GET['status'] ?? '');
    $ward = trim($_GET['ward'] ?? '');
    $surgeon = trim($_GET['surgeon'] ?? '');
    $surgery_date = trim($_GET['surgery_date'] ?? '');
    $surgery_method = trim($_GET['surgery_method'] ?? '');
    $keyword = trim($_GET['keyword'] ?? '');
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 9999;
    
    $sql = "SELECT * FROM screen WHERE 1=1";
    $params = [];
    
    if ($status !== '') {
        if ($status === 'เตรียมผ่าตัด' || $status === 'เตรียมความพร้อม/หยอดยา') {
            $sql .= " AND (status = 'เตรียมผ่าตัด' OR status = 'เตรียมความพร้อม/หยอดยา')";
        } else {
            $sql .= " AND status = ?";
            $params[] = $status;
        }
    }
    if ($ward !== '') {
        $sql .= " AND ward = ?";
        $params[] = $ward;
    }
    if ($surgeon !== '') {
        $sql .= " AND surgeon = ?";
        $params[] = $surgeon;
    }
    if ($surgery_date !== '') {
        $sql .= " AND surgery_date = ?";
        $params[] = $surgery_date;
    }
    if ($surgery_method !== '') {
        $sql .= " AND surgery_method LIKE ?";
        $params[] = "%{$surgery_method}%";
    }
    if ($keyword !== '') {
        $sql .= " AND (cid LIKE ? OR fname LIKE ? OR lname LIKE ? OR hn LIKE ? OR screening_no LIKE ? OR id LIKE ?)";
        $kw = "%{$keyword}%";
        $params[] = $kw;
        $params[] = $kw;
        $params[] = $kw;
        $params[] = $kw;
        $params[] = $kw;
        $params[] = $kw;
    }
    
    // Sort: queued patients first (queue ASC), then no-queue by status priority → id DESC (newest)
    $sql .= " ORDER BY 
        CASE WHEN queue IS NULL OR queue = 0 THEN 1 ELSE 0 END ASC,
        CASE WHEN queue IS NULL OR queue = 0 THEN NULL ELSE queue END ASC,
        CASE 
            WHEN status = 'กำลังผ่าตัด' THEN 1
            WHEN status = 'เตรียมผ่าตัด' OR status = 'เตรียมความพร้อม/หยอดยา' THEN 2
            WHEN status = 'รอผ่าตัด' THEN 3
            WHEN status = 'ผ่าตัดเสร็จสิ้น' THEN 4
            WHEN status = 'ย้ายไปหอผู้ป่วย' THEN 5
            ELSE 6
        END ASC,
        id DESC
        LIMIT {$limit}";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $patients = $stmt->fetchAll();
    
    sendJsonResponse([
        'success' => true,
        'count' => count($patients),
        'data' => $patients
    ]);
    
} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'message' => $e->getMessage()
    ], 500);
}
