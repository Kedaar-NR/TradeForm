/**
 * Utility functions for file download operations.
 * Centralizes blob creation and download logic used across multiple components.
 */

/**
 * Downloads a Blob as a file by creating a temporary anchor element.
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Downloads content from a URL by creating a temporary anchor element.
 * Use for URLs that can be directly downloaded (e.g., object URLs).
 */
export function downloadFromUrl(url: string, filename: string): void {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Fetches content from a URL and downloads it as a file.
 * Handles authentication headers and error responses.
 */
export async function fetchAndDownloadBlob(
    url: string,
    filename: string,
    authHeaders?: Record<string, string>
): Promise<void> {
    const response = await fetch(url, {
        headers: authHeaders || {},
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to download: ${response.status}`);
    }

    const blob = await response.blob();
    downloadBlob(blob, filename);
}

/**
 * Creates a Blob from response data and downloads it.
 * Useful for axios responses where data is already available.
 */
export function downloadResponseAsBlob(
    data: BlobPart,
    filename: string,
    mimeType: string
): void {
    const blob = new Blob([data], { type: mimeType });
    downloadBlob(blob, filename);
}

/**
 * MIME types for common file formats
 */
export const MIME_TYPES = {
    XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    PDF: "application/pdf",
    CSV: "text/csv",
} as const;

