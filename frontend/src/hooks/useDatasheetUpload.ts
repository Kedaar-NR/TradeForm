/**
 * Hook for datasheet upload operations.
 * 
 * Handles uploading datasheets from URLs, including downloading PDFs
 * and uploading them to the backend.
 */

import { useState } from "react";
import { API_BASE_URL, getAuthHeaders } from "../utils/apiHelpers";

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
      console.error("Upload from URL error:", err);
      console.error("Error details:", {
        message: err.message,
        url: url,
        componentId: componentId,
      });
      return false;
    }
  };

  /**
   * Upload multiple datasheets from URLs
   */
  const uploadMultipleDatasheets = async (
    components: Array<{ id: string; datasheetUrl?: string }>
  ): Promise<{ successCount: number; totalAttempted: number; skippedCount: number }> => {
    setIsUploading(true);
    let skippedCount = 0;
    const uploadTasks: Array<Promise<boolean>> = [];

    for (const comp of components) {
      const url = comp.datasheetUrl?.trim();
      if (!url) {
        skippedCount++;
        continue;
      }

      uploadTasks.push(uploadDatasheetFromUrl(comp.id, url));
    }

    try {
      const results = await Promise.all(
        uploadTasks.map(async (task) => {
          try {
            return await task;
          } catch {
            return false;
          }
        })
      );

      const successCount = results.filter(Boolean).length;
      const totalAttempted = uploadTasks.length;

      return { successCount, totalAttempted, skippedCount };
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
