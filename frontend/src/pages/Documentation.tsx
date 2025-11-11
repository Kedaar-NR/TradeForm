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

      {/* What is TradeForm */}
      <section className="card p-8 bg-gradient-to-r from-gray-50 to-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          What is TradeForm?
        </h2>
        <div className="space-y-4 text-gray-700">
          <p className="text-lg">
            TradeForm is an AI-powered platform that automates the component trade study process for engineering teams.
            A trade study is a systematic evaluation methodology used to select the best component from multiple options
            by scoring each against weighted criteria.
          </p>
          <p>
            Traditional trade studies are time-consuming and prone to human error. TradeForm streamlines this process by:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-2 ml-4">
            <li><strong>AI Discovery:</strong> Automatically finding relevant components from manufacturer databases</li>
            <li><strong>Intelligent Scoring:</strong> Using AI to evaluate components against your criteria</li>
            <li><strong>Automated Reports:</strong> Generating comprehensive Excel reports with detailed analysis</li>
            <li><strong>Version Control:</strong> Tracking changes and maintaining history of your evaluations</li>
          </ul>
        </div>
      </section>

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
              Start by clicking "Start New Study" on the dashboard or sidebar. You'll be
              asked to provide:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong>Project name:</strong> A descriptive name for your trade study</li>
              <li><strong>Component type:</strong> The category of component you're evaluating (e.g., "GPS Antenna", "Microprocessor", "Sensor")</li>
              <li><strong>Description (optional):</strong> Additional context about your evaluation</li>
            </ul>
            <p className="mt-2 text-sm bg-blue-50 p-3 rounded border border-blue-200">
              <strong>Tip:</strong> Use the "AI Optimize" button to have AI suggest the component type and description based on your project name!
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              2. Define Evaluation Criteria
            </h3>
            <p>
              Specify what matters when evaluating components. For each criterion you define:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-2 ml-4">
              <li>
                <strong>Name:</strong> What you're measuring (e.g., "Cost", "Gain", "Power Consumption", "Operating Temperature Range")
              </li>
              <li>
                <strong>Description:</strong> Explain what this criterion evaluates and why it matters
              </li>
              <li>
                <strong>Weight (1-10):</strong> Importance level where 10 is most critical and 1 is least important.
                Weights are used to calculate the final weighted score for each component.
              </li>
              <li>
                <strong>Unit:</strong> Measurement unit (e.g., "USD", "dB", "Watts", "°C")
              </li>
              <li>
                <strong>Higher is Better:</strong> Check if larger values are preferred (e.g., checked for "Gain", unchecked for "Cost")
              </li>
              <li>
                <strong>Min/Max Requirements (Optional):</strong> Set hard requirements that components must meet
              </li>
            </ul>
            <p className="mt-2 text-sm bg-blue-50 p-3 rounded border border-blue-200">
              <strong>Tip:</strong> You can import criteria from Excel or use "AI Optimize Criteria" to automatically generate
              relevant criteria based on your component type!
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              3. Add Components
            </h3>
            <p>You can add components in multiple ways:</p>
            <ul className="list-disc list-inside mt-2 space-y-2 ml-4">
              <li>
                <strong>AI Discovery:</strong> Click "Discover Components" to automatically find relevant components
                using AI. The system will analyze your project requirements and search manufacturer databases.
              </li>
              <li>
                <strong>Manual Entry:</strong> Click "Add Component" and fill in:
                <ul className="list-circle list-inside ml-6 mt-1">
                  <li>Manufacturer name</li>
                  <li>Part number</li>
                  <li>Description (optional)</li>
                  <li>Datasheet URL or upload file (optional)</li>
                  <li>Availability status</li>
                </ul>
              </li>
              <li>
                <strong>Excel Import:</strong> Use "Import from Excel" to bulk upload components from a spreadsheet
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              4. AI Scoring
            </h3>
            <p>
              Once you have criteria and components defined, use the "Score All Components" button to automatically
              evaluate each component against each criterion using AI. The AI will:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Analyze component specifications and datasheets</li>
              <li>Assign numerical scores for each criterion</li>
              <li>Provide rationale explaining each score</li>
              <li>Calculate weighted total scores based on your criteria weights</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              5. Review Results & Export
            </h3>
            <p>
              View the ranked results based on your criteria weights. The Results page shows:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Component rankings with total weighted scores</li>
              <li>Detailed scoring breakdown for each criterion</li>
              <li>AI rationale for each score</li>
              <li>Winner recommendation with explanation</li>
            </ul>
            <p className="mt-2">
              Export your complete trade study to Excel with multiple sheets including summary, criteria,
              components, detailed scores, rankings, and score matrix.
            </p>
          </div>
        </div>
      </section>

      {/* Excel Import/Export */}
      <section className="card p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Excel Import/Export
        </h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Importing Data
            </h3>
            <p>TradeForm supports Excel imports for both criteria and components:</p>
            <ul className="list-disc list-inside mt-2 space-y-2 ml-4">
              <li>
                <strong>Criteria Import:</strong> Upload an Excel file with columns: Name, Description, Weight, Unit,
                Higher is Better, Minimum Requirement, Maximum Requirement
              </li>
              <li>
                <strong>Components Import:</strong> Upload an Excel file with columns: Manufacturer, Part Number,
                Description, Datasheet URL, Availability
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Exporting Reports
            </h3>
            <p>Generate comprehensive Excel reports with multiple sheets:</p>
            <ul className="list-disc list-inside mt-2 space-y-2 ml-4">
              <li><strong>Summary Sheet:</strong> Overview of the trade study with metadata</li>
              <li><strong>Criteria Sheet:</strong> All evaluation criteria with weights and requirements</li>
              <li><strong>Components Sheet:</strong> Complete list of components with details</li>
              <li><strong>Detailed Scores:</strong> Full scoring matrix with AI rationale</li>
              <li><strong>Rankings Sheet:</strong> Components ranked by total weighted score</li>
              <li><strong>Score Matrix:</strong> Visual matrix of all scores for easy comparison</li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI Assistant */}
      <section className="card p-8 bg-gradient-to-r from-purple-50 to-pink-50">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          AI Assistant (Search / AI Ask)
        </h2>
        <div className="space-y-4 text-gray-700">
          <p className="text-lg">
            The AI Assistant is available in the search bar at the top of every page. Simply type your question
            and press Enter to get instant answers about TradeForm features and trade study methodology.
          </p>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What You Can Ask:</h3>
            <ul className="list-disc list-inside mt-2 space-y-2 ml-4">
              <li>How to use specific TradeForm features</li>
              <li>Trade study best practices and methodology</li>
              <li>Help with criteria definition and weighting</li>
              <li>Guidance on component evaluation</li>
              <li>Excel import/export instructions</li>
              <li>Technical questions about the platform</li>
            </ul>
          </div>
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <p className="text-sm">
              <strong>Note:</strong> The AI Assistant is specifically trained to help with TradeForm and trade studies.
              It will politely decline requests about unrelated topics to ensure you get accurate, relevant information.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI Component Discovery
            </h3>
            <p className="text-gray-700">
              Automatically discover relevant components from manufacturer
              databases and distributor catalogs using AI-powered search. Save hours of manual research.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Intelligent AI Scoring
            </h3>
            <p className="text-gray-700">
              Let AI evaluate each component against your criteria by analyzing datasheets and specifications.
              Get detailed rationale for every score.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Weighted Scoring System
            </h3>
            <p className="text-gray-700">
              Define custom criteria with weights (1-10 scale) to prioritize what matters
              most in your evaluation. Final scores are automatically calculated.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Excel Integration
            </h3>
            <p className="text-gray-700">
              Import and export data via Excel. Generate comprehensive multi-sheet reports
              perfect for sharing with stakeholders and documentation.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Template Library
            </h3>
            <p className="text-gray-700">
              Start quickly with pre-built templates for common component types.
              Templates include suggested criteria and evaluation frameworks.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Datasheet Management
            </h3>
            <p className="text-gray-700">
              Attach datasheet URLs or upload files for each component for quick reference during
              evaluation. AI can analyze uploaded datasheets for scoring.
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


