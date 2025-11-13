import { useState } from "react";
import { SafeButton as Button } from "@/components/ui/safe-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MaterialCursoModal } from "./MaterialCursoModal";
import { DiplomaModal } from "./DiplomaModal";
import { BookOpen, Calendar, FileText, GraduationCap, Package, ListChecks, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type QuestionItem = {
  label: string;
  prompt: string;
  isModal?: boolean;
  isIntent?: boolean;
  intent?: string;
  icon?: LucideIcon;
};

type Props = {
  onAsk: (display: string, actual?: string) => void;
  role?: string;
  isMobile?: boolean;
  disabled?: boolean;
  onDiplomaRequest?: (rut: string) => void;
  onClienteIntentRequest?: (intent: string, label: string) => void;
  onRelatorIntentRequest?: (intent: string, label: string) => void;
};

const alumnoQuestions = [
  {
    label: "Ver mis notas",
    prompt:
      "Muéstrame mis notas del alumno actual. Si hay varias asignaturas, lista cada curso con sus notas en viñetas.",
  },
  {
    label: "Mi asistencia",
    prompt:
      "Muéstrame mi asistencia (porcentaje y detalle si existe) del alumno actual. Resume por curso. No mezcles las notas con asistencia",
  },
  {
    label: "Cursos inscritos",
    prompt: `Muéstrame mis cursos inscritos del alumno actual. 
Devuelve ÚNICAMENTE el listado de cursos numerado (1., 2., 3., …), SIN incluir notas ni comentarios adicionales.
Usa EXACTAMENTE este estilo:

1. Nombre del curso 1 + codigoUnico
2. Nombre del curso 2 + codigoUnico
3. Nombre del curso 3 + codigoUnico

No agregues encabezados, ni texto extra; solo el listado numerado de cursos.`,
  },
];

const relatorQuestions: QuestionItem[] = [
  {
    label: "Mis cursos dictados",
    prompt: "relator.ver_cursos",
    icon: BookOpen,
    isIntent: true,
    intent: "relator.ver_cursos",
  },
  {
    label: "Recurso de aprendizaje",
    prompt: "__MODAL_MATERIAL__",
    isModal: true,
    icon: BookOpen,
  },
];

const clienteQuestions: QuestionItem[] = [
  {
    label: "Mis cursos",
    prompt: "__INTENT_cliente.get_mis_cursos__",
    isIntent: true,
    intent: "cliente.get_mis_cursos",
    icon: ListChecks,
  },
  {
    label: "Próximos cursos",
    prompt: "__INTENT_cliente.get_proximos_cursos__",
    isIntent: true,
    intent: "cliente.get_proximos_cursos",
    icon: Calendar,
  },
  {
    label: "Diploma",
    prompt: "__MODAL_DIPLOMA__",
    isModal: true,
    intent: "cliente.get_diploma",
    icon: Award,
  },
];

export const SuggestedQuestions = ({ 
  onAsk, 
  role, 
  isMobile = false, 
  disabled = false, 
  onDiplomaRequest,
  onClienteIntentRequest,
  onRelatorIntentRequest
}: Props) => {
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isDiplomaModalOpen, setIsDiplomaModalOpen] = useState(false);

  if (role !== "alumno" && role !== "relator" && role !== "cliente") return null;

  let questions;
  let titleText;
  
  if (role === "alumno") {
    questions = alumnoQuestions;
    titleText = "Preguntas rápidas";
  } else if (role === "relator") {
    questions = relatorQuestions;
    titleText = "Consultas de relator";
  } else if (role === "cliente") {
    questions = clienteQuestions;
    titleText = "Consultas de cliente";
  }

  const handleQuestionClick = (q: QuestionItem) => {
    // Si es el botón de Material para relator, abrir modal
    if (q.isModal && q.prompt === "__MODAL_MATERIAL__") {
      setIsMaterialModalOpen(true);
    } else if (q.isModal && q.prompt === "__MODAL_DIPLOMA__") {
      // Si es el botón de Diploma para cliente, abrir modal
      setIsDiplomaModalOpen(true);
    } else if (q.isIntent && q.intent && onRelatorIntentRequest && role === "relator") {
      // Si es un intent de relator, llamar al handler específico
      onRelatorIntentRequest(q.intent, q.label);
    } else if (q.isIntent && q.intent && onClienteIntentRequest && role === "cliente") {
      // Si es un intent de cliente, llamar al handler específico
      onClienteIntentRequest(q.intent, q.label);
    } else {
      onAsk(q.label, q.prompt);
    }
  };

  const handleMaterialConfirm = (codigoCurso: string) => {
    const message = `Necesito el material del curso ${codigoCurso}`;
    onAsk(message, message);
  };

  const handleDiplomaConfirm = (rut: string) => {
    if (onDiplomaRequest) {
      onDiplomaRequest(rut);
    }
  };

  return (
    <>
      <div className="border-b bg-background/70">
        <Accordion type="single" collapsible defaultValue={isMobile ? undefined : "sug"}>
          <AccordionItem value="sug" className="border-b-0">
            <AccordionTrigger 
              className="px-4 pt-3 pb-2 text-xs text-muted-foreground hover:no-underline"
              aria-label={`Mostrar/ocultar ${titleText.toLowerCase()}`}
            >
              {titleText}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-2 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {questions.map((q: QuestionItem) => {
                  const Icon = q.icon;
                  return (
                    <Button
                      type="button"
                      key={q.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuestionClick(q)}
                      disabled={disabled}
                      className="rounded-full disabled:opacity-50 disabled:cursor-not-allowed justify-start gap-2 w-full"
                    >
                      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                      <span className="truncate">{q.label}</span>
                    </Button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Modal de Material solo para relator */}
      {role === "relator" && (
        <MaterialCursoModal
          isOpen={isMaterialModalOpen}
          onClose={() => setIsMaterialModalOpen(false)}
          onConfirm={handleMaterialConfirm}
        />
      )}

      {/* Modal de Diploma solo para cliente */}
      {role === "cliente" && (
        <DiplomaModal
          isOpen={isDiplomaModalOpen}
          onClose={() => setIsDiplomaModalOpen(false)}
          onSubmit={handleDiplomaConfirm}
        />
      )}
    </>
  );
};
