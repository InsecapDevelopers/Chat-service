// Archivo: src/components/ContactModalExample.tsx
// Este archivo muestra un ejemplo de cómo integrar ContactModal en CapinChat

import { ContactModal, type ContactFormData } from "@/components/ContactModal";
import { useContact } from "@/hooks/useContact";

interface ContactModalIntegrationProps {
  userRole?: string;
}

export const ContactModalIntegration = ({ userRole = "publico" }: ContactModalIntegrationProps) => {
  const { showContactModal, handleSubmitContact, setShowContactModal } = useContact();

  // Solo mostrar para rol "publico"
  const shouldShowModal = showContactModal && userRole === "publico";

  const handleSubmit = async (data: ContactFormData) => {
    console.log("📋 Datos de contacto recibidos:", data);

    // TODO: Descomentar cuando tengas el backend listo
    // try {
    //   const response = await fetch("/api/contact", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(data),
    //   });
    //
    //   if (!response.ok) {
    //     throw new Error("Error al guardar datos de contacto");
    //   }
    //
    //   await handleSubmitContact(data);
    // } catch (error) {
    //   console.error("Error:", error);
    //   throw error;
    // }

    // Por ahora, solo llamar a handleSubmitContact
    await handleSubmitContact(data);
  };

  const handleCancel = () => {
    console.log("Usuario hizo click en Cancelar");
    setShowContactModal(false);
  };

  return (
    <ContactModal
      isOpen={shouldShowModal}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};
