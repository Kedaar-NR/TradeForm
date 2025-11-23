import React, { useState, useRef } from "react";
import { getApiUrl, getAuthHeaders } from "../utils/apiHelpers";

interface DatasheetUploadCardProps {
  onUploadSuccess: () => void;
  testComponentId: string;
  existingFilename?: string;
  autoImportUrl?: string;
  isAutoImporting?: boolean;
  onAutoImport?: () => void;
  autoImportError?: string | null;
  hasDatasheet?: boolean;
}

const DatasheetUploadCard: React.FC<DatasheetUploadCardProps> = ({
  onUploadSuccess,
  testComponentId,
  existingFilename,
  autoImportUrl,
  isAutoImporting = false,
  onAutoImport,
  autoImportError,
  hasDatasheet = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      processFileSelection(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      processFileSelection(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file || isUploading) return;
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        getApiUrl(`/api/components/${testComponentId}/datasheet`),
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      // Success
      onUploadSuccess();
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload datasheet");
    } finally {
      setIsUploading(false);
    }
  };

  const processFileSelection = (file: File) => {
    if (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      setSelectedFile(file);
      setError(null);
      // Start uploading immediately so parsing begins as soon as the PDF is available
      void uploadFile(file);
    } else {
      setError("Please select a PDF file");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await uploadFile(selectedFile);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upload Datasheet
      </h3>

      {/* Existing File Display */}
      {existingFilename && !selectedFile && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                Datasheet Uploaded
              </p>
              <p className="text-xs text-green-700 mt-1 break-all">
                {existingFilename}
              </p>
              <p className="text-xs text-green-600 mt-2 text-center font-medium">
                Upload a new file below
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auto Import Banner */}
      {autoImportUrl && !selectedFile && !hasDatasheet && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-center text-xs text-indigo-800">
          {isAutoImporting ? (
            <div className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin text-indigo-600"
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
              <span>Auto-importing datasheet from provided URL…</span>
            </div>
          ) : (
            <>
              <p className="font-semibold text-xs">Datasheet URL detected</p>
              <p className="mt-1 text-[11px] break-all text-indigo-700">
                {autoImportUrl}
              </p>
              {autoImportError && (
                <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                  <p className="font-semibold mb-1">Import Failed:</p>
                  <p>{autoImportError}</p>
                  <p className="mt-1 text-[10px] text-red-600">
                    Check browser console for details or try uploading the PDF manually
                  </p>
                </div>
              )}
              {onAutoImport ? (
                <button
                  type="button"
                  onClick={() => {
                    console.log("Manual retry button clicked for URL:", autoImportUrl);
                    onAutoImport();
                  }}
                  className="mt-2 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <svg
                    className="w-4 h-4 mr-1.5"
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
                  {autoImportError ? "Retry Import from URL" : "Import from URL"}
                </button>
              ) : (
                <p className="mt-2 text-xs text-indigo-600 italic">
                  Auto-import will begin shortly...
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <div className="mt-4">
          <label
            htmlFor="file-upload"
            className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Select a PDF file
          </label>
          <span className="text-gray-600"> or drag and drop</span>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <p className="mt-2 text-xs text-gray-500">PDF files only, up to 50MB</p>
      </div>

      {/* Selected File Display */}
      {selectedFile && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-red-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-gray-700 truncate max-w-xs">
              {selectedFile.name}
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="h-5 w-5"
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
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
            Uploading & Parsing...
          </>
        ) : (
          <>
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload & Parse
          </>
        )}
      </button>
    </div>
  );
};

export default DatasheetUploadCard;
