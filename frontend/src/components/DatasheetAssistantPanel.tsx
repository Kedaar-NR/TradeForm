import React, { useState, useEffect } from "react";
import type { DatasheetQueryAnswer, DatasheetCitation } from "../types";
import type { MockCriterion } from "./TradeStudyCriteriaPreviewCard";
import DatasheetCitationsList from "./DatasheetCitationsList";
import DatasheetSuggestedRatingCard from "./DatasheetSuggestedRatingCard";
import FormattedMarkdown from "./FormattedMarkdown";
import { getApiUrl, getAuthHeaders } from "../utils/apiHelpers";
import { formatDisplayTime } from "../utils/dateHelpers";

interface DatasheetAssistantPanelProps {
  testComponentId: string;
  mockCriteria: MockCriterion[];
  datasheetParsed: boolean;
}

interface SuggestedRating {
  criterion: string;
  score: number;
  maxScore: number;
  rationale: string;
  citations: DatasheetCitation[];
  confidence?: number;
}

const DatasheetAssistantPanel: React.FC<DatasheetAssistantPanelProps> = ({
  testComponentId,
  mockCriteria,
  datasheetParsed,
}) => {
  const [question, setQuestion] = useState("");
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>("");
  const [answer, setAnswer] = useState<DatasheetQueryAnswer | null>(null);
  const [qaHistory, setQaHistory] = useState<
    {
      question: string;
      answer: DatasheetQueryAnswer;
      criterionName?: string;
      timestamp: number;
    }[]
  >([]);
  const [suggestedRating, setSuggestedRating] =
    useState<SuggestedRating | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSeededQuestion, setHasSeededQuestion] = useState(false);

  // Load suggestions when datasheet is parsed
  useEffect(() => {
    if (datasheetParsed) {
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasheetParsed, testComponentId]);

  useEffect(() => {
    setQuestion("");
    setAnswer(null);
    setSuggestedRating(null);
    setError(null);
    setQaHistory([]);
    setHasSeededQuestion(false);
  }, [testComponentId]);

  useEffect(() => {
    if (!datasheetParsed) {
      setHasSeededQuestion(false);
    }
  }, [datasheetParsed]);

  useEffect(() => {
    if (datasheetParsed && suggestions.length > 0 && !hasSeededQuestion) {
      setQuestion((current) => current || suggestions[0]);
      setHasSeededQuestion(true);
    }
  }, [datasheetParsed, suggestions, hasSeededQuestion]);

  const loadSuggestions = async () => {
    try {
      const response = await fetch(
        getApiUrl(`/api/components/${testComponentId}/datasheet/suggestions`),
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error("Failed to load suggestions:", err);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setSuggestedRating(null);

    try {
      const response = await fetch(
        getApiUrl(`/api/components/${testComponentId}/datasheet/query`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            question,
            criterion_id: selectedCriterionId || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Query failed");
      }

      const data = await response.json();

      const normalizedAnswer: DatasheetQueryAnswer = {
        answer: data.answer,
        citations: data.citations.map((c: any) => ({
          pageNumber: c.page_number,
          snippet: c.snippet,
        })),
        confidence: data.confidence,
      };

      setAnswer(normalizedAnswer);
      setQaHistory((prev) => [
        {
          question: question.trim(),
          answer: normalizedAnswer,
          criterionName: selectedCriterionId
            ? mockCriteria.find((c) => c.id === selectedCriterionId)?.name
            : undefined,
          timestamp: Date.now(),
        },
        ...prev,
      ]);

      // Check if response includes suggested rating
      if (data.rating) {
        setSuggestedRating({
          criterion: data.rating.criterion,
          score: data.rating.score,
          maxScore: data.rating.max_score || 10,
          rationale: data.rating.rationale,
          citations:
            data.rating.citations?.map((c: any) => ({
              pageNumber: c.page_number,
              snippet: c.snippet,
            })) || [],
          confidence: data.rating.confidence,
        });
      }
    } catch (err: any) {
      console.error("Query error:", err);
      setError(err.message || "Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    setAnswer(null);
    setSuggestedRating(null);
  };

  const isAnswerNotFound =
    answer?.answer?.toLowerCase().includes("not found") || false;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
      {!datasheetParsed ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <svg
              className="mx-auto h-16 w-16 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-700">
              AI Datasheet Assistant
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Upload or auto-import a datasheet to unlock AI-powered questions,
              suggested prompts, and auto-generated scoring insights.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Input Section - Always visible at top */}
          <div className="flex-shrink-0 max-w-2xl mx-auto w-full">
            {/* Suggested Questions - Always show when available */}
            {suggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-600 font-medium mb-2">
                  Suggested Questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 6).map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-1.5 border border-indigo-300 text-xs rounded-full text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ask a Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    (e.metaKey || e.ctrlKey) &&
                    question.trim() &&
                    !loading
                  ) {
                    handleAskQuestion();
                  }
                }}
                placeholder="e.g., What is the input voltage range? (Press Cmd/Ctrl+Enter to submit)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
                disabled={loading}
              />
            </div>

            {/* Criterion Selector */}
            {mockCriteria.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Criterion (Optional)
                </label>
                <select
                  value={selectedCriterionId}
                  onChange={(e) => setSelectedCriterionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  disabled={loading}
                >
                  <option value="">
                    General question (no specific criterion)
                  </option>
                  {mockCriteria.map((criterion) => (
                    <option key={criterion.id} value={criterion.id}>
                      {criterion.name} ({criterion.unit})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Ask Button */}
            <button
              onClick={handleAskQuestion}
              disabled={!question.trim() || loading}
              className="w-full mb-4 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Analyzing Datasheet...
                </>
              ) : (
                <>
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
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
                  {answer ? "Ask Follow-up Question" : "Ask AI"}
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <svg
                    className="h-5 w-5 text-red-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Answer Display - Scrollable area below input */}
          {(answer || qaHistory.length > 0) && (
            <div className="flex-1 overflow-y-auto min-h-0 border-t border-gray-200 pt-4 mt-4 space-y-4 max-w-2xl mx-auto w-full">
              {qaHistory.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-800">
                      Recent Questions
                    </h4>
                    {qaHistory.length > 0 && (
                      <button
                        onClick={() => setQaHistory([])}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear History
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {qaHistory.map((entry, index) => (
                      <button
                        key={entry.timestamp}
                        onClick={() => {
                          setAnswer(entry.answer);
                          setQuestion(entry.question);
                          setSelectedCriterionId(
                            mockCriteria.find(
                              (c) => c.name === entry.criterionName
                            )?.id || ""
                          );
                        }}
                        className="w-full text-left text-xs bg-white border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-semibold text-gray-900">
                          {entry.question}
                        </div>
                        <div className="text-gray-500">
                          {entry.answer.answer.slice(0, 80)}
                          {entry.answer.answer.length > 80 ? "…" : ""}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase mt-1">
                          {formatDisplayTime(entry.timestamp)}
                          {entry.criterionName
                            ? ` • ${entry.criterionName}`
                            : ""}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {answer && (
                <>
                  <div
                    className={`p-4 rounded-lg border-2 mb-4 ${
                      isAnswerNotFound
                        ? "bg-yellow-50 border-yellow-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                        <svg
                          className="h-5 w-5 mr-2 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Answer
                      </h4>
                      <button
                        onClick={() => {
                          setAnswer(null);
                          setSuggestedRating(null);
                          setError(null);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                        title="Clear answer"
                      >
                        ✕
                      </button>
                    </div>
                    <FormattedMarkdown
                      content={answer.answer}
                      className={
                        isAnswerNotFound ? "text-yellow-900" : "text-gray-700"
                      }
                    />

                    {answer.confidence !== undefined &&
                      answer.confidence !== null && (
                        <div className="mt-3 flex items-center">
                          <span className="text-xs text-gray-500 mr-2">
                            Confidence:
                          </span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                            <div
                              className={`h-full ${
                                answer.confidence > 0.7
                                  ? "bg-green-500"
                                  : answer.confidence > 0.4
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${answer.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 ml-2 font-medium">
                            {Math.round(answer.confidence * 100)}%
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Citations */}
                  {answer?.citations && answer.citations.length > 0 && (
                    <DatasheetCitationsList citations={answer.citations} />
                  )}

                  {/* Suggested Rating */}
                  {suggestedRating && (
                    <DatasheetSuggestedRatingCard rating={suggestedRating} />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatasheetAssistantPanel;
