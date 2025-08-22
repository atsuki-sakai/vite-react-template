import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: [
        '.wrangler/**',
        '**/.wrangler/**',
        '**/miniflare-D1DatabaseObject/**',
        '**/*.sqlite',
        '**/*.sqlite-shm',
        '**/*.sqlite-wal',
        'node_modules/**',
        'dist/**'
      ],
      usePolling: false
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/react-app"),
    },
  },
  build: {
    outDir: "./dist/client",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 1. Shadcn UIとRadix UIを共通チャンクにまとめる
          if (id.includes('node_modules') && 
              (id.includes('@radix-ui') || 
               id.includes('shadcn'))) {
            return 'shadcn-components';
          }
          
          // 2. React関連を分離
          if (id.includes('node_modules') && 
              (id.includes('react') || 
               id.includes('react-dom'))) {
            return 'react-vendor';
          }
          
          // 3. Tailwind関連を分離
          if (id.includes('node_modules') && 
              (id.includes('tailwindcss') || 
               id.includes('@tailwindcss'))) {
            return 'tailwind';
          }
          
          // 4. その他のライブラリ
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});