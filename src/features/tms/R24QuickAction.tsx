import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { R24Modal } from "@/components/R24Modal";
import { sendCustomTelemetry } from "@/lib/telemetry";

interface R24QuickActionProps {
  onActionSend: (payload: {
    source: string;
    intent: string;
    message: string;
    target?: { pkCotizacion?: string };
  }) => void;
  disabled?: boolean;
  currentRole?: string;
}

export const R24QuickAction = ({ 
  onActionSend, 
  disabled = false,
  currentRole = ""
}: R24QuickActionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    // Telemetría: click en quick action R24
    sendCustomTelemetry("tms_get_r24_click", {});
    setIsModalOpen(true);
  };

  const handleConfirm = (codigoCotizacion: string) => {
    // Construir payload según especificación
    const payload = {
      source: "quick_action",
      intent: "tms.get_r24",
      message: `Necesito el R24 del código de cotización ${codigoCotizacion}`,
      target: {
        pkCotizacion: codigoCotizacion
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
        className="h-auto p-3 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white border-none transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-md w-full"
        title="Consultar R24"
      >
        <FileText className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-medium truncate">R24</span>
      </Button>

      <R24Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};
