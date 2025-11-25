/**
 * Utility functions for consistent error handling across the application.
 */

interface ApiErrorResponse {
    detail?: string | { message?: string } | Array<{ msg?: string }>;
    message?: string;
}

/**
 * Extracts a human-readable error message from various error formats.
 * Handles axios errors, fetch errors, and standard Error objects.
 */
export function extractErrorMessage(error: unknown, fallback: string = "Unknown error"): string {
    if (!error) {
        return fallback;
    }

    // Handle axios-style errors with response.data
    if (typeof error === "object" && error !== null) {
        const err = error as {
            response?: { data?: ApiErrorResponse };
            message?: string;
        };

        if (err.response?.data) {
            const data = err.response.data;

            // Handle string detail
            if (typeof data.detail === "string") {
                return data.detail;
            }

            // Handle object detail with message
            if (typeof data.detail === "object" && data.detail !== null) {
                if (Array.isArray(data.detail)) {
                    return data.detail
                        .map((e) => (typeof e === "string" ? e : e.msg || JSON.stringify(e)))
                        .join(", ");
                }
                if ("message" in data.detail && typeof data.detail.message === "string") {
                    return data.detail.message;
                }
                return JSON.stringify(data.detail);
            }

            // Handle top-level message
            if (data.message) {
                return data.message;
            }
        }

        // Handle standard Error objects
        if (err.message) {
            return err.message;
        }
    }

    // Handle string errors
    if (typeof error === "string") {
        return error;
    }

    return fallback;
}

/**
 * Shows an alert with extracted error message.
 * Useful for quick error feedback to users.
 */
export function alertError(error: unknown, prefix: string = "Error"): void {
    const message = extractErrorMessage(error);
    alert(`${prefix}: ${message}`);
}

/**
 * Logs error to console and optionally shows alert.
 */
export function handleError(
    error: unknown,
    context: string,
    options: { showAlert?: boolean; alertPrefix?: string } = {}
): void {
    console.error(`${context}:`, error);
    
    if (options.showAlert) {
        alertError(error, options.alertPrefix || context);
    }
}

