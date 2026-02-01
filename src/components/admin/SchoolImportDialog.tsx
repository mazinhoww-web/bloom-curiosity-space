import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Download, 
  Clock,
  X,
  Zap,
  AlertTriangle,
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
import { supabase } from "@/integrations/supabase/client";

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

const BATCH_SIZE = 1500;
const STORAGE_BUCKET = 'import-files';

// Parse CSV in browser - streaming line reader
function* readCSVLines(content: string): Generator<string> {
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current.trim()) {
        yield current;
      }
      current = '';
      // Handle \r\n
      if (char === '\r' && content[i + 1] === '\n') {
        i++;
      }
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    yield current;
  }
}

export function SchoolImportDialog({ open, onClose }: SchoolImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"upload" | "parsing" | "processing" | "done" | "error">("upload");
  const [job, setJob] = useState<ImportJob | null>(null);
  const [parseProgress, setParseProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const allLinesRef = useRef<string[]>([]);
  const headerLineRef = useRef<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Process a batch of lines via edge function
  const processBatch = useCallback(async (
    jobId: string, 
    headerLine: string,
    lines: string[]
  ): Promise<ProcessResult | null> => {
    try {
      const response = await supabase.functions.invoke('process-schools-csv', {
        body: { 
          action: 'process', 
          job_id: jobId,
          header_line: headerLine,
          lines,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro no processamento');
      }

      return response.data as ProcessResult;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }, []);

  // Main processing loop - sends batches from client-side parsed lines
  const runProcessingLoop = useCallback(async (jobId: string, initialJob: ImportJob) => {
    abortControllerRef.current = new AbortController();
    
    const allLines = allLinesRef.current;
    const headerLine = headerLineRef.current;
    let currentJob = { ...initialJob };
    let cursorLine = 0;
    
    try {
      while (cursorLine < allLines.length) {
        // Get next batch of lines
        const batchLines = allLines.slice(cursorLine, cursorLine + BATCH_SIZE);
        
        if (batchLines.length === 0) break;
        
        const result = await processBatch(jobId, headerLine, batchLines);
        
        if (!result) {
          // Aborted
          break;
        }

        cursorLine += batchLines.length;

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
          const { data: finalJob } = await supabase.functions.invoke('process-schools-csv', {
            body: { action: 'status', job_id: jobId },
          });

          if (finalJob) {
            setJob(finalJob as ImportJob);
            currentJob = finalJob as ImportJob;
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

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error("Processing error:", error);
      setStage("error");
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
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
    setErrorMessage(null);
  }, [toast]);

  const handleSubmit = async () => {
    if (!file) return;

    setIsSubmitting(true);
    setStage("parsing");
    setParseProgress(0);
    setErrorMessage(null);

    try {
      // Step 1: Parse CSV in browser (streaming)
      console.log('[import] Parsing CSV in browser...');
      const text = await file.text();
      const lines: string[] = [];
      let headerLine = '';
      let lineCount = 0;
      const totalSize = text.length;
      let processedSize = 0;
      
      for (const line of readCSVLines(text)) {
        if (lineCount === 0) {
          headerLine = line;
        } else {
          lines.push(line);
        }
        lineCount++;
        processedSize += line.length;
        
        // Update progress every 10000 lines
        if (lineCount % 10000 === 0) {
          setParseProgress(Math.round((processedSize / totalSize) * 100));
          // Yield to UI
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      setParseProgress(100);
      console.log(`[import] Parsed ${lines.length} data lines`);

      if (lines.length === 0) {
        throw new Error('CSV vazio ou sem dados');
      }

      // Store lines in ref for processing
      allLinesRef.current = lines;
      headerLineRef.current = headerLine;

      // Step 2: Upload CSV to storage for backup/resume capability
      const filePath = `imports/${crypto.randomUUID()}.csv`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          contentType: 'text/csv',
          upsert: true,
        });

      if (uploadError) {
        console.warn('[import] Storage upload failed (continuing without backup):', uploadError);
        // Continue anyway - we have the data in memory
      }

      // Step 3: Create job via edge function
      const { data: createResult, error: createError } = await supabase.functions.invoke('process-schools-csv', {
        body: { 
          action: 'create',
          file_name: file.name,
          total_rows: lines.length,
          file_path: filePath,
        },
      });

      if (createError || !createResult?.job_id) {
        throw new Error(createError?.message || 'Erro ao criar job');
      }

      // Initialize job state
      const initialJob: ImportJob = {
        id: createResult.job_id,
        status: 'queued',
        file_name: file.name,
        total_records: lines.length,
        processed_records: 0,
        inserted_records: 0,
        skipped_records: 0,
        failed_records: 0,
        current_batch: 0,
        batch_size: BATCH_SIZE,
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
        title: "Arquivo analisado",
        description: `${lines.length.toLocaleString()} registros encontrados. Iniciando processamento...`,
      });

      // Step 4: Start processing loop (sends batches from browser)
      runProcessingLoop(createResult.job_id, initialJob);

    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
      setStage("error");
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
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
    setParseProgress(0);
    setErrorMessage(null);
    allLinesRef.current = [];
    headerLineRef.current = '';
    onClose();
  };

  const handleRetry = () => {
    setStage("upload");
    setErrorMessage(null);
    setJob(null);
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
            Parse local + processamento em batches para arquivos grandes (180k+ registros).
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
                  O arquivo é analisado localmente no seu navegador antes de enviar.
                  Processamento em batches de {BATCH_SIZE.toLocaleString()} registros.
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

          {stage === "parsing" && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h3 className="font-semibold">Analisando arquivo...</h3>
                <p className="text-sm text-muted-foreground">
                  Lendo CSV localmente no navegador
                </p>
              </div>

              <Progress value={parseProgress} className="h-3" />
              
              <p className="text-center text-sm text-muted-foreground">
                {parseProgress}% concluído
              </p>
            </div>
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
                  <p className="text-2xl font-bold text-primary">{formatNumber(job.inserted_records)}</p>
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
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {stage === "done" && job && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-primary">Importação Concluída!</h3>
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
                <div className="rounded-lg bg-primary/10 p-3">
                  <p className="text-xl font-bold text-primary">{formatNumber(job.inserted_records)}</p>
                  <p className="text-xs text-muted-foreground">Inseridos</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xl font-bold text-muted-foreground">{formatNumber(job.skipped_records)}</p>
                  <p className="text-xs text-muted-foreground">Ignorados</p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={handleClose}>
                  Fechar
                </Button>
              </div>
            </div>
          )}

          {stage === "error" && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="font-semibold text-destructive">Erro na Importação</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {errorMessage || 'Ocorreu um erro desconhecido'}
                </p>
              </div>

              {job && job.processed_records > 0 && (
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-sm">
                    Progresso antes do erro: {formatNumber(job.processed_records)} de {formatNumber(job.total_records)} processados
                  </p>
                  <p className="text-sm text-primary">
                    {formatNumber(job.inserted_records)} escolas foram inseridas com sucesso
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
                <Button onClick={handleRetry}>
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
