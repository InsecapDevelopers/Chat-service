import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Calculator, ClipboardList, Calendar } from "lucide-react";
import type { TmsActionType } from "./TmsQuickActions";

interface CourseCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (codigoCurso: string, tipo: TmsActionType) => void;
  actionType: TmsActionType | null;
}

const ACTION_CONFIG = {
  R11: {
    title: 'Consultar R11',
    description: 'Información del R11 (relator, objetivos, contenidos, horas)',
    icon: FileText,
    color: 'text-blue-600'
  },
  R12: {
    title: 'Consultar R12', 
    description: 'Costos R12 desglosados y observaciones',
    icon: Calculator,
    color: 'text-green-600'
  },
  R61: {
    title: 'Consultar R61',
    description: 'Registros R61 y contenidos específicos',
    icon: ClipboardList,
    color: 'text-orange-600'
  },
  BLOQUES: {
    title: 'Consultar Bloques',
    description: 'Lista de bloques con fechas, horarios y relatores',
    icon: Calendar,
    color: 'text-purple-600'
  }
};

export const CourseCodeModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  actionType 
}: CourseCodeModalProps) => {
  const [codigoCurso, setCodigoCurso] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  // Cargar último código ingresado desde localStorage
  useEffect(() => {
    if (isOpen) {
      const lastCode = localStorage.getItem('tms_last_course_code');
      if (lastCode) {
        setCodigoCurso(lastCode);
      }
    }
  }, [isOpen]);

  // Validar código de curso
  useEffect(() => {
    if (!codigoCurso.trim()) {
      setIsValid(false);
      setError('');
      return;
    }

    // Patrón flexible: P-OPE-1012, ES-COM-1352, EA-TEC-001, ES-COM-12, P-OPE-1, etc.
    const pattern = /^[A-Z]{1,2}-[A-Z]{3,4}-\d{1,6}$/;
    const valid = pattern.test(codigoCurso.trim().toUpperCase());
    
    setIsValid(valid);
    setError(valid ? '' : 'Formato: P-OPE-1012 (ej: ES-COM-1352, EA-TEC-001, P-OPE-12, ES-COM-1)');
  }, [codigoCurso]);

  const handleConfirm = () => {
    if (!actionType || !isValid) return;

    const normalizedCode = codigoCurso.trim().toUpperCase();
    
    // Guardar último código en localStorage
    localStorage.setItem('tms_last_course_code', normalizedCode);
    
    onConfirm(normalizedCode, actionType);
    onClose();
    setCodigoCurso('');
  };

  const handleClose = () => {
    onClose();
    setCodigoCurso('');
    setError('');
  };

  // Manejar tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!actionType) return null;

  const config = ACTION_CONFIG[actionType];
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="course-code">Código del Curso</Label>
            <Input
              id="course-code"
              placeholder="P-OPE-1012"
              value={codigoCurso}
              onChange={(e) => setCodigoCurso(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              className={error ? 'border-red-300 focus:border-red-500' : ''}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
            <strong>Ejemplos válidos:</strong> ES-COM-1352, P-OPE-1012, EA-TEC-001, P-OPE-12, ES-COM-1
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            type="button"
            onClick={handleConfirm} 
            disabled={!isValid}
            className="min-w-[80px]"
          >
            Consultar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};