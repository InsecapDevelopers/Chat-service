/**
 * Mapeo de roles de base de datos TMS a roles del chat Capin
 * 
 * Este módulo transforma los roles tal como vienen de la BD de TMS
 * a los roles que entiende el sistema de chat y el RAG.
 */

type AppRole = "tms" | "publico" | "alumno" | "relator" | "cliente";

export interface TMSRoleMapping {
  /** Rol original de la BD TMS */
  tmsRole: string;
  /** Rol transformado para el chat */
  capinRole: AppRole | `tms:${string}`;
  /** Si es true, el usuario puede cambiar de rol (solo Admin) */
  canSwitchRole: boolean;
  /** Etiqueta legible para mostrar */
  displayLabel: string;
}

// Set para rastrear roles desconocidos y evitar spam
const warnedRoles = new Set<string>();

/**
 * Mapea un rol de TMS BD a su equivalente en el chat
 */
export function mapTmsRoleToCapin(tmsRole: string | undefined | null): TMSRoleMapping {
  // Si no hay rol, es público
  if (!tmsRole) {
    return {
      tmsRole: 'publico',
      capinRole: 'publico',
      canSwitchRole: false,
      displayLabel: 'Público'
    };
  }

  const normalized = tmsRole.toLowerCase().trim();

  switch (normalized) {
    // ADMINISTRADOR - Puede cambiar de rol libremente, mantener como "publico" por defecto
    case 'administrador':
      return {
        tmsRole: 'DigitaciónYPostCurso',
        capinRole: 'publico', // Rol por defecto, pero puede cambiarlo
        canSwitchRole: true,
        displayLabel: 'Administrador'
      };

    // RELATOR - Rol directo del select
    case 'relator':
      return {
        tmsRole: 'Relator',
        capinRole: 'relator',
        canSwitchRole: false,
        displayLabel: 'Relator'
      };

    // DIGITACIÓN Y POSTCURSO -> tms:postcurso
    case 'digitaciónpostcurso':
    case 'digitación postcurso':
    case 'digitaciónypostcurso':
    case 'digitación y postcurso':
      return {
        tmsRole: 'DigitaciónYPostCurso',
        capinRole: 'tms:postcurso',
        canSwitchRole: false,
        displayLabel: 'Post Curso'
      };

    // REPRESENTANTE EMPRESA -> cliente
    case 'representante empresa':
    case 'representanteempresa':
      return {
        tmsRole: 'Representante Empresa',
        capinRole: 'cliente',
        canSwitchRole: false,
        displayLabel: 'Cliente'
      };

    // PARTICIPANTE / ALUMNO -> alumno
    case 'participante':
    case 'alumno':
    case 'estudiante':
      return {
        tmsRole: 'Participante',
        capinRole: 'alumno',
        canSwitchRole: false,
        displayLabel: 'Alumno'
      };

    // LIDER COMERCIAL -> tms:comercial
    case 'lider comercial':
    case 'lidercomercial':
      return {
        tmsRole: 'Lider Comercial',
        capinRole: 'tms:comercial',
        canSwitchRole: false,
        displayLabel: 'Comercial'
      };

    // DISEÑO & DESARROLLO -> tms:diseño&desarrollo
    case 'diseño & desarrollo':
    case 'diseño y desarrollo':
    case 'diseñoydesarrollo':
    case 'diseno & desarrollo':
    case 'diseno y desarrollo':
      return {
        tmsRole: 'Diseño & Desarrollo',
        capinRole: 'tms:diseno&desarrollo',
        canSwitchRole: false,
        displayLabel: 'Diseño & Desarrollo'
      };

    // LOGISTICA -> tms:logistica
    case 'logistica':
    case 'logística':
      return {
        tmsRole: 'Logistica',
        capinRole: 'tms:logistica',
        canSwitchRole: false,
        displayLabel: 'Logística'
      };

    // DISEÑO GRÁFICO -> tms:diseno
    case 'diseño grafico':
    case 'diseño gráfico':
    case 'diseñografico':
    case 'diseno grafico':
      return {
        tmsRole: 'Diseño Gráfico',
        capinRole: 'tms:diseno',
        canSwitchRole: false,
        displayLabel: 'Diseño'
      };

    // FACTURACIÓN -> tms:facturacion
    case 'facturacion':
    case 'facturación':
      return {
        tmsRole: 'Facturacion',
        capinRole: 'tms:facturacion',
        canSwitchRole: false,
        displayLabel: 'Facturación'
      };

    // GERENCIA -> Puede cambiar de rol libremente (como administrador)
    case 'gerencia':
      return {
        tmsRole: 'GERENCIA',
        capinRole: 'publico', // Rol por defecto, pero puede cambiarlo
        canSwitchRole: true,
        displayLabel: 'Gerencia'
      };

    // ROLES ADICIONALES CON ACCESO
    case 'tica':
      return {
        tmsRole: 'TICA',
        capinRole: 'tms:administrador',
        canSwitchRole: false,
        displayLabel: 'TICA'
      };

    case 'adm sucursal':
    case 'admsucursal':
      return {
        tmsRole: 'Adm Sucursal',
        capinRole: 'tms:administrador',
        canSwitchRole: false,
        displayLabel: 'Admin Sucursal'
      };

    case 'apoyo tms':
    case 'apoyotms':
      return {
        tmsRole: 'APOYO TMS',
        capinRole: 'tms:administrador',
        canSwitchRole: false,
        displayLabel: 'Apoyo TMS'
      };

    // ROLES SIN ACCESO (retornar null para que TMS no muestre el chat)
    case 'mantencion':
    case 'mantención':
    case 'jefaturas':
    case 'sinpermiso':
    case 'facturaciont':
      return {
        tmsRole: tmsRole,
        capinRole: 'publico', // Fallback, pero TMS debería no renderizar el chat
        canSwitchRole: false,
        displayLabel: 'Sin acceso'
      };

    // FALLBACK - Rol desconocido = público
    default:
      if (!warnedRoles.has(normalized)) {
        console.warn(`[TMS Role Mapper] Rol desconocido: "${tmsRole}", asignando público`);
        warnedRoles.add(normalized);
      }
      return {
        tmsRole: tmsRole,
        capinRole: 'publico',
        canSwitchRole: false,
        displayLabel: 'Público'
      };
  }
}

/**
 * Extrae el subrol de un rol compuesto tipo "tms:subrol"
 */
export function extractTmsSubrole(role: string): string | null {
  if (role.startsWith('tms:')) {
    return role.substring(4);
  }
  return null;
}

/**
 * Valida si un rol tiene permiso para acceder al chat
 */
export function hasAccessToChat(tmsRole: string | undefined | null): boolean {
  if (!tmsRole) return true; // Público tiene acceso

  const normalized = tmsRole.toLowerCase().trim();
  
  // Roles explícitamente bloqueados
  const blockedRoles = [
    'mantencion',
    'mantención',
    'jefaturas',
    'sinpermiso',
    'facturaciont'
  ];

  return !blockedRoles.includes(normalized);
}
