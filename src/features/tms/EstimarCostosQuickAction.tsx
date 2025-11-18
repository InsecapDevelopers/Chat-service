import { useState } from "react";
import { SafeButton as Button } from "@/components/ui/safe-button";
import { Calculator } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EstimarCostosQuickActionProps {
  onActionSend: (payload: {
    source: string;
    intent: string;
    message: string;
    target?: { codigoCurso?: string };
  }) => void;
  disabled?: boolean;
  currentRole?: string;
}

export const EstimarCostosQuickAction = ({
  onActionSend,
  disabled = false,
  currentRole = "",
}: EstimarCostosQuickActionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [codigoCurso, setCodigoCurso] = useState("");
  const [error, setError] = useState("");

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    setError("");

    if (!codigoCurso.trim()) {
      setError("El código de curso es requerido");
      return;
    }

    // Construir el mensaje con contexto detallado para el RAG
    const promptMessage = `Necesito estimar los costos de elementos prácticos para el curso con código: ${codigoCurso.trim()}

**CONTEXTO Y OBJETIVO:**
Este curso es práctico y NO tiene costos R12 asociados registrados en el sistema. Necesito que analices el R11 del curso (especialmente los campos: fundamentacionTecnica, contenidosEspecificosR11, materialDidactico, materialEntregable, horasPracticas) y determines QUÉ ELEMENTOS MATERIALES se necesitan para ejercer el curso de manera práctica.

**INSTRUCCIONES:**
1. Busca el curso con código ${codigoCurso.trim()} en la base de conocimiento
2. Analiza detalladamente el R11, enfocándote en:
   - La fundamentación técnica del curso
   - Los contenidos específicos prácticos (horasP > 0)
   - Material didáctico y entregable mencionado
   - El tipo de industria/área al que pertenece el curso
3. Infiere y lista los elementos/materiales necesarios para realizar las prácticas, por ejemplo:
   - EPPs (Elementos de Protección Personal) específicos según la actividad
   - Herramientas y equipos necesarios
   - Materiales consumibles (varillas de soldadura, cables, componentes, etc.)
   - Equipamiento de seguridad
   - Cualquier otro elemento material requerido

**FORMATO DE RESPUESTA ESPERADO:**
Proporciona una lista estructurada y detallada de los elementos con estimación de cantidades aproximadas considerando:
- Cantidad de participantes típica del curso (según R11)
- Duración de las horas prácticas
- Naturaleza de las actividades prácticas descritas

**IMPORTANTE:** Esta información es para que el Comercial tenga en cuenta estos elementos al momento de valorizar y vender el curso al cliente. Sé específico y práctico en tus recomendaciones.`;

    // Enviar la acción con el intent y el prompt detallado
    onActionSend({
      source: currentRole || "tms:comercial",
      intent: "tms.get_costo_estimado",
      message: promptMessage,
      target: { codigoCurso: codigoCurso.trim() },
    });

    // Resetear y cerrar
    setCodigoCurso("");
    setError("");
    setIsModalOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className="h-auto p-3 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white border-none transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-md w-full"
        title="Estimar costos de elementos prácticos"
      >
        <Calculator className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-medium truncate">Estimar Costos</span>
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Estimar Costos del Curso</DialogTitle>
            <DialogDescription>
              Ingresa el código del curso para estimar los costos asociados.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="codigo-curso">
                Código de Curso <span className="text-red-500">*</span>
              </Label>
              <Input
                id="codigo-curso"
                placeholder="Ej: CURSO123"
                value={codigoCurso}
                onChange={(e) => setCodigoCurso(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
              💡 Este código se utilizará para consultar la estimación de costos en TMS.
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setCodigoCurso("");
                setError("");
              }}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit}>
              Estimar Costos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
