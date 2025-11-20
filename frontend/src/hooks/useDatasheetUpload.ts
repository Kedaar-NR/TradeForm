/**
 * Hook for datasheet upload operations.
 * 
 * Handles uploading datasheets from URLs, including downloading PDFs
 * and uploading them to the backend.
 */

import { useState } from "react";
import { API_BASE_URL, getAuthHeaders } from "../utils/apiHelpers";

interface UploadSummary {
  successCount: number;
  totalAttempted: number;
  skippedCount: number;
  failedDetails?: Array<{ componentId: string; message: string }>;
}

export const useDatasheetUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Upload datasheet from a URL
   */
  const uploadDatasheetFromUrl = async (
    componentId: string,
    url: string
  ): Promise<boolean> => {
    const trimmedUrl = url?.trim();
    if (!trimmedUrl) {
      console.warn("Skipping empty datasheet URL for component", componentId);
      return false;
    }

    try {
      console.log("Downloading PDF from URL:", trimmedUrl);

      const apiUrl = API_BASE_URL;
      const uploadResponse = await fetch(
        `${apiUrl}/api/components/${componentId}/datasheet/from-url`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: trimmedUrl }),
        }
      );

      if (!uploadResponse.ok) {
        let errorMessage = "Upload failed";
        try {
          const errorData = await uploadResponse.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = `Upload failed with status ${uploadResponse.status}`;
        }
        throw new Error(errorMessage);
      }

      console.log("Successfully uploaded datasheet from URL");
      return true;
    } catch (err: any) {
      const message =
        err?.message || "Failed to upload datasheet from provided URL";
      console.error("Upload from URL error:", message);
      console.error("Error details:", {
        message,
        url: url,
        componentId: componentId,
      });
      throw new Error(message);
    }
  };

  /**
   * Upload multiple datasheets from URLs
   */
  const uploadMultipleDatasheets = async (
    components: Array<{ id: string; datasheetUrl?: string }>
  ): Promise<UploadSummary> => {
    setIsUploading(true);
    let skippedCount = 0;
    let successCount = 0;
    const failedDetails: Array<{ componentId: string; message: string }> = [];
    let totalAttempted = 0;

    for (const comp of components) {
      const url = comp.datasheetUrl?.trim();
      if (!url) {
        skippedCount++;
        continue;
      }

      totalAttempted++;
      try {
        await uploadDatasheetFromUrl(comp.id, url);
        successCount++;
      } catch (err: any) {
        failedDetails.push({
          componentId: comp.id,
          message: err?.message || "Failed to upload datasheet",
        });
      }
    }

    try {
      return { successCount, totalAttempted, skippedCount, failedDetails };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadDatasheetFromUrl,
    uploadMultipleDatasheets,
  };
};
