import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUNDLE_DIR = path.resolve(__dirname, '../dist/bundle');
const CSS_FILE = path.join(BUNDLE_DIR, 'style.css');
const CHAT_ROOT_SELECTOR = '#capin-chat-root';
const MAX_Z_INDEX = 1090;
const SAFE_Z_INDEX = 1085;

console.log('🔧 Post-build CSS transformation starting...\n');

// Verificar que existe el archivo CSS
if (!fs.existsSync(CSS_FILE)) {
  console.error('❌ Error: style.css not found in dist/bundle/');
  process.exit(1);
}

// Leer el contenido del CSS
let css = fs.readFileSync(CSS_FILE, 'utf-8');
let warnings = [];
let transformations = 0;

console.log('📝 Original CSS size:', (css.length / 1024).toFixed(2), 'KB\n');

// ============================================================
// 1. ENCAPSULAR SELECTORES GLOBALES
// ============================================================
console.log('🔒 Step 1: Encapsulating global selectors...');

// Función para verificar si un selector ya está encapsulado
const isAlreadyEncapsulated = (selector) => {
  return selector.trim().startsWith(CHAT_ROOT_SELECTOR);
};

// Función para encapsular un selector
const encapsulateSelector = (selector) => {
  selector = selector.trim();
  
  // Ya está encapsulado
  if (isAlreadyEncapsulated(selector)) {
    return selector;
  }
  
  // Selectores que necesitan encapsulación
  const globalSelectors = [
    /^\*(?:\s|,|$)/,  // *
    /^html(?:\s|,|$)/, // html
    /^body(?:\s|,|$)/, // body
    /^\[data-radix-/,  // [data-radix-*]
    /^:root(?:\s|,|$)/, // :root
  ];
  
  for (const pattern of globalSelectors) {
    if (pattern.test(selector)) {
      transformations++;
      return `${CHAT_ROOT_SELECTOR} ${selector}`;
    }
  }
  
  return selector;
};

// Procesar reglas CSS
css = css.replace(/([^{}]+)\s*{/g, (match, selectors) => {
  // Dividir selectores múltiples (ej: "a, b, c { }")
  const selectorList = selectors.split(',').map(s => s.trim());
  const encapsulated = selectorList.map(encapsulateSelector);
  
  return encapsulated.join(', ') + ' {';
});

console.log('   ✅ Global selectors encapsulated:', transformations);

// ============================================================
// 2. REDUCIR Z-INDEX A RANGO SEGURO
// ============================================================
console.log('\n📊 Step 2: Adjusting z-index values...');

let zIndexCount = 0;
css = css.replace(/z-index:\s*(\d+)(\s*!important)?/gi, (match, value, important) => {
  const zIndex = parseInt(value, 10);
  
  if (zIndex > MAX_Z_INDEX) {
    zIndexCount++;
    warnings.push(`⚠️  z-index ${zIndex} → ${SAFE_Z_INDEX}`);
    
    // Mantener !important solo si ya estaba
    return `z-index: ${SAFE_Z_INDEX}${important || ''}`;
  }
  
  // Remover !important innecesarios excepto en el contenedor principal
  if (important && !match.includes(CHAT_ROOT_SELECTOR)) {
    return `z-index: ${zIndex}`;
  }
  
  return match;
});

console.log(`   ✅ z-index values adjusted: ${zIndexCount}`);

// ============================================================
// 3. ELIMINAR REGLAS QUE AFECTEN BODY/HTML/PORTALES
// ============================================================
console.log('\n🗑️  Step 3: Removing global DOM rules...');

let removedRules = 0;

// Patrones peligrosos que modifican el DOM global
const dangerousPatterns = [
  // Body con overflow hidden
  /body\[style\*=["']overflow:\s*hidden["']\]\s*{[^}]*}/gi,
  
  // Portales externos
  /body\s*>\s*\[data-radix-portal\]\s*{[^}]*}/gi,
  
  // pointer-events en body
  /body\s*{[^}]*pointer-events:[^}]*}/gi,
];

dangerousPatterns.forEach(pattern => {
  const matches = css.match(pattern);
  if (matches) {
    removedRules += matches.length;
    css = css.replace(pattern, '/* Removed: global DOM rule */');
    warnings.push(`⚠️  Removed ${matches.length} global DOM rule(s)`);
  }
});

console.log(`   ✅ Removed ${removedRules} dangerous rules`);

// ============================================================
// 4. REEMPLAZAR RESETS AGRESIVOS
// ============================================================
console.log('\n🔄 Step 4: Replacing aggressive resets...');

let resetCount = 0;

// Reemplazar "all: revert !important" por reset controlado
css = css.replace(/all:\s*revert\s*!important/gi, (match) => {
  resetCount++;
  return 'all: unset; font: inherit; color: inherit';
});

console.log(`   ✅ Replaced ${resetCount} aggressive resets`);

// ============================================================
// 5. ASEGURAR AISLAMIENTO DEL CONTENEDOR PRINCIPAL
// ============================================================
console.log('\n🛡️  Step 5: Ensuring chat root isolation...');

// Buscar si ya existe la regla del contenedor
const hasRootRule = css.includes(`${CHAT_ROOT_SELECTOR} {`);

if (!hasRootRule) {
  // Agregar regla de aislamiento al inicio
  const isolationRule = `
/* Chat Root Isolation - Auto-generated */
${CHAT_ROOT_SELECTOR} {
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  z-index: ${SAFE_Z_INDEX} !important;
  isolation: isolate !important;
  box-sizing: border-box !important;
}

`;
  css = isolationRule + css;
  console.log('   ✅ Added chat root isolation rule');
} else {
  console.log('   ℹ️  Chat root rule already exists');
}

// ============================================================
// 6. VERIFICACIÓN FINAL
// ============================================================
console.log('\n🔍 Step 6: Final verification...');

let errors = [];

// Verificar que no queden selectores globales sueltos
const globalPatternsCheck = [
  { pattern: /^body\s*{/m, name: 'body' },
  { pattern: /^html\s*{/m, name: 'html' },
  { pattern: /^\*\s*{/m, name: '*' },
];

globalPatternsCheck.forEach(({ pattern, name }) => {
  if (pattern.test(css) && !css.includes(`${CHAT_ROOT_SELECTOR} ${name}`)) {
    errors.push(`❌ Found unencapsulated "${name}" selector`);
  }
});

// Verificar z-index excesivos
const zIndexMatches = css.matchAll(/z-index:\s*(\d+)/gi);
for (const match of zIndexMatches) {
  const value = parseInt(match[1], 10);
  if (value > MAX_Z_INDEX) {
    errors.push(`❌ z-index ${value} exceeds maximum (${MAX_Z_INDEX})`);
  }
}

if (errors.length > 0) {
  console.log('\n⚠️  VERIFICATION ERRORS:');
  errors.forEach(err => console.log(`   ${err}`));
} else {
  console.log('   ✅ All checks passed');
}

// ============================================================
// 7. GUARDAR ARCHIVO TRANSFORMADO
// ============================================================
console.log('\n💾 Saving transformed CSS...');

// Crear backup del original
const backupFile = CSS_FILE.replace('.css', '.original.css');
fs.copyFileSync(CSS_FILE, backupFile);
console.log(`   📋 Backup saved: ${path.basename(backupFile)}`);

// Guardar transformado
fs.writeFileSync(CSS_FILE, css, 'utf-8');
console.log(`   ✅ Transformed CSS saved: ${path.basename(CSS_FILE)}`);
console.log(`   📝 New size: ${(css.length / 1024).toFixed(2)} KB`);

// ============================================================
// 8. RESUMEN
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('✨ POST-BUILD CSS TRANSFORMATION COMPLETE');
console.log('='.repeat(60));
console.log(`📊 Transformations: ${transformations}`);
console.log(`📊 z-index adjusted: ${zIndexCount}`);
console.log(`📊 Rules removed: ${removedRules}`);
console.log(`📊 Resets replaced: ${resetCount}`);

if (warnings.length > 0) {
  console.log(`\n⚠️  Warnings (${warnings.length}):`);
  warnings.slice(0, 10).forEach(w => console.log(`   ${w}`));
  if (warnings.length > 10) {
    console.log(`   ... and ${warnings.length - 10} more`);
  }
}

if (errors.length > 0) {
  console.log('\n❌ Process completed with errors');
  process.exit(1);
} else {
  console.log('\n✅ Process completed successfully');
  process.exit(0);
}
