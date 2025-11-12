import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserCheck } from "lucide-react";
import { AprobadosModal } from "@/components/AprobadosModal";
import { sendCustomTelemetry } from "@/lib/telemetry";

interface AprobadosQuickActionProps {
  onActionSend: (payload: {
    source: string;
    intent: string;
    message: string;
    target?: { codigoCotizacion?: string };
  }) => void;
  disabled?: boolean;
  currentRole?: string;
}

export const AprobadosQuickAction = ({ 
  onActionSend, 
  disabled = false,
  currentRole = ""
}: AprobadosQuickActionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    // Telemetría: click en quick action aprobados
    sendCustomTelemetry("tms_get_participantes_aprobados_click", {});
    setIsModalOpen(true);
  };

  const handleConfirm = (codigoComer: string) => {
    // Construir payload según especificación
    const payload = {
      source: "quick_action",
      intent: "tms.get_participantes_aprobados",
      message: `Necesito los participantes aprobados del código de comercialización ${codigoComer}`,
      target: {
        codigoCotizacion: codigoComer
      }
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
        className="h-auto p-3 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white border-none transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-md w-full"
        title="Consultar participantes aprobados"
      >
        <UserCheck className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-medium truncate">Aprobados</span>
      </Button>

      <AprobadosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};
