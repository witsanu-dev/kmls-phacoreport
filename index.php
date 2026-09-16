<?php require_once 'includes/header.php'; ?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

  <!-- Top Hero & Date Selector -->
  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-orange-100 shadow-sm">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl font-bold shadow-xs">
        <i class="ph-bold ph-chart-line-up"></i>
      </div>
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Executive Surgical Monitor Dashboard</h2>
        <p class="text-xs text-slate-500 mt-0.5">ภาพรวมการผ่าตัดต้อกระจกและการย้ายเข้าหอผู้ป่วยย่อแบบ Real-time</p>
      </div>
    </div>

    <!-- Date & Real-time Status Badge -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 bg-orange-50/80 px-3.5 py-2 rounded-xl border border-orange-200 text-slate-700 text-xs font-semibold">
        <i class="ph-bold ph-calendar-blank text-orange-500 text-base"></i>
        <span>วันที่ผ่าตัด:</span>
        <input type="date" id="filterSurgeryDate" value="" class="bg-transparent font-bold text-orange-700 focus:outline-none">
      </div>
      <button id="btnRefreshDashboard" class="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs transition-all flex items-center justify-center" title="รีเฟรชข้อมูล">
        <i class="ph-bold ph-arrows-clockwise text-lg"></i>
      </button>
    </div>
  </div>

  <!-- KPI Metric Cards Grid -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
    
    <!-- Total Patients -->
    <div class="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-slate-400">
      <div class="flex items-center justify-between text-slate-500 text-xs font-semibold">
        <span>เคสทั้งหมด</span>
        <i class="ph-bold ph-users text-lg text-slate-400"></i>
      </div>
      <div id="kpiTotal" class="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">0</div>
      <div class="text-[11px] text-slate-400 mt-1">ผู้รับบริการรวม</div>
    </div>

    <!-- Waiting -->
    <div class="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-amber-400">
      <div class="flex items-center justify-between text-amber-700 text-xs font-semibold">
        <span>รอผ่าตัด</span>
        <i class="ph-bold ph-clock text-lg text-amber-500"></i>
      </div>
      <div id="kpiWaiting" class="text-2xl sm:text-3xl font-bold text-amber-600 mt-2">0</div>
      <div class="text-[11px] text-amber-600/70 mt-1">รอเรียกคิว</div>
    </div>

    <!-- Pre-op Prep -->
    <div class="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-indigo-400">
      <div class="flex items-center justify-between text-indigo-700 text-xs font-semibold">
        <span>เตรียมผ่าตัด</span>
        <i class="ph-bold ph-drop text-lg text-indigo-500"></i>
      </div>
      <div id="kpiPreop" class="text-2xl sm:text-3xl font-bold text-indigo-600 mt-2">0</div>
      <div class="text-[11px] text-indigo-600/70 mt-1">หยอดยา/ขยายม่านตา</div>
    </div>

    <!-- In Surgery (Live Pulse) -->
    <div class="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-orange-500 bg-orange-50/30">
      <div class="flex items-center justify-between text-orange-700 text-xs font-semibold">
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
          กำลังผ่าตัด
        </span>
        <i class="ph-bold ph-activity text-lg text-orange-500"></i>
      </div>
      <div id="kpiInSurgery" class="text-2xl sm:text-3xl font-bold text-orange-600 mt-2">0</div>
      <div class="text-[11px] text-orange-600/70 mt-1">อยู่ใน OR</div>
    </div>

    <!-- Post-op Recovery -->
    <div class="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-emerald-400">
      <div class="flex items-center justify-between text-emerald-700 text-xs font-semibold">
        <span>ผ่าตัดเสร็จสิ้น</span>
        <i class="ph-bold ph-check-circle text-lg text-emerald-500"></i>
      </div>
      <div id="kpiPostop" class="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">0</div>
      <div class="text-[11px] text-emerald-600/70 mt-1">พักฟื้นหลังผ่าตัด</div>
    </div>

    <!-- Transferred to Ward -->
    <div class="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-teal-400">
      <div class="flex items-center justify-between text-teal-700 text-xs font-semibold">
        <span>ย้ายไปหอผู้ป่วย</span>
        <i class="ph-bold ph-bed text-lg text-teal-500"></i>
      </div>
      <div id="kpiTransferred" class="text-2xl sm:text-3xl font-bold text-teal-600 mt-2">0</div>
      <div class="text-[11px] text-teal-600/70 mt-1">ส่งกลับ Ward แล้ว</div>
    </div>

  </div>

  <!-- Active Surgeries Live Section & Charts Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    
    <!-- Left 7 cols: Active OR Patient Stream Card -->
    <div class="lg:col-span-7 space-y-6">
      <div class="glass-card rounded-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-orange-100 pb-3">
          <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></span>
            เคสที่กำลังดำเนินการในห้องผ่าตัด (Active OR Cases)
          </h3>
          <span class="text-xs font-semibold text-slate-400" id="activeCountBadge">0 เคส</span>
        </div>

        <div id="activePatientsContainer" class="space-y-3 min-h-[220px]">
          <!-- Dynamic JS content -->
        </div>
      </div>
    </div>

    <!-- Right 5 cols: Ward Distribution Cards -->
    <div class="lg:col-span-5 space-y-6">
      <div class="glass-card rounded-2xl p-6 space-y-4">
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <i class="ph-bold ph-buildings text-orange-500 text-xl"></i>
          สรุปการกระจายผู้ป่วยตามหอผู้ป่วย (Wards)
        </h3>
        <p class="text-xs text-slate-500">จำนวนผู้ป่วยที่ระบุย้ายเข้าตึกพักฟื้นหลังผ่าตัดแต่ละแห่ง</p>

        <div id="wardStatsContainer" class="grid grid-cols-1 gap-2.5 pt-1">
          <!-- Dynamic Ward Cards -->
        </div>
      </div>
    </div>

  </div>

  <!-- Detailed Patient Master DataTable Card with Full Export Buttons -->
  <div class="glass-card rounded-2xl p-6 space-y-4">
    
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <i class="ph-bold ph-table text-orange-500 text-xl"></i>
          ตารางรายงานสรุปเคสผ่าตัด (Master Surgical Report)
        </h3>
        <p class="text-xs text-slate-500">สามารถค้นหา กรองข้อมูล และส่งออกรายงานในรูปแบบ Excel, PDF, CSV หรือสั่งพิมพ์ได้ทันที</p>
      </div>

      <!-- Quick Status Filter -->
      <div class="flex items-center gap-3">
        <select id="dtStatusFilter" class="px-3 py-2 bg-white border border-orange-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="">-- แสดงทุกสถานะ --</option>
          <option value="รอผ่าตัด">รอผ่าตัด</option>
          <option value="เตรียมความพร้อม/หยอดยา">เตรียมความพร้อม/หยอดยา</option>
          <option value="กำลังผ่าตัด">กำลังผ่าตัด</option>
          <option value="ผ่าตัดเสร็จสิ้น">ผ่าตัดเสร็จสิ้น</option>
          <option value="ย้ายไปหอผู้ป่วย">ย้ายไปหอผู้ป่วย</option>
          <option value="ยกเลิก/เลื่อน">ยกเลิก/เลื่อน</option>
        </select>
      </div>
    </div>

    <!-- DataTables Table -->
    <div class="overflow-x-auto pt-2">
      <table id="tblMasterDashboard" class="w-full text-sm text-left text-slate-600">
        <thead>
          <tr class="text-xs uppercase bg-orange-50/60 text-slate-600">
            <th class="py-3 px-3">#ID</th>
            <th class="py-3 px-3">คิว</th>
            <th class="py-3 px-3">ชื่อ - นามสกุล</th>
            <th class="py-3 px-3">อายุ</th>
            <th class="py-3 px-3">สิทธิ</th>
            <th class="py-3 px-3">เลนส์แก้วตาเทียม</th>
            <th class="py-3 px-3">สถานะผ่าตัด</th>
            <th class="py-3 px-3">หอผู้ป่วย (Ward)</th>
            <th class="py-3 px-3">แพทย์ผู้ผ่าตัด</th>
          </tr>
        </thead>
        <tbody>
          <!-- Dynamic JS content -->
        </tbody>
      </table>
    </div>

  </div>

