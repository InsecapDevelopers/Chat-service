import { useMemo } from "react";

type ConversationMode = "guided" | "free";

interface UseConversationModeProps {
  lastSource?: string;
  lastIntent?: string;
}

export const useConversationMode = ({ 
  lastSource, 
  lastIntent 
}: UseConversationModeProps): ConversationMode => {
  return useMemo(() => {
    // Modo guided: tiene source="quick_action" e intent definido
    if (lastSource === "quick_action" && lastIntent) {
      return "guided";
    }
    // Modo free: cualquier otro caso (chat_input o sin source)
    return "free";
  }, [lastSource, lastIntent]);
};

// Hook para detectar hints de comparación en texto libre
export const useComparisonHints = (message: string): { wants_compare: boolean } => {
  return useMemo(() => {
    const compareKeywords = [
      "comparar", "versus", "vs", "mejor entre", "diferencia entre", 
      "cuál es mejor", "comparación", "diferencias", "similitudes"
    ];
    
    const lowerMessage = message.toLowerCase();
    const wants_compare = compareKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    return { wants_compare };
  }, [message]);
};