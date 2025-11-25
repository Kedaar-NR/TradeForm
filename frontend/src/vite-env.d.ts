/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  // Legacy CRA-style env vars kept for compatibility during migration
  readonly REACT_APP_API_URL?: string;
  readonly REACT_APP_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
