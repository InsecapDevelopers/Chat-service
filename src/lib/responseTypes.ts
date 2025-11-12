// Tipos extendidos para respuestas con trazabilidad

export interface TraceCandidate {
  id?: string;
  title?: string;
  score?: number;
  source?: string;
}

export interface TraceMeta {
  candidates?: TraceCandidate[];
  tools_called?: string[];
  search_strategy?: string;
  mode?: "guided" | "free";
  disabled_by_flag?: boolean;
}

// Extender ChatApiMeta existente
export interface ExtendedChatApiMeta {
  total_cursos?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
  returned?: number;
  intent?: string;
  citations?: Array<{ id?: string; title?: string | null; url?: string | null }>;
  trace?: TraceMeta; // Nueva: información de trazabilidad
  [k: string]: unknown;
}

// Extender ChatApiResponse existente
export interface ExtendedChatApiResponse {
  answer: string;
  citations?: Array<{ id?: string; title?: string | null; url?: string | null }>;
  usage?: Record<string, unknown>;
  latency_ms?: number | null;
  session_id?: string | null;
  meta?: ExtendedChatApiMeta; // Usar meta extendido
  metadata?: ExtendedChatApiMeta; // Soporte para respuestas con "metadata" en lugar de "meta"
  pagination?: {
    page?: number;
    page_size?: number;
    total_items?: number;
    total_pages?: number;
    has_next?: boolean;
    has_prev?: boolean;
    start_index?: number;
    end_index?: number;
  };
}

// Estado del último payload enviado (para tracking de modo)
export interface LastPayloadState {
  source?: "quick_action" | "chat_input";
  intent?: string;
  mode?: "guided" | "free";
  timestamp?: number;
}