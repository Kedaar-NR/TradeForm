import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { suppliersApi, Supplier } from "../services/api";

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
                  <div className="mt-0.5">
                    {step.completed ? (
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
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
                    <div className="text-xs text-gray-500">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="card p-6 text-center bg-gradient-to-r from-gray-50 to-gray-100">
          <p className="text-sm text-gray-600">
            This is a read-only view of your onboarding progress.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            For questions or updates, please contact your project manager.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedSupplier;
