import React from "react";
import { SafeButton as Button } from "@/components/ui/safe-button";
import { BookOpen } from "lucide-react";

interface CursoQuickActionProps {
  disabled?: boolean;
  currentRole?: string;
}

export const CursoQuickAction = ({ 
  disabled = false,
  currentRole = ""
}: CursoQuickActionProps) => {

  const handleClick = () => {

  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className="h-auto p-3 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white border-none transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-md w-full"
      title="Consultar curso"
    >
      <BookOpen className="h-4 w-4 flex-shrink-0" />
      <span className="text-xs font-medium truncate">Curso</span>
    </Button>
  );
};