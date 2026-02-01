import { useState, useCallback, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ContributeIntro } from "@/components/upload/ContributeIntro";
import { SchoolSelectStep } from "@/components/upload/SchoolSelectStep";
import { InputMethodSelector } from "@/components/upload/InputMethodSelector";
import { FileUploadStep } from "@/components/upload/FileUploadStep";
import { ManualEntryStep } from "@/components/upload/ManualEntryStep";
import { ProcessingStep } from "@/components/upload/ProcessingStep";
import { ConfirmationStep } from "@/components/upload/ConfirmationStep";
import { ThankYouStep } from "@/components/upload/ThankYouStep";
import { usePublicUpload, ExtractedItem } from "@/hooks/use-public-upload";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SelectedSchool {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  cep: string;
}

type WizardStep = 
  | "intro"
  | "school" 
  | "input-method" 
  | "upload" 
  | "manual"
  | "processing" 
  | "confirmation" 
  | "thank-you";

type InputMethod = "upload" | "camera" | "manual";

const STEP_PROGRESS: Record<WizardStep, number> = {
  "intro": 0,
  "school": 20,
  "input-method": 35,
  "upload": 50,
  "manual": 50,
  "processing": 70,
  "confirmation": 85,
  "thank-you": 100,
};

// Step order for determining animation direction
const STEP_ORDER: WizardStep[] = [
  "intro",
  "school",
  "input-method",
  "upload",
  "manual",
  "processing",
  "confirmation",
  "thank-you",
];

// Animation variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

const fadeScaleVariants = {
  enter: {
    opacity: 0,
    scale: 0.95,
  },
  center: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
  },
};

