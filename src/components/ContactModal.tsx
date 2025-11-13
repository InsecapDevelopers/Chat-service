import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useShadowRoot } from "@/contexts/ShadowRootContext";

export interface ContactFormData {
  nombre: string;
  empresa: string | null;
  pertenecEmpresa: boolean;
  telefono: string;
  correo?: string;
}

interface ContactModalProps {
  isOpen: boolean;
  onSubmit: (data: ContactFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const ContactModal = ({
  isOpen,
  onSubmit,
  onCancel,
  isLoading = false,
}: ContactModalProps) => {
  const { shadowRoot } = useShadowRoot();
  
  const [formData, setFormData] = useState<ContactFormData>({
    nombre: "",
    empresa: null,
    pertenecEmpresa: false,
    telefono: "",
    correo: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enfocar el primer campo cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const firstInput = document.getElementById("contact-nombre");
        firstInput?.focus();
      }, 100);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    // Validar teléfono
    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    } else if (!/^[\d\s+\-()]+$/.test(formData.telefono)) {
      newErrors.telefono = "El teléfono no es válido";
    }

    // Validar empresa si está seleccionado "Sí"
    if (formData.pertenecEmpresa && !formData.empresa?.trim()) {
      newErrors.empresa = "El nombre de la empresa es requerido";
    }

    // Validar correo si se proporciona
    if (formData.correo && formData.correo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo)) {
        newErrors.correo = "El correo no es válido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof ContactFormData
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    // Limpiar error del campo al escribir
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleCompanyToggle = (value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      pertenecEmpresa: value,
      empresa: value ? prev.empresa : null,
    }));
    // Limpiar error de empresa
    if (errors.empresa) {
      setErrors((prev) => ({
        ...prev,
        empresa: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error al enviar formulario de contacto:", error);
      setErrors({ form: "Error al enviar el formulario. Intenta de nuevo." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: '0',
        zIndex: 1000000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      aria-label="Modal de contacto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        // Cerrar si se hace click en el backdrop
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '448px',
          margin: '0 16px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{
            position: 'sticky',
            top: '0',
            backgroundColor: 'white',
            borderBottom: '1px solid #f3f4f6',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            margin: '0',
          }}>
            Ayúdanos a contactarte
          </h2>
          <button
            onClick={handleCancel}
            style={{
              color: '#9ca3af',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#4b5563'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            aria-label="Cerrar modal"
            disabled={isSubmitting || isLoading}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre Completo */}
          <div>
            <Label
              htmlFor="contact-nombre"
              className="text-sm font-medium text-gray-700 mb-2 block"
            >
              Nombre completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-nombre"
              type="text"
              placeholder="Juan Pérez"
              value={formData.nombre}
              onChange={(e) => handleInputChange(e, "nombre")}
              disabled={isSubmitting || isLoading}
              className={`border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                errors.nombre ? "border-red-500" : ""
              }`}
              aria-required="true"
              aria-invalid={!!errors.nombre}
              aria-describedby={errors.nombre ? "error-nombre" : undefined}
            />
            {errors.nombre && (
              <p id="error-nombre" className="text-red-500 text-xs mt-1">
                {errors.nombre}
              </p>
            )}
          </div>

          {/* ¿Pertenece a una empresa? */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              ¿Pertenece a una empresa? <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="pertenecEmpresa"
                  checked={formData.pertenecEmpresa === true}
                  onChange={() => handleCompanyToggle(true)}
                  disabled={isSubmitting || isLoading}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  aria-label="Pertenece a una empresa - Sí"
                />
                <span className="ml-2 text-sm text-gray-700">Sí</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="pertenecEmpresa"
                  checked={formData.pertenecEmpresa === false}
                  onChange={() => handleCompanyToggle(false)}
                  disabled={isSubmitting || isLoading}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  aria-label="Pertenece a una empresa - No"
                />
                <span className="ml-2 text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>

          {/* Nombre de la Empresa (Condicional) */}
          {formData.pertenecEmpresa && (
            <div className="animate-in fade-in-50 slide-in-from-top-2 duration-200">
              <Label
                htmlFor="contact-empresa"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Nombre de la empresa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact-empresa"
                type="text"
                placeholder="Nombre de la empresa"
                value={formData.empresa || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    empresa: e.target.value,
                  }))
                }
                disabled={isSubmitting || isLoading}
                className={`border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                  errors.empresa ? "border-red-500" : ""
                }`}
                aria-required="true"
                aria-invalid={!!errors.empresa}
                aria-describedby={errors.empresa ? "error-empresa" : undefined}
              />
              {errors.empresa && (
                <p id="error-empresa" className="text-red-500 text-xs mt-1">
                  {errors.empresa}
                </p>
              )}
            </div>
          )}

          {/* Teléfono / Celular */}
          <div>
            <Label
              htmlFor="contact-telefono"
              className="text-sm font-medium text-gray-700 mb-2 block"
            >
              Teléfono / Celular <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-telefono"
              type="tel"
              placeholder="+56 9 1234 5678"
              value={formData.telefono}
              onChange={(e) => handleInputChange(e, "telefono")}
              disabled={isSubmitting || isLoading}
              className={`border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                errors.telefono ? "border-red-500" : ""
              }`}
              aria-required="true"
              aria-invalid={!!errors.telefono}
              aria-describedby={errors.telefono ? "error-telefono" : undefined}
            />
            {errors.telefono && (
              <p id="error-telefono" className="text-red-500 text-xs mt-1">
                {errors.telefono}
              </p>
            )}
          </div>

          {/* Correo Electrónico */}
          <div>
            <Label
              htmlFor="contact-correo"
              className="text-sm font-medium text-gray-700 mb-2 block"
            >
              Correo electrónico <span className="text-gray-400">(opcional)</span>
            </Label>
            <Input
              id="contact-correo"
              type="email"
              placeholder="juan@ejemplo.com"
              value={formData.correo || ""}
              onChange={(e) => handleInputChange(e, "correo")}
              disabled={isSubmitting || isLoading}
              className={`border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                errors.correo ? "border-red-500" : ""
              }`}
              aria-invalid={!!errors.correo}
              aria-describedby={errors.correo ? "error-correo" : undefined}
            />
            {errors.correo && (
              <p id="error-correo" className="text-red-500 text-xs mt-1">
                {errors.correo}
              </p>
            )}
          </div>

          {/* Error general */}
          {errors.form && (
            <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || isLoading}
              className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isSubmitting || isLoading ? "Enviando..." : "Enviar"}
            </Button>
          </div>

          {/* Información de campos requeridos */}
          <p className="text-xs text-gray-500 text-center pt-2">
            Los campos marcados con <span className="text-red-500">*</span> son
            requeridos
          </p>
        </form>
      </div>
    </div>
  );

  // Renderizar en Shadow DOM si está disponible, sino en document.body
  const portalTarget = (shadowRoot as unknown as Element) || document.body;
  return createPortal(modalContent, portalTarget);
};
