# ✅ Checklist de Mantenimiento y Saneamiento

## 📋 Estado Actual del Sistema

### 1. ✅ Limpieza del Layout

**Estado**: ✅ **COMPLETO**

- [x] HTML de integración limpio (solo `<div id="capin-chat-root"></div>`)
- [x] Sin estilos inline peligrosos
- [x] Sin z-index extremos en código fuente (eliminados `z-[2147483647]`)
- [x] CSS transformado automáticamente post-build

**Archivo de integración**: `INTEGRATION.md`
```html
<!-- ✅ HTML limpio -->
<div id="capin-chat-root"></div>
<script src="/js/capin-chat-bubble.umd.js"></script>
```

---

### 2. ✅ Portales/Overlays del Chat

**Estado**: ✅ **COMPLETO**

Todos los portales Radix se montan **dentro** de `#capin-chat-root`:

- [x] `Dialog` → `container={document.getElementById('capin-chat-root')}`
- [x] `Popover` → `container={document.getElementById('capin-chat-root')}`
- [x] `Select` → `container={document.getElementById('capin-chat-root')}`

**Archivos modificados**:
- `src/components/ui/dialog.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/select.tsx`

**Código de ejemplo**:
```tsx
const container = typeof document !== 'undefined' 
  ? document.getElementById('capin-chat-root') || undefined
  : undefined;

return (
  <PopoverPrimitive.Portal container={container}>
    {/* contenido */}
  </PopoverPrimitive.Portal>
);
```

---

### 3. ✅ Z-index y Modales del Host

**Estado**: ✅ **COMPLETO**

Configuración de z-index:

- **Chat base**: `1085` (configurado en `postbuild-css.js`)
- **Máximo permitido**: `1090` (límite seguro)
- **Bootstrap modals**: `1040-1060` (chat por encima)
- **Override puntual TMS**: `1090-1095` (permitido si necesario)

**Rangos de z-index**:
```
1000 ← Mínimo del chat
1040-1060 ← Modales Bootstrap
1085 ← Chat por defecto
1090 ← Máximo chat
1095 ← Override TMS (si necesario)
```

**Transformación automática**:
- z-index `999999` → `1085`
- z-index `1000000` → `1085`
- z-index `2147483647` → `1085`

---

### 4. ✅ Postbuild Idempotente

**Estado**: ✅ **COMPLETO**

El script `postbuild-css.js` es **idempotente**:

- [x] Detecta si CSS ya fue transformado
- [x] Evita prefijos dobles de `#capin-chat-root`
- [x] Sale temprano si encuentra marcador

**Marcador de transformación**:
```css
/* Chat Root Isolation - Auto-generated */
```

**Guard implementado**:
```javascript
const TRANSFORMATION_MARKER = '/* Chat Root Isolation - Auto-generated */';
if (css.includes(TRANSFORMATION_MARKER)) {
  console.log('✅ CSS already transformed (skipping)');
  process.exit(0);
}
```

**Verificación**:
```bash
# Primera ejecución: transforma CSS
npm run build:bundle

# Segunda ejecución: detecta transformación y salta
npm run postbuild:css
# Output: ✅ CSS already transformed (skipping)
```

---

### 5. ⚠️ Revisión de Regresiones

**Estado**: ⚠️ **PENDIENTE DE TESTING**

#### A. Tipografía y Espaciados del Host

- [ ] **Tipografía TMS**: Verificar que Bootstrap no se ve afectado
- [ ] **Tablas TMS**: Asegurar que `.table` no tiene conflictos
- [ ] **Botones TMS**: Verificar que `.btn` funciona correctamente
- [ ] **Formularios TMS**: Inputs `.form-control` sin estilos del chat

**Comando de verificación**:
```bash
# Inspeccionar el CSS generado
cat dist/bundle/style.css | grep "\.btn" | head -n 5
cat dist/bundle/style.css | grep "\.table" | head -n 5
```

**Test manual**:
1. Abrir TMS con chat integrado
2. Inspeccionar elementos Bootstrap
3. Verificar que no hay estilos `#capin-chat-root .btn` aplicándose fuera del chat

---

#### B. Foco/Teclado en el Chat (A11y)

- [ ] **Tab navigation**: Navegar con Tab dentro del chat
- [ ] **Focus visible**: Bordes de foco visibles en inputs/botones
- [ ] **Escape key**: Cerrar modales con Escape
- [ ] **Screen readers**: Roles ARIA correctos

**Test manual**:
1. Abrir el chat
2. Presionar `Tab` repetidamente
3. Verificar que el foco se mueve correctamente
4. Abrir un modal → `Escape` → debe cerrar
5. Verificar que `aria-label` está presente en botones

**Archivos críticos**:
- `src/components/ui/dialog.tsx` (modales)
- `src/components/ui/popover.tsx` (menús)
- `src/components/ChatInput.tsx` (input principal)

---

#### C. Portales del Chat

- [ ] **Dialog**: Modales se abren dentro de `#capin-chat-root`
- [ ] **Popover**: Menús contextuales dentro del root
- [ ] **Tooltip**: Tooltips dentro del root
- [ ] **Select dropdowns**: Dropdowns dentro del root

**Verificación en DevTools**:
```javascript
// Abrir modal y ejecutar en consola:
document.querySelectorAll('[data-radix-portal]').forEach(portal => {
  const parent = portal.parentElement;
  console.log('Portal parent:', parent.id);
  // Debería mostrar: "Portal parent: capin-chat-root"
});
```

**Test manual**:
1. Abrir chat
2. Abrir un modal (ej: R24 Modal)
3. Inspeccionar en DevTools
4. Verificar que `[data-radix-dialog-content]` está dentro de `#capin-chat-root`