export default function UploadList() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("intro");
  const [previousStep, setPreviousStep] = useState<WizardStep>("intro");
  const [selectedSchool, setSelectedSchool] = useState<SelectedSchool | null>(null);
  const [customSchoolName, setCustomSchoolName] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<InputMethod | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [manualItems, setManualItems] = useState<ExtractedItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishResult, setPublishResult] = useState<{
    schoolSlug: string | null;
    schoolName: string;
    gradeName: string;
    itemsCount: number;
  } | null>(null);

  // Calculate animation direction based on step order
  const getDirection = (from: WizardStep, to: WizardStep): number => {
    const fromIndex = STEP_ORDER.indexOf(from);
    const toIndex = STEP_ORDER.indexOf(to);
    return toIndex > fromIndex ? 1 : -1;
  };

  const direction = getDirection(previousStep, currentStep);

  // Custom setStep that tracks previous step for animation direction
  const goToStep = useCallback((newStep: WizardStep) => {
    setPreviousStep(currentStep);
    setCurrentStep(newStep);
  }, [currentStep]);

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

  // Fetch grade name
  const { data: grades } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grades").select("*").order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const selectedGradeName = grades?.find(g => g.id === selectedGradeId)?.name || "";
  const schoolDisplayName = selectedSchool?.name || customSchoolName || "Escola";

  // Handlers
  const handleStart = useCallback(() => {
    goToStep("school");
  }, [goToStep]);

  const handleSchoolSelect = useCallback((school: SelectedSchool | null, customName: string | null) => {
    setSelectedSchool(school);
    setCustomSchoolName(customName);
  }, []);

  const handleNextFromSchool = useCallback(() => {
    if (selectedSchool || customSchoolName) {
      goToStep("input-method");
    }
  }, [selectedSchool, customSchoolName, goToStep]);

  const handleInputMethodSelect = useCallback((method: InputMethod) => {
    setInputMethod(method);
    if (method === "manual") {
      goToStep("manual");
    } else {
      goToStep("upload");
    }
  }, [goToStep]);

  const handleProcess = useCallback(async () => {
    if (!selectedFile || !selectedGradeId) return;

    try {
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 10, 90));
      }, 200);

      const upload = await uploadFile(
        selectedFile,
        selectedSchool?.id || null,
        customSchoolName,
        selectedGradeId
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      goToStep("processing");

      await processUpload(upload.id);
    } catch (err) {
      console.error("Upload/process error:", err);
    }
  }, [selectedFile, selectedGradeId, selectedSchool, customSchoolName, uploadFile, processUpload, goToStep]);

  const handleManualFinish = useCallback(() => {
    if (manualItems.length > 0) {
      goToStep("confirmation");
    }
  }, [manualItems.length, goToStep]);

  const handleConfirmBack = useCallback(() => {
    if (inputMethod === "manual") {
      goToStep("manual");
    } else if (uploadedList?.extracted_items) {
      goToStep("confirmation");
    }
  }, [inputMethod, uploadedList, goToStep]);

  const handlePublish = useCallback(async () => {
    const itemsToPublish = inputMethod === "manual" 
      ? manualItems 
      : uploadedList?.extracted_items || [];

    if (itemsToPublish.length === 0) return;

    try {
      if (inputMethod === "manual" && selectedGradeId) {
        const blob = new Blob([JSON.stringify(itemsToPublish)], { type: "application/json" });
        const file = new File([blob], "manual-entry.json", { type: "application/json" });
        
        const upload = await uploadFile(
          file,
          selectedSchool?.id || null,
          customSchoolName,
          selectedGradeId
        );

        updateItems(itemsToPublish);
        const result = await publishList(itemsToPublish);
        
        setPublishResult({
          schoolSlug: result.school_slug,
          schoolName: result.school_name || schoolDisplayName,
          gradeName: result.grade_name || selectedGradeName,
          itemsCount: result.items_count,
        });
      } else if (uploadedList) {
        const result = await publishList(itemsToPublish);
        setPublishResult({
          schoolSlug: result.school_slug,
          schoolName: result.school_name || schoolDisplayName,
          gradeName: result.grade_name || selectedGradeName,
          itemsCount: result.items_count,
        });
      }
      
      goToStep("thank-you");
    } catch (err) {
      console.error("Publish error:", err);
    }
  }, [inputMethod, manualItems, uploadedList, publishList, selectedSchool, customSchoolName, selectedGradeId, uploadFile, updateItems, schoolDisplayName, selectedGradeName, goToStep]);

  const handleReset = useCallback(() => {
    reset();
    setPreviousStep("intro");
    setCurrentStep("intro");
    setSelectedSchool(null);
    setCustomSchoolName(null);
    setInputMethod(null);
    setSelectedFile(null);
    setSelectedGradeId(null);
    setManualItems([]);
    setUploadProgress(0);
    setPublishResult(null);
  }, [reset]);

  const handleBack = useCallback(() => {
    switch (currentStep) {
      case "school":
        goToStep("intro");
        break;
      case "input-method":
        goToStep("school");
        break;
      case "upload":
      case "manual":
        goToStep("input-method");
        setInputMethod(null);
        break;
      case "confirmation":
        if (inputMethod === "manual") {
          goToStep("manual");
        } else {
          goToStep("upload");
        }
        break;
    }
  }, [currentStep, inputMethod, goToStep]);

  // Auto-advance from processing to confirmation
  useEffect(() => {
    if (currentStep === "processing" && uploadedList?.status === "completed") {
      setTimeout(() => goToStep("confirmation"), 500);
    }
  }, [currentStep, uploadedList?.status, goToStep]);

  const showProgressBar = currentStep !== "intro" && currentStep !== "thank-you";
  const showBackButton = ["school", "input-method", "upload", "manual"].includes(currentStep);

  const getCurrentItems = (): ExtractedItem[] => {
    if (inputMethod === "manual") {
      return manualItems;
    }
    return uploadedList?.extracted_items || [];
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background py-8 md:py-12">
        <div className="container max-w-lg">
          {/* Progress Bar with animation */}
          <AnimatePresence>
            {showProgressBar && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <Progress value={STEP_PROGRESS[currentStep]} className="h-2" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back Button with animation */}
          <AnimatePresence>
            {showBackButton && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-4 gap-1 -ml-2"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Card */}
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <AnimatePresence mode="wait" custom={direction}>
                {/* Intro */}
                {currentStep === "intro" && (
                  <motion.div
                    key="intro"
                    custom={direction}
                    variants={fadeScaleVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <ContributeIntro onStart={handleStart} />
                  </motion.div>
                )}

                {/* School Selection */}
                {currentStep === "school" && (
                  <motion.div
                    key="school"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="space-y-6"
                  >
                    <SchoolSelectStep
                      onSelect={handleSchoolSelect}
                      selectedSchool={selectedSchool}
                      customSchoolName={customSchoolName}
                    />
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleNextFromSchool}
                      disabled={!selectedSchool && !customSchoolName}
                    >
                      Continuar
                    </Button>
                  </motion.div>
                )}

                {/* Input Method Selection */}
                {currentStep === "input-method" && (
                  <motion.div
                    key="input-method"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <InputMethodSelector onSelect={handleInputMethodSelect} />
                  </motion.div>
                )}

                {/* File Upload */}
                {currentStep === "upload" && inputMethod && (
                  <motion.div
                    key="upload"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <FileUploadStep
                      file={selectedFile}
                      gradeId={selectedGradeId}
                      inputMethod={inputMethod === "camera" ? "camera" : "upload"}
                      onFileSelect={setSelectedFile}
                      onGradeSelect={setSelectedGradeId}
                      onProcess={handleProcess}
                      onBack={handleBack}
                      isUploading={isUploading}
                      uploadProgress={uploadProgress}
                    />
                  </motion.div>
                )}

                {/* Manual Entry */}
                {currentStep === "manual" && (
                  <motion.div
                    key="manual"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="space-y-6"
                  >
                    {/* Grade Selection for manual */}
                    {!selectedGradeId && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <label className="text-sm font-medium">Série / Ano *</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={selectedGradeId || ""}
                          onChange={(e) => setSelectedGradeId(e.target.value)}
                        >
                          <option value="">Selecione a série...</option>
                          {grades?.map((grade) => (
                            <option key={grade.id} value={grade.id}>
                              {grade.name}
                            </option>
                          ))}
                        </select>
                      </motion.div>
                    )}
                    
                    {selectedGradeId && (
                      <ManualEntryStep
                        items={manualItems}
                        onUpdateItems={setManualItems}
                        onFinish={handleManualFinish}
                      />
                    )}
                  </motion.div>
                )}

                {/* Processing */}
                {currentStep === "processing" && (
                  <motion.div
                    key="processing"
                    custom={direction}
                    variants={fadeScaleVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <ProcessingStep
                      progress={uploadedList?.processing_progress || 0}
                      message={uploadedList?.processing_message || null}
                      status={uploadedList?.status || "processing"}
                    />
                  </motion.div>
                )}

                {/* Confirmation */}
                {currentStep === "confirmation" && (
                  <motion.div
                    key="confirmation"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <ConfirmationStep
                      schoolName={schoolDisplayName}
                      gradeName={selectedGradeName}
                      items={getCurrentItems()}
                      onBack={handleConfirmBack}
                      onConfirm={handlePublish}
                      isPublishing={isPublishing}
                    />
                  </motion.div>
                )}

                {/* Thank You */}
                {currentStep === "thank-you" && publishResult && (
                  <motion.div
                    key="thank-you"
                    variants={fadeScaleVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <ThankYouStep
                      schoolSlug={publishResult.schoolSlug}
                      schoolName={publishResult.schoolName}
                      gradeName={publishResult.gradeName}
                      itemsCount={publishResult.itemsCount}
                      onReset={handleReset}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Display */}
              <AnimatePresence>
                {error && currentStep !== "thank-you" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <AnimatePresence>
            {currentStep === "intro" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-8 flex justify-center gap-6 text-xs text-muted-foreground"
              >
                <span>🔒 Sem cadastro</span>
                <span>⚡ 2 minutos</span>
                <span>💚 100% gratuito</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}
