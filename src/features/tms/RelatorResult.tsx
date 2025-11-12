import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RelatorResultProps {
  content: string;
  onRelatorSelect?: (rut: string) => void;
}

// Función para convertir URLs en enlaces clicables
const linkifyText = (text: string): React.ReactNode => {
  // Regex para detectar URLs (http, https)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export const RelatorResult = ({ content, onRelatorSelect }: RelatorResultProps) => {
  // Detectar si la respuesta contiene listado de múltiples coincidencias
  const isMultipleResults = content.includes("Encontré varias coincidencias") || 
                           content.includes("Relatores encontrados") ||
                           content.includes("Se encontraron") ||
                           content.includes("relatores") ||
                           content.includes("múltiples") ||
                           /\d+\s+relatores/.test(content);
  

  
  if (isMultipleResults && onRelatorSelect) {
    return <RelatorList content={content} onRelatorSelect={onRelatorSelect} />;
  }
  
  // Para resultado único, extraer ID del relator y mostrar botón TMS
  // Buscar ID en la respuesta del RAG con varios formatos posibles
  // Prioridad: id_relator > ID del Relator > ID Relator > ID Contacto > ID genérico
  const idMatch = content.match(/id_relator:\s*(\d+)/i) ||
                  content.match(/ID\s+del\s+Relator:\s*(\d+)/i) ||
                  content.match(/ID\s+Relator:\s*(\d+)/i) ||
                  content.match(/Relator\s+ID:\s*(\d+)/i) ||
                  content.match(/ID\s+Contacto:\s*(\d+)/i) || // Usar ID Contacto si no hay otro
                  content.match(/^ID:\s*(\d+)/im); // ID: al inicio de línea como último recurso
  const relatorId = idMatch ? idMatch[1] : null;

  // Procesar el contenido línea por línea para mantener saltos de línea
  const contentLines = content.split('\n').map((line, lineIndex) => (
    <React.Fragment key={lineIndex}>
      {linkifyText(line)}
      {lineIndex < content.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">{contentLines}</div>
      {relatorId && (
        <Button
          variant="outline"
          className="mt-2"
          size="sm"
          onClick={() => window.open(`https://tms.insecap.cl/Relator/Details/${relatorId}`, '_blank')}
        >
          Ir a TMS
        </Button>
      )}
    </div>
  );
};

const RelatorList = ({ content, onRelatorSelect }: { content: string; onRelatorSelect: (rut: string) => void }) => {
  // Parsear líneas que contengan "Nombre — RUT" o patrones similares
  const parseRelatorsFromContent = (text: string) => {
    const lines = text.split('\n');
    const relatores: Array<{ nombre: string; rut: string }> = [];
    
    for (const line of lines) {
      // Limpiar la línea
      const cleanLine = line.trim();
      if (!cleanLine) continue;
      
      // Buscar patrón exacto "Nombre — RUT"
      const match = cleanLine.match(/^(.+?)\s*—\s*(\d{1,2}\.\d{3}\.\d{3}[-.][\dKk])\s*$/);
      if (match) {
        const nombre = match[1].trim();
        const rut = match[2].trim();
        // Evitar duplicados
        if (!relatores.some(r => r.rut === rut)) {
          relatores.push({ nombre, rut });
        }
        continue;
      }
      
      // Buscar patrón con números "1. Nombre — RUT" o "Nombre — RUT"
      const numberedMatch = cleanLine.match(/^(?:\d+\.\s*)?(.+?)\s*[—-]\s*(\d{1,2}\.\d{3}\.\d{3}[-.][\dKk])\s*$/);
      if (numberedMatch) {
        const nombre = numberedMatch[1].trim();
        const rut = numberedMatch[2].trim();
        // Evitar duplicados
        if (!relatores.some(r => r.rut === rut)) {
          relatores.push({ nombre, rut });
        }
      }
    }
    
    return relatores;
  };

  const relatores = parseRelatorsFromContent(content);



  if (relatores.length === 0) {
    return <div className="text-sm text-gray-600 whitespace-pre-wrap">{content}</div>;
  }

  return (
    <div className="mt-3 space-y-1">
      <p className="text-sm font-medium text-gray-700 mb-2">Relatores encontrados (haz clic para buscar):</p>
      <div className="space-y-1">
        {relatores.map((relator, index) => (
          <div
            key={index}
            onClick={() => onRelatorSelect(relator.rut)}
            className="flex items-center gap-2 p-2 rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
          >
            <span className="text-sm font-medium text-gray-500 min-w-[20px]">
              {index + 1}.
            </span>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">
                {relator.nombre}
              </span>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-100 group-hover:bg-blue-100">
                {relator.rut}
              </Badge>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};