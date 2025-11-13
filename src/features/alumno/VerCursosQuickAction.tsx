import React from 'react';
import { SafeButton as Button } from '@/components/ui/safe-button';
import { BookOpen } from 'lucide-react';

interface VerCursosQuickActionProps {
  onClick: (intent: string, question: string) => void;
  disabled?: boolean;
}

export const VerCursosQuickAction: React.FC<VerCursosQuickActionProps> = ({
  onClick,
  disabled = false
}) => {
  const handleClick = () => {
    onClick(
      'alumno.ver_cursos',
      'Muéstrame mis cursos inscritos'
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
      <BookOpen className="h-4 w-4" />
      <span>Cursos inscritos</span>
    </Button>
  );
};
