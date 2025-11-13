const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const cssFilePath = path.resolve(__dirname, '../dist/bundle/style.css');

console.log('🔧 [PostBuild CSS] Iniciando transformación de estilos del chat...');

// PRIMERO: Copiar el CSS ORIGINAL MANTENIENDO los prefijos #capin-chat-root
const shadowStylesPath = path.resolve(__dirname, '../src/assets/shadow-styles.css');
let originalCSS = fs.readFileSync(cssFilePath, 'utf8'); // CSS de Vite

console.log('📝 [PostBuild CSS] Manteniendo prefijos #capin-chat-root para Shadow DOM...');

// NO ELIMINAR prefijos - mantenerlos para que funcionen con el wrapper interno
// Solo convertir :root a :host para variables CSS
originalCSS = originalCSS.replace(/:root\{/g, ':host{');
fs.writeFileSync(shadowStylesPath, originalCSS);
console.log('✅ [PostBuild CSS] shadow-styles.css creado con prefijos #capin-chat-root MANTENIDOS');

// SEGUNDO: Leer el archivo CSS para transformarlo (agregar MÁS prefijos para standalone)
const css = fs.readFileSync(cssFilePath, 'utf8');

// Plugin personalizado para prefijar TODO
const prefixAllPlugin = postcss.plugin('prefix-all-selectors', () => {
  return (root) => {
    root.walkRules((rule) => {
      // NO modificar @keyframes ni @media (at-rules)
      if (rule.parent && rule.parent.type === 'atrule') {
        if (['keyframes', 'media', 'supports'].includes(rule.parent.name)) {
          return;
        }
      }

      // Lista de selectores que afectan elementos FUERA del contenedor
      // Estos necesitan aplicarse globalmente para Radix UI portals
      const globalSelectorsToKeep = [
        /^body\[style/,                           // body con atributos style inline
        /^body>/,                                 // hijos directos de body (portals)
        /^body:/,                                 // pseudo-clases de body (:has)
        /^\[data-radix-portal\]$/,               // portales de Radix montados en body
        /^\[data-radix-popper-content-wrapper\]$/ // contenedores de Radix
      ];

      // Verificar si el selector debe mantenerse global (sin prefijo)
      const shouldStayGlobal = globalSelectorsToKeep.some(regex => 
        regex.test(rule.selector.trim())
      );

      if (shouldStayGlobal) {
        // NO prefijar estos selectores - deben aplicarse globalmente
        return;
      }

      // Lista de pseudo-elementos/selectores que SÍ deben prefijarse
      const globalPseudoElements = [
        /^:-moz-/,
        /^::-webkit-/,
        /^::-moz-/,
        /^::backdrop$/,
        /^:root$/
      ];

      // Verificar si el selector es un pseudo-elemento global
      const isGlobalPseudo = globalPseudoElements.some(regex => 
        regex.test(rule.selector.trim())
      );

      if (isGlobalPseudo) {
        // Prefijar pseudo-elementos globales
        rule.selector = rule.selector
          .split(',')
          .map(sel => {
            const trimmed = sel.trim();
            if (trimmed.startsWith('#capin-chat-root')) {
              return trimmed;
            }
            return `#capin-chat-root ${trimmed}`;
          })
          .join(', ');
        return;
      }

      // Prefijar selectores normales
      rule.selector = rule.selector
        .split(',')
        .map(selector => {
          const trimmed = selector.trim();

          // Ya tiene el prefijo, saltar
          if (trimmed.startsWith('#capin-chat-root')) {
            return trimmed;
          }

          // Verificar nuevamente si debe mantenerse global
          const shouldKeepGlobal = globalSelectorsToKeep.some(regex => regex.test(trimmed));
          if (shouldKeepGlobal) {
            return trimmed;
          }

          // Selectores globales básicos (html, *, :host pero NO body)
          if (['*', 'html', ':host'].includes(trimmed)) {
            return `#capin-chat-root ${trimmed}`;
          }

          // body sin atributos debe prefijarse
          if (trimmed === 'body') {
            return `#capin-chat-root ${trimmed}`;
          }

          // Pseudo-clases/elementos al inicio
          if (trimmed.startsWith(':') && !trimmed.includes(' ')) {
            return `#capin-chat-root${trimmed}`;
          }

          // Resto de selectores
          return `#capin-chat-root ${trimmed}`;
        })
        .join(', ');
    });

    // Renombrar keyframes para evitar conflictos
    root.walkAtRules('keyframes', (atRule) => {
      if (!atRule.params.startsWith('capin-')) {
        atRule.params = `capin-${atRule.params}`;
      }
    });

    // Actualizar referencias a keyframes en animation
    root.walkDecls('animation', (decl) => {
      const animations = ['fade-in', 'pulse', 'typing', 'enter', 'exit', 
                         'accordion-up', 'accordion-down'];
      animations.forEach(name => {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        decl.value = decl.value.replace(regex, `capin-${name}`);
      });
    });

    root.walkDecls('animation-name', (decl) => {
      const animations = ['fade-in', 'pulse', 'typing', 'enter', 'exit',
                         'accordion-up', 'accordion-down'];
      animations.forEach(name => {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        decl.value = decl.value.replace(regex, `capin-${name}`);
      });
    });
  };
});

// Procesar el CSS
postcss([prefixAllPlugin()])
  .process(css, { from: cssFilePath, to: cssFilePath })
  .then((result) => {
    // Escribir el CSS CON PREFIJOS al bundle dist (para uso standalone)
    fs.writeFileSync(cssFilePath, result.css);
    
    console.log('✅ [PostBuild CSS] Transformación completada exitosamente');
    console.log(`📝 Archivo procesado: ${cssFilePath}`);
    console.log('📊 Cambios aplicados:');
    console.log('   - Selectores prefijados con #capin-chat-root');
    console.log('   - @keyframes renombradas con prefijo capin-');
    console.log('   - Pseudo-elementos globales aislados');
  })
  .catch((error) => {
    console.error('❌ [PostBuild CSS] Error al procesar CSS:', error);
    process.exit(1);
  });

