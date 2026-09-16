<?php
require_once __DIR__ . '/../config/database.php';

try {
    $db = getDbConnection();
    
    $filterDate = trim($_GET['date'] ?? '');
    $filterStatus = trim($_GET['status'] ?? '');
    $filterMethod = trim($_GET['method'] ?? '');
    
    $whereClauses = [];
    $params = [];
    
    if (!empty($filterDate)) {
        $whereClauses[] = "surgery_date = ?";
        $params[] = $filterDate;
    }
    if (!empty($filterStatus)) {
        $whereClauses[] = "status = ?";
        $params[] = $filterStatus;
    }
    if (!empty($filterMethod)) {
        $whereClauses[] = "surgery_method LIKE ?";
        $params[] = "%{$filterMethod}%";
    }
    
    $where = "";
    if (count($whereClauses) > 0) {
        $where = " WHERE " . implode(" AND ", $whereClauses) . " ";
    }
    
    // 1. Status breakdown counts
    $sqlStatus = "SELECT status, COUNT(*) as cnt FROM screen {$where} GROUP BY status";
    $stmtStatus = $db->prepare($sqlStatus);
    $stmtStatus->execute($params);
    $statusCountsRaw = $stmtStatus->fetchAll();
    
    $statusCounts = [
        'รอผ่าตัด' => 0,
        'เตรียมผ่าตัด' => 0,
        'กำลังผ่าตัด' => 0,
        'ผ่าตัดเสร็จสิ้น' => 0,
        'ย้ายไปหอผู้ป่วย' => 0,
        'ยกเลิก/เลื่อน' => 0
    ];
    
    $totalCount = 0;
    foreach ($statusCountsRaw as $row) {
        $st = trim($row['status'] ?? '');
        if ($st === '') $st = 'รอผ่าตัด';
        $cnt = (int)$row['cnt'];
        
        if ($st === 'เตรียมความพร้อม/หยอดยา' || $st === 'เตรียมผ่าตัด') {
            $statusCounts['เตรียมผ่าตัด'] += $cnt;
        } else if (array_key_exists($st, $statusCounts)) {
            $statusCounts[$st] += $cnt;
        } else {
            if (mb_strpos($st, 'เตรียม') !== false) {
                $statusCounts['เตรียมผ่าตัด'] += $cnt;
            } else if (mb_strpos($st, 'กำลัง') !== false) {
                $statusCounts['กำลังผ่าตัด'] += $cnt;
            } else if (mb_strpos($st, 'เสร็จ') !== false) {
                $statusCounts['ผ่าตัดเสร็จสิ้น'] += $cnt;
            } else if (mb_strpos($st, 'ย้าย') !== false || mb_strpos($st, 'หอ') !== false) {
                $statusCounts['ย้ายไปหอผู้ป่วย'] += $cnt;
            } else if (mb_strpos($st, 'ยกเลิก') !== false || mb_strpos($st, 'เลื่อน') !== false) {
                $statusCounts['ยกเลิก/เลื่อน'] += $cnt;
            } else {
                $statusCounts['รอผ่าตัด'] += $cnt;
            }
        }
        $totalCount += $cnt;
    }
    
    // 2. Ward breakdown counts
    // Build qualified ward JOIN conditions (s.column_name) from the same filter inputs
    $wardJoinClauses = [];
    $wardParams = [];
    if (!empty($filterDate)) {
        $wardJoinClauses[] = "s.surgery_date = ?";
        $wardParams[] = $filterDate;
    }
    if (!empty($filterStatus)) {
        $wardJoinClauses[] = "s.status = ?";
        $wardParams[] = $filterStatus;
    }
    if (!empty($filterMethod)) {
        $wardJoinClauses[] = "s.surgery_method LIKE ?";
        $wardParams[] = "%{$filterMethod}%";
    }
    $wardJoinExtra = count($wardJoinClauses) > 0 ? " AND " . implode(" AND ", $wardJoinClauses) : "";

    $sqlWard = "SELECT w.ward_name, COUNT(s.id) as cnt 
                FROM wards w 
                LEFT JOIN screen s ON s.ward = w.ward_name{$wardJoinExtra}
                WHERE w.is_active = 1 
                GROUP BY w.id, w.ward_name 
                ORDER BY w.sort_order ASC";
    $stmtWard = $db->prepare($sqlWard);
    $stmtWard->execute($wardParams);
    $wardStats = $stmtWard->fetchAll();
    
    // 3. Surgery Method / Type stats by exact surgery_method values
    $sqlType = "SELECT 
                    COALESCE(NULLIF(TRIM(surgery_method), ''), 'Phaco iol/RE') as surgery_type,
                    COUNT(*) as cnt 
                FROM screen {$where} 
                GROUP BY surgery_type 
                ORDER BY cnt DESC";
    $stmtType = $db->prepare($sqlType);
    $stmtType->execute($params);
    $typeStats = $stmtType->fetchAll();

    // 4. Surgeon stats - build WHERE that includes surgeon filter AND the global filters
    $surgeonClauses = array_merge($whereClauses, ["surgeon IS NOT NULL", "surgeon != ''"]);
    $sqlSurgeon = "SELECT surgeon, COUNT(*) as cnt FROM screen WHERE " . implode(" AND ", $surgeonClauses) . " GROUP BY surgeon ORDER BY cnt DESC LIMIT 10";
    $stmtSurgeon = $db->prepare($sqlSurgeon);
    $stmtSurgeon->execute($params);
    $surgeonStats = $stmtSurgeon->fetchAll();
    
    // 5. Active Patients list (กำลังผ่าตัด & เตรียมผ่าตัด)
    $activeWhere = ["status IN ('กำลังผ่าตัด', 'เตรียมความพร้อม/หยอดยา', 'เตรียมผ่าตัด')"];
    $activeParams = [];
    if (!empty($filterDate)) {
        $activeWhere[] = "surgery_date = ?";
        $activeParams[] = $filterDate;
    }
    if (!empty($filterMethod)) {
        $activeWhere[] = "surgery_method LIKE ?";
        $activeParams[] = "%{$filterMethod}%";
    }
    if (!empty($filterStatus)) {
        if ($filterStatus === 'เตรียมผ่าตัด' || $filterStatus === 'เตรียมความพร้อม/หยอดยา') {
            $activeWhere[] = "(status = 'เตรียมผ่าตัด' OR status = 'เตรียมความพร้อม/หยอดยา')";
        } else {
            $activeWhere[] = "status = ?";
            $activeParams[] = $filterStatus;
        }
    }
    $activeWhereSql = " WHERE " . implode(" AND ", $activeWhere);

    $sqlActive = "SELECT id, queue, hn, pname, fname, lname, age, surgeon, surgery_method, surgery_start_time, status, ward, note 
                  FROM screen 
                  {$activeWhereSql} 
                  ORDER BY CASE WHEN status = 'กำลังผ่าตัด' THEN 1 ELSE 2 END ASC, queue ASC LIMIT 10";
    $stmtActive = $db->prepare($sqlActive);
    $stmtActive->execute($activeParams);
    $activePatients = $stmtActive->fetchAll();
    
    sendJsonResponse([
        'success' => true,
        'timestamp' => time(),
        'metrics' => [
            'total'            => $totalCount,
            'waiting'          => $statusCounts['รอผ่าตัด'],
            'preop'            => $statusCounts['เตรียมผ่าตัด'],
            'in_surgery'       => $statusCounts['กำลังผ่าตัด'],
            'postop'           => $statusCounts['ผ่าตัดเสร็จสิ้น'],
            'transferred_ward' => $statusCounts['ย้ายไปหอผู้ป่วย'],
            'cancelled'        => $statusCounts['ยกเลิก/เลื่อน']
        ],
        'status_counts'   => $statusCounts,
        'ward_stats'      => $wardStats,
        'surgery_types'   => $typeStats,
        'surgeon_stats'   => $surgeonStats,
        'active_patients' => $activePatients
    ]);
    
} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'message' => $e->getMessage()
    ], 500);
}
