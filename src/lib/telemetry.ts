// Telemetría no disruptiva para conversaciones

interface ChatSendEvent {
  event: "chat_send";
  mode: "guided" | "free";
  source: "quick_action" | "chat_input";
  intent?: string;
  role: string;
  session_id: string;
  timestamp?: number;
}

interface CustomEvent {
  event: string;
  metadata?: Record<string, string | number | boolean>;
  timestamp?: number;
}

// Función para enviar telemetría de chat
export const sendChatTelemetry = (data: Omit<ChatSendEvent, "event" | "timestamp">) => {
  try {
    const telemetryEvent: ChatSendEvent = {
      event: "chat_send",
      timestamp: Date.now(),
      ...data
    };
    
    // Log para debugging (en producción se enviaría a servicio de telemetría)

    
    // Aquí se enviaría a servicio de telemetría real
    // await fetch('/api/telemetry', { method: 'POST', body: JSON.stringify(telemetryEvent) })
  } catch (error) {
    console.warn("Error enviando telemetría:", error);
  }
};

// Función para enviar telemetría de eventos personalizados
export const sendCustomTelemetry = (event: string, metadata?: Record<string, string | number | boolean>) => {
  try {
    const telemetryEvent: CustomEvent = {
      event,
      metadata,
      timestamp: Date.now()
    };
    
    // Log para debugging

    
    // Aquí se enviaría a servicio de telemetría real
    // await fetch('/api/telemetry', { method: 'POST', body: JSON.stringify(telemetryEvent) })
  } catch (error) {
    console.warn("Error enviando telemetría:", error);
  }
};

// Función existente mantenida para compatibilidad
export const sendTelemetry = (event: string, data: Record<string, unknown>) => {
  try {

    // Implementación original mantenida
  } catch (error) {
    console.warn("Error enviando telemetría:", error);
  }
};