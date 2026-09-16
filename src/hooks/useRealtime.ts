import { useEffect, useRef } from 'react';

export function useRealtime(onUpdate?: (data: any) => void) {
  // ✅ ใช้ ref เก็บ callback เพื่อไม่ให้ effect รีรันเมื่อ component re-render
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let lastSeenTs = 0;
    let toastCooldown = false; // กัน toast ซ้ำภายใน 2 วินาที

    const connect = () => {
      const url = `./api/stream_realtime.php?last_ts=${lastSeenTs}`;
      eventSource = new EventSource(url);

      eventSource.addEventListener('update', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);

          // ✅ ตรวจว่า timestamp ใหม่กว่าที่เคยเห็น (กัน duplicate)
          if (data.timestamp <= lastSeenTs) return;
          lastSeenTs = data.timestamp;

          // Silent background update without interrupting user with toast
          if (onUpdateRef.current) onUpdateRef.current(data);
        } catch (err) {
          console.error('SSE JSON error:', err);
        }
      });

      eventSource.addEventListener('reconnect', (e: MessageEvent) => {
        // รับ last_ts จาก server เมื่อ session 30s หมด → reconnect ต่อเนื่อง
        try {
          const data = JSON.parse(e.data);
          if (data.last_ts) lastSeenTs = data.last_ts;
        } catch {}
        if (eventSource) eventSource.close();
        setTimeout(connect, 200); // reconnect เร็วโดยไม่ reset lastSeenTs
      });

      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
        setTimeout(connect, 3000); // reconnect หลัง error
      };
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []); // ✅ [] = รันครั้งเดียว ไม่ reconnect เมื่อ component re-render
}

