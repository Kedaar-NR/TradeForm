import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { suppliersApi, Supplier, SupplierStep } from "../services/api";
import { PDFViewerModal } from "../components/PDFViewerModal";

const formatDuration = (start?: string, end?: string) => {
  if (!start || !end) return "—";
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) return "<1h";

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
  const minutes = totalMinutes - days * 24 * 60 - hours * 60;

  if (days > 0) {
    return `${days}d${hours ? ` ${hours}h` : ""}`;
  }
  if (hours > 0) {
    return `${hours}h${minutes ? ` ${minutes}m` : ""}`;
  }
  return `${minutes}m`;
};

const formatDate = (iso?: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const SharedSupplier: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<SupplierStep | null>(null);
  const [materialVersion, setMaterialVersion] = useState(0);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const materialUrl =
    shareToken && selectedStep
      ? `${suppliersApi.getSharedStepMaterialUrl(
          shareToken,
          selectedStep.id
        )}?v=${materialVersion}`
      : null;

  useEffect(() => {
    if (!shareToken) return;
    loadSupplier();
  }, [shareToken]);

  const loadSupplier = async () => {
    if (!shareToken) return;

    try {
      setLoading(true);
      const response = await suppliersApi.getSharedSupplier(shareToken);
      setSupplier(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load supplier:", err);
      setError("Failed to load supplier. The link may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMaterial = async (
    event: React.ChangeEvent<HTMLInputElement>,
    step: SupplierStep
  ) => {
    if (!shareToken) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingMaterial(true);
    setUploadError(null);
    try {
      await suppliersApi.uploadSharedStepMaterial(shareToken, step.id, file);
      await loadSupplier(); // Reload to get updated data
      setMaterialVersion((prev) => prev + 1);
    } catch (err: any) {
      console.error("Failed to upload material:", err);
      setUploadError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to upload material. Please try again."
      );
    } finally {
      setIsUploadingMaterial(false);
      event.target.value = "";
    }
  };

  const handleToggleStep = async (step: SupplierStep) => {
    if (!shareToken || !supplier) return;

    const stepIndex = supplier.steps.findIndex((s) => s.id === step.id);
    if (stepIndex === -1) return;

    try {
      const now = new Date().toISOString();
      const completed = !step.completed;

      let started_at = step.started_at;
      let completed_at = completed ? now : undefined;

      if (completed && !step.started_at) {
        started_at =
          stepIndex > 0
            ? supplier.steps[stepIndex - 1].completed_at || supplier.created_at
            : supplier.created_at;
      }

      await suppliersApi.toggleSharedStep(shareToken, step.id, {
        step_id: step.id,
        completed,
        completed_at,
        started_at,
      });

      // Update local state
      setSupplier((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map((st, idx) => {
            if (st.id === step.id) {
              return {
                ...st,
                completed,
                completed_at,
                started_at: st.started_at || started_at,
              };
            }
            // Start the next step if current was completed
            if (
              completed &&
              idx === stepIndex + 1 &&
              !st.started_at &&
              !st.completed
            ) {
              return { ...st, started_at: now };
            }
            // Clear future steps if uncompleting
            if (!completed && idx > stepIndex && !st.completed) {
              return { ...st, started_at: undefined };
            }
            return st;
          }),
        };
      });
    } catch (err: any) {
      console.error("Failed to toggle step:", err);
      setError("Failed to update step. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Supplier Not Found
          </h1>
          <p className="text-gray-600">
            {error || "The link you followed may be invalid or expired."}
          </p>
        </div>
      </div>
    );
  }

  const completedCount = supplier.steps.filter((step) => step.completed).length;
  const progress = Math.round(
    (completedCount / supplier.steps.length) * 100
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="card p-8">
          <div className="flex items-start gap-4 mb-6">
            <span
              className="h-16 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: supplier.color }}
              aria-hidden
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {supplier.name}
              </h1>
              <p className="text-gray-600">Supplier Onboarding Progress</p>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {formatDate(supplier.updated_at)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium">Overall Progress</span>
              <span className="text-gray-600">
                {completedCount}/{supplier.steps.length} steps completed
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-right">{progress}% complete</p>
          </div>

          {supplier.grade && supplier.grade !== "Pending" && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Performance Grade
                </span>
                <span className="px-3 py-1 rounded-full text-lg font-bold bg-gray-900 text-white">
                  {supplier.grade}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Onboarding Steps */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Onboarding Checklist
          </h2>
          <div className="space-y-3">
            {supplier.steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-4 rounded-lg border transition-all ${
                  step.completed
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={step.completed}
                    onChange={() => handleToggleStep(step)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-semibold ${
                          step.completed ? "text-green-900" : "text-gray-900"
                        }`}
                      >
                        {index + 1}. {step.title}
                      </h3>
                      {step.completed && (
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {step.description}
                    </p>
                    <div className="text-xs text-gray-500 mb-2">
                      {step.completed ? (
                        <>
                          <span>
                            Completed in{" "}
                            {formatDuration(step.started_at, step.completed_at)}
                          </span>
                          {step.completed_at && (
                            <span className="ml-2">
                              · Finished on {formatDate(step.completed_at)}
                            </span>
                          )}
                        </>
                      ) : step.started_at ? (
                        `Started on ${formatDate(step.started_at)}`
                      ) : (
                        "Not started yet"
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {step.has_material ? (
                        <button
                          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                          onClick={() => {
                            const isPdf =
                              (step.material_mime_type || "").toLowerCase().includes("pdf") ||
                              !step.material_mime_type;
                            if (isPdf) {
                              setSelectedStep(step);
                              setMaterialVersion((prev) => prev + 1);
                            } else if (shareToken) {
                              window.open(
                                `${suppliersApi.getSharedStepMaterialUrl(
                                  shareToken,
                                  step.id
                                )}?v=${materialVersion + 1}`,
                                "_blank"
                              );
                            }
                          }}
                        >
                          View materials
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      ) : null}
                      <label className="cursor-pointer px-3 py-1.5 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-100">
                        {isUploadingMaterial ? "Uploading..." : step.has_material ? "Replace file" : "Upload file"}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleUploadMaterial(e, step)}
                          disabled={isUploadingMaterial}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <PDFViewerModal
          isOpen={Boolean(selectedStep && materialUrl)}
          pdfUrl={materialUrl}
          onClose={() => setSelectedStep(null)}
          title={
            selectedStep?.material_name ||
            selectedStep?.material_original_filename ||
            selectedStep?.title ||
            "Task material"
          }
        />

        {/* Upload Error */}
        {uploadError && (
          <div className="card p-4 bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        )}

        {/* Footer */}
        <div className="card p-6 text-center bg-gradient-to-r from-gray-50 to-gray-100">
          <p className="text-sm text-gray-600">
            You can upload materials and mark steps as complete using the controls above.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Changes will be synced with your project manager in real-time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedSupplier;
