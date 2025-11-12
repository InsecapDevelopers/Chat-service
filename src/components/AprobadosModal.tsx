import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AprobadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (codigoComer: string) => void;
}

export const AprobadosModal = ({ isOpen, onClose, onConfirm }: AprobadosModalProps) => {
  const [codigoComer, setCodigoComer] = useState("");
  const [error, setError] = useState("");

  // Cargar último código usado desde localStorage
  useEffect(() => {
    if (isOpen) {
      const lastCode = localStorage.getItem("tms_last_aprobados_code");
      if (lastCode) {
        setCodigoComer(lastCode);
      }
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const trimmed = codigoComer.trim();
    
    if (!trimmed) {
      setError("Por favor ingresa un código de comercialización");
      return;
    }

    // Validar formato básico (puedes ajustar según tus necesidades)
    // Ejemplo: mínimo 3 caracteres
    if (trimmed.length < 3) {
      setError("El código debe tener al menos 3 caracteres");
      return;
    }

    // Guardar en localStorage para próxima vez
    localStorage.setItem("tms_last_aprobados_code", trimmed);

    // Limpiar y confirmar
    setError("");
    onConfirm(trimmed);
    setCodigoComer(""); // Limpiar input después de confirmar
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodigoComer(e.target.value);
    if (error) setError(""); // Limpiar error al escribir
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Consultar Participantes Aprobados</DialogTitle>
          <DialogDescription>
            Ingresa el código de comercialización para consultar los participantes aprobados.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="codigo-comer">Código de Comercialización</Label>
            <Input
              id="codigo-comer"
              placeholder="Ej: COM-2024-001"
              value={codigoComer}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              autoFocus
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!codigoComer.trim()}>
            Consultar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
