import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface ConsultarR11QuickActionProps {
  onActionClick: (action: 'R11') => void;
  disabled?: boolean;
}

export const ConsultarR11QuickAction = ({ 
  onActionClick, 
  disabled = false
}: ConsultarR11QuickActionProps) => {

  const handleClick = () => {
    onActionClick('R11');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className="h-auto p-3 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white border-none transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-md w-full"
    >
      <FileText className="h-4 w-4 flex-shrink-0" />
      <span className="text-xs font-medium truncate">Consultar R11</span>
    </Button>
  );
};
