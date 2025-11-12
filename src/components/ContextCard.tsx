// src/components/ContextCard.tsx
import { X, Building2, BookOpen, User, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContextObject, ContextObjectType } from "./ContextMenu";

interface ContextCardProps {
  context: ContextObject;
  onRemove: (id: string) => void;
}

const contextIcons: Record<ContextObjectType, typeof Building2> = {
  comercializacion: Building2,
  curso: BookOpen,
  relator: User,
  alumno: GraduationCap,
};

const contextColors: Record<ContextObjectType, string> = {
  comercializacion: "bg-blue-50 text-blue-700 border-blue-200",
  curso: "bg-green-50 text-green-700 border-green-200",
  relator: "bg-purple-50 text-purple-700 border-purple-200",
  alumno: "bg-orange-50 text-orange-700 border-orange-200",
};

export const ContextCard = ({ context, onRemove }: ContextCardProps) => {
  const Icon = contextIcons[context.type];
  const colorClass = contextColors[context.type];

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${colorClass} transition-all animate-in fade-in-0 zoom-in-95 duration-200`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="max-w-[200px] truncate">{context.identifier}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(context.id)}
        className="h-4 w-4 p-0 hover:bg-transparent opacity-60 hover:opacity-100"
        title="Quitar contexto"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};
