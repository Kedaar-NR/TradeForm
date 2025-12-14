import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  suppliersApi,
  Supplier,
  SupplierCreate,
} from "../services/api";
import { Send, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

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
  });
};

const durationInDays = (start: string, end: string) => {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  return diffMs / (1000 * 60 * 60 * 24);
};

// Calculate automatic speed grade (1-10, 10=fastest)
const calculateSpeedGrade = (supplier: Supplier): number | null => {
  const completedSteps = supplier.steps.filter(
    (s) => s.completed && s.started_at && s.completed_at
  );

  if (completedSteps.length === 0) return null; // N/A

  // Calculate average days per step
  const totalDays = completedSteps.reduce((sum, step) => {
    const days = durationInDays(step.started_at!, step.completed_at!);
    return sum + days;
  }, 0);

  const avgDays = totalDays / completedSteps.length;

  // Grade based on speed (faster = higher grade)
  // < 1 day = 10, 1-2 days = 9, 2-3 days = 8, etc.
  if (avgDays < 1) return 10;
  if (avgDays < 2) return 9;
  if (avgDays < 3) return 8;
  if (avgDays < 4) return 7;
  if (avgDays < 5) return 6;
  if (avgDays < 7) return 5;
  if (avgDays < 10) return 4;
  if (avgDays < 14) return 3;
  if (avgDays < 21) return 2;
  return 1;
};

