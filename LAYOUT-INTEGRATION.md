# Integración del Chat en Layouts TMS

## Código Correcto para los Layouts

Reemplaza la sección del chat en tus layouts (`_Layout.cshtml`, `_Layout3.cshtml`, `_Layout4.cshtml`) con este código:

```cshtml
@* ===================== WIDGET CHAT CAPIN (con restricción de roles) ===================== *@
@if (User.Identity.IsAuthenticated)
{
    var rolesAutorizados = new[] {
        "DigitaciónYPostCurso",
        "Administrador",
        "Gerencia",
        "Relator",
        "Participante",
        "Lider Comercial",
        "Diseño & Desarrollo",
        "Logistica",
        "Representante Empresa"
    };

    var tieneAcceso = rolesAutorizados.Any(rol => User.IsInRole(rol));

    if (tieneAcceso)
    {
        <!-- Contenedor del chat (NO cargar CSS aquí, lo maneja el Shadow DOM) -->
        <div id="capin-chat-root" data-capin-host="tms"></div>

        <!-- React 18 UMD (requerido por el bundle del chat) -->
        <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

        <!-- Bundle UMD del chat -->
        <script src="~/Content/js/Chat/capin-chat-bubble.umd.js?v=@DateTime.Now.Ticks"></script>

        <!-- Inicializador -->
        <script>
            (function () {
                'use strict';

                function boot() {
                    try {
                        var chatRoot = document.getElementById('capin-chat-root');
                        if (!chatRoot || !window.CapinChat || typeof window.CapinChat.renderChatBubble !== 'function') {
                            console.warn('[TMS] Chat no disponible');
                            return;
                        }

                        // Obtener datos del usuario desde el backend
                        fetch('/Chat/Index', { credentials: 'same-origin' })
                            .then(function (res) { 
                                if (!res.ok) throw new Error('HTTP ' + res.status); 
                                return res.json(); 
                            })
                            .then(function (userData) {
                                if (userData.authorized === false) {
                                    chatRoot.style.display = 'none';
                                    return;
                                }

                                // Montar chat en Shadow DOM
                                window.CapinChat.renderChatBubble(userData, 'capin-chat-root', {
                                    debug: false,
                                    zIndex: 9999
                                });

                                console.log('[TMS] Chat montado correctamente');

                                // Escuchar cambios de estado del chat
                                chatRoot.addEventListener('chatStateChange', function(e) {
                                    var isOpen = e.detail && e.detail.isOpen;
                                    console.log('[TMS] Estado del chat:', isOpen ? 'ABIERTO' : 'CERRADO');
                                    
                                    // Aquí puedes agregar lógica adicional si el chat afecta overlays
                                    // Por defecto, el chat NO bloquea la página gracias a pointer-events
                                });
                            })
                            .catch(function (err) { 
                                console.error('[TMS] Error cargando chat:', err);
                                chatRoot.style.display = 'none'; 
                            });
                    } catch (err) {
                        console.error('[TMS] Error inicializando chat:', err);
                    }
                }

                // Ejecutar cuando el DOM esté listo
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', boot);
                } else {
                    boot();
                }
            })();
        </script>
    }
}
@* =================== / WIDGET CHAT CAPIN ===================== *@
```

## Puntos Clave

1. **NO cargar `style.css`** - El Shadow DOM maneja sus propios estilos
2. **Usar `data-chat-state`** - El chat actualiza automáticamente este atributo
3. **Evento `chatStateChange`** - Se dispara cada vez que el chat abre/cierra
4. **z-index: 9999** - Suficientemente alto sin conflictos
5. **pointer-events** - Arquitectura ya configurada en el bundle

## Verificación

Después de actualizar el layout:

1. Abre la consola del navegador
2. Deberías ver: `[TMS] Chat montado correctamente`
3. Al hacer clic en el botón, debería aparecer: `[TMS] Estado del chat: ABIERTO`
4. El chat debe abrir Y la página debe seguir siendo interactiva

## Problema Anterior

El código anterior intentaba observar el Shadow DOM desde fuera con `chatRoot.querySelector()`, lo cual no funciona porque el Shadow DOM está encapsulado. Ahora el chat notifica activamente sus cambios de estado.
