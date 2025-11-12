# Feature: Relator Quick Action

## 🎯 Descripción

Quick Action "Relator" visible únicamente para el rol `tms:logistica`, que permite buscar información de relatores por RUT o nombre mediante modal con tabs y envía payloads deterministas al backend.

## 📋 Componentes Implementados

### 1. **RelatorQuickAction.tsx**
- Botón "Relator" con icono `UserSearch`
- Visible solo para `tms:logistica`
- Abre modal de búsqueda al hacer click

### 2. **RelatorSearchModal.tsx**
- Modal con dos tabs: "Por RUT" y "Por Nombre"
- Validación de RUT con formato automático
- Telemetría de eventos `tms_find_relator_click`
- Envío de payloads deterministas

### 3. **RelatorResult.tsx**
- Renderiza resultados como card individual o lista clicable
- Parsea automáticamente datos estructurados
- Chips clicables para re-buscar por RUT específico

### 4. **ActionsRegistry.tsx**
- Sistema de registro no intrusivo para nuevas acciones
- Filtrado por roles para mostrar acciones relevantes

### 5. **AdditionalTmsActions.tsx**
- Contenedor de acciones adicionales por composición
- Integración no intrusiva con TmsQuickActions existente

## 🔧 Integración

### Payload Determinista
```json
{
  "source": "quick_action",
  "intent": "tms.find_relator", 
  "message": "Relator search",
  "role": "tms:logistica",
  "session_id": "uuid...",
  "tenantId": "insecap",
  "target": { 
    "rut": "[RUT del relator]" // o "nombre": "[Nombre del relator]"
  }
}
```

### Respuestas del Backend

**Card individual:**
```
👨‍🏫 [Nombre Completo]
RUT: [RUT del relator]
Email: [email]
Teléfono: [teléfono]
Dirección: [dirección]
Estado: [Vigente/Inactivo]
Fecha creación: [fecha]
id_relator: [ID] ← Requerido para botón "Ir a TMS"
ID Contacto: [ID contacto]
```

**Lista múltiple:**
```
Encontré [N] coincidencias:

[Nombre Completo 1] — [RUT 1]
[Nombre Completo 2] — [RUT 2]
[Nombre Completo 3] — [RUT 3]
```

## 🎨 UX Features

- **Formato automático de RUT**: Formatea automáticamente el RUT ingresado con puntos y guión
- **Validación en tiempo real**: Botones habilitados solo con input válido
- **Chips clicables**: Re-búsqueda automática al seleccionar de lista
- **URLs clicables**: Detecta automáticamente URLs (http/https) en resultados y los convierte en enlaces
- **Telemetría**: Tracking de método usado (rut/nombre)
- **Error handling**: Toasts no bloqueantes para errores

## 🔒 Restricciones de Acceso

- **Visible para**: `tms:logistica` y `tms:diseno&desarrollo`
- **Registry pattern**: Otras acciones pueden agregarse sin modificar código existente
- **No intrusivo**: Acciones TMS originales (R11/R12/R61) inalteradas para otros roles

## 🧪 Testing

### Casos de prueba implementados:
- ✅ Renderizado del botón solo para roles TMS
- ✅ Envío de payload correcto (source, intent, target)
- ✅ Chips re-disparan payload con RUT seleccionado
- ✅ Parsing de resultados estructurados vs no estructurados

### Para probar manualmente:
1. Cambiar rol a `tms` → subrol `logistica` o `diseno&desarrollo`
2. Verificar que aparece botón "Relator" en Quick Actions
3. Hacer búsqueda por RUT del relator
4. Hacer búsqueda por nombre del relator
5. Verificar payloads en DevTools → Network
6. Al obtener resultado con `id_relator`, verificar que aparece botón "Ir a TMS"

## 📁 Estructura de archivos

```
src/features/tms/
├── RelatorQuickAction.tsx      # Botón principal
├── RelatorSearchModal.tsx      # Modal con tabs
├── RelatorResult.tsx           # Renderizado de resultados
├── RelatorResultWrapper.tsx    # Wrapper con detección
├── AdditionalTmsActions.tsx    # Contenedor por composición  
├── ActionsRegistry.tsx         # Sistema de registro
├── useRelatorSearch.ts         # Hook para lógica
├── index.ts                    # Exportaciones
└── __tests__/
    ├── RelatorQuickAction.test.tsx
    └── RelatorResult.test.tsx
```

## 🔄 Flujo de datos

1. **Click en "Relator"** → Abre modal
2. **Submit en tab** → Construye payload con `target: {rut|nombre}`
3. **Envío al API** → `POST /api/chat` con payload determinista  
4. **Respuesta del backend** → Detecta si es card o lista
5. **Renderizado** → Card con datos o chips clicables
6. **Click en chip** → Re-envío con RUT específico

## ✨ Extensibilidad

El sistema de `ActionsRegistry` permite agregar nuevas Quick Actions sin modificar código existente:

```tsx
// Registrar nueva acción
actionsRegistry.register({
  id: "nueva-accion",
  component: <NuevaAccion onActionSend={handler} />,
  roles: ["tms:comercial"],
  order: 2
});
```

La feature está completamente implementada siguiendo el patrón ADD-ONLY/EXTEND-ONLY especificado.