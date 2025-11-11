import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Suppress webpack HMR fetch errors (common with browser extensions)
if (typeof window !== "undefined") {
  const isHMRFetchError = (error: any) => {
    const message = error?.message || error?.toString() || "";
    const stack = error?.stack || "";
    const filename = error?.filename || "";

    return (
      (message.includes("Failed to fetch") ||
        message.includes("NetworkError") ||
        message.includes("Load failed")) &&
      (filename.includes("bundle.js") ||
        filename.includes("sockjs-node") ||
        filename.includes("webpack-dev-server") ||
        filename.includes("hot-update") ||
        stack.includes("sockjs-node") ||
        stack.includes("webpack-dev-server") ||
        stack.includes("hot-update"))
    );
  };

  // Catch all error events
  window.addEventListener(
    "error",
    (event) => {
      if (isHMRFetchError(event)) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    },
    true
  );

  // Catch all unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    if (isHMRFetchError(event.reason)) {
      event.preventDefault();
      return false;
    }
  });

  // Override console.error to filter HMR errors
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorStr = args.join(" ");
    if (
      errorStr.includes("Failed to fetch") &&
      (errorStr.includes("sockjs-node") ||
        errorStr.includes("webpack-dev-server") ||
        errorStr.includes("hot-update"))
    ) {
      return; // Suppress HMR fetch errors
    }
    originalConsoleError.apply(console, args);
  };
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
