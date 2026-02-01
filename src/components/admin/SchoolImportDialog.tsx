import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Download, 
  Clock,
  X,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface SchoolImportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ImportJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  file_name: string;
  total_records: number;
  processed_records: number;
  inserted_records: number;
  skipped_records: number;
  failed_records: number;
  current_batch: number;
  batch_size: number;
  cursor_line: number;
  error_message: string | null;
  error_details: {
    elapsed_ms?: number;
    elapsed_formatted?: string;
  } | null;
  started_at: string | null;
  completed_at: string | null;
}

interface ProcessResult {
  done: boolean;
  status: string;
  cursor_line: number;
  processed_records: number;
  inserted_records: number;
  skipped_records: number;
  batch_time_ms: number;
  total_records: number;
  current_batch: number;
}

export function SchoolImportDialog({ open, onClose }: SchoolImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"upload" | "processing" | "done" | "error">("upload");
  const [job, setJob] = useState<ImportJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Re-entrant process function - processes one batch and returns
  const processBatch = useCallback(async (jobId: string): Promise<ProcessResult | null> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/process-schools-csv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ action: "process", job_id: jobId }),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro no processamento");
      }

      return await response.json() as ProcessResult;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }, []);

  // Main processing loop - calls processBatch repeatedly until done
  const runProcessingLoop = useCallback(async (jobId: string, initialJob: ImportJob) => {
    setIsProcessing(true);
    abortControllerRef.current = new AbortController();
    
    let currentJob = { ...initialJob };
    
    try {
      while (true) {
        const result = await processBatch(jobId);
        
        if (!result) {
          // Aborted
          break;
        }

        // Update local state
        currentJob = {
          ...currentJob,
          status: result.status as ImportJob['status'],
          processed_records: result.processed_records,
          inserted_records: result.inserted_records,
          skipped_records: result.skipped_records,
          current_batch: result.current_batch,
          cursor_line: result.cursor_line,
        };
        setJob(currentJob);

        if (result.done) {
          // Fetch final job state
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

          const statusResponse = await fetch(`${supabaseUrl}/functions/v1/process-schools-csv`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseKey}`,
              "apikey": supabaseKey,
            },
            body: JSON.stringify({ action: "status", job_id: jobId }),
          });

          if (statusResponse.ok) {
            const finalJob = await statusResponse.json() as ImportJob;
            setJob(finalJob);
            currentJob = finalJob;
          }

          setStage("done");
          queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
          queryClient.invalidateQueries({ queryKey: ["schools-stats"] });
          
          toast({
            title: "Importação concluída!",
            description: `${currentJob.inserted_records.toLocaleString()} escolas inseridas.`,
          });
          break;
        }

        // Small delay between batches to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Processing error:", error);
      setStage("error");
      setJob(prev => prev ? { 
        ...prev, 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Erro desconhecido',
      } : null);
      
      toast({
        variant: "destructive",
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [processBatch, queryClient, toast]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        variant: "destructive",
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo CSV.",
      });
      return;
    }

    setFile(selectedFile);
  }, [toast]);

  const handleSubmit = async () => {
    if (!file) return;

    setIsSubmitting(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Step 1: Upload file and create job
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${supabaseUrl}/functions/v1/process-schools-csv`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Erro ao criar job");
      }

      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.job_id) {
        throw new Error("Job ID não retornado");
      }

      // Initialize job state
      const initialJob: ImportJob = {
        id: uploadResult.job_id,
        status: 'queued',
        file_name: file.name,
        total_records: uploadResult.total_rows || 0,
        processed_records: 0,
        inserted_records: 0,
        skipped_records: 0,
        failed_records: 0,
        current_batch: 0,
        batch_size: 1500,
        cursor_line: 0,
        error_message: null,
        error_details: null,
        started_at: null,
        completed_at: null,
      };
      
      setJob(initialJob);
      setStage("processing");
      setIsSubmitting(false);

      toast({
        title: "Arquivo enviado",
        description: "Iniciando processamento em batches...",
      });

      // Step 2: Start processing loop
      runProcessingLoop(uploadResult.job_id, initialJob);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
      setStage("upload");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Abort any ongoing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setFile(null);
    setJob(null);
    setStage("upload");
    setIsProcessing(false);
    onClose();
  };

  const downloadTemplate = () => {
    const template = `nome,cep,endereco,cidade,estado,telefone,email
"Escola Municipal João da Silva","12345678","Rua das Flores, 123","São Paulo","SP","1112345678","contato@escola.com.br"
"Colégio Estadual Maria Santos","87654321","Av. Principal, 456","Rio de Janeiro","RJ","2198765432","secretaria@colegio.edu.br"`;
    
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo_escolas.csv";
    link.click();
  };

  const calculateProgress = () => {
    if (!job || job.total_records === 0) return 0;
    return Math.round((job.processed_records / job.total_records) * 100);
  };

  const formatNumber = (n: number) => n.toLocaleString('pt-BR');

  const estimateTimeRemaining = () => {
    if (!job || job.processed_records === 0 || !job.started_at) return null;
    const elapsed = Date.now() - new Date(job.started_at).getTime();
    const recordsPerMs = job.processed_records / elapsed;
    const remaining = job.total_records - job.processed_records;
    const remainingMs = remaining / recordsPerMs;
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    
    if (remainingSeconds < 60) {
      return `~${remainingSeconds}s restantes`;
    }
    return `~${Math.ceil(remainingSeconds / 60)}min restantes`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar Escolas via CSV
          </DialogTitle>
          <DialogDescription>
            Importação reentrante para arquivos grandes (180k+ registros).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {stage === "upload" && (
            <>
              {/* File Drop Zone */}
              <div
                className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                  file ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Clique para selecionar</p>
                      <p className="text-sm text-muted-foreground">ou arraste o arquivo CSV</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Template download */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Baixe o modelo CSV</span>
                </div>
                <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-1 h-4 w-4" />
                  Baixar
                </Button>
              </div>

              {/* Info */}
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Processamento reentrante em batches de 1.500 registros.
                  Suporta 180k+ escolas sem timeout.
                </AlertDescription>
              </Alert>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!file || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Iniciar Importação
                </Button>
              </div>
            </>
          )}

          {stage === "processing" && job && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <h3 className="font-semibold">Processando...</h3>
                <p className="text-sm text-muted-foreground">
                  {job.file_name}
                </p>
              </div>

              <Progress value={calculateProgress()} className="h-3" />

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-2xl font-bold">{formatNumber(job.processed_records)}</p>
                  <p className="text-xs text-muted-foreground">de {formatNumber(job.total_records)} processados</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-2xl font-bold text-success">{formatNumber(job.inserted_records)}</p>
                  <p className="text-xs text-muted-foreground">inseridos</p>
                </div>
              </div>

              <div className="text-center space-y-1">
                {job.current_batch > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <Clock className="mr-1 inline h-4 w-4" />
                    Batch {job.current_batch} • {calculateProgress()}%
                  </p>
                )}
                {estimateTimeRemaining() && (
                  <p className="text-xs text-muted-foreground">
                    {estimateTimeRemaining()}
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={!isProcessing}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {stage === "done" && job && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h3 className="font-semibold text-success">Importação Concluída!</h3>
                {job.error_details?.elapsed_formatted && (
                  <p className="text-sm text-muted-foreground">
                    Tempo total: {job.error_details.elapsed_formatted}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xl font-bold">{formatNumber(job.total_records)}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="rounded-lg bg-success/10 p-3">
                  <p className="text-xl font-bold text-success">{formatNumber(job.inserted_records)}</p>
                  <p className="text-xs text-muted-foreground">Inseridos</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xl font-bold text-muted-foreground">{formatNumber(job.skipped_records)}</p>
                  <p className="text-xs text-muted-foreground">Ignorados</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleClose}>Fechar</Button>
              </div>
            </div>
          )}

          {stage === "error" && job && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="font-semibold text-destructive">Erro na Importação</h3>
                <p className="text-sm text-muted-foreground">
                  {job.error_message || "Ocorreu um erro durante o processamento."}
                </p>
                {job.processed_records > 0 && (
                  <p className="mt-2 text-sm">
                    Processados até o erro: {formatNumber(job.processed_records)} registros
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>Fechar</Button>
                <Button onClick={() => {
                  setStage("upload");
                  setJob(null);
                  setFile(null);
                }}>
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