</div>

<script>
$(document.body).ready(function() {
  let masterTable = null;

  // Initialize DataTables with full plugins (Buttons: Excel, PDF, CSV, Print)
  masterTable = $('#tblMasterDashboard').DataTable({
    pageLength: 20,
    responsive: true,
    dom: '<"flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4"Bf>rt<"flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4"ip>',
    buttons: [
      {
        extend: 'excelHtml5',
        text: '<i class="ph-bold ph-file-xls mr-1"></i> Excel Export',
        className: 'dt-button',
        title: 'รายงานการผ่าตัดต้อกระจก_Realtime'
      },
      {
        extend: 'csvHtml5',
        text: '<i class="ph-bold ph-file-csv mr-1"></i> CSV',
        className: 'dt-button'
      },
      {
        extend: 'pdfHtml5',
        text: '<i class="ph-bold ph-file-pdf mr-1"></i> PDF',
        className: 'dt-button',
        orientation: 'landscape',
        pageSize: 'A4'
      },
      {
        extend: 'print',
        text: '<i class="ph-bold ph-printer mr-1"></i> พิมพ์รายงาน',
        className: 'dt-button'
      }
    ],
    language: {
      search: "ค้นหาข้อมูล:",
      lengthMenu: "แสดง _MENU_ รายการ",
      info: "แสดง _START_ ถึง _END_ จากทั้งหมด _TOTAL_ รายการ",
      paginate: {
        first: "หน้าแรก",
        last: "หน้าสุดท้าย",
        next: "ถัดไป",
        previous: "ก่อนหน้า"
      },
      emptyTable: "ไม่พบข้อมูลในระบบ"
    }
  });

  // Fetch Dashboard Metrics & Active Patients
  function loadDashboardData() {
    const selectedDate = $('#filterSurgeryDate').val();
    $.getJSON(`api/get_dashboard.php?date=${selectedDate}`, function(res) {
      if (res.success) {
        const m = res.metrics;
        $('#kpiTotal').text(m.total || 0);
        $('#kpiWaiting').text(m.waiting || 0);
        $('#kpiPreop').text(m.preop || 0);
        $('#kpiInSurgery').text(m.in_surgery || 0);
        $('#kpiPostop').text(m.postop || 0);
        $('#kpiTransferred').text(m.transferred_ward || 0);

        // Render Active OR Cases
        let activeHtml = '';
        if (res.active_patients && res.active_patients.length > 0) {
          $('#activeCountBadge').text(`${res.active_patients.length} เคส`);
          res.active_patients.forEach(function(p) {
            const isSurgery = p.status === 'กำลังผ่าตัด';
            const borderBg = isSurgery ? 'border-orange-500 bg-orange-50/60' : 'border-indigo-400 bg-indigo-50/40';
            const badgeIcon = isSurgery ? 'ph-activity text-orange-500 animate-pulse' : 'ph-drop text-indigo-500';
            
            activeHtml += `
              <div class="p-4 rounded-xl border ${borderBg} flex items-center justify-between gap-4 shadow-xs">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full ${isSurgery ? 'bg-orange-500 text-white' : 'bg-indigo-500 text-white'} font-bold flex items-center justify-center text-sm">
                    ${p.queue ? 'คิว ' + p.queue : '#'+p.id}
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900">${p.pname || ''}${p.fname || ''} ${p.lname || ''} <span class="text-xs font-normal text-slate-500">(${p.age || '-'} ปี)</span></h4>
                    <p class="text-xs text-slate-500">HN: ${p.hn || '-'} | แพทย์: ${p.surgeon || 'ไม่ระบุ'} | เริ่ม: ${p.surgery_start_time || '-'}</p>
                  </div>
                </div>
                <div>
                  ${App.getStatusBadge(p.status)}
                </div>
              </div>
            `;
          });
        } else {
          $('#activeCountBadge').text('0 เคส');
          activeHtml = `
            <div class="py-10 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <i class="ph-bold ph-check-circle text-3xl mb-1 text-slate-300"></i>
              <p class="text-sm font-medium">ขณะนี้ไม่มีเคสอยู่ในห้องผ่าตัด</p>
            </div>
          `;
        }
        $('#activePatientsContainer').html(activeHtml);

        // Render Ward Stats Cards
        let wardHtml = '';
        if (res.ward_stats && res.ward_stats.length > 0) {
          res.ward_stats.forEach(function(w) {
            wardHtml += `
              <div class="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-orange-200 transition-all shadow-2xs">
                <div class="flex items-center gap-2.5">
                  <div class="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                  <span class="text-sm font-semibold text-slate-700">${w.ward_name}</span>
                </div>
                <span class="px-3 py-1 bg-orange-50 text-orange-600 font-bold text-xs rounded-full border border-orange-100">
                  ${w.cnt} คน
                </span>
              </div>
            `;
          });
        }
        $('#wardStatsContainer').html(wardHtml);
      }
    });
  }

  // Fetch Patients for Master DataTables
  function loadMasterTableData() {
    const selectedDate = $('#filterSurgeryDate').val();
    const selectedStatus = $('#dtStatusFilter').val();
    
    $.getJSON(`api/get_patients.php?surgery_date=${selectedDate}&status=${encodeURIComponent(selectedStatus)}`, function(res) {
      if (res.success) {
        masterTable.clear();
        res.data.forEach(function(p) {
          const idStr = `<span class="font-mono text-xs text-slate-400">#${p.id}</span>`;
          const queueStr = p.queue ? `<span class="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">${p.queue}</span>` : '<span class="text-slate-300">-</span>';
          const nameStr = `<strong>${p.pname || ''}${p.fname || ''} ${p.lname || ''}</strong><br><span class="text-xs text-slate-400">HN: ${p.hn || '-'}</span>`;
          const ageStr = p.age ? `${p.age} ปี` : '-';
          const pttypeStr = p.pttype ? `<span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">${p.pttype}</span>` : '-';
          const lensStr = p.lens_power ? `<span class="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">${p.lens_power} D (${p.lens_type || 'IOL'})</span>` : '-';
          const statusBadge = App.getStatusBadge(p.status);
          const wardStr = p.ward ? `<span class="px-2.5 py-1 bg-teal-50 text-teal-700 font-bold rounded-md text-xs">${p.ward}</span>` : '<span class="text-slate-300">-</span>';
          const surgeonStr = p.surgeon ? `<span class="text-xs font-medium text-slate-700">${p.surgeon}</span>` : '<span class="text-slate-400 text-xs">-</span>';

          masterTable.row.add([
            idStr,
            queueStr,
            nameStr,
            ageStr,
            pttypeStr,
            lensStr,
            statusBadge,
            wardStr,
            surgeonStr
          ]);
        });
        masterTable.draw(false);
      }
    });
  }

  $('#dtStatusFilter, #filterSurgeryDate').on('change', function() {
    loadDashboardData();
    loadMasterTableData();
  });

  $('#btnRefreshDashboard').on('click', function() {
    loadDashboardData();
    loadMasterTableData();
    App.toast.fire({ icon: 'success', title: 'อัปเดตข้อมูล Dashboard สำเร็จ' });
  });

  // Initial Load
  loadDashboardData();
  loadMasterTableData();

  // Connect SSE for Real-time sync
  App.initSSE(function(updateData) {
    loadDashboardData();
    loadMasterTableData();
  });
});
</script>

<?php require_once 'includes/footer.php'; ?>
