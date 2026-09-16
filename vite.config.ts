import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Allow deploy to subfolder on Apache/AppServ
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    // ---- ปรับ port ได้เสรีตรงนี้ ----
    port: 5173,        // เปลี่ยนได้ เช่น 3000, 4000, 5174, 8888
    strictPort: true,  // ถ้า port ชน → แสดง error ทันที (ไม่ใช่สุ่ม port ใหม่)
    host: true,        // เข้าถึงได้จาก Network (IP อื่นในวง LAN)
    // ---------------------------------

    // Proxy /api → PHP server (เลือกอันใดอันหนึ่ง)
    proxy: {
      '/api': {
        // ตัวเลือก A: ใช้ AppServ/Apache ที่รันอยู่แล้ว (port 80)
        target: 'http://127.0.0.1/phacoreport',
        // ตัวเลือก B: ใช้ PHP built-in server แยก (รัน: php -S 127.0.0.1:8080 -t .)
        // target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path, // ไม่ตัด /api ออก
      },
    },
  },
})
