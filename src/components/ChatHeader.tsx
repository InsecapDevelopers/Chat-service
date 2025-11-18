import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SafeButton as Button } from "@/components/ui/safe-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, Trash2, ChevronDown, RotateCcw, HelpCircle } from "lucide-react";
import insecapLogo from "@/assets/insecap-logo4.png";
import capinMascot from "@/assets/capin-mascot.png";
import { useShadowPortal } from "@/contexts/ShadowPortalContext";

type AppRole = "tms" | "publico" | "alumno" | "relator" | "cliente";

interface ChatHeaderProps {
  isMinimized?: boolean;
  userRole?: AppRole | string;
  onToggleMinimize?: () => void;
  onClose?: () => void;
  onClear?: () => void;
  onResetSession?: () => void; // ADD: Callback para cambiar sesión
  isResettingSession?: boolean; // ADD: Estado para deshabilitar controles

  onChangeRole?: (r: AppRole) => void;
  rut?: string;
  onChangeRut?: (rut: string) => void;
  idCliente?: string;
  onChangeIdCliente?: (v: string) => void;
  correo?: string;
  onChangeCorreo?: (v: string) => void;
  
  // ADD: Props para TMS subrol
  tmsSubrol?: string;
  onChangeTmsSubrol?: (subrol: string) => void;
  
  // ADD: Props para control de rol fijo desde TMS
  canSwitchRole?: boolean;
  tmsOriginalRole?: string;
  
  // ADD: Props para cliente seleccionado (representante empresa)
  clientesAsociados?: Array<{ idCliente: string; nombre: string }>;
  selectedClienteId?: string;
  onChangeSelectedCliente?: (idCliente: string, nombre: string) => void;
  
  // ADD: Handler para consultar comercial de turno
  onComercialTurnoRequest?: () => void;
}

