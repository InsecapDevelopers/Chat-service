import { ChatBubble } from './components/ChatBubble';
import { setupGlobalAPI } from './lib/bundleUtils';
import './chatBubbleReset.css';
import './assets/force-larger-ui.css'; // CRÍTICO: Forzar tamaños más grandes en componentes UI
import './index.css';

// Configurar API global al cargar el bundle
setupGlobalAPI();

// Exportación por defecto para el componente principal
export default ChatBubble;