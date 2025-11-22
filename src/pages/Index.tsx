import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Target, Trophy } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-8">
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-6xl mb-4">
            <span className="animate-bounce-in" style={{ animationDelay: "0s" }}>🦅</span>
            <span className="animate-bounce-in" style={{ animationDelay: "0.1s" }}>🐆</span>
            <span className="animate-bounce-in" style={{ animationDelay: "0.2s" }}>🦙</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            El Camino del Guerrero
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Transforma tu rehabilitación en una aventura épica. 
            Completa misiones, gana recompensas y conviértete en el héroe de tu propia historia.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="gap-2 text-lg px-8 py-6"
          >
            Comenzar Aventura
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card p-6 rounded-xl shadow-lg space-y-3 animate-fade-in hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Misiones Personalizadas</h3>
            <p className="text-muted-foreground">
              Ejercicios adaptados a tu ritmo y necesidades, diseñados por especialistas.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-lg space-y-3 animate-fade-in hover:scale-105 transition-transform" style={{ animationDelay: "0.1s" }}>
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold">Sistema de Recompensas</h3>
            <p className="text-muted-foreground">
              Gana gemas y desbloquea nuevas misiones mientras avanzas en tu recuperación.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-lg space-y-3 animate-fade-in hover:scale-105 transition-transform" style={{ animationDelay: "0.2s" }}>
            <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-bold">Seguimiento Visual</h3>
            <p className="text-muted-foreground">
              Usa tu cámara para ejercicios interactivos con retroalimentación en tiempo real.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl p-12 space-y-6 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">
            ¿Listo para comenzar tu camino?
          </h2>
          <p className="text-lg text-muted-foreground">
            Únete a otros guerreros que ya están transformando su rehabilitación en una aventura memorable.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="gap-2 text-lg px-8 py-6"
          >
            Crear mi cuenta gratis
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
