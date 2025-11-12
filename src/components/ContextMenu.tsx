// src/components/ContextMenu.tsx
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Building2, BookOpen, User, GraduationCap } from "lucide-react";

export type ContextObjectType = "comercializacion" | "curso" | "relator" | "alumno";

export interface ContextObject {
  id: string;
  type: ContextObjectType;
  identifier: string; // ID o RUT
  label: string; // Para mostrar en la UI
}

interface ContextMenuProps {
  onAddContext: (context: ContextObject) => void;
  disabled?: boolean;
  contextCount: number;
  maxContexts?: number;
}

type ContextForm = {
  type: ContextObjectType | null;
  identifier: string;
};

export const ContextMenu = ({ 
  onAddContext, 
  disabled, 
  contextCount,
  maxContexts = 5 
}: ContextMenuProps) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ContextForm>({ type: null, identifier: "" });

  const isMaxReached = contextCount >= maxContexts;

  const contextTypes = [
    { 
      type: "comercializacion" as ContextObjectType, 
      label: "Comercialización", 
      icon: Building2,
      placeholder: "Ej: COMER-2024-01",
      hint: "Código de comercialización"
    },
    { 
      type: "curso" as ContextObjectType, 
      label: "Curso", 
      icon: BookOpen,
      placeholder: "Ej: R-ADM-101",
      hint: "Código de curso"
    },
    { 
      type: "relator" as ContextObjectType, 
      label: "Relator", 
      icon: User,
      placeholder: "1.234.567-8 (formato automático)",
      hint: "RUT del relator"
    },
    { 
      type: "alumno" as ContextObjectType, 
      label: "Alumno", 
      icon: GraduationCap,
      placeholder: "1.234.567-8 (formato automático)",
      hint: "RUT del alumno"
    },
  ];

  const handleSelectType = (type: ContextObjectType) => {
    setForm({ type, identifier: "" });
  };

  const handleBack = () => {
    setForm({ type: null, identifier: "" });
  };

  // Formatear RUT automáticamente (para relator y alumno)
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

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Si es relator o alumno, formatear como RUT
    if (form.type === "relator" || form.type === "alumno") {
      const formatted = formatRut(value);
      setForm({ ...form, identifier: formatted });
    } else {
      setForm({ ...form, identifier: value });
    }
  };

  const handleAdd = () => {
    if (!form.type || !form.identifier.trim()) return;

    const contextType = contextTypes.find(ct => ct.type === form.type);
    
    const newContext: ContextObject = {
      id: `${form.type}-${Date.now()}`,
      type: form.type,
      identifier: form.identifier.trim(),
      label: `${contextType?.label}: ${form.identifier.trim()}`
    };

    onAddContext(newContext);
    setForm({ type: null, identifier: "" });
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && form.identifier.trim()) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || isMaxReached}
          className="shrink-0 h-10 w-10"
          title={isMaxReached ? `Máximo ${maxContexts} contextos` : "Añadir contexto"}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0" 
        align="start"
        side="top"
      >
        {!form.type ? (
          // Vista principal: Selección de tipo
          <div className="p-2">
            <div className="px-3 py-2 text-sm font-semibold text-muted-foreground border-b">
              Añadir contexto
            </div>
            
            <div className="p-2 space-y-1">
              {contextTypes.map((contextType) => {
                const Icon = contextType.icon;
                return (
                  <button
                    type="button"
                    key={contextType.type}
                    onClick={() => handleSelectType(contextType.type)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{contextType.label}</div>
                      <div className="text-xs text-muted-foreground">{contextType.hint}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {isMaxReached && (
              <div className="px-3 py-2 text-xs text-amber-600 bg-amber-50 border-t">
                ⚠️ Máximo {maxContexts} contextos por mensaje
              </div>
            )}
          </div>
        ) : (
          // Vista secundaria: Formulario de entrada
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-8 px-2"
              >
                ← Atrás
              </Button>
              <div className="font-semibold text-sm">
                {contextTypes.find(ct => ct.type === form.type)?.label}
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="context-identifier" className="text-sm">
                  {contextTypes.find(ct => ct.type === form.type)?.hint}
                </Label>
                <Input
                  id="context-identifier"
                  value={form.identifier}
                  onChange={handleIdentifierChange}
                  onKeyDown={handleKeyDown}
                  placeholder={contextTypes.find(ct => ct.type === form.type)?.placeholder}
                  className="mt-1.5"
                  autoFocus
                />
              </div>
              
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!form.identifier.trim()}
                className="w-full"
              >
                Añadir
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
