import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SchoolSelectStep } from "@/components/upload/SchoolSelectStep";
import { UploadStep } from "@/components/upload/UploadStep";
import { ProcessingStep } from "@/components/upload/ProcessingStep";
import { ReviewStep } from "@/components/upload/ReviewStep";
import { SuccessStep } from "@/components/upload/SuccessStep";
import { usePublicUpload, ExtractedItem } from "@/hooks/use-public-upload";

interface SelectedSchool {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  cep: string;
}

type WizardStep = "school" | "upload" | "processing" | "review" | "success";

const STEPS: WizardStep[] = ["school", "upload", "processing", "review", "success"];

export default function UploadList() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("school");
  const [selectedSchool, setSelectedSchool] = useState<SelectedSchool | null>(null);
  const [customSchoolName, setCustomSchoolName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishResult, setPublishResult] = useState<{
    schoolSlug: string | null;
    schoolName: string;
    gradeName: string;
    itemsCount: number;
  } | null>(null);

  // Upload hook
  const {
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
  } = usePublicUpload();

  // Calculate progress percentage
  const stepIndex = STEPS.indexOf(currentStep);
  const progressPercent = ((stepIndex + 1) / STEPS.length) * 100;

  // Step titles
  const stepTitles: Record<WizardStep, string> = {
    school: "Escola",
    upload: "Upload",
    processing: "Processando",
    review: "Revisão",
    success: "Concluído",
  };

  // Handlers
  const handleSchoolSelect = useCallback((school: SelectedSchool | null, customName: string | null) => {
    setSelectedSchool(school);
    setCustomSchoolName(customName);
  }, []);

  const handleNextFromSchool = useCallback(() => {
    if (selectedSchool || customSchoolName) {
      setCurrentStep("upload");
    }
  }, [selectedSchool, customSchoolName]);

  const handleProcess = useCallback(async () => {
    if (!selectedFile || !selectedGradeId) return;

    try {
      // Simulate upload progress
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 10, 90));
      }, 200);

      // Upload file
      const upload = await uploadFile(
        selectedFile,
        selectedSchool?.id || null,
        customSchoolName,
        selectedGradeId
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Move to processing step
      setCurrentStep("processing");

      // Start processing
      await processUpload(upload.id);

      // Move to review step when done
      if (uploadedList?.status === "completed" || uploadedList?.extracted_items) {
        setCurrentStep("review");
      }
    } catch (err) {
      console.error("Upload/process error:", err);
    }
  }, [selectedFile, selectedGradeId, selectedSchool, customSchoolName, uploadFile, processUpload, uploadedList]);

  const handlePublish = useCallback(async () => {
    if (!uploadedList?.extracted_items) return;

    try {
      const result = await publishList(uploadedList.extracted_items);
      setPublishResult({
        schoolSlug: result.school_slug,
        schoolName: result.school_name || selectedSchool?.name || customSchoolName || "Escola",
        gradeName: result.grade_name || "Série",
        itemsCount: result.items_count,
      });
      setCurrentStep("success");
    } catch (err) {
      console.error("Publish error:", err);
    }
  }, [uploadedList, publishList, selectedSchool, customSchoolName]);

  const handleReset = useCallback(() => {
    reset();
    setCurrentStep("school");
    setSelectedSchool(null);
    setCustomSchoolName(null);
    setSelectedFile(null);
    setSelectedGradeId(null);
    setUploadProgress(0);
    setPublishResult(null);
  }, [reset]);

  const handleBack = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0 && currentStep !== "processing" && currentStep !== "success") {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  }, [currentStep]);

  // Check if processing completed
  if (currentStep === "processing" && uploadedList?.status === "completed") {
    // Auto-advance to review
    setTimeout(() => setCurrentStep("review"), 500);
  }

  const canGoBack = currentStep !== "school" && currentStep !== "processing" && currentStep !== "success";
  const canGoNext = currentStep === "school" && (selectedSchool || customSchoolName);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-8">
        <div className="container max-w-lg">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="font-display text-3xl font-bold">
              Contribuir Lista
            </h1>
            <p className="mt-2 text-muted-foreground">
              Ajude outros pais compartilhando a lista da sua escola
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">{stepTitles[currentStep]}</span>
              <span className="text-muted-foreground">
                {stepIndex + 1} de {STEPS.length}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Main Card */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              {/* Step Content */}
              {currentStep === "school" && (
                <SchoolSelectStep
                  onSelect={handleSchoolSelect}
                  selectedSchool={selectedSchool}
                  customSchoolName={customSchoolName}
                />
              )}

              {currentStep === "upload" && (
                <UploadStep
                  file={selectedFile}
                  gradeId={selectedGradeId}
                  onFileSelect={setSelectedFile}
                  onGradeSelect={setSelectedGradeId}
                  onProcess={handleProcess}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                />
              )}

              {currentStep === "processing" && (
                <ProcessingStep
                  progress={uploadedList?.processing_progress || 0}
                  message={uploadedList?.processing_message || null}
                  status={uploadedList?.status || "processing"}
                />
              )}

              {currentStep === "review" && uploadedList?.extracted_items && (
                <ReviewStep
                  items={uploadedList.extracted_items}
                  onUpdateItems={updateItems}
                  onPublish={handlePublish}
                  isPublishing={isPublishing}
                />
              )}

              {currentStep === "success" && publishResult && (
                <SuccessStep
                  schoolSlug={publishResult.schoolSlug}
                  schoolName={publishResult.schoolName}
                  gradeName={publishResult.gradeName}
                  itemsCount={publishResult.itemsCount}
                  uploadedListId={uploadedList?.id}
                  onReset={handleReset}
                />
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Navigation */}
              {currentStep !== "processing" && currentStep !== "success" && (
                <div className="mt-6 flex gap-3">
                  {canGoBack && (
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="gap-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar
                    </Button>
                  )}
                  {canGoNext && (
                    <Button
                      className="flex-1 gap-1"
                      onClick={handleNextFromSchool}
                    >
                      Próximo
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Text */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Sua contribuição ajuda milhares de pais a economizar tempo.
            <br />
            Não é necessário criar conta.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
