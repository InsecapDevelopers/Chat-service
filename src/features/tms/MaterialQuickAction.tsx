import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { MaterialCursoModal } from "@/components/MaterialCursoModal";
import { sendCustomTelemetry } from "@/lib/telemetry";

interface MaterialQuickActionProps {
  onActionSend: (payload: {
    source: string;
    intent: string;
    message: string;
    target?: { codigoComer?: string };
  }) => void;
  disabled?: boolean;
  currentRole?: string;
}

export const MaterialQuickAction = ({ 
  onActionSend, 
  disabled = false,
  currentRole = ""
}: MaterialQuickActionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    // Telemetría: click en quick action material
    sendCustomTelemetry("tms_get_material_curso_click", {});
    setIsModalOpen(true);
  };

  const handleConfirm = (codigoCurso: string) => {
    // Construir payload según especificación
    const payload = {
      source: "quick_action",
      intent: "tms.get_recursos_curso",
      message: `Necesito el material del curso ${codigoCurso}`,
      target: {
        codigoComer: codigoCurso
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
        className="h-auto p-3 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white border-none transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-md w-full"
      >
        <BookOpen className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-medium truncate">Recurso de aprendizaje</span>
      </Button>

      <MaterialCursoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};
