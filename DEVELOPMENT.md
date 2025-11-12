# Desarrollo del Chat - Guía de CSS

## 🎯 Filosofía de Estilos

El chat React está diseñado para integrarse en el TMS sin causar conflictos. Para lograrlo:

1. **Todos los estilos se encapsulan** bajo `#capin-chat-root`
2. **z-index limitado** al rango 1000-1090 (compatible con Bootstrap)
3. **Sin modificaciones globales** a `body`, `html`, o `*`
4. **Aislamiento CSS** mediante `isolation: isolate`

## 📝 Reglas para Desarrolladores

### ✅ Hacer

```css
/* ✅ BIEN: Usar clases específicas del chat */
.chat-message {
    padding: 1rem;
    background: white;
}

/* ✅ BIEN: Usar variables CSS del chat */
.chat-bubble {
    background-color: hsl(var(--primary));
}

/* ✅ BIEN: z-index en rango seguro */
.chat-modal {
    z-index: 1086;  /* Máximo 1090 */
}
```

### ❌ Evitar

```css
/* ❌ MAL: Modificar selectores globales */
body {
    overflow: hidden;  /* Esto afectará TODO el TMS */
}

/* ❌ MAL: z-index excesivos */
.chat-overlay {
    z-index: 99999;  /* Se reducirá a 1085 automáticamente */
}

/* ❌ MAL: !important innecesarios */
.chat-text {
    color: blue !important;  /* Evitar a menos que sea CRÍTICO */
}

/* ❌ MAL: Resets agresivos */
* {
    all: revert !important;  /* Se reemplazará automáticamente */
}
```

## 🔧 Desarrollo Local

### Configurar Entorno

```bash
# Instalar dependencias
npm install

# Modo desarrollo (con hot reload)
npm run dev

# Build de prueba
npm run build:bundle

# Verificar transformaciones CSS
npm run postbuild:css
```

### Probar Estilos

1. Hacer cambios en componentes React (`.tsx` files)
2. Los estilos Tailwind se compilan automáticamente
3. Ejecutar `npm run build:bundle` para generar el CSS final
4. El script post-build aplica automáticamente las transformaciones
5. Revisar `dist/bundle/style.css` para ver el resultado

### Hot Reload vs Build

- **`npm run dev`**: Para desarrollo rápido, NO aplica transformaciones CSS
- **`npm run build:bundle`**: Build de producción con transformaciones CSS completas

⚠️ **Importante**: Siempre probar en el TMS con `build:bundle` antes de desplegar.

## 🎨 Agregar Nuevos Componentes

### Componente Básico

```tsx
// src/components/MiNuevoComponente.tsx
import { Button } from "@/components/ui/button";

export const MiNuevoComponente = () => {
  return (
    <div className="p-4 bg-background border border-border rounded-lg">
      <h3 className="text-lg font-semibold text-foreground">
        Mi Componente
      </h3>
      <Button 
        variant="primary" 
        className="mt-2"
      >
        Acción
      </Button>
    </div>
  );
};
```

### Componente con z-index

```tsx
// Si tu componente necesita estar encima de otros elementos
export const MiModal = () => {
  return (
    <div 
      className="fixed inset-0 bg-black/80"
      style={{ zIndex: 1086 }}  // Usar style para z-index explícito
    >
      <div 
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6"
        style={{ zIndex: 1087 }}
      >
        {/* Contenido del modal */}
      </div>
    </div>
  );
};
```

⚠️ **Límites de z-index**: No usar valores mayores a 1090. Si necesitas más, consulta con el equipo.

## 🐛 Debugging CSS

### Ver transformaciones aplicadas

El script post-build muestra detalles de las transformaciones:

```
🔧 Post-build CSS transformation starting...

📝 Original CSS size: 78.81 KB

🔒 Step 1: Encapsulating global selectors...
   ✅ Global selectors encapsulated: 19

📊 Step 2: Adjusting z-index values...
   ✅ z-index values adjusted: 9

🗑️  Step 3: Removing global DOM rules...
   ✅ Removed 2 dangerous rules

🔄 Step 4: Replacing aggressive resets...
   ✅ Replaced 1 aggressive resets

🛡️  Step 5: Ensuring chat root isolation...
   ✅ Added chat root isolation rule

🔍 Step 6: Final verification...
   ✅ All checks passed
```

