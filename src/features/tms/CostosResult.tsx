import React from "react";

interface CostosResultProps {
  content: string;
}

export const CostosResult = ({ content }: CostosResultProps) => {
  // Detectar si la respuesta contiene información de costos
  const isCostosContent = content.includes("COSTOS") || 
                         content.includes("COSTO TOTAL") ||
                         content.includes("PRECIO VENTA") ||
                         content.includes("Honorarios") ||
                         content.includes("===");

  if (!isCostosContent) {
    // Si no es contenido de costos, mostrar como texto normal con formato preservado
    return <div className="text-sm text-gray-600 whitespace-pre-wrap">{content}</div>;
  }

  // Para contenido de costos, usar fuente monospace para mejor legibilidad
  return (
    <div className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded border">
      {content}
    </div>
  );
};