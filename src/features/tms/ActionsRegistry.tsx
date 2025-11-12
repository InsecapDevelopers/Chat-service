import { ReactElement } from "react";

export interface ActionRegistryItem {
  id: string;
  component: ReactElement;
  roles: string[]; // Roles que pueden ver esta acción
  order?: number; // Para ordenamiento opcional
}

class ActionsRegistry {
  private actions: Map<string, ActionRegistryItem> = new Map();

  register(item: ActionRegistryItem) {
    this.actions.set(item.id, item);
  }

  unregister(id: string) {
    this.actions.delete(id);
  }

  getActionsForRole(currentRole: string): ActionRegistryItem[] {
    const available = Array.from(this.actions.values())
      .filter(action => action.roles.includes(currentRole))
      .sort((a, b) => (a.order || 999) - (b.order || 999));
    
    return available;
  }

  getAction(id: string): ActionRegistryItem | undefined {
    return this.actions.get(id);
  }

  getAllActions(): ActionRegistryItem[] {
    return Array.from(this.actions.values());
  }
}

// Instancia singleton del registry
export const actionsRegistry = new ActionsRegistry();