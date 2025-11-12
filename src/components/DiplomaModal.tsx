import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award } from "lucide-react";

interface DiplomaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rut: string) => void;
}

export const DiplomaModal = ({
  isOpen,
  onClose,
  onSubmit,
}: DiplomaModalProps) => {
  const [rutValue, setRutValue] = useState("");

  // Cargar último RUT usado desde localStorage
  useEffect(() => {
    if (isOpen) {
      const lastRut = localStorage.getItem("lastDiplomaRut") || "";
      setRutValue(lastRut);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rutValue.trim() && validateRut(rutValue)) {
      // Guardar en localStorage
      localStorage.setItem("lastDiplomaRut", rutValue.trim());
      onSubmit(rutValue.trim());
      setRutValue("");
      onClose(); // Cerrar modal después de enviar
    }
  };

  const formatRut = (value: string) => {
    // Eliminar todo excepto números y K/k
    const cleaned = value.replace(/[^0-9Kk]/g, '').toUpperCase();
    
    if (cleaned.length <= 1) return cleaned;
    
    // Separar dígito verificador
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    
    // Formatear con puntos de derecha a izquierda cada 3 dígitos
    let formatted = '';
    let count = 0;
    for (let i = body.length - 1; i >= 0; i--) {
      if (count === 3) {
        formatted = '.' + formatted;
        count = 0;
      }
      formatted = body[i] + formatted;
      count++;
    }
    
    return `${formatted}-${dv}`;
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setRutValue(formatted);
  };

  const validateRut = (rut: string) => {
    const cleanRut = rut.replace(/[^0-9Kk]/g, '');
    return cleanRut.length >= 8; // Mínimo 8 caracteres para RUT válido
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Consultar Diploma
          </DialogTitle>
          <DialogDescription>
            Ingresa el RUT del participante para consultar su diploma.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rut">RUT del Participante</Label>
            <Input
              id="rut"
              placeholder="Ej: 12.345.678-9"
              value={rutValue}
              onChange={handleRutChange}
              className="w-full"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              El RUT se formateará automáticamente
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!rutValue.trim() || !validateRut(rutValue)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Award className="w-4 h-4 mr-2" />
              Consultar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
