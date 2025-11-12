import { useEffect, useState } from "react";
import { RelatorQuickAction } from "./RelatorQuickAction";
import { ParticipanteQuickAction } from "./ParticipanteQuickAction";
import { CostosQuickAction } from "./CostosQuickAction";
import { CursoQuickAction } from "./CursoQuickAction";
import { ConsultarR11QuickAction } from "./ConsultarR11QuickAction";
import { MaterialQuickAction } from "./MaterialQuickAction";
import { AprobadosQuickAction } from "./AprobadosQuickAction";
import { R24QuickAction } from "./R24QuickAction";
import { actionsRegistry } from "./ActionsRegistry";

interface AdditionalTmsActionsProps {
  currentRole: string;
  onActionSend: (payload: {
    source: string;
    intent: string;
    message: string;
    target?: { rut?: string; nombre?: string; codigoComer?: string; codigoCotizacion?: string; pkCotizacion?: string };
  }) => void;
  onActionClick: (action: 'R11' | 'R12' | 'R61' | 'BLOQUES') => void;
  disabled?: boolean;
}

export const AdditionalTmsActions = ({ 
  currentRole, 
  onActionSend,
  onActionClick,
  disabled = false 
}: AdditionalTmsActionsProps) => {
  // Estado para forzar re-render cuando cambia el rol
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Registrar las acciones para tms:logistica
  useEffect(() => {
    // Siempre limpiar primero las acciones existentes
    actionsRegistry.unregister("relator-search");
    actionsRegistry.unregister("participante-search");
    actionsRegistry.unregister("costos-search");
    actionsRegistry.unregister("curso-search");
    actionsRegistry.unregister("obtener-r11");
    actionsRegistry.unregister("consultar-r11");
    actionsRegistry.unregister("material-curso");
    actionsRegistry.unregister("aprobados-postcurso");
    actionsRegistry.unregister("r24-postcurso");

    // Solo registrar si es el rol correcto
    if (currentRole === "tms:logistica" || currentRole === "tms:diseno&desarrollo" || currentRole === "tms:postcurso" || currentRole === "tms:comercial") {
      const relatorAction = {
        id: "relator-search",
        component: (
          <RelatorQuickAction
            onActionSend={onActionSend}
            disabled={disabled}
            currentRole={currentRole}
          />
        ),
        roles: ["tms:logistica", "tms:diseno&desarrollo", "tms:postcurso", "tms:comercial"],
        order: 1
      };

      actionsRegistry.register(relatorAction);
      
      // Solo registrar costos, consultar R11 y material para logística
      if (currentRole === "tms:logistica") {
        const costosAction = {
          id: "costos-search",
          component: (
            <CostosQuickAction
              disabled={disabled}
              currentRole={currentRole}
              onSubmit={onActionSend}
            />
          ),
          roles: ["tms:logistica"],
          order: 2
        };

        const consultarR11Action = {
          id: "consultar-r11",
          component: (
            <ConsultarR11QuickAction
              onActionClick={onActionClick}
              disabled={disabled}
            />
          ),
          roles: ["tms:logistica"],
          order: 3
        };

        const materialAction = {
          id: "material-curso",
          component: (
            <MaterialQuickAction
              onActionSend={onActionSend}
              disabled={disabled}
              currentRole={currentRole}
            />
          ),
          roles: ["tms:logistica"],
          order: 4
        };

        actionsRegistry.register(costosAction);
        actionsRegistry.register(consultarR11Action);
        actionsRegistry.register(materialAction);
      }

      // Registrar material para comercial
      if (currentRole === "tms:comercial") {
        const materialAction = {
          id: "material-curso",
          component: (
            <MaterialQuickAction
              onActionSend={onActionSend}
              disabled={disabled}
              currentRole={currentRole}
            />
          ),
          roles: ["tms:comercial"],
          order: 2
        };

        actionsRegistry.register(materialAction);
      }

      // Registrar material para diseño&desarrollo
      if (currentRole === "tms:diseno&desarrollo") {
        const materialAction = {
          id: "material-curso",
          component: (
            <MaterialQuickAction
              onActionSend={onActionSend}
              disabled={disabled}
              currentRole={currentRole}
            />
          ),
          roles: ["tms:diseno&desarrollo"],
          order: 2
        };

        actionsRegistry.register(materialAction);
      }

      // Registrar acciones para postcurso
      if (currentRole === "tms:postcurso") {
        const aprobadosAction = {
          id: "aprobados-postcurso",
          component: (
            <AprobadosQuickAction
              onActionSend={onActionSend}
              disabled={disabled}
              currentRole={currentRole}
            />
          ),
          roles: ["tms:postcurso"],
          order: 2
        };

        const r24Action = {
          id: "r24-postcurso",
          component: (
            <R24QuickAction
              onActionSend={onActionSend}
              disabled={disabled}
              currentRole={currentRole}
            />
          ),
          roles: ["tms:postcurso"],
          order: 3
        };

        const participanteAction = {
          id: "participante-search",
          component: (
            <ParticipanteQuickAction
              onActionSend={onActionSend}
              disabled={disabled}
              currentRole={currentRole}
            />
          ),
          roles: ["tms:postcurso"],
          order: 4
        };

        actionsRegistry.register(aprobadosAction);
        actionsRegistry.register(r24Action);
        actionsRegistry.register(participanteAction);
      }
    }

    // Forzar re-render
    setForceUpdate(prev => prev + 1);

    // Cleanup al desmontar
    return () => {
      actionsRegistry.unregister("relator-search");
      actionsRegistry.unregister("costos-search");
      actionsRegistry.unregister("curso-search");
      actionsRegistry.unregister("obtener-r11");
      actionsRegistry.unregister("consultar-r11");
      actionsRegistry.unregister("material-curso");
      actionsRegistry.unregister("aprobados-postcurso");
      actionsRegistry.unregister("r24-postcurso");
    };
  }, [onActionSend, onActionClick, disabled, currentRole]);

  // Obtener acciones disponibles para el rol actual
  const availableActions = actionsRegistry.getActionsForRole(currentRole);

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" key={`actions-${currentRole}-${forceUpdate}`}>
      {availableActions.map((action) => (
        <div key={action.id} className="w-full">
          {action.component}
        </div>
      ))}
    </div>
  );
};