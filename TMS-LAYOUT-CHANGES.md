# Cambios necesarios en el Layout de TMS para Shadow DOM

## 1. ELIMINAR el CSS del chat del <head>

### ❌ ANTES (líneas 50-59):
```cshtml
@if (User.Identity.IsAuthenticated)
{
    var rolesAutorizados = new[] { ... };
    var tieneAcceso = rolesAutorizados.Any(rol => User.IsInRole(rol));
    if (tieneAcceso)
    {
        <link rel="preload" as="style" href="~/Content/js/Chat/style.css?v=@DateTime.Now.Ticks" />
        <link rel="stylesheet" href="~/Content/js/Chat/style.css?v=@DateTime.Now.Ticks" />
    }
}
```

### ✅ DESPUÉS:
```cshtml
<!-- ELIMINAR COMPLETAMENTE ESTE BLOQUE -->
<!-- El CSS ahora se inyecta dentro del Shadow DOM -->
```

---

## 2. ACTUALIZAR el script de inicialización del chat

### ❌ ANTES (líneas 236-268):
```javascript
<script>
    (function () {
        var chatIsOpen = false;

        function boot() {
            try {
                var chatRoot = document.getElementById('capin-chat-root');
                if (!chatRoot || !window.CapinChat || typeof window.CapinChat.renderChatBubble !== 'function') return;

                fetch('/Chat/Index', { credentials: 'same-origin' })
                    .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
                    .then(function (userData) {
                        if (userData.authorized === false) { chatRoot.style.display = 'none'; return; }
                        window.CapinChat.renderChatBubble(userData, 'capin-chat-root');
                        setTimeout(function () { protectChatEvents(chatRoot); }, 600);
                    })
                    .catch(function () { chatRoot.style.display = 'none'; });
            } catch (_) { /* noop */ }
        }

        function protectChatEvents(chatRoot) {
            // ... código actual ...
        }

        function toggleBodyProtection(isOpen) {
            // ... código actual ...
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', boot);
        } else {
            boot();
        }
    })();
</script>
```

### ✅ DESPUÉS:
```javascript
<script>
    (function () {
        var chatIsOpen = false;
        var chatInstance = null;

        function boot() {
            try {
                var chatRoot = document.getElementById('capin-chat-root');
                if (!chatRoot || !window.CapinChat || typeof window.CapinChat.renderChatBubble !== 'function') return;

                fetch('/Chat/Index', { credentials: 'same-origin' })
                    .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
                    .then(function (userData) {
                        if (userData.authorized === false) { 
                            chatRoot.style.display = 'none'; 
                            return; 
                        }

                        // ✅ NUEVO: Renderizar con opciones de Shadow DOM
                        window.CapinChat.renderChatBubble(userData, 'capin-chat-root', {
                            debug: false,
                            zIndex: 1085
                        }).then(function(result) {
                            chatInstance = result;
                            console.log('[TMS] Chat montado en Shadow DOM');
                            setTimeout(function () { protectChatEvents(chatRoot); }, 600);
                        }).catch(function(err) {
                            console.error('[TMS] Error al montar chat:', err);
                            chatRoot.style.display = 'none';
                        });
                    })
                    .catch(function () { chatRoot.style.display = 'none'; });
            } catch (_) { /* noop */ }
        }

        function protectChatEvents(chatRoot) {
            // ✅ ACTUALIZADO: Observar cambios en el Shadow DOM
            var shadowRoot = chatRoot.shadowRoot;
            if (!shadowRoot) {
                console.warn('[TMS] Shadow DOM no encontrado');
                return;
            }

            var observer = new MutationObserver(function () {
                // Buscar dentro del Shadow DOM
                var isOpen = !!(
                    shadowRoot.querySelector('[data-state="open"]') || 
                    shadowRoot.querySelector('.open')
                );
                if (isOpen !== chatIsOpen) { 
                    chatIsOpen = isOpen; 
                    toggleBodyProtection(isOpen); 
                }
            });

            // Observar cambios en el Shadow DOM
            observer.observe(shadowRoot, { 
                attributes: true, 
                childList: true, 
                subtree: true, 
                attributeFilter: ['class', 'data-state'] 
            });

            // Proteger eventos en el host (ya no es necesario en shadow root)
            chatRoot.addEventListener('mousedown', function (e) { e.stopPropagation(); }, true);
            chatRoot.addEventListener('click', function (e) { e.stopPropagation(); }, true);
        }

        function toggleBodyProtection(isOpen) {
            var body = document.body;
            var pantallaCarga = document.getElementById('PantallaCarga');
            var modalBackdrop = document.getElementById('ModalBackdrop');
            if (isOpen) {
                body.classList.add('chat-active');
                if (pantallaCarga) pantallaCarga.classList.add('chat-overlay-safe');
                if (modalBackdrop) modalBackdrop.classList.add('chat-overlay-safe');
            } else {
                body.classList.remove('chat-active');
                if (pantallaCarga) pantallaCarga.classList.remove('chat-overlay-safe');
                if (modalBackdrop) modalBackdrop.classList.remove('chat-overlay-safe');
            }
        }

        // ✅ NUEVO: Limpieza al descargar la página
        window.addEventListener('beforeunload', function() {
            if (window.CapinChat && window.CapinChat.unmountChatBubble) {
                window.CapinChat.unmountChatBubble('capin-chat-root');
            }
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', boot);
        } else {
            boot();
        }
    })();
</script>
```

---

## 3. MANTENER (sin cambios):

### ✅ El contenedor del chat:
```cshtml
<div id="capin-chat-root" data-capin-host="tms"></div>
```

### ✅ Los scripts de React y el bundle:
```cshtml
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="~/Content/js/Chat/capin-chat-bubble.umd.js?v=@DateTime.Now.Ticks"></script>
```

---

## Resumen de cambios:

1. **ELIMINAR**: `<link>` del CSS del chat en el `<head>` (líneas 50-59)
2. **ACTUALIZAR**: Script de inicialización con:
   - Llamada a `renderChatBubble()` con opciones y `.then()`
   - `protectChatEvents()` para observar el Shadow DOM
   - Event listener para `beforeunload` con cleanup
3. **MANTENER**: Contenedor, scripts de React, y bundle UMD

---

## Verificación post-deployment:

1. Abrir DevTools (F12)
2. Buscar elemento `#capin-chat-root`
3. Debe aparecer `▶ #shadow-root (open)`
4. Dentro del shadow: `<style>` + `<div id="capin-chat-mount">`
5. Verificar que NO haya conflictos de estilos con TMS
