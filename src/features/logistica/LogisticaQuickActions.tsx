import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ObtenerR11QuickAction } from './ObtenerR11QuickAction';

interface LogisticaQuickActionsProps {
  role: string;
  onActionClick: (intent: string, question: string) => void;
  disabled?: boolean;
}

export const LogisticaQuickActions: React.FC<LogisticaQuickActionsProps> = ({
  role,
  onActionClick,
  disabled = false
}) => {
  if (role !== "logistica") return null;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="logistica-actions"
      className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <AccordionItem value="logistica-actions" className="border-none">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <span className="text-sm font-medium">Consultas de logística</span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            <ObtenerR11QuickAction 
              onClick={onActionClick}
              disabled={disabled}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
