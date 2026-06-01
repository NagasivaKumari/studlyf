import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  return {
    envDir: '../',
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '^/api/.*': {
          target: env.VITE_API_PROXY || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [react()],
    build: {
      emptyOutDir: false,
      chunkSizeWarningLimit: 1000, 
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            if (id.includes('CoursePlayer')) return 'chunk-course-player';
            if (id.includes('OperationLog')) return 'chunk-operation-log';
          }
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
      'import.meta.env.FRONTEND_URL': JSON.stringify(env.FRONTEND_URL || process.env.FRONTEND_URL || 'https://studlyfhub.vercel.app'),
      'import.meta.env.RENDER_EXTERNAL_URL': JSON.stringify(env.RENDER_EXTERNAL_URL || process.env.RENDER_EXTERNAL_URL || 'https://studlyf-tlkk.onrender.com'),
      'import.meta.env.ADDITIONAL_CORS_ORIGINS': JSON.stringify(env.ADDITIONAL_CORS_ORIGINS || process.env.ADDITIONAL_CORS_ORIGINS || 'https://studlyf-tlkk.onrender.com')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
