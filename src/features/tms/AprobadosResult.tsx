import { SafeButton as Button } from "@/components/ui/safe-button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, UserSearch } from "lucide-react";

interface AprobadosResultProps {
  content: string;
  onParticipanteSelect?: (rut: string) => void;
}

export const AprobadosResult = ({ content, onParticipanteSelect }: AprobadosResultProps) => {
  // Extraer información del encabezado
  const lines = content.split('\n');
  
  // Función para extraer enlaces R23
  const extractR23Links = () => {
    // Regex más flexible que detecta múltiples patrones
    const r23Regex = /(?:-\s+)?(?:📄\s+)?R23:\s*(https?:\/\/[^\s]+)/gi;
    const links: Array<{ participante: number; rut: string; url: string }> = [];
    
    let participanteNum = 0;
    let currentRut = "";
    
    for (const line of lines) {
      // Detectar número de participante
      const participanteMatch = line.match(/^(\d+)\.\s+Participante/);
      if (participanteMatch) {
        participanteNum = parseInt(participanteMatch[1]);
      }
      
      // Detectar RUT
      const rutMatch = line.match(/RUT:\s*([\d.]+[-.][\dKk])/);
      if (rutMatch) {
        currentRut = rutMatch[1];
      }
      
      // Detectar enlace R23 con regex más flexible
      const matches = Array.from(line.matchAll(r23Regex));
      for (const match of matches) {
        if (match[1] && participanteNum > 0 && currentRut) {
          links.push({
            participante: participanteNum,
            rut: currentRut,
            url: match[1]
          });
        }
      }
    }
    
    return links;
  };

  const r23Links = extractR23Links();

  // Función para parsear participantes del contenido
  const parseParticipantes = () => {
    const participantes: Array<{ num: number; nombre?: string; rut: string; r23Url?: string }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Buscar líneas con número y nombre del participante (formato: "1. Hernan Silva Chavez")
      const participanteMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (participanteMatch && !line.includes('-') && !line.includes('RUT') && !line.includes('Correo') && !line.includes('R23')) {
        const num = parseInt(participanteMatch[1]);
        const nombre = participanteMatch[2].trim();
        let rut = "";
        let r23Url = "";
        
        // Buscar RUT y R23 en las siguientes líneas
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim();
          
          // Buscar RUT (formato: "- RUT: 15.211.701-9")
          const rutMatch = nextLine.match(/-\s*RUT:\s*([\d.]+[-.][\dKk])/i);
          if (rutMatch) {
            rut = rutMatch[1];
          }
          
          // Buscar enlace R23 (formato: "- 📄 R23: https://...")
          const r23Match = nextLine.match(/-\s*📄\s*R23:\s*(https?:\/\/[^\s]+)/i);
          if (r23Match) {
            r23Url = r23Match[1];
            break; // Ya tenemos toda la info, salir del loop
          }
        }
        
        if (rut) {
          participantes.push({ num, nombre, rut, r23Url });
        }
      }
    }
    
    return participantes;
  };

  const participantes = parseParticipantes();

  // Extraer encabezado (todo antes del primer participante con número)
  const primeraLinea = lines.findIndex(line => {
    const trimmed = line.trim();
    // Buscar línea que empiece con número seguido de punto y nombre (no contenga guiones, RUT, Correo)
    return /^\d+\.\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(trimmed) && 
           !trimmed.includes('-') && 
           !trimmed.includes('RUT') && 
           !trimmed.includes('Correo');
  });
  const header = primeraLinea > 0 ? lines.slice(0, primeraLinea).join('\n') : '';
  
  // Si no hay participantes y primeraLinea es -1, usar todo el contenido como header
  const finalHeader = participantes.length === 0 && primeraLinea === -1 ? content : header;

  console.info('🔍 AprobadosResult Debug:', {
    totalLines: lines.length,
    primeraLinea,
    headerLength: header.length,
    finalHeaderLength: finalHeader.length,
    participantesCount: participantes.length,
    firstLines: lines.slice(0, 5)
  });

  return (
    <div className="space-y-3 w-full">
      {/* Encabezado con información del curso */}
      {finalHeader && (
        <div className="text-sm text-gray-700 font-medium border-b border-gray-200 pb-2 whitespace-pre-wrap">
          {finalHeader}
        </div>
      )}

      {/* Lista de participantes clickeables */}
      {participantes.length > 0 && (
        <div className="space-y-2">
          {participantes.map((participante, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all duration-200 group"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-600">
                    {participante.num}.
                  </span>
                  {participante.nombre && (
                    <span className="text-sm font-medium text-gray-800 group-hover:text-cyan-700">
                      {participante.nombre}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs bg-gray-100 group-hover:bg-cyan-100">
                    RUT: {participante.rut}
                  </Badge>
                  
                  {/* Botón para buscar más info del participante */}
                  {onParticipanteSelect && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onParticipanteSelect(participante.rut)}
                      className="h-6 px-2 text-xs text-cyan-600 hover:text-cyan-700 hover:bg-cyan-100"
                      title="Ver información completa del participante"
                    >
                      <UserSearch className="h-3 w-3 mr-1" />
                      Ver info
                    </Button>
                  )}
                  
                  {/* Botón R23 */}
                  {participante.r23Url && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                      title="Ver R23"
                    >
                      <a href={participante.r23Url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span className="text-xs font-medium">R23</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {participantes.length > 0 && (
        <div className="text-xs text-muted-foreground pt-2 border-t border-gray-200">
          💡 Total de participantes: {participantes.length}
        </div>
      )}
    </div>
  );
};
