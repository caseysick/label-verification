"use client";

import { ApplicationValuesSection } from "@/components/verification/ApplicationValuesSection";
import { ComparisonResultsSection } from "@/components/verification/ComparisonResultsSection";
import { LabelEvidenceSection } from "@/components/verification/LabelEvidenceSection";
import { LiveStatusRegion } from "@/components/verification/LiveStatusRegion";
import { WorkbenchHeader } from "@/components/verification/WorkbenchHeader";
import { useVerificationWorkbench } from "@/components/verification/useVerificationWorkbench";

export function VerificationWorkbench() {
  const {
    liveMessage,
    application,
    handleFieldChange,
    resetDemoApplication,
    extractionMode,
    setExtractionMode,
    pasteText,
    setPasteText,
    setOcrImageFiles,
    busy,
    onVerify,
    batchRows,
    selectedBatchIndex,
    setSelectedBatchIndex,
    displayedReport,
    displayedSourceName,
    mismatchCount,
    canSubmit,
    submitLabel,
  } = useVerificationWorkbench();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <WorkbenchHeader />
      <LiveStatusRegion message={liveMessage} />

      <ApplicationValuesSection
        application={application}
        onFieldChange={handleFieldChange}
        onResetDemo={resetDemoApplication}
      />

      <LabelEvidenceSection
        batchRows={batchRows}
        busy={busy}
        canSubmit={canSubmit}
        extractionMode={extractionMode}
        onExtractionModeChange={setExtractionMode}
        onOcrFilesSelected={setOcrImageFiles}
        onPasteTextChange={setPasteText}
        onSelectBatchRow={setSelectedBatchIndex}
        onSubmit={onVerify}
        pasteText={pasteText}
        selectedBatchIndex={selectedBatchIndex}
        submitLabel={submitLabel}
      />

      {displayedReport ? (
        <ComparisonResultsSection
          mismatchCount={mismatchCount}
          report={displayedReport}
          sourceFileName={displayedSourceName}
        />
      ) : null}
    </div>
  );
}
