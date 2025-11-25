/**
 * Shared date formatting utilities.
 * 
 * Consolidates all date formatting logic to avoid duplication across components.
 */

export type DateInput = string | number | Date;

/**
 * Convert various date input types to a Date object.
 */
export const toDate = (value: DateInput): Date => {
  return value instanceof Date ? value : new Date(value);
};

/**
 * Format date for display as "Nov 25, 2024" format.
 */
export const formatDisplayDate = (value: DateInput): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

/**
 * Format date with full timestamp as "11/25/2024 10:30:45 AM" format.
 */
export const formatDisplayTimestamp = (value: DateInput): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

/**
 * Format time only as "10:30:45 AM" format.
 */
export const formatDisplayTime = (value: DateInput): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

/**
 * Format date for use in filenames as "2024-11-25" format.
 */
export const formatDateForFilename = (value: DateInput): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown-date";
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const lookup: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  });
  return `${lookup.year ?? "0000"}-${lookup.month ?? "00"}-${lookup.day ?? "00"}`;
};

