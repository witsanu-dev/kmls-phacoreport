<?php require_once 'includes/header.php'; ?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

  <!-- Header Banner -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 p-6 rounded-2xl text-white shadow-lg shadow-orange-500/20">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-2">
        <i class="ph-bold ph-note-pencil"></i> Data Entry & Status Pipeline
      </div>
      <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">บันทึกคิว & จัดการสถานะการผ่าตัด</h2>
      <p class="text-orange-100 text-sm mt-1">ค้นหาผู้ป่วยต้อกระจก เพื่อจัดคิว ปรับสถานะผ่าตัด และระบุหอผู้ป่วยหลังผ่าตัดแบบ Real-time</p>
    </div>
    <div class="flex items-center gap-3">
      <button id="btnQuickRefresh" class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all backdrop-blur-xs flex items-center gap-2">
        <i class="ph-bold ph-arrows-clockwise text-lg"></i> รีเฟรชข้อมูล
      </button>
    </div>
  </div>

  <!-- Search & Patient Form Section -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    
    <!-- Left Column: Patient Search & Update Panel -->
    <div class="lg:col-span-5 space-y-6">
      
      <!-- Search Select2 Card -->
      <div class="glass-card rounded-2xl p-6 space-y-4">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <i class="ph-bold ph-magnifying-glass text-orange-500 text-xl"></i>
          ค้นหาผู้รับบริการผ่าตัด
        </h3>
        <p class="text-xs text-slate-500">พิมพ์ชื่อ-นามสกุล, เลขบัตรประชาชน (CID) 13 หลัก หรือ HN เพื่อเลือกผู้ป่วย</p>
        
        <div>
          <select id="selectPatient" class="w-full"></select>
        </div>
      </div>

      <!-- Selected Patient Edit Form -->
      <div id="patientFormContainer" class="glass-card rounded-2xl p-6 hidden space-y-5 border-l-4 border-l-orange-500">
        
        <div class="flex items-start justify-between border-b border-orange-100 pb-4">
          <div>
            <span id="patientIdBadge" class="text-xs font-bold px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md">ID #--</span>
            <h3 id="patientFullName" class="text-xl font-bold text-slate-900 mt-1">-- ---</h3>
            <p id="patientSubInfo" class="text-xs text-slate-500 mt-0.5">CID: - | อายุ: - ปี | สิทธิ: -</p>
          </div>
          <button type="button" id="btnClosePatientForm" class="text-slate-400 hover:text-slate-600 text-xl">
            <i class="ph-bold ph-x"></i>
          </button>
        </div>

        <form id="formUpdateQueue" class="space-y-4">
          <input type="hidden" id="edit_patient_id" name="id">

          <!-- Queue & Surgery Date -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">ลำดับคิวผ่าตัด (Queue)</label>
              <input type="number" id="edit_queue" name="queue" min="1" placeholder="เช่น 1, 2, 3"
                     class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">วันที่ผ่าตัด</label>
              <input type="date" id="edit_surgery_date" name="surgery_date"
                     class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            </div>
          </div>

          <!-- Surgery Status -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">สถานะการผ่าตัด <span class="text-red-500">*</span></label>
            <select id="edit_status" name="status" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
              <option value="รอผ่าตัด">🟡 รอผ่าตัด (Waiting)</option>
              <option value="เตรียมความพร้อม/หยอดยา">🔵 เตรียมความพร้อม/หยอดยา (Pre-op)</option>
              <option value="กำลังผ่าตัด">🟠 กำลังผ่าตัด (In Surgery)</option>
              <option value="ผ่าตัดเสร็จสิ้น">🟢 ผ่าตัดเสร็จสิ้น (Post-op Recovery)</option>
              <option value="ย้ายไปหอผู้ป่วย">🟤 ย้ายไปหอผู้ป่วย (Transferred to Ward)</option>
              <option value="ยกเลิก/เลื่อน">🔴 ยกเลิก/เลื่อน (Cancelled/Postponed)</option>
            </select>
          </div>

          <!-- Ward Selection -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">หอผู้ป่วยหลังผ่าตัด (Post-op Ward)</label>
            <select id="edit_ward" name="ward" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
              <option value="">-- กรุณาเลือกหอผู้ป่วย --</option>
            </select>
          </div>

          <!-- Surgeon & Nurses -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">แพทย์ผู้ผ่าตัด (Surgeon)</label>
              <input type="text" id="edit_surgeon" name="surgeon" placeholder="ระบุชื่อแพทย์"
                     class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">วิธีผ่าตัด (Method)</label>
              <input type="text" id="edit_surgery_method" name="surgery_method" placeholder="เช่น Phacoemulsification"
                     class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            </div>
          </div>

          <!-- Surgery Start & End Time -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">เวลาเริ่มผ่าตัด</label>
              <input type="time" id="edit_surgery_start_time" name="surgery_start_time"
                     class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">เวลาผ่าตัดเสร็จ</label>
              <input type="time" id="edit_surgery_end_time" name="surgery_end_time"
                     class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            </div>
          </div>

          <!-- Note -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุ / โน้ตเพิ่มเติม</label>
            <textarea id="edit_note" name="note" rows="2" placeholder="รายละเอียดหรือคำแนะนำเพิ่มเติม..."
                      class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="pt-2 flex items-center justify-end gap-3">
            <button type="button" id="btnCancelEdit" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
              ยกเลิก
            </button>
            <button type="submit" id="btnSaveQueue" class="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2">
              <i class="ph-bold ph-floppy-disk text-lg"></i>
              บันทึกข้อมูล Real-time
            </button>
          </div>
        </form>

      </div>

    </div>

    <!-- Right Column: Interactive Patient Table & Quick Status Changer -->
    <div class="lg:col-span-7 space-y-6">
      
      <div class="glass-card rounded-2xl p-6 space-y-4">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i class="ph-bold ph-list-numbers text-orange-500 text-xl"></i>
              รายชื่อผู้ป่วยคิวผ่าตัดต้อกระจก
            </h3>
            <p class="text-xs text-slate-500">คลิกที่รายชื่อผู้ป่วยเพื่อบันทึก/แก้ไขข้อมูล หรือเปลี่ยนสถานะอย่างรวดเร็ว</p>
          </div>

          <!-- Filter Dropdown -->
          <div class="flex items-center gap-2">
            <select id="tableFilterStatus" class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
              <option value="">ทุกสถานะ</option>
              <option value="รอผ่าตัด">รอผ่าตัด</option>
              <option value="เตรียมความพร้อม/หยอดยา">เตรียมความพร้อม</option>
              <option value="กำลังผ่าตัด">กำลังผ่าตัด</option>
              <option value="ผ่าตัดเสร็จสิ้น">ผ่าตัดเสร็จสิ้น</option>
              <option value="ย้ายไปหอผู้ป่วย">ย้ายไปหอผู้ป่วย</option>
              <option value="ยกเลิก/เลื่อน">ยกเลิก/เลื่อน</option>
            </select>
          </div>
        </div>

        <!-- DataTable -->
        <div class="overflow-x-auto pt-2">
          <table id="tblManagePatients" class="w-full text-sm text-left text-slate-600">
            <thead>
              <tr class="text-xs uppercase bg-slate-100 text-slate-500">
                <th class="py-3 px-3">คิว</th>
                <th class="py-3 px-3">ชื่อ - นามสกุล</th>
                <th class="py-3 px-3">อายุ</th>
                <th class="py-3 px-3">สถานะ</th>
                <th class="py-3 px-3">หอผู้ป่วย</th>
                <th class="py-3 px-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <!-- Dynamic JS insertion -->
            </tbody>
          </table>
        </div>

      </div>

    </div>

  </div>

</div>

<script>
$(document.body).ready(function() {
  let wardsList = [];
  let manageTable = null;

  // 1. Load Wards list for select dropdown
  function loadWards() {
    $.getJSON('api/get_wards.php', function(res) {
      if (res.success) {
        wardsList = res.data;
        let html = '<option value="">-- ไม่ระบุ / ไม่ย้าย --</option>';
        res.data.forEach(function(w) {
          html += `<option value="${w.ward_name}">${w.ward_name} (${w.ward_code})</option>`;
        });
        $('#edit_ward').html(html);
      }
    });
  }
  loadWards();

  // 2. Initialize Select2 for Patient Search
  $('#selectPatient').select2({
    placeholder: 'พิมพ์ชื่อ, CID 13 หลัก หรือ HN เพื่อค้นหา...',
    allowClear: true,
    ajax: {
      url: 'api/get_patients.php',
      dataType: 'json',
      delay: 250,
      data: function(params) {
        return {
          select2: 1,
          q: params.term
        };
      },
      processResults: function(data) {
        return {
          results: data.results
        };
      },
      cache: true
    },
    minimumInputLength: 1
  }).on('select2:select', function(e) {
    const selected = e.params.data;
    if (selected && selected.id) {
      loadPatientToForm(selected.id);
    }
  });

  // 3. Function to load patient detail into edit form
  function loadPatientToForm(patientId) {
    $.getJSON(`api/get_patients.php?id=${patientId}`, function(res) {
      if (res.success) {
        const p = res.data;
        $('#edit_patient_id').val(p.id);
        $('#patientIdBadge').text(`ID #${p.id}`);
        $('#patientFullName').text(`${p.pname || ''}${p.fname || ''} ${p.lname || ''}`);
        $('#patientSubInfo').text(`CID: ${p.cid || '-'} | อายุ: ${p.age || '-'} ปี | สิทธิ: ${p.pttype || '-'}`);
        
        $('#edit_queue').val(p.queue || '');
        $('#edit_surgery_date').val(p.surgery_date || '<?php echo date('Y-m-d'); ?>');
        $('#edit_status').val(p.status || 'รอผ่าตัด');
        $('#edit_ward').val(p.ward || '');
        $('#edit_surgeon').val(p.surgeon || '');
        $('#edit_surgery_method').val(p.surgery_method || '');
        $('#edit_surgery_start_time').val(p.surgery_start_time || '');
        $('#edit_surgery_end_time').val(p.surgery_end_time || '');
        $('#edit_note').val(p.note || '');

        $('#patientFormContainer').removeClass('hidden').hide().fadeIn(300);
        $('html, body').animate({ scrollTop: $('#patientFormContainer').offset().top - 80 }, 300);
      }
    });
  }

  $('#btnClosePatientForm, #btnCancelEdit').on('click', function() {
    $('#patientFormContainer').fadeOut(200);
  });

  // 4. Submit Form via AJAX
  $('#formUpdateQueue').on('submit', function(e) {
    e.preventDefault();
    const formData = $(this).serializeArray();
    const payload = {};
    formData.forEach(item => payload[item.name] = item.value);

    Swal.fire({
      title: 'ยืนยันการบันทึกข้อมูล?',
      text: `ต้องการอัปเดตสถานะเป็น "${payload.status}" หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff7e36',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'บันทึกข้อมูล',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: 'api/save_queue.php',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(payload),
          success: function(res) {
            if (res.success) {
              Swal.fire({
                icon: 'success',
                title: 'บันทึกข้อมูลสำเร็จ!',
                text: res.message,
                timer: 1800,
                showConfirmButton: false
              });
              loadTableData();
              $('#patientFormContainer').fadeOut(200);
            } else {
              Swal.fire('เกิดข้อผิดพลาด', res.message, 'error');
            }
          },
          error: function(err) {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
          }
        });
      }
    });
  });

  // 5. Initialize DataTable for Patient Management
  manageTable = $('#tblManagePatients').DataTable({
    pageLength: 15,
    responsive: true,
    ordering: false,
    language: {
      search: "ค้นหาในตาราง:",
      lengthMenu: "แสดง _MENU_ รายการ",
      info: "แสดง _START_ ถึง _END_ จากทั้งหมด _TOTAL_ รายการ",
      paginate: {
        first: "หน้าแรก",
        last: "หน้าสุดท้าย",
        next: "ถัดไป",
        previous: "ก่อนหน้า"
      },
      emptyTable: "ไม่พบข้อมูลผู้ป่วย"
    }
  });

  function loadTableData() {
    const selectedStatus = $('#tableFilterStatus').val();
    $.getJSON(`api/get_patients.php?status=${encodeURIComponent(selectedStatus)}`, function(res) {
      if (res.success) {
        manageTable.clear();
        res.data.forEach(function(p) {
          const nameStr = `<strong>${p.pname || ''}${p.fname || ''} ${p.lname || ''}</strong><br><span class="text-xs text-slate-400">HN: ${p.hn || '-'} | CID: ${p.cid || '-'}</span>`;
          const queueStr = p.queue ? `<span class="w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">${p.queue}</span>` : '<span class="text-slate-300">-</span>';
          const badgeHtml = App.getStatusBadge(p.status);
          const wardStr = p.ward ? `<span class="px-2.5 py-1 bg-teal-50 text-teal-700 font-semibold rounded-md text-xs">${p.ward}</span>` : '<span class="text-slate-400 text-xs">-</span>';
          
          const actionBtn = `<button type="button" onclick="editPatient(${p.id})" class="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ml-auto">
            <i class="ph-bold ph-pencil"></i> แก้ไข
          </button>`;

          manageTable.row.add([
            queueStr,
            nameStr,
            (p.age ? p.age + ' ปี' : '-'),
            badgeHtml,
            wardStr,
            actionBtn
          ]);
        });
        manageTable.draw(false);
      }
    });
  }

  // Global helper for row edit button click
  window.editPatient = function(id) {
    loadPatientToForm(id);
  };

  $('#tableFilterStatus').on('change', function() {
    loadTableData();
  });

  $('#btnQuickRefresh').on('click', function() {
    loadTableData();
    App.toast.fire({ icon: 'success', title: 'รีเฟรชข้อมูลเรียบร้อย' });
  });

  // Load initial data
  loadTableData();

  // Connect SSE for live updates
  App.initSSE(function(updateData) {
    loadTableData();
  });
});
</script>

<?php require_once 'includes/footer.php'; ?>
