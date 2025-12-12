import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  suppliersApi,
  Supplier,
  SupplierStep,
} from "../services/api";
import { ArrowLeft } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { getAuthToken } from "../utils/apiHelpers";

const SupplierStepView: React.FC = () => {
  const { supplierId, stepId } = useParams<{ supplierId: string; stepId: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [step, setStep] = useState<SupplierStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [materialVersion, setMaterialVersion] = useState(0);
  const [isSigning, setIsSigning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignatureStroke, setHasSignatureStroke] = useState(false);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const prefillAttemptedRef = useRef(false);

  const TEMPLATE_MAP: Record<string, { path: string; filename: string }> = {
    nda: {
      path: "/templates/nda-template.pdf",
      filename: "Mutual_NDA_Template.pdf",
    },
    security: {
      path: "/templates/security-template.pdf",
      filename: "Security_Questionnaire.pdf",
    },
    quality: {
      path: "/templates/quality-template.pdf",
      filename: "Quality_Package.pdf",
    },
    sample: {
      path: "/templates/sample-template.pdf",
      filename: "Sample_Build.pdf",
    },
    commercial: {
      path: "/templates/commercial-template.pdf",
      filename: "Commercial_Terms.pdf",
    },
    pilot: { path: "/templates/pilot-template.pdf", filename: "Pilot_Run.pdf" },
    production: {
      path: "/templates/production-template.pdf",
      filename: "Production_Slot.pdf",
    },
  };

  const DEFAULT_TEMPLATE = {
    path: "/templates/generic-template.pdf",
    filename: "Task_Material.pdf",
  };

  const templateForStep =
    step?.step_id && TEMPLATE_MAP[step.step_id]
      ? TEMPLATE_MAP[step.step_id]
      : DEFAULT_TEMPLATE;

  const materialUrl =
    supplier && step && step.has_material
      ? `${suppliersApi.getStepMaterialUrl(
          supplier.id,
          step.id
        )}?v=${materialVersion}`
      : null;

  const isPdfMaterial =
    (step?.material_mime_type?.toLowerCase() || "").includes("pdf") ||
    (!step?.material_mime_type && Boolean(step?.has_material));

  useEffect(() => {
    loadSupplierAndStep();
  }, [supplierId, stepId]);

  const loadSupplierAndStep = async () => {
    if (!supplierId || !stepId) return;

    try {
      setLoading(true);
      const response = await suppliersApi.get(supplierId);
      const supplierData = response.data;
      const stepData = supplierData.steps.find((s: SupplierStep) => s.id === stepId);

      if (!stepData) {
        setError("Step not found");
        return;
      }

      setSupplier(supplierData);
      setStep(stepData);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load supplier step:", err);
      setError("Failed to load supplier step. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load inline preview as blob URL
  useEffect(() => {
    let revokeUrl: string | null = null;
    const loadPreview = async () => {
      if (!materialUrl || !isPdfMaterial || isPrefilling) {
        setPreviewUrl(null);
        setPreviewError(null);
        return;
      }
      try {
        setPreviewLoading(true);
        setPreviewError(null);
        const token = getAuthToken();
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const response = await fetch(materialUrl, {
          headers,
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Failed to load preview: ${response.statusText}`);
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        revokeUrl = objectUrl;
        setPreviewUrl(objectUrl);
      } catch (err: any) {
        console.error("Failed to load preview:", err);
        setPreviewError("Preview unavailable. Use Download to view.");
        setPreviewUrl(materialUrl);
      } finally {
        setPreviewLoading(false);
      }
    };
    loadPreview();

    return () => {
      if (revokeUrl) {
        URL.revokeObjectURL(revokeUrl);
      }
    };
  }, [materialUrl, isPdfMaterial, isPrefilling]);

  const updateStepInState = (updatedStep: SupplierStep) => {
    setStep(updatedStep);
    setMaterialVersion((prev) => prev + 1);
  };

  const uploadMaterialFile = async (file: File) => {
    if (!supplier || !step) return null;
    const response = await suppliersApi.uploadStepMaterial(
      supplier.id,
      step.id,
      file
    );
    const updatedStep = response.data;
    updateStepInState(updatedStep);
    return updatedStep;
  };

  const saveSignatureIfNeeded = useCallback(async (): Promise<boolean> => {
    if (
      !hasSignatureStroke ||
      !signatureCanvasRef.current ||
      !materialUrl ||
      !supplier ||
      !step
    ) {
      return false;
    }

    try {
      setIsSavingSignature(true);
      const canvas = signatureCanvasRef.current;
      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1];
      const sigBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const pdfBytes = new Uint8Array(
        await (
          await fetch(materialUrl, { headers, credentials: "include" })
        ).arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pngImage = await pdfDoc.embedPng(sigBytes);
      const page = pdfDoc.getPage(0);
      const { width: pageWidth, height: pageHeight } = page.getSize();

      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });

      const updatedPdf = await pdfDoc.save();
      const filename =
        step?.material_original_filename ||
        `${step?.title || "task"}-signed.pdf`;
      const arrayBuffer = new ArrayBuffer(updatedPdf.length);
      new Uint8Array(arrayBuffer).set(updatedPdf);
      const file = new File([arrayBuffer], filename, {
        type: "application/pdf",
      });
      const response = await suppliersApi.uploadStepMaterial(
        supplier.id,
        step.id,
        file,
        {
          name: step?.material_name,
          description: step?.material_description,
        }
      );

      updateStepInState(response.data);
      setHasSignatureStroke(false);
      setIsSigning(false);
      return true;
    } catch (err: any) {
      console.error("Failed to save signature:", err);
      setMaterialError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to save signature. Please try again."
      );
      return false;
    } finally {
      setIsSavingSignature(false);
    }
  }, [
    hasSignatureStroke,
    materialUrl,
    step?.material_description,
    step?.material_name,
    step?.material_original_filename,
    step?.title,
    supplier,
    step,
  ]);

  const handleUploadMaterial = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!supplier || !step) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingMaterial(true);
    setMaterialError(null);
    try {
      await uploadMaterialFile(file);
    } catch (err: any) {
      console.error("Failed to upload material:", err);
      setMaterialError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to upload material. Please try again."
      );
    } finally {
      setIsUploadingMaterial(false);
      event.target.value = "";
    }
  };

  // Pre-fill default template PDFs when a step has no materials
  useEffect(() => {
    const prefill = async () => {
      if (!supplier || !step || step.has_material || prefillAttemptedRef.current) {
        return;
      }
      prefillAttemptedRef.current = true;

      try {
        setIsPrefilling(true);
        setIsUploadingMaterial(true);
        const res = await fetch(templateForStep.path);
        const blob = await res.blob();
        const file = new File(
          [blob],
          templateForStep.filename ||
            `${step?.title || "template"}.pdf`,
          { type: blob.type || "application/pdf" }
        );
        await uploadMaterialFile(file);
      } catch (err: any) {
        console.error("Failed to prefill template:", err);
      } finally {
        setIsUploadingMaterial(false);
        setIsPrefilling(false);
      }
    };

    prefill();
  }, [supplier, step, templateForStep]);

  useEffect(() => {
    if (
      !isSigning ||
      !signatureCanvasRef.current ||
      !previewContainerRef.current
    )
      return;
    const canvas = signatureCanvasRef.current;
    const rect = previewContainerRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignatureStroke(false);
  }, [isSigning, materialVersion]);

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isSigning || !signatureCanvasRef.current) return;
    const point = getCanvasPoint(event);
    if (!point) return;
    const ctx = signatureCanvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setIsDrawing(true);
    setHasSignatureStroke(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isSigning || !isDrawing || !signatureCanvasRef.current) return;
    const point = getCanvasPoint(event);
    if (!point) return;
    const ctx = signatureCanvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isSigning) return;
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignatureStroke(false);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !supplier || !step) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">{error || "Step not found"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/suppliers")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to Suppliers"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{step.title}</h1>
          <p className="text-sm text-gray-500">Supplier: {supplier.name}</p>
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-sm text-gray-600">{step.description}</p>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">Task Materials</h3>
              <p className="text-sm text-gray-600">
                Preview, replace, or sign the file shown to both your team and
                the shared supplier link.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-100">
                {isUploadingMaterial
                  ? "Uploading..."
                  : step.has_material
                  ? "Replace file"
                  : "Upload file"}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleUploadMaterial}
                  disabled={isUploadingMaterial}
                  onClick={(e) => e.stopPropagation()}
                />
              </label>
              {materialUrl && (
                <>
                  <button
                    className="px-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-100"
                    onClick={() => window.open(materialUrl, "_blank")}
                  >
                    Download
                  </button>
                  {isPdfMaterial && (
                    <button
                      className={`px-3 py-2 text-sm font-semibold rounded-lg ${
                        isSigning
                          ? "bg-black text-white"
                          : "border border-gray-300 hover:bg-gray-100"
                      }`}
                      onClick={async () => {
                        if (isSigning) {
                          await saveSignatureIfNeeded();
                        }
                        setIsSigning((prev) => !prev);
                      }}
                      disabled={isSavingSignature}
                    >
                      {isSavingSignature
                        ? "Saving..."
                        : isSigning
                        ? "Done signing"
                        : "Sign"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {materialError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {materialError}
            </div>
          )}

          <div className="border border-gray-200 rounded-lg bg-gray-50 p-3">
            {materialUrl && isPdfMaterial ? (
              <div
                className="rounded-lg bg-white shadow-sm overflow-hidden border border-gray-200 relative"
                ref={previewContainerRef}
              >
                {previewLoading ? (
                  <div className="w-full h-[560px] flex items-center justify-center text-sm text-gray-600">
                    Loading preview...
                  </div>
                ) : previewError ? (
                  <div className="w-full h-[560px] flex items-center justify-center text-sm text-red-600">
                    {previewError}
                  </div>
                ) : (
                  <iframe
                    key={materialVersion}
                    src={`${
                      previewUrl || materialUrl
                    }#toolbar=0&navpanes=0`}
                    title="Task material preview"
                    className={`w-full h-[560px] ${
                      isSigning ? "pointer-events-none" : ""
                    }`}
                  />
                )}
                {isSigning && (
                  <canvas
                    ref={signatureCanvasRef}
                    className="absolute inset-0 z-10 cursor-crosshair"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  />
                )}
                {isSigning && (
                  <div className="absolute bottom-3 left-3 z-20 px-3 py-2 bg-black/80 text-white text-xs rounded">
                    Pen mode — strokes auto-save on close
                  </div>
                )}
                {/* Signing controls at bottom right */}
                {isSigning && (
                  <div className="absolute bottom-3 right-3 z-20 flex gap-2">
                    <button
                      className="px-3 py-2 text-sm font-semibold rounded-lg bg-black text-white hover:bg-gray-800"
                      onClick={handleClearSignature}
                    >
                      Clear strokes
                    </button>
                  </div>
                )}
              </div>
            ) : materialUrl ? (
              <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">
                    {step.material_name ||
                      step.material_original_filename ||
                      "Task material"}
                  </p>
                  <p className="text-xs text-gray-600">
                    Preview not available. Download to view or upload a PDF to
                    preview inline.
                  </p>
                </div>
                <button
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  onClick={() => window.open(materialUrl, "_blank")}
                >
                  Download
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-gray-600 px-3 py-4 bg-white rounded-lg border border-dashed border-gray-300">
                <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded flex items-center justify-center font-semibold">
                  PDF
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    No file uploaded yet
                  </p>
                  <p className="text-sm text-gray-600">
                    Upload a PDF or DOCX to share it directly in this step.
                  </p>
                </div>
              </div>
            )}
            {step.material_updated_at && (
              <p className="text-xs text-gray-500 mt-2">
                Last updated{" "}
                {new Date(step.material_updated_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Status:{" "}
              {step.completed ? (
                <span className="text-green-600 font-medium">Completed</span>
              ) : step.started_at ? (
                <span className="text-blue-600 font-medium">In Progress</span>
              ) : (
                <span className="text-gray-600 font-medium">Not Started</span>
              )}
            </span>
            {step.completed && (
              <span className="text-gray-500">
                Finished in{" "}
                {formatDuration(step.started_at, step.completed_at)}
              </span>
            )}
          </div>
          {isSavingSignature && (
            <p className="mt-2 text-xs text-gray-500">Saving signature...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierStepView;
