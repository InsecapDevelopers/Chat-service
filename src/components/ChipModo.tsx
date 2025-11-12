import { Badge } from "@/components/ui/badge";

interface ChipModoProps {
  mode: "guided" | "free";
  className?: string;
}

export const ChipModo = ({ mode, className = "" }: ChipModoProps) => {
  const isGuided = mode === "guided";
  
  return (
    <Badge 
      variant={isGuided ? "default" : "secondary"}
      className={`
        text-xs font-medium px-2 py-1
        ${isGuided 
          ? "bg-blue-100 text-blue-700 border-blue-200" 
          : "bg-green-100 text-green-700 border-green-200"
        }
        ${className}
      `}
    >
      {isGuided ? "🎯 Guided" : "💭 Free"}
    </Badge>
  );
};