  </main>

  <!-- Footer -->
  <footer class="bg-white border-t border-slate-200 mt-12 py-6 text-slate-500 text-xs text-center">
    <div class="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
      <div>
        <strong>PhacoMonitor Real-time System</strong> &copy; <?php echo date('Y'); ?> | ฐานข้อมูล <code>db_phacoreport</code>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Real-time SSE Online</span>
        <span>|</span>
        <span>Asia/Bangkok (GMT+7)</span>
      </div>
    </div>
  </footer>

  <!-- DataTables Core & Buttons Plugins JS -->
  <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
  <script src="https://cdn.datatables.net/buttons/2.4.1/js/dataTables.buttons.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/pdfmake.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js"></script>
  <script src="https://cdn.datatables.net/buttons/2.4.1/js/buttons.html5.min.js"></script>
  <script src="https://cdn.datatables.net/buttons/2.4.1/js/buttons.print.min.js"></script>
  <script src="https://cdn.datatables.net/responsive/2.5.0/js/dataTables.responsive.min.js"></script>

  <!-- Application Main JS -->
  <script src="assets/js/app.js"></script>

  <script>
    // Live Digital Clock
    function updateClock() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour12: false });
      const dateStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
      const clockEl = document.getElementById('headerClock');
      if (clockEl) {
        clockEl.textContent = `${dateStr} ${timeStr} น.`;
      }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Mobile menu toggle
    $('#mobileMenuBtn').on('click', function() {
      $('#mobileMenu').toggleClass('hidden');
    });
  </script>
</body>
</html>
