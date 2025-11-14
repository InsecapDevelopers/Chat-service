import { useState, useRef, useEffect, useCallback } from "react";
import { SafeButton as Button } from "@/components/ui/safe-button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { ContextMenu, type ContextObject } from "./ContextMenu";
import { ContextCard } from "./ContextCard";

export type { ContextObject };

interface ChatInputProps {
  onSendMessage: (text: string, contexts?: ContextObject[]) => void;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>; // ref externo opcional (focus, etc)
  showContextMenu?: boolean; // botón "+" solo en rol TMS
}

export const ChatInput = ({
  onSendMessage,
  disabled,
  inputRef,
  showContextMenu = false,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [showCodeHint, setShowCodeHint] = useState(false);
  const [contexts, setContexts] = useState<ContextObject[]>([]);

  // Ref interna REAL del textarea, siempre la misma
  const innerRef = useRef<HTMLTextAreaElement>(null);

  // Helper para ajustar altura dinámica
  const autoGrow = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    const maxPx = 300;
    el.style.height = Math.min(el.scrollHeight, maxPx) + "px";
  }, []);

  // Sync de altura cuando cambia el mensaje
  useEffect(() => {
    autoGrow(innerRef.current);
  }, [message, autoGrow]);

  // Detectar patrón de código de curso
  useEffect(() => {
    const courseCodePattern = /^R-[A-Z]{3}-\d+$/i;
    const trimmedMessage = message.trim();
    setShowCodeHint(courseCodePattern.test(trimmedMessage));
  }, [message]);

  // Foco externo inicial desde CapinChat
  useEffect(() => {
    if (inputRef?.current) {
      inputRef.current.focus();
    } else if (innerRef.current) {
      innerRef.current.focus();
    }
  }, [inputRef]);

  // Agregar contextos
  const handleAddContext = (context: ContextObject) => {
    if (contexts.length < 5) {
      setContexts((prev) => [...prev, context]);
    }
  };

  const handleRemoveContext = (id: string) => {
    setContexts((prev) => prev.filter((c) => c.id !== id));
  };

  // Reset visual del textarea al estado inicial bajo (44px aprox)
  const resetTextareaHeight = () => {
    if (innerRef.current) {
      innerRef.current.style.height = "44px";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const text = message.trim();
    if (!text) return;

    onSendMessage(text, contexts.length > 0 ? contexts : undefined);

    // limpiar mensaje y contextos
    setMessage("");
    setContexts([]);

    // reset altura del textarea
    resetTextareaHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMessage(e.target.value);
    autoGrow(e.target);
  };

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <form onSubmit={handleSubmit} className="p-2 sm:p-3 md:p-4">
        {/* Contextos agregados */}
        {contexts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {contexts.map((ctx) => (
              <ContextCard
                key={ctx.id}
                context={ctx}
                onRemove={handleRemoveContext}
              />
            ))}
          </div>
        )}

        <div className="flex gap-1.5 sm:gap-2 items-end">
          {/* Botón de adjuntar contexto (solo TMS) */}
          {showContextMenu && (
            <ContextMenu
              onAddContext={handleAddContext}
              disabled={disabled}
              contextCount={contexts.length}
              maxContexts={5}
            />
          )}

          <div className="flex-1 relative">
            <Textarea
              ref={innerRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta aquí..."
              disabled={disabled}
              rows={1}
              className={`
                min-h-[40px] sm:min-h-[44px]
                max-h-[200px] sm:max-h-[300px]
                resize-none
                pr-10 sm:pr-12
                text-sm sm:text-base
                border-2
                focus:border-primary
                transition-colors
                overflow-y-auto
              `}
            />

            {/* Tooltip para códigos de curso */}
            {showCodeHint && !disabled && (
              <div
                className="absolute left-0 top-full mt-1 text-xs bg-primary/90 text-primary-foreground rounded-md px-2 py-1 shadow-md z-10 pointer-events-none select-none animate-in fade-in-0 zoom-in-95 duration-200"
                role="tooltip"
                aria-label="Información sobre búsqueda de curso"
              >
                <div className="flex items-center gap-1">
                  <span>🎯</span>
                  <span>
                    Encontraré el curso aunque no esté en esta página
                  </span>
                </div>
                {/* Flecha */}
                <div className="absolute -top-1 left-3 w-2 h-2 bg-primary/90 rotate-45 transform" />
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={disabled || !message.trim()}
            className="shrink-0 h-10 w-10 sm:h-auto sm:w-auto sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center rounded-2xl shadow-md"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};
