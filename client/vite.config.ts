import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules') && !id.includes('/src/stt/')) {
              return undefined;
            }

            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }

            if (id.includes('recharts')) {
              return 'vendor-charts';
            }

            if (
              id.includes('/src/stt/')
              || id.includes('whisper')
              || id.includes('onnx')
              || id.includes('webassembly')
            ) {
              return 'vendor-stt';
            }

            return undefined;
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      globals: true,
    },
  };
});
