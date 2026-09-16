<?php
/**
 * Server-Sent Events (SSE) Real-Time Broadcast Endpoint
 * Cataract Surgery Real-Time Monitoring System
 */

@ini_set('zlib.output_compression', 0);
@ini_set('implicit_flush', 1);
@ob_end_clean();
set_time_limit(0);

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');
header('Access-Control-Allow-Origin: *');

$lastUpdateFile = __DIR__ . '/last_update.json';
$lastClientSeen = isset($_GET['last_ts']) ? (float)$_GET['last_ts'] : 0;

// Send initial connection ping
echo "event: connected\n";
echo 'data: ' . json_encode(['status' => 'connected', 'timestamp' => microtime(true)]) . "\n\n";
@ob_flush(); @flush();

$start = time();
$maxDuration = 30; // 30s ก่อน auto-reconnect
$lastPing    = $start;
$eventSent   = false; // ✅ track ว่าส่ง event ไปแล้วหรือยัง

while ((time() - $start) < $maxDuration) {

    // ✅ ตรวจ update file
    if (!$eventSent && file_exists($lastUpdateFile)) {
        $content = @file_get_contents($lastUpdateFile);
        if ($content !== false) {
            $data = json_decode($content, true);
            if ($data && isset($data['timestamp']) && (float)$data['timestamp'] > $lastClientSeen) {
                $lastClientSeen = (float)$data['timestamp'];
                $eventSent = true; // ✅ mark ว่าส่งแล้ว

                echo "event: update\n";
                echo 'data: ' . json_encode($data, JSON_UNESCAPED_UNICODE) . "\n\n";
                @ob_flush(); @flush();

                // ✅ ส่งแล้วหยุดเลย — ไม่ส่งซ้ำในรอบเดียวกัน
                // client จะ reconnect ด้วย last_ts ใหม่ (ผ่าน event reconnect ข้างล่าง)
                break;
            }
        }
    }

    // Heartbeat ping ทุก 15 วินาที (ลดความถี่ลง)
    $now = time();
    if ($now - $lastPing >= 15) {
        $lastPing = $now;
        echo "event: ping\n";
        echo 'data: ' . json_encode(['time' => $now]) . "\n\n";
        @ob_flush(); @flush();
    }

    usleep(500000); // ตรวจทุก 0.5 วินาที
}

// ✅ ส่ง last_ts กลับไปให้ client ใช้ตอน reconnect (ไม่ reset เป็น 0)
echo "event: reconnect\n";
echo 'data: ' . json_encode(['last_ts' => $lastClientSeen]) . "\n\n";
@ob_flush(); @flush();

