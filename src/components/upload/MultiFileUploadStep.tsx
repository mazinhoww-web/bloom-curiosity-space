import { useState, useCallback, useRef } from "react";
import { ArrowLeft, Upload, Camera, FileText, Image, File, X, AlertCircle, Plus, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 10;

interface MultiFileUploadStepProps {
  files: File[];
  gradeId: string | null;
  inputMethod: "upload" | "camera";
  onFilesSelect: (files: File[]) => void;
  onGradeSelect: (gradeId: string) => void;
  onProcess: () => void;
  onBack: () => void;
  isUploading: boolean;
  uploadProgress: number;
}

export function MultiFileUploadStep({
  files,
  gradeId,
  inputMethod,
  onFilesSelect,
  onGradeSelect,
  onProcess,
  onBack,
  isUploading,
  uploadProgress,
}: MultiFileUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch grades
  const { data: grades } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `"${file.name}": Formato não suportado. Use PDF, DOC, JPG ou PNG.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}": Arquivo muito grande. Máximo 10MB.`;
    }
    return null;
  }, []);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
      } else {
        validFiles.push(file);
      }
    }

    if (files.length + validFiles.length > MAX_FILES) {
      setError(`Máximo de ${MAX_FILES} arquivos permitidos.`);
      return;
    }

    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    setError(null);
    onFilesSelect([...files, ...validFiles]);
  }, [files, validateFile, onFilesSelect]);

  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesSelect(newFiles);
    setError(null);
  }, [files, onFilesSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // Reset input to allow selecting the same file again
    e.target.value = "";
  }, [addFiles]);

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <Image className="h-5 w-5" />;
    if (type.includes("pdf")) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTotalSize = () => {
    const total = files.reduce((acc, f) => acc + f.size, 0);
    return formatFileSize(total);
  };

  const isCamera = inputMethod === "camera";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {isCamera ? (
            <Camera className="h-8 w-8 text-primary" />
          ) : (
            <Files className="h-8 w-8 text-primary" />
          )}
        </div>
        <h2 className="font-display text-2xl font-bold">
          {isCamera ? "Fotografe a lista" : "Envie a lista"}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {isCamera
            ? "Tire fotos de todas as páginas da lista"
            : "Envie todas as páginas (PDF ou imagens)"}
        </p>
      </div>

      {/* Grade Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Série / Ano *</label>
        <Select value={gradeId || ""} onValueChange={onGradeSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a série..." />
          </SelectTrigger>
          <SelectContent>
            {grades?.map((grade) => (
              <SelectItem key={grade.id} value={grade.id}>
                {grade.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Camera Input (hidden) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* File Input (hidden, multiple) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Drop Zone / Camera Button */}
      {isCamera ? (
        <Button
          size="lg"
          variant="outline"
          className="w-full h-24 flex-col gap-2 border-2 border-dashed"
          onClick={() => cameraInputRef.current?.click()}
          disabled={files.length >= MAX_FILES}
        >
          <Camera className="h-8 w-8 text-muted-foreground" />
          <span>{files.length === 0 ? "Abrir câmera" : "Adicionar outra foto"}</span>
        </Button>
      ) : (
        <div
          className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          } ${files.length >= MAX_FILES ? "opacity-50 pointer-events-none" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {files.length === 0 ? "Arraste os arquivos aqui" : "Arraste mais arquivos"}
              </p>
              <p className="text-xs text-muted-foreground">ou</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= MAX_FILES}
            >
              <Plus className="h-4 w-4 mr-1" />
              Selecionar arquivos
            </Button>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, JPG, PNG • Máx 10MB/arquivo • Até {MAX_FILES} arquivos
            </p>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Arquivos selecionados
            </span>
            <Badge variant="secondary" className="text-xs">
              {files.length} {files.length === 1 ? "arquivo" : "arquivos"} • {getTotalSize()}
            </Badge>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <Card key={`${file.name}-${index}`} className="border-success/50 bg-success/5">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/20 text-success">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    Página {index + 1}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-center text-sm text-muted-foreground">
            Enviando... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Info about multiple pages */}
      {files.length > 1 && !isUploading && (
        <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary">
          <Files className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            A IA irá analisar todas as páginas e combinar os itens automaticamente.
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button
          size="lg"
          className="flex-1 gap-2"
          disabled={files.length === 0 || !gradeId || isUploading}
          onClick={onProcess}
        >
          <Upload className="h-4 w-4" />
          Processar {files.length > 1 ? `${files.length} páginas` : "com IA"}
        </Button>
      </div>
    </div>
  );
}
