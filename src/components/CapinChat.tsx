// src/components/CapinChat.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage, type Message } from "./ChatMessage";
import { ChatInput, type ContextObject } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import {
  clearChat,
  saveMessages,
  loadMessages,
  saveSessionId,
  loadSessionId,
  type SerializableMessage,
} from "@/lib/chatStorage";
import { useAuth } from "@/contexts/AuthContext";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSessionId } from "@/hooks/useSessionId";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SafeButton as Button } from "@/components/ui/safe-button";
import { useToast } from "@/hooks/use-toast";
import { TmsQuickActions, type TmsActionType } from "./TmsQuickActions";
import { AlumnoQuickActions } from "@/features/alumno";
import { CourseCodeModal } from "./CourseCodeModal";
import { generateTmsPrompt } from "@/lib/tmsPrompts";
// ADD: Imports para modo libre
import { ChipModo } from "./ChipModo";
import { DrawerTrace } from "./DrawerTrace";
import { DebugBanner } from "./DebugBanner";
import { useConversationMode, useComparisonHints } from "@/hooks/useConversationMode";
import { buildGuidedPayload, buildFreePayload } from "@/lib/payloadBuilder";
import { sendChatTelemetry } from "@/lib/telemetry";
import { type ExtendedChatApiResponse, type LastPayloadState } from "@/lib/responseTypes";
import { ContactModalIntegration } from "./ContactModalExample";
import { useContact } from "@/hooks/useContact";

type AppRole = "tms" | "publico" | "alumno" | "relator" | "cliente";

interface ChatApiMeta {
  total_cursos?: number;
  page?: number;
  page_size?: number;
  returned?: number;
  citations?: Array<{ id?: string; title?: string | null; url?: string | null }>;
  // ADD: Información de trazabilidad para modo libre
  trace?: {
    candidates?: Array<{ id?: string; title?: string; score?: number; source?: string }>;
    tools_called?: string[];
    search_strategy?: string;
    mode?: "guided" | "free";
    disabled_by_flag?: boolean;
  };
  [k: string]: unknown;
}

interface ChatApiResponse {
  answer: string;
  citations?: Array<{ id?: string; title?: string | null; url?: string | null }>;
  usage?: Record<string, unknown>;
  latency_ms?: number | null;
  session_id?: string | null;
  meta?: ChatApiMeta | null;
}

interface CapinChatProps {
  userRole?: AppRole | string;
  apiEndpoint?: string;
  onError?: (error: string) => void;
  className?: string;
  onClose?: () => void;
  showWelcome?: boolean;
  sessionScope?: string;
  /** Si es true, el usuario puede cambiar de rol (solo Admin) */
  canSwitchRole?: boolean;
  /** Rol original de TMS antes del mapeo */
  tmsOriginalRole?: string;
  /** ID del cliente (para rol cliente) */
  initialIdCliente?: string;
  /** Lista de clientes asociados (para representante empresa) */
  clientesAsociados?: Array<{ idCliente: string; nombre: string }>;
}

// Telemetría opcional (ADD-ONLY)
const sendTelemetry = (event: string, data?: Record<string, unknown>) => {
  try {
    // Solo enviar si hay endpoint de telemetría disponible
    if (typeof window !== 'undefined' && window.fetch) {
      window.fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...data }),
      }).catch(() => {
        // Silenciar errores de telemetría
      });
    }
  } catch {
    // Silenciar errores de telemetría
  }
};

// Helper function to clean answer format (remove "Respuesta:" and "Fuentes:")
const cleanAnswerFormat = (answer: string): string => {
  let cleanAnswer = answer;
  
  // Quitar "Respuesta: " del inicio
  cleanAnswer = cleanAnswer.replace(/^Respuesta:\s*/i, '');
  
  // Quitar sección de "Fuentes:" y todo lo que viene después
  cleanAnswer = cleanAnswer.replace(/\s*Fuentes?:[\s\S]*$/i, '');
  
  // ✅ Quitar todos los "**" (formato markdown de negrita)
  cleanAnswer = cleanAnswer.replace(/\*\*/g, '');
  
  // Limpiar espacios en blanco al final
  cleanAnswer = cleanAnswer.trim();
  
  return cleanAnswer;
};

// ✅ Validación de payload según especificación backend
const validatePayload = (payload: Record<string, unknown>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Campos obligatorios
  if (!payload.message) errors.push("❌ Falta message");
  if (!payload.role) errors.push("❌ Falta role");
  if (!payload.session_id) errors.push("❌ Falta session_id");
  if (!payload.tenantId) errors.push("❌ Falta tenantId");
  
  // Claims obligatorio con RUT para roles específicos
  const role = payload.role as string;
  if (["relator", "alumno", "cliente"].includes(role)) {
    const claims = payload.claims as Record<string, unknown> | undefined;
    if (!claims?.rut) {
      errors.push(`❌ Falta claims.rut para rol ${role}`);
    }
  }
  
  // Si intent=free_mode, DEBE tener objects
  if (payload.intent === "free_mode") {
    const claims = payload.claims as Record<string, unknown> | undefined;
    const objects = claims?.objects as unknown[] | undefined;
    if (!objects || objects.length === 0) {
      // ⚠️ Warning pero no error - el backend puede manejarlo sin objects
      console.warn("⚠️ Intent free_mode sin claims.objects - no habrá enriquecimiento de contexto");
    }
  }
  
  // Source debe ser "quick_action" para botones con intent
  if (payload.intent && payload.intent !== "free_mode" && payload.source !== "quick_action") {
    console.warn("⚠️ Botón con intent específico sin source=quick_action");
  }
  
  if (errors.length > 0) {
    console.error("🚨 VALIDACIÓN DE PAYLOAD FALLÓ:", errors);
    console.error("📦 Payload:", JSON.stringify(payload, null, 2));
    return { valid: false, errors };
  }
  
  console.info("✅ Payload válido:", JSON.stringify(payload, null, 2));
  return { valid: true, errors: [] };
};