export const ChatHeader = ({
  userRole = "publico",
  onClose,
  onClear,
  onResetSession,
  isResettingSession = false,
  onChangeRole,
  rut = "",
  onChangeRut,
  idCliente = "",
  onChangeIdCliente,
  correo = "",
  onChangeCorreo,
  tmsSubrol = "comercial",
  onChangeTmsSubrol,
  canSwitchRole = false,
  tmsOriginalRole,
  clientesAsociados,
  selectedClienteId = "",
  onChangeSelectedCliente,
  onComercialTurnoRequest,
}: ChatHeaderProps) => {
  // Obtener contenedor de portal para Radix UI
  const portalContainer = useShadowPortal();
  
  // En modo ADMIN, mostrar inputs según el rol para poder testear
  // En modo normal (embebido), los datos vienen desde TMS internamente
  // RUT solo para alumno y relator (cliente lo maneja en su propio bloque)
  const showRut = canSwitchRole && (userRole === "alumno" || userRole === "relator");
  // Mostrar campos de cliente si: es rol cliente Y (tiene clientesAsociados O es admin)
  const showCli = userRole === "cliente" && (clientesAsociados || canSwitchRole);
  const showTms = userRole === "tms";
  
  // Determinar si es un rol TMS compuesto
  const isTmsComposed = typeof userRole === 'string' && userRole.startsWith('tms:');

  const tmsSubrolOptions = [
    { value: "comercial", label: "Comercial" },
    { value: "postcurso", label: "Postcurso" },
    { value: "logistica", label: "Logística" },
    { value: "diseno&desarrollo", label: "Diseño & Desarrollo" },
  ];

  return (
    <div className="bg-gradient-primary text-white p-2 sm:p-3 rounded-t-xl shadow-chat min-h-[52px] sm:min-h-[56px]">
      <div className="flex items-start justify-between gap-2">
        {/* IZQUIERDA */}
        <div className="flex items-start gap-2 min-w-0">
          <img src={insecapLogo} alt="Insecap" className="h-6 sm:h-8 w-auto shrink-0" />
          <div className="border-l border-white/20 pl-2 min-w-0">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6 sm:w-7 sm:h-7 border border-white/30 shrink-0">
                <AvatarImage src={capinMascot} alt="Capin" />
                <AvatarFallback>CP</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold leading-tight text-sm">CapinIA</span>
                  <Badge variant="outline" className="h-5 px-1.5 border-white/30 text-xs text-white/90">
                    Asistente virtual
                  </Badge>
                </div>
                <p className="text-xs text-white/70 leading-snug hidden sm:block">
                  ¿En qué puedo ayudarte hoy?
                </p>
              </div>
            </div>

            {/* Controles compactos: Rol y (condicional) RUT */}
            <div className="mt-2 flex flex-row flex-wrap items-center gap-2">
              {/* MODO ADMIN: Select habilitado */}
              {canSwitchRole ? (
                <div className="flex items-center gap-1">
                  <Badge variant="default" className="h-6 px-4 bg-yellow-500 text-white text-xs font-bold">
                    ADMIN
                  </Badge>
                  <span className="text-xs text-white/80">Rol:</span>
                  <Select 
                    value={isTmsComposed ? 'tms' : (userRole as AppRole)} 
                    onValueChange={(v: AppRole) => onChangeRole?.(v)}
                  >
                    <SelectTrigger className="h-6 sm:h-7 px-1.5 sm:px-2 pr-6 sm:pr-7 w-[100px] sm:w-[120px] text-xs bg-white/10 border-white/30 text-white">
                      <SelectValue placeholder="Seleccionar rol" />
                      <ChevronDown className="h-3 w-3 ml-auto opacity-60" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publico">Público</SelectItem>
                      <SelectItem value="alumno">Alumno</SelectItem>
                      <SelectItem value="relator">Relator</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="tms">TMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                /* MODO ROL FIJO: Solo badge del rol asignado */
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white/80">Rol:</span>
                  <Badge variant="secondary" className="h-6 px-2 bg-white/20 text-white text-xs font-medium capitalize">
                    {isTmsComposed 
                      ? userRole.replace('tms:', '').replace('&', ' & ')
                      : userRole === 'publico' ? 'Público' 
                      : userRole === 'logistica' ? 'Logística'
                      : userRole
                    }
                  </Badge>
                  {tmsOriginalRole && (
                    <span className="text-xs text-white/60 italic">({tmsOriginalRole})</span>
                  )}
                </div>
              )}

              {showRut && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white/80 whitespace-nowrap">RUT:</span>
                  <Input
                    value={rut}
                    onChange={(e) => onChangeRut?.(e.target.value)}
                    placeholder="12.345.678-9"
                    className="h-6 sm:h-7 w-[110px] sm:w-[138px] text-xs px-2 bg-white/10 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>
              )}

              {showCli && (
                <>
                  {/* Si hay clientes asociados (desde TMS), mostrar solo select */}
                  {clientesAsociados && clientesAsociados.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-white/80 whitespace-nowrap">Cliente:</span>
                      <Select 
                        value={selectedClienteId} 
                        onValueChange={(v: string) => {
                          const cliente = clientesAsociados.find(c => c.idCliente === v);
                          if (cliente) {
                            onChangeSelectedCliente?.(cliente.idCliente, cliente.nombre);
                          }
                        }}
                      >
                        <SelectTrigger className="h-6 sm:h-7 px-1.5 sm:px-2 pr-6 sm:pr-7 w-[150px] sm:w-[180px] text-xs bg-white/10 border-white/30 text-white">
                          <SelectValue placeholder="Seleccionar cliente" />
                          <ChevronDown className="h-3 w-3 ml-auto opacity-60" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientesAsociados.map((cliente) => (
                            <SelectItem key={cliente.idCliente} value={cliente.idCliente}>
                              {cliente.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Modo admin sin clientes asociados: pedir ID Cliente, RUT y Email */}
                  {!clientesAsociados && canSwitchRole && (
                    <>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-white/80 whitespace-nowrap">ID Cliente:</span>
                        <Input
                          value={idCliente}
                          onChange={(e) => onChangeIdCliente?.(e.target.value)}
                          placeholder="CLI-001234"
                          className="h-6 sm:h-7 w-[110px] sm:w-[138px] text-xs px-2 bg-white/10 border-white/30 text-white placeholder:text-white/60"
                        />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-white/80 whitespace-nowrap">RUT:</span>
                        <Input
                          value={rut}
                          onChange={(e) => onChangeRut?.(e.target.value)}
                          placeholder="12.345.678-9"
                          className="h-6 sm:h-7 w-[110px] sm:w-[138px] text-xs px-2 bg-white/10 border-white/30 text-white placeholder:text-white/60"
                        />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-white/80 whitespace-nowrap">Email:</span>
                        <Input
                          type="email"
                          value={correo}
                          onChange={(e) => onChangeCorreo?.(e.target.value)}
                          placeholder="cliente@dominio.cl"
                          className="h-6 sm:h-7 w-[150px] sm:w-[180px] text-xs px-2 bg-white/10 border-white/30 text-white placeholder:text-white/60"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {showTms && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white/80 whitespace-nowrap">Área:</span>
                  <Select value={tmsSubrol} onValueChange={(v: string) => onChangeTmsSubrol?.(v)}>
                    <SelectTrigger className="h-6 sm:h-7 px-1.5 sm:px-2 pr-6 sm:pr-7 w-[130px] sm:w-[150px] text-xs bg-white/10 border-white/30 text-white">
                      <SelectValue placeholder="Seleccionar área" />
                      <ChevronDown className="h-3 w-3 ml-auto opacity-60" />
                    </SelectTrigger>
                    <SelectContent>
                      {tmsSubrolOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DERECHA: acciones (compactas) */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Botón de ayuda - Comercial de Turno */}
          {onComercialTurnoRequest && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onComercialTurnoRequest}
                    disabled={isResettingSession}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 rounded-full shadow-lg"
                    title="Consultar comercial de turno"
                  >
                    <HelpCircle className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">
                    <strong>¿Necesitas ayuda?</strong>
                    <br />
                    Consulta quién es el comercial de turno
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Botón de cambiar sesión - SOLO PARA ADMIN */}
          {canSwitchRole && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetSession}
              disabled={isResettingSession}
              className="h-6 sm:h-7 px-1.5 sm:px-2 bg-white/10 hover:bg-white/20 border-white/30 text-white disabled:opacity-50"
              title="Cambiar sesión (contexto limpio)"
            >
              <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
          
          {/* Botón de limpiar conversación - SIEMPRE VISIBLE */}
          {onClear && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={isResettingSession}
              className="h-7 px-2 bg-white/10 hover:bg-white/20 border-white/30 text-white disabled:opacity-50"
              title="Limpiar conversación"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}

          {/* Botón de cerrar - SIEMPRE VISIBLE */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isResettingSession}
            className="h-7 px-2 bg-white/10 hover:bg-white/20 border-white/30 text-white disabled:opacity-50"
            title="Cerrar"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
