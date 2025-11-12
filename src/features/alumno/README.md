# Feature: Alumno Quick Actions

## 🎯 Descripción

Quick Actions "Alumno" visible únicamente para el rol `alumno`, que permite acceder rápidamente a información académica personal mediante botones de acción directa que envían payloads deterministas al backend.

## 📋 Componentes Implementados

### 1. **AlumnoQuickActions.tsx**
- Accordion con Quick Actions para alumno
- Visible solo para rol `alumno`
- Grid responsive (1 columna móvil, 2 columnas desktop)
- Diseño con tema azul educativo 🎓

### 2. **MisDatosQuickAction.tsx**
- Botón "👨‍🎓 Mi Información"
- Intent: `alumno.mis_datos`
- Icono: `User` (lucide-react)
- Tema: Azul

### 3. **VerNotasQuickAction.tsx**
- Botón "📊 Mis Notas"
- Intent: `alumno.ver_notas`
- Icono: `BarChart3` (lucide-react)
- Tema: Verde

### 4. **VerAsistenciaQuickAction.tsx**
- Botón "📅 Mi Asistencia"
- Intent: `alumno.ver_asistencia`
- Icono: `Calendar` (lucide-react)
- Tema: Morado

### 5. **VerCursosQuickAction.tsx**
- Botón "📚 Mis Cursos"
- Intent: `alumno.ver_cursos`
- Icono: `BookOpen` (lucide-react)
- Tema: Naranja

## 🔧 Integración con CapinChat

### Reemplazo de SuggestedQuestions
Los Quick Actions de Alumno **reemplazan** los botones de preguntas sugeridas (`SuggestedQuestions`) para el rol `alumno`. Esto proporciona:
- ✅ Intents deterministas enviados al backend
- ✅ Mejor UX con iconos y colores temáticos
- ✅ Consistencia con el patrón de TMS Quick Actions
- ✅ Grid responsive 2 columnas en desktop

Los roles `relator` y `cliente` siguen usando `SuggestedQuestions`.

### Payload Determinista
```json
{
  "source": "quick_action",
  "intent": "alumno.mis_datos", // o ver_notas, ver_asistencia, ver_cursos
  "message": "Muéstrame mi información académica completa",
  "role": "alumno",
  "session_id": "uuid...",
  "user": {
    "role": "alumno",
    "session_id": "uuid...",
    "tenantId": "insecap",
    "claims": {}
  }
}
```

### Respuestas del Backend

**Mi Información:**
```
👨‍🎓 MI INFORMACIÓN ACADÉMICA

**DATOS PERSONALES**
RUT: 12.345.678-9
Nombre: Juan Pérez González
Email: juan.perez@alumno.insecap.cl
Teléfono: +56 9 8765 4321
...
```

**Mis Notas:**
```
📊 NOTAS DEL ALUMNO

**CALIFICACIONES**
- Matemáticas: 6.5
- Historia: 5.8
- Química: 6.2
...
```

**Mi Asistencia:**
```
📅 REGISTRO DE ASISTENCIA

**RESUMEN**
Total clases: 40
Asistencias: 35 (87.5%)
Ausencias: 5 (12.5%)
...
```

**Mis Cursos:**
```
📚 CURSOS INSCRITOS

**ACTIVOS**
1. Lógica de Programación
   - Código: LOG-2024-01
   - Inicio: 15/03/2024
   - Estado: En curso
...
```

## 🎨 UX Features

- **Botones de acción directa**: Sin modales ni inputs adicionales
- **Colores temáticos**: Azul (datos), Verde (notas), Morado (asistencia), Naranja (cursos)
- **Iconografía clara**: Emojis + lucide-react icons
- **Responsive**: Grid adaptativo para móvil y desktop
- **Estado deshabilitado**: Durante carga o procesamiento
- **Accordion colapsable**: Para ahorrar espacio en pantalla

## 🔒 Restricciones de Acceso

- **Visible para**: `alumno` únicamente
- **Oculto para**: `tms:*`, `publico`, `relator`, `cliente`
- **Validación backend**: Handlers validan `role_base == "alumno"`

## 🧪 Testing

### Casos de prueba sugeridos:
- ✅ Renderizado del accordion solo para rol `alumno`
- ✅ Envío de payload correcto (source, intent, message)
- ✅ 4 botones visibles y clickeables
- ✅ Cada botón envía su intent específico
- ✅ Deshabilitar durante isTyping o isResettingSession
- ✅ No renderizar para otros roles