---

#### D. Carga Diferida del Chat

- [ ] **CSS disponible antes del JS**: Estilos cargados primero
- [ ] **Sin FOUC**: Sin flash of unstyled content
- [ ] **Loader visible**: Spinner/loading mientras carga
- [ ] **Montaje tardío**: Chat funciona si se monta después del DOM ready

**HTML recomendado**:
```html
<head>
  <!-- ✅ CSS primero -->
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <!-- Contenedor listo -->
  <div id="capin-chat-root"></div>
  
  <!-- Scripts al final -->
  <script src="/js/react.production.min.js"></script>
  <script src="/js/react-dom.production.min.js"></script>
  <script src="/js/capin-chat-bubble.umd.js"></script>
  
  <!-- Inicialización diferida -->
  <script>
    // Esperar a que todo esté listo
    document.addEventListener('DOMContentLoaded', function() {
      if (window.CapinChat && window.CapinChat.initChatBubble) {
        window.CapinChat.initChatBubble({
          containerId: 'capin-chat-root',
          apiUrl: 'https://api-chat.insecap.cl',
        });
      }
    });
  </script>
</body>
```

**Test manual**:
1. Limpiar caché del navegador
2. Recargar TMS
3. Observar que el chat se monta sin problemas
4. Verificar que no hay errores en consola

---

## 🔧 Comandos Útiles

### Build y Verificación

```bash
# Build completo con transformación CSS
npm run build:bundle

# Verificar idempotencia (no debería transformar de nuevo)
npm run postbuild:css

# Ver CSS transformado
cat dist/bundle/style.css | head -n 50

# Buscar z-index altos (no debería encontrar nada)
cat dist/bundle/style.css | grep -E "z-index:\s*[0-9]{5,}"

# Verificar encapsulación
cat dist/bundle/style.css | grep "^body {" # No debería encontrar nada
cat dist/bundle/style.css | grep "#capin-chat-root body {" # Debería encontrar
```

### Desarrollo

```bash
# Modo desarrollo (sin transformación CSS)
npm run dev

# Build de prueba
npm run build:bundle

# Comparar CSS original vs transformado
diff dist/bundle/style.original.css dist/bundle/style.css | head -n 50
```

---

## 📊 Métricas de Transformación

Última ejecución exitosa:

```
🔧 Post-build CSS transformation starting...

📝 Original CSS size: 78.81 KB

🔒 Step 1: Encapsulating global selectors...
   ✅ Global selectors encapsulated: 19

📊 Step 2: Adjusting z-index values...
   ⚠️  z-index 999999 → 1085
   ⚠️  z-index 1000000 → 1085
   ⚠️  z-index 2147483647 → 1085 (3 occurrences)
   ✅ z-index values adjusted: 9

🗑️  Step 3: Removing global DOM rules...
   ✅ Removed 2 dangerous rules

🔄 Step 4: Replacing aggressive resets...
   ✅ Replaced 1 aggressive resets

🛡️  Step 5: Ensuring chat root isolation...
   ✅ Added chat root isolation rule

🔍 Step 6: Final verification...
   ✅ All checks passed

✅ Transformation complete!
📝 Final CSS size: 80.29 KB
```

---

## 🚨 Problemas Conocidos y Soluciones

### Problema 1: Modales del chat se renderizan fuera del root

**Síntoma**: Los modales aparecen en `body > [data-radix-portal]` en lugar de `#capin-chat-root`

**Solución**: ✅ Ya corregido en `dialog.tsx`, `popover.tsx`, `select.tsx`

**Verificación**:
```javascript
// En DevTools, con un modal abierto:
document.querySelector('[data-radix-dialog-content]').parentElement.parentElement.id
// Debería retornar: "capin-chat-root"
```

---

### Problema 2: z-index extremos en CSS generado

**Síntoma**: CSS contiene `z-index: 2147483647` o valores similares

**Solución**: ✅ Ya corregido - script reduce automáticamente a `1085`

**Verificación**:
```bash
# No debería encontrar nada:
grep -E "z-index:\s*[0-9]{5,}" dist/bundle/style.css
```

---

### Problema 3: CSS se transforma múltiples veces

**Síntoma**: Al correr `npm run build:bundle` dos veces, el CSS se duplica o corrompe

**Solución**: ✅ Ya corregido - script detecta transformación previa y salta

**Verificación**:
```bash
# Primera ejecución: transforma
npm run build:bundle

# Segunda ejecución: debería mostrar "already transformed"
npm run postbuild:css
```

---

## 📚 Documentación Relacionada

- **Integración TMS**: `INTEGRATION.md`
- **Desarrollo**: `DEVELOPMENT.md`
- **Scripts**: `scripts/README.md`
- **Arquitectura**: `README.md`

---

## ✅ Resumen del Estado

| Tarea | Estado | Notas |
|-------|--------|-------|
| Limpieza del layout | ✅ Completo | HTML limpio, sin inline styles |
| Portales dentro del root | ✅ Completo | Dialog, Popover, Select configurados |
| z-index seguro | ✅ Completo | Rango 1085-1090 |
| Script idempotente | ✅ Completo | Detecta transformación previa |
| Testing tipografía | ⚠️ Pendiente | Requiere prueba manual en TMS |
| Testing a11y | ⚠️ Pendiente | Verificar teclado/foco |
| Testing portales | ⚠️ Pendiente | Confirmar en DevTools |
| Testing carga diferida | ⚠️ Pendiente | Probar montaje tardío |

---

**Última actualización**: 2025-11-12
**Autor**: Sistema de desarrollo Capin Chat
**Versión**: 1.0.0
