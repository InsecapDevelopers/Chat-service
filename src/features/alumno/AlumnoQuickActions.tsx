import React from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MisDatosQuickAction } from './MisDatosQuickAction';
import { VerNotasQuickAction } from './VerNotasQuickAction';
import { VerAsistenciaQuickAction } from './VerAsistenciaQuickAction';
import { VerCursosQuickAction } from './VerCursosQuickAction';

interface AlumnoQuickActionsProps {
  role: string;
  onActionClick: (intent: string, question: string) => void;
  disabled?: boolean;
}

export const AlumnoQuickActions: React.FC<AlumnoQuickActionsProps> = ({
  role,
  onActionClick,
  disabled = false
}) => {
  // Solo mostrar si el rol es "alumno"
  // Puede venir como "alumno" o "tms:alumno", pero según el contexto debería ser solo "alumno"
  const roleBase = role.includes(':') ? role.split(':')[1]?.toLowerCase() : role.toLowerCase();
  if (roleBase !== 'alumno') {
    return null;
  }

  return (
    <div className="border-b bg-background/70">
      <Accordion type="single" collapsible defaultValue="alumno-actions">
        <AccordionItem value="alumno-actions" className="border-b-0">
          <AccordionTrigger 
            className="px-4 pt-3 pb-2 text-xs text-muted-foreground hover:no-underline"
            aria-label="Mostrar/ocultar consultas de alumno"
          >
            Consultas de alumno
          </AccordionTrigger>
          
          <AccordionContent className="px-4 pb-2 pt-0">
            <div className="flex flex-wrap gap-2">
            <MisDatosQuickAction 
              onClick={onActionClick}
              disabled={disabled}
            />
            <VerNotasQuickAction 
              onClick={onActionClick}
              disabled={disabled}
            />
            <VerAsistenciaQuickAction 
              onClick={onActionClick}
              disabled={disabled}
            />
            <VerCursosQuickAction 
              onClick={onActionClick}
              disabled={disabled}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    </div>
  );
};
