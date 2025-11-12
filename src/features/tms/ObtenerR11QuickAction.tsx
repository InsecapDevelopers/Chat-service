import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { sendCustomTelemetry } from "@/lib/telemetry";

interface ObtenerR11QuickActionProps {
  onActionSend: (payload: {
    source: string;
    intent: string;
    message: string;
  }) => void;
  disabled?: boolean;
  currentRole?: string;
}

export const ObtenerR11QuickAction = ({ 
  onActionSend, 
  disabled = false,
  currentRole = ""
}: ObtenerR11QuickActionProps) => {

  const handleClick = () => {
    // Telemetría: click en quick action obtener R11
    sendCustomTelemetry("tms_obtener_r11_click", {});

    // Construir payload según especificación
    const payload = {
      source: "quick_action",
      intent: "logistica.obtener_r11",
      message: "Necesito obtener el informe R11"
    };

    onActionSend(payload);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className="h-auto p-3 flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white border-none transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
    >
      <FileText className="h-4 w-4" />
      <span className="text-xs font-medium">Obtener R11</span>
    </Button>
  );
};
