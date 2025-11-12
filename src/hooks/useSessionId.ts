import { useState, useEffect, useCallback } from 'react';

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

export const useSessionId = () => {
  const [sessionId, setSessionId] = useState<string>('');

  // Generar un nuevo session_id usando crypto.randomUUID con fallback
  const generateSessionId = useCallback((): string => {
    const newId = generateUUID();
    return newId;
  }, []);

  // Cargar session_id desde localStorage al montar el hook
  useEffect(() => {
    const storedSessionId = localStorage.getItem('rag_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      // Si no hay session_id, generar uno nuevo
      const newId = generateSessionId();
      localStorage.setItem('rag_session_id', newId);
      setSessionId(newId);
    }
  }, [generateSessionId]);

  // Función para resetear la sesión
  const resetSession = useCallback((): string => {
    const newId = generateSessionId();
    localStorage.setItem('rag_session_id', newId);
    setSessionId(newId);
    return newId;
  }, [generateSessionId]);

  // Función para obtener el session_id actual
  const getCurrentSessionId = useCallback((): string => {
    return sessionId || localStorage.getItem('rag_session_id') || generateSessionId();
  }, [sessionId, generateSessionId]);

  return {
    sessionId,
    resetSession,
    getCurrentSessionId
  };
};