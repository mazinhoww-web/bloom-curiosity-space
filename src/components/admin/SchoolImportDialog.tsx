import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Download, Sparkles, Zap } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SchoolImportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ParsedSchool {
  name?: string;
  cep?: string;
  address?: string;
  endereco?: string;
  city?: string;
  cidade?: string;
  state?: string;
  estado?: string;
  uf?: string;
  phone?: string;
  telefone?: string;
  email?: string;
  tipo?: string;
  type?: string;
  nivel?: string;
  level?: string;
  [key: string]: string | undefined;
}

interface ProcessedResult {
  total: number;
  processed: number;
  inserted: number;
  processingErrors: string[];
  insertErrors: string[];
  preview?: Array<{
    name: string;
    slug: string;
    cep: string;
    address: string | null;
    city: string | null;
    state: string | null;
    school_type?: string;
    education_level?: string;
  }>;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else if (char === ";" && !inQuotes) {
      // Suporte para CSV com separador ponto-e-vírgula
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values.map((v) => v.replace(/^"|"$/g, "").trim());
}

function parseCSV(content: string): { schools: ParsedSchool[]; errors: string[] } {
  const lines = content.trim().split(/\r?\n/);
  const schools: ParsedSchool[] = [];
  const errors: string[] = [];

  if (lines.length < 2) {
    errors.push("O arquivo CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados.");
    return { schools, errors };
  }

  // Detectar separador
  const headerLine = lines[0].trim();
  const separator = headerLine.includes(";") ? ";" : ",";
  
  // Parse header - aceitar vários formatos
  const headers = headerLine.split(separator).map((h) => 
    h.trim().toLowerCase()
      .replace(/"/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  );
  
  // Mapear headers possíveis
  const headerMap: Record<string, string> = {};
  headers.forEach((h, i) => {
    if (h.includes("nome") || h === "name" || h === "escola") headerMap["name"] = h;
    if (h === "cep" || h.includes("codigo_postal") || h.includes("zip")) headerMap["cep"] = h;
    if (h.includes("endereco") || h === "address" || h.includes("logradouro")) headerMap["address"] = h;
    if (h.includes("cidade") || h === "city" || h.includes("municipio")) headerMap["city"] = h;
    if (h.includes("estado") || h === "state" || h === "uf") headerMap["state"] = h;
    if (h.includes("telefone") || h === "phone" || h.includes("fone")) headerMap["phone"] = h;
    if (h.includes("email") || h.includes("e-mail")) headerMap["email"] = h;
    if (h.includes("tipo") || h === "type") headerMap["type"] = h;
    if (h.includes("nivel") || h === "level") headerMap["level"] = h;
  });
  
  // Verificar campos obrigatórios
  const hasName = headers.some(h => h.includes("nome") || h === "name" || h === "escola");
  const hasCep = headers.some(h => h === "cep" || h.includes("codigo_postal"));
  
  if (!hasName || !hasCep) {
    errors.push(`Campos obrigatórios ausentes. Necessário: nome/name e cep. Encontrados: ${headers.join(", ")}`);
    return { schools, errors };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line.includes(";") && !line.includes(",") ? line : line.replace(/;/g, ","));
    
    if (values.length < 2) {
      continue; // Linha vazia ou incompleta
    }

    const row: ParsedSchool = {};
    headers.forEach((header, index) => {
      if (values[index]) {
        row[header] = values[index];
      }
    });

    // Mapear campos flexíveis
    const school: ParsedSchool = {
      name: row.name || row.nome || row.escola,
      cep: row.cep || row.codigo_postal,
      address: row.address || row.endereco || row.logradouro,
      city: row.city || row.cidade || row.municipio,
      state: row.state || row.estado || row.uf,
      phone: row.phone || row.telefone || row.fone,
      email: row.email || row["e-mail"],
      type: row.type || row.tipo,
      level: row.level || row.nivel,
    };

    if (!school.name) {
      errors.push(`Linha ${i + 1}: nome é obrigatório`);
      continue;
    }

    if (!school.cep) {
      errors.push(`Linha ${i + 1}: CEP é obrigatório`);
      continue;
    }

    // Validar CEP
    const cleanCep = school.cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      errors.push(`Linha ${i + 1}: CEP inválido "${school.cep}" (deve ter 8 dígitos)`);
      continue;
    }

    schools.push(school);
  }

  return { schools, errors };
}

export function SchoolImportDialog({ open, onClose }: SchoolImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedSchools, setParsedSchools] = useState<ParsedSchool[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"upload" | "preview" | "processing" | "done">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const CHUNK_SIZE = 500; // Processar 500 escolas por vez

  const processMutation = useMutation({
    mutationFn: async ({ schools, insertToDb }: { schools: ParsedSchool[]; insertToDb: boolean }) => {
      const totalChunks = Math.ceil(schools.length / CHUNK_SIZE);
      let totalProcessed = 0;
      let totalInserted = 0;
      const allProcessingErrors: string[] = [];
      const allInsertErrors: string[] = [];
      let lastPreview: ProcessedResult["preview"] = [];

      for (let i = 0; i < schools.length; i += CHUNK_SIZE) {
        const chunk = schools.slice(i, i + CHUNK_SIZE);
        const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
        
        setProgress(Math.round((chunkNumber / totalChunks) * 100));

        const { data, error } = await supabase.functions.invoke("process-schools-csv", {
          body: { schools: chunk, insertToDb },
        });

        if (error) {
          throw error;
        }

        const result = data as ProcessedResult;
        totalProcessed += result.processed;
        totalInserted += result.inserted;
        allProcessingErrors.push(...result.processingErrors);
        allInsertErrors.push(...result.insertErrors);
        
        if (result.preview && result.preview.length > 0) {
          lastPreview = result.preview;
        }
      }

      return {
        total: schools.length,
        processed: totalProcessed,
        inserted: totalInserted,
        processingErrors: allProcessingErrors,
        insertErrors: allInsertErrors,
        preview: lastPreview,
      };
    },
    onSuccess: (result) => {
      setProcessedResult(result);
      setStage("done");
      queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
      
      if (result.inserted > 0) {
        toast({
          title: "Importação concluída!",
          description: `${result.inserted.toLocaleString()} escola(s) importada(s) com sucesso.`,
        });
      }
    },
    onError: (error) => {
      console.error("Import error:", error);
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
      setStage("preview");
    },
  });

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
    setProcessedResult(null);
    setProgress(0);
    setStage("upload");

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { schools, errors } = parseCSV(content);
      setParsedSchools(schools);
      setParseErrors(errors);
      
      if (schools.length > 0) {
        setStage("preview");
      }
    };
    reader.readAsText(selectedFile, "UTF-8");
  }, [toast]);

  const handlePreview = async () => {
    if (parsedSchools.length === 0) return;
    
    setStage("processing");
    setProgress(0);
    
    // Processar apenas uma amostra para preview
    const sample = parsedSchools.slice(0, 10);
    
    const { data, error } = await supabase.functions.invoke("process-schools-csv", {
      body: { schools: sample, insertToDb: false },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro no preview",
        description: error.message,
      });
      setStage("preview");
      return;
    }

    setProcessedResult(data as ProcessedResult);
    setStage("preview");
  };

  const handleImport = () => {
    if (parsedSchools.length === 0) return;
    setStage("processing");
    setProgress(0);
    processMutation.mutate({ schools: parsedSchools, insertToDb: true });
  };

  const handleClose = () => {
    setFile(null);
    setParsedSchools([]);
    setParseErrors([]);
    setProcessedResult(null);
    setProgress(0);
    setStage("upload");
    onClose();
  };

  const downloadTemplate = () => {
    const template = `name,cep,address,city,state,phone,email,tipo,nivel
"Escola Municipal João da Silva","12345-678","Rua das Flores, 123","São Paulo","SP","(11) 1234-5678","contato@escola.com.br","municipal","fundamental"
"Colégio Estadual Maria Santos","87654-321","Av. Principal, 456","Rio de Janeiro","RJ","(21) 9876-5432","secretaria@colegio.edu.br","estadual","medio"
"Centro Educacional Futuro","11223-445","Rua Nova, 789","Belo Horizonte","MG","","","particular","infantil"`;
    
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo_escolas.csv";
    link.click();
  };

  const getSchoolTypeBadge = (type?: string) => {
    if (!type) return null;
    const colors: Record<string, string> = {
      municipal: "bg-blue-100 text-blue-800",
      estadual: "bg-green-100 text-green-800",
      federal: "bg-purple-100 text-purple-800",
      particular: "bg-amber-100 text-amber-800",
    };
    return (
      <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
        {type}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Importar Escolas via CSV com IA
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV. A IA irá padronizar nomes, corrigir erros, categorizar escolas e enriquecer dados via CEP automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* AI Features Badge */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              Padronização automática
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              Correção de erros
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              Enriquecimento via CEP
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              Categorização
            </Badge>
          </div>

          {/* Template download */}
          <div className="flex items-center justify-between rounded-lg border border-dashed p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Baixe o modelo CSV com campos suportados</span>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Modelo
            </Button>
          </div>

          {/* File upload */}
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Clique para selecionar um arquivo CSV (suporta até 180.000 escolas)
              </p>
            )}
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Erros de parsing ({parseErrors.length}):</p>
                <ScrollArea className="max-h-24 mt-1">
                  <ul className="list-inside list-disc text-xs">
                    {parseErrors.slice(0, 10).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {parseErrors.length > 10 && (
                      <li>...e mais {parseErrors.length - 10} erro(s)</li>
                    )}
                  </ul>
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}

          {/* Parsed count */}
          {parsedSchools.length > 0 && stage === "preview" && !processedResult && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="flex items-center justify-between">
                <span>{parsedSchools.length.toLocaleString()} escola(s) encontrada(s) no arquivo.</span>
                <Button variant="outline" size="sm" onClick={handlePreview}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ver Preview com IA
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* AI Preview */}
          {processedResult?.preview && processedResult.preview.length > 0 && stage === "preview" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Preview do processamento (10 primeiras):</p>
              <ScrollArea className="h-48 rounded-md border">
                <div className="p-2 space-y-2">
                  {processedResult.preview.map((school, i) => (
                    <div key={i} className="p-2 rounded bg-muted/50 text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{school.name}</span>
                        {getSchoolTypeBadge(school.school_type)}
                        {school.education_level && (
                          <Badge variant="outline" className="text-xs">
                            {school.education_level}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {school.address && `${school.address} - `}
                        {school.city}, {school.state} - CEP: {school.cep}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Processing progress */}
          {stage === "processing" && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando com IA... {progress}%
                {parsedSchools.length > CHUNK_SIZE && (
                  <span className="text-xs">
                    (em lotes de {CHUNK_SIZE})
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Final result */}
          {stage === "done" && processedResult && (
            <div className="space-y-2">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription>
                  <p className="font-medium">Importação finalizada!</p>
                  <ul className="mt-1 text-sm">
                    <li>• Total no arquivo: {processedResult.total.toLocaleString()}</li>
                    <li>• Processadas pela IA: {processedResult.processed.toLocaleString()}</li>
                    <li>• Inseridas no banco: {processedResult.inserted.toLocaleString()}</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {(processedResult.processingErrors.length > 0 || processedResult.insertErrors.length > 0) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium">
                      {processedResult.processingErrors.length + processedResult.insertErrors.length} erro(s):
                    </p>
                    <ScrollArea className="max-h-24 mt-1">
                      <ul className="list-inside list-disc text-xs">
                        {[...processedResult.processingErrors, ...processedResult.insertErrors]
                          .slice(0, 10)
                          .map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        {processedResult.processingErrors.length + processedResult.insertErrors.length > 10 && (
                          <li>
                            ...e mais{" "}
                            {processedResult.processingErrors.length + processedResult.insertErrors.length - 10}{" "}
                            erro(s)
                          </li>
                        )}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {stage === "done" ? "Fechar" : "Cancelar"}
          </Button>
          {stage === "preview" && parsedSchools.length > 0 && (
            <Button
              onClick={handleImport}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Sparkles className="mr-2 h-4 w-4" />
              Importar {parsedSchools.length.toLocaleString()} escola(s)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
