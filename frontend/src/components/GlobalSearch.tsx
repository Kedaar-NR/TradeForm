import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getApiUrl, getAuthHeaders } from "../utils/apiHelpers";

interface SearchResult {
  id: string;
  type: "project_group" | "project" | "component" | "criterion";
  title: string;
  subtitle?: string;
  path: string;
  project_name?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
}

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const url = getApiUrl(`/api/search?q=${encodeURIComponent(query)}`);
        console.log("[GlobalSearch] Fetching:", url);
        const res = await fetch(url, { headers: getAuthHeaders() });
        console.log("[GlobalSearch] Response status:", res.status);
        if (res.ok) {
          const data: SearchResponse = await res.json();
          console.log("[GlobalSearch] Results:", data.results.length);
          setResults(data.results);
          setSelectedIndex(-1);
        } else {
          console.error(
            "[GlobalSearch] Non-OK response:",
            res.status,
            await res.text()
          );
          setResults([]);
        }
      } catch (err) {
        console.error("[GlobalSearch] Search failed:", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Arrow key navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        navigate(selected.path);
        setIsOpen(false);
        setQuery("");
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "project_group":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        );
      case "project":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case "component":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
        );
      case "criterion":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "project_group":
        return "Folder";
      case "project":
        return "Trade Study";
      case "component":
        return "Component";
      case "criterion":
        return "Criterion";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "project_group":
        return "text-amber-600 bg-amber-50";
      case "project":
        return "text-blue-600 bg-blue-50";
      case "component":
        return "text-emerald-600 bg-emerald-50";
      case "criterion":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search projects, components... (⌘K)"
          className="w-full pl-10 pr-12 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
        />
        {isLoading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            ⌘K
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-[400px] overflow-y-auto z-[9999]">
          {results.length === 0 && !isLoading ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-1">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    navigate(result.path);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className={`w-full px-3 py-2 text-left flex items-start gap-3 transition-colors ${
                    index === selectedIndex ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded ${getTypeColor(
                      result.type
                    )} flex-shrink-0 mt-0.5`}
                  >
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-sm">
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div className="text-xs text-gray-500 truncate">
                        {result.subtitle}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                        {getTypeLabel(result.type)}
                      </span>
                      {result.project_name && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-[10px] text-gray-400 truncate">
                            {result.project_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-gray-100 px-3 py-2 text-[10px] text-gray-400 flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[9px]">
                ↑
              </kbd>{" "}
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[9px]">
                ↓
              </kbd>{" "}
              to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[9px]">
                Enter
              </kbd>{" "}
              to select
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[9px]">
                Esc
              </kbd>{" "}
              to close
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
