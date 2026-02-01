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

export function usePublicUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadedList, setUploadedList] = useState<UploadedList | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (
    file: File,
    schoolId: string | null,
    schoolNameCustom: string | null,
    gradeId: string | null
  ) => {
    setIsUploading(true);
    setError(null);

    try {
      const sessionId = getSessionId();
      
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${sessionId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('list-uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('[usePublicUpload] Storage upload error:', uploadError);
        throw new Error('Falha ao fazer upload do arquivo');
      }

      // Create uploaded_lists record
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
        console.error('[usePublicUpload] DB insert error:', dbError);
        throw new Error('Falha ao registrar upload');
      }

      // Track upload started
      await supabase.from('upload_events').insert({
        uploaded_list_id: newUpload.id,
        event_type: 'upload_started',
        session_id: sessionId,
      } as any);

      setUploadedList(newUpload as any);
      return newUpload as unknown as UploadedList;
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload');
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const processUpload = useCallback(async (uploadId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Poll for status updates while processing
      const pollInterval = setInterval(async () => {
        const { data } = await supabase
          .from('uploaded_lists')
          .select('*')
          .eq('id', uploadId)
          .single();
        
        if (data) {
          setUploadedList(data as any);
          
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(pollInterval);
          }
        }
      }, 1000);

      // Call the processing function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-public-upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uploaded_list_id: uploadId }),
        }
      );

      clearInterval(pollInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha no processamento');
      }

      const result = await response.json();
      
      // Fetch final state
      const { data: finalData } = await supabase
        .from('uploaded_lists')
        .select('*')
        .eq('id', uploadId)
        .single();

      if (finalData) {
        setUploadedList(finalData as any);
      }

      return result;
    } catch (err: any) {
      setError(err.message || 'Erro no processamento');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const updateItems = useCallback((items: ExtractedItem[]) => {
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
    setError(null);
  }, []);

  return {
    uploadFile,
    processUpload,
    updateItems,
    publishList,
    reset,
    uploadedList,
    isUploading,
    isProcessing,
    isPublishing,
    error,
  };
}
