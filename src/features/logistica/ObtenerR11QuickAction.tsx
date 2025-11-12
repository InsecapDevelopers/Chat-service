import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface ObtenerR11QuickActionProps {
  onClick: (intent: string, question: string) => void;
  disabled?: boolean;
}

export const ObtenerR11QuickAction: React.FC<ObtenerR11QuickActionProps> = ({
  onClick,
  disabled = false
}) => {
  const handleClick = () => {
    onClick(
      'logistica.obtener_r11',
      'Necesito obtener el informe R11'
    );
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className="rounded-full disabled:opacity-50 disabled:cursor-not-allowed justify-start gap-2"
    >
      <FileText className="h-4 w-4" />
      <span>Obtener R11</span>
    </Button>
  );
};
