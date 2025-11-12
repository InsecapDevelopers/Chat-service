import type { Plugin } from 'vite';
import fs from 'fs/promises';
import path from 'path';

/**
 * Plugin de Vite para inline el CSS compilado como string en el bundle
 * Esto permite que shadowDomWrapper.ts tenga acceso al CSS para inyectarlo
 * en el Shadow DOM sin necesidad de fetch() en runtime
 */
export function inlineCSS(): Plugin {
  return {
    name: 'vite-plugin-inline-css',
    enforce: 'post', // Ejecutar después de que Vite genere el CSS
    
    async generateBundle(options, bundle) {
      // Buscar el archivo CSS generado en el bundle
      const cssFileName = Object.keys(bundle).find(
        fileName => fileName.endsWith('.css')
      );

      if (!cssFileName) {
        console.warn('[Inline CSS] No se encontró archivo CSS en el bundle');
        return;
      }

      const cssAsset = bundle[cssFileName];
      if (cssAsset.type !== 'asset') {
        return;
      }

      // Extraer el contenido CSS
      const cssContent = cssAsset.source as string;

      // Buscar el archivo JS del bundle
      const jsFileName = Object.keys(bundle).find(
        fileName => fileName.endsWith('.umd.js') || fileName.endsWith('.js')
      );

      if (!jsFileName) {
        console.warn('[Inline CSS] No se encontró archivo JS en el bundle');
        return;
      }

      const jsChunk = bundle[jsFileName];
      if (jsChunk.type !== 'chunk') {
        return;
      }

      // Reemplazar el placeholder en el código JS
      const placeholder = '/* Fallback: CSS será inyectado aquí por el bundler */';
      
      // Escapar el CSS para que sea una string válida de JS
      const escapedCSS = cssContent
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\${/g, '\\${');

      // Reemplazar en el código
      jsChunk.code = jsChunk.code.replace(
        placeholder,
        escapedCSS
      );

      console.log(`[Inline CSS] CSS inlineado en ${jsFileName} (${cssContent.length} caracteres)`);
    }
  };
}
