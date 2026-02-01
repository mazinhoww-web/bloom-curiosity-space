import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Get session ID for tracking
function getSessionId(): string {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
}

export interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  brand_suggestion?: string;
}

export interface UploadedList {
  id: string;
  school_id: string | null;
  school_name_custom: string | null;
  grade_id: string | null;
  year: number;
  file_path: string;
  file_name: string;
  status: string;
  processing_progress: number;
  processing_message: string | null;
  extracted_items: ExtractedItem[] | null;
  material_list_id: string | null;
}

interface ProcessingState {
  currentFile: number;
  totalFiles: number;
  status: string;
  progress: number;
  message: string | null;
}

export function useMultiFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    currentFile: 0,
    totalFiles: 0,
    status: "pending",
    progress: 0,
    message: null,
  });
  const [uploadedList, setUploadedList] = useState<UploadedList | null>(null);
  const [combinedItems, setCombinedItems] = useState<ExtractedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploadAndProcessFiles = useCallback(async (
    files: File[],
    schoolId: string | null,
    schoolNameCustom: string | null,
    gradeId: string | null
  ) => {
    if (files.length === 0) return null;

    setIsUploading(true);
    setIsProcessing(true);
    setError(null);
    setCombinedItems([]);
    
    const totalFiles = files.length;
    setProcessingState({
      currentFile: 0,
      totalFiles,
      status: "uploading",
      progress: 0,
      message: "Preparando arquivos...",
    });

    try {
      const sessionId = getSessionId();
      const allExtractedItems: ExtractedItem[] = [];
      let primaryUpload: UploadedList | null = null;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isFirst = i === 0;
        
        setProcessingState({
          currentFile: i + 1,
          totalFiles,
          status: "uploading",
          progress: Math.round(((i) / totalFiles) * 30),
          message: `Enviando arquivo ${i + 1} de ${totalFiles}...`,
        });

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${sessionId}/${Date.now()}-${i}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('list-uploads')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error(`[useMultiFileUpload] Storage upload error for file ${i + 1}:`, uploadError);
          throw new Error(`Falha ao fazer upload do arquivo ${i + 1}`);
        }

        // Create uploaded_lists record (only for first file as primary)
        if (isFirst) {
          const { data: newUpload, error: dbError } = await supabase
            .from('uploaded_lists')
            .insert({
              school_id: schoolId,
              school_name_custom: schoolNameCustom,
              grade_id: gradeId,
              file_path: fileName,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              session_id: sessionId,
              user_agent: navigator.userAgent,
              status: 'pending',
            } as any)
            .select()
            .single();

          if (dbError || !newUpload) {
            console.error('[useMultiFileUpload] DB insert error:', dbError);
            throw new Error('Falha ao registrar upload');
          }

          primaryUpload = newUpload as unknown as UploadedList;
          setUploadedList(primaryUpload);

          // Track upload started
          await supabase.from('upload_events').insert({
            uploaded_list_id: newUpload.id,
            event_type: 'upload_started',
            metadata: { total_files: totalFiles },
            session_id: sessionId,
          } as any);
        }

        setIsUploading(false);

        // Process the file
        setProcessingState({
          currentFile: i + 1,
          totalFiles,
          status: "processing",
          progress: Math.round(30 + ((i) / totalFiles) * 60),
          message: `Analisando página ${i + 1} de ${totalFiles}...`,
        });

        // Call the processing function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-public-upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              uploaded_list_id: primaryUpload?.id,
              file_path: fileName,
              file_name: file.name,
              file_type: file.type,
              is_multi_page: totalFiles > 1,
              page_number: i + 1,
              total_pages: totalFiles,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`[useMultiFileUpload] Processing failed for file ${i + 1}:`, errorData);
          // Continue with other files even if one fails
        } else {
          const result = await response.json();
          if (result.items && Array.isArray(result.items)) {
            allExtractedItems.push(...result.items);
          }
        }
      }

      // Deduplicate and merge items
      const mergedItems = deduplicateItems(allExtractedItems);
      setCombinedItems(mergedItems);

      setProcessingState({
        currentFile: totalFiles,
        totalFiles,
        status: "completed",
        progress: 100,
        message: `${mergedItems.length} itens encontrados`,
      });

      // Update the primary upload with combined items
      if (primaryUpload) {
        const { error: updateError } = await supabase
          .from('uploaded_lists')
          .update({
            status: 'completed',
            processing_progress: 100,
            processing_message: `${mergedItems.length} itens encontrados (${totalFiles} páginas)`,
            extracted_items: mergedItems as any,
          } as any)
          .eq('id', primaryUpload.id);

        if (!updateError) {
          setUploadedList({
            ...primaryUpload,
            status: 'completed',
            processing_progress: 100,
            processing_message: `${mergedItems.length} itens encontrados`,
            extracted_items: mergedItems,
          });
        }
      }

      return primaryUpload;
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivos');
      setProcessingState({
        ...processingState,
        status: "failed",
        message: err.message,
      });
      throw err;
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, [processingState]);

  const updateItems = useCallback((items: ExtractedItem[]) => {
    setCombinedItems(items);
    if (uploadedList) {
      setUploadedList({
        ...uploadedList,
        extracted_items: items,
      });
    }
  }, [uploadedList]);

  const publishList = useCallback(async (items: ExtractedItem[]) => {
    if (!uploadedList) {
      throw new Error('No upload to publish');
    }

    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publish-uploaded-list`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            uploaded_list_id: uploadedList.id,
            items,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao publicar');
      }

      const result = await response.json();

      // Update local state
      setUploadedList({
        ...uploadedList,
        status: 'published',
        material_list_id: result.material_list_id,
      });

      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao publicar');
      throw err;
    } finally {
      setIsPublishing(false);
    }
  }, [uploadedList]);

  const reset = useCallback(() => {
    setUploadedList(null);
    setCombinedItems([]);
    setError(null);
    setProcessingState({
      currentFile: 0,
      totalFiles: 0,
      status: "pending",
      progress: 0,
      message: null,
    });
  }, []);

  return {
    uploadAndProcessFiles,
    updateItems,
    publishList,
    reset,
    uploadedList,
    combinedItems,
    processingState,
    isUploading,
    isProcessing,
    isPublishing,
    error,
  };
}

// Deduplicate items by normalized name
function deduplicateItems(items: ExtractedItem[]): ExtractedItem[] {
  const itemMap = new Map<string, ExtractedItem>();
  
  for (const item of items) {
    // Normalize the name for comparison
    const normalizedKey = normalizeItemName(item.name);
    
    if (itemMap.has(normalizedKey)) {
      // Merge: keep the higher quantity
      const existing = itemMap.get(normalizedKey)!;
      if (item.quantity > existing.quantity) {
        itemMap.set(normalizedKey, item);
      }
    } else {
      itemMap.set(normalizedKey, item);
    }
  }
  
  return Array.from(itemMap.values());
}

function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "") // Remove special chars
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}
