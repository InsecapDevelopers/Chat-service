export type SerializableMessage = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string; // ISO string
  files?: unknown;
  contexts?: Array<{ type: string; identifier: string }>; // ✅ Contextos adjuntos
};

// Función auxiliar para generar UUID con fallback
const generateUUID = (): string => {
  // Intentar usar crypto.randomUUID si está disponible
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: generar UUID v4 manualmente
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const NAMESPACE = 'capin:chat';

export const storageKeys = {
  session: (scope = 'default') => `${NAMESPACE}:session:${scope}`,
  messages: (sessionId: string) => `${NAMESPACE}:messages:${sessionId}`,
};

export function saveMessages(sessionId: string, messages: SerializableMessage[]) {
  try {
    localStorage.setItem(storageKeys.messages(sessionId), JSON.stringify(messages));
  } catch (e) {
    console.warn('No se pudo guardar mensajes en localStorage', e);
  }
}

export function loadMessages(sessionId: string): SerializableMessage[] | null {
  try {
    const raw = localStorage.getItem(storageKeys.messages(sessionId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSessionId(scope: string, sessionId: string) {
  try {
    localStorage.setItem(storageKeys.session(scope), sessionId);
  } catch {
    console.warn('No se pudo guardar la sesión en localStorage');
  }
}

export function loadSessionId(scope: string): string | null {
  try {
    return localStorage.getItem(storageKeys.session(scope));
  } catch {
    return null;
  }
}

export function clearSession(scope: string) {
  try {
    localStorage.removeItem(storageKeys.session(scope));
  } catch {
    console.warn('No se pudo eliminar la sesión de localStorage');
  }
}

export function clearChat(sessionId: string) {
  try {
    const welcomeMsg: SerializableMessage = {
            id: generateUUID(),
            text: "¡Hola! Soy Capin, tu asistente virtual. ¿En qué puedo ayudarte hoy?",
            sender: "assistant",
            timestamp: new Date().toISOString(),
          };
    saveMessages(sessionId, [welcomeMsg]);
  } catch (err) {
    console.warn("No se pudo limpiar el chat:", err);
  }
}