### Comparar CSS antes/después

```bash
# Ver CSS original (sin transformar)
cat dist/bundle/style.original.css | head -n 100

# Ver CSS transformado
cat dist/bundle/style.css | head -n 100

# Buscar selector específico
grep "mi-clase" dist/bundle/style.css
```

### Verificar encapsulación

```bash
# Buscar selectores globales que NO deberían existir
grep "^body {" dist/bundle/style.css  # No debería encontrar nada
grep "^html {" dist/bundle/style.css  # No debería encontrar nada
grep "^\* {" dist/bundle/style.css    # No debería encontrar nada

# Debería encontrar versiones encapsuladas
grep "#capin-chat-root body {" dist/bundle/style.css  # ✅
grep "#capin-chat-root html {" dist/bundle/style.css  # ✅
```

### Verificar z-index

```bash
# Buscar todos los z-index en el CSS
grep -o "z-index: [0-9]*" dist/bundle/style.css | sort -u

# Verificar que ninguno excede 1090
grep "z-index: [0-9]\{5,\}" dist/bundle/style.css  # No debería encontrar nada
```

## 🔄 Modificar el Script de Transformación

Si necesitas ajustar las transformaciones CSS:

### Archivo: `scripts/postbuild-css.js`

```javascript
// Configuración principal (inicio del archivo)
const CHAT_ROOT_SELECTOR = '#capin-chat-root';  // Cambiar selector
const MAX_Z_INDEX = 1090;                         // Cambiar límite
const SAFE_Z_INDEX = 1085;                        // Cambiar default

// Agregar nuevo patrón de encapsulación
const globalSelectors = [
    /^\*(?:\s|,|$)/,
    /^html(?:\s|,|$)/,
    /^body(?:\s|,|$)/,
    /^\[data-radix-/,
    /^:root(?:\s|,|$)/,
    /^\.mi-selector-global/,  // ← Agregar aquí
];

// Agregar nuevo patrón peligroso
const dangerousPatterns = [
    /body\[style\*=["']overflow:\s*hidden["']\]\s*{[^}]*}/gi,
    /body\s*>\s*\[data-radix-portal\]\s*{[^}]*}/gi,
    /mi-patron-peligroso/gi,  // ← Agregar aquí
];
```

### Probar cambios

```bash
# Ejecutar solo el post-build
npm run postbuild:css

# O hacer un build completo
npm run build:bundle
```

## 📦 Dependencias CSS

### Tailwind CSS

El proyecto usa Tailwind para estilos. Configuración en `tailwind.bundle.config.ts`:

```typescript
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",  // Archivos a escanear
  ],
  theme: {
    extend: {
      colors: {
        // Variables CSS personalizadas
        primary: "hsl(var(--primary))",
        accent: "hsl(var(--accent))",
        // ...
      },
    },
  },
  // ...
}
```

### Radix UI

Componentes de Radix usan `data-*` attributes que se encapsulan automáticamente:

```css
/* Antes */
[data-radix-dialog-overlay] {
    z-index: 1000000;
}

/* Después (transformado) */
#capin-chat-root [data-radix-dialog-overlay] {
    z-index: 1085;
}
```

## ✅ Checklist Pre-Deploy

Antes de hacer merge a `main` o `production`:

- [ ] Ejecutar `npm run build:bundle` sin errores
- [ ] Verificar que el script post-build muestra "✅ All checks passed"
- [ ] Probar en el TMS localmente
- [ ] Verificar que no hay conflictos con modales del TMS
- [ ] Verificar que no hay conflictos con dropdowns del TMS
- [ ] Inspeccionar `style.css` para asegurar encapsulación
- [ ] Comparar `style.original.css` vs `style.css` si hay dudas
- [ ] Documentar cualquier cambio en z-index o selectores especiales

## 🚨 Errores Comunes

### Error: "Found unencapsulated selector"

```
❌ Found unencapsulated "body" selector
```

**Solución**: Agregar el patrón al array `globalSelectors` en el script post-build.

### Error: "z-index exceeds maximum"

```
❌ z-index 99999 exceeds maximum (1090)
```

**Solución**: El script debería corregirlo automáticamente. Si no, revisar el regex de z-index.

### Warning: "z-index X → 1085"

Esto es normal. El script reduce z-index excesivos a valores seguros.

## 📚 Recursos

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
