/**
 * Shadow DOM Wrapper para aislar el chat de estilos globales de TMS
 * Mantiene compatibilidad con la API: window.CapinChat.renderChatBubble(userData, mountId)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

/**
 * Detecta si el navegador soporta Shadow DOM
 */
export const supportsShadowDOM = (): boolean => {
  return typeof Element !== 'undefined' && 'attachShadow' in Element.prototype;
};

/**
 * Crea un portal root dentro del Shadow DOM para modales/overlays
 */
export const createPortalRoot = (shadowRoot: ShadowRoot): HTMLElement => {
  const portalRoot = document.createElement('div');
  portalRoot.id = 'capin-portal-root';
  portalRoot.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483640;';
  shadowRoot.appendChild(portalRoot);
  return portalRoot;
};

/**
 * Inyecta estilos CSS dentro del Shadow DOM
 * Prioriza adoptedStyleSheets (moderno) o crea <style> tag como fallback
 */
export const injectStylesIntoShadow = async (
  shadowRoot: ShadowRoot,
  cssContent: string
): Promise<void> => {
  try {
    // Método moderno: Constructable Stylesheets (Chrome 73+, Firefox 101+, Safari 16.4+)
    if ('adoptedStyleSheets' in shadowRoot && typeof CSSStyleSheet !== 'undefined' && 'replace' in CSSStyleSheet.prototype) {
      const sheet = new CSSStyleSheet();
      await sheet.replace(cssContent);
      shadowRoot.adoptedStyleSheets = [sheet];
      console.log('[Chat][Shadow] Estilos inyectados vía adoptedStyleSheets');
      return;
    }
  } catch (e) {
    console.warn('[Chat][Shadow] adoptedStyleSheets falló, usando <style> tag:', e);
  }

  // Fallback: crear tag <style>
  const styleElement = document.createElement('style');
  styleElement.textContent = cssContent;
  styleElement.setAttribute('data-capin-styles', 'true');
  shadowRoot.appendChild(styleElement);
  console.log('[Chat][Shadow] Estilos inyectados vía <style> tag');
};

/**
 * Carga el contenido CSS del bundle
 * En producción, esto se resolverá desde el archivo style.css del bundle
 */
export const loadBundleCSS = async (): Promise<string> => {
  try {
    // Intentar cargar desde la ruta del bundle
    const response = await fetch('/Content/js/Chat/style.css');
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {
    console.warn('[Chat][Shadow] No se pudo cargar style.css desde /Content/js/Chat/:', e);
  }

  // Fallback: si el CSS está inline en el bundle (Vite lo puede hacer)
  // Este valor será reemplazado en build time si configuramos Vite correctamente
  return `/* Fallback: CSS será inyectado aquí por el bundler */`;
};

/**
 * Crea un custom element <capin-chat> con Shadow DOM
 */
export class CapinChatElement extends HTMLElement {
  private shadowRoot: ShadowRoot;
  private portalRoot: HTMLElement;
  private reactRoot: ReactDOM.Root | null = null;

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });
    
    // Crear portal root para overlays
    this.portalRoot = createPortalRoot(this.shadowRoot);
  }

  async connectedCallback() {
    // Los estilos se inyectarán desde renderChatBubble
    console.log('[Chat][Shadow] <capin-chat> elemento conectado');
  }

  disconnectedCallback() {
    if (this.reactRoot) {
      this.reactRoot.unmount();
    }
  }

  getShadowRoot(): ShadowRoot {
    return this.shadowRoot;
  }

  getPortalRoot(): HTMLElement {
    return this.portalRoot;
  }

  setReactRoot(root: ReactDOM.Root) {
    this.reactRoot = root;
  }
}

/**
 * Registra el custom element si no está registrado
 */
export const registerCustomElement = (): void => {
  if (typeof window !== 'undefined' && 'customElements' in window) {
    if (!customElements.get('capin-chat')) {
      customElements.define('capin-chat', CapinChatElement);
      console.log('[Chat][Shadow] Custom element <capin-chat> registrado');
    }
  }
};

/**
 * Contexto para React Portal dentro del Shadow DOM
 */
export interface ShadowDOMContext {
  shadowRoot: ShadowRoot;
  portalRoot: HTMLElement;
}

let shadowDOMContext: ShadowDOMContext | null = null;

export const setShadowDOMContext = (context: ShadowDOMContext | null) => {
  shadowDOMContext = context;
};

export const getShadowDOMContext = (): ShadowDOMContext | null => {
  return shadowDOMContext;
};

/**
 * Crea o obtiene el contenedor host para Shadow DOM
 */
export const getOrCreateShadowHost = (mountId: string): HTMLElement => {
  let host = document.getElementById(mountId);
  
  if (!host) {
    host = document.createElement('div');
    host.id = mountId;
    host.style.cssText = 'position: fixed; bottom: 0; right: 0; z-index: 2147483647; pointer-events: none;';
    document.body.appendChild(host);
  }

  return host;
};

/**
 * Crea un contenedor dentro del Shadow DOM para React
 */
export const createReactContainer = (shadowRoot: ShadowRoot): HTMLElement => {
  const container = document.createElement('div');
  container.id = 'capin-react-root';
  container.className = 'capin'; // Clase root para CSS namespacing
  container.style.cssText = 'pointer-events: auto;';
  
  // Insertar antes del portal root
  const portalRoot = shadowRoot.querySelector('#capin-portal-root');
  if (portalRoot) {
    shadowRoot.insertBefore(container, portalRoot);
  } else {
    shadowRoot.appendChild(container);
  }
  
  return container;
};
