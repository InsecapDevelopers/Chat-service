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
import { BookOpen, Calendar, FileText, GraduationCap, Package, ListChecks, Award, UserCircle } from "lucide-react";
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
  onMaterialRequest?: (codigoCurso: string) => void;
  onClienteIntentRequest?: (intent: string, label: string) => void;
  onRelatorIntentRequest?: (intent: string, label: string) => void;
  onPublicoIntentRequest?: (intent: string, label: string) => void;
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

const publicoQuestions: QuestionItem[] = [
  {
    label: "Ayuda",
    prompt: "__INTENT_publico.get_comercial_turno__",
    isIntent: true,
    intent: "publico.get_comercial_turno",
    icon: UserCircle,
  },
];

const tmsQuestions: QuestionItem[] = [
  {
    label: "Relator",
    prompt: "Necesito información de un relator",
    icon: UserCircle,
  },
  {
    label: "Estimar Costos",
    prompt: "Quiero estimar los costos de un curso",
    icon: ListChecks,
  },
];

const postcursoQuestions: QuestionItem[] = [
  {
    label: "Relator",
    prompt: "Necesito información de un relator",
    icon: UserCircle,
  },
  {
    label: "Aprobados",
    prompt: "Quiero ver la lista de participantes aprobados",
    icon: ListChecks,
  },
  {
    label: "R24",
    prompt: "Necesito acceder a la evaluación post-curso",
    icon: FileText,
  },
  {
    label: "Participante",
    prompt: "Quiero información de un participante específico",
    icon: UserCircle,
  },
];

const comercialQuestions: QuestionItem[] = [
  {
    label: "Relator",
    prompt: "Necesito información de un relator",
    icon: UserCircle,
  },
  {
    label: "Búsqueda de Costos",
    prompt: "Quiero consultar costos de una comercialización",
    icon: Package,
  },
  {
    label: "Estimar Costos",
    prompt: "Quiero estimar los costos de un curso",
    icon: ListChecks,
  },
];

const logisticaQuestions: QuestionItem[] = [
  {
    label: "Relator",
    prompt: "Necesito información de un relator",
    icon: UserCircle,
  },
  {
    label: "Costos",
    prompt: "Quiero consultar costos de un curso",
    icon: Package,
  },
  {
    label: "Consultar R11",
    prompt: "Necesito ver la información técnica del curso",
    icon: FileText,
  },
  {
    label: "Recurso de a...",
    prompt: "Quiero acceder a los recursos de aprendizaje",
    icon: BookOpen,
  },
  {
    label: "Estimar Costos",
    prompt: "Quiero estimar los costos de un curso",
    icon: ListChecks,
  },
];

const disenoQuestions: QuestionItem[] = [
  {
    label: "Relator",
    prompt: "Necesito información de un relator",
    icon: UserCircle,
  },
  {
    label: "Recurso de a...",
    prompt: "Quiero acceder a los recursos de aprendizaje",
    icon: BookOpen,
  },
  {
    label: "Estimar Costos",
    prompt: "Quiero estimar los costos de un curso",
    icon: ListChecks,
  },
];

const facturacionQuestions: QuestionItem[] = [
  {
    label: "Consultas de Facturación",
    prompt: "Tengo una consulta relacionada con facturación",
    icon: FileText,
  },
];

const coordinadorQuestions: QuestionItem[] = [
  {
    label: "Relator",
    prompt: "Necesito información de un relator",
    icon: UserCircle,
  },
  {
    label: "Estimar Costos",
    prompt: "Quiero estimar los costos de un curso",
    icon: ListChecks,
  },
];

export const SuggestedQuestions = ({
  onAsk, 
  role, 
  isMobile = false, 
  disabled = false, 
  onDiplomaRequest,
  onMaterialRequest,
  onClienteIntentRequest,
  onRelatorIntentRequest,
  onPublicoIntentRequest
}: Props) => {
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isDiplomaModalOpen, setIsDiplomaModalOpen] = useState(false);

  // Validar rol: acepta todos los roles conocidos
  const isTmsRole = role === "tms" || (typeof role === 'string' && role.startsWith('tms'));
  const isValidRole = role === "alumno" || role === "relator" || role === "cliente" || role === "publico" || isTmsRole;
  
  if (!isValidRole) return null;

  let questions: QuestionItem[] = [];
  let titleText = "";
  
  // Asignar preguntas según el rol
  if (role === "alumno") {
    questions = alumnoQuestions;
    titleText = "Preguntas rápidas";
  } else if (role === "relator") {
    questions = relatorQuestions;
    titleText = "Consultas de relator";
  } else if (role === "cliente") {
    questions = clienteQuestions;
    titleText = "Consultas de cliente";
  } else if (role === "publico") {
    questions = publicoQuestions;
    titleText = "Preguntas frecuentes";
  } else if (role === "tms:postcurso" || role === "tms:post-curso") {
    questions = postcursoQuestions;
    titleText = "Consultas Post-Curso";
  } else if (role === "tms:comercial") {
    questions = comercialQuestions;
    titleText = "Consultas de Comercial";
  } else if (role === "tms:logistica") {
    questions = logisticaQuestions;
    titleText = "Consultas de Logística";
  } else if (role === "tms:diseno&desarrollo" || role === "tms:diseno") {
    questions = disenoQuestions;
    titleText = "Consultas de Diseño";
  } else if (role === "tms:facturacion") {
    questions = facturacionQuestions;
    titleText = "Consultas de Facturación";
  } else if (role === "tms:coordinador" || role === "tms") {
    questions = coordinadorQuestions;
    titleText = "Preguntas frecuentes TMS";
  } else if (isTmsRole) {
    // Fallback para cualquier otro rol TMS desconocido
    questions = tmsQuestions;
    titleText = "Preguntas frecuentes TMS";
  }

  // Si no hay preguntas asignadas, no renderizar
  if (!questions || questions.length === 0) return null;

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
    } else if (q.isIntent && q.intent && onPublicoIntentRequest && role === "publico") {
      // Si es un intent de publico, llamar al handler específico
      onPublicoIntentRequest(q.intent, q.label);
    } else {
      onAsk(q.label, q.prompt);
    }
  };

  const handleMaterialConfirm = (codigoCurso: string) => {
    if (onMaterialRequest) {
      onMaterialRequest(codigoCurso);
    }
  };

  const handleDiplomaConfirm = (rut: string) => {
    if (onDiplomaRequest) {
      onDiplomaRequest(rut);
    }
  };

  return (
    <>
      <div className="border-b bg-background/70">
        <Accordion type="single" collapsible defaultValue="sug">
          <AccordionItem value="sug" className="border-b-0">
            <AccordionTrigger 
              className="px-4 pt-3 pb-2 text-xs font-semibold text-blue-600 hover:no-underline hover:text-blue-700"
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
                      className="rounded-full disabled:opacity-50 disabled:cursor-not-allowed justify-start gap-2 w-full bg-blue-500 hover:bg-blue-600 text-white border-blue-600 shadow-md"
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
