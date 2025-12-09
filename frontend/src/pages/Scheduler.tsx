import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { API_BASE_URL, getAuthToken } from "../utils/apiHelpers";

type BomItem = {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  leadTimeDays: number;
  buildTimeDays: number;
  totalDays: number;
};

const defaultAssumptions = {
  leadTimeDays: 7,
  buildTimeDays: 2,
};

const formatDays = (days: number) => {
  if (!Number.isFinite(days)) return "—";
  if (days < 1) return "<1 day";
  return `${days.toFixed(1).replace(/\.0$/, "")} days`;
};

const normalizeRow = (row: Record<string, any>) => {
  const normalized: Record<string, any> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[key.toLowerCase()] = value;
  });
  return normalized;
};

const parseBom = (
  data: ArrayBuffer,
  assumptions = defaultAssumptions
): BomItem[] => {
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    defval: "",
  });

  return rows.map((row, index) => {
    const normalized = normalizeRow(row);
    const name =
      normalized["component"] ||
      normalized["part"] ||
      normalized["item"] ||
      normalized["name"] ||
      normalized["description"] ||
      `Line ${index + 1}`;
    const description =
      normalized["description"] || normalized["notes"] || normalized["remarks"];

    const quantity = Number(
      normalized["qty"] || normalized["quantity"] || normalized["count"] || 1
    );

    const lead = parseFloat(
      normalized["leadtime"] ||
        normalized["lead_time"] ||
        normalized["lead time"] ||
        normalized["procurement"] ||
        assumptions.leadTimeDays
    );

    const build = parseFloat(
      normalized["buildtime"] ||
        normalized["build_time"] ||
        normalized["make time"] ||
        normalized["fab time"] ||
        normalized["assembly time"] ||
        assumptions.buildTimeDays
    );

    const leadTimeDays =
      Number.isFinite(lead) && lead > 0 ? lead : assumptions.leadTimeDays;
    const buildTimeDays =
      Number.isFinite(build) && build >= 0 ? build : assumptions.buildTimeDays;

    return {
      id: `bom-${index}-${Date.now()}`,
      name: String(name).trim() || `Line ${index + 1}`,
      description: String(description || "").trim(),
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      leadTimeDays,
      buildTimeDays,
      totalDays: leadTimeDays + buildTimeDays,
    };
  });
};

const Scheduler: React.FC = () => {
  const [items, setItems] = useState<BomItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = async () => {
    if (!uploadedFile) return;

    setIsParsing(true);
    setError(null);

    try {
      // Use AI-powered backend analysis
      const formData = new FormData();
      formData.append("file", uploadedFile);

      // Use the same API helper as the rest of the app
      const apiUrl = API_BASE_URL || "";
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`${apiUrl}/api/cad/analyze`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Analysis failed" }));
        throw new Error(errorData.detail || "Analysis failed");
      }

      const result = await response.json();
      setItems(result.components);
      setError(null);
    } catch (err: any) {
      console.error("Failed to analyze CAD file:", err);
      setError(
        err.message || "Could not analyze that file. Try another .xlsx or .csv."
      );

      // Fallback to local parsing if backend fails
      try {
        const data = await uploadedFile.arrayBuffer();
        const parsed = parseBom(data, defaultAssumptions);
        setItems(parsed);
        setError(null); // Don't show error for successful fallback
      } catch (fallbackErr) {
        console.error("Fallback parsing also failed:", fallbackErr);
        setError(
          "Could not parse that file. Please check the format and try again."
        );
      }
    } finally {
      setIsParsing(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setFileName(file.name);
      setItems([]);
      setError(null);
    }
  };

  const summary = useMemo(() => {
    if (items.length === 0) {
      return { longest: null, average: 0, projectTotal: 0 };
    }
    const longest = items.reduce((prev, curr) =>
      curr.totalDays > prev.totalDays ? curr : prev
    );
    const average =
      items.reduce((sum, item) => sum + item.totalDays, 0) / items.length;

    // Calculate total project time: critical path (longest lead time) + build time
    // Assumption: All procurement happens in parallel, then build happens sequentially
    const longestLeadTime = Math.max(...items.map((item) => item.leadTimeDays));
    const totalBuildTime = items.reduce(
      (sum, item) => sum + item.buildTimeDays,
      0
    );
    const projectTotal = longestLeadTime + totalBuildTime;

    return { longest, average, projectTotal };
  }, [items]);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scheduler</h1>
        <p className="text-gray-600">
          Upload a CAD file to estimate procurement and build time per
          component. We read the first sheet of your Excel/CSV and highlight the
          slowest items.
        </p>
      </div>

      <div className="card p-6 border-dashed border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Upload CAD Design (.xlsx / .csv / .stl)
            </h3>
            <p className="text-sm text-gray-600">
              Upload your CAD file with component details, then click Parse to
              analyze timing. We look for columns like &ldquo;Component&rdquo;,
              &ldquo;Qty&rdquo;, &ldquo;Lead Time&rdquo;, and &ldquo;Build
              Time&rdquo;.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.stl"
              onChange={onFileChange}
              className="block text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 cursor-pointer transition-all"
            />
            {uploadedFile && (
              <button
                onClick={handleParse}
                disabled={isParsing}
                className="px-5 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                {isParsing ? "Parsing..." : "Parse"}
              </button>
            )}
          </div>
        </div>
        {fileName && !isParsing && items.length === 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-700 font-medium">
              File ready: {fileName} — Click Parse to analyze
            </span>
          </div>
        )}
        {isParsing && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <svg
              className="animate-spin w-4 h-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-gray-700 font-medium">
              Parsing {fileName}...
            </span>
          </div>
        )}
        {items.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-700 font-medium">
              Analysis complete for: {fileName}
            </span>
          </div>
        )}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-1">Lines parsed</p>
              <p className="text-2xl font-semibold">{items.length}</p>
              <p className="text-xs text-gray-500">
                From the first sheet of your upload.
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-1">Project total time</p>
              <p className="text-2xl font-semibold text-blue-600">
                {formatDays(summary.projectTotal)}
              </p>
              <p className="text-xs text-gray-500">
                Longest procurement + all builds.
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-1">Average item time</p>
              <p className="text-2xl font-semibold">
                {formatDays(summary.average)}
              </p>
              <p className="text-xs text-gray-500">
                Lead + build per component.
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-1">Slowest item</p>
              <p className="text-2xl font-semibold">
                {summary.longest?.name || "—"}
              </p>
              <p className="text-xs text-gray-500">
                {summary.longest
                  ? formatDays(summary.longest.totalDays)
                  : "Upload a BOM to see timing."}
              </p>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Component
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Procurement
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Build/Fab
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const isCritical =
                      summary.longest &&
                      summary.longest.id === item.id &&
                      item.totalDays === summary.longest.totalDays;
                    return (
                      <tr
                        key={item.id}
                        className={isCritical ? "bg-amber-50/70" : undefined}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDays(item.leadTimeDays)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDays(item.buildTimeDays)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {formatDays(item.totalDays)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {isCritical ? "On the critical path" : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-10 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No CAD file loaded yet
          </h3>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Upload an Excel or CSV CAD file to see procurement + build timing
            per line item. We'll use default timing if your sheet doesn't
            contain lead/build columns.
          </p>
        </div>
      )}
    </div>
  );
};

export default Scheduler;
