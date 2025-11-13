import React from "react";
import { SafeButton as Button } from "@/components/ui/safe-button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";

interface ParticipanteResultProps {
  content: string;
  onParticipanteSelect?: (rut: string) => void;
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

// Parsear información de un participante individual
const parseSingleParticipante = (text: string) => {
  const lines = text.split('\n');
  let nombre = "";
  let rut = "";
  let correo = "";
  let participaciones = "";
  const r23Links: string[] = [];
  const r24Links: string[] = [];
  const otherInfo: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Buscar nombre (puede estar en varias formas)
    if (trimmed.match(/^Nombre:/i)) {
      nombre = trimmed.replace(/^Nombre:\s*/i, '').trim();
    } else if (trimmed.match(/^Participante:/i)) {
      nombre = trimmed.replace(/^Participante:\s*/i, '').trim();
    }
    
    // Buscar RUT
    const rutMatch = trimmed.match(/RUT:\s*([\d.]+[-.][\dKk])/i);
    if (rutMatch) {
      rut = rutMatch[1];
    }
    
    // Buscar Correo
    const correoMatch = trimmed.match(/Correo:\s*(.+@.+)/i);
    if (correoMatch) {
      correo = correoMatch[1].trim();
    }
    
    // Buscar Participaciones
    const participacionesMatch = trimmed.match(/Participaciones?:\s*(\d+)/i);
    if (participacionesMatch) {
      participaciones = participacionesMatch[1];
    }
    
    // Buscar enlaces R23
    const r23Match = trimmed.match(/R23:\s*(https?:\/\/[^\s]+)/i);
    if (r23Match) {
      r23Links.push(r23Match[1]);
    }
    
    // Buscar enlaces R24
    const r24Match = trimmed.match(/R24:\s*(https?:\/\/[^\s]+)/i);
    if (r24Match) {
      r24Links.push(r24Match[1]);
    }
    
    // Guardar otra información relevante (cursos, fechas, etc.)
    if (trimmed && 
        !trimmed.match(/^(Nombre|Participante|RUT|Correo|Participaciones?):/i) &&
        !trimmed.includes('R23:') &&
        !trimmed.includes('R24:') &&
        trimmed.length > 2) {
      otherInfo.push(trimmed);
    }
  }
  
  return { nombre, rut, correo, participaciones, r23Links, r24Links, otherInfo };
};

