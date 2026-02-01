import { useEffect, useState } from "react";
import { Brain, CheckCircle2, Loader2, AlertTriangle, PenLine } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface ProcessingStepProps {
  progress: number;
  message: string | null;
  status: string;
  extractedItemsCount?: number;
  onManualEntry?: () => void;
}

const PROCESSING_MESSAGES = [
  "Analisando documento...",
  "Identificando itens...",
  "Extraindo quantidades...",
  "Classificando categorias...",
  "Finalizando análise...",
];

export function ProcessingStep({ 
  progress, 
  message, 
  status, 
  extractedItemsCount = 0,
  onManualEntry 
}: ProcessingStepProps) {
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
  const hasNoItems = isComplete && extractedItemsCount === 0;

  return (
    <div className="space-y-8 text-center">
      {/* Icon Animation */}
      <div className="relative mx-auto h-24 w-24">
        {/* Outer ring animation */}
        <div
          className={`absolute inset-0 rounded-full border-4 ${
            isComplete && !hasNoItems
              ? "border-success"
              : isFailed || hasNoItems
              ? "border-amber-500"
              : "border-primary/30 animate-pulse"
          }`}
        />
        
        {/* Inner circle with icon */}
        <div
          className={`absolute inset-2 flex items-center justify-center rounded-full ${
            isComplete && !hasNoItems
              ? "bg-success/10"
              : isFailed || hasNoItems
              ? "bg-amber-500/10"
              : "bg-primary/10"
          }`}
        >
          {isComplete && !hasNoItems ? (
            <CheckCircle2 className="h-10 w-10 text-success" />
          ) : isFailed || hasNoItems ? (
            <AlertTriangle className="h-10 w-10 text-amber-500" />
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
          {isComplete && !hasNoItems
            ? "Análise concluída!"
            : hasNoItems
            ? "Nenhum item encontrado"
            : isFailed
            ? "Falha na análise"
            : "Processando com IA..."}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {hasNoItems 
            ? "A IA não conseguiu extrair itens da lista. Você pode adicionar os itens manualmente."
            : displayMessage}
        </p>
      </div>

      {/* Progress Bar */}
      {!hasNoItems && (
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
      )}

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

      {/* Manual Entry Fallback */}
      {(isFailed || hasNoItems) && onManualEntry && (
        <div className="space-y-4 pt-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Não se preocupe! Você pode adicionar os itens da lista manualmente.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={onManualEntry}
          >
            <PenLine className="h-4 w-4" />
            Adicionar itens manualmente
          </Button>
        </div>
      )}
    </div>
  );
}
