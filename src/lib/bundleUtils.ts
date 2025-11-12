import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatBubble, UserData } from '../components/ChatBubble';

/**
 * Tipos para los datos del usuario de TMS
 */
export type TMSUserData = {
  id: string;
  name?: string;
  email?: string;
  rut?: string;
  role?: string;
  session_id: string;
  idCliente?: string;
  clientesAsociados?: Array<{ idCliente: string; nombre: string }>;
};

/**
 * Carga la hoja de estilos del chat si no está presente
 */
const ensureStylesLoaded = () => {
  if (!document.querySelector('link[data-capin-style]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/Content/js/Chat/style.css';
    link.setAttribute('data-capin-style', '1');
    link.onerror = () => {
      console.warn('[Chat][asset_404] No se pudo cargar /Content/js/Chat/style.css');
    };
    document.head.appendChild(link);
  }
};

/**
 * Instala fallbacks para imágenes que no carguen
 */
const installImgFallbacks = () => {
  document.addEventListener('error', function (e: Event) {
    const target = e.target as HTMLImageElement | null;
    if (target && target.tagName === 'IMG') {
      console.warn('[Chat][asset_404]', target.src);
      // Fallback: SVG inline simple
      target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23e0e0e0"/><text x="20" y="24" text-anchor="middle" font-size="20" fill="%23666">?</text></svg>';
    }
  }, true);
};

/**
 * Envía el primer mensaje automático con datos del usuario TMS
 * Esta función dispara un evento CustomEvent que CapinChat escucha
 */
export const autoBootOnce = (userData: TMSUserData) => {
  try {
    if (!userData || !userData.session_id) {
      console.log('[Chat] Saltando auto-boot: falta userData o session_id');
      return;
    }

    // Evitar enviar el mensaje más de una vez por pestaña
    const storageKey = `capin:auto_msg_sent:${userData.session_id}`;
    if (sessionStorage.getItem(storageKey) === '1') {
      console.log('[Chat] Auto-boot ya enviado en esta sesión');
      return;
    }

    // Construir payload de auto-boot
    const payload = {
      type: 'tms_user_boot',
      at: new Date().toISOString(),
      user: {
        id: userData.id || '',
        name: userData.name || '',
        email: userData.email || '',
        rut: userData.rut || '',
        role: userData.role || '',
        session_id: userData.session_id
      }
    };

    // Marca se envió en esta sesión (es semaforito, no rollback)
    sessionStorage.setItem(storageKey, '1');

    // Disparar evento DOM que CapinChat escucha
    // CapinChat será responsable de enviar el mensaje vía handleSendMessage
    window.dispatchEvent(new CustomEvent('capin:chat:auto_boot', { detail: payload }));
    console.log('[Chat] Auto-boot event despachado para CapinChat');
  } catch (e) {
    console.warn('[Chat][autoBootOnce][warn]', e);
  }
};

/**
 * Función principal para renderizar el chat bubble desde TMS
 * Versión simplificada SIN Shadow DOM
 * 
 * Uso: window.CapinChat.renderChatBubble(userData, 'capin-chat-root');
 */
export const renderChatBubble = (userData?: TMSUserData, containerId = 'capin-chat-root') => {
  try {
    console.log('[Chat] Iniciando carga desde Partial View...');

    // 1. Cargar estilos
    ensureStylesLoaded();

    // 2. Obtener o crear contenedor
    let host = document.getElementById(containerId);
    if (!host) {
      console.log(`[Chat] Creando contenedor ${containerId}`);
      host = document.createElement('div');
      host.id = containerId;
      document.body.appendChild(host);
    }

    // 3. Normalizar datos
    const label = (userData && (userData.email || userData.name)) || 'Usuario';
    document.title = `Chat de: ${label}`;

    // 4. Deduplicar clientes asociados si existen
    let clientesDeduplicados = userData?.clientesAsociados;
    if (clientesDeduplicados && clientesDeduplicados.length > 0) {
      const clientesUnicos = new Map<string, { idCliente: string; nombre: string }>();
      clientesDeduplicados.forEach(cliente => {
        if (!clientesUnicos.has(cliente.idCliente)) {
          clientesUnicos.set(cliente.idCliente, cliente);
        }
      });
      clientesDeduplicados = Array.from(clientesUnicos.values());
    }

    // 5. Convertir userData de TMS a formato interno
    const chatBubbleProps: UserData = {
      userId: userData?.id,
      userName: userData?.name,
      userRut: userData?.rut,
      userEmail: userData?.email,
      userRole: (userData?.role || 'publico') as unknown as string,
      sessionId: userData?.session_id,
      tmsOriginalRole: userData?.role,
      idCliente: userData?.idCliente,
      clientesAsociados: clientesDeduplicados,
    };

    console.log('[Chat] ========== DATOS RECIBIDOS DESDE TMS ==========');
    console.log('[Chat] Usuario ID:', userData?.id);
    console.log('[Chat] Nombre:', userData?.name);
    console.log('[Chat] Email:', userData?.email);
    console.log('[Chat] RUT:', userData?.rut);
    console.log('[Chat] Rol Original (TMS):', userData?.role);
    console.log('[Chat] Session ID:', userData?.session_id);
    console.log('[Chat] ID Cliente:', userData?.idCliente);
    console.log('[Chat] Clientes Asociados (deduplicados):', clientesDeduplicados);
    if (clientesDeduplicados && clientesDeduplicados.length > 0) {
      console.log('[Chat] Total de clientes asociados:', clientesDeduplicados.length);
      clientesDeduplicados.forEach((cliente, index) => {
        console.log(`[Chat]   Cliente ${index + 1}: ${cliente.nombre} (ID: ${cliente.idCliente})`);
      });
    }
    console.log('[Chat] ===================================================');

    // 5. Montar el componente React
    const root = ReactDOM.createRoot(host);
    root.render(React.createElement(ChatBubble, chatBubbleProps));
    
    console.log('[Chat] ✓ Chat montado correctamente');

    // 6. Enviar primer mensaje automático
    if (userData) {
      autoBootOnce(userData);
    }
  } catch (e) {
    console.error('[Chat][Fatal]', e);
  }
};

/**
 * Función legacy para compatibilidad (antigua API)
 */
export const renderChatBubbleFromComponent = (userData?: UserData, containerId = 'chat-bubble-container') => {
  let container = document.getElementById(containerId);
  
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  const root = ReactDOM.createRoot(container);
  root.render(
    React.createElement(ChatBubble, userData || {})
  );
};

/**
 * Configuración para uso como UMD (Universal Module Definition)
 */
export const setupGlobalAPI = () => {
  if (typeof window !== 'undefined') {
    interface CapinChatAPI {
      renderChatBubble?: typeof renderChatBubble;
      autoBootOnce?: typeof autoBootOnce;
    }
    const globalWindow = window as Window & { CapinChat?: CapinChatAPI };

    // Exponer API global para TMS
    if (!globalWindow.CapinChat) {
      globalWindow.CapinChat = {};
    }
    globalWindow.CapinChat.renderChatBubble = renderChatBubble;
    globalWindow.CapinChat.autoBootOnce = autoBootOnce;

    console.log('[Chat] API global configurada: window.CapinChat.renderChatBubble disponible');
  }

  // Instalar fallbacks de imágenes
  installImgFallbacks();
};