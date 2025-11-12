# Integración del Chat Bundle en TMS

## 📦 Archivos Generados

Después de ejecutar `npm run build:bundle`, se generan los siguientes archivos en `dist/bundle/`:

```
dist/bundle/
├── capin-chat-bubble.umd.js       # Bundle UMD (compatible con scripts tradicionales)
├── capin-chat-bubble.es.js        # Bundle ES Module (para imports modernos)
├── style.css                       # CSS transformado (listo para TMS)
├── style.original.css              # Backup del CSS sin transformar
└── *.map                          # Source maps para debugging
```

## 🚀 Integración en TMS

### 1. Copiar Archivos al TMS

Copia los siguientes archivos al directorio de assets del TMS:

```bash
# Desde el proyecto del chat
cp dist/bundle/capin-chat-bubble.umd.js /ruta/tms/public/js/
cp dist/bundle/style.css /ruta/tms/public/css/
```

### 2. Modificar la Vista del TMS

En el archivo HTML o layout principal del TMS (ejemplo: `layout.html`, `base.blade.php`, etc.):

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Estilos existentes del TMS (Bootstrap, etc.) -->
    <link rel="stylesheet" href="/css/bootstrap.min.css">
    <link rel="stylesheet" href="/css/tms-styles.css">
    
    <!-- ✅ Agregar estilos del chat AL FINAL -->
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <!-- Contenido existente del TMS -->
    <div id="tms-content">
        <!-- ... contenido existente ... -->
    </div>

    <!-- ✅ Agregar contenedor del chat -->
    <div id="capin-chat-root"></div>

    <!-- Scripts existentes del TMS -->
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/tms-app.js"></script>

    <!-- ✅ Agregar React (si no está ya cargado) -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

    <!-- ✅ Agregar script del chat -->
    <script src="/js/capin-chat-bubble.umd.js"></script>

    <!-- ✅ Inicializar el chat -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (window.CapinChat && window.CapinChat.initChatBubble) {
                window.CapinChat.initChatBubble({
                    containerId: 'capin-chat-root',
                    apiUrl: 'https://api-chat.insecap.cl',
                    // Otras configuraciones...
                });
            }
        });
    </script>
</body>
</html>
```

## 🔧 Configuración de z-index

El chat utiliza un z-index de **1085** para coexistir con Bootstrap y otros componentes del TMS.

### Rango de z-index del TMS (Referencia)

```css
/* Bootstrap Defaults */
.dropdown         { z-index: 1000; }
.sticky           { z-index: 1020; }
.fixed            { z-index: 1030; }
.modal-backdrop   { z-index: 1040; }
.modal            { z-index: 1050; }
.popover          { z-index: 1060; }
.tooltip          { z-index: 1070; }

/* Chat (nuevo) */
#capin-chat-root  { z-index: 1085; }  /* ✅ Por encima de tooltips Bootstrap */
```

### Si hay conflictos de z-index

Si algún componente del TMS necesita estar por encima del chat, ajusta su z-index:

```css
/* En el CSS del TMS */
#componente-critico {
    z-index: 1086 !important;  /* Por encima del chat */
}
```

## 🎨 Personalización de Estilos

### Variables CSS del Chat

El chat usa variables CSS que pueden sobrescribirse en el TMS:

```css
/* En el CSS del TMS, agregar después del style.css del chat */
#capin-chat-root {
    --primary: 227 58% 53%;              /* Color principal (azul) */
    --accent: 191 100% 47%;               /* Color de acento (cyan) */
    --chat-user-bg: 227 58% 53%;         /* Fondo mensajes del usuario */
    --chat-assistant-bg: 0 0% 100%;      /* Fondo mensajes del asistente */
    --chat-assistant-border: 227 58% 53%; /* Borde mensajes del asistente */
}
```

### Ajustar Posición del Chat

```css
/* Mover el chat a otra posición */
#capin-chat-root {
    bottom: 20px;   /* Distancia desde abajo */
    right: 20px;    /* Distancia desde la derecha */
    /* O para ponerlo a la izquierda: */
    /* left: 20px; right: auto; */
}
```

## 🐛 Troubleshooting

### El chat no aparece

1. **Verificar consola del navegador** para errores JavaScript
2. **Verificar que React esté cargado** antes del chat:
   ```javascript
   console.log(window.React);  // Debe devolver objeto
   console.log(window.ReactDOM);  // Debe devolver objeto
   ```
3. **Verificar que el contenedor existe**:
   ```javascript
   console.log(document.getElementById('capin-chat-root'));  // Debe devolver elemento
   ```

### El chat se ve mal o rompe el layout del TMS

1. **Verificar orden de carga de CSS** - el `style.css` del chat debe cargarse último
2. **Verificar que existe el contenedor** `#capin-chat-root`
3. **Inspeccionar con DevTools** para ver si hay estilos del TMS sobrescribiendo al chat
4. **Regenerar el bundle** con `npm run build:bundle` para asegurar las últimas transformaciones

