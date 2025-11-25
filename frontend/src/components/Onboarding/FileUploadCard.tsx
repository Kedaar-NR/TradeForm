import React, { useState, useCallback } from "react";
import { onboardingApi } from "../../services/api";
import { UserDocument, UserDocumentType } from "../../types";

// Lightweight inline icons to avoid external dependency
const IconUpload = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v11"
    />
  </svg>
);

const IconX = ({ className }: { className?: string }) => (
  <svg
    className={className}
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
);

const IconFileText = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6M9 16h6M9 8h2m4-6H7a2 2 0 00-2 2v16l4-4h8a2 2 0 002-2V6a2 2 0 00-2-2z"
    />
  </svg>
);

const IconCheckCircle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4"
    />
    <circle cx="12" cy="12" r="9" strokeWidth={2} />
  </svg>
);

const IconAlertCircle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="9" strokeWidth={2} />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01"
    />
  </svg>
);

const IconLoader = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
    <path className="opacity-75" strokeWidth="4" d="M4 12a8 8 0 018-8" />
  </svg>
);

interface FileUploadCardProps {
  docType: UserDocumentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  acceptedTypes: string;
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({
  docType,
  title,
  description,
  icon,
  acceptedTypes,
}) => {
  const [files, setFiles] = useState<UserDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");

  const loadFiles = useCallback(async () => {
    try {
      const response = await onboardingApi.getDocuments(docType);
      setFiles(response.data);
    } catch (err) {
      console.error("Failed to load files:", err);
    }
  }, [docType]);

  // Load existing files on mount
  React.useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFiles = useCallback(
    async (fileList: File[]) => {
      setError("");

      for (const file of fileList) {
        // Validate file type
        const ext = file.name.toLowerCase().split(".").pop();
        const allowed = acceptedTypes
          .split(",")
          .map((t) => t.trim().replace(".", ""));

        if (!allowed.includes(ext || "")) {
          setError(
            `File type .${ext} not supported. Allowed: ${acceptedTypes}`
          );
          continue;
        }

        // Validate file size (50MB)
        if (file.size > 50 * 1024 * 1024) {
          setError(`File ${file.name} is too large. Maximum size is 50MB.`);
          continue;
        }

        try {
          setUploading(true);
          const response = await onboardingApi.uploadDocument(docType, file);
          setFiles((prev) => [response.data, ...prev]);
        } catch (err: any) {
          console.error("Upload failed:", err);
          setError(
            err.response?.data?.detail ||
              `Failed to upload ${file.name}. Please try again.`
          );
        } finally {
          setUploading(false);
        }
      }
    },
    [acceptedTypes, docType]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        await handleFiles(Array.from(e.dataTransfer.files));
      }
    },
    [handleFiles]
  );

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await onboardingApi.deleteDocument(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete file. Please try again.");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <IconCheckCircle className="w-4 h-4 text-green-600" />;
      case "processing":
        return <IconLoader className="w-4 h-4 text-blue-600 animate-spin" />;
      case "failed":
        return <IconAlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <IconFileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col h-full">
      {/* Header - fixed height area */}
      <div className="flex items-start space-x-3 mb-4 min-h-[100px]">
        <div className="flex-shrink-0 text-gray-700">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id={`file-upload-${docType}`}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
          accept={acceptedTypes}
          multiple
          disabled={uploading}
        />

        <IconUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-700">
          Click or drag files to upload
        </p>
        <p className="text-xs text-gray-500 mt-1">Supported: {acceptedTypes}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Uploading Indicator */}
      {uploading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 flex items-center">
            <IconLoader className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Files ({files.length})
          </h4>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getStatusIcon(file.processingStatus)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.originalFilename}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatFileSize(file.fileSize)}</span>
                    {file.processingStatus === "failed" &&
                      file.processingError && (
                        <span className="text-red-600">
                          • {file.processingError}
                        </span>
                      )}
                    {file.processingStatus === "processing" && (
                      <span className="text-blue-600">• Processing...</span>
                    )}
                    {file.processingStatus === "ready" && (
                      <span className="text-green-600">• Ready</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(file.id)}
                className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove file"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadCard;
