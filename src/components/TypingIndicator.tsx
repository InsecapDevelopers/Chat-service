import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import capinMascot from "@/assets/capin-mascot.png";

export const TypingIndicator = () => {
  return (
    <div className="flex gap-3 p-4 animate-fade-in">
      <Avatar className="w-8 h-8 border-2 border-primary/20">
        <AvatarImage src={capinMascot} alt="Capin" />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">C</AvatarFallback>
      </Avatar>
      
      <div className="bg-chat-assistant-bg border-2 border-chat-assistant-border rounded-2xl rounded-bl-md p-3 shadow-bubble">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Capin está escribiendo</span>
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