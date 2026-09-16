<?php
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $startTime = microtime(true);
    
    // Test custom POST parameters if provided, otherwise default getDbConnection
    $input = json_decode(file_get_contents('php://input'), true);
    
    $host = !empty($input['host']) ? $input['host'] : DB_HOST;
    $port = !empty($input['port']) ? $input['port'] : DB_PORT;
    $dbname = !empty($input['dbname']) ? $input['dbname'] : DB_NAME;
    $user = !empty($input['user']) ? $input['user'] : DB_USER;
    $pass = isset($input['pass']) ? $input['pass'] : DB_PASS;
    
    $dsn = sprintf("mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4", $host, $port, $dbname);
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 3,
    ];
    
    $testPdo = new PDO($dsn, $user, $pass, $options);
    $testPdo->exec("SET time_zone = '+07:00'");
    
    $endTime = microtime(true);
    $latencyMs = round(($endTime - $startTime) * 1000, 2);
    
    // Query MySQL version & record count
    $stmtVer = $testPdo->query("SELECT VERSION() as ver");
    $ver = $stmtVer->fetch()['ver'] ?? 'Unknown';
    
    $stmtCnt = $testPdo->query("SELECT COUNT(*) as cnt FROM screen");
    $screenCount = $stmtCnt->fetch()['cnt'] ?? 0;
    
    sendJsonResponse([
        'success' => true,
        'message' => 'เชื่อมต่อฐานข้อมูลสำเร็จ!',
        'latency_ms' => $latencyMs,
        'mysql_version' => $ver,
        'screen_records' => $screenCount,
        'config' => [
            'host' => $host,
            'port' => $port,
            'dbname' => $dbname,
            'user' => $user,
            'charset' => 'utf8mb4',
            'timezone' => 'Asia/Bangkok (+07:00)'
        ]
    ]);
    
} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'message' => 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ' . $e->getMessage()
    ], 200);
}