export const CapinChat = ({
  apiEndpoint = import.meta.env.VITE_API_ENDPOINT ?? "http://localhost:8000/api/chat",
  onError,
  className = "",
  onClose,
  showWelcome = true,
  sessionScope = "guest",
  canSwitchRole = false,
  tmsOriginalRole,
  initialIdCliente,
  clientesAsociados,
}: CapinChatProps) => {
  console.log('[CapinChat] ========== PROPS RECIBIDAS EN CAPINCHAT ==========');
  console.log('[CapinChat] canSwitchRole:', canSwitchRole);
  console.log('[CapinChat] tmsOriginalRole:', tmsOriginalRole);
  console.log('[CapinChat] initialIdCliente:', initialIdCliente);
  console.log('[CapinChat] clientesAsociados:', clientesAsociados);
  if (clientesAsociados && clientesAsociados.length > 0) {
    console.log('[CapinChat] Total clientes asociados:', clientesAsociados.length);
    clientesAsociados.forEach((c, i) => {
      console.log(`[CapinChat]   ${i + 1}. ${c.nombre} (${c.idCliente})`);
    });
  }
  console.log('[CapinChat] =======================================================');
  
  // Hook para manejo de sesiones
  const { sessionId, resetSession } = useSessionId();
  const { toast } = useToast();
  const { showContactModal } = useContact();
  
  // En modo desarrollo, siempre permitir cambio de roles
  const effectiveCanSwitchRole = import.meta.env.DEV ? true : canSwitchRole;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isResettingSession, setIsResettingSession] = useState(false);

  const [lastMeta, setLastMeta] = useState<ChatApiMeta | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");
  
  // ADD: Estados para tracking de modo libre (NO afecta flujos existentes)
  const [lastPayload, setLastPayload] = useState<{ source?: string; intent?: string; timestamp?: number } | null>(null);
  
  // ADD: Estado para tracking del último intent de cliente (para paginación)
  const [lastClienteIntent, setLastClienteIntent] = useState<{ intent: string; label: string } | null>(null);
  
  // ADD: Estado para tracking del último intent de relator (para paginación)
  const [lastRelatorIntent, setLastRelatorIntent] = useState<{ intent: string; label: string } | null>(null);
  
  // ADD: Estados para debugging de mode mismatch
  const [modeMismatch, setModeMismatch] = useState<{ expected: string; received: string; strategy?: string } | null>(null);

  // ADD: Estados para TMS Quick Actions
  const [isTmsModalOpen, setIsTmsModalOpen] = useState(false);
  const [selectedTmsAction, setSelectedTmsAction] = useState<TmsActionType | null>(null);

  const { user } = useAuth();
  
  // En modo desarrollo, usar datos de administrador mockeados
  const devUser = import.meta.env.DEV ? {
    id: "dev-admin-001",
    name: "Administrador",
    email: "efuenzalida@insecap.cl",
    rut: "21.176.561-5",
    role: "tms" as AppRole,
    claims: {
      id: "dev-admin-001",
      name: "Administrador",
      email: "efuenzalida@insecap.cl",
      rut: "21.176.561-5"
    }
  } : null;
  
  const effectiveUser = devUser || user;
  const initialRole: AppRole = (effectiveUser?.role as AppRole) ?? "publico";

  const [selectedRole, setSelectedRole] = useState<AppRole>(initialRole);
  
  // ADD: Computed - verificar si es rol TMS (incluye "tms" base y "tms:*" con subroles)
  const isTmsRole = selectedRole === 'tms' || selectedRole.startsWith('tms:');
  
  // Debug en desarrollo - DESPUÉS de las declaraciones
  if (import.meta.env.DEV) {
    console.log('🔧 [DEV MODE] User:', user);
    console.log('🔧 [DEV MODE] EffectiveUser:', effectiveUser);
    console.log('🔧 [DEV MODE] InitialRole:', initialRole);
    console.log('🔧 [DEV MODE] SelectedRole:', selectedRole);
    console.log('🔧 [DEV MODE] ShowContactModal:', showContactModal);
  }
  
  // En modo desarrollo, inicializar con datos del usuario admin
  const [rut, setRut] = useState<string>(import.meta.env.DEV ? "21.176.561-5" : "");
  const [idCliente, setIdCliente] = useState<string>(initialIdCliente || "");
  const [correo, setCorreo] = useState<string>(import.meta.env.DEV ? "efuenzalida@insecap.cl" : "");
  const [tmsSubrol, setTmsSubrol] = useState<string>("comercial"); // ADD: Estado para subrol TMS
  
  // ADD: Estado para el cliente seleccionado (representante empresa)
  // Si hay clientesAsociados, usar el primero del array; sino usar initialIdCliente
  const firstClienteId = clientesAsociados && clientesAsociados.length > 0 
    ? clientesAsociados[0].idCliente 
    : (initialIdCliente || "");
  const firstClienteNombre = clientesAsociados && clientesAsociados.length > 0 
    ? clientesAsociados[0].nombre 
    : "";
  
  const [selectedClienteId, setSelectedClienteId] = useState<string>(firstClienteId);
  const [selectedClienteNombre, setSelectedClienteNombre] = useState<string>(firstClienteNombre);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null); // ADD
  const isMobile = useIsMobile(); // ADD
  const [hasShownWelcome, setHasShownWelcome] = useState(false); // Rastrear si se mostró el bienvenido

  
  // ADD: Hook para determinar modo actual
  const conversationMode = useConversationMode({
    lastSource: lastPayload?.source,
    lastIntent: lastPayload?.intent,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // AUTO-BOOT: Escuchar evento de auto-boot desde bundleUtils
  useEffect(() => {
    const handleAutoBootEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const payload = customEvent.detail;
      
      if (!payload || !payload.user) {
        console.warn('[CapinChat] Auto-boot event sin payload válido');
        return;
      }

      const storageKey = `capin:auto_boot_processed:${payload.user.session_id}`;
      if (sessionStorage.getItem(storageKey) === '1') {
        console.log('[CapinChat] Auto-boot ya procesado en esta sesión');
        return;
      }

      console.log('[CapinChat] Procesando auto-boot event:', payload);
      
      // Marcar como procesado para no hacerlo dos veces
      sessionStorage.setItem(storageKey, '1');
      
      // Construir mensaje automático con los datos del usuario
      const user = payload.user;
      const autoBootMessage = `[SYSTEM_BOOT] Usuario: ${user.id}, Email: ${user.email}, Rol: ${user.role}, Session: ${user.session_id}`;
      
      // Enviar el mensaje automático vía handleSendMessage
      // Se ejecutará con un pequeño delay para permitir que el componente esté completamente montado
      setTimeout(() => {
        try {
          // Validar que handleSendMessage está disponible en el contexto
          const messageToSend = JSON.stringify(payload);
          console.log('[CapinChat] Enviando auto-boot message:', messageToSend);
        } catch (e) {
          console.warn('[CapinChat] Error al procesar auto-boot:', e);
        }
      }, 500);
    };

    window.addEventListener('capin:chat:auto_boot', handleAutoBootEvent);
    
    return () => {
      window.removeEventListener('capin:chat:auto_boot', handleAutoBootEvent);
    };
  }, []);

  useEffect(() => {
    const raw = loadMessages(sessionId);
    if (raw && Array.isArray(raw) && raw.length > 0) {
      const hydrated: Message[] = raw.map((m: SerializableMessage) => ({
        ...m,
        timestamp: new Date(m.timestamp),
        files: Array.isArray(m.files) ? (m.files as File[]) : undefined,
        contexts: m.contexts, // ✅ Preservar contextos al hidratar
      }));
      setMessages(hydrated);
    } else if (!hasShownWelcome && showWelcome) {
      // Solo mostrar bienvenido si no se ha mostrado aún
      // Personalizar saludo con nombre del usuario si está disponible
      const userName = user?.displayName || '';
      const greeting = userName 
        ? `¡Hola ${userName}! Soy Capin, tu asistente virtual. ¿En qué puedo ayudarte hoy?`
        : '¡Hola! Soy Capin, tu asistente virtual de Insecap. ¿En qué puedo ayudarte hoy?';
      
      setMessages([
        {
          id: "welcome",
          text: greeting,
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
      setHasShownWelcome(true);
    } else {
      setMessages([]);
    }
  }, [sessionId, showWelcome, hasShownWelcome, user]);

  useEffect(() => {
    const serializable: SerializableMessage[] = messages.map((m) => ({
      id: m.id,
      text: m.text,
      sender: m.sender,
      timestamp: m.timestamp.toISOString(),
      files: m.files,
      contexts: m.contexts, // ✅ Preservar contextos al serializar
    }));
    saveMessages(sessionId, serializable.slice(-100));
  }, [messages, sessionId]);

  // --- Paginación derivada del meta ---
  const page = Number(lastMeta?.pagination?.page ?? lastMeta?.page ?? 0);
  const pageSize = Number(lastMeta?.pagination?.per_page ?? lastMeta?.pagination?.page_size ?? lastMeta?.page_size ?? 0);
  const total = Number(lastMeta?.pagination?.total_items ?? lastMeta?.total_cursos ?? 0);
  const totalPages = useMemo(() => {
    if (!pageSize || !total) return 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [pageSize, total]);

  const hasPagination = totalPages > 1 && page > 0 && pageSize > 0;
  const canPrev = hasPagination && page > 1;
  const canNext = hasPagination && page < totalPages;

  // ADD: Logging para debugging de paginación
  useEffect(() => {
    if (selectedRole === "cliente" && (page > 0 || pageSize > 0 || total > 0)) {
      console.info('[Pagination Calc]', {
        page,
        pageSize,
        total,
        totalPages,
        hasPagination
      });
    }
  }, [page, pageSize, total, totalPages, hasPagination, selectedRole]);

  useEffect(() => {
    if (inputRef.current && (canPrev || canNext)) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [page, canPrev, canNext]);

  const courseCodePattern = /^R-[A-Z]{3}-\d+$/i;
  const renderDisambiguationChips = (citations?: ChatApiResponse["citations"]) => {
    if (!citations || !Array.isArray(citations) || citations.length < 2) return null;
    
    return (
      <div className="flex flex-wrap gap-2 my-3 px-4" aria-label="Opciones de cursos similares">
        <div className="text-xs text-muted-foreground mb-1 w-full">Cursos relacionados:</div>
        {citations.map((c, idx) =>
          c.id ? (
            <button
              key={`${c.id}-${idx}`}
              className="px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 border text-xs transition-colors duration-200 font-medium"
              onClick={() => handleSendMessage(c.id!)}
              aria-label={`Consultar curso ${c.id}`}
              type="button"
            >
              {c.id}
              {c.title && (
                <span className="ml-1 text-muted-foreground">• {c.title.slice(0, 20)}...</span>
              )}
            </button>
          ) : null
        )}
      </div>
    );
  };

  // === API ===
  const callChatAPI = async (
    question: string, 
    pageOverride?: number, 
    contexts?: ContextObject[],
    explicitIntent?: string,
    explicitSource?: string
  ): Promise<ChatApiResponse> => {
    const shouldSendRut =
      (selectedRole === "alumno" || selectedRole === "relator") && rut.trim().length > 0;
    
    // Cliente: 
    // - Modo ADMIN: requiere idCliente, RUT y correo desde inputs
    // - Modo TMS: solo requiere idCliente (email y rut vienen del usuario autenticado)
    const shouldSendClienteClaims =
      selectedRole === "cliente" && 
      (selectedClienteId.trim().length > 0 || idCliente.trim().length > 0) &&
      (!effectiveCanSwitchRole || (rut.trim().length > 0 && correo.trim().length > 0));

    // ✅ Construir claims según el modo:
    // - Modo ADMIN: usar datos de los inputs según el rol
    // - Modo normal: usar datos del usuario autenticado
    let claims: Record<string, string | Array<{ kb: string; identifier: string }>> | undefined;
    
    if (effectiveCanSwitchRole) {
      // MODO ADMIN: Construir claims según el rol seleccionado y los inputs
      if (selectedRole === "publico") {
        // Público: sin claims de usuario específico
        claims = {
          id: effectiveUser?.claims?.id || (effectiveUser as any)?.id || '',
          name: 'Usuario Público',
          email: '',
          rut: ''
        };
      } else if (shouldSendRut) {
        // Alumno/Relator: usar RUT del input
        claims = {
          id: `${selectedRole}-${rut.trim()}`,
          name: `${selectedRole === 'alumno' ? 'Alumno' : 'Relator'} Test`,
          email: '',
          rut: rut.trim()
        };
      } else if (shouldSendClienteClaims) {
        // Cliente: 
        // - Modo ADMIN: usar datos de los inputs (RUT, Email, ID Cliente)
        // - Modo TMS: usar email/RUT del usuario autenticado, ID del select
        const finalIdCliente = selectedClienteId || idCliente.trim();
        
        if (effectiveCanSwitchRole) {
          // Modo ADMIN: usar inputs
          claims = {
            id: finalIdCliente,
            name: selectedClienteNombre || 'Cliente Test',
            email: correo.trim(),
            rut: rut.trim(),
            idCliente: finalIdCliente,
            correo: correo.trim()
          };
        } else {
          // Modo TMS: usar datos del usuario autenticado
          const userEmail = effectiveUser?.claims?.email || (effectiveUser as any)?.email || '';
          const userRut = effectiveUser?.claims?.rut || (effectiveUser as any)?.rut || '';
          claims = {
            id: finalIdCliente,
            name: selectedClienteNombre || 'Cliente Test',
            email: userEmail,
            rut: userRut,
            idCliente: finalIdCliente,
            correo: userEmail
          };
        }
      } else if (selectedRole === "tms") {
        // TMS: usar datos del admin
        claims = {
          id: effectiveUser?.claims?.id || (effectiveUser as any)?.id || '',
          name: effectiveUser?.claims?.name || (effectiveUser as any)?.name || '',
          email: effectiveUser?.claims?.email || (effectiveUser as any)?.email || '',
          rut: effectiveUser?.claims?.rut || (effectiveUser as any)?.rut || ''
        };
      } else {
        // Otros roles: datos básicos
        claims = {
          id: effectiveUser?.claims?.id || (effectiveUser as any)?.id || '',
          name: effectiveUser?.claims?.name || (effectiveUser as any)?.name || '',
          email: effectiveUser?.claims?.email || (effectiveUser as any)?.email || '',
          rut: effectiveUser?.claims?.rut || (effectiveUser as any)?.rut || ''
        };
      }
    } else {
      // MODO NORMAL (EMBEBIDO): usar datos del usuario autenticado
      claims = {
        id: effectiveUser?.claims?.id || (effectiveUser as any)?.sub || (effectiveUser as any)?.id || '',
        name: effectiveUser?.claims?.name || (effectiveUser as any)?.displayName || (effectiveUser as any)?.name || '',
        email: effectiveUser?.claims?.email || (effectiveUser as any)?.email || '',
        rut: effectiveUser?.claims?.rut || (effectiveUser as any)?.tenantId || (effectiveUser as any)?.rut || '',
      };
      
      // Sobrescribir con datos de inputs si están disponibles
      if (shouldSendRut && rut.trim()) {
        claims.rut = rut.trim();
      } else if (shouldSendClienteClaims) {
        claims = { 
          ...claims,
          rut: rut.trim(), 
          idCliente: idCliente.trim(), 
          correo: correo.trim() 
        };
      }
    }

    // ✅ Agregar objects de contexto a claims si existen
    if (contexts && contexts.length > 0) {
      const objects = contexts.map(ctx => ({
        kb: ctx.type,           // ✅ Cambiar 'type' a 'kb' según especificación backend
        identifier: ctx.identifier
      }));
      
      claims = {
        ...(claims || {}),
        objects
      };
    } else if (selectedRole === "relator" || selectedRole === "alumno") {
      // ✅ Auto-agregar object del usuario para enriquecimiento automático en free_mode
      // Solo si tiene RUT disponible
      const userRut = claims.rut as string;
      if (userRut && userRut.trim()) {
        const kbType = selectedRole === "relator" ? "kb_relator" : "kb_participante";
        claims = {
          ...(claims || {}),
          objects: [{
            kb: kbType,
            identifier: userRut
          }]
        };
      }
    }

    // ADD: Filtros de paginación para cliente
    let filters: Record<string, number> | undefined;
    if (selectedRole === "cliente") {
      const currentPage = pageOverride || page || 1;
      const currentPageSize = pageSize || 10;
      filters = {
        page: currentPage,
        page_size: currentPageSize
      };
    }

    // ADD: Determinar el rol final a enviar al backend
    const finalRole = selectedRole === "tms" ? `tms:${tmsSubrol}` : selectedRole;

    // Log para debugging del RAG backend


    // ADD: Verificación explícita de payload para debugging
    // ✅ Usar explicitSource/explicitIntent si se pasaron, sino usar lastPayload
    const payloadSource = explicitSource || lastPayload?.source || "chat_input";
    const payloadIntent = explicitIntent || lastPayload?.intent;
    
    // ✅ Determinar intent: si viene de chat_input y no hay intent previo, usar free_mode
    const isFromQuickAction = payloadSource === "quick_action";
    const effectiveIntent = isFromQuickAction && payloadIntent ? payloadIntent : "free_mode";
    
    const modeCandidate = effectiveIntent && effectiveIntent !== "free_mode" ? "guided" : "free";
    
    // ADD: Log explícito para verificación front↔backend
    console.info(`[PAYLOAD VERIFICATION] modeCandidate: ${modeCandidate}, source: ${payloadSource}, intent: ${effectiveIntent || 'undefined'}, role: ${finalRole}, session_id: ${sessionId}, contexts: ${contexts?.length || 0}`);

    // ✅ Construir payload completo
    const payload = {
      message: question,
      role: finalRole,
      session_id: sessionId,
      tenantId: "insecap",
      source: payloadSource,
      ...(effectiveIntent ? { intent: effectiveIntent } : {}),
      claims: claims,
      ...(filters ? { filters } : {}),
    };

    // ✅ Validar payload antes de enviar
    const validation = validatePayload(payload);
    if (!validation.valid) {
      throw new Error(`Payload inválido: ${validation.errors.join(', ')}`);
    }

    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} - ${text}`);
    }
    const data = (await res.json()) as ChatApiResponse;
    
    return data;
  };

  const handleClearChat = () => {
    const ok = confirm("¿Borrar toda la conversación?");
    if (!ok) return;
    if (sessionId) clearChat(sessionId);
    setMessages([
      {
        id: "welcome",
        text: "¡Hola! Soy Capin, tu asistente virtual. ¿En qué puedo ayudarte hoy?",
        sender: "assistant",
        timestamp: new Date(),
      },
    ]);
    setLastMeta(null);
    setLastQuery("");
  };

  // ADD: Función para cambiar sesión
  const handleResetSession = async () => {
    setIsResettingSession(true);
    
    try {
      // Generar nuevo session_id
      const newSessionId = resetSession();
      
      // Limpiar historial visual (pero NO el backend)
      setMessages([
        {
          id: "welcome",
          text: "¡Hola! Soy Capin, tu asistente virtual. ¿En qué puedo ayudarte hoy?",
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
      setLastMeta(null);
      setLastQuery("");
      
      // Mostrar toast informativo
      toast({
        title: "Sesión cambiada",
        description: `Nueva sesión: ${newSessionId.slice(0, 8)}... Los próximos 8 mensajes usarán contexto limpio.`,
        duration: 3000,
      });
      

      
    } catch (error) {
      console.error("Error al cambiar sesión:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar la sesión. Intenta de nuevo.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      // Deshabilitar input por 200ms para evitar dobles envíos
      setTimeout(() => {
        setIsResettingSession(false);
      }, 200);
    }
  };

  // ADD: Handlers para TMS Quick Actions
  const handleTmsActionClick = (action: TmsActionType) => {
    setSelectedTmsAction(action);
    setIsTmsModalOpen(true);
  };

  const handleTmsConfirm = async (codigoCurso: string, tipo: TmsActionType) => {
    // Para R11, usar el patrón de payload estructurado con target
    if (tipo === 'R11') {
      const payload = {
        source: "quick_action",
        intent: "tms.get_r11",
        message: "Necesito información del R11 del curso",
        target: {
          codigoCurso: codigoCurso
        }
      };
      
      await handleAdditionalActionSend(payload);
      return;
    }
    
    // Para otros tipos (R12, R24, etc.), mantener comportamiento existente
    // MANTENER EXACTO: Generar prompt usando función existente
    const explicitPrompt = generateTmsPrompt(codigoCurso, tipo);
    
    // ADD: Tracking para modo guided (NO cambia el comportamiento)
    setLastPayload({
      source: "quick_action",
      intent: `tms.get_${tipo.toLowerCase()}`,
      timestamp: Date.now(),
    });
    
    // ADD: Telemetría no disruptiva
    sendChatTelemetry({
      mode: "guided",
      source: "quick_action",
      intent: `tms.get_${tipo.toLowerCase()}`,
      role: selectedRole,
      session_id: sessionId,
    });
    
    // Log para debugging

    
    // MANTENER EXACTO: Enviar el mensaje con el prompt explícito generado (sin cambios)
    await handleSendMessage(`Consultar ${tipo}: ${codigoCurso}`, explicitPrompt);
  };

  // ADD: Manejador para acciones adicionales (RelatorQuickAction)
  const handleAdditionalActionSend = async (payload: {
    source: string;
    intent: string;
    message: string;
    target?: { rut?: string; nombre?: string; codigoComer?: string; codigoCotizacion?: string; pkCotizacion?: string; codigoCurso?: string };
  }) => {
    try {
      // Tracking para modo guided
      setLastPayload({
        source: payload.source,
        intent: payload.intent,
        timestamp: Date.now(),
      });

      // Telemetría
      sendChatTelemetry({
        mode: "guided",
        source: payload.source as "quick_action",
        intent: payload.intent,
        role: selectedRole,
        session_id: sessionId,
      });

      // Log para debugging


      // Construir mensaje descriptivo para el chat
      let displayMessage = payload.message;
      if (payload.intent === "tms.find_relator") {
        if (payload.target?.rut) {
          displayMessage = `Buscar relator con RUT: ${payload.target.rut}`;
        } else if (payload.target?.nombre) {
          displayMessage = `Buscar relator con nombre: ${payload.target.nombre}`;
        }
      } else if (payload.intent === "tms.get_costos") {
        if (payload.target?.codigoComer) {
          displayMessage = `Consultar costos para: ${payload.target.codigoComer}`;
        }
      } else if (payload.intent === "tms.get_r11") {
        if (payload.target?.codigoCurso) {
          displayMessage = `Consultar R11 del curso: ${payload.target.codigoCurso}`;
        }
      } else if (payload.intent === "tms.get_recursos_curso") {
        if (payload.target?.codigoComer) {
          displayMessage = `Consultar material del curso: ${payload.target.codigoComer}`;
        }
      } else if (payload.intent === "publico.get_comercial_turno") {
        displayMessage = "¿Quién es el comercial de turno?";
      }

      // Agregar mensaje del usuario al chat
      const userMessage: Message = {
        id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
        text: displayMessage,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setIsTyping(true);

      // Log para debugging - payload exacto
      console.info('[Additional Action payload]', payload);

      // Construir claims para cliente
      // Construir claims para cliente si aplica
      const shouldSendClienteClaims = 
        selectedRole === "cliente" && 
        rut.trim().length > 0 && 
        idCliente.trim().length > 0 && 
        correo.trim().length > 0;

      // ✅ Construir claims siempre con datos del usuario autenticado
      const payloadClaims = {
        id: effectiveUser?.claims?.id || (effectiveUser as any)?.sub || '',
        name: effectiveUser?.claims?.name || (effectiveUser as any)?.displayName || '',
        email: effectiveUser?.claims?.email || (effectiveUser as any)?.email || '',
        rut: effectiveUser?.claims?.rut || (effectiveUser as any)?.tenantId || '',
        // Agregar claims adicionales de cliente si aplican
        ...(shouldSendClienteClaims ? {
          idCliente: idCliente.trim(),
          correo: correo.trim()
        } : {})
      };

      // Construir payload completo según especificación backend
      const fullPayload = {
        message: payload.message,
        role: selectedRole === "tms" ? `tms:${tmsSubrol}` : (selectedRole ?? "tms:logistica"),
        session_id: sessionId,
        tenantId: "insecap",
        source: payload.source,
        intent: payload.intent,
        ...(payload.target ? { target: payload.target } : {}),
        claims: payloadClaims,
      } as const;

      // ✅ Validar payload antes de enviar
      const validation = validatePayload(fullPayload as Record<string, unknown>);
      if (!validation.valid) {
        throw new Error(`Payload inválido: ${validation.errors.join(', ')}`);
      }

      // Enviar directamente al API endpoint
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ExtendedChatApiResponse = await response.json();

      // Limpiar formato de respuesta (quitar "Respuesta:" y "Fuentes:")
      let cleanAnswer = data.answer;
      
      // Quitar "Respuesta: " del inicio
      cleanAnswer = cleanAnswer.replace(/^Respuesta:\s*/i, '');
      
      // Quitar sección de "Fuentes:" y todo lo que viene después
      cleanAnswer = cleanAnswer.replace(/\s*Fuentes?:[\s\S]*$/i, '');
      
      // Limpiar espacios en blanco al final
      cleanAnswer = cleanAnswer.trim();

      // Procesar respuesta igual que en callChatAPI
      const assistantMessage: Message = {
        id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}-assistant`,
        text: cleanAnswer,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLastMeta(data.meta);

      // Log para debugging del modo


      // Banner de depuración para intent deshabilitado
      if (data.meta?.trace?.mode === "guided" && data.meta?.trace?.disabled_by_flag === true) {
        toast({
          title: "Intent deshabilitado",
          description: `Intent ${payload.intent} deshabilitado por el servidor`,
          variant: "default",
        });
      }

    } catch (error) {
      console.error("Error en acción adicional:", error);
      
      // Para errores 422 o 404, generar datos de demostración
      if (error instanceof Error && (error.message.includes('422') || error.message.includes('404'))) {
        const demoResponse = payload.intent === "tms.find_relator"
      } else {
        toast({
          title: "Error",
          description: "No se pudo procesar la acción. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsTyping(false);
    }
  };

  // ADD: Handler específico para Quick Actions de Alumno
  const handleAlumnoActionClick = async (intent: string, question: string) => {
    try {
      // Tracking para modo guided
      setLastPayload({
        source: "quick_action",
        intent: intent,
        timestamp: Date.now(),
      });

      // Telemetría
      sendChatTelemetry({
        mode: "guided",
        source: "quick_action",
        intent: intent,
        role: selectedRole,
        session_id: sessionId,
      });

      // Agregar mensaje del usuario al chat
      const userMessage: Message = {
        id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
        text: question,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setIsTyping(true);

      // Construir payload con estructura específica según especificación backend
      const fullPayload = {
        message: question,
        role: selectedRole,
        session_id: sessionId,
        tenantId: "insecap",
        source: "quick_action",
        intent: intent,
        claims: {
          id: effectiveUser?.claims?.id || (effectiveUser as any)?.sub || '',
          name: effectiveUser?.claims?.name || (effectiveUser as any)?.displayName || '',
          email: effectiveUser?.claims?.email || (effectiveUser as any)?.email || '',
          rut: effectiveUser?.claims?.rut ?? (effectiveUser as any)?.sub ?? rut,
        }
      };

      console.info('[Alumno Action payload]', fullPayload);

      // ✅ Validar payload antes de enviar
      const validation = validatePayload(fullPayload);
      if (!validation.valid) {
        throw new Error(`Payload inválido: ${validation.errors.join(', ')}`);
      }

      // Enviar al API endpoint
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ExtendedChatApiResponse = await response.json();

      // Limpiar formato de respuesta
      let cleanAnswer = data.answer;
      cleanAnswer = cleanAnswer.replace(/^Respuesta:\s*/i, '');
      cleanAnswer = cleanAnswer.replace(/\s*Fuentes?:[\s\S]*$/i, '');
      cleanAnswer = cleanAnswer.trim();

      // Agregar respuesta del asistente
      const assistantMessage: Message = {
        id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}-assistant`,
        text: cleanAnswer,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLastMeta(data.meta);

      // Banner de depuración para intent deshabilitado
      if (data.meta?.trace?.mode === "guided" && data.meta?.trace?.disabled_by_flag === true) {
        toast({
          title: "Intent deshabilitado",
          description: `Intent ${intent} deshabilitado por el servidor`,
          variant: "default",
        });
      }

    } catch (error) {
      console.error("Error en acción de alumno:", error);
      
      toast({
        title: "Error",
        description: "No se pudo procesar la acción. Inténtalo de nuevo.",
        variant: "destructive",
      });
      
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}-error`,
        text: "Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.",
        sender: "assistant",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ADD: Handler para selección de relator desde resultados clickeables
  const handleRelatorSelect = async (rut: string) => {

    
    // Crear payload para búsqueda por RUT
    const payload = {
      source: "relator_result_click",
      intent: "tms.find_relator",
      message: "Relator search",
      target: { rut }
    };
    
    // Tracking para modo guided
    setLastPayload({
      source: payload.source,
      intent: payload.intent,
      timestamp: Date.now(),
    });
    
    // Telemetría
    sendChatTelemetry({
      mode: "guided",
      source: payload.source as "quick_action",
      intent: payload.intent,
      role: selectedRole,
      session_id: sessionId,
    });
    
    // Enviar búsqueda automática
    await handleAdditionalActionSend(payload);
  };

  const handleParticipanteSelect = async (rut: string) => {
    // Crear payload para búsqueda por RUT
    const payload = {
      source: "participante_result_click",
      intent: "tms.find_participante",
      message: "Participante search",
      target: { rut }
    };
    
    // Tracking para modo guided
    setLastPayload({
      source: payload.source,
      intent: payload.intent,
      timestamp: Date.now(),
    });
    
    // Telemetría
    sendChatTelemetry({
      mode: "guided",
      source: payload.source as "quick_action",
      intent: payload.intent,
      role: selectedRole,
      session_id: sessionId,
    });
    
    // Enviar búsqueda automática
    await handleAdditionalActionSend(payload);
  };

  const handleRelatorIntentRequest = async (intent: string, label: string, pageOverride?: number) => {
    // Agregar mensaje del usuario al chat
    const userMessage: Message = {
      id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      text: pageOverride ? `${label} - Página ${pageOverride}` : label,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsTyping(true);

    // Tracking para modo guided con paginación
    setLastPayload({
      source: "quick_action",
      intent: intent,
      timestamp: Date.now(),
    });

    // Guardar intent de relator para paginación
    setLastRelatorIntent({ intent, label });
    
    // Telemetría
    sendChatTelemetry({
      mode: "guided",
      source: "quick_action",
      intent: intent,
      role: selectedRole,
      session_id: sessionId,
    });

    try {
      // Determinar la página actual
      const currentPage = pageOverride || 1;
      const currentPageSize = 20; // Default según backend
      
      // Construir claims según el modo (solo RUT necesario)
      const relatorRut = effectiveCanSwitchRole && selectedRole === "relator" 
        ? rut.trim() 
        : effectiveUser?.claims?.rut || (effectiveUser as any)?.rut || '';

      const fullPayload = {
        intent: intent,
        message: pageOverride ? `Ver página ${pageOverride}` : label,
        role: "relator",
        session_id: sessionId,
        tenantId: "insecap",
        source: "quick_action",
        claims: {
          rut: relatorRut
        },
        target: {
          page: currentPage,
          per_page: currentPageSize
        }
      };

      console.info('[Relator Intent Payload]', fullPayload);

      // Enviar al API endpoint
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.info('[Relator Intent Response]', data);
      console.info('[Relator Intent Response - Meta]', data.meta);
      console.info('[Relator Intent Response - Pagination]', data.meta?.pagination);
      
      // Actualizar metadata de paginación si existe
      if (data.meta) {
        setLastMeta(data.meta);
        console.info('[Updated lastMeta]', data.meta);
      }
      
      // Procesar respuesta
      const assistantMessage: Message = {
        id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
        text: data.answer || data.response || "No se recibió respuesta del servidor.",
        sender: "assistant",
        timestamp: new Date(),
        trace: data.trace,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("❌ Error en intent de relator:", error);
      
      // Mostrar detalles del error si es un error de red
      let errorText = "Lo siento, ocurrió un error al procesar tu solicitud.";
      if (error instanceof Error) {
        errorText += ` (${error.message})`;
      }
      
      const errorMessage: Message = {
        id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
        text: errorText,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClienteIntentRequest = async (intent: string, label: string, pageOverride?: number) => {
    // Agregar mensaje del usuario al chat
    const userMessage: Message = {
      id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      text: pageOverride ? `${label} - Página ${pageOverride}` : label,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsTyping(true);

    // Tracking para modo guided
    setLastPayload({
      source: "quick_action",
      intent: intent,
      timestamp: Date.now(),
    });
    
    // Telemetría
    sendChatTelemetry({
      mode: "guided",
      source: "quick_action",
      intent: intent,
      role: selectedRole,
      session_id: sessionId,
    });

    try {
      // Construir payload según especificación del backend
      const clienteIdNum = parseInt(idCliente) || 0;
      
      // Determinar la página actual
      const currentPage = pageOverride || 1;
      const currentPageSize = 10; // Default page size
      
      const fullPayload = {
        message: label,
        role: "cliente",
        session_id: sessionId,
        tenantId: "insecap",
        source: "quick_action",
        intent: intent,
        claims: {
          id: effectiveCanSwitchRole ? idCliente.trim() : (effectiveUser?.claims?.id || (effectiveUser as any)?.sub || ''),
          name: effectiveCanSwitchRole ? selectedClienteNombre || 'Cliente Test' : (effectiveUser?.claims?.name || (effectiveUser as any)?.displayName || ''),
          email: effectiveCanSwitchRole ? correo.trim() : (effectiveUser?.claims?.email || (effectiveUser as any)?.email || correo.trim()),
          rut: effectiveCanSwitchRole ? rut.trim() : (effectiveUser?.claims?.rut || (effectiveUser as any)?.rut || rut.trim()),
          idCliente: idCliente.trim(),
          correo: effectiveCanSwitchRole ? correo.trim() : (effectiveUser?.claims?.email || (effectiveUser as any)?.email || correo.trim())
        },
        filters: {
          cliente_id: idCliente,
          page: currentPage,
          page_size: currentPageSize
        }
      };

      console.info('[Cliente Intent Payload]', fullPayload);

      // ✅ Validar payload antes de enviar
      const validation = validatePayload(fullPayload);
      if (!validation.valid) {
        throw new Error(`Payload inválido: ${validation.errors.join(', ')}`);
      }
      // Enviar al API endpoint
      console.info('[Cliente Intent] Enviando payload a:', apiEndpoint);
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload),
      });

      console.info('[Cliente Intent] Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.info('[Cliente Intent] Parsing JSON response...');
      const data: ExtendedChatApiResponse = await response.json();

      console.info('[Cliente Intent Response Raw]', JSON.stringify(data, null, 2));
      console.info('[Cliente Intent] Response keys:', Object.keys(data));
      console.info('[Cliente Intent] Has pagination field:', !!data.pagination);

      // Guardar metadata para paginación (soportar tanto "metadata" como "meta")
      const responseMetadata = data.metadata || data.meta;
      
      // Construir el objeto de meta que incluya pagination
      const metaToStore = {
        ...(responseMetadata || {}),
        // Si hay pagination como campo raíz, incluirla
        ...(data.pagination ? { pagination: data.pagination } : {})
      };
      
      console.info('[Cliente Intent Pagination Check]', {
        hasMetadata: !!responseMetadata,
        hasPaginationField: !!data.pagination,
        metaToStore: metaToStore,
        paginationValue: data.pagination
      });
      
      if (Object.keys(metaToStore).length > 0) {
        setLastMeta(metaToStore);
        console.info('[Cliente Intent Metadata - Stored]', metaToStore);
      }

      // Guardar el último intent para paginación
      setLastClienteIntent({ intent, label });

      // Limpiar formato de respuesta
      let cleanAnswer = data.answer;
      cleanAnswer = cleanAnswer.replace(/^Respuesta:\s*/i, '');
      cleanAnswer = cleanAnswer.replace(/\s*Fuentes?:[\s\S]*$/i, '');
      cleanAnswer = cleanAnswer.trim();

      // Procesar respuesta
      const assistantMessage: Message = {
        id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}-assistant`,
        text: cleanAnswer,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);

    } catch (error) {
      console.error("Error en cliente intent request:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}-error`,
        text: `Error al procesar la solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleDiplomaRequest = async (rut: string) => {
    // Crear payload para consulta de diploma
    const payload = {
      source: "quick_action",
      intent: "cliente.get_diploma",
      message: "Consultar Diploma",
      target: { rut }
    };
    
    // Tracking para modo guided
    setLastPayload({
      source: payload.source,
      intent: payload.intent,
      timestamp: Date.now(),
    });
    
    // Telemetría
    sendChatTelemetry({
      mode: "guided",
      source: payload.source as "quick_action",
      intent: payload.intent,
      role: selectedRole,
      session_id: sessionId,
    });
    
    // Enviar búsqueda automática
    await handleAdditionalActionSend(payload);
  };

  // Handler para consulta de Material (Recurso de aprendizaje)
  const handleMaterialRequest = async (codigoCurso: string) => {
    // Crear payload para consulta de recursos del curso
    const payload = {
      source: "quick_action",
      intent: "tms.get_recursos_curso",
      message: `Necesito el material del curso ${codigoCurso}`,
      target: { codigoComer: codigoCurso }
    };
    
    // Enviar búsqueda automática usando handleAdditionalActionSend
    await handleAdditionalActionSend(payload);
  };

  // Handler para consulta de Comercial de Turno
  const handleComercialTurnoRequest = async () => {
    // Crear payload para consulta de comercial de turno
    const payload = {
      source: "quick_action",
      intent: "publico.get_comercial_turno",
      message: "¿Quién es el comercial de turno?",
    };
    
    // Enviar búsqueda automática usando handleAdditionalActionSend
    await handleAdditionalActionSend(payload);
  };

  // ADD: Atajo de teclado Ctrl+K para R11
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k' && isTmsRole) {
        e.preventDefault();
        handleTmsActionClick('R11');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTmsRole]);

  const handleSendMessage = async (display: string, actual?: string, contexts?: ContextObject[]) => {
    const visibleText = display?.trim();
    const promptToSend = (actual ?? display)?.trim();
    
    // VALIDACIÓN ESTRICTA: No permitir mensajes vacíos o solo espacios
    if (!visibleText || visibleText.length === 0 || !promptToSend || promptToSend.length === 0) {
      console.warn('[handleSendMessage] Mensaje vacío bloqueado');
      return;
    }

    // ADD: Detectar si NO viene de Quick Action (modo libre)
    const isFromQuickAction = lastPayload?.source === "quick_action" && 
                             Date.now() - (lastPayload.timestamp || 0) < 1000; // 1 segundo de gracia
    
    if (!isFromQuickAction) {
      // ADD: Tracking para modo libre
      setLastPayload({
        source: "chat_input",
        intent: undefined,
        timestamp: Date.now(),
      });
      
      // ADD: Detectar hints de comparación (lógica inline)
      const compareKeywords = [
        "comparar", "versus", "vs", "mejor entre", "diferencia entre", 
        "cuál es mejor", "comparación", "diferencias", "similitudes"
      ];
      const lowerMessage = promptToSend.toLowerCase();
      const wants_compare = compareKeywords.some(keyword => 
        lowerMessage.includes(keyword)
      );
      const comparisonHints = { wants_compare };
      
      // ADD: Telemetría para modo libre
      sendChatTelemetry({
        mode: "free",
        source: "chat_input",
        role: selectedRole,
        session_id: sessionId,
        ...(comparisonHints.wants_compare ? { client_hints: comparisonHints } : {}),
      });
    }

    // Validar que los campos requeridos estén completos para el rol cliente
    if (selectedRole === "cliente") {
      if (!rut.trim() || !idCliente.trim() || !correo.trim()) {
        alert("Por favor completa todos los campos requeridos: RUT, ID Cliente y Email");
        return;
      }
      
      // ADD: Interceptar comandos de paginación para cliente
      const pageCommand = promptToSend.toLowerCase();
      
      // Detectar "página X", "siguiente", "anterior"
      const pageMatch = pageCommand.match(/^página?\s*(\d+)$/);
      if (pageMatch) {
        const targetPage = parseInt(pageMatch[1]);
        if (targetPage > 0 && hasPagination && targetPage <= totalPages) {
          sendTelemetry("page_nav", { 
            page: targetPage, 
            total_pages: totalPages,
            session_scope: sessionScope 
          });
          
          // Si hay un último intent, usarlo para paginar
          if (lastRelatorIntent) {
            handleRelatorIntentRequest(lastRelatorIntent.intent, lastRelatorIntent.label, targetPage);
          } else if (lastClienteIntent) {
            handleClienteIntentRequest(lastClienteIntent.intent, lastClienteIntent.label, targetPage);
          } else {
            // Fallback a query normal
            const display = `→ Página ${targetPage}`;
            const internal = lastQuery || "Muéstrame todos mis cursos activos y pasados como cliente";
            setLastQuery(internal);
            
            const userMessage: Message = {
              id: Date.now().toString(),
              text: display,
              sender: "user",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMessage]);
            setIsTyping(true);
            
            try {
              const data = await callChatAPI(internal, targetPage);
              setLastMeta(data.meta ?? null);
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: cleanAnswerFormat(data.answer ?? ""),
                sender: "assistant", 
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, assistantMessage]);
            } catch (error) {
              setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "Lo siento, ocurrió un problema al contactar al servicio. Intenta nuevamente.",
                sender: "assistant",
                timestamp: new Date(),
              }]);
            } finally {
              setIsTyping(false);
            }
          }
          return;
        }
      }
      
      if (pageCommand === "siguiente" && canNext) {
        sendTelemetry("page_nav", { 
          page: page + 1, 
          total_pages: totalPages,
          session_scope: sessionScope 
        });
        
        // Si hay un último intent, usarlo para paginar
        if (lastRelatorIntent) {
          handleRelatorIntentRequest(lastRelatorIntent.intent, lastRelatorIntent.label, page + 1);
        } else if (lastClienteIntent) {
          handleClienteIntentRequest(lastClienteIntent.intent, lastClienteIntent.label, page + 1);
        } else {
          // Fallback a query normal
          const display = `→ Página ${page + 1}`;
          const internal = lastQuery || "Muéstrame todos mis cursos activos y pasados como cliente";
          
          setLastQuery(internal);
          const userMessage: Message = {
            id: Date.now().toString(),
            text: display,
            sender: "user",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, userMessage]);
          setIsTyping(true);
          
          try {
            const data = await callChatAPI(internal, page + 1);
            setLastMeta(data.meta ?? null);
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              text: cleanAnswerFormat(data.answer ?? ""),
              sender: "assistant",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
          } catch (error) {
            setMessages((prev) => [...prev, {
              id: (Date.now() + 1).toString(),
              text: "Lo siento, ocurrió un problema al contactar al servicio. Intenta nuevamente.",
              sender: "assistant",
              timestamp: new Date(),
            }]);
          } finally {
            setIsTyping(false);
          }
        }
        return;
      }
      
      if (pageCommand === "anterior" && canPrev) {
        sendTelemetry("page_nav", { 
          page: page - 1, 
          total_pages: totalPages,
          session_scope: sessionScope 
        });
        
        // Si hay un último intent, usarlo para paginar
        if (lastRelatorIntent) {
          handleRelatorIntentRequest(lastRelatorIntent.intent, lastRelatorIntent.label, page - 1);
        } else if (lastClienteIntent) {
          handleClienteIntentRequest(lastClienteIntent.intent, lastClienteIntent.label, page - 1);
        } else {
          // Fallback a query normal
          const display = `→ Página ${page - 1}`;
          const internal = lastQuery || "Muéstrame todos mis cursos activos y pasados como cliente";
          
          setLastQuery(internal);
          const userMessage: Message = {
            id: Date.now().toString(),
            text: display,
            sender: "user",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, userMessage]);
          setIsTyping(true);
          
          try {
            const data = await callChatAPI(internal, page - 1);
            setLastMeta(data.meta ?? null);
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              text: cleanAnswerFormat(data.answer ?? ""),
              sender: "assistant",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
          } catch (error) {
            setMessages((prev) => [...prev, {
              id: (Date.now() + 1).toString(),
              text: "Lo siento, ocurrió un problema al contactar al servicio. Intenta nuevamente.",
              sender: "assistant",
              timestamp: new Date(),
            }]);
          } finally {
            setIsTyping(false);
          }
        }
        return;
      }
    }

    if (courseCodePattern.test(visibleText)) {
      sendTelemetry("course_code_query", { 
        pattern: "course_code",
        session_scope: sessionScope 
      });
    }

    setLastQuery(promptToSend);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: visibleText,
      sender: "user",
      timestamp: new Date(),
      // ✅ Incluir contextos si existen
      ...(contexts && contexts.length > 0 ? { 
        contexts: contexts.map(ctx => ({ 
          type: ctx.type, 
          identifier: ctx.identifier 
        })) 
      } : {}),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // ✅ Pasar intent y source explícitos si vienen de quick action
      const explicitIntent = isFromQuickAction ? lastPayload?.intent : undefined;
      const explicitSource = isFromQuickAction ? lastPayload?.source : undefined;
      
      const data = await callChatAPI(
        promptToSend, 
        undefined, 
        contexts, 
        explicitIntent, 
        explicitSource
      ); // ✅ Pasar contextos e intent/source

      console.info('[handleSendMessage] Response received:', {
        answerLength: data.answer?.length || 0,
        answerPreview: data.answer?.substring(0, 100),
        hasMeta: !!data.meta,
        citations: data.citations?.length || 0
      });

      setLastMeta(data.meta ?? null);
      
      // ADD: Detectar mode mismatch para UI debugging
      const expectedMode = lastPayload?.intent ? "guided" : "free";
      const responseMode = data.meta?.trace?.mode;
      if (responseMode && responseMode !== expectedMode) {
        setModeMismatch({
          expected: expectedMode,
          received: responseMode,
          strategy: data.meta?.trace?.search_strategy
        });
        // Auto-clear después de 10 segundos
        setTimeout(() => setModeMismatch(null), 10000);
      } else {
        setModeMismatch(null);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: cleanAnswerFormat(data.answer ?? ""),
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Lo siento, ocurrió un problema al contactar al servicio. Intenta nuevamente.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
      onError?.(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsTyping(false);
    }
  };

  const goToPage = (n: number) => {
    if (!n || n < 1 || (hasPagination && n > totalPages)) return;
    sendTelemetry("page_nav", { 
      page: n, 
      total_pages: totalPages,
      session_scope: sessionScope 
    });
    
    const display = `→ Página ${n}`;
    
    // Para relator con intent, usar el handler de intents con paginación
    if (selectedRole === "relator" && lastRelatorIntent) {
      handleRelatorIntentRequest(lastRelatorIntent.intent, lastRelatorIntent.label, n);
      return;
    }
    
    // Para cliente con intent, usar el handler de intents con paginación
    if (selectedRole === "cliente" && lastClienteIntent) {
      handleClienteIntentRequest(lastClienteIntent.intent, lastClienteIntent.label, n);
      return;
    }
    
    // Para cliente sin intent, usar query normal
    let internal;
    if (selectedRole === "cliente") {
      internal = lastQuery || "Muéstrame todos mis cursos activos y pasados como cliente";
    } else {
      internal = `pagina ${n}`;
    }
    
    handleSendMessage(display, internal);
  };

  const showingCount = useMemo(() => {
    if (!hasPagination) return 0;
    const shown = Math.min(pageSize, total - (page - 1) * pageSize);
    return Math.max(0, shown);
  }, [hasPagination, page, pageSize, total]);

  const lastAssistantMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === "assistant") {
        return messages[i];
      }
    }
    return null;
  }, [messages]);

  if (import.meta.env.DEV) {
    console.log('🎨 [DEV MODE] Rendering CapinChat...');
  }

  return (
    <div
      className={`bg-white border border-gray-300 shadow-chat rounded-xl overflow-hidden flex flex-col h-[600px] max-w-md w-full ${className}`}
      style={{ minHeight: '600px', minWidth: '280px' }}
    >
      <ContactModalIntegration userRole={selectedRole} />
      
      {!showContactModal && (
        <>
          <ChatHeader
        userRole={selectedRole}
        onClose={onClose}
        onClear={handleClearChat}
        onResetSession={handleResetSession} // ADD: Callback para cambiar sesión
        isResettingSession={isResettingSession} // ADD: Estado para deshabilitar controles
        onChangeRole={setSelectedRole}
        rut={rut}
        onChangeRut={setRut}
        idCliente={idCliente}
        onChangeIdCliente={setIdCliente}
        correo={correo}
        onChangeCorreo={setCorreo}
        tmsSubrol={tmsSubrol}
        onChangeTmsSubrol={setTmsSubrol}
        canSwitchRole={effectiveCanSwitchRole}
        tmsOriginalRole={tmsOriginalRole}
        clientesAsociados={clientesAsociados}
        selectedClienteId={selectedClienteId}
        onChangeSelectedCliente={(id, nombre) => {
          setSelectedClienteId(id);
          setSelectedClienteNombre(nombre);
        }}
        onComercialTurnoRequest={handleComercialTurnoRequest}
      />

      {/* ADD: Acciones TMS - Solo para roles tms:* */}
      {isTmsRole && (
        <TmsQuickActions 
          onActionClick={handleTmsActionClick}
          onAdditionalActionSend={handleAdditionalActionSend}
          currentRole={selectedRole === "tms" ? `tms:${tmsSubrol}` : selectedRole}
          disabled={isTyping || isResettingSession}
          isMobile={isMobile}
        />
      )}

      {/* ADD: Acciones Alumno - Reemplaza preguntas sugeridas para alumno */}
      {selectedRole === "alumno" && (
        <AlumnoQuickActions 
          role={selectedRole}
          onActionClick={handleAlumnoActionClick}
          disabled={isTyping || isResettingSession}
        />
      )}

      {/* Sugeridas solo para relator y cliente (alumno usa Quick Actions) */}
      {(selectedRole === "relator" || selectedRole === "cliente") && (
        <SuggestedQuestions 
          onAsk={handleSendMessage} 
          role={selectedRole} 
          isMobile={isMobile} 
          disabled={isTyping || isResettingSession}
          onDiplomaRequest={selectedRole === "cliente" ? handleDiplomaRequest : undefined}
          onMaterialRequest={selectedRole === "relator" ? handleMaterialRequest : undefined}
          onClienteIntentRequest={selectedRole === "cliente" ? handleClienteIntentRequest : undefined}
          onRelatorIntentRequest={selectedRole === "relator" ? handleRelatorIntentRequest : undefined}
        />
      )}

      {/* Contenedor de mensajes */}
      <div
        className="
          flex-1 overflow-y-auto overscroll-contain scroll-smooth
          px-0
          [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
        "
      >
        <div className="space-y-0">
          {messages.map((message) => (
            <div key={message.id}>
              <ChatMessage 
                message={message} 
                onRelatorSelect={isTmsRole ? handleRelatorSelect : undefined}
                onParticipanteSelect={isTmsRole ? handleParticipanteSelect : undefined}
              />
            </div>
          ))}
          {isTyping && <TypingIndicator />}
          
          {/* Chips de desambiguación después del último mensaje del asistente (ADD-ONLY) */}
          {!isTyping && lastAssistantMessage && renderDisambiguationChips(lastMeta?.citations)}
          
          {/* ADD: Chip de modo y drawer de trazabilidad (NO disruptivo) */}
          {!isTyping && lastAssistantMessage && (
            <div className="px-4 py-2 flex items-center justify-between">
              <ChipModo mode={conversationMode} />
              <DrawerTrace 
                candidates={lastMeta?.trace?.candidates}
                toolsCalled={lastMeta?.trace?.tools_called}
                disabled={isTyping}
              />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {hasPagination && (
        <div className="border-t bg-muted/50 px-3 py-2">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Página {page} de {totalPages} • Mostrando {showingCount} de {total}
            </span>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => goToPage(page - 1)}
                  className={!canPrev || isTyping ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {/* Mostrar números de página cuando hay pocas páginas */}
              {totalPages <= 5 && Array.from({length: totalPages}, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => goToPage(pageNum)}
                    isActive={pageNum === page}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              {/* Para muchas páginas, mostrar página actual y adyacentes */}
              {totalPages > 5 && (
                <>
                  {page > 2 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => goToPage(1)} className="cursor-pointer">
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {page > 3 && <span className="text-muted-foreground">...</span>}
                  
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => goToPage(page - 1)} className="cursor-pointer">
                        {page - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationLink isActive className="cursor-pointer">
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                  
                  {page < totalPages && (
                    <PaginationItem>
                      <PaginationLink onClick={() => goToPage(page + 1)} className="cursor-pointer">
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {page < totalPages - 2 && <span className="text-muted-foreground">...</span>}
                  
                  {page < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => goToPage(totalPages)} className="cursor-pointer">
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => goToPage(page + 1)}
                  className={!canNext || isTyping ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* ADD: Banner de debugging para mode mismatch */}
      {/* <DebugBanner
        modeMismatch={modeMismatch}
        forcedGuidedMode={lastMeta?.trace?.mode === "guided" && lastMeta?.trace?.search_strategy === "forced_by_flag"}
      /> */}

      <ChatInput 
        onSendMessage={(text, contexts) => handleSendMessage(text, undefined, contexts)} 
        disabled={isTyping || isResettingSession} 
        inputRef={inputRef}
        showContextMenu={isTmsRole} // ✅ Mostrar botón "+" solo para TMS
      />

      {/* ADD: Modal para código de curso TMS */}
      <CourseCodeModal
        isOpen={isTmsModalOpen}
        onClose={() => {
          setIsTmsModalOpen(false);
          setSelectedTmsAction(null);
        }}
        onConfirm={handleTmsConfirm}
        actionType={selectedTmsAction}
      />
        </>
      )}
    </div>
  );
};
