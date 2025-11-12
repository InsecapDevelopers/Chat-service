import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

interface VerNotasQuickActionProps {
  onClick: (intent: string, question: string) => void;
  disabled?: boolean;
}

export const VerNotasQuickAction: React.FC<VerNotasQuickActionProps> = ({
  onClick,
  disabled = false
}) => {
  const handleClick = () => {
    onClick(
      'alumno.ver_notas',
      'Muéstrame mis notas y calificaciones'
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
      <BarChart3 className="h-4 w-4" />
      <span>Mis notas</span>
    </Button>
  );
};
