import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/chat": {
        target: "https://rag.insecap.cl",
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("[proxy] ->", req.method, req.url, "=>", proxyReq.protocol + "//" + proxyReq.host + proxyReq.path);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("[proxy] <-", req.method, req.url, "status:", proxyRes.statusCode);
          });
          proxy.on("error", (err, req) => {
            console.error("[proxy] !!", req.method, req.url, err.message);
          });
        },
      },
      "/api/chat/cancel": {
        target: "https://rag.insecap.cl",
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("[proxy] ->", req.method, req.url, "=>", proxyReq.protocol + "//" + proxyReq.host + proxyReq.path);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("[proxy] <-", req.method, req.url, "status:", proxyRes.statusCode);
          });
          proxy.on("error", (err, req) => {
            console.error("[proxy] !!", req.method, req.url, err.message);
          });
        },
      },
      "/api/chat/active": {
        target: "https://rag.insecap.cl",
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("[proxy] ->", req.method, req.url, "=>", proxyReq.protocol + "//" + proxyReq.host + proxyReq.path);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("[proxy] <-", req.method, req.url, "status:", proxyRes.statusCode);
          });
          proxy.on("error", (err, req) => {
            console.error("[proxy] !!", req.method, req.url, err.message);
          });
        },
      },
      "/api/telemetry": {
        target: "https://rag.insecap.cl",
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("[proxy] ->", req.method, req.url, "=>", proxyReq.protocol + "//" + proxyReq.host + proxyReq.path);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("[proxy] <-", req.method, req.url, "status:", proxyRes.statusCode);
          });
          proxy.on("error", (err, req) => {
            console.error("[proxy] !!", req.method, req.url, err.message);
          });
        },
      },
      "/api/contact": {
        target: "https://rag.insecap.cl",
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("[proxy] ->", req.method, req.url, "=>", proxyReq.protocol + "//" + proxyReq.host + proxyReq.path);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("[proxy] <-", req.method, req.url, "status:", proxyRes.statusCode);
          });
          proxy.on("error", (err, req) => {
            console.error("[proxy] !!", req.method, req.url, err.message);
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
