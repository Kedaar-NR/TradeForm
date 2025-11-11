import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Help: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const faqCategories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: "🚀",
      questions: [
        {
          q: "How do I create my first trade study?",
          a: "Click 'New Trade Study' on the dashboard, fill in the project details (name, component type, description), then follow the steps to define criteria and add components.",
        },
        {
          q: "What information do I need to start?",
          a: "You'll need to know what type of components you're evaluating and what criteria matter most (e.g., cost, performance, size). The AI can help discover components once you provide the component type.",
        },
        {
          q: "Can I edit a study after creating it?",
          a: "Yes! All changes are auto-saved. You can edit components, criteria, and project details at any time. Click on any study from the dashboard to edit it.",
        },
      ],
    },
    {
      id: "criteria",
      title: "Defining Criteria",
      icon: "📊",
      questions: [
        {
          q: "How do I set criterion weights?",
          a: "Weights range from 1-10, where 10 is most important. Use higher weights for critical requirements and lower weights for nice-to-have features. The total weight helps you see the relative importance distribution.",
        },
        {
          q: "What does 'Higher is Better' mean?",
          a: "Check this box when larger values are preferred (e.g., gain, efficiency). Uncheck it when smaller values are better (e.g., cost, power consumption, size).",
        },
        {
          q: "Can I add custom criteria?",
          a: "Yes! Select 'Other' from the criterion name dropdown, then type your custom criterion name.",
        },
      ],
    },
    {
      id: "components",
      title: "Adding Components",
      icon: "🔧",
      questions: [
        {
          q: "How does AI component discovery work?",
          a: "Click 'Discover Components' and the AI will analyze your project details and criteria to find 5-10 relevant components from manufacturer databases. It provides manufacturer, part number, description, and datasheet URLs when available.",
        },
        {
          q: "Can I add components manually?",
          a: "Yes! Click 'Add Component' and fill in the manufacturer, part number, description, and optional datasheet URL. This is useful for components you're already considering.",
        },
        {
          q: "How do I edit or delete components?",
          a: "On the project details page, click the edit icon to modify a component (changes auto-save) or the delete icon to remove it.",
        },
        {
          q: "What if a component doesn't have a datasheet URL?",
          a: "Datasheet URLs are optional. You can add them later by editing the component, or leave them blank if not available.",
        },
      ],
    },
    {
      id: "results",
      title: "Results & Scoring",
      icon: "📈",
      questions: [
        {
          q: "How are components ranked?",
          a: "Components are ranked by weighted scores based on your criteria. Each criterion contributes to the total score based on its weight and the component's performance for that criterion.",
        },
        {
          q: "Can I manually adjust scores?",
          a: "Yes, you can edit component details and the system will recalculate. For more advanced scoring, you can manually adjust values in the scoring section.",
        },
        {
          q: "What if I disagree with the ranking?",
          a: "The ranking is a starting point. Consider factors beyond the criteria (vendor support, availability, lead times) when making your final decision.",
        },
      ],
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: "🔧",
      questions: [
        {
          q: "My changes aren't saving",
          a: "Changes auto-save after 1.5 seconds of inactivity. If you're having issues, check your internet connection and ensure the backend is running. Try refreshing the page.",
        },
        {
          q: "AI discovery isn't working",
          a: "Make sure you have a valid project with component type defined. The AI needs context to find relevant components. If it fails, try adding components manually.",
        },
        {
          q: "I can't delete a study",
          a: "Click the delete button (trash icon) on the study card in the dashboard. You'll be asked to confirm before deletion.",
        },
        {
          q: "How do I mark a study as completed?",
          a: "Open the study details page and click '✓ Mark as Done' in the bottom right. Completed studies are highlighted in green on the dashboard.",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-600">
          Find answers to common questions and get support
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate("/documentation")}
          className="card p-6 hover:border-gray-400 cursor-pointer text-left"
        >
          <h3 className="font-semibold text-gray-900 mb-1">📚 Documentation</h3>
          <p className="text-sm text-gray-600">
            Complete guide and best practices
          </p>
        </button>
        <button
          onClick={() => navigate("/templates")}
          className="card p-6 hover:border-gray-400 cursor-pointer text-left"
        >
          <h3 className="font-semibold text-gray-900 mb-1">📋 Templates</h3>
          <p className="text-sm text-gray-600">
            Start from pre-configured templates
          </p>
        </button>
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">💬 Contact Support</h3>
          <p className="text-sm text-gray-600">
            support@tradeform.com
          </p>
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-6">
        {faqCategories.map((category) => (
          <div key={category.id} className="card p-6">
            <button
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )
              }
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  {category.title}
                </h2>
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  selectedCategory === category.id ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {selectedCategory === category.id && (
              <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
                {category.questions.map((faq, idx) => (
                  <div key={idx} className="space-y-2">
                    <h3 className="font-semibold text-gray-900">{faq.q}</h3>
                    <p className="text-gray-700 text-sm">{faq.a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Help;


