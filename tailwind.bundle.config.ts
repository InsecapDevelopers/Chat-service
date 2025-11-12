import type { Config } from "tailwindcss";
import baseConfig from "./tailwind.config";

export default {
	...baseConfig,
	important: "#capin-chat-root", // Crítico para aislar estilos del TMS
} satisfies Config;
