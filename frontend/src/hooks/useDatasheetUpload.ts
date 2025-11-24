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
  skippedDetails?: Array<{ componentId: string; message: string }>;
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
      console.log("========================================");
      console.log("STARTING AUTO-IMPORT PROCESS");
      console.log("Component ID:", componentId);
      console.log("PDF URL:", trimmedUrl);
      console.log("API Base URL:", API_BASE_URL);

      const apiUrl = API_BASE_URL;
      const endpoint = `${apiUrl}/api/components/${componentId}/datasheet/from-url`;
      console.log("API Endpoint:", endpoint);

      const requestBody = { url: trimmedUrl };
      console.log("Request body:", JSON.stringify(requestBody));

      const headers = {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      };
      console.log("Request headers:", headers);

      console.log("Sending POST request to backend...");
      const uploadResponse = await fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", uploadResponse.status);
      console.log("Response status text:", uploadResponse.statusText);

      if (!uploadResponse.ok) {
        let errorMessage = "Upload failed";
        let errorDetails = null;
        try {
          const errorData = await uploadResponse.json();
          console.log("Error response data:", errorData);
          errorMessage = errorData.detail || errorData.message || errorMessage;
          errorDetails = errorData;
        } catch (parseErr) {
          console.error("Could not parse error response:", parseErr);
          errorMessage = `Upload failed with status ${uploadResponse.status}`;
        }
        console.error("========================================");
        console.error("AUTO-IMPORT FAILED");
        console.error("Status:", uploadResponse.status);
        console.error("Error message:", errorMessage);
        console.error("Error details:", errorDetails);
        console.error("========================================");
        throw new Error(errorMessage);
      }

      const responseData = await uploadResponse.json();
      console.log("Success response data:", responseData);
      console.log("========================================");
      console.log("AUTO-IMPORT SUCCESSFUL");
      console.log("========================================");
      return true;
    } catch (err: any) {
      const message =
        err?.message || "Failed to upload datasheet from provided URL";
      console.error("========================================");
      console.error("EXCEPTION IN AUTO-IMPORT");
      console.error("Error message:", message);
      console.error("Error object:", err);
      console.error("URL:", url);
      console.error("Component ID:", componentId);
      console.error("========================================");
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
    const skippedDetails: Array<{ componentId: string; message: string }> = [];
    let totalAttempted = 0;

    for (const comp of components) {
      const url = comp.datasheetUrl?.trim();
      if (!url) {
        skippedCount++;
        skippedDetails.push({
          componentId: comp.id,
          message: "No datasheet URL provided",
        });
        continue;
      }

      // Be permissive on URL shape (backend will try to resolve/locate PDFs)
      totalAttempted++;
      try {
        await uploadDatasheetFromUrl(comp.id, url);
        successCount++;
      } catch (err: any) {
        const message = err?.message || "Failed to upload datasheet";
        const isNotPdfError =
          message.toLowerCase().includes("did not return a pdf") ||
          message.toLowerCase().includes("pdf file or a pdf link");

        if (isNotPdfError) {
          skippedCount++;
          skippedDetails.push({
            componentId: comp.id,
            message: "URL did not return a PDF. Please supply a direct PDF link.",
          });
        } else {
          failedDetails.push({
            componentId: comp.id,
            message,
          });
        }
      }
    }

    try {
      return {
        successCount,
        totalAttempted,
        skippedCount,
        failedDetails,
        skippedDetails,
      };
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
