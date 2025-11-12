import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface VerAsistenciaQuickActionProps {
  onClick: (intent: string, question: string) => void;
  disabled?: boolean;
}

export const VerAsistenciaQuickAction: React.FC<VerAsistenciaQuickActionProps> = ({
  onClick,
  disabled = false
}) => {
  const handleClick = () => {
    onClick(
      'alumno.ver_asistencia',
      'Muéstrame mi registro de asistencia'
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
      <Calendar className="h-4 w-4" />
      <span>Mi asistencia</span>
    </Button>
  );
};
