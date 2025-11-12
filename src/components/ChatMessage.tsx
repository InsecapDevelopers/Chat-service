import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Building2, BookOpen, User, GraduationCap } from "lucide-react";
import capinMascot from "@/assets/capin-mascot.png";
import { RelatorResult } from "@/features/tms/RelatorResult";
import { CostosResult } from "@/features/tms/CostosResult";
import { AprobadosResult } from "@/features/tms/AprobadosResult";
import { ParticipanteResult } from "@/features/tms/ParticipanteResult";

export interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  files?: File[];
  contexts?: Array<{ type: string; identifier: string }>; // ✅ Contextos adjuntos
}

interface ChatMessageProps {
  message: Message;
  onRelatorSelect?: (rut: string) => void;
  onParticipanteSelect?: (rut: string) => void;
}

// ✅ Helper para renderizar contextos adjuntos
const ContextBadge = ({ type, identifier }: { type: string; identifier: string }) => {
  const config = {
    comercializacion: { icon: Building2, color: "bg-blue-100 text-blue-700 border-blue-300", label: "🏢" },
    curso: { icon: BookOpen, color: "bg-green-100 text-green-700 border-green-300", label: "📖" },
    relator: { icon: User, color: "bg-purple-100 text-purple-700 border-purple-300", label: "👤" },
    alumno: { icon: GraduationCap, color: "bg-orange-100 text-orange-700 border-orange-300", label: "🎓" },
  }[type] || { icon: BookOpen, color: "bg-gray-100 text-gray-700 border-gray-300", label: "📄" };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${config.color}`}>
      <Icon className="h-2.5 w-2.5" />
      <span className="max-w-[80px] truncate">{identifier}</span>
    </span>
  );
};

export const ChatMessage = ({ message, onRelatorSelect, onParticipanteSelect }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.sender === "user";

  // Detectar si el contenido del asistente incluye participantes aprobados con R23 (PRIMERO - más específico)
  const isAprobadosContent = !isUser && (
    /PARTICIPANTES APROBADOS/i.test(message.text) ||
    (message.text.includes("participante(s) aprobado(s)") && /R23/i.test(message.text)) ||
    (/participante.*aprobado/i.test(message.text) && /R23/i.test(message.text))
  );

  // Detectar si el contenido del asistente incluye información de relatores
  const isRelatorContent = !isUser && (
    message.text.includes("Relator encontrado") ||
    message.text.includes("Relatores encontrados") ||
    (message.text.includes("múltiples coincidencias") && message.text.toLowerCase().includes("relator")) ||
    (message.text.includes("Encontré varias coincidencias") && message.text.toLowerCase().includes("relator"))
  );

  // Detectar si el contenido del asistente incluye información de participantes (EXCLUIR aprobados)
  const isParticipanteContent = !isUser && !isAprobadosContent && (
    message.text.includes("Participante encontrado") ||
    (message.text.includes("Participantes encontrados") && !message.text.includes("APROBADOS")) ||
    /Se encontraron \d+ participante/i.test(message.text) ||
    (message.text.includes("coinciden con") && message.text.toLowerCase().includes("participante")) ||
    (message.text.includes("múltiples coincidencias") && message.text.toLowerCase().includes("participante") && !message.text.toLowerCase().includes("aprobado")) ||
    (message.text.includes("Encontré varias coincidencias") && message.text.toLowerCase().includes("participante") && !message.text.toLowerCase().includes("aprobado"))
  );

  // Detectar si el contenido del asistente incluye información de costos
  const isCostosContent = !isUser && (
    message.text.includes("COSTOS") ||
    message.text.includes("COSTO TOTAL") ||
    message.text.includes("PRECIO VENTA") ||
    message.text.includes("Honorarios") ||
    message.text.includes("===") ||
    message.text.includes("Costos by codigoComer")
  );

  // Si es contenido de participantes aprobados, usar AprobadosResult (PRIMERO porque es más específico)
  if (isAprobadosContent) {
    return (
      <div className={`flex gap-2 sm:gap-3 p-2 sm:p-4 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-primary/20 flex-shrink-0">
          <AvatarImage src={capinMascot} alt="Capin" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">C</AvatarFallback>
        </Avatar>

        <div className="max-w-[85%] sm:max-w-[80%] md:max-w-[75%] text-left min-w-0">
          <div className="inline-block w-full p-2 sm:p-3 rounded-2xl shadow-bubble transition-all duration-300 hover:shadow-lg bg-chat-assistant-bg text-chat-assistant-text border-2 border-chat-assistant-border rounded-bl-md">
            <AprobadosResult content={message.text} onParticipanteSelect={onParticipanteSelect} />
          </div>

          <div className="flex items-center gap-2 mt-1 justify-start">
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 w-6 p-0 hover:bg-muted">
              {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Si es contenido de participantes, usar ParticipanteResult
  if (isParticipanteContent && onParticipanteSelect) {
    return (
      <div className={`flex gap-3 p-4 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <Avatar className="w-8 h-8 border-2 border-primary/20">
          <AvatarImage src={capinMascot} alt="Capin" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">C</AvatarFallback>
        </Avatar>

        <div className="max-w-[80%] text-left">
          <div className="inline-block p-3 rounded-2xl shadow-bubble transition-all duration-300 hover:shadow-lg bg-chat-assistant-bg text-chat-assistant-text border-2 border-chat-assistant-border rounded-bl-md">
            <ParticipanteResult content={message.text} onParticipanteSelect={onParticipanteSelect} />
          </div>

          <div className="flex items-center gap-2 mt-1 justify-start">
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 w-6 p-0 hover:bg-muted">
              {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Si es contenido de relatores, usar RelatorResult
  if (isRelatorContent && onRelatorSelect) {
    return (
      <div className={`flex gap-3 p-4 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <Avatar className="w-8 h-8 border-2 border-primary/20">
          <AvatarImage src={capinMascot} alt="Capin" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">C</AvatarFallback>
        </Avatar>

        <div className="max-w-[80%] text-left">
          <div className="inline-block p-3 rounded-2xl shadow-bubble transition-all duration-300 hover:shadow-lg bg-chat-assistant-bg text-chat-assistant-text border-2 border-chat-assistant-border rounded-bl-md">
            <RelatorResult content={message.text} onRelatorSelect={onRelatorSelect} />
          </div>

          <div className="flex items-center gap-2 mt-1 justify-start">
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 w-6 p-0 hover:bg-muted">
              {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Si es contenido de costos, usar CostosResult
  if (isCostosContent) {
    return (
      <div className={`flex gap-3 p-4 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <Avatar className="w-8 h-8 border-2 border-primary/20">
          <AvatarImage src={capinMascot} alt="Capin" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">C</AvatarFallback>
        </Avatar>

        <div className="max-w-[80%] text-left">
          <div className="inline-block p-3 rounded-2xl shadow-bubble transition-all duration-300 hover:shadow-lg bg-chat-assistant-bg text-chat-assistant-text border-2 border-chat-assistant-border rounded-bl-md">
            <CostosResult content={message.text} />
          </div>

          <div className="flex items-center gap-2 mt-1 justify-start">
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 w-6 p-0 hover:bg-muted">
              {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Regex para detectar URLs (capturando las coincidencias)
  const linkRegex = /(https?:\/\/[^\s]+)/g;
  // Dividimos el texto en [texto, url1, texto, url2, ...]
  const parts = message.text.split(linkRegex);

  // Quita puntuación de cierre sobrante sin romper paréntesis válidos
  const splitUrlAndTrailing = (raw: string) => {
    let url = raw;
    let trailing = "";

    // Primero signos de puntuación simples
    while (/[.,;:!?]$/.test(url)) {
      trailing = url.slice(-1) + trailing;
      url = url.slice(0, -1);
    }

    // Luego cierres de paréntesis/corchetes/llaves solo si están desbalanceados
    const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
    const endCloser = /[)\]}]$/;

    const count = (s: string, ch: string) => (s.match(new RegExp("\\" + ch, "g")) || []).length;

    while (endCloser.test(url)) {
      const ch = url.slice(-1);
      const open = pairs[ch];
      const opens = count(url, open);
      const closes = count(url, ch);
      if (closes > opens) {
        trailing = ch + trailing;
        url = url.slice(0, -1);
      } else {
        break;
      }
    }

    return { url, trailing };
  };

  return (
    <div className={`flex gap-3 p-4 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <Avatar className="w-8 h-8 border-2 border-primary/20">
          <AvatarImage src={capinMascot} alt="Capin" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">C</AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[80%] ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block p-3 rounded-2xl shadow-bubble transition-all duration-300 hover:shadow-lg ${
            isUser
              ? "bg-chat-user-bg text-chat-user-text rounded-br-md"
              : "bg-chat-assistant-bg text-chat-assistant-text border-2 border-chat-assistant-border rounded-bl-md"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">
            {parts.map((part, i) => {
              if (i % 2 === 1) {
                const { url, trailing } = splitUrlAndTrailing(part);
                return (
                  <span key={`url-${i}`}>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mx-1 my-1 max-w-[260px] align-middle"
                      title={url}
                    >
                      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 truncate">
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{url}</span>
                      </a>
                    </Button>
                    {trailing && <span>{trailing}</span>}
                  </span>
                );
              }
              return <span key={`txt-${i}`}>{part}</span>;
            })}
          </p>
        </div>

        {/* ✅ Mostrar contextos adjuntos si existen (solo para mensajes del usuario) */}
        {isUser && message.contexts && message.contexts.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5 justify-end">
            {message.contexts.map((ctx, idx) => (
              <ContextBadge key={idx} type={ctx.type} identifier={ctx.identifier} />
            ))}
          </div>
        )}

        <div className={`flex items-center gap-2 mt-1 ${isUser ? "justify-end" : "justify-start"}`}>
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>

          {!isUser && (
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 w-6 p-0 hover:bg-muted">
              {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            </Button>
          )}
        </div>
      </div>

      {isUser && (
        <Avatar className="w-8 h-8 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
