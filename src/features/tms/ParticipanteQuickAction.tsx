import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { ParticipanteSearchModal } from "./ParticipanteSearchModal";
import { sendCustomTelemetry } from "@/lib/telemetry";

interface ParticipanteQuickActionProps {
  onActionSend: (payload: {
    source: string;
    intent: string;
    message: string;
    target?: { rut?: string; nombre?: string };
  }) => void;
  disabled?: boolean;
  currentRole?: string;
}

export const ParticipanteQuickAction = ({ 
  onActionSend, 
  disabled = false,
  currentRole = ""
}: ParticipanteQuickActionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    // Telemetría: click en quick action participante
    sendCustomTelemetry("tms_find_participante_click", {});
    setIsModalOpen(true);
  };

  const handleSearchSubmit = (target: { rut?: string; nombre?: string }) => {
    // Construir payload exacto según especificación
    const payload = {
      source: "quick_action",
      intent: "tms.find_participante",
      message: "Buscar Participante",
      target
    };

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
        className="h-auto p-3 flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white border-none transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-md w-full"
        title="Buscar información de participante"
      >
        <Users className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-medium truncate">Participante</span>
      </Button>

      <ParticipanteSearchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSearchSubmit={handleSearchSubmit}
      />
    </>
  );
};
