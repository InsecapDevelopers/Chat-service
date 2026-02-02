# Configuración de Proxy y Variables de Entorno

## Resumen

Este proyecto tiene 3 modos de operación diferentes, cada uno con su configuración de endpoints:

### 1. **Desarrollo Local** (`npm run dev`)
- **Archivo**: `.env.development`
- **Modo Vite**: `development`
- **Endpoints**: Relativos (`/api/chat`, `/api/telemetry`, etc.)
- **Proxy**: ✅ Activo - Vite redirige a `https://rag.insecap.cl`
- **Uso**: Desarrollo local con hot-reload

```bash
npm run dev
# Levanta servidor en localhost:8080
# Las llamadas a /api/* se redirigen automáticamente a https://rag.insecap.cl
```

### 2. **Build Standalone** (`npm run build`)
- **Archivo**: `.env.production`
- **Modo Vite**: `production`
- **Endpoints**: Relativos (`/api/chat`, `/api/telemetry`, etc.)
- **Proxy**: ✅ Requerido en servidor de producción
- **Uso**: Deploy en Render, Vercel, etc. con proxy configurado

```bash
npm run build
# Genera build en dist/ para deploy standalone
# El servidor de producción debe tener proxy configurado
```

**Configuración de proxy en servidor (ejemplo Express):**
```javascript
app.use('/api', createProxyMiddleware({
  target: 'https://rag.insecap.cl',
  changeOrigin: true
}));
```

### 3. **Build Bundle Embebido** (`npm run build:bundle`)
- **Archivo**: `.env.prod`
- **Modo Vite**: `prod`
- **Endpoints**: Absolutos (`https://rag.insecap.cl/api/chat`, etc.)
- **Proxy**: ❌ No necesario - Llamadas directas con CORS
- **Uso**: Embebido en TMS u otras aplicaciones

```bash
npm run build:bundle
# Genera bundle en dist/bundle/ para embeber
# El bundle hace llamadas directas a https://rag.insecap.cl
# Requiere CORS configurado en el backend
```

## Archivos de Configuración

### `.env.development` (Desarrollo Local)
```env
VITE_API_ENDPOINT=/api/chat
VITE_TELEMETRY_ENDPOINT=/api/telemetry
VITE_CONTACT_ENDPOINT=/api/contact
VITE_CANCEL_ENDPOINT=/api/chat/cancel
```

### `.env.production` (Standalone con Proxy)
```env
VITE_API_ENDPOINT=/api/chat
VITE_TELEMETRY_ENDPOINT=/api/telemetry
VITE_CONTACT_ENDPOINT=/api/contact
VITE_CANCEL_ENDPOINT=/api/chat/cancel
```

### `.env.prod` (Bundle Embebido sin Proxy)
```env
VITE_API_ENDPOINT=https://rag.insecap.cl/api/chat
VITE_TELEMETRY_ENDPOINT=https://rag.insecap.cl/api/telemetry
VITE_CONTACT_ENDPOINT=https://rag.insecap.cl/api/contact
VITE_CANCEL_ENDPOINT=https://rag.insecap.cl/api/chat/cancel
```

## Configuración de Vite

### `vite.config.ts` (Desarrollo y Standalone)
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api/chat': {
        target: 'https://rag.insecap.cl',
        changeOrigin: true,
        secure: true
      },
      '/api/telemetry': {
        target: 'https://rag.insecap.cl',
        changeOrigin: true,
        secure: true
      },
      // ... más endpoints
    }
  }
});
```

### `vite.bundle.config.ts` (Bundle Embebido)
```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      // Inyecta URLs absolutas en el bundle
      'import.meta.env.VITE_API_ENDPOINT': JSON.stringify(env.VITE_API_ENDPOINT),
      'import.meta.env.VITE_TELEMETRY_ENDPOINT': JSON.stringify(env.VITE_TELEMETRY_ENDPOINT),
      // ...
    }
  };
});
```

## Flujo de Trabajo

### Para Desarrollo
```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar en modo desarrollo
npm run dev

# 3. Acceder a http://localhost:8080
# El proxy de Vite maneja todas las llamadas a /api/*
```

### Para Build Standalone (Render/Vercel)
```bash
# 1. Build de producción
npm run build

# 2. Preview local (opcional)
npm run preview

# 3. Deploy
# Configurar proxy en el servidor antes de deployar
```

### Para Build Bundle (TMS)
```bash
# 1. Build del bundle embebido
npm run build:bundle

# 2. Los archivos se generan en:
# - dist/bundle/capin-chat-bubble.umd.js
# - dist/bundle/capin-chat-bubble.es.js
# - dist/bundle/style.css

# 3. Se copian automáticamente a:
# C:\TMS\TMS\Content\js\Chat (si existe)
```

## Endpoints Disponibles

| Endpoint | Desarrollo | Standalone | Bundle |
|----------|-----------|------------|--------|
| Chat | `/api/chat` | `/api/chat` | `https://rag.insecap.cl/api/chat` |
| Telemetría | `/api/telemetry` | `/api/telemetry` | `https://rag.insecap.cl/api/telemetry` |
| Contacto | `/api/contact` | `/api/contact` | `https://rag.insecap.cl/api/contact` |
| Cancelar | `/api/chat/cancel/:id` | `/api/chat/cancel/:id` | `https://rag.insecap.cl/api/chat/cancel/:id` |
| Activo | `/api/chat/active` | `/api/chat/active` | `https://rag.insecap.cl/api/chat/active` |

## Troubleshooting

### Error: CORS en bundle embebido
**Problema**: El bundle embebido no puede hacer llamadas API
**Solución**: Verificar que `https://rag.insecap.cl` tenga CORS habilitado

### Error: 404 en standalone
**Problema**: Las llamadas a `/api/*` dan 404
**Solución**: Configurar proxy en el servidor de producción

### Error: Variables de entorno no se cargan
**Problema**: `import.meta.env.VITE_*` es undefined
**Solución**: 
- Verificar que el archivo `.env.*` correspondiente exista
- Todas las variables deben empezar con `VITE_`
- Reiniciar el servidor de desarrollo

### Error: browserslist desactualizado
**Solución**:
```bash
npx update-browserslist-db@latest
```

## Scripts de Package.json

```json
{
  "scripts": {
    "dev": "vite",                          // Desarrollo con proxy
    "build": "vite build",                  // Standalone con proxy
    "build:bundle": "vite build --config vite.bundle.config.ts --mode prod",  // Bundle embebido sin proxy
    "preview": "vite preview"               // Preview del build standalone
  }
}
```

## Notas Importantes

1. **CORS**: El bundle embebido requiere CORS configurado en `https://rag.insecap.cl`
2. **Proxy en Producción**: El build standalone requiere proxy configurado en el servidor
3. **Variables de Entorno**: Usar el archivo `.env.*` correcto según el modo
4. **Modo Vite**: `development`, `production`, o `prod` - cada uno carga su archivo `.env.*`
5. **Seguridad**: No incluir tokens o secretos en variables `VITE_*` (se exponen al cliente)
