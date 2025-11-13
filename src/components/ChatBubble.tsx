import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { CapinChat } from './CapinChat';
import { ContactProvider } from '@/contexts/ContactContext';
import { AuthContext, SafeUser } from '@/contexts/AuthContext';
import { registerChatBubbleInstance, unregisterChatBubbleInstance } from '@/lib/chatBubbleUtils';
import { mapTmsRoleToCapin } from '@/lib/tmsRoleMapper';

export interface UserData {
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
}

interface ChatBubbleProps extends UserData {
  className?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  userId,
  userName,
  userRut,
  userEmail,
  userRole = 'publico',
  sessionId,
  idCliente,
  clientesAsociados,
  className = '',
}) => {
  // SIEMPRE abierto por defecto para testing
  const [isOpen, setIsOpen] = useState(true);
  
  // Generar sessionId aleatorio para usuarios públicos si no se proporciona
  const generateSessionId = (role?: string) => {
    if (role === 'publico' && !sessionId) {
      return `publico-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
    }
    return sessionId;
  };

  // Mapear el rol inicial desde las props
  const initialRoleMapping = mapTmsRoleToCapin(userRole);
  console.log('[ChatBubble Init] Rol props:', userRole, '→ Mapeado:', initialRoleMapping);

  const [currentUserData, setCurrentUserData] = useState<UserData>({
    userId,
    userName,
    userRut,
    userEmail,
    userRole: initialRoleMapping.capinRole,
    sessionId: generateSessionId(initialRoleMapping.capinRole),
    tmsOriginalRole: userRole,
    canSwitchRole: initialRoleMapping.canSwitchRole,
    idCliente,
    clientesAsociados,
  });

  // Actualizar cuando las props cambien (para renderizado directo vía bundleUtils)
  useEffect(() => {
    console.log('[ChatBubble] ========== PROPS RECIBIDAS ==========');
    console.log('[ChatBubble] userName:', userName);
    console.log('[ChatBubble] userRole:', userRole);
    console.log('[ChatBubble] userRut:', userRut);
    console.log('[ChatBubble] userEmail:', userEmail);
    console.log('[ChatBubble] sessionId:', sessionId);
    console.log('[ChatBubble] idCliente:', idCliente);
    console.log('[ChatBubble] clientesAsociados:', clientesAsociados);
    
    const roleMapping = mapTmsRoleToCapin(userRole);
    console.log('[ChatBubble] Rol mapeado:', roleMapping);
    
    setCurrentUserData(prev => {
      const updatedData = {
        ...prev,
        userName: userName || prev.userName,
        userRut: userRut || prev.userRut,
        userEmail: userEmail || prev.userEmail,
        userRole: roleMapping.capinRole,
        tmsOriginalRole: userRole,
        canSwitchRole: roleMapping.canSwitchRole,
        sessionId: sessionId || prev.sessionId,
        idCliente: idCliente || prev.idCliente,
        clientesAsociados: clientesAsociados || prev.clientesAsociados,
      };
      
      console.log('[ChatBubble] Estado actualizado:', updatedData);
      console.log('[ChatBubble] =====================================');
      
      return updatedData;
    });
  }, [userName, userRole, userRut, userEmail, sessionId, idCliente, clientesAsociados]);

  // Función para inicializar desde script externo
  useEffect(() => {
    const handleUserDataUpdate = (userData: UserData) => {
      console.log('[ChatBubble] Datos recibidos de TMS:', userData);
      
      // Mapear el rol de TMS a rol de Capin
      const roleMapping = mapTmsRoleToCapin(userData.userRole);
      console.log('[ChatBubble] Rol mapeado:', roleMapping);
      
      const updatedData = { 
        ...userData,
        userRole: roleMapping.capinRole,
        tmsOriginalRole: userData.userRole,
        canSwitchRole: roleMapping.canSwitchRole,
      };
      
      // Generar sessionId aleatorio para usuarios públicos si no se proporciona
      if (updatedData.userRole === 'publico' && !updatedData.sessionId) {
        updatedData.sessionId = `publico-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
      }
      
      console.log('[ChatBubble] Datos finales procesados:', updatedData);
      setCurrentUserData(prev => ({ ...prev, ...updatedData }));
      setIsOpen(true);
    };

    registerChatBubbleInstance(handleUserDataUpdate);

    return () => {
      unregisterChatBubbleInstance();
    };
  }, []);

    const mockAuthContextValue = {
      user: currentUserData.userName ? {
        sub: currentUserData.sessionId || 'external-user',
        displayName: currentUserData.userName,
        role: currentUserData.userRole || 'publico',
        tenantId: currentUserData.userRut || undefined,
        sessionToken: currentUserData.sessionId,
        claims: {
          id: currentUserData.userId || '',
          name: currentUserData.userName || '',
          email: currentUserData.userEmail || '',
          rut: currentUserData.userRut || '',
        }
      } : null,
      loading: false,
      setUser: (u: SafeUser | null) => {
        if (u) {
          setCurrentUserData(prev => ({
            ...prev,
            userName: u.displayName,
            userRole: u.role as UserData['userRole'],
            sessionId: u.sessionToken || u.sub,
          }));
        }
      },
      signOutLocal: () => {
        setCurrentUserData({
          userRole: 'publico',
          sessionId: generateSessionId(),
        });
      },
    };

  const toggleChat = () => {
    console.log('[ChatBubble] 🖱️ Click en botón - toggling chat. Estado actual:', isOpen);
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Contenido del chat bubble
  const chatBubbleContent = (
    <div>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggleChat}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            backgroundColor: '#2563eb',
            borderRadius: '50%',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s',
            cursor: 'pointer',
            border: 'none',
            zIndex: 2147483647, // z-index máximo posible
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1d4ed8';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Abrir chat"
        >
          <MessageCircle style={{ width: '24px', height: '24px', color: 'white' }} />
        </button>
      )}

      {/* Ventana del chat */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '384px',
            height: '600px',
            maxWidth: 'calc(100vw - 48px)',
            maxHeight: 'calc(100vh - 48px)',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb',
            transition: 'all 0.3s',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 2147483647, // z-index máximo posible
          }}
        >
          {/* Contenido del chat - Sin header, TMS maneja su propio header */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AuthContext.Provider value={mockAuthContextValue}>
              <ContactProvider isAuthenticated={!!currentUserData.userName}>
                <CapinChat
                  userRole={currentUserData.userRole as string}
                  sessionScope={currentUserData.sessionId || 'external'}
                  showWelcome={true}
                  className="border-0 rounded-none h-full max-w-none w-full shadow-none"
                  canSwitchRole={currentUserData.canSwitchRole}
                  tmsOriginalRole={currentUserData.tmsOriginalRole}
                  initialIdCliente={currentUserData.idCliente}
                  clientesAsociados={currentUserData.clientesAsociados}
                  onClose={handleClose}
                />
              </ContactProvider>
            </AuthContext.Provider>
          </div>
        </div>
      )}
    </div>
  );

  return chatBubbleContent;
};

export default ChatBubble;