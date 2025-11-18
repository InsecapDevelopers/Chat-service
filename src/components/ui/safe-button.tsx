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
    const clickedRef = React.useRef(false);
    
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (clickedRef.current) return;
        clickedRef.current = true;
        onClick?.(e);
        
        // Reset después de un breve delay
        setTimeout(() => {
          clickedRef.current = false;
        }, 100);
      },
      [onClick]
    );

    const handlePointerUp = React.useCallback(
      (e: React.PointerEvent<HTMLButtonElement>) => {
        // Llamar al onPointerUp original si existe
        onPointerUp?.(e);
        
        // Solo usar onPointerUp como fallback si onClick no fue llamado
        // (fallback para Shadow DOM donde onClick puede ser bloqueado)
        if (onClick && !clickedRef.current && !e.defaultPrevented) {
          clickedRef.current = true;
          // Convertir PointerEvent a MouseEvent para compatibilidad
          onClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
          
          // Reset después de un breve delay
          setTimeout(() => {
            clickedRef.current = false;
          }, 100);
        }
      },
      [onClick, onPointerUp]
    );

    return (
      <Button
        ref={ref}
        onClick={handleClick}
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
