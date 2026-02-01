import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { supabase } from "@/integrations/supabase/client";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (base64: string) => {
      const { data, error } = await supabase.functions.invoke("analyze-material-list", {
        body: { image_base64: base64, file_type: fileType },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as AnalysisResult;
    },
    onSuccess: (result) => {
      setAnalysisResult(result);
      // Selecionar todos os itens por padrão
      setSelectedItems(new Set(result.items.map((_, i) => i)));
      setStage("review");
    },
    onError: (error) => {
      console.error("Analysis error:", error);
      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
      setStage("upload");
    },
  });

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
    analyzeMutation.mutate(imageBase64);
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
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">
                Analisando a lista de materiais...
              </p>
              <p className="text-xs text-muted-foreground">
                Isso pode levar alguns segundos
              </p>
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
