import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import MissionMap from "@/components/MissionMap";
import CameraExercise from "@/components/CameraExercise";
import GemCounter from "@/components/GemCounter";

interface Profile {
  id: string;
  name: string;
  avatar: string;
  gems: number;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  type: string;
  exercise_type?: string;
  position: number;
  gem_reward: number;
}

interface UserMission {
  mission_id: string;
  unlocked: boolean;
  completed: boolean;
  mission: Mission;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user is therapist
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const isTherapist = roles?.some(r => r.role === "therapist");
    if (isTherapist) {
      navigate("/therapist");
      return;
    }

    await loadProfile(session.user.id);
    await loadMissions(session.user.id);
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      toast.error("Error cargando perfil");
      return;
    }

    setProfile(data);
  };

  const loadMissions = async (userId: string) => {
    // Get all missions
    const { data: allMissions, error: missionsError } = await supabase
      .from("missions")
      .select("*")
      .order("position");

    if (missionsError) {
      toast.error("Error cargando misiones");
      setLoading(false);
      return;
    }

    // Get user progress
    const { data: userProgress, error: progressError } = await supabase
      .from("user_missions")
      .select("*")
      .eq("user_id", userId);

    if (progressError) {
      toast.error("Error cargando progreso");
      setLoading(false);
      return;
    }

    // If no progress, initialize first mission
    if (!userProgress || userProgress.length === 0) {
      await initializeFirstMission(userId, allMissions[0].id);
      await loadMissions(userId); // Reload
      return;
    }

    // Merge mission data with progress
    const missionsWithProgress = allMissions.map((mission) => {
      const progress = userProgress.find((p) => p.mission_id === mission.id);
      return {
        ...mission,
        unlocked: progress?.unlocked ?? false,
        completed: progress?.completed ?? false,
      };
    });

    setMissions(missionsWithProgress);
    setLoading(false);
  };

  const initializeFirstMission = async (userId: string, firstMissionId: string) => {
    await supabase.from("user_missions").insert({
      user_id: userId,
      mission_id: firstMissionId,
      unlocked: true,
      completed: false,
    });
  };

  const handleCompleteMission = async (missionId: string, gemsEarned: number) => {
    if (!profile) return;

    try {
      // Mark mission as completed
      const { error: updateError } = await supabase
        .from("user_missions")
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("user_id", profile.id)
        .eq("mission_id", missionId);

      if (updateError) throw updateError;

      // Update gems
      const { error: gemsError } = await supabase
        .from("profiles")
        .update({ gems: profile.gems + gemsEarned })
        .eq("id", profile.id);

      if (gemsError) throw gemsError;

      // Record result
      const { error: resultError } = await supabase.from("results").insert({
        user_id: profile.id,
        mission_id: missionId,
        gems_earned: gemsEarned,
        completed: true,
      });

      if (resultError) throw resultError;

      // Unlock next mission
      const currentMission = missions.find((m) => m.id === missionId);
      if (currentMission) {
        const nextMission = missions.find((m) => m.position === currentMission.position + 1);
        if (nextMission) {
          const { error: unlockError } = await supabase.from("user_missions").upsert({
            user_id: profile.id,
            mission_id: nextMission.id,
            unlocked: true,
            completed: false,
          }, {
            onConflict: 'user_id,mission_id'
          });

          if (unlockError) throw unlockError;
        }
      }

      setSelectedMission(null);
      toast.success(`¡Completado! +${gemsEarned} gemas 💎`, {
        className: "animate-celebrate",
      });

      // Reload data
      await loadProfile(profile.id);
      await loadMissions(profile.id);
    } catch (error) {
      console.error("Error completing mission:", error);
      toast.error("Error al completar la misión. Intenta nuevamente.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce-in">⏳</div>
          <p className="text-muted-foreground">Cargando tu aventura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{profile?.avatar}</span>
            <div>
              <h1 className="text-xl font-bold">¡Hola, {profile?.name}!</h1>
              <p className="text-sm text-muted-foreground">El Camino del Guerrero</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <GemCounter gems={profile?.gems ?? 0} />
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {selectedMission ? (
          <div className="animate-fade-in">
            <CameraExercise
              mission={selectedMission}
              onComplete={handleCompleteMission}
              onCancel={() => setSelectedMission(null)}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Tu Mapa de Misiones</h2>
              <p className="text-muted-foreground">
                Completa cada misión para desbloquear la siguiente y ganar gemas
              </p>
            </div>

            <MissionMap missions={missions} onSelectMission={setSelectedMission} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;