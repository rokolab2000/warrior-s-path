import { Sparkles } from "lucide-react";

interface GemCounterProps {
  gems: number;
}

const GemCounter = ({ gems }: GemCounterProps) => {
  return (
    <div className="flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full border-2 border-accent">
      <div className="relative">
        <Sparkles className="w-6 h-6 text-accent gem-glow animate-pulse" />
      </div>
      <span className="font-bold text-lg">{gems}</span>
      <span className="text-sm font-medium">Gemas</span>
    </div>
  );
};

export default GemCounter;