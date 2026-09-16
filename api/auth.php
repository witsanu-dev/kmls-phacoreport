<?php
/**
 * Authentication & Authorization API Endpoint - Phaco Report System
 */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$inputRaw = file_get_contents('php://input');
$jsonData = json_decode($inputRaw, true) ?? [];

$action = $_GET['action'] ?? $jsonData['action'] ?? $_POST['action'] ?? 'me';

try {
    $pdo = getDbConnection();

    switch ($action) {
        case 'login':
            if ($method !== 'POST') {
                sendJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
            }

            $username = trim($jsonData['username'] ?? $_POST['username'] ?? '');
            $password = trim($jsonData['password'] ?? $_POST['password'] ?? '');

            if (empty($username) || empty($password)) {
                sendJsonResponse(['success' => false, 'message' => 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'], 400);
            }

            $stmt = $pdo->prepare("SELECT id, username, password_hash, fullname, cid, role, department, is_active FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            if (!$user || !(int)$user['is_active']) {
                sendJsonResponse(['success' => false, 'message' => 'ไม่พบบัญชีผู้ใช้งาน หรือบัญชีถูกระงับการใช้งาน'], 401);
            }

            if (!password_verify($password, $user['password_hash'])) {
                sendJsonResponse(['success' => false, 'message' => 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'], 401);
            }

            // Authentication Successful - Prepare Session Data
            $userData = [
                'id'         => (int)$user['id'],
                'username'   => $user['username'],
                'fullname'   => $user['fullname'],
                'cid'        => $user['cid'],
                'role'       => $user['role'],
                'department' => $user['department']
            ];

            $_SESSION['user'] = $userData;

            sendJsonResponse([
                'success' => true,
                'message' => 'เข้าสู่ระบบสำเร็จ',
                'user'    => $userData,
                'session_id' => session_id()
            ]);
            break;

        case 'logout':
            unset($_SESSION['user']);
            if (session_id()) {
                session_destroy();
            }
            sendJsonResponse([
                'success' => true,
                'message' => 'ออกจากระบบเรียบร้อยแล้ว'
            ]);
            break;

        case 'me':
        case 'check':
            if (!empty($_SESSION['user'])) {
                sendJsonResponse([
                    'success'       => true,
                    'authenticated' => true,
                    'user'          => $_SESSION['user']
                ]);
            } else {
                sendJsonResponse([
                    'success'       => true,
                    'authenticated' => false,
                    'user'          => null
                ]);
            }
            break;

        case 'list_users':
            // Check if admin
            $currentUser = $_SESSION['user'] ?? null;
            if (!$currentUser || $currentUser['role'] !== 'admin') {
                sendJsonResponse(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้งาน'], 403);
            }

            $stmt = $pdo->query("SELECT id, username, fullname, cid, role, department, is_active, created_at, updated_at FROM users ORDER BY id ASC");
            $users = $stmt->fetchAll();

            sendJsonResponse([
                'success' => true,
                'users'   => $users
            ]);
            break;

        default:
            sendJsonResponse(['success' => false, 'message' => 'Unknown auth action'], 400);
            break;
    }

} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'message' => 'เกิดข้อผิดพลาดของระบบล็อกอิน: ' . $e->getMessage()
    ], 500);
}
