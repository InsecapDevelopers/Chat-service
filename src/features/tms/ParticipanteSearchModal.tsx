import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, User, Hash } from "lucide-react";
import { sendCustomTelemetry } from "@/lib/telemetry";

interface ParticipanteSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearchSubmit: (searchData: { rut?: string; nombre?: string }) => void;
}

export const ParticipanteSearchModal = ({
  open,
  onOpenChange,
  onSearchSubmit,
}: ParticipanteSearchModalProps) => {
  const [rutValue, setRutValue] = useState("");
  const [nombreValue, setNombreValue] = useState("");
  const [activeTab, setActiveTab] = useState("rut");

  const handleRutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rutValue.trim()) {
      // Telemetría para búsqueda por RUT
      sendCustomTelemetry("tms_find_participante_click", { method: "rut" });

      // Enviar RUT formateado con puntos y guión (formato: 8.280.801-9)
      onSearchSubmit({ rut: rutValue.trim() });
      setRutValue("");
    }
  };

  const handleNombreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombreValue.trim()) {
      // Telemetría para búsqueda por nombre
      sendCustomTelemetry("tms_find_participante_click", { method: "nombre" });

      onSearchSubmit({ nombre: nombreValue.trim() });
      setNombreValue("");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Participante
          </DialogTitle>
          <DialogDescription>
            Busca información de un participante por RUT o por nombre.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rut" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Por RUT
            </TabsTrigger>
            <TabsTrigger value="nombre" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Por Nombre
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rut" className="space-y-4">
            <form onSubmit={handleRutSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rut">RUT del Participante</Label>
                <Input
                  id="rut"
                  placeholder="Ej: 12.345.678-9"
                  value={rutValue}
                  onChange={handleRutChange}
                  maxLength={12}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa el RUT con formato: 12.345.678-9
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!validateRut(rutValue)}
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar por RUT
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="nombre" className="space-y-4">
            <form onSubmit={handleNombreSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Participante</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Juan Pérez"
                  value={nombreValue}
                  onChange={(e) => setNombreValue(e.target.value)}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa el nombre completo o parte del nombre
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={nombreValue.trim().length < 3}
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar por Nombre
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
