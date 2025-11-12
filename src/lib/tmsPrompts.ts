import type { TmsActionType } from "@/components/TmsQuickActions";

export const generateTmsPrompt = (codigoCurso: string, tipo: TmsActionType): string => {
  const templates = {
    R11: `Solicito explícitamente la información del R11 para el codigoCurso: ${codigoCurso}. Entrega:
- Relator creador del R11 (nombre completo)
- Objetivo general
- Población objetivo
- Contenidos específicos R11 (lista con horasT y horasP)
- Nota mínima (si existe)
- Horas teóricas, horas prácticas y total
Usa únicamente la entidad kb_curso que haga match por data.codigoCurso y no mezcles con otros cursos.`,

    R12: `Solicito explícitamente la información del R12 para el codigoCurso: ${codigoCurso}. Entrega:
- Costos R12 desglosados (si existen)
- Observaciones relevantes
Usa únicamente la entidad kb_curso que haga match por data.codigoCurso y no mezcles con otros cursos.`,

    R61: `Solicito explícitamente la información del R61 para el codigoCurso: ${codigoCurso}. Entrega:
- Registros R61 disponibles
- Contenidos específicos R61 (si existen)
Usa únicamente la entidad kb_curso que haga match por data.codigoCurso y no mezcles con otros cursos.`,

    BLOQUES: `Solicito explícitamente la información de los Bloques para el codigoCurso: ${codigoCurso}. Entrega:
- Lista de bloques con fecha, horarioInicio, horarioTermino
- Relator por bloque (nombre completo si está disponible)
Usa únicamente la entidad kb_curso que haga match por data.codigoCurso y no mezcles con otros cursos.`
  };

  return templates[tipo];
};