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
  RefreshCw,
  X,
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
import { Badge } from "@/components/ui/badge";
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
  error_message: string | null;
  error_details: {
    elapsed_ms?: number;
    elapsed_formatted?: string;
  } | null;
  started_at: string | null;
  completed_at: string | null;
}

export function SchoolImportDialog({ open, onClose }: SchoolImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"upload" | "processing" | "done" | "error">("upload");
  const [job, setJob] = useState<ImportJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
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
        body: JSON.stringify({ action: "status", job_id: jobId }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch job status");
      }

      const jobData = await response.json() as ImportJob;
      setJob(jobData);

      if (jobData.status === 'completed') {
        setStage("done");
        queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
        queryClient.invalidateQueries({ queryKey: ["schools-stats"] });
        
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        toast({
          title: "Importação concluída!",
          description: `${jobData.inserted_records.toLocaleString()} escolas inseridas, ${jobData.skipped_records.toLocaleString()} ignoradas.`,
        });
      } else if (jobData.status === 'failed') {
        setStage("error");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error("Error polling job status:", error);
    }
  }, [queryClient, toast]);

  // Start polling when we have a job
  useEffect(() => {
    if (job?.id && (job.status === 'queued' || job.status === 'processing')) {
      pollIntervalRef.current = window.setInterval(() => {
        pollJobStatus(job.id);
      }, 2000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [job?.id, job?.status, pollJobStatus]);

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
    setStage("processing");

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${supabaseUrl}/functions/v1/process-schools-csv`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao iniciar importação");
      }

      const result = await response.json();
      
      if (result.job_id) {
        // Initialize job state and start polling
        setJob({
          id: result.job_id,
          status: 'queued',
          file_name: file.name,
          total_records: 0,
          processed_records: 0,
          inserted_records: 0,
          skipped_records: 0,
          failed_records: 0,
          current_batch: 0,
          batch_size: 2000,
          error_message: null,
          error_details: null,
          started_at: null,
          completed_at: null,
        });

        toast({
          title: "Importação iniciada",
          description: "O processamento está sendo feito em background.",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
      setStage("upload");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setFile(null);
    setJob(null);
    setStage("upload");
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar Escolas via CSV
          </DialogTitle>
          <DialogDescription>
            Importe milhares de escolas de forma assíncrona. Arquivos grandes são processados em background.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {stage === "upload" && (
            <>
              {/* File Drop Zone */}
              <div
                className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
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
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  O processamento é feito em batches de 2.000 registros. 
                  Arquivos com 180k+ escolas levam alguns minutos.
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
                  <RefreshCw className="h-8 w-8 text-primary animate-spin" />
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

              {job.current_batch > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  <Clock className="mr-1 inline h-4 w-4" />
                  Batch {job.current_batch} • {job.batch_size} registros por batch
                </p>
              )}
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
