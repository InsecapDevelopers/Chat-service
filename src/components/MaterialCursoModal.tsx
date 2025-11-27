import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SafeButton as Button } from "@/components/ui/safe-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package } from "lucide-react";

interface MaterialCursoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (codigoCurso: string) => void;
}

export const MaterialCursoModal = ({ 
  isOpen, 
  onClose, 
  onConfirm
}: MaterialCursoModalProps) => {
  const [codigoCurso, setCodigoCurso] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  // Cargar último código ingresado desde localStorage
  useEffect(() => {
    if (isOpen) {
      const lastCode = localStorage.getItem('tms_last_material_course_code');
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
    if (!isValid) return;

    const normalizedCode = codigoCurso.trim().toUpperCase();
    
    // Guardar último código en localStorage
    localStorage.setItem('tms_last_material_course_code', normalizedCode);
    
    onConfirm(normalizedCode);
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[448px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            Recurso de aprendizaje
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Información sobre el recurso de aprendizaje del curso
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

        <DialogFooter>
          <Button 
            type="button"
            variant="outline" 
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            onClick={handleConfirm}
            disabled={!isValid}
          >
            Consultar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