const Suppliers: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const supplierRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(
    new Set()
  );
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    contact_email: "",
    color: "#0ea5e9",
    notes: "",
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  // Handle expanding and scrolling to supplier from navigation state
  useEffect(() => {
    const state = location.state as { expandSupplierId?: string };
    if (state?.expandSupplierId && suppliers.length > 0) {
      const supplierId = state.expandSupplierId;
      // Expand the supplier
      setExpandedSuppliers((prev) => new Set(prev).add(supplierId));

      // Scroll to the supplier after a short delay to ensure it's rendered
      setTimeout(() => {
        const element = supplierRefs.current[supplierId];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);

      // Clear the state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, suppliers]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await suppliersApi.getAll();
      setSuppliers(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load suppliers:", err);
      setError("Failed to load suppliers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Supplier name cannot be empty.");
      return;
    }

    try {
      setError(null);
      const supplierData: SupplierCreate = {
        name: form.name.trim(),
        contact_name: form.contact_name.trim() || undefined,
        contact_email: form.contact_email.trim() || undefined,
        color: form.color,
        notes: form.notes.trim() || undefined,
      };

      const response = await suppliersApi.create(supplierData);
      // Reload suppliers to get the latest data from the server
      await loadSuppliers();
      setShowAddForm(false);
      setForm({
        name: "",
        contact_name: "",
        contact_email: "",
        color: form.color,
        notes: "",
      });
      setError(null);
      // Auto-expand the newly added supplier
      const newSupplierId = response.data?.id;
      if (newSupplierId) {
        setExpandedSuppliers((prev) => new Set(prev).add(newSupplierId));
      }
    } catch (err: any) {
      console.error("Failed to create supplier:", err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to create supplier. Please try again."
      );
    }
  };

  const toggleStep = async (supplierId: string, stepId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;

    const step = supplier.steps.find((s) => s.id === stepId);
    if (!step) return;

    const stepIndex = supplier.steps.findIndex((s) => s.id === stepId);

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

      await suppliersApi.toggleStep(supplierId, stepId, {
        step_id: stepId,
        completed,
        completed_at,
        started_at,
      });

      // Update local state
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id !== supplierId) return s;
          const updatedSteps = s.steps.map((st, idx) => {
            if (st.id === stepId) {
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
          });
          return { ...s, steps: updatedSteps };
        })
      );
    } catch (err: any) {
      console.error("Failed to toggle step:", err);
      setError("Failed to update step. Please try again.");
    }
  };

  const handleGenerateShareLink = async (supplierId: string) => {
    try {
      const response = await suppliersApi.generateShareLink(supplierId);
      const fullUrl = `${window.location.origin}/suppliers/shared/${response.data.share_token}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(fullUrl);
      alert("Shareable link copied to clipboard!");

      // Update local state with share_token
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === supplierId
            ? { ...s, share_token: response.data.share_token }
            : s
        )
      );
    } catch (err: any) {
      console.error("Failed to generate share link:", err);
      setError("Failed to generate share link. Please try again.");
    }
  };

  const handleDelete = async (supplierId: string) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) {
      return;
    }

    try {
      await suppliersApi.delete(supplierId);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
      setError(null);
    } catch (err: any) {
      console.error("Failed to delete supplier:", err);
      setError("Failed to delete supplier. Please try again.");
    }
  };

  const toggleSupplierExpanded = (supplierId: string) => {
    setExpandedSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  };

  const progressSummary = useMemo(() => {
    const totalSteps = suppliers.reduce(
      (sum, supplier) => sum + supplier.steps.length,
      0
    );
    const completed = suppliers.reduce(
      (sum, supplier) =>
        sum + supplier.steps.filter((step) => step.completed).length,
      0
    );
    return { totalSteps, completed };
  }, [suppliers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading suppliers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Suppliers</h1>
          <p className="text-gray-600 max-w-2xl">
            Track onboarding tasks per supplier, note how long each milestone
            takes, and grade speed once they work through the checklist.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm((open) => !open)}
            className="btn-primary"
          >
            {showAddForm ? "Close form" : "Add supplier"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Suppliers</p>
          <p className="text-2xl font-semibold">{suppliers.length}</p>
          <p className="text-xs text-gray-500">Tracked in your account.</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Steps finished</p>
          <p className="text-2xl font-semibold">
            {progressSummary.completed}/{progressSummary.totalSteps || 0}
          </p>
          <p className="text-xs text-gray-500">
            Mark items as done to timestamp cycle time.
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Speed grades</p>
          <p className="text-2xl font-semibold">
            {suppliers.filter((s) => s.grade && s.grade !== "Pending").length}
          </p>
          <p className="text-xs text-gray-500">
            Use the Grade button on each card.
          </p>
        </div>
      </div>

      {showAddForm && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              New supplier
            </h3>
            <span className="text-xs text-gray-500">
              We'll start timing from when you save.
            </span>
          </div>
          <form
            onSubmit={handleAddSupplier}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">
                Supplier name
              </span>
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="input"
                placeholder="e.g. Stellar Circuits"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">
                Point of contact
              </span>
              <input
                value={form.contact_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact_name: e.target.value }))
                }
                className="input"
                placeholder="Name"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">
                Contact email
              </span>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact_email: e.target.value }))
                }
                className="input"
                placeholder="contact@company.com"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Color</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                  className="h-10 w-16 rounded-md border border-gray-200 cursor-pointer"
                />
                <input
                  value={form.color}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                  className="input flex-1"
                  placeholder="#0ea5e9"
                />
              </div>
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="input min-h-[80px]"
                placeholder="Add any risk notes, packaging asks, or approvals."
              />
            </label>
            <div className="md:col-span-2 flex flex-col gap-3">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setError(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save supplier
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {suppliers.length === 0 ? (
        <div className="card p-10 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No suppliers yet
          </h3>
          <p className="text-sm text-gray-600 max-w-xl mx-auto mb-4">
            Add suppliers to start timing NDA returns, security reviews, pilot
            runs, and more. All data is securely stored in your account.
          </p>
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            Add your first supplier
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {suppliers
            .sort((a, b) => {
              const gradeA = calculateSpeedGrade(a) ?? -1;
              const gradeB = calculateSpeedGrade(b) ?? -1;
              return gradeB - gradeA; // Highest grade first
            })
            .map((supplier) => {
              const completedCount = supplier.steps.filter(
                (step) => step.completed
              ).length;
              const progress = Math.round(
                (completedCount / supplier.steps.length) * 100
              );
              const isExpanded = expandedSuppliers.has(supplier.id);

              return (
                <div
                  key={supplier.id}
                  ref={(el) => {
                    supplierRefs.current[supplier.id] = el;
                  }}
                  className="card p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className="h-12 w-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: supplier.color }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {supplier.name}
                          </h3>
                          <span className="text-xs text-gray-500">
                            Added {formatDate(supplier.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {supplier.contact_name || "Unnamed contact"} ·{" "}
                          {supplier.contact_email || "No email yet"}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleSupplierExpanded(supplier.id)}
                        className="btn-secondary text-sm flex items-center gap-1"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={16} />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            Expand
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-900 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {completedCount}/{supplier.steps.length} done
                        </span>
                      </div>
                      <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-600 text-white">
                        {(() => {
                          const grade = calculateSpeedGrade(supplier);
                          return grade !== null ? `${grade}/10` : "N/A";
                        })()}
                      </span>
                      <button
                        onClick={() => handleGenerateShareLink(supplier.id)}
                        className="btn-secondary text-sm flex items-center gap-1"
                        title="Generate shareable link"
                      >
                        <Send size={16} />
                        Share
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-700 transition-colors p-2"
                        title="Delete supplier"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {supplier.notes && (
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3">
                      {supplier.notes}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-5 space-y-2">
                      {supplier.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors"
                        >
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0"
                          >
                            <input
                              type="checkbox"
                              checked={step.completed}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleStep(supplier.id, step.id);
                              }}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                            />
                          </div>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() =>
                              navigate(`/suppliers/${supplier.id}/steps/${step.id}`)
                            }
                          >
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {index + 1}. {step.title}
                              </p>
                              <span className="text-[11px] text-gray-500">
                                {step.completed
                                  ? `Finished in ${formatDuration(
                                      step.started_at,
                                      step.completed_at
                                    )}`
                                  : step.started_at
                                  ? `Started ${formatDate(step.started_at)}`
                                  : "Not started"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Suppliers;
