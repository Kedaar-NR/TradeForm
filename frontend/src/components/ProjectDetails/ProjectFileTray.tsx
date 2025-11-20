import { useEffect, useMemo, useRef, useState } from "react";

interface StoredProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  addedAt: string;
}

const STORAGE_PREFIX = "tradeform_project_files";

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, idx);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[idx]}`;
};

const getFileBadgeColor = (extension: string) => {
  switch (extension) {
    case "pdf":
      return "bg-red-50 text-red-700 border border-red-100";
    case "xlsx":
    case "xls":
    case "csv":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
};

interface ProjectFileTrayProps {
  projectId?: string;
}

const ProjectFileTray: React.FC<ProjectFileTrayProps> = ({ projectId }) => {
  const [files, setFiles] = useState<StoredProjectFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageKey = useMemo(() => {
    return projectId ? `${STORAGE_PREFIX}_${projectId}` : undefined;
  }, [projectId]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredProjectFile[];
        setFiles(parsed);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error("Failed to load stored project files:", error);
    }
  }, [storageKey]);

  const persistFiles = (nextFiles: StoredProjectFile[]) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextFiles));
    } catch (error) {
      console.error("Failed to persist project files:", error);
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = Array.from(event.target.files || []);
    if (!inputFiles.length) return;

    const attachments: StoredProjectFile[] = inputFiles.map((file) => {
      const extension =
        file.name.split(".").pop()?.toLowerCase().replace(/\s+/g, "") ||
        "file";
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${file.name}-${Date.now()}-${Math.random()}`;
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        extension,
        addedAt: new Date().toISOString(),
      };
    });

    setFiles((prev) => {
      const updated = [...attachments, ...prev];
      persistFiles(updated);
      return updated;
    });

    // reset input so selecting the same file again still triggers change
    event.target.value = "";
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => {
      const updated = prev.filter((file) => file.id !== fileId);
      persistFiles(updated);
      return updated;
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Project Context Files
          </p>
          <p className="text-xs text-gray-500">
            Attach PDF or Excel references to keep them handy for this study.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
            />
          </svg>
          Attach Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.xls,.xlsx,.csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFileSelection}
        />
      </div>

      {files.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No files attached yet. Use the button above to keep datasheets,
          specs, or supporting documents close to this project.
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm min-w-[200px]"
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-xs font-semibold ${getFileBadgeColor(
                  file.extension
                )}`}
              >
                {file.extension.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatBytes(file.size)} ·{" "}
                  {new Date(file.addedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(file.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectFileTray;
