import { useState, useRef, useCallback } from "react";
import { Camera, Upload, FileImage, Loader2, Sparkles, X, FileText, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface ExtractedItem {
  name: string;
  quantity: number;
  category: string;
  description: string | null;
  brand_suggestion: string | null;
  is_required: boolean;
  selected?: boolean;
}

interface AnalysisResult {
  items: ExtractedItem[];
  school_name: string | null;
  grade: string | null;
  year: number | null;
  raw_text: string | null;
}

interface SSEMessage {
  type: "progress" | "complete" | "error";
  stage?: string;
  progress?: number;
  message?: string;
  data?: AnalysisResult;
  error?: string;
}

interface ListAIImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (items: ExtractedItem[]) => void;
}

const categoryMap: Record<string, string> = {
  escrita: "Escrita",
  cadernos: "Cadernos",
  papelaria: "Papelaria",
  artes: "Artes",
  higiene: "Higiene",
  uniforme: "Uniforme",
  livros: "Livros",
  outros: "Outros",
};

export function ListAIImportDialog({ open, onClose, onImport }: ListAIImportDialogProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("image/jpeg");
  const [fileName, setFileName] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [stage, setStage] = useState<"upload" | "uploading" | "analyzing" | "review">("upload");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analyzeWithSSE = useCallback(async (base64: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisMessage("Iniciando análise...");

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-material-list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({
          image_base64: base64,
          file_type: fileType,
          use_sse: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Parse SSE messages
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as SSEMessage;
              
              if (data.type === "progress") {
                setAnalysisProgress(data.progress || 0);
                setAnalysisMessage(data.message || "Processando...");
              } else if (data.type === "complete" && data.data) {
                setAnalysisResult(data.data);
                setSelectedItems(new Set(data.data.items.map((_, i) => i)));
                setStage("review");
              } else if (data.type === "error") {
                throw new Error(data.error || "Erro desconhecido");
              }
            } catch (parseError) {
              // Ignore parse errors for incomplete messages
              console.log("Parse error (may be incomplete):", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
      setStage("upload");
    } finally {
      setIsAnalyzing(false);
    }
  }, [fileType, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem (JPG, PNG, WebP) ou PDF.",
      });
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
      });
      return;
    }

    setFileType(file.type);
    setFileName(file.name);
    setStage("uploading");
    setUploadProgress(0);

    const reader = new FileReader();
    
    // Simular progresso de leitura do arquivo
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(progress);
      }
    };

    reader.onload = (event) => {
      const result = event.target?.result as string;
      
      // Garantir que o progresso chegue a 100%
      setUploadProgress(100);
      
      // Pequeno delay para mostrar 100% antes de transicionar
      setTimeout(() => {
        if (file.type.startsWith("image/")) {
          setImagePreview(result);
        } else {
          // PDF - mostrar ícone
          setImagePreview(null);
        }
        
        // Extrair base64 (remover prefixo data:...)
        const base64 = result.split(",")[1];
        setImageBase64(base64);
        setStage("upload");
      }, 300);
    };

    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Erro ao ler arquivo",
        description: "Não foi possível processar o arquivo selecionado.",
      });
      setStage("upload");
      setUploadProgress(0);
    };

    reader.readAsDataURL(file);
  }, [toast]);

  const handleAnalyze = () => {
    if (!imageBase64) return;
    setStage("analyzing");
    analyzeWithSSE(imageBase64);
  };

  const handleToggleItem = (index: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (analysisResult) {
      if (selectedItems.size === analysisResult.items.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(analysisResult.items.map((_, i) => i)));
      }
    }
  };

  const handleImport = () => {
    if (!analysisResult) return;
    
    const itemsToImport = analysisResult.items.filter((_, i) => selectedItems.has(i));
    onImport(itemsToImport);
    handleClose();
  };

  const handleClose = () => {
    setImagePreview(null);
    setImageBase64(null);
    setFileName("");
    setAnalysisResult(null);
    setSelectedItems(new Set());
    setStage("upload");
    setUploadProgress(0);
    setAnalysisProgress(0);
    setAnalysisMessage("");
    onClose();
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      escrita: "bg-blue-100 text-blue-800",
      cadernos: "bg-green-100 text-green-800",
      papelaria: "bg-purple-100 text-purple-800",
      artes: "bg-pink-100 text-pink-800",
      higiene: "bg-cyan-100 text-cyan-800",
      uniforme: "bg-amber-100 text-amber-800",
      livros: "bg-orange-100 text-orange-800",
      outros: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={colors[category] || colors.outros}>
        {categoryMap[category] || category}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Importar Lista com IA
          </DialogTitle>
          <DialogDescription>
            Faça upload ou tire uma foto da lista de materiais. A IA irá identificar e categorizar os itens automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {stage === "upload" && (
            <>
              {/* Upload options */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload de Arquivo</p>
                  <p className="text-xs text-muted-foreground">
                    Imagem ou PDF
                  </p>
                </div>

                <div
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Tirar Foto</p>
                  <p className="text-xs text-muted-foreground">
                    Use a câmera
                  </p>
                </div>
              </div>

              {/* Preview */}
              {(imagePreview || imageBase64) && (
                <div className="relative rounded-lg border bg-muted/30 p-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => {
                      setImagePreview(null);
                      setImageBase64(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto max-h-64 rounded object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <FileText className="h-16 w-16 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Documento PDF selecionado</p>
                    </div>
                  )}
                </div>
              )}

              {/* Analyze button */}
              {imageBase64 && (
                <Button onClick={handleAnalyze} className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  Analisar com IA
                </Button>
              )}
            </>
          )}

          {stage === "uploading" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-full max-w-xs space-y-4">
                <div className="flex items-center justify-center">
                  <Upload className="h-12 w-12 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Carregando arquivo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  {fileName && (
                    <p className="text-center text-sm text-muted-foreground truncate">
                      {fileName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {stage === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-full max-w-xs space-y-4">
                <div className="flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <Progress value={analysisProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{analysisMessage || "Analisando..."}</span>
                    <span>{analysisProgress}%</span>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  A IA está extraindo os itens da lista de materiais
                </p>
              </div>
            </div>
          )}

          {stage === "review" && analysisResult && (
            <>
              {/* Metadata */}
              {(analysisResult.school_name || analysisResult.grade || analysisResult.year) && (
                <Alert>
                  <FileImage className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.school_name && (
                        <Badge variant="outline">{analysisResult.school_name}</Badge>
                      )}
                      {analysisResult.grade && (
                        <Badge variant="outline">{analysisResult.grade}</Badge>
                      )}
                      {analysisResult.year && (
                        <Badge variant="outline">{analysisResult.year}</Badge>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Items count and select all */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {analysisResult.items.length} itens encontrados • {selectedItems.size} selecionados
                </p>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedItems.size === analysisResult.items.length ? "Desmarcar todos" : "Selecionar todos"}
                </Button>
              </div>

              {/* Items list */}
              <ScrollArea className="h-64 rounded-md border">
                <div className="p-2 space-y-2">
                  {analysisResult.items.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 rounded-lg p-3 transition-colors cursor-pointer ${
                        selectedItems.has(index) ? "bg-primary/10" : "bg-muted/30 hover:bg-muted/50"
                      }`}
                      onClick={() => handleToggleItem(index)}
                    >
                      <Checkbox
                        checked={selectedItems.has(index)}
                        onCheckedChange={() => handleToggleItem(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-xs">
                            x{item.quantity}
                          </Badge>
                          {getCategoryBadge(item.category)}
                          {!item.is_required && (
                            <Badge variant="secondary" className="text-xs">
                              Opcional
                            </Badge>
                          )}
                        </div>
                        {(item.description || item.brand_suggestion) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {[item.description, item.brand_suggestion && `Marca: ${item.brand_suggestion}`]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {stage === "review" && (
            <Button
              onClick={handleImport}
              disabled={selectedItems.size === 0}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Importar {selectedItems.size} itens
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
