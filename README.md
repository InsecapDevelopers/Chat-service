# CapinIA Frontend RAG Chat

Este proyecto es un **frontend web** basado en tecnología [Lovable](https://lovable.dev), diseñado para integrarse como un **chat embebido en el TMS** de Insecap SPA.

## 📌 Objetivo

Proporcionar una interfaz de usuario moderna para interactuar con el servicio RAG (Retrieval-Augmented Generation) que utiliza **Azure Cosmos DB NoSQL** y **modelos OpenAI**.  
El chat permitirá a los usuarios consultar información de cursos, clientes, participantes, documentos y procesos internos, respetando **roles de acceso** y **sensibilidad** de la información.

## 🚀 Tecnologías utilizadas

- **Vite** – Empaquetador rápido para desarrollo y producción.
- **TypeScript** – Tipado estático para JavaScript.
- **React** – Librería para construir interfaces de usuario.
- **shadcn-ui** – Componentes UI modernos y accesibles.
- **Tailwind CSS** – Framework CSS utilitario.

## 📂 Estructura del proyecto

```
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── pages/           # Páginas principales
│   ├── hooks/           # Hooks personalizados
│   ├── lib/             # Funciones utilitarias
│   ├── styles/          # Estilos globales
│   ├── main.tsx         # Punto de entrada React
│   └── App.tsx          # Componente raíz
├── index.html           # HTML base
├── package.json         # Dependencias y scripts
└── tailwind.config.js   # Configuración de Tailwind
```

## 🛠 Instalación y ejecución

Requisitos previos:
- Node.js >= 18
- npm >= 9

Pasos para ejecutar el proyecto en local:

```sh
# Clonar el repositorio
git clone https://github.com/CapinIA/Chat-service
cd Chat-service

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

## 🧠 Modo Libre (Free Mode)

Este frontend implementa **dual-mode routing** para soportar tanto consultas guiadas (con intents específicos) como modo libre (chat abierto).

### Características principales:
- **Modo Guiado (🎯 Guided)**: Quick Actions TMS con payloads deterministas que incluyen `intent`
- **Modo Libre (💭 Free)**: Chat abierto que envía payloads sin `intent` permitiendo consultas flexibles
- **Debugging UI**: Indicadores visuales y alertas cuando el backend fuerza guided mode
- **Telemetría**: Sistema de tracking no intrusivo para análisis de uso

### Testing del Modo Libre:
Para probar la implementación completa, abrir:
```
http://localhost:5173/test-free-mode.html
```

### Payload Structure:

**Free Mode Payload:**
```json
{
  "message": "¿Qué cursos están disponibles?",
  "role": "tms:coordinador",
  "session_id": "uuid...",
  "source": "chat_input"
}
```

**Guided Mode Payload:**
```json
{
  "message": "Consulta R11...",
  "role": "tms:coordinador", 
  "session_id": "uuid...",
  "source": "quick_action",
  "intent": "tms.get_r11"
}
```

### Indicadores UI:
- **ChipModo**: Muestra el modo actual (`🎯 Guided` vs `💭 Free`)
- **DebugBanner**: Alertas cuando hay mode mismatch entre frontend y backend
- **Console Logs**: Verificación de payloads y detección de inconsistencias

### Backend Compatibility:
- Compatible con `FREE_MODE_ENABLED=true` para modo libre completo
- Detecta automáticamente cuando `FREE_MODE_ENABLED=false` fuerza guided mode
- Mantiene 100% backward compatibility con flows TMS existentes

## 🔗 Integración con TMS

El chat puede ser embebido en el TMS mediante un **iframe** o componente web, apuntando a la URL de despliegue de este frontend.  
Se recomienda configurar el dominio y permisos CORS en el servicio backend para permitir la carga dentro del TMS.

## 📦 Despliegue

Puede desplegarse en cualquier plataforma compatible con proyectos estáticos de Vite, como:
- Azure Static Web Apps
- Vercel
- Netlify
- GitHub Pages

## 📜 Licencia

Uso interno exclusivo para Insecap SPA.
