import { useState, useCallback } from "react";

interface UseRelatorSearchReturn {
  handleRelatorSelect: (rut: string) => void;
  isRelatorResult: (content: string, intent?: string) => boolean;
}

export const useRelatorSearch = (
  onActionSend: (payload: {
    source: string;
    intent: string;
    message: string;
    target: { rut?: string; nombre?: string };
  }) => void
): UseRelatorSearchReturn => {
  
  const handleRelatorSelect = useCallback((rut: string) => {
    // Re-disparar búsqueda por RUT específico
    onActionSend({
      source: "quick_action",
      intent: "tms.find_relator",
      message: "Relator search",
      target: { rut }
    });
  }, [onActionSend]);

  const isRelatorResult = useCallback((content: string, intent?: string): boolean => {
    // Detectar si es una respuesta de búsqueda de relator
    return intent === "tms.find_relator" || 
           content.toLowerCase().includes("relator") ||
           content.toLowerCase().includes("instructor");
  }, []);

  return {
    handleRelatorSelect,
    isRelatorResult
  };
};