import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

interface MisDatosQuickActionProps {
  onClick: (intent: string, question: string) => void;
  disabled?: boolean;
}

export const MisDatosQuickAction: React.FC<MisDatosQuickActionProps> = ({
  onClick,
  disabled = false
}) => {
  const handleClick = () => {
    onClick(
      'alumno.mis_datos',
      'Muéstrame mi información académica completa'
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
      <User className="h-4 w-4" />
      <span>Mi información</span>
    </Button>
  );
};
