import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import { DiplomaModal } from "@/components/DiplomaModal";

interface DiplomaQuickActionProps {
  onActionSend: (payload: {
    source: string;
    intent: string;
    message: string;
    target?: { rut?: string };
  }) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const DiplomaQuickAction = ({ 
  onActionSend, 
  disabled = false
}: DiplomaQuickActionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    // Telemetría: registrar click en el botón
    if (window.gtag) {
      window.gtag('event', 'cliente_get_diploma_click', {
        event_category: 'cliente_actions',
        event_label: 'quick_action_diploma'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (rut: string) => {
    const payload = {
      source: "quick_action",
      intent: "cliente.get_diploma",
      message: "Consultar Diploma",
      target: { rut }
    };

    // Telemetría: registrar búsqueda de diploma
    if (window.gtag) {
      window.gtag('event', 'cliente_get_diploma_search', {
        event_category: 'cliente_actions',
        event_label: 'diploma_search'
      });
    }

    onActionSend(payload);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className="h-auto p-3 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white border-none transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-md w-full"
      >
        <Award className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-medium truncate">Diploma</span>
      </Button>

      <DiplomaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
};
