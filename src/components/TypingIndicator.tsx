import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import capinMascot from "@/assets/capin-mascot.png";

export const TypingIndicator = () => {
  const messages = ["Pensando", "Buscando los datos"];
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1600);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="flex gap-3 p-4 animate-fade-in">
      <Avatar className="w-8 h-8 border-2 border-primary/20">
        <AvatarImage src={capinMascot} alt="Capin" />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">C</AvatarFallback>
      </Avatar>
      
      <div className="bg-chat-assistant-bg border-2 border-chat-assistant-border rounded-2xl rounded-bl-md p-3 shadow-bubble">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">{messages[messageIndex]}</span>
          <div className="flex gap-1 ml-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-typing" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-typing" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-typing" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};