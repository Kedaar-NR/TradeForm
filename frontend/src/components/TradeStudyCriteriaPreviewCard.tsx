
export interface MockCriterion {
  id: string;
  name: string;
  weight: number;
  unit: string;
  higherIsBetter: boolean;
}

// Mock criteria based on LM5145 and TL07xx datasheets
export const MOCK_CRITERIA: MockCriterion[] = [
  {
    id: 'mock-criterion-1',
    name: 'Gain at nominal input',
    weight: 0.3,
    unit: 'dB',
    higherIsBetter: true,
  },
  {
    id: 'mock-criterion-2',
    name: 'Output voltage accuracy',
    weight: 0.2,
    unit: '%',
    higherIsBetter: true,
  },
  {
    id: 'mock-criterion-3',
    name: 'Thermal performance',
    weight: 0.25,
    unit: '°C rise',
    higherIsBetter: false,
  },
  {
    id: 'mock-criterion-4',
    name: 'Power consumption',
    weight: 0.25,
    unit: 'W',
    higherIsBetter: false,
  },
];

const TradeStudyCriteriaPreviewCard = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Mock Trade Study Criteria
        </h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Test Data
        </span>
      </div>

      <p className="text-xs text-gray-600 mb-4">
        These criteria are used for testing suggested ratings. Based on typical voltage regulator and op-amp specifications.
      </p>

      <div className="space-y-3">
        {MOCK_CRITERIA.map((criterion) => (
          <div
            key={criterion.id}
            className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {criterion.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Unit: {criterion.unit} • {criterion.higherIsBetter ? 'Higher is better' : 'Lower is better'}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-1">Weight:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                    {(criterion.weight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Visual weight bar */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all"
                style={{ width: `${criterion.weight * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-xs text-blue-700">
              <span className="font-medium">Testing Note:</span> These mock criteria align with specifications commonly found in datasheets like LM5145 (voltage mode controller) and TL07xx (op-amp) series.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeStudyCriteriaPreviewCard;

