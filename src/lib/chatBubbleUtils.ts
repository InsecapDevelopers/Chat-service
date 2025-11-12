import { UserData } from '@/components/ChatBubble';

// Tipos para las APIs globales
interface WindowWithReact extends Window {
  React?: {
    createElement: (component: unknown, props?: unknown) => unknown;
  };
  ReactDOM?: {
    render: (element: unknown, container: Element) => void;
  };
  initChatWithUser?: (userData: UserData) => void;
  mountChatBubble?: (userData?: UserData) => void;
}

// Variable global para permitir inicialización externa
let chatBubbleInstance: ((userData: UserData) => void) | null = null;

// Función para registrar la instancia del chat
export const registerChatBubbleInstance = (instance: (userData: UserData) => void) => {
  chatBubbleInstance = instance;
};

// Función para limpiar la instancia
export const unregisterChatBubbleInstance = () => {
  chatBubbleInstance = null;
};

// Función global para inicializar desde script externo
export const initChatWithUser = (userData: UserData) => {
  if (chatBubbleInstance) {
    chatBubbleInstance(userData);
  } else {
    console.warn('ChatBubble no está montado. Asegúrate de que el componente esté renderizado.');
  }
};

// Función para montar el chat en el DOM
export const mountChatBubble = (userData?: UserData) => {
  let container = document.getElementById('chat-bubble-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'chat-bubble-container';
    document.body.appendChild(container);
  }

  const windowWithReact = window as WindowWithReact;
  
  // Importación dinámica de React y ReactDOM para evitar dependencias
  if (typeof window !== 'undefined' && windowWithReact.React && windowWithReact.ReactDOM) {
    const React = windowWithReact.React;
    const ReactDOM = windowWithReact.ReactDOM;
    
    // Importar ChatBubble dinámicamente
    import('@/components/ChatBubble').then(({ ChatBubble }) => {
      ReactDOM.render(
        React.createElement(ChatBubble, userData || {}),
        container
      );
    });
  } else {
    console.error('React y ReactDOM deben estar disponibles globalmente para montar el ChatBubble');
  }
};

// Exponer funciones globalmente para uso externo
if (typeof window !== 'undefined') {
  const windowWithReact = window as WindowWithReact;
  windowWithReact.initChatWithUser = initChatWithUser;
  windowWithReact.mountChatBubble = mountChatBubble;
}