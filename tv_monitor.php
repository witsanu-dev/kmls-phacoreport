<!DOCTYPE html>
<html lang="th" class="h-full bg-slate-900">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TV Board Live Monitor - Cataract Surgery</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Google Fonts: Anuphan -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anuphan:wght@400;600;700;800&display=swap" rel="stylesheet">

  <!-- Phosphor Icons -->
  <script src="https://unpkg.com/@phosphor-icons/web"></script>

  <!-- jQuery & SweetAlert2 -->
  <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

  <!-- Custom CSS -->
  <link rel="stylesheet" href="assets/css/custom.css">
  
  <style>
    body {
      background-color: #0b1329;
      color: #f8fafc;
      font-family: 'Anuphan', sans-serif;
    }
  </style>
</head>
<body class="h-full flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none">

  <!-- Header Bar -->
  <header class="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl backdrop-blur-md">
    <div class="flex items-center space-x-4">
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white text-3xl shadow-lg shadow-orange-500/30 animate-pulse">
        <i class="ph-bold ph-television"></i>
      </div>
      <div>
        <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
          กระดานติดตามการผ่าตัดต้อกระจก Real-Time
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40">
            <span class="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping mr-2"></span> LIVE MONITOR
          </span>
        </h1>
        <p class="text-sm text-slate-400 mt-1">ตารางแสดงสถานะเคสผ่าตัดสำหรับผู้รับบริการและญาติ | อัปเดตอัตโนมัติทันที</p>
      </div>
    </div>

    <!-- Clock & Fullscreen Controls -->
    <div class="flex items-center gap-4">
      <div class="text-right">
        <div id="tvDateStr" class="text-xs text-orange-400 font-semibold uppercase tracking-wider">-- --- ----</div>
        <div id="tvTimeStr" class="text-3xl sm:text-4xl font-mono font-bold text-white tracking-widest leading-none mt-0.5">--:--:--</div>
      </div>
      <button id="btnToggleFullscreen" class="p-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-all" title="เต็มหน้าจอ">
        <i class="ph-bold ph-corners-out text-2xl"></i>
      </button>
    </div>
  </header>

  <!-- Main Board Columns Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 flex-grow overflow-hidden">
    
    <!-- Column 1: เตรียมความพร้อม (Pre-Op) -->
    <div class="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
      <div class="flex items-center justify-between border-b border-indigo-500/30 pb-3 mb-4">
        <h2 class="text-xl font-bold text-indigo-300 flex items-center gap-2">
          <i class="ph-bold ph-drop text-indigo-400 text-2xl"></i>
          1. เตรียมความพร้อม/หยอดยา
        </h2>
        <span id="countPreop" class="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-bold rounded-full text-sm border border-indigo-500/40">0 เคส</span>
      </div>

      <div id="listPreop" class="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
        <!-- Dynamic JS Cards -->
      </div>
    </div>

    <!-- Column 2: กำลังผ่าตัด (In OR) - Glowing Priority -->
    <div class="bg-orange-950/20 border-2 border-orange-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-2xl shadow-orange-500/10">
      <div class="flex items-center justify-between border-b border-orange-500/40 pb-3 mb-4">
        <h2 class="text-xl sm:text-2xl font-extrabold text-orange-400 flex items-center gap-2">
          <span class="w-3.5 h-3.5 rounded-full bg-orange-500 animate-ping"></span>
          <i class="ph-bold ph-activity text-2xl"></i>
          2. กำลังผ่าตัด (In Surgery)
        </h2>
        <span id="countInSurgery" class="px-3.5 py-1 bg-orange-500 text-slate-950 font-black rounded-full text-sm shadow-md animate-bounce">0 เคส</span>
      </div>

      <div id="listInSurgery" class="space-y-3.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
        <!-- Dynamic JS Cards -->
      </div>
    </div>

    <!-- Column 3: ผ่าตัดเสร็จสิ้น & ย้ายหอผู้ป่วย (Post-Op / Transferred) -->
    <div class="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
      <div class="flex items-center justify-between border-b border-emerald-500/30 pb-3 mb-4">
        <h2 class="text-xl font-bold text-emerald-300 flex items-center gap-2">
          <i class="ph-bold ph-check-circle text-emerald-400 text-2xl"></i>
          3. ผ่าตัดเสร็จแล้ว / ย้ายหอผู้ป่วย
        </h2>
        <span id="countPostop" class="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-sm border border-emerald-500/40">0 เคส</span>
      </div>

      <div id="listPostop" class="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
        <!-- Dynamic JS Cards -->
      </div>
    </div>

  </div>

  <!-- Bottom Ticker Bar -->
  <footer class="bg-slate-800/90 border border-slate-700/80 rounded-2xl px-6 py-3 flex items-center justify-between text-xs text-slate-400">
    <div class="flex items-center gap-3">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
      <span>ระบบเชื่อมต่อข้อมูล Real-time (SSE Engine) | ฐานข้อมูล <code>db_phacoreport</code></span>
    </div>
    <div>
      <span class="text-slate-300 font-semibold">ข้อแนะนำ:</span> กรุณารอฟังเสียงเรียกชื่อบริเวณหน้าห้องผ่าตัด
    </div>
  </footer>

  <script src="assets/js/app.js"></script>
  <script>
    function updateClock() {
      const now = new Date();
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear() + 543}`;
      const timeStr = now.toLocaleTimeString('th-TH', { hour12: false });
      $('#tvDateStr').text(dateStr);
      $('#tvTimeStr').text(timeStr);
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Toggle Fullscreen
    $('#btnToggleFullscreen').on('click', function() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          alert(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });

    // Load Board Data
    function loadBoardData() {
      $.getJSON('api/get_patients.php?limit=200', function(res) {
        if (res.success) {
          let preopHtml = '', inSurgeryHtml = '', postopHtml = '';
          let countPre = 0, countIn = 0, countPost = 0;

          res.data.forEach(function(p) {
            const queueBadge = p.queue ? `<span class="w-8 h-8 rounded-xl bg-orange-500 text-white font-extrabold flex items-center justify-center text-sm shadow-md">${p.queue}</span>` : `<span class="text-slate-500 font-mono text-xs">#${p.id}</span>`;
            const nameStr = `${p.pname || ''}${p.fname || ''} ${p.lname || ''}`;
            const wardStr = p.ward ? `<span class="px-2.5 py-1 bg-teal-500/20 text-teal-300 font-semibold rounded-lg text-xs border border-teal-500/30"><i class="ph-bold ph-bed mr-1"></i>${p.ward}</span>` : '';

            if (p.status === 'เตรียมความพร้อม/หยอดยา') {
              countPre++;
              preopHtml += `
                <div class="p-4 rounded-xl bg-slate-800 border-l-4 border-l-indigo-400 flex items-center justify-between gap-3 shadow-md">
                  <div class="flex items-center gap-3">
                    ${queueBadge}
                    <div>
                      <div class="font-bold text-lg text-white">${nameStr}</div>
                      <div class="text-xs text-slate-400">HN: ${p.hn || '-'} | แพทย์: ${p.surgeon || 'ไม่ระบุ'}</div>
                    </div>
                  </div>
                </div>
              `;
            } else if (p.status === 'กำลังผ่าตัด') {
              countIn++;
              inSurgeryHtml += `
                <div class="p-4 rounded-xl bg-orange-950/40 border-l-6 border-l-orange-500 border border-orange-500/30 flex items-center justify-between gap-3 shadow-xl">
                  <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-xl bg-orange-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg">${p.queue || '#'+p.id}</span>
                    <div>
                      <div class="font-black text-xl text-orange-300">${nameStr}</div>
                      <div class="text-xs text-orange-200/80">เริ่ม: ${p.surgery_start_time || '-'} น. | แพทย์: ${p.surgeon || 'ไม่ระบุ'}</div>
                    </div>
                  </div>
                  <span class="px-3 py-1 bg-orange-500/30 text-orange-400 font-bold rounded-full text-xs animate-pulse border border-orange-500/50 flex items-center gap-1">
                    <i class="ph-bold ph-activity"></i> ผ่าตัดอยู่
                  </span>
                </div>
              `;
            } else if (p.status === 'ผ่าตัดเสร็จสิ้น' || p.status === 'ย้ายไปหอผู้ป่วย') {
              countPost++;
              postopHtml += `
                <div class="p-3.5 rounded-xl bg-slate-800/80 border-l-4 border-l-emerald-400 flex items-center justify-between gap-3 shadow-md">
                  <div class="flex items-center gap-3">
                    ${queueBadge}
                    <div>
                      <div class="font-bold text-base text-slate-200">${nameStr}</div>
                      <div class="text-xs text-slate-400">${p.status}</div>
                    </div>
                  </div>
                  <div>
                    ${wardStr}
                  </div>
                </div>
              `;
            }
          });

          $('#countPreop').text(`${countPre} เคส`);
          $('#countInSurgery').text(`${countIn} เคส`);
          $('#countPostop').text(`${countPost} เคส`);

          $('#listPreop').html(preopHtml || '<div class="py-8 text-center text-slate-500 text-sm">ไม่มีเคสเตรียมผ่าตัด</div>');
          $('#listInSurgery').html(inSurgeryHtml || '<div class="py-12 text-center text-slate-500 text-sm">ไม่มีเคสกำลังผ่าตัด</div>');
          $('#listPostop').html(postopHtml || '<div class="py-8 text-center text-slate-500 text-sm">ไม่มีเคสผ่าตัดเสร็จแล้ว</div>');
        }
      });
    }

    loadBoardData();

    // Connect SSE for Real-time push update on TV display
    App.initSSE(function() {
      loadBoardData();
    });
  </script>
</body>
</html>
