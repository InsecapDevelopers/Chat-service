import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { CostosSearchModal } from "./CostosSearchModal";
import { sendCustomTelemetry } from "@/lib/telemetry";

interface CostosQuickActionProps {
  disabled?: boolean;
  currentRole?: string;
  onSubmit?: (payload: {
    source: string;
    intent: string;
    message: string;
    target: { codigoComer: string };
  }) => void;
}

export const CostosQuickAction = ({ 
  disabled = false,
  currentRole = "",
  onSubmit
}: CostosQuickActionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    // Telemetría: abrir modal
    sendCustomTelemetry("tms_costos_click", {
      action: "open_modal",
      role: currentRole,
    });

    setIsModalOpen(true);
  };

  const handleSubmit = (codigoComer: string) => {
    // Telemetría: enviar búsqueda
    sendCustomTelemetry("tms_costos_send", {
      codigoComer,
      roleBase: currentRole,
    });

    // Crear payload para el backend
    const payload = {
      source: "quick_action",
      intent: "tms.get_costos",
      message: "Costos by codigoComer",
      target: { codigoComer },
    };

    if (onSubmit) {
      onSubmit(payload);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className="h-auto p-3 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white border-none transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-md w-full"
        title="Consultar costos"
      >
        <DollarSign className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-medium truncate">Costos</span>
      </Button>

      <CostosSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
};