### Modales del TMS no funcionan después de instalar el chat

1. **Verificar z-index de modales del TMS**:
   ```css
   .modal-tms {
       z-index: 1086 !important;  /* Por encima del chat */
   }
   ```
2. **Verificar que no hay overflow: hidden en body**:
   ```javascript
   // El chat NO debería agregar esto, pero por si acaso:
   document.body.style.overflow = 'auto';
   ```

### El chat interfiere con dropdown/select del TMS

El CSS transformado **no debería** interferir con componentes del TMS porque todos los selectores están encapsulados bajo `#capin-chat-root`.

Si hay problemas:
1. Verificar que el CSS del TMS se carga antes que el del chat
2. Agregar `!important` a estilos críticos del TMS si es necesario
3. Reportar el issue para mejorar la encapsulación

## 📊 Verificación Post-Integración

### Checklist

- [ ] Chat aparece en la esquina inferior derecha
- [ ] No hay conflictos visuales con el layout del TMS
- [ ] Modales del TMS siguen funcionando
- [ ] Dropdowns/selects del TMS siguen funcionando
- [ ] Tooltips del TMS siguen funcionando
- [ ] No hay errores en la consola del navegador
- [ ] El chat se puede abrir y cerrar correctamente
- [ ] Los mensajes se envían y reciben correctamente

### Comandos de Verificación (Browser Console)

```javascript
// 1. Verificar que el chat está cargado
console.log(window.CapinChat);

// 2. Verificar encapsulación CSS
const chatRoot = document.getElementById('capin-chat-root');
const computedStyle = window.getComputedStyle(chatRoot);
console.log('z-index:', computedStyle.zIndex);  // Debe ser 1085
console.log('isolation:', computedStyle.isolation);  // Debe ser 'isolate'

// 3. Verificar que no hay selectores globales sueltos
const allStyles = Array.from(document.styleSheets);
const chatStyles = allStyles.find(s => s.href && s.href.includes('style.css'));
console.log('Chat stylesheet:', chatStyles);
```

## 🔄 Actualización del Chat

Cuando se actualice el chat:

```bash
# 1. En el proyecto del chat
git pull
npm install  # Si hay nuevas dependencias
npm run build:bundle

# 2. Copiar archivos actualizados al TMS
cp dist/bundle/capin-chat-bubble.umd.js /ruta/tms/public/js/
cp dist/bundle/style.css /ruta/tms/public/css/

# 3. Limpiar caché del navegador o versionar archivos
# Opción A: Hard refresh (Ctrl+Shift+R)
# Opción B: Agregar versión al query string
<script src="/js/capin-chat-bubble.umd.js?v=1.2.0"></script>
```

## 📞 Soporte

Si encuentras problemas de integración:

1. Verificar el archivo `dist/bundle/style.original.css` para comparar con el transformado
2. Revisar los logs del script `postbuild-css.js` después del build
3. Contactar al equipo de desarrollo del chat con:
   - Screenshots del problema
   - Consola del navegador (errores)
   - Configuración del TMS (framework, versión de Bootstrap, etc.)
