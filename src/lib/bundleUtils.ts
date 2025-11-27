import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatBubble, UserData } from '../components/ChatBubble';
import { ShadowRootProvider } from '../contexts/ShadowRootContext';
import { mapTmsRoleToCapin } from './tmsRoleMapper';

/**
 * Referencia global al contenedor de portales de Shadow DOM
 * Inicializado en initializeChat() y usado por ShadowPortalContext
 */
export let globalPortalContainer: HTMLElement | null = null;

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
 * Opciones de configuración para el chat embebido
 */
export interface ChatEmbedOptions {
  zIndex?: number;                 // default 1085
  theme?: 'light' | 'dark' | string;
  radixPortalContainer?: 'shadow';
  basePath?: string;
  debug?: boolean;
}

/**
 * Tipos auxiliares para almacenar referencias en el host
 */
interface HostWithCapinData extends HTMLElement {
  __capinRoot?: ReactRoot;
  __capinShadowRoot?: ShadowRoot;
}

type ReactRoot = ReturnType<typeof ReactDOM.createRoot>;

/**
 * Obtiene el CSS compilado del bundle para inyectarlo en el Shadow DOM
 * En producción, esto se reemplazará con el CSS real del build
 */
// IMPORTANTE: Este CSS se incluirá en el bundle durante build
// El archivo src/assets/shadow-styles.css se genera desde dist/bundle/style.css DESPUÉS de PostCSS
import shadowCSS from '../assets/shadow-styles.css?inline';

const getShadowCSS = (): string => {
  // Retornar CSS inline desde el bundle (ya transformado por PostCSS)
  if (shadowCSS && shadowCSS.length > 1000) {
    return shadowCSS;
  }
  
  // Fallback: retornar string vacío (el CSS se cargará del archivo)
  return '';
};

/**
 * Carga la hoja de estilos del chat en el Shadow DOM
 */
const injectShadowStyles = async (shadowRoot: ShadowRoot): Promise<void> => {
  // CRÍTICO: Establecer font-size base en :host para evitar herencia del sistema externo
  const resetHostStyles = document.createElement('style');
  resetHostStyles.setAttribute('data-host-reset', 'true');
  resetHostStyles.textContent = `
    :host {
      /* CRÍTICO: Establecer font-size base fijo para que rem funcione correctamente */
      font-size: 20px !important;
      line-height: 1.5 !important;
      
      /* Prevenir herencia de estilos del DOM padre */
      all: initial;
      
      /* Restaurar display y box-sizing después del reset */
      display: block !important;
      box-sizing: border-box !important;
      
      /* Font stack completo */
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
      
      /* Colores base */
      color: #1a1a1a !important;
      background: transparent !important;
      
      /* Asegurar que los elementos internos hereden correctamente */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    :host * {
      box-sizing: border-box !important;
    }
  `;
  shadowRoot.appendChild(resetHostStyles);
  
  const styleTag = document.createElement('style');
  styleTag.setAttribute('data-chat-styles', 'true');
  
  // Intentar obtener CSS inline del bundle
  let css = getShadowCSS();
  
  // Si no hay CSS inline, cargar del archivo (sin logs verbosos)
  if (!css) {
    const cssUrls = [
      'dist/bundle/style.css',
      '/Content/js/Chat/style.css',
      './style.css'
    ];
    
    for (const url of cssUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          css = await response.text();
          break;
        }
      } catch (e) {
        // Continuar con siguiente URL
      }
    }
    
    if (!css) {
      console.warn('[Chat] No se pudo cargar style.css');
      css = ':host { all: initial; }';
    }
  }
  
  // VALIDACIÓN CRÍTICA: Verificar que CSS contiene estilos
  if (!css || css.length < 100) {
    console.error('[Chat] ⚠️ CSS inválido o muy corto, forzando estilos base');
    css = `
      #capin-chat-root { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        line-height: 1.5;
        color: #1a1a1a;
      }
      #capin-chat-root * { box-sizing: border-box; }
    `;
  }

  // NO TRANSFORMAR: Mantener prefijos #capin-chat-root para especificidad
  // El wrapper interno con id="capin-chat-root" permitirá que las reglas funcionen
  
  // Agregar estilos al Shadow DOM SIN modificar
  styleTag.textContent = css;
  shadowRoot.appendChild(styleTag);

  // Constructable Stylesheet (opcional)
  try {
    const sheet = new CSSStyleSheet();
    await sheet.replace(css);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (shadowRoot as any).adoptedStyleSheets = [ ...((shadowRoot as any).adoptedStyleSheets || []), sheet ];
    console.log('[Chat] ✅ adoptedStyleSheets aplicado');
  } catch {
    // ignore si no se soporta
    console.log('[Chat] ℹ️ adoptedStyleSheets no soportado en este navegador');
  }
  
  // VERIFICACIÓN POST-INYECCIÓN (silenciosa)
  setTimeout(() => {
    const injectedStyle = shadowRoot.querySelector('style[data-chat-styles]');
    if (!injectedStyle || !injectedStyle.textContent) {
      console.error('[Chat] ❌ CRÍTICO: Estilos NO se inyectaron correctamente');
      // Reintentar inyección
      const backupStyle = document.createElement('style');
      backupStyle.textContent = css;
      backupStyle.setAttribute('data-chat-styles-backup', 'true');
      shadowRoot.appendChild(backupStyle);
    }
  }, 100);
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
 * Función principal para renderizar el chat bubble con Shadow DOM
 * 
 * Uso: window.CapinChat.renderChatBubble(userData, 'capin-chat-root', options);
 */
export const renderChatBubble = async (
  userData?: TMSUserData, 
  containerId = 'capin-chat-root',
  options: ChatEmbedOptions = {}
) => {
  try {
    // FORZAR que los logs se vean
    console.clear();
    console.log('%c[Chat] 🚀 INICIANDO CARGA CON SHADOW DOM', 'background: #2563eb; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
    console.log('[Chat] Iniciando carga con Shadow DOM...');

    const { zIndex = 1085, debug = false } = options;

    // 1. Obtener o crear contenedor host
    let host = document.getElementById(containerId) as HostWithCapinData | null;
    if (!host) {
      if (debug) console.log(`[Chat] Creando contenedor ${containerId}`);
      const newHost = document.createElement('div');
      newHost.id = containerId;
      document.body.appendChild(newHost);
      host = newHost as HostWithCapinData;
    }

    // Host localizado en esquina inferior derecha (NO fullscreen)
    host.style.cssText = `
      position: fixed !important;
      right: 20px !important;
      bottom: 20px !important;
      z-index: ${zIndex} !important;
      width: auto !important;
      height: auto !important;
      pointer-events: auto !important;
    `;

    // 2. Idempotencia: si ya existe un root, desmontarlo
    if (host.__capinRoot) {
      try {
        if (debug) console.log('[Chat] Desmontando instancia anterior');
        host.__capinRoot.unmount();
      } catch (e) {
        console.warn('[Chat] Error desmontando instancia anterior:', e);
      }
    }

    // 3. Crear o reutilizar Shadow DOM
    const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    
    // Limpiar contenido anterior del shadow
    shadowRoot.innerHTML = '';

    // 4. Inyectar estilos primero
    if (debug) console.log('[Chat] Inyectando estilos en Shadow DOM...');
    await injectShadowStyles(shadowRoot);

    // 5. Contenedor de montaje React (simple, sin wrappers adicionales)
    const mountPoint = document.createElement('div');
    mountPoint.id = 'capin-chat-mount';
    mountPoint.style.cssText = `
      position: relative !important;
    `;
    shadowRoot.appendChild(mountPoint);

    // 6. Contenedor para portales de Radix UI (Select, Dropdown, etc.)
    const portalContainer = document.createElement('div');
    portalContainer.setAttribute('data-chat-portal-root', '');
    portalContainer.style.cssText = `
      position: fixed !important;
      z-index: 9999 !important;
      pointer-events: none !important;
    `;
    shadowRoot.appendChild(portalContainer);
    
    // Guardar referencia global para ShadowPortalContext
    globalPortalContainer = portalContainer;
    
    if (debug) console.log('[Chat] ✅ Contenedor de portales creado');

    // VALIDACIÓN: Verificar que la estructura está completa
    if (!shadowRoot.querySelector('#capin-chat-mount')) {
      throw new Error('[Chat] CRÍTICO: #capin-chat-mount no se creó');
    }
    if (!shadowRoot.querySelector('[data-chat-portal-root]')) {
      throw new Error('[Chat] CRÍTICO: data-chat-portal-root no se creó');
    }
    if (debug) console.log('[Chat] ✅ Estructura Shadow DOM validada correctamente');

    // 7. Normalizar datos del usuario
    const label = (userData && (userData.email || userData.name)) || 'Usuario';
    
    // 7. Deduplicar clientes asociados
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

    // 8. Mapear rol de TMS a rol de chat
    const roleMapping = mapTmsRoleToCapin(userData?.role);
    console.log('[bundleUtils DEBUG] Rol mapeado:', { original: userData?.role, mapped: roleMapping.capinRole });
    
    // 9. Convertir userData de TMS a formato interno
    const chatBubbleProps: UserData = {
      userId: userData?.id,
      userName: userData?.name,
      userRut: userData?.rut,
      userEmail: userData?.email,
      userRole: roleMapping.capinRole as string, // ✅ USAR ROL MAPEADO
      sessionId: userData?.session_id,
      tmsOriginalRole: userData?.role,
      canSwitchRole: roleMapping.canSwitchRole,
      idCliente: userData?.idCliente,
      clientesAsociados: clientesDeduplicados,
    };
    console.log('[bundleUtils DEBUG] chatBubbleProps:', chatBubbleProps);

    if (debug) {
      console.log('[Chat] ========== DATOS RECIBIDOS DESDE TMS ==========');
      console.log('[Chat] Usuario ID:', userData?.id);
      console.log('[Chat] Nombre:', userData?.name);
      console.log('[Chat] Email:', userData?.email);
      console.log('[Chat] RUT:', userData?.rut);
      console.log('[Chat] Rol Original (TMS):', userData?.role);
      console.log('[Chat] Rol Mapeado:', roleMapping.capinRole);
      console.log('[Chat] Puede Cambiar Rol:', roleMapping.canSwitchRole); // ✅ Log
      console.log('[Chat] Session ID:', userData?.session_id);
      console.log('[Chat] ID Cliente:', userData?.idCliente);
      console.log('[Chat] Clientes Asociados:', clientesDeduplicados?.length || 0);
      console.log('[Chat] ===================================================');
    }

    // 9. Montar React en el Shadow DOM con ChatWidget (incluye botón)
    const ChatWidgetModule = await import('../components/ChatWidget');
    const ChatWidget = ChatWidgetModule.default;
    
    const root = ReactDOM.createRoot(mountPoint);
    root.render(
      React.createElement(
        ShadowRootProvider,
        { shadowRoot, zIndex, children: React.createElement(ChatWidget, chatBubbleProps) }
      )
    );
    
    // VALIDACIÓN POST-RENDER: Verificar que React montó correctamente
    setTimeout(() => {
      const shadowStyle = shadowRoot.querySelector('style[data-chat-styles]');
      const reactMount = shadowRoot.querySelector('#capin-chat-mount');
      const button = shadowRoot.querySelector('button');
      
      if (!shadowStyle) {
        console.error('[Chat] ❌ Estilos NO encontrados');
      }
      
      if (!reactMount || !reactMount.hasChildNodes()) {
        console.error('[Chat] ❌ React NO se montó correctamente');
      } else {
        console.log('[Chat] ✅ Chat inicializado correctamente');
      }
    }, 100);
    
    // Guardar referencia para cleanup
    host.__capinRoot = root;
    host.__capinShadowRoot = shadowRoot;
    
    console.log('[Chat] ✓ Chat montado en Shadow DOM correctamente');

    // 10. Enviar primer mensaje automático
    if (userData) {
      autoBootOnce(userData);
    }

    // 11. Retornar API de control
    return {
      unmount: () => {
        if (debug) console.log('[Chat] Desmontando chat...');
        root.unmount();
        shadowRoot.innerHTML = '';
        delete host.__capinRoot;
        delete host.__capinShadowRoot;
      },
      shadowRoot,
      host,
    };
  } catch (e) {
    console.error('[Chat][Fatal]', e);
    throw e;
  }
};

/**
 * Función para desmontar el chat bubble
 * 
 * Uso: window.CapinChat.unmountChatBubble('capin-chat-root');
 */
export const unmountChatBubble = (containerId = 'capin-chat-root') => {
  const host = document.getElementById(containerId) as HostWithCapinData | null;
  if (!host) {
    console.warn(`[Chat] No se encontró contenedor ${containerId}`);
    return;
  }

  try {
    if (host.__capinRoot) {
      host.__capinRoot.unmount();
      delete host.__capinRoot;
    }

    if (host.__capinShadowRoot) {
      host.__capinShadowRoot.innerHTML = '';
      delete host.__capinShadowRoot;
    }

    console.log('[Chat] ✓ Chat desmontado correctamente');
  } catch (e) {
    console.error('[Chat] Error al desmontar:', e);
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
      mount?: typeof renderChatBubble; // Alias intuitivo
      unmountChatBubble?: typeof unmountChatBubble;
      unmount?: typeof unmountChatBubble; // Alias intuitivo
      autoBootOnce?: typeof autoBootOnce;
    }
    const globalWindow = window as Window & { CapinChat?: CapinChatAPI };

    // Exponer API global para TMS
    if (!globalWindow.CapinChat) {
      globalWindow.CapinChat = {};
    }
    globalWindow.CapinChat.renderChatBubble = renderChatBubble;
    globalWindow.CapinChat.mount = renderChatBubble; // Alias intuitivo
    globalWindow.CapinChat.unmountChatBubble = unmountChatBubble;
    globalWindow.CapinChat.unmount = unmountChatBubble; // Alias intuitivo
    globalWindow.CapinChat.autoBootOnce = autoBootOnce;

    console.log('[Chat] API global configurada: window.CapinChat.mount/unmount disponible');
  }

  // Instalar fallbacks de imágenes
  installImgFallbacks();
};