import { RelatorResult } from "./RelatorResult";
import { useRelatorSearch } from "./useRelatorSearch";

interface RelatorResultWrapperProps {
  content: string;
  intent?: string;
  onActionSend: (payload: {
    source: string;
    intent: string;
    message: string;
    target: { rut?: string; nombre?: string };
  }) => void;
}

export const RelatorResultWrapper = ({ 
  content, 
  intent, 
  onActionSend 
}: RelatorResultWrapperProps) => {
  const { handleRelatorSelect, isRelatorResult } = useRelatorSearch(onActionSend);

  // Solo renderizar si es un resultado de relator
  if (!isRelatorResult(content, intent)) {
    return null;
  }

  return (
    <div className="mt-3">
      <RelatorResult 
        content={content} 
        onRelatorSelect={handleRelatorSelect} 
      />
    </div>
  );
};