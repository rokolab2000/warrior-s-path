import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const WARRIOR_ANIMALS = [
  { emoji: "🦅", name: "Cóndor" },
  { emoji: "🐆", name: "Jaguar" },
  { emoji: "🦙", name: "Llama" },
  { emoji: "🦜", name: "Guacamayo" },
  { emoji: "🐺", name: "Lobo" },
  { emoji: "🦁", name: "León" },
];

const AVAILABILITY_OPTIONS = [
  { value: "daily", label: "Diario (todos los días)" },
  { value: "weekdays", label: "Entre semana" },
  { value: "weekends", label: "Fines de semana" },
  { value: "flexible", label: "Flexible" },
];

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(WARRIOR_ANIMALS[0].emoji);
  const [availability, setAvailability] = useState(AVAILABILITY_OPTIONS[0].value);
  const [role, setRole] = useState<"patient" | "therapist">("patient");
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name,
              avatar: selectedAvatar,
              availability,
              role,
            },
          },
        });

        if (error) throw error;

        // If therapist, add therapist role
        if (data.user && role === "therapist") {
          await supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: "therapist",
          });
        }

        toast.success("¡Bienvenido al Camino del Guerrero! 🎉");
        
        // Navigate based on role
        navigate(role === "therapist" ? "/therapist" : "/dashboard");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check user role after login
        if (data.user) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id);

          const isTherapist = roles?.some(r => r.role === "therapist");
          toast.success("¡Bienvenido de vuelta, guerrero! 💪");
          navigate(isTherapist ? "/therapist" : "/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error en la autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center">
            {isSignUp ? "Únete al Camino" : "Bienvenido de Vuelta"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp
              ? "Comienza tu aventura de rehabilitación"
              : "Continúa tu viaje hacia la recuperación"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Elige tu Animal Guerrero</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {WARRIOR_ANIMALS.map((animal) => (
                      <button
                        key={animal.emoji}
                        type="button"
                        onClick={() => setSelectedAvatar(animal.emoji)}
                        className={`text-3xl p-2 rounded-lg transition-all ${
                          selectedAvatar === animal.emoji
                            ? "bg-primary scale-110 shadow-lg"
                            : "bg-secondary hover:bg-secondary/80"
                        }`}
                      >
                        {animal.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">Disponibilidad</Label>
                  <select
                    id="availability"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full p-2 rounded-lg border border-input bg-background"
                  >
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Tipo de Cuenta</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "patient" | "therapist")}
                    className="w-full p-2 rounded-lg border border-input bg-background"
                  >
                    <option value="patient">Paciente</option>
                    <option value="therapist">Terapeuta</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Cargando..." : isSignUp ? "Comenzar Aventura" : "Iniciar Sesión"}
            </Button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;