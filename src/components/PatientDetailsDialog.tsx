import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, CheckCircle2, Clock, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Mission {
  id: string;
  title: string;
  description: string;
  gem_reward: number;
  position: number;
}

interface UserMission {
  mission_id: string;
  completed: boolean;
  completed_at: string | null;
  mission: Mission;
}

interface Result {
  id: string;
  created_at: string;
  gems_earned: number;
  duration_seconds: number | null;
  mission: Mission;
}

interface PatientDetailsDialogProps {
  patientId: string | null;
  patientName: string;
  patientAvatar: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PatientDetailsDialog({
  patientId,
  patientName,
  patientAvatar,
  open,
  onOpenChange,
}: PatientDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [missions, setMissions] = useState<UserMission[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  useEffect(() => {
    if (open && patientId) {
      loadPatientDetails();
    }
  }, [open, patientId]);

  const loadPatientDetails = async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      // Load missions with status
      const { data: userMissions } = await supabase
        .from("user_missions")
        .select(`
          mission_id,
          completed,
          completed_at,
          mission:missions(id, title, description, gem_reward, position)
        `)
        .eq("user_id", patientId)
        .order("completed_at", { ascending: false });

      setMissions(userMissions as any || []);

      // Load results history
      const { data: resultsData } = await supabase
        .from("results")
        .select(`
          id,
          created_at,
          gems_earned,
          duration_seconds,
          mission:missions(id, title, description, gem_reward, position)
        `)
        .eq("user_id", patientId)
        .order("created_at", { ascending: false })
        .limit(10);

      setResults(resultsData as any || []);

      // Calculate weekly activity
      if (resultsData) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weeklyResults = resultsData.filter(r => 
          new Date(r.created_at) >= weekAgo
        );

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const dailyCount = new Array(7).fill(0);
        
        weeklyResults.forEach(result => {
          const day = new Date(result.created_at).getDay();
          dailyCount[day]++;
        });

        const chartData = dailyCount.map((count, index) => ({
          day: dayNames[index],
          misiones: count,
        }));

        setWeeklyData(chartData);
      }
    } catch (error) {
      console.error("Error loading patient details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const completedCount = missions.filter(m => m.completed).length;
  const completionRate = missions.length > 0 ? (completedCount / missions.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="text-4xl">{patientAvatar}</div>
            <div>
              <DialogTitle className="text-2xl">{patientName}</DialogTitle>
              <DialogDescription>
                {completedCount} de {missions.length} misiones completadas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : (
            <div className="space-y-6">
              {/* Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de Progreso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Completado</span>
                      <span className="font-bold text-primary">{Math.round(completionRate)}%</span>
                    </div>
                    <Progress value={completionRate} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{completedCount}</div>
                      <div className="text-xs text-muted-foreground">Completadas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-accent">{missions.length - completedCount}</div>
                      <div className="text-xs text-muted-foreground">Pendientes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-success">{results.reduce((acc, r) => acc + r.gems_earned, 0)}</div>
                      <div className="text-xs text-muted-foreground">Gemas 💎</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Activity Chart */}
              {weeklyData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actividad Semanal</CardTitle>
                    <CardDescription>Misiones completadas en los últimos 7 días</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="misiones" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Historial Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Sin actividad reciente
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {results.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-success" />
                            <div>
                              <div className="font-medium">{result.mission.title}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {formatDate(result.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {result.duration_seconds && (
                              <Badge variant="outline" className="font-mono">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(result.duration_seconds)}
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              <Trophy className="h-3 w-3 mr-1" />
                              +{result.gems_earned}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Missions Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estado de Misiones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {missions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No hay misiones asignadas
                      </p>
                    ) : (
                      missions.map((um) => (
                        <div
                          key={um.mission_id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              um.completed ? 'bg-success' : 'bg-muted-foreground'
                            }`} />
                            <div>
                              <div className="font-medium">{um.mission.title}</div>
                              {um.completed_at && (
                                <div className="text-xs text-muted-foreground">
                                  Completada: {formatDate(um.completed_at)}
                                </div>
                              )}
                            </div>
                          </div>
                          {um.completed ? (
                            <Badge variant="default" className="bg-success">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completada
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pendiente</Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
