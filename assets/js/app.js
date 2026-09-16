/**
 * App JS - Cataract Surgery Real-Time Monitoring System
 * Handles SSE Real-time synchronization, Toast Alerts, and Status Helpers
 */

const App = {
  // Real-time SSE Connection Holder
  eventSource: null,
  lastSeenTs: 0,

  // Toast Alert Notification (SweetAlert2)
  toast: Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  }),

  // Get status badge HTML
  getStatusBadge: function(status) {
    status = status || 'รอผ่าตัด';
    let badgeClass = 'badge-waiting';
    let icon = 'ph-clock';
    
    switch(status) {
      case 'รอผ่าตัด':
        badgeClass = 'badge-waiting';
        icon = 'ph-clock';
        break;
      case 'เตรียมความพร้อม/หยอดยา':
        badgeClass = 'badge-preop';
        icon = 'ph-drop';
        break;
      case 'กำลังผ่าตัด':
        badgeClass = 'badge-in_surgery';
        icon = 'ph-activity';
        break;
      case 'ผ่าตัดเสร็จสิ้น':
        badgeClass = 'badge-postop';
        icon = 'ph-check-circle';
        break;
      case 'ย้ายไปหอผู้ป่วย':
        badgeClass = 'badge-transferred';
        icon = 'ph-bed';
        break;
      case 'ยกเลิก/เลื่อน':
        badgeClass = 'badge-cancelled';
        icon = 'ph-x-circle';
        break;
    }
    
    return `<span class="badge-status ${badgeClass}">
      <i class="ph-bold ${icon}"></i>
      ${status}
    </span>`;
  },

  // Initialize SSE (Server-Sent Events) for instant live updates across all open browser tabs
  initSSE: function(onUpdateCallback) {
    if (!window.EventSource) {
      console.warn('Browser does not support Server-Sent Events. Real-time will fall back to polling.');
      setInterval(() => {
        if (typeof onUpdateCallback === 'function') onUpdateCallback();
      }, 5000);
      return;
    }

    const connectSSE = () => {
      const url = `api/stream_realtime.php?last_ts=${App.lastSeenTs}`;
      App.eventSource = new EventSource(url);

      App.eventSource.addEventListener('update', (e) => {
        try {
          const data = JSON.parse(e.data);
          App.lastSeenTs = data.timestamp;
          
          // Toast Notification
          App.toast.fire({
            icon: 'info',
            title: 'อัปเดตข้อมูล Real-time',
            text: `เคส ${data.patient_name} เปลี่ยนสถานะเป็น "${data.new_status}"`
          });

          if (typeof onUpdateCallback === 'function') {
            onUpdateCallback(data);
          }
        } catch (err) {
          console.error('Error parsing SSE event data:', err);
        }
      });

      App.eventSource.addEventListener('reconnect', (e) => {
        App.eventSource.close();
        setTimeout(connectSSE, 1000);
      });

      App.eventSource.onerror = (e) => {
        console.warn('SSE Connection interrupted, reconnecting in 3s...');
        App.eventSource.close();
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();
  },

  // Helper to format Thai Date
  formatThaiDate: function(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  }
};
