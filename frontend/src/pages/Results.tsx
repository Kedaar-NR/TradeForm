import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface ComponentScore {
  id: string;
  manufacturer: string;
  partNumber: string;
  criteria: Record<string, { score: number; rationale: string }>;
  totalScore: number;
}

const Results: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { projectId } = useParams<{ projectId: string }>();

  const handleExport = () => {
    // Create CSV content
    const headers = ['Rank', 'Manufacturer', 'Part Number', ...Object.keys(components[0].criteria), 'Total Score'];
    const rows = sortedComponents.map((comp, idx) => [
      idx + 1,
      comp.manufacturer,
      comp.partNumber,
      ...Object.values(comp.criteria).map(c => c.score),
      comp.totalScore.toFixed(1)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-study-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Demo data
  const [components] = useState<ComponentScore[]>([
    {
      id: '1',
      manufacturer: 'Taoglas',
      partNumber: 'FXP611',
      criteria: {
        'Gain': { score: 7, rationale: 'Gain of 5 dBi exceeds requirement' },
        'Cost': { score: 8, rationale: 'Price of $15 is competitive' },
        'Size': { score: 9, rationale: 'Compact 25mm form factor' },
      },
      totalScore: 7.8,
    },
    {
      id: '2',
      manufacturer: 'Abracon',
      partNumber: 'APAMP60',
      criteria: {
        'Gain': { score: 9, rationale: 'Exceptional gain of 8 dBi' },
        'Cost': { score: 6, rationale: 'Higher price at $22' },
        'Size': { score: 7, rationale: 'Standard 30mm size' },
      },
      totalScore: 7.4,
    },
    {
      id: '3',
      manufacturer: 'Molex',
      partNumber: '146255',
      criteria: {
        'Gain': { score: 6, rationale: 'Meets requirement at 4 dBi' },
        'Cost': { score: 10, rationale: 'Best price at $12' },
        'Size': { score: 8, rationale: 'Good 28mm size' },
      },
      totalScore: 7.9,
    },
  ]);

  const [viewMode, setViewMode] = useState<'table' | 'heatmap'>('table');
  const [selectedComponent, setSelectedComponent] = useState<ComponentScore | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-emerald-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 8) return 'bg-emerald-100 text-emerald-700';
    if (score >= 6) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const sortedComponents = [...components].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Trade Study Results
            </h1>
            <p className="text-gray-600">
              AI-scored components ranked by weighted criteria
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Heatmap
            </button>
            <button onClick={handleExport} className="btn-primary">
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Winner Card */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-emerald-700 mb-1">RECOMMENDED</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {sortedComponents[0].manufacturer} {sortedComponents[0].partNumber}
            </h3>
            <p className="text-sm text-gray-600">
              Weighted Score: <span className="font-semibold text-emerald-700">{sortedComponents[0].totalScore.toFixed(1)}/10</span>
            </p>
          </div>
          <button
            onClick={() => setSelectedComponent(sortedComponents[0])}
            className="btn-secondary whitespace-nowrap"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Results Table */}
      {viewMode === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700 text-sm">Rank</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700 text-sm">Component</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-700 text-sm">Gain</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-700 text-sm">Cost</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-700 text-sm">Size</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-700 text-sm">Score</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-700 text-sm"></th>
                </tr>
              </thead>
              <tbody>
                {sortedComponents.map((component, index) => (
                  <tr
                    key={component.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold text-sm text-gray-500">#{index + 1}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900 text-sm">{component.manufacturer}</div>
                      <div className="text-xs text-gray-600">{component.partNumber}</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getScoreColorClass(component.criteria['Gain'].score)}`}>
                        {component.criteria['Gain'].score}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getScoreColorClass(component.criteria['Cost'].score)}`}>
                        {component.criteria['Cost'].score}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getScoreColorClass(component.criteria['Size'].score)}`}>
                        {component.criteria['Size'].score}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold text-emerald-700">
                        {component.totalScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setSelectedComponent(component)}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Heatmap View */}
      {viewMode === 'heatmap' && (
        <div className="space-y-4">
          {sortedComponents.map((component, index) => (
            <div key={component.id} className="card p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-5 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {component.manufacturer} {component.partNumber}
                    </h3>
                  </div>
                </div>
                <div className="text-xl font-bold text-emerald-700">
                  {component.totalScore.toFixed(1)}/10
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {Object.entries(component.criteria).map(([criterion, data]) => (
                  <div key={criterion} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-700">{criterion}</span>
                      <span className="font-medium text-gray-600">{data.score}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getScoreColor(data.score)} transition-all`}
                        style={{ width: `${data.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600">{data.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedComponent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedComponent(null)}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 animate-slide-up shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedComponent.manufacturer} {selectedComponent.partNumber}
            </h2>
            <div className="space-y-5">
              {Object.entries(selectedComponent.criteria).map(([criterion, data]) => (
                <div key={criterion} className="border-b border-gray-200 pb-5 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">{criterion}</h3>
                    <span className={`px-3 py-1 rounded-md text-xs font-medium ${getScoreColorClass(data.score)}`}>
                      {data.score}/10
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{data.rationale}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedComponent(null)}
              className="mt-6 w-full btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
