const envUrl = process.env.REACT_APP_API_URL?.trim();
let resolvedUrl = envUrl;

if (!resolvedUrl) {
  if (process.env.NODE_ENV === "development") {
    resolvedUrl = "http://localhost:8000";
  } else {
    resolvedUrl = "http://localhost:8000";
    if (typeof window !== "undefined") {
      console.warn(
        "REACT_APP_API_URL is not set. Falling back to http://localhost:8000. " +
          "Set REACT_APP_API_URL in your environment for production deployments."
      );
    }
  }
}

const API_BASE_URL = resolvedUrl;

export const getApiUrl = (path: string) => {
  if (!path.startsWith("/")) {
    return `${API_BASE_URL}/${path}`;
  }
  return `${API_BASE_URL}${path}`;
};

export const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") {
    return {};
  }

  const token = localStorage.getItem("authToken");
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export { API_BASE_URL };
