import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle } from "lucide-react";

interface DebugBannerProps {
  modeMismatch?: { expected: string; received: string; strategy?: string } | null;
  forcedGuidedMode?: boolean;
  className?: string;
}

export const DebugBanner = ({ modeMismatch, forcedGuidedMode, className = "" }: DebugBannerProps) => {
  if (!modeMismatch && !forcedGuidedMode) {
    return null;
  }

  return (
    <div className={`px-3 py-2 space-y-2 ${className}`}>
      {/* Banner de mode mismatch */}
      {modeMismatch && (
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800">
            ℹ️ El servidor respondió en <strong>{modeMismatch.received}</strong> pero se esperaba <strong>{modeMismatch.expected}</strong>.
            {modeMismatch.strategy === "forced_by_flag" && " Verifica FREE_MODE_ENABLED=true en backend."}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Badge de guided forzado */}
      {forcedGuidedMode && (
        <div className="flex items-center justify-center">
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Modo Guided forzado por configuración del servidor
          </Badge>
        </div>
      )}
    </div>
  );
};