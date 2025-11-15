/**
 * Hook for datasheet upload operations.
 * 
 * Handles uploading datasheets from URLs, including downloading PDFs
 * and uploading them to the backend.
 */

import { useState } from "react";
import { API_BASE_URL, getAuthHeaders } from "../utils/apiHelpers";
import { isPdfUrl } from "../utils/datasheetHelpers";

export const useDatasheetUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Upload datasheet from a URL
   */
  const uploadDatasheetFromUrl = async (
    componentId: string,
    url: string
  ): Promise<boolean> => {
    try {
      console.log("Downloading PDF from URL:", url);

      const apiUrl = API_BASE_URL;
      let response: Response;

      // Try direct download first
      try {
        response = await fetch(url, {
          method: "GET",
          mode: "cors",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (fetchError: any) {
        // If CORS fails, use backend proxy
        console.log(
          "Direct fetch failed, using backend proxy:",
          fetchError.message
        );
        response = await fetch(
          `${apiUrl}/api/proxy-pdf?url=${encodeURIComponent(url)}`,
          {
            method: "GET",
            headers: {
              ...getAuthHeaders(),
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Proxy download failed: ${response.status} ${response.statusText}`
          );
        }
      }

      const blob = await response.blob();

      // Ensure filename ends with .pdf
      let fileName = url.split("/").pop() || "datasheet.pdf";
      fileName = fileName.split("?")[0].split("#")[0];
      if (!fileName.toLowerCase().endsWith(".pdf")) {
        fileName = fileName + ".pdf";
      }

      // Create a File object
      const file = new File([blob], fileName, { type: "application/pdf" });

      console.log("Uploading file:", fileName, "Size:", file.size, "bytes");

      // Upload using the API endpoint
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(
        `${apiUrl}/api/components/${componentId}/datasheet`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
          },
          body: formData,
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
  ): Promise<{ successCount: number; totalAttempted: number }> => {
    setIsUploading(true);
    let successCount = 0;
    let totalAttempted = 0;

    try {
      for (const comp of components) {
        if (comp.datasheetUrl && comp.datasheetUrl.trim()) {
          const url = comp.datasheetUrl.trim();
          
          if (isPdfUrl(url)) {
            totalAttempted++;
            const success = await uploadDatasheetFromUrl(comp.id, url);
            if (success) {
              successCount++;
            }
          }
        }
      }

      return { successCount, totalAttempted };
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

