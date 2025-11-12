# Post-Build CSS Transformation Script

## 📋 Propósito

Este script transforma automáticamente el CSS del bundle del chat React para evitar conflictos con el sistema TMS existente que usa Bootstrap y otros estilos globales.

## 🎯 Transformaciones Aplicadas

### 1. Encapsulación de Selectores Globales
- Todos los selectores globales (`*`, `html`, `body`, `[data-radix-*]`, `:root`) se prefijan con `#capin-chat-root`
- Evita que los estilos del chat afecten el DOM global del TMS

**Ejemplo:**
```css
/* Antes */
body { font-family: sans-serif; }

/* Después */
#capin-chat-root body { font-family: sans-serif; }
```

### 2. Reducción de z-index
- Limita todos los `z-index` a un rango seguro (1000-1090)
- Valores mayores a 1090 se reemplazan por 1085
- Compatible con el rango de Bootstrap y otros componentes del TMS

### 3. Eliminación de Reglas Peligrosas
- Elimina reglas que modifican `body`, `html` o portales externos
- Remueve cambios a `overflow`, `pointer-events` del documento
- Evita interferencia con modales y overlays del TMS

### 4. Reemplazo de Resets Agresivos
- Reemplaza `all: revert !important` por resets controlados
- Usa `all: unset; font: inherit; color: inherit;` en su lugar
- Previene conflictos de cascada con estilos del TMS

### 5. Aislamiento del Contenedor Principal
- Agrega regla de aislamiento al `#capin-chat-root`
- Establece `isolation: isolate` para crear stacking context propio
- Define posición fija y z-index seguro

```css
#capin-chat-root {
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  z-index: 1085 !important;
  isolation: isolate !important;
  box-sizing: border-box !important;
}
```

### 6. Verificación Automática
- Comprueba que no existan selectores globales sin encapsular
- Verifica que ningún z-index exceda 1090
- Genera advertencias y errores si encuentra problemas

## 🚀 Uso

### Ejecución Automática
El script se ejecuta automáticamente después de cada build del bundle:

```bash
npm run build:bundle
```

### Ejecución Manual
Si necesitas ejecutar solo el post-procesamiento:

```bash
npm run postbuild:css
```

## 📂 Archivos Generados

- **`dist/bundle/style.css`** - CSS transformado (listo para producción)
- **`dist/bundle/style.original.css`** - Backup del CSS original (para referencia)

## 📊 Salida del Script

El script muestra información detallada durante la ejecución:

```
🔧 Post-build CSS transformation starting...

📝 Original CSS size: 80.70 KB

🔒 Step 1: Encapsulating global selectors...
   ✅ Global selectors encapsulated: 45

📊 Step 2: Adjusting z-index values...
   ✅ z-index values adjusted: 8

🗑️  Step 3: Removing global DOM rules...
   ✅ Removed 3 dangerous rules

🔄 Step 4: Replacing aggressive resets...
   ✅ Replaced 2 aggressive resets

🛡️  Step 5: Ensuring chat root isolation...
   ✅ Added chat root isolation rule

🔍 Step 6: Final verification...
   ✅ All checks passed

💾 Saving transformed CSS...
   📋 Backup saved: style.original.css
   ✅ Transformed CSS saved: style.css
   📝 New size: 82.15 KB

============================================================
✨ POST-BUILD CSS TRANSFORMATION COMPLETE
============================================================
📊 Transformations: 45
📊 z-index adjusted: 8
📊 Rules removed: 3
📊 Resets replaced: 2

✅ Process completed successfully
```

## ⚠️ Advertencias y Errores

### Advertencias
- Se muestran cuando se hacen ajustes significativos (ej: z-index reducido)
- No interrumpen el proceso de build
- Se registran para revisión

### Errores
- Indican problemas que no pudieron resolverse automáticamente
- Detienen el proceso de build
- Requieren intervención manual

## 🔧 Configuración

Puedes modificar los valores en el script `scripts/postbuild-css.js`:

```javascript
const CHAT_ROOT_SELECTOR = '#capin-chat-root';  // Selector del contenedor
const MAX_Z_INDEX = 1090;                         // z-index máximo permitido
const SAFE_Z_INDEX = 1085;                        // z-index por defecto
```

## 🐛 Troubleshooting

### El script no se ejecuta
- Verifica que el archivo `scripts/postbuild-css.js` exista
- Asegúrate de que Node.js esté instalado (v18+)

### CSS no se transforma correctamente
- Revisa el archivo `style.original.css` para ver el CSS sin transformar
- Verifica la consola de errores durante el build
- Ejecuta `npm run postbuild:css` manualmente para ver detalles

### Conflictos persisten en el TMS
- Verifica que el contenedor HTML use el ID `capin-chat-root`
- Comprueba que no haya otros estilos inline que sobrescriban
- Revisa el orden de carga de los CSS (el del chat debe cargarse último)

## 📝 Notas de Desarrollo

- El script preserva el CSS original como backup
- Las transformaciones son idempotentes (ejecutarlo múltiples veces no causa problemas)
- Compatible con Vite y otros bundlers basados en Rollup
- No requiere dependencias adicionales (solo Node.js nativo)

## 🔄 Integración Continua

Para CI/CD, el script se ejecuta automáticamente como parte del proceso de build:

```yaml
# Ejemplo para GitHub Actions
- name: Build Bundle
  run: npm run build:bundle
  # El script postbuild-css.js se ejecuta automáticamente
```