export const ParticipanteResult = ({ content, onParticipanteSelect }: ParticipanteResultProps) => {
  // Detectar si la respuesta contiene listado de múltiples coincidencias
  // Verificar si tiene el patrón "Se encontraron X participante(s)" o múltiples líneas numeradas
  const hasMultiplePattern = /Se encontraron \d+ participante/i.test(content) || 
                            content.includes("Encontré varias") ||
                            content.includes("Participantes encontrados") ||
                            content.includes("coinciden con");
  
  // Contar cuántas líneas numeradas hay (ej: "1. Nombre", "2. Nombre")
  const numberedLines = content.match(/^\d+\.\s+[A-ZÁÉÍÓÚÑ]/gm);
  const hasMultipleNumbered = numberedLines && numberedLines.length > 1;
  
  // Si detectamos patrón múltiple O hay más de una línea numerada, mostrar lista
  if ((hasMultiplePattern || hasMultipleNumbered) && onParticipanteSelect) {
    return <ParticipanteList content={content} onParticipanteSelect={onParticipanteSelect} />;
  }
  
  // Para resultado único, intentar parsearlo como tarjeta
  const participanteData = parseSingleParticipante(content);
  
  // Si tenemos al menos nombre o RUT, mostrar como tarjeta
  if (participanteData.nombre || participanteData.rut) {
    return <SingleParticipanteCard data={participanteData} fullContent={content} />;
  }
  
  // Fallback: mostrar contenido tal cual
  const contentLines = content.split('\n').map((line, lineIndex) => (
    <React.Fragment key={lineIndex}>
      {linkifyText(line)}
      {lineIndex < content.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">{contentLines}</div>
    </div>
  );
};

// Componente para mostrar un participante individual en formato tarjeta
const SingleParticipanteCard = ({ data, fullContent }: { 
  data: { 
    nombre: string; 
    rut: string; 
    correo: string; 
    participaciones: string; 
    r23Links: string[]; 
    r24Links: string[]; 
    otherInfo: string[] 
  }; 
  fullContent: string 
}) => {
  return (
    <div className="mt-3 space-y-3">
      {/* Tarjeta principal del participante */}
      <div className="p-4 rounded-lg border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-white">
        <div className="space-y-3">
          {/* Nombre del participante */}
          {data.nombre && (
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-gray-800">
                {data.nombre}
              </div>
            </div>
          )}
          
          {/* Badges: RUT y Participaciones */}
          <div className="flex flex-wrap items-center gap-2">
            {data.rut && (
              <Badge variant="secondary" className="text-sm px-3 py-1 bg-cyan-100 text-cyan-800 border border-cyan-200">
                RUT: {data.rut}
              </Badge>
            )}
            
            {data.participaciones && (
              <Badge variant="outline" className="text-sm px-3 py-1 border-cyan-400 text-cyan-700 bg-white">
                {data.participaciones} participación{data.participaciones !== '1' ? 'es' : ''}
              </Badge>
            )}
          </div>
          
          {/* Correo */}
          {data.correo && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">📧 Correo:</span>
              <span>{data.correo}</span>
            </div>
          )}
          
          {/* Otra información (cursos, fechas, etc.) */}
          {data.otherInfo.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-cyan-100">
              {data.otherInfo.map((info, idx) => (
                <div key={idx} className="text-sm text-gray-600">
                  {linkifyText(info)}
                </div>
              ))}
            </div>
          )}
          
          {/* Botones R23 y R24 */}
          {(data.r23Links.length > 0 || data.r24Links.length > 0) && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-cyan-100">
              {data.r23Links.map((link, idx) => (
                <Button
                  key={`r23-${idx}`}
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(link, '_blank')}
                  className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  R23 {data.r23Links.length > 1 ? `(${idx + 1})` : ''}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              ))}
              
              {data.r24Links.map((link, idx) => (
                <Button
                  key={`r24-${idx}`}
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(link, '_blank')}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  R24 {data.r24Links.length > 1 ? `(${idx + 1})` : ''}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ParticipanteList = ({ content, onParticipanteSelect }: { content: string; onParticipanteSelect: (rut: string) => void }) => {
  // Parsear participantes del formato de búsqueda
  const parseParticipantesFromContent = (text: string) => {
    const lines = text.split('\n');
    const participantes: Array<{ num: number; nombre: string; rut: string; correo?: string; participaciones?: string }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Buscar líneas con número y nombre del participante (formato: "1. Gabriel Antonio Marin Muñoz")
      const participanteMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (participanteMatch && !line.includes('-') && !line.includes('RUT') && !line.includes('Correo') && !line.includes('Participaciones')) {
        const num = parseInt(participanteMatch[1]);
        const nombre = participanteMatch[2].trim();
        let rut = "";
        let correo = "";
        let participaciones = "";
        
        // Buscar RUT, Correo y Participaciones en las siguientes líneas
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim();
          
          // Buscar RUT (formato: "- RUT: 13.747.764-5")
          const rutMatch = nextLine.match(/-\s*RUT:\s*([\d.]+[-.][\dKk])/i);
          if (rutMatch) {
            rut = rutMatch[1];
          }
          
          // Buscar Correo (formato: "- Correo: email@example.com")
          const correoMatch = nextLine.match(/-\s*Correo:\s*(.+)/i);
          if (correoMatch) {
            correo = correoMatch[1].trim();
          }
          
          // Buscar Participaciones (formato: "- Participaciones: 6")
          const participacionesMatch = nextLine.match(/-\s*Participaciones:\s*(\d+)/i);
          if (participacionesMatch) {
            participaciones = participacionesMatch[1];
            break; // Ya tenemos toda la info, salir del loop
          }
        }
        
        if (rut) {
          participantes.push({ num, nombre, rut, correo, participaciones });
        }
      }
    }
    
    return participantes;
  };

  const participantes = parseParticipantesFromContent(content);

  if (participantes.length === 0) {
    return <div className="text-sm text-gray-600 whitespace-pre-wrap">{content}</div>;
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm font-medium text-gray-700 mb-2">
        🔍 {participantes.length} participante(s) encontrado(s) - haz clic para ver información completa:
      </p>
      <div className="space-y-2">
        {participantes.map((participante) => (
          <div
            key={participante.num}
            onClick={() => onParticipanteSelect(participante.rut)}
            className="flex flex-col gap-2 p-3 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-start gap-2">
              <span className="text-sm font-bold text-gray-500 min-w-[24px]">
                {participante.num}.
              </span>
              <div className="flex-1 space-y-1">
                <div className="text-sm font-medium text-gray-800 group-hover:text-cyan-700">
                  {participante.nombre}
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-100 group-hover:bg-cyan-100">
                    RUT: {participante.rut}
                  </Badge>
                  
                  {participante.participaciones && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 border-cyan-300 text-cyan-700 bg-cyan-50">
                      {participante.participaciones} participación{participante.participaciones !== '1' ? 'es' : ''}
                    </Badge>
                  )}
                </div>
                
                {participante.correo && (
                  <div className="text-xs text-gray-500">
                    📧 {participante.correo}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground pt-2 border-t border-gray-200">
        💡 Haz clic en cualquier participante para ver su información detallada
      </div>
    </div>
  );
};
