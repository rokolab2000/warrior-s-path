import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, CameraOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Mission {
  id: string;
  title: string;
  description: string;
  exercise_type?: string;
  gem_reward: number;
}

interface CameraExerciseProps {
  mission: Mission;
  onComplete: (missionId: string, gemsEarned: number) => void;
  onCancel: () => void;
}

const CameraExercise = ({ mission, onComplete, onCancel }: CameraExerciseProps) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [exercising, setExercising] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        toast.success("Cámara activada - ¡Prepárate!");
      }
    } catch (error) {
      toast.error("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startExercise = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      setExercising(true);
      simulateExercise();
    }
  }, [countdown]);

  const simulateExercise = () => {
    // Simulate exercise progress for MVP
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setExercising(false);
        stopCamera();
        toast.success("¡Ejercicio completado! 🎉");
        setTimeout(() => {
          onComplete(mission.id, mission.gem_reward);
        }, 500);
      }
    }, 500);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          {mission.title}
        </CardTitle>
        <CardDescription>{mission.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-8xl font-bold text-white animate-bounce-in">
                    {countdown}
                  </span>
                </div>
              )}
              {exercising && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-background/90 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-center text-sm font-medium mt-2">
                    ¡Sigue así! {progress}%
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Activa la cámara para comenzar
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          {!cameraActive ? (
            <>
              <Button onClick={startCamera} size="lg" className="gap-2">
                <Camera className="w-5 h-5" />
                Activar Cámara
              </Button>
              <Button onClick={onCancel} variant="outline" size="lg">
                Cancelar
              </Button>
            </>
          ) : !exercising && countdown === null ? (
            <>
              <Button onClick={startExercise} size="lg" className="gap-2">
                <CheckCircle className="w-5 h-5" />
                Comenzar Ejercicio
              </Button>
              <Button onClick={() => { stopCamera(); onCancel(); }} variant="outline" size="lg">
                <CameraOff className="w-5 h-5" />
                Detener
              </Button>
            </>
          ) : null}
        </div>

        <div className="bg-secondary/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Instrucciones:</h4>
          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
            <li>Asegúrate de tener buena iluminación</li>
            <li>Mantén tu cuerpo completo visible en la cámara</li>
            <li>Sigue las indicaciones en pantalla</li>
            <li>¡Diviértete y da lo mejor de ti!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraExercise;