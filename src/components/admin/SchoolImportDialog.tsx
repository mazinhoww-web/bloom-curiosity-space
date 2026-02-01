import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Download } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SchoolImportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ParsedSchool {
  name: string;
  cep: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCSV(content: string): { schools: ParsedSchool[]; errors: string[] } {
  const lines = content.trim().split("\n");
  const schools: ParsedSchool[] = [];
  const errors: string[] = [];

  if (lines.length < 2) {
    errors.push("O arquivo CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados.");
    return { schools, errors };
  }

  // Parse header
  const headerLine = lines[0].trim();
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  
  const requiredFields = ["name", "cep"];
  const missingFields = requiredFields.filter((f) => !headers.includes(f));
  
  if (missingFields.length > 0) {
    errors.push(`Campos obrigatórios ausentes: ${missingFields.join(", ")}`);
    return { schools, errors };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    
    if (values.length !== headers.length) {
      errors.push(`Linha ${i + 1}: número de colunas não corresponde ao cabeçalho`);
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || "";
    });

    if (!row.name) {
      errors.push(`Linha ${i + 1}: nome é obrigatório`);
      continue;
    }

    if (!row.cep) {
      errors.push(`Linha ${i + 1}: CEP é obrigatório`);
      continue;
    }

    // Validate CEP format (8 digits, with or without hyphen)
    const cleanCep = row.cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      errors.push(`Linha ${i + 1}: CEP inválido (deve ter 8 dígitos)`);
      continue;
    }

    schools.push({
      name: row.name,
      cep: cleanCep.replace(/(\d{5})(\d{3})/, "$1-$2"),
      slug: row.slug || generateSlug(row.name),
      address: row.address || row.endereco,
      city: row.city || row.cidade,
      state: row.state || row.estado,
      phone: row.phone || row.telefone,
      email: row.email,
    });
  }

  return { schools, errors };
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
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values.map((v) => v.replace(/^"|"$/g, ""));
}

export function SchoolImportDialog({ open, onClose }: SchoolImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedSchools, setParsedSchools] = useState<ParsedSchool[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (schools: ParsedSchool[]) => {
      const result: ImportResult = { success: 0, failed: 0, errors: [] };
      
      for (let i = 0; i < schools.length; i++) {
        const school = schools[i];
        
        try {
          const { error } = await supabase.from("schools").insert({
            name: school.name,
            cep: school.cep,
            slug: school.slug,
            address: school.address || null,
            city: school.city || null,
            state: school.state || null,
            phone: school.phone || null,
            email: school.email || null,
            is_active: true,
          });

          if (error) {
            if (error.code === "23505") {
              result.errors.push(`"${school.name}": slug já existe`);
            } else {
              result.errors.push(`"${school.name}": ${error.message}`);
            }
            result.failed++;
          } else {
            result.success++;
          }
        } catch (err) {
          result.errors.push(`"${school.name}": erro desconhecido`);
          result.failed++;
        }

        setProgress(Math.round(((i + 1) / schools.length) * 100));
      }

      return result;
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
      
      if (result.success > 0) {
        toast({
          title: "Importação concluída",
          description: `${result.success} escola(s) importada(s) com sucesso.`,
        });
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description: "Ocorreu um erro ao importar as escolas.",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setImportResult(null);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { schools, errors } = parseCSV(content);
      setParsedSchools(schools);
      setParseErrors(errors);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = () => {
    if (parsedSchools.length === 0) return;
    importMutation.mutate(parsedSchools);
  };

  const handleClose = () => {
    setFile(null);
    setParsedSchools([]);
    setParseErrors([]);
    setImportResult(null);
    setProgress(0);
    onClose();
  };

  const downloadTemplate = () => {
    const template = `name,cep,address,city,state,phone,email
"Escola Exemplo","12345-678","Rua das Flores, 123","São Paulo","SP","(11) 1234-5678","contato@escola.com.br"`;
    
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo_escolas.csv";
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Escolas via CSV</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV com os dados das escolas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between rounded-lg border border-dashed p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Baixe o modelo CSV</span>
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
              <p className="text-sm font-medium">{file.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Clique para selecionar um arquivo CSV
              </p>
            )}
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Erros encontrados:</p>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {parseErrors.slice(0, 5).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li>...e mais {parseErrors.length - 5} erro(s)</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Parsed preview */}
          {parsedSchools.length > 0 && !importResult && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription>
                {parsedSchools.length} escola(s) pronta(s) para importação.
              </AlertDescription>
            </Alert>
          )}

          {/* Import progress */}
          {importMutation.isPending && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-center text-sm text-muted-foreground">
                Importando... {progress}%
              </p>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className="space-y-2">
              {importResult.success > 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription>
                    {importResult.success} escola(s) importada(s) com sucesso.
                  </AlertDescription>
                </Alert>
              )}
              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium">{importResult.failed} falha(s):</p>
                    <ul className="mt-1 list-inside list-disc text-xs">
                      {importResult.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...e mais {importResult.errors.length - 5} erro(s)</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {importResult ? "Fechar" : "Cancelar"}
            </Button>
            {!importResult && (
              <Button
                onClick={handleImport}
                disabled={parsedSchools.length === 0 || importMutation.isPending}
              >
                {importMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Importar {parsedSchools.length} escola(s)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
