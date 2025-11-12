# Logística Quick Actions

Sistema de acciones rápidas para el rol **logística** en Capin Insight Chat.

## 📋 Componentes

### 1. `ObtenerR11QuickAction.tsx`
Botón individual para solicitar el informe R11.

**Props:**
- `onClick`: Callback que recibe `(intent: string, question: string)`
- `disabled`: Booleano opcional para deshabilitar el botón

**Intent:** `logistica.obtener_r11`  
**Mensaje:** "Necesito obtener el informe R11"  
**Ícono:** FileText (lucide-react)

### 2. `LogisticaQuickActions.tsx`
Componente contenedor con accordion que agrupa todas las quick actions de logística.

**Props:**
- `role`: Rol actual del usuario
- `onActionClick`: Handler para clicks en botones `(intent, question) => void`
- `disabled`: Booleano opcional para deshabilitar todas las acciones

**Renderizado condicional:** Solo se muestra si `role === "logistica"`

## 🎨 Diseño

- **Estilo:** Accordion minimalista que coincide con `SuggestedQuestions`
- **Layout:** `flex-wrap` para botones responsivos
- **Botones:** Pills redondeados con ícono + texto
- **Tamaño:** `size="sm"` para mantener UI compacta
- **Theme:** Usa colores del tema (sin colores custom)

## 🔗 Integración

### En `CapinChat.tsx`:

```tsx
import { LogisticaQuickActions } from "@/features/logistica";

// Handler
const handleLogisticaActionClick = async (intent: string, question: string) => {
  // Construye payload completo con role, intent, user.claims, etc.
  // Nota: Logística es un subrol de TMS, por lo que el role debe ser "tms:logistica"
  const logisticaRole = "tms:logistica";
  // ... construir payload con logisticaRole
};

// Renderizado (solo cuando TMS tiene subrol "logistica")
{selectedRole === "tms" && tmsSubrol === "logistica" && (
  <LogisticaQuickActions 
    role="logistica"
    onActionClick={handleLogisticaActionClick}
    disabled={isTyping || isResettingSession}
  />
)}
```

## 📦 Estructura de Archivos

```
src/features/logistica/
├── ObtenerR11QuickAction.tsx  # Botón individual R11
├── LogisticaQuickActions.tsx  # Contenedor accordion
├── index.ts                   # Exports
└── README.md                  # Esta documentación
```

## 🚀 Backend Integration

El handler `handleLogisticaActionClick` envía un payload con esta estructura:

```typescript
{
  message: "Necesito obtener el informe R11",
  role: "tms:logistica",  // Logística es un subrol de TMS
  intent: "logistica.obtener_r11",
  session_id: sessionId,
  source: "quick_action",
  user: {
    role: "tms:logistica",
    session_id: sessionId,
    tenantId: "insecap",
    claims: {
      rut: user?.claims?.rut ?? user?.sub ?? rut,
      // otros claims del JWT...
    }
  }
}
```

El backend debe implementar el handler para `logistica.obtener_r11` que procese esta estructura.

## ✅ Checklist de Implementación

- [x] Crear `ObtenerR11QuickAction.tsx`
- [x] Crear `LogisticaQuickActions.tsx`
- [x] Crear `index.ts` con exports
- [x] Importar en `CapinChat.tsx`
- [x] Crear `handleLogisticaActionClick`
- [x] Integrar renderizado condicional
- [x] Actualizar tipo `AppRole` en todos los archivos
- [x] Documentación completa
- [ ] Implementar backend handler `logistica.obtener_r11`
- [ ] Testing end-to-end

## 🎯 Próximos Pasos

1. **Backend:** Implementar handler `logistica.obtener_r11` en el servidor
2. **Testing:** Verificar payload structure con el backend
3. **Expansión:** Agregar más acciones según necesidades:
   - `VerOrdenesQuickAction` (logistica.ver_ordenes)
   - `SeguimientoEnviosQuickAction` (logistica.seguimiento_envios)
   - etc.

## 📝 Notas

- El componente sigue el mismo patrón que `AlumnoQuickActions`
- Los botones están diseñados para ser extensibles (fácil agregar más)
- El accordion puede expandirse/contraerse según preferencia del usuario
- El sistema es completamente type-safe con TypeScript
- **Importante:** Logística es un **subrol de TMS** (`tms:logistica`), no un rol independiente
- Las Quick Actions solo se muestran cuando `selectedRole === "tms"` Y `tmsSubrol === "logistica"`
