import { useContext } from "react";
import { ContactContext } from "@/contexts/ContactContextDefinition";
import type { ContactContextType } from "@/contexts/ContactContextDefinition";

export const useContact = (): ContactContextType => {
  const context = useContext(ContactContext);
  if (context === undefined) {
    throw new Error("useContact debe ser usado dentro de ContactProvider");
  }
  return context;
};
