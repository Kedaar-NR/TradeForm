const envUrl =
    import.meta.env.VITE_API_URL?.trim() ||
    import.meta.env.REACT_APP_API_URL?.trim();

// In development, use empty string to leverage Vite proxy
// In production, use the provided URL or fallback to localhost:8000
const isDevelopment = import.meta.env.DEV;
const resolvedUrl = envUrl || (isDevelopment ? "" : "http://localhost:8000");

if (!envUrl && !isDevelopment && typeof window !== "undefined") {
    console.warn(
        "API URL not set. Falling back to http://localhost:8000. " +
            "Set VITE_API_URL in your environment for production deployments."
    );
} else if (
    !import.meta.env.VITE_API_URL &&
    import.meta.env.REACT_APP_API_URL &&
    typeof window !== "undefined"
) {
    console.warn(
        "Using legacy REACT_APP_API_URL. Please rename it to VITE_API_URL to avoid build issues."
    );
}

const API_BASE_URL = resolvedUrl;

export const getApiUrl = (path: string) => {
    if (!path.startsWith("/")) {
        return `${API_BASE_URL}/${path}`;
    }
    return `${API_BASE_URL}${path}`;
};

/**
 * Get the auth token from localStorage.
 * Returns null if not available (e.g., SSR or not logged in).
 */
export const getAuthToken = (): string | null => {
    if (typeof window === "undefined") {
        return null;
    }
    return localStorage.getItem("authToken");
};

/**
 * Get authorization headers for API requests.
 * Returns empty object if no token is available.
 */
export const getAuthHeaders = (): Record<string, string> => {
    const token = getAuthToken();
    if (!token) {
        return {};
    }
    return {
        Authorization: `Bearer ${token}`,
    };
};

export { API_BASE_URL };
