<?php
/**
 * Database Connection & Auth Configuration – Phaco Report
 * ⚠  Values are loaded from config/db.env – Do NOT edit manually.
 *    Use the Settings page (หน้าตั้งค่า) to change connection parameters.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$_dbEnv = is_file(__DIR__ . '/db.env')
    ? parse_ini_file(__DIR__ . '/db.env')
    : [];

define('DB_HOST',    $_dbEnv['DB_HOST']    ?? 'localhost');
define('DB_PORT',    $_dbEnv['DB_PORT']    ?? '3306');
define('DB_NAME',    $_dbEnv['DB_NAME']    ?? 'db_phacoreport');
define('DB_USER',    $_dbEnv['DB_USER']    ?? 'root');
define('DB_PASS',    $_dbEnv['DB_PASS']    ?? '');
define('DB_CHARSET', $_dbEnv['DB_CHARSET'] ?? 'utf8mb4');

function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=%s",
                DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
            );
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            $pdo->exec("SET time_zone = '+07:00'");
            $pdo->exec("SET NAMES utf8mb4");
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    return $pdo;
}

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function getAuthUser() {
    return $_SESSION['user'] ?? null;
}

function isWriteAllowed() {
    $user = getAuthUser();
    if (!$user) {
        return true; // Allow guest for now if not strictly enforced, or change to false if login required
    }
    return ($user['role'] !== 'provider');
}

function requireWritePermission() {
    $user = getAuthUser();
    if ($user && $user['role'] === 'provider') {
        sendJsonResponse([
            'success' => false,
            'message' => 'สิทธิของคุณ (Provider) สามารถอ่านได้อย่างเดียว ไม่สามารถบันทึกหรือแก้ไขข้อมูลได้'
        ], 403);
    }
}
