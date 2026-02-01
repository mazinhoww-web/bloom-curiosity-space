import { Loader2, CheckCircle2, AlertCircle, FileText, Files, Edit3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProcessingState {
  currentFile: number;
  totalFiles: number;
  status: string;
  progress: number;
  message: string | null;
}

interface MultiPageProcessingStepProps {
  processingState: ProcessingState;
  extractedItemsCount: number;
  onManualEntry: () => void;
}

export function MultiPageProcessingStep({
  processingState,
  extractedItemsCount,
  onManualEntry,
}: MultiPageProcessingStepProps) {
  const { currentFile, totalFiles, status, progress, message } = processingState;
  
  const isCompleted = status === "completed";
  const isFailed = status === "failed";
  const isProcessing = !isCompleted && !isFailed;

  // Show fallback option if completed but no items extracted
  const showFallback = isCompleted && extractedItemsCount === 0;

  return (
    <div className="space-y-6 text-center">
      {/* Icon */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        {isCompleted && !showFallback ? (
          <CheckCircle2 className="h-10 w-10 text-success" />
        ) : isFailed || showFallback ? (
          <AlertCircle className="h-10 w-10 text-warning" />
        ) : (
          <div className="relative">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            {totalFiles > 1 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center text-xs"
              >
                {currentFile}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <h2 className="font-display text-2xl font-bold">
          {isCompleted && !showFallback
            ? "Análise concluída!"
            : isFailed
            ? "Erro no processamento"
            : showFallback
            ? "Nenhum item encontrado"
            : "Analisando lista..."}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {isCompleted && !showFallback
            ? message || "Itens extraídos com sucesso"
            : isFailed
            ? message || "Ocorreu um erro durante o processamento"
            : showFallback
            ? "A IA não conseguiu identificar itens na lista"
            : totalFiles > 1
            ? `Processando página ${currentFile} de ${totalFiles}`
            : "Isso pode levar alguns segundos"}
        </p>
      </div>

      {/* Multi-page indicator */}
      {totalFiles > 1 && isProcessing && (
        <div className="flex items-center justify-center gap-2">
          <Files className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {totalFiles} páginas sendo analisadas
          </span>
        </div>
      )}

      {/* Progress */}
      {isProcessing && (
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {message || "Processando..."}
          </p>
        </div>
      )}

      {/* Page progress indicators */}
      {totalFiles > 1 && isProcessing && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: totalFiles }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-colors ${
                i < currentFile
                  ? "bg-success"
                  : i === currentFile - 1
                  ? "bg-primary animate-pulse"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}

      {/* Completed state with items count */}
      {isCompleted && !showFallback && extractedItemsCount > 0 && (
        <div className="flex items-center justify-center gap-2 text-success">
          <FileText className="h-5 w-5" />
          <span className="font-medium">
            {extractedItemsCount} {extractedItemsCount === 1 ? "item encontrado" : "itens encontrados"}
            {totalFiles > 1 && ` em ${totalFiles} páginas`}
          </span>
        </div>
      )}

      {/* Fallback option */}
      {(showFallback || isFailed) && (
        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-warning/10 p-4 text-left">
            <p className="text-sm text-warning-foreground">
              {isFailed
                ? "Ocorreu um erro ao processar o arquivo. Você pode tentar novamente ou adicionar os itens manualmente."
                : "A IA não conseguiu extrair itens automaticamente. Isso pode acontecer com listas manuscritas ou imagens de baixa qualidade."}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={onManualEntry}
          >
            <Edit3 className="h-4 w-4" />
            Adicionar itens manualmente
          </Button>
        </div>
      )}

      {/* Processing tips */}
      {isProcessing && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 Dica: Listas digitadas são processadas mais rapidamente</p>
          {totalFiles > 1 && (
            <p>📄 Os itens de todas as páginas serão combinados automaticamente</p>
          )}
        </div>
      )}
    </div>
  );
}
