/**
 * SafeButton - Botón seguro para Shadow DOM
 * 
 * Problema: En Shadow DOM, los eventos onClick pueden ser bloqueados por 
 * capas intermedias con pointer-events: none.
 * 
 * Solución: Añade onPointerUp como fallback que garantiza que el evento
 * llegue incluso cuando onClick es bloqueado.
 */

import * as React from "react"
import { Button, ButtonProps } from "./button"

export interface SafeButtonProps extends ButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const SafeButton = React.forwardRef<HTMLButtonElement, SafeButtonProps>(
  ({ onClick, onPointerUp, ...props }, ref) => {
    const handlePointerUp = React.useCallback(
      (e: React.PointerEvent<HTMLButtonElement>) => {
        // Llamar al onPointerUp original si existe
        onPointerUp?.(e);
        
        // Si onClick no se disparó, llamarlo manualmente desde PointerUp
        // (fallback para Shadow DOM donde onClick puede ser bloqueado)
        if (onClick && !e.defaultPrevented) {
          // Convertir PointerEvent a MouseEvent para compatibilidad
          onClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
        }
      },
      [onClick, onPointerUp]
    );

    return (
      <Button
        ref={ref}
        onClick={onClick}
        onPointerUp={handlePointerUp}
        {...props}
        style={{
          ...props.style,
          pointerEvents: 'auto',
          cursor: 'pointer'
        }}
      />
    );
  }
);

SafeButton.displayName = "SafeButton";

export { SafeButton };