### Para probar manualmente:
1. Cambiar rol a `alumno` en selector de rol
2. Verificar que aparece accordion "Consultas Rápidas - Alumno"
3. Expandir accordion
4. Hacer clic en cada botón:
   - 👨‍🎓 Mi Información → `alumno.mis_datos`
   - 📊 Mis Notas → `alumno.ver_notas`
   - 📅 Mi Asistencia → `alumno.ver_asistencia`
   - 📚 Mis Cursos → `alumno.ver_cursos`
5. Verificar payloads en DevTools → Network
6. Verificar respuestas formateadas en chat

## 📁 Estructura de archivos

```
src/features/alumno/
├── AlumnoQuickActions.tsx       # Componente principal con accordion
├── MisDatosQuickAction.tsx      # Botón "Mi Información"
├── VerNotasQuickAction.tsx      # Botón "Mis Notas"
├── VerAsistenciaQuickAction.tsx # Botón "Mi Asistencia"
├── VerCursosQuickAction.tsx     # Botón "Mis Cursos"
├── index.ts                     # Exportaciones
└── README.md                    # Documentación
```

## 🔄 Flujo de datos

1. **Click en botón** → Envía intent específico
2. **handleAlumnoActionClick** → Adapta firma para handleAdditionalActionSend
3. **handleAdditionalActionSend** → Construye payload completo
4. **POST /api/chat** → Payload con `source: "quick_action"` e `intent: "alumno.*"`
5. **Backend handler** → Procesa según intent (mis_datos, ver_notas, etc.)
6. **Respuesta formateada** → Mensaje del asistente en chat

## 📊 Resumen de Intents

| Quick Action | Intent | Pregunta Default | Handler Backend |
|-------------|--------|------------------|-----------------|
| 👨‍🎓 Mi Información | `alumno.mis_datos` | "Muéstrame mi información académica completa" | `handle_alumno_mis_datos` |
| 📊 Mis Notas | `alumno.ver_notas` | "Muéstrame mis notas y calificaciones" | `handle_alumno_ver_notas` |
| 📅 Mi Asistencia | `alumno.ver_asistencia` | "Muéstrame mi registro de asistencia" | `handle_alumno_ver_asistencia` |
| 📚 Mis Cursos | `alumno.ver_cursos` | "Muéstrame mis cursos inscritos" | `handle_alumno_ver_cursos` |

## ✨ Diferencias con TmsQuickActions

| Aspecto | TmsQuickActions | AlumnoQuickActions |
|---------|-----------------|-------------------|
| **Entrada de datos** | Modal con input (código curso, RUT) | Sin input (acción directa) |
| **Target** | Requiere `target: { codigoComer }` o `{ rut }` | Sin target (usa JWT del alumno) |
| **Roles** | Múltiples subroles TMS | Solo `alumno` |
| **Componentes** | 3 acciones + AdditionalActions | 4 acciones simples |
| **Complejidad** | Media (modales, validación) | Baja (botones directos) |

## 🚀 Estado de Implementación

### Frontend ✅
- [x] Crear `AlumnoQuickActions.tsx`
- [x] Crear `MisDatosQuickAction.tsx`
- [x] Crear `VerNotasQuickAction.tsx`
- [x] Crear `VerAsistenciaQuickAction.tsx`
- [x] Crear `VerCursosQuickAction.tsx`
- [x] Integrar en `CapinChat.tsx`
- [x] Handler `handleAlumnoActionClick`
- [x] Documentación README

### Backend ✅ (Ya Completado)
- [x] Handler `handle_alumno_mis_datos`
- [x] Handler `handle_alumno_ver_notas`
- [x] Handler `handle_alumno_ver_asistencia`
- [x] Handler `handle_alumno_ver_cursos`
- [x] Prompts especializados en `participante_prompts.py`
- [x] Tests unitarios (7/7 passing)

### Pendiente 🔄
- [ ] Tests unitarios frontend (Vitest)
- [ ] Tests de integración
- [ ] Integrar handlers en orchestrator
- [ ] Extraer RUT del JWT en backend
- [ ] Tests end-to-end

## 📝 Notas Importantes

1. **Seguridad**: El RUT del alumno debe extraerse del JWT en el backend, nunca del frontend
2. **Validación**: Los handlers backend validan `role_base == "alumno"`
3. **Simplicidad**: No requiere inputs adicionales (a diferencia de TMS)
4. **Consistencia**: Sigue el patrón de payload con intent del sistema
5. **UX**: Botones con colores temáticos para mejor diferenciación visual

---

**Implementado por**: GitHub Copilot  
**Fecha**: 2025-10-13  
**Patrón**: Quick Actions con Payload Determinista
