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
import { DollarSign } from "lucide-react";

interface CostosSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (codigoComer: string) => void;
}

export const CostosSearchModal = ({ isOpen, onClose, onSubmit }: CostosSearchModalProps) => {
  const [codigoComer, setCodigoComer] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState("");

  // Limpiar estado al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setCodigoComer("");
      setIsValid(false);
      setError("");
    }
  }, [isOpen]);

  // Validar código de comercialización
  useEffect(() => {
    if (!codigoComer.trim()) {
      setIsValid(false);
      setError("");
      return;
    }

    // Patrón para códigos de comercialización: CAL229103-1, CAL229105, ANT229025
    // Formato: 3 letras + 6 dígitos + opcional(-1)
    const pattern = /^[A-Z]{3}\d{6}(-\d)?$/;
    const valid = pattern.test(codigoComer.trim().toUpperCase());
    
    setIsValid(valid);
    setError(valid ? "" : "Formato: CAL229103-1 (ej: CAL229105, ANT229025)");
  }, [codigoComer]);

  const handleSubmit = () => {
    if (!isValid) return;

    const normalizedCode = codigoComer.trim().toUpperCase();
    onSubmit(normalizedCode);
    onClose();
  };

  const handleClose = () => {
    setCodigoComer("");
    setIsValid(false);
    setError("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid) {
      handleSubmit();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Consultar Costos
          </DialogTitle>
          <DialogDescription>
            Ingresa el código de comercialización para obtener información detallada de costos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codigoComer">Código de Comercialización</Label>
            <Input
              id="codigoComer"
              value={codigoComer}
              onChange={(e) => setCodigoComer(e.target.value)}
              placeholder="CAL229103-1"
              onKeyDown={handleKeyDown}
              className={error ? "border-red-300 focus:border-red-500" : ""}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
            <strong>Ejemplos válidos:</strong> CAL229103-1, CAL229105, ANT229025
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid}
            className="bg-green-600 hover:bg-green-700"
          >
            Consultar Costos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};