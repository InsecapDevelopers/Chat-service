import { SafeButton as Button } from "@/components/ui/safe-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileText, Calculator, ClipboardList, Calendar } from "lucide-react";
import { AdditionalTmsActions } from "@/features/tms/AdditionalTmsActions";

export type TmsActionType = 'R11' | 'R12' | 'R61' | 'BLOQUES';

interface TmsQuickActionsProps {
  onActionClick: (action: TmsActionType) => void;
  onAdditionalActionSend?: (payload: {
    source: string;
    intent: string;
    message: string;
    target?: { rut?: string; nombre?: string; codigoComer?: string; codigoCotizacion?: string; pkCotizacion?: string; codigoCurso?: string };
  }) => void;
  currentRole?: string;
  disabled?: boolean;
  isMobile?: boolean;
}

export const TmsQuickActions = ({ 
  onActionClick, 
  onAdditionalActionSend,
  currentRole = "",
  disabled = false, 
  isMobile = false 
}: TmsQuickActionsProps) => {
  // Para logística, diseño&desarrollo, postcurso y comercial, ocultar botones originales
  const isLogistica = currentRole === "tms:logistica";
  const isDisenoDev = currentRole === "tms:diseno&desarrollo";
  const isPostcurso = currentRole === "tms:postcurso";
  const isComercial = currentRole === "tms:comercial";
  const shouldHideOriginalActions = isLogistica || isDisenoDev || isPostcurso || isComercial;
  
  if (import.meta.env.DEV) {
    console.log('[TmsQuickActions DEBUG] Renderizando con:', {
      currentRole,
      isLogistica,
      isDisenoDev,
      isPostcurso,
      isComercial,
      shouldHideOriginalActions,
      hasAdditionalActionSend: !!onAdditionalActionSend,
      disabled,
      isMobile
    });
  }
  
  const actions = [
    {
      type: 'R11' as TmsActionType,
      label: 'Consultar R11',
      icon: FileText,
      description: 'Información del R11',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      type: 'R12' as TmsActionType,
      label: 'Consultar R12',
      icon: Calculator,
      description: 'Costos R12',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      type: 'R61' as TmsActionType,
      label: 'Consultar R61',
      icon: ClipboardList,
      description: 'Registros R61',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      type: 'BLOQUES' as TmsActionType,
      label: 'Consultar Bloques',
      icon: Calendar,
      description: 'Información de bloques',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="border-b bg-background/70">
      <Accordion type="single" collapsible defaultValue="tms">
        <AccordionItem value="tms" className="border-b-0">
          <AccordionTrigger 
            className="px-4 pt-3 pb-2 text-xs font-semibold text-blue-600 hover:no-underline hover:text-blue-700"
            aria-label="Mostrar/ocultar acciones TMS"
          >
            Preguntas frecuentes TMS
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-2 pt-0">
            <div className="space-y-3">
              {/* Acciones originales TMS - Solo si NO es logística ni diseño&desarrollo */}
              {!shouldHideOriginalActions && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        type="button"
                        key={action.type}
                        variant="outline"
                        size="sm"
                        onClick={() => onActionClick(action.type)}
                        disabled={disabled}
                        className={`
                          h-auto p-2 flex flex-col items-center gap-1 text-white border-none
                          ${action.color} disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-200 hover:scale-105 hover:shadow-md rounded-md
                        `}
                        title={action.description}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs font-medium leading-tight text-center">{action.label}</span>
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Acciones adicionales por rol (ADD-ONLY) */}
              {onAdditionalActionSend && (
                <AdditionalTmsActions
                  currentRole={currentRole}
                  onActionSend={onAdditionalActionSend}
                  onActionClick={onActionClick}
                  disabled={disabled}
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};