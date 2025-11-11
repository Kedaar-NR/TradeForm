import React from "react";

const Documentation: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Documentation</h1>
        <p className="text-gray-600">
          Complete guide to using TradeForm for component trade studies
        </p>
      </div>

      {/* Getting Started */}
      <section className="card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Getting Started
        </h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              1. Create a New Trade Study
            </h3>
            <p>
              Start by clicking "New Trade Study" on the dashboard. You'll be
              asked to provide:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Project name</li>
              <li>Component type (e.g., "RF Amplifier", "Power Supply")</li>
              <li>Optional description</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              2. Define Evaluation Criteria
            </h3>
            <p>
              Specify what matters when evaluating components. For each
              criterion:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>
                <strong>Name:</strong> What you're measuring (e.g., "Cost",
                "Gain", "Power Consumption")
              </li>
              <li>
                <strong>Weight:</strong> Importance on a 1-10 scale (higher =
                more important)
              </li>
              <li>
                <strong>Unit:</strong> Measurement unit (e.g., "USD", "dB",
                "Watts")
              </li>
              <li>
                <strong>Higher is Better:</strong> Check if larger values are
                preferred
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              3. Add Components
            </h3>
            <p>You can add components in two ways:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>
                <strong>AI Discovery:</strong> Click "Discover Components" to
                automatically find relevant components using AI
              </li>
              <li>
                <strong>Manual Entry:</strong> Click "Add Component" and fill
                in manufacturer, part number, description, and optional datasheet
                URL
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              4. Review Results
            </h3>
            <p>
              Once components are added, view the ranked results based on your
              criteria weights. The system calculates weighted scores to help
              you make informed decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🤖 AI Component Discovery
            </h3>
            <p className="text-gray-700">
              Automatically discover relevant components from manufacturer
              databases and distributor catalogs using AI-powered search.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ⚡ Auto-Save
            </h3>
            <p className="text-gray-700">
              All your edits are automatically saved. Never lose your progress
              when navigating between pages.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📊 Weighted Scoring
            </h3>
            <p className="text-gray-700">
              Define custom criteria with weights to prioritize what matters
              most in your evaluation.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📄 Datasheet Links
            </h3>
            <p className="text-gray-700">
              Attach datasheet URLs to components for quick reference during
              evaluation.
            </p>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Best Practices
        </h2>
        <div className="space-y-3 text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Criteria Weighting
            </h3>
            <p>
              Use higher weights (8-10) for critical requirements, medium weights
              (5-7) for important factors, and lower weights (1-4) for nice-to-have
              features.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Component Selection
            </h3>
            <p>
              Start with AI discovery to find a broad set of options, then add
              specific components manually that you're already considering.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Review Process
            </h3>
            <p>
              Review the ranked results, but also consider factors not captured
              in the criteria (e.g., vendor relationships, lead times, support).
            </p>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Tips & Tricks
        </h2>
        <div className="space-y-3 text-gray-700">
          <div>
            <p>
              <strong>Mark as Done:</strong> Click "✓ Mark as Done" on any study
              to mark it as completed. Completed studies are highlighted in
              green on the dashboard.
            </p>
          </div>
          <div>
            <p>
              <strong>Edit Components:</strong> Click the edit icon on any
              component to modify its details. Changes auto-save after 1.5
              seconds.
            </p>
          </div>
          <div>
            <p>
              <strong>Filter Studies:</strong> Use the search bar and status
              filter on the dashboard to quickly find specific studies.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Documentation;


