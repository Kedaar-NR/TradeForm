import React from 'react';
import type { DatasheetCitation } from '../types';
import DatasheetCitationsList from './DatasheetCitationsList';

interface SuggestedRating {
  criterion: string;
  score: number;
  maxScore: number;
  rationale: string;
  citations: DatasheetCitation[];
  confidence?: number;
}

interface DatasheetSuggestedRatingCardProps {
  rating: SuggestedRating | null;
}

const DatasheetSuggestedRatingCard: React.FC<DatasheetSuggestedRatingCardProps> = ({ rating }) => {
  if (!rating) {
    return null;
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentage >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreFillColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const scorePercentage = (rating.score / rating.maxScore) * 100;

  return (
    <div className="mt-6 border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h4 className="text-lg font-semibold text-gray-900">
            Suggested Rating
          </h4>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          AI Generated
        </span>
      </div>

      {/* Criterion Name */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 font-medium">Criterion</p>
        <p className="text-base font-semibold text-gray-900 mt-1">{rating.criterion}</p>
      </div>

      {/* Score Display */}
      <div className={`mb-4 p-4 rounded-lg border-2 ${getScoreColor(rating.score, rating.maxScore)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Score</span>
          <span className="text-2xl font-bold">
            {rating.score.toFixed(1)} / {rating.maxScore}
          </span>
        </div>

        {/* Score Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getScoreFillColor(rating.score, rating.maxScore)}`}
            style={{ width: `${scorePercentage}%` }}
          ></div>
        </div>

        <p className="text-xs mt-2 text-right font-medium">
          {scorePercentage.toFixed(0)}% of maximum
        </p>
      </div>

      {/* Confidence Score */}
      {rating.confidence !== undefined && rating.confidence !== null && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 font-medium">AI Confidence</span>
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(rating.confidence * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                rating.confidence > 0.7
                  ? 'bg-green-500'
                  : rating.confidence > 0.4
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${rating.confidence * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Rationale */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 font-medium mb-2">Reasoning</p>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {rating.rationale}
          </p>
        </div>
      </div>

      {/* Citations */}
      {rating.citations && rating.citations.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <DatasheetCitationsList citations={rating.citations} />
        </div>
      )}

      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-blue-700">
            <span className="font-medium">Note:</span> This rating is AI-suggested based on datasheet analysis. Engineers should review the citations and rationale before using in trade studies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatasheetSuggestedRatingCard;

