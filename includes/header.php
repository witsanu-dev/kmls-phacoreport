<!DOCTYPE html>
<html lang="th" class="h-full bg-slate-50">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cataract Real-time Surgical Monitor - ระบบติดตามการผ่าตัดต้อกระจก</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#fff0e6',
              100: '#fed7aa',
              500: '#ff7e36',
              600: '#ea580c',
              700: '#c2410c',
            }
          },
          fontFamily: {
            anuphan: ['Anuphan', 'sans-serif'],
          }
        }
      }
    }
  </script>

  <!-- Google Fonts: Anuphan -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anuphan:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <!-- Phosphor Icons -->
  <script src="https://unpkg.com/@phosphor-icons/web"></script>

  <!-- jQuery & jQuery UI / Select2 -->
  <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

  <!-- SweetAlert2 -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

  <!-- DataTables & Buttons Extensions CSS -->
  <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
  <link rel="stylesheet" href="https://cdn.datatables.net/buttons/2.4.1/css/buttons.dataTables.min.css">
  <link rel="stylesheet" href="https://cdn.datatables.net/responsive/2.5.0/css/responsive.dataTables.min.css">

  <!-- Chart.js for Dashboard Visualizations -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <!-- Custom CSS -->
  <link rel="stylesheet" href="assets/css/custom.css">
</head>
<body class="font-anuphan text-slate-800 antialiased flex flex-col min-h-screen bg-slate-50/50">

  <!-- Responsive Navigation Header -->
  <header class="bg-white/95 backdrop-blur-md border-b border-orange-100 sticky top-0 z-40 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        
        <!-- Logo & Branding -->
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <i class="ph-bold ph-eye text-2xl"></i>
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-900 tracking-tight leading-none flex items-center gap-2">
              PhacoMonitor Real-time
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                <span class="w-2 h-2 rounded-full bg-orange-500 animate-ping mr-1"></span> LIVE
              </span>
            </h1>
            <p class="text-xs text-slate-500">ระบบติดตามการผ่าตัดผู้ป่วยโรคต้อกระจก</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="hidden md:flex items-center space-x-2">
          <a href="index.php" class="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 <?php echo basename($_SERVER['PHP_SELF']) == 'index.php' ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-600 hover:text-orange-600 hover:bg-slate-50'; ?>">
            <i class="ph-bold ph-chart-line-up text-lg"></i>
            Dashboard Monitor
          </a>
          
          <a href="queue_manage.php" class="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 <?php echo basename($_SERVER['PHP_SELF']) == 'queue_manage.php' ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-600 hover:text-orange-600 hover:bg-slate-50'; ?>">
            <i class="ph-bold ph-note-pencil text-lg"></i>
            บันทึกคิว & สถานะผ่าตัด
          </a>

          <a href="tv_monitor.php" target="_blank" class="px-3.5 py-2 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs flex items-center gap-1.5">
            <i class="ph-bold ph-television text-lg"></i>
            หน้าจอ TV Monitor
          </a>
        </nav>

        <!-- Quick Status Timestamp & Mobile Toggle -->
        <div class="flex items-center space-x-3">
          <div class="hidden lg:flex items-center text-xs text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200">
            <i class="ph ph-clock text-base text-orange-500 mr-1.5"></i>
            <span id="headerClock">--:--:--</span>
          </div>

          <!-- Mobile Menu Button -->
          <button id="mobileMenuBtn" class="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100">
            <i class="ph-bold ph-list text-2xl"></i>
          </button>
        </div>

      </div>
    </div>

    <!-- Mobile Navigation Drawer -->
    <div id="mobileMenu" class="hidden md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
      <a href="index.php" class="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600">
        <i class="ph-bold ph-chart-line-up mr-2"></i> Dashboard Monitor
      </a>
      <a href="queue_manage.php" class="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600">
        <i class="ph-bold ph-note-pencil mr-2"></i> บันทึกคิว & สถานะผ่าตัด
      </a>
      <a href="tv_monitor.php" target="_blank" class="block px-3 py-2 rounded-md text-base font-medium text-amber-600 hover:bg-amber-50">
        <i class="ph-bold ph-television mr-2"></i> หน้าจอ TV Monitor
      </a>
    </div>
  </header>

  <main class="flex-grow">
