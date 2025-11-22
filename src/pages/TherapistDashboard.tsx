import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, TrendingUp, LogOut, UserPlus, Eye, Activity } from "lucide-react";
import { toast } from "sonner";
import AddPatientDialog from "@/components/AddPatientDialog";
import PatientDetailsDialog from "@/components/PatientDetailsDialog";

interface Patient {
  id: string;
  name: string;
  avatar: string;
  gems: number;
  availability: string;
}

interface PatientProgress {
  patient: Patient;
  completedMissions: number;
  totalMissions: number;
  completionRate: number;
  lastActivity: string | null;
}

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientProgress[]>([]);
  const [therapistName, setTherapistName] = useState("");
  const [therapistId, setTherapistId] = useState("");
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [detailsPatientId, setDetailsPatientId] = useState<string | null>(null);
  const [detailsPatientName, setDetailsPatientName] = useState("");
  const [detailsPatientAvatar, setDetailsPatientAvatar] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    checkTherapistRole();
  }, []);

  const checkTherapistRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user has therapist role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "therapist")
      .single();

    if (!roles) {
      toast.error("No tienes permisos de terapeuta");
      navigate("/dashboard");
      return;
    }

    // Get therapist profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    if (profile) {
      setTherapistName(profile.name);
    }

    setTherapistId(user.id);
    await loadPatients(user.id);
  };

  const loadPatients = async (therapistId: string) => {
    try {
      // Get therapist's patients
      const { data: patientLinks } = await supabase
        .from("therapist_patients")
        .select("patient_id")
        .eq("therapist_id", therapistId);

      if (!patientLinks || patientLinks.length === 0) {
        setLoading(false);
        return;
      }

      const patientIds = patientLinks.map(p => p.patient_id);

      // Get patient profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", patientIds);

      // Get all missions
      const { data: missions } = await supabase
        .from("missions")
        .select("id");

      const totalMissions = missions?.length || 0;

      // Get progress for each patient
      const progressData = await Promise.all(
        (profiles || []).map(async (patient) => {
          const { data: userMissions } = await supabase
            .from("user_missions")
            .select("completed, completed_at")
            .eq("user_id", patient.id);

          const completedMissions = userMissions?.filter(m => m.completed).length || 0;
          const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;
          
          const lastCompleted = userMissions
            ?.filter(m => m.completed_at)
            .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];

          return {
            patient,
            completedMissions,
            totalMissions,
            completionRate,
            lastActivity: lastCompleted?.completed_at || null
          };
        })
      );

      setPatients(progressData);
    } catch (error) {
      console.error("Error loading patients:", error);
      toast.error("Error al cargar pacientes");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const formatLastActivity = (date: string | null) => {
    if (!date) return "Sin actividad";
    const diffMs = Date.now() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    return `Hace ${diffDays} días`;
  };

  const handleViewDetails = (patient: Patient) => {
    setDetailsPatientId(patient.id);
    setDetailsPatientName(patient.name);
    setDetailsPatientAvatar(patient.avatar);
    setDetailsOpen(true);
  };

  const handlePatientAdded = () => {
    if (therapistId) {
      loadPatients(therapistId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/10">
        <div className="text-2xl font-bold text-primary animate-pulse">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏥</div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Panel de Terapeuta</h1>
              <p className="text-sm text-muted-foreground">Bienvenido, {therapistName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAddPatientOpen(true)} variant="default" size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Agregar Paciente
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {patients.filter(p => p.lastActivity && 
                  new Date(p.lastActivity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length} activos esta semana
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patients.length > 0
                  ? Math.round(patients.reduce((acc, p) => acc + p.completionRate, 0) / patients.length)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {patients.filter(p => p.completionRate === 100).length} completaron todo
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gemas Totales</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patients.reduce((acc, p) => acc + p.patient.gems, 0)} 💎
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Promedio: {patients.length > 0 
                  ? Math.round(patients.reduce((acc, p) => acc + p.patient.gems, 0) / patients.length)
                  : 0} por paciente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Patient List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Mis Pacientes</h2>
            {patients.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                <Activity className="h-3 w-3 mr-1" />
                {patients.length} pacientes
              </Badge>
            )}
          </div>
          
          {patients.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No tienes pacientes asignados aún</p>
                <Button onClick={() => setAddPatientOpen(true)} variant="default">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Agregar Primer Paciente
                </Button>
              </CardContent>
            </Card>
          ) : (
            patients.map((progress) => (
              <Card key={progress.patient.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{progress.patient.avatar}</div>
                      <div>
                        <CardTitle>{progress.patient.name}</CardTitle>
                        <CardDescription>
                          {progress.completedMissions} de {progress.totalMissions} misiones completadas
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="font-mono">
                        {progress.patient.gems} 💎
                      </Badge>
                      <Badge variant="secondary">
                        {progress.patient.availability === "daily" ? "Diario" : 
                         progress.patient.availability === "3x_week" ? "3x Semana" : "Semanal"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-bold text-primary">{Math.round(progress.completionRate)}%</span>
                      </div>
                      <Progress value={progress.completionRate} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Última actividad: {formatLastActivity(progress.lastActivity)}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDetails(progress.patient)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Dialogs */}
      <AddPatientDialog
        therapistId={therapistId}
        open={addPatientOpen}
        onOpenChange={setAddPatientOpen}
        onPatientAdded={handlePatientAdded}
      />

      <PatientDetailsDialog
        patientId={detailsPatientId}
        patientName={detailsPatientName}
        patientAvatar={detailsPatientAvatar}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
