<?php
/**
 * Database Table Initializer for Users - Phaco Report System
 */
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = getDbConnection();

    // 1. Create `users` table if not exists
    $sqlCreateTable = "CREATE TABLE IF NOT EXISTS `users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `username` VARCHAR(50) NOT NULL UNIQUE,
        `password_hash` VARCHAR(255) NOT NULL,
        `fullname` VARCHAR(150) NOT NULL,
        `cid` VARCHAR(13) NOT NULL,
        `role` ENUM('admin', 'doctor', 'nurse', 'provider') NOT NULL DEFAULT 'provider',
        `department` VARCHAR(100) DEFAULT NULL,
        `is_active` TINYINT(1) NOT NULL DEFAULT 1,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sqlCreateTable);

    // 2. Initial Seed Users
    $defaultUsers = [
        [
            'username' => 'admin',
            'password' => 'admin1234',
            'fullname' => 'ผู้ดูแลระบบ (Admin)',
            'cid'      => '1100100012345',
            'role'     => 'admin',
            'dept'     => 'ศูนย์คอมพิวเตอร์ / เวชระเบียน'
        ],
        [
            'username' => 'doctor1',
            'password' => 'doc1234',
            'fullname' => 'นพ.สมชาย สายตาดี',
            'cid'      => '2100100054321',
            'role'     => 'doctor',
            'dept'     => 'จักษุแพทย์ (Ophthalmology)'
        ],
        [
            'username' => 'nurse1',
            'password' => 'nurse1234',
            'fullname' => 'พว.สมหญิง ใจดี',
            'cid'      => '3100100098765',
            'role'     => 'nurse',
            'dept'     => 'ห้องผ่าตัดตา (OR Eye)'
        ],
        [
            'username' => 'provider1',
            'password' => 'provider1234',
            'fullname' => 'เจ้าหน้าที่ทั่วไป (Provider)',
            'cid'      => '4100100011223',
            'role'     => 'provider',
            'dept'     => 'หอผู้ป่วย / หน่วยคัดกรอง'
        ]
    ];

    $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmtInsert = $pdo->prepare("INSERT INTO users (username, password_hash, fullname, cid, role, department, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)");
    $stmtUpdate = $pdo->prepare("UPDATE users SET password_hash = ?, fullname = ?, cid = ?, role = ?, department = ?, is_active = 1 WHERE username = ?");

    $createdCount = 0;
    $updatedCount = 0;

    foreach ($defaultUsers as $u) {
        $hash = password_hash($u['password'], PASSWORD_BCRYPT);
        $stmtCheck->execute([$u['username']]);
        $existing = $stmtCheck->fetch();

        if ($existing) {
            $stmtUpdate->execute([$hash, $u['fullname'], $u['cid'], $u['role'], $u['dept'], $u['username']]);
            $updatedCount++;
        } else {
            $stmtInsert->execute([$u['username'], $hash, $u['fullname'], $u['cid'], $u['role'], $u['dept']]);
            $createdCount++;
        }
    }

    sendJsonResponse([
        'success' => true,
        'message' => 'สร้างและเตรียมตาราง users สำเร็จ!',
        'created_users' => $createdCount,
        'updated_users' => $updatedCount,
        'users_table' => 'users'
    ]);

} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'message' => 'เกิดข้อผิดพลาดในการสร้างตาราง users: ' . $e->getMessage()
    ], 500);
}
