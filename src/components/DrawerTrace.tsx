import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Search, Wrench } from "lucide-react";

interface Candidate {
  id?: string;
  title?: string;
  score?: number;
  source?: string;
}

interface DrawerTraceProps {
  candidates?: Candidate[];
  toolsCalled?: string[];
  disabled?: boolean;
}

export const DrawerTrace = ({ candidates, toolsCalled, disabled = false }: DrawerTraceProps) => {
  const [open, setOpen] = useState(false);
  
  // Solo mostrar si hay datos de trazabilidad
  if (!candidates?.length && !toolsCalled?.length) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={disabled}
          className="text-xs text-muted-foreground hover:text-primary p-1 h-auto"
        >
          <Search className="h-3 w-3 mr-1" />
          ¿Cómo lo busqué?
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[50vh]">
        <DrawerHeader>
          <DrawerTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4" />
            Trazabilidad de Búsqueda
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-3 overflow-y-auto">
          
          {/* Herramientas utilizadas */}
          {toolsCalled?.length && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                Herramientas Utilizadas
              </h4>
              <div className="flex flex-wrap gap-1">
                {toolsCalled.map((tool, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Candidatos encontrados */}
          {candidates?.length && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                Candidatos Evaluados ({candidates.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {candidates.map((candidate, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {candidate.id || `Candidato ${idx + 1}`}
                      </div>
                      {candidate.title && (
                        <div className="text-muted-foreground truncate text-xs">
                          {candidate.title}
                        </div>
                      )}
                    </div>
                    {candidate.score !== undefined && (
                      <Badge 
                        variant={candidate.score > 0.8 ? "default" : "secondary"}
                        className="ml-2 text-xs"
                      >
                        {(candidate.score * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!candidates?.length && !toolsCalled?.length && (
            <div className="text-center text-muted-foreground text-xs py-4">
              No hay información de trazabilidad disponible
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};