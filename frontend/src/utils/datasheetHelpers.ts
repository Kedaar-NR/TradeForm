/**
 * Datasheet utility functions.
 * 
 * Provides helpers for URL validation, status badge rendering, and datasheet operations.
 */

import { DatasheetStatus } from "../types";

/**
 * Check if a URL is likely a PDF datasheet link
 */
export const isPdfUrl = (url: string): boolean => {
  if (!url || !url.trim()) return false;

  const trimmed = url.trim();
  if (!isValidUrl(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    const path = decodeURIComponent(parsed.pathname.toLowerCase());
    const search = parsed.search.toLowerCase();
    const hash = parsed.hash.toLowerCase();
    const lowerFull = trimmed.toLowerCase();

    const pathLooksPdf =
      path.endsWith(".pdf") ||
      path.includes(".pdf/") ||
      path.includes(".pdf-");

    const queryLooksPdf =
      search.includes(".pdf") ||
      search.includes("format=pdf") ||
      search.includes("type=pdf") ||
      search.includes("mime=pdf");

    const hashLooksPdf = hash.includes(".pdf");

    if (pathLooksPdf || queryLooksPdf || hashLooksPdf) {
      return true;
    }

    // Heuristic cues that commonly indicate a downloadable datasheet even if the URL lacks .pdf
    const heuristicTokens = [
      "datasheet",
      "/ds/",
      "/resource",
      "/resources",
      "documentation",
      "product",
    ];
    return heuristicTokens.some((token) => lowerFull.includes(token));
  } catch {
    return /\.pdf($|\?|#)/i.test(trimmed);
  }
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || !url.trim()) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get datasheet status badge properties
 */
export const getDatasheetStatusBadge = (
  status?: DatasheetStatus,
  hasDatasheetFallback: boolean = false
) => {
  const hasDatasheet = Boolean(status?.hasDatasheet || hasDatasheetFallback);

  if (!hasDatasheet) {
    return {
      label: "Not uploaded",
      className: "px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600"
    };
  }

  if (status?.parseStatus === "failed") {
    return {
      label: "Parsing failed",
      className: "px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700"
    };
  }

  if (status?.parseStatus === "pending") {
    return {
      label: "Parsing...",
      className: "px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-700",
      showSpinner: true
    };
  }

  const isParsed =
    status?.parsed === true ||
    status?.parseStatus === "success" ||
    (!status?.parseStatus && hasDatasheetFallback);

  if (isParsed) {
    return {
      label: status?.numPages
        ? `Uploaded (${status.numPages} pages)`
        : "Uploaded",
      className: "px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700",
      showIcon: true,
      iconPath: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
    };
  }

  return {
    label: "Uploaded",
    className: "px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700"
  };
};

/**
 * Format enum value by replacing underscores with spaces
 */
export const formatEnumValue = (value: string, capitalize: boolean = false): string => {
  const formatted = value.replace(/_/g, " ");
  if (capitalize) {
    return formatted.toUpperCase();
  }
  return formatted
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Get availability badge properties
 */
export const getAvailabilityBadge = (availability: "in_stock" | "limited" | "obsolete") => {
  const styles = {
    in_stock: "bg-gray-200 text-green-600",
    limited: "bg-yellow-100 text-yellow-700",
    obsolete: "bg-red-100 text-red-700",
  };

  const labels = {
    in_stock: "In Stock",
    limited: "Limited",
    obsolete: "Obsolete",
  };

  return {
    label: labels[availability],
    className: `px-2.5 py-1 rounded-md text-xs font-medium ${styles[availability]}`
  };
};
