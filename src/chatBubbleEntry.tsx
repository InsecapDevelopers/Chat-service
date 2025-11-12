import { ChatBubble } from './components/ChatBubble';
import { setupGlobalAPI } from './lib/bundleUtils';
import './chatBubbleReset.css';
import './index.css';

// Configurar API global al cargar el bundle
setupGlobalAPI();

// Exportación por defecto para el componente principal
export default ChatBubble;