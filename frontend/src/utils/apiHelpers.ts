const envUrl = import.meta.env.VITE_API_URL?.trim();
const resolvedUrl = envUrl || "http://localhost:8000";

if (!envUrl && typeof window !== "undefined") {
  console.warn(
    "VITE_API_URL is not set. Falling back to http://localhost:8000. " +
      "Set VITE_API_URL in your environment for production deployments."
  );
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
