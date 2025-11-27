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
import { SafeButton as Button } from "@/components/ui/safe-button";
import { Label } from "@/components/ui/label";

interface R24ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (codigoCotizacion: string) => void;
}

export const R24Modal = ({ isOpen, onClose, onConfirm }: R24ModalProps) => {
  const [codigoCotizacion, setCodigoCotizacion] = useState("");
  const [error, setError] = useState("");

  // Cargar último código usado desde localStorage
  useEffect(() => {
    if (isOpen) {
      const lastCode = localStorage.getItem("tms_last_r24_code");
      if (lastCode) {
        setCodigoCotizacion(lastCode);
      }
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const trimmed = codigoCotizacion.trim();
    
    if (!trimmed) {
      setError("Por favor ingresa un código de cotización");
      return;
    }

    // Validar formato básico (puedes ajustar según tus necesidades)
    // Ejemplo: mínimo 3 caracteres
    if (trimmed.length < 3) {
      setError("El código debe tener al menos 3 caracteres");
      return;
    }

    // Guardar en localStorage para próxima vez
    localStorage.setItem("tms_last_r24_code", trimmed);

    // Limpiar y confirmar
    setError("");
    onConfirm(trimmed);
    setCodigoCotizacion(""); // Limpiar input después de confirmar
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
    setCodigoCotizacion(e.target.value.toUpperCase());
    if (error) setError(""); // Limpiar error al escribir
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[448px]">
        <DialogHeader>
          <DialogTitle>Consultar R24</DialogTitle>
          <DialogDescription>
            Ingresa el código de cotización para consultar el R24.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="codigo-cotizacion">Código de Cotización</Label>
            <Input
              id="codigo-cotizacion"
              placeholder="Ej: COT-2024-001"
              value={codigoCotizacion}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              autoFocus
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!codigoCotizacion.trim()}>
            Consultar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
