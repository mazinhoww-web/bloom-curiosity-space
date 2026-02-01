import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Image, File, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadStepProps {
  file: File | null;
  gradeId: string | null;
  onFileSelect: (file: File | null) => void;
  onGradeSelect: (gradeId: string) => void;
  onProcess: () => void;
  isUploading: boolean;
  uploadProgress: number;
}

export function UploadStep({
  file,
  gradeId,
  onFileSelect,
  onGradeSelect,
  onProcess,
  isUploading,
  uploadProgress,
}: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      return "Formato não suportado. Use PDF, DOC, JPG ou PNG.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Arquivo muito grande. Máximo 10MB.";
    }
    return null;
  }, []);

  const handleFile = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onFileSelect(selectedFile);
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  }, [handleFile]);

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <Image className="h-8 w-8" />;
    if (type.includes("pdf")) return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Envie a lista</h2>
        <p className="mt-2 text-muted-foreground">
          Foto, PDF ou documento da lista de materiais
        </p>
      </div>

      {/* Grade Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Série / Ano</label>
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

      {/* Drop Zone */}
      {!file ? (
        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={handleInputChange}
          />
          
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Arraste o arquivo aqui</p>
              <p className="text-sm text-muted-foreground">ou</p>
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar arquivo
            </Button>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, JPG, PNG • Máximo 10MB
            </p>
          </div>
        </div>
      ) : (
        <Card className="border-success bg-success/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/20 text-success">
              {getFileIcon(file.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onFileSelect(null)}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
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

      {/* Process Button */}
      <Button
        size="lg"
        className="w-full gap-2"
        disabled={!file || !gradeId || isUploading}
        onClick={onProcess}
      >
        <Upload className="h-4 w-4" />
        Processar com IA
      </Button>
    </div>
  );
}
