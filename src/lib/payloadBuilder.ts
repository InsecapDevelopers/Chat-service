import { TmsActionType } from "@/components/TmsQuickActions";
import { generateTmsPrompt } from "@/lib/tmsPrompts";

type AppRole = "tms" | "publico" | "alumno" | "relator" | "cliente";

// Payload base compartido
interface BasePayload {
  role: string;
  session_id: string;
  tenantId: string;
  user?: Record<string, unknown>;
}

// Payload para modo guided (Quick Actions TMS)
interface GuidedPayload extends BasePayload {
  source: "quick_action";
  intent: "tms.get_r11" | "tms.get_r12" | "tms.get_r61" | "tms.get_bloques";
  codigoCurso: string;
  message: string; // Template generado
}

// Payload para modo free (chat libre)
interface FreePayload extends BasePayload {
  source: "chat_input";
  message: string; // Texto crudo del usuario
  client_hints?: {
    wants_compare: boolean;
  };
}

export type ChatPayload = GuidedPayload | FreePayload;

// Builder para Quick Actions TMS (modo guided) - MANTIENE EXACTITUD
export const buildGuidedPayload = (
  action: TmsActionType,
  codigoCurso: string,
  role: string,
  sessionId: string,
  userPayload?: Record<string, unknown>
): GuidedPayload => {
  const intentMap = {
    R11: "tms.get_r11" as const,
    R12: "tms.get_r12" as const,
    R61: "tms.get_r61" as const,
    BLOQUES: "tms.get_bloques" as const,
  };

  return {
    source: "quick_action",
    intent: intentMap[action],
    codigoCurso,
    role,
    session_id: sessionId,
    tenantId: "insecap",
    message: generateTmsPrompt(codigoCurso, action), // Template actual intacto
    ...(userPayload ? { user: userPayload } : {}),
  };
};

// Builder para chat libre (modo free)
export const buildFreePayload = (
  message: string,
  role: string,
  sessionId: string,
  clientHints?: { wants_compare: boolean },
  userPayload?: Record<string, unknown>
): FreePayload => {
  return {
    source: "chat_input",
    message, // Texto crudo del usuario
    role,
    session_id: sessionId,
    tenantId: "insecap",
    ...(clientHints ? { client_hints: clientHints } : {}),
    ...(userPayload ? { user: userPayload } : {}),
  };
};

// Utilidad para detectar si un payload es guided
export const isGuidedPayload = (payload: ChatPayload): payload is GuidedPayload => {
  return payload.source === "quick_action" && "intent" in payload;
};

// Utilidad para detectar si un payload es free
export const isFreePayload = (payload: ChatPayload): payload is FreePayload => {
  return payload.source === "chat_input";
};