/**
 * Script para copiar archivos del bundle a la carpeta del TMS
 * Se ejecuta automáticamente después de build:bundle
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function copyToTMS() {
  log('📦 [Copy to TMS] Iniciando copia de archivos...', 'blue');

  // Leer ruta de destino desde .env
  const tmsContentPath = process.env.TMS_CONTENT;
  
  if (!tmsContentPath) {
    log('⚠️ [Copy to TMS] Variable TMS_CONTENT no definida en .env', 'yellow');
    log('ℹ️ [Copy to TMS] Define TMS_CONTENT=C:\\TMS\\TMS\\Content\\js\\Chat en .env para habilitar copia automática', 'yellow');
    return;
  }

  // Verificar que la ruta de destino existe
  if (!fs.existsSync(tmsContentPath)) {
    log(`❌ [Copy to TMS] La ruta de destino no existe: ${tmsContentPath}`, 'red');
    log('ℹ️ [Copy to TMS] Crea la carpeta o actualiza TMS_CONTENT en .env', 'yellow');
    return;
  }

  // Archivos a copiar desde dist/bundle
  const bundleDir = path.join(__dirname, '..', 'dist', 'bundle');
  
  // Verificar que el directorio bundle existe
  if (!fs.existsSync(bundleDir)) {
    log(`❌ [Copy to TMS] Directorio bundle no encontrado: ${bundleDir}`, 'red');
    return;
  }

  // Obtener todos los archivos del directorio bundle
  const allFiles = fs.readdirSync(bundleDir);
  
  if (allFiles.length === 0) {
    log(`⚠️ [Copy to TMS] No hay archivos en ${bundleDir}`, 'yellow');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  // Copiar cada archivo
  allFiles.forEach(file => {
    const sourcePath = path.join(bundleDir, file);
    const destPath = path.join(tmsContentPath, file);

    try {
      // Solo copiar archivos, no directorios
      const stats = fs.statSync(sourcePath);
      if (!stats.isFile()) {
        return;
      }

      // Copiar archivo
      fs.copyFileSync(sourcePath, destPath);
      
      // Obtener tamaño del archivo
      const destStats = fs.statSync(destPath);
      const sizeKB = (destStats.size / 1024).toFixed(2);
      
      log(`✅ [Copy to TMS] ${file} → ${destPath} (${sizeKB} KB)`, 'green');
      successCount++;
    } catch (error) {
      log(`❌ [Copy to TMS] Error copiando ${file}: ${error.message}`, 'red');
      errorCount++;
    }
  });

  // Resumen
  log('', 'reset');
  log(`📊 [Copy to TMS] Resumen:`, 'blue');
  log(`   ✅ Copiados exitosamente: ${successCount}`, 'green');
  if (errorCount > 0) {
    log(`   ❌ Errores: ${errorCount}`, 'red');
  }
  log(`   📁 Destino: ${tmsContentPath}`, 'blue');
  log('', 'reset');
}

// Ejecutar
try {
  copyToTMS();
} catch (error) {
  log(`❌ [Copy to TMS] Error fatal: ${error.message}`, 'red');
  process.exit(1);
}
