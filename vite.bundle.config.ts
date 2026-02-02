import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Plugin para eliminar console.log en producción  
const removeConsolePlugin = () => ({
  name: 'remove-console',
  transform(code: string, id: string) {
    if (id.includes('node_modules')) return null;
    
    // Simplemente comentar las líneas con console.log/info/debug/warn
    // Esto es más seguro que intentar eliminarlas completamente
    const cleaned = code.replace(
      /^(\s*)console\.(log|info|debug|warn)\(/gm,
      '$1// console.$2('
    );
    
    return { code: cleaned, map: null };
  }
});

// Configuración específica para el bundle del ChatBubble
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno según el modo
  // Para 'prod' usará .env.prod, para 'production' usará .env.production
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()], // removeConsolePlugin deshabilitado temporalmente
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
          exports: 'named',
          // Deshabilitar code-splitting para generar un bundle único
          inlineDynamicImports: true,
          // Mantener todo en un solo archivo
          manualChunks: undefined
        }
      },
      outDir: 'dist/bundle',
      emptyOutDir: true,
      sourcemap: true,
      // Aumentar límite de tamaño de chunk para evitar warnings
      chunkSizeWarningLimit: 2000,
      // Configurar minificación con Terser 
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,    // Eliminar console logs en producción
          drop_debugger: true    // Eliminar debugger statements
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Variables de entorno para el bundle
      'process.env.NODE_ENV': JSON.stringify('production'),
      // Inyectar variables de entorno - URLs ABSOLUTAS para bundle embebido
      'import.meta.env.VITE_API_ENDPOINT': JSON.stringify(env.VITE_API_ENDPOINT || 'https://rag.insecap.cl/api/chat'),
      'import.meta.env.VITE_TELEMETRY_ENDPOINT': JSON.stringify(env.VITE_TELEMETRY_ENDPOINT || 'https://rag.insecap.cl/api/telemetry'),
      'import.meta.env.VITE_CONTACT_ENDPOINT': JSON.stringify(env.VITE_CONTACT_ENDPOINT || 'https://rag.insecap.cl/api/contact'),
      'import.meta.env.VITE_CANCEL_ENDPOINT': JSON.stringify(env.VITE_CANCEL_ENDPOINT || 'https://rag.insecap.cl/api/chat/cancel'),
      'import.meta.env.DEV': 'false',
      'import.meta.env.PROD': 'true',
      'import.meta.env.MODE': JSON.stringify('prod'),
    }
  };
});