import { useEffect, useState } from "react";
import { Brain, CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProcessingStepProps {
  progress: number;
  message: string | null;
  status: string;
}

const PROCESSING_MESSAGES = [
  "Analisando documento...",
  "Identificando itens...",
  "Extraindo quantidades...",
  "Classificando categorias...",
  "Finalizando análise...",
];

export function ProcessingStep({ progress, message, status }: ProcessingStepProps) {
  const [currentMessage, setCurrentMessage] = useState(0);

  // Rotate through messages while processing
  useEffect(() => {
    if (status !== "processing") return;
    
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [status]);

  const displayMessage = message || PROCESSING_MESSAGES[currentMessage];
  const isComplete = status === "completed";
  const isFailed = status === "failed";

  return (
    <div className="space-y-8 text-center">
      {/* Icon Animation */}
      <div className="relative mx-auto h-24 w-24">
        {/* Outer ring animation */}
        <div
          className={`absolute inset-0 rounded-full border-4 ${
            isComplete
              ? "border-success"
              : isFailed
              ? "border-destructive"
              : "border-primary/30 animate-pulse"
          }`}
        />
        
        {/* Inner circle with icon */}
        <div
          className={`absolute inset-2 flex items-center justify-center rounded-full ${
            isComplete
              ? "bg-success/10"
              : isFailed
              ? "bg-destructive/10"
              : "bg-primary/10"
          }`}
        >
          {isComplete ? (
            <CheckCircle2 className="h-10 w-10 text-success" />
          ) : isFailed ? (
            <span className="text-3xl">❌</span>
          ) : (
            <Brain className="h-10 w-10 text-primary animate-pulse" />
          )}
        </div>

        {/* Spinning loader */}
        {!isComplete && !isFailed && (
          <div className="absolute inset-0">
            <Loader2 className="h-24 w-24 text-primary/50 animate-spin" />
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <h2 className="font-display text-2xl font-bold">
          {isComplete
            ? "Análise concluída!"
            : isFailed
            ? "Falha na análise"
            : "Processando com IA..."}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {displayMessage}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress
          value={progress}
          className={`h-3 ${
            isComplete
              ? "[&>div]:bg-success"
              : isFailed
              ? "[&>div]:bg-destructive"
              : ""
          }`}
        />
        <p className="text-sm text-muted-foreground">
          {progress}% concluído
        </p>
      </div>

      {/* Processing steps indicator */}
      {!isComplete && !isFailed && (
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-2 w-2 rounded-full transition-all ${
                step <= Math.ceil(progress / 20)
                  ? "bg-primary scale-110"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
