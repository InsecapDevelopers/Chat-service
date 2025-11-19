import { CapinChat } from "@/components/CapinChat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Shield, Clock, FileText } from "lucide-react";
import insecapLogo from "@/assets/insecap-logo.png";
import ChatWidget from "@/components/ChatWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={insecapLogo} alt="Insecap" className="h-10 w-auto" />
              <div className="border-l border-border pl-4">
                <h1 className="text-xl font-bold text-foreground">Portal TMS</h1>
                <p className="text-sm text-muted-foreground">Sistema de Gestión de Capacitación</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Sistema Activo
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Information */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Bienvenido a <span className="text-primary">CapinIA</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Tu asistente virtual inteligente integrado al portal TMS de Insecap SPA. 
                Obtén respuestas inmediatas sobre cursos, capacitaciones y procedimientos.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Chat Inteligente</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Conversaciones naturales con contexto personalizado según tu rol
                  </p>
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold">Archivos</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Envía documentos e imágenes para consultas específicas
                  </p>
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Seguro</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Información filtrada según tu nivel de acceso y permisos
                  </p>
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold">24/7</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Disponible las 24 horas para resolver tus consultas
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">¿Cómo usar CapinIA?</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <p className="text-sm">Escribe tu consulta en el chat</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <p className="text-sm">Adjunta archivos si es necesario</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                  <p className="text-sm">Recibe respuestas contextualizadas inmediatamente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Chat */}
          <div className="hidden">
            {/* Chat Widget movido a App.tsx para flotante */}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={insecapLogo} alt="Insecap" className="h-6 w-auto" />
              <p className="text-sm text-muted-foreground">
                © 2024 Insecap SPA. Todos los derechos reservados.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">Soporte</Button>
              <Button variant="ghost" size="sm">Documentación</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
