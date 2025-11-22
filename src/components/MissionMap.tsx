import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle, Star } from "lucide-react";

interface Mission {
  id: string;
  title: string;
  description: string;
  type: string;
  position: number;
  gem_reward: number;
  unlocked?: boolean;
  completed?: boolean;
}

interface MissionMapProps {
  missions: Mission[];
  onSelectMission: (mission: Mission) => void;
}

const MissionMap = ({ missions, onSelectMission }: MissionMapProps) => {
  const [hoveredMission, setHoveredMission] = useState<string | null>(null);

  const getMissionIcon = (type: string, completed: boolean) => {
    if (completed) return "✅";
    switch (type) {
      case "start":
        return "🏁";
      case "exercise":
        return "💪";
      case "reward":
        return "🎁";
      case "boss":
        return "👑";
      default:
        return "⭐";
    }
  };

  const sortedMissions = [...missions].sort((a, b) => a.position - b.position);

  return (
    <div className="relative w-full py-8 px-4">
      {/* SVG Path Background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--map-path))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <path
          d="M 80 500 C 200 450, 180 350, 280 300 C 380 250, 400 400, 500 350 C 600 300, 580 200, 700 180 C 800 160, 850 250, 920 200"
          stroke="url(#pathGradient)"
          strokeWidth="30"
          fill="none"
          strokeLinecap="round"
          className="path-animation"
        />
      </svg>

      {/* Mission Nodes */}
      <div className="relative grid grid-cols-1 md:grid-cols-5 gap-6 max-w-6xl mx-auto">
        {sortedMissions.map((mission, index) => {
          const isUnlocked = mission.unlocked ?? false;
          const isCompleted = mission.completed ?? false;
          const verticalOffset = index % 2 === 0 ? "translate-y-0" : "md:translate-y-12";

          return (
            <div
              key={mission.id}
              className={`relative transition-transform duration-300 ${verticalOffset}`}
              onMouseEnter={() => setHoveredMission(mission.id)}
              onMouseLeave={() => setHoveredMission(null)}
            >
              <Card
                className={`p-6 text-center transition-all duration-300 cursor-pointer ${
                  isCompleted
                    ? "bg-success/20 border-success shadow-lg scale-105"
                    : isUnlocked
                    ? "bg-card hover:scale-110 hover:shadow-2xl mission-node-glow"
                    : "bg-muted/50 opacity-60"
                }`}
                onClick={() => isUnlocked && !isCompleted && onSelectMission(mission)}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div
                    className={`text-5xl transition-transform duration-300 ${
                      hoveredMission === mission.id && isUnlocked ? "animate-bounce-in" : ""
                    }`}
                  >
                    {getMissionIcon(mission.type, isCompleted)}
                  </div>

                  <h3 className="font-bold text-sm leading-tight">{mission.title}</h3>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 fill-accent text-accent" />
                    <span>{mission.gem_reward} gemas</span>
                  </div>

                  {!isUnlocked && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      <span>Bloqueada</span>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle className="w-3 h-3" />
                      <span>Completada</span>
                    </div>
                  )}
                </div>

                {hoveredMission === mission.id && isUnlocked && !isCompleted && (
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-48 p-2 bg-popover border rounded-lg shadow-xl z-10 text-xs animate-fade-in">
                    {mission.description}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MissionMap;