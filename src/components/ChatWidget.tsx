import React, { useState, useEffect, useRef } from "react";
import { SafeButton as Button } from "@/components/ui/safe-button";
import { MessageCircle } from "lucide-react";
import capinMascot from "@/assets/capin-mascot.png";
import { CapinChat } from "./CapinChat";
import { ContactProvider } from '@/contexts/ContactContext';
import { AuthContext, SafeUser } from '@/contexts/AuthContext';
import { ShadowPortalProvider } from '@/contexts/ShadowPortalContext';

export interface ChatWidgetProps {
  /** ID único del usuario (GUID de TMS) */
  userId?: string;
  userName?: string;
  userRut?: string;
  userEmail?: string;
  userRole?: 'tms' | 'publico' | 'alumno' | 'relator' | 'cliente' | 'logistica' | string;
  sessionId?: string;
  /** Rol original de TMS (antes del mapeo) */
  tmsOriginalRole?: string;
  /** Si el usuario puede cambiar de rol (solo Admin) */
  canSwitchRole?: boolean;
  /** ID del cliente (para rol cliente) */
  idCliente?: string;
  /** Lista de clientes asociados (para representante empresa) */
  clientesAsociados?: Array<{ idCliente: string; nombre: string }>;
  className?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  userId,
  userName,
  userRut,
  userEmail,
  userRole = 'publico',
  sessionId,
  tmsOriginalRole,
  canSwitchRole = false,
  idCliente,
  clientesAsociados,
  className = '',
}) => {
  // Empezar cerrado para mostrar el botón
  const [open, setOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isWelcomeFading, setIsWelcomeFading] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // Log de montaje
  useEffect(() => {
    console.log('[ChatWidget] Componente montado. Estado inicial open =', open);
    
    // Verificar que el botón está disponible
    queueMicrotask(() => {
      if (btnRef.current) {
        console.log('[ChatWidget] ✅ Ref del botón establecida:', btnRef.current);
        const computed = window.getComputedStyle(btnRef.current);
        console.log('[ChatWidget] pointer-events del botón:', computed.pointerEvents);
      } else {
        console.warn('[ChatWidget] ⚠️ Ref del botón NO establecida');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ocultar mensaje de bienvenida después de 3 segundos con animación
  useEffect(() => {
    // Iniciar fade out a los 2.5 segundos
    const fadeTimer = setTimeout(() => {
      setIsWelcomeFading(true);
    }, 2500);

    // Ocultar completamente a los 3 segundos (después del fade)
    const hideTimer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Notificar al host del Shadow DOM sobre cambios de estado
  useEffect(() => {
    const host = document.getElementById('capin-chat-root');
    if (host) {
      host.setAttribute('data-chat-state', open ? 'open' : 'closed');
      console.log('[ChatWidget] Estado actualizado:', open ? 'open' : 'closed');
      // Disparar evento personalizado para compatibilidad
      host.dispatchEvent(new CustomEvent('chatStateChange', { 
        detail: { isOpen: open },
        bubbles: true,
        composed: true 
      }));
    }
  }, [open]);

  if (!open) {
    return (
      <div 
        className="relative z-[60] pointer-events-auto"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="relative">
          <button
            ref={btnRef}
            aria-label="Abrir chat CapinIA"
            onClick={(e) => {
              console.log('[ChatWidget] ✅ onClick disparado - abriendo chat');
              setOpen(true);
            }}
            onMouseDown={(e) => {
              console.log('[ChatWidget] MouseDown en botón', e.button);
            }}
            onMouseUp={(e) => {
              console.log('[ChatWidget] MouseUp en botón', e.button);
            }}
            onPointerDown={(e) => {
              console.log('[ChatWidget] PointerDown en botón', e.pointerType);
            }}
            onPointerUp={(e) => {
              console.log('[ChatWidget] ⬆️ PointerUp en botón', e.pointerType);
              // Fallback: si onClick no funciona, usar PointerUp
              if (!open) {
                console.log('[ChatWidget] 🔄 Fallback: Abriendo desde PointerUp');
                setOpen(true);
              }
            }}
            className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-xl hover:scale-110 transition-transform inline-flex items-center justify-center border-0 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, hsl(227 58% 53%), hsl(191 100% 47%))',
              border: 'none',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
          >
            <MessageCircle className="h-7 w-7 md:h-8 md:w-8 text-white" />
          </button>

          {showWelcome && (
            <div 
              className={`absolute -top-3 right-0 translate-y-[-100%] transition-all duration-500 ${
                isWelcomeFading 
                  ? 'opacity-0 scale-95 translate-y-[-110%]' 
                  : 'opacity-100 scale-100 animate-in fade-in slide-in-from-bottom-2'
              }`}
            >
              {/* Globo completo solo en lg+ */}
              <div className="hidden lg:block bg-white border border-border rounded-xl shadow-lg p-3 w-[72vw] max-w-[420px] min-w-[260px]">
                <div className="flex items-center gap-3">
                  <img
                    src={capinMascot}
                    alt="Capin"
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                  <p className="text-sm sm:text-base leading-5 sm:leading-6 text-foreground">
                    Hola, soy <span className="font-semibold">CapinIA</span>, tu
                    asistente virtual. <br /> ¿En qué puedo ayudarte hoy?
                  </p>
                </div>
                <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 bg-white border-r border-b border-border" />
              </div>

              {/* Globo reducido para md y menores */}
              <div className="block lg:hidden bg-white border border-border rounded-xl shadow-lg px-2 py-1 min-w-[160px]">
                <div className="flex items-center gap-2">
                  <img
                    src={capinMascot}
                    alt="Capin"
                    className="w-6 h-6 rounded-full shrink-0"
                  />
                  <p className="text-xs leading-4 text-foreground">
                    ¿En qué puedo ayudarte?
                  </p>
                </div>
                <div className="absolute -bottom-2 right-4 h-3 w-3 rotate-45 bg-white border-r border-b border-border" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Generar sessionId aleatorio para usuarios públicos si no se proporciona
  const generateSessionId = (role?: string) => {
    if (role === 'publico' && !sessionId) {
      return `publico-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
    }
    return sessionId;
  };

  const mockAuthContextValue = {
    user: userName ? {
      sub: sessionId || 'external-user',
      displayName: userName,
      role: userRole || 'publico',
      tenantId: userRut || undefined,
      sessionToken: sessionId,
      claims: {
        id: userId || '',
        name: userName || '',
        email: userEmail || '',
        rut: userRut || '',
      }
    } : null,
    loading: false,
    setUser: () => {},
    signOutLocal: () => {},
  };

  return (
    <AuthContext.Provider value={mockAuthContextValue}>
      <ShadowPortalProvider>
        <ContactProvider isAuthenticated={true}>
          <div className="relative z-[60] pointer-events-auto" style={{ pointerEvents: 'auto' }}>
            <div className="relative [width:min(92vw,440px)]">
              <div className="bg-white border border-border rounded-xl shadow-2xl w-full h-[70vh] max-h-[80vh] md:h-[600px] overflow-hidden pointer-events-auto" style={{ pointerEvents: 'auto' }}>
                <CapinChat
                  className="h-full max-w-none w-full"
                  apiEndpoint={import.meta.env.VITE_API_ENDPOINT}
                  sessionScope="guest"
                  showWelcome={true}
                  onClose={() => setOpen(false)}
                  userRole={userRole}
                  canSwitchRole={canSwitchRole}
                  tmsOriginalRole={tmsOriginalRole}
                  initialIdCliente={idCliente}
                  clientesAsociados={clientesAsociados}
                />
              </div>
            </div>
          </div>
        </ContactProvider>
      </ShadowPortalProvider>
    </AuthContext.Provider>
  );
};

export default ChatWidget;
