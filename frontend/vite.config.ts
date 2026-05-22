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
          target: env.RENDER_EXTERNAL_URL || '',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.FRONTEND_URL': JSON.stringify(env.FRONTEND_URL || ''),
      'import.meta.env.RENDER_EXTERNAL_URL': JSON.stringify(env.RENDER_EXTERNAL_URL || ''),
      'import.meta.env.ADDITIONAL_CORS_ORIGINS': JSON.stringify(env.ADDITIONAL_CORS_ORIGINS || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
