import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Configuración específica para el bundle del ChatBubble
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.bundle.config.js'
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/chatBubbleEntry.tsx'),
      name: 'CapinChat',
      fileName: (format) => `capin-chat-bubble.${format}.js`,
      formats: ['umd', 'es']
    },
    rollupOptions: {
      // NO excluir React - incluirlo en el bundle para standalone
      // external: ['react', 'react-dom'],
      output: {
        // Configuración para UMD
        exports: 'named'
      }
    },
    outDir: 'dist/bundle',
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Variables de entorno para el bundle
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});