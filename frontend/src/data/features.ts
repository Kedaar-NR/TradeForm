export type Feature = {
  id: string;
  title: string;
  icon: string; // emoji for now
  description: string;
  bullets: string[];
  category?: string;
  priority: number;
};

export const FEATURES: Feature[] = [
  {
    id: "automated-scoring",
    title: "Automated Scoring",
    icon: "⚙️",
    description: "Score and rank components against weighted criteria with instant updates",
    bullets: [
      "Score and rank components against weighted criteria",
      "Adjust weights in real-time, see instant ranking updates",
      "Multi-dimensional evaluation across performance, cost, reliability",
      "Objective, data-backed decision support",
    ],
    category: "Evaluation",
    priority: 1,
  },
  {
    id: "fast-results",
    title: "Fast Results",
    icon: "⚡",
    description: "Complete trade studies in minutes with AI-assisted automation",
    bullets: [
      "Complete trade studies in minutes instead of weeks",
      "Parallel AI-assisted component discovery",
      "Automated technical specification gathering",
      "Simultaneous scoring across all alternatives",
    ],
    category: "Automation",
    priority: 2,
  },
  {
    id: "reports-exports",
    title: "Reports & Exports",
    icon: "📊",
    description: "Generate presentation-ready reports with professional visualizations",
    bullets: [
      "Presentation-ready reports with professional charts",
      "Sensitivity analysis and trade-off visualizations",
      "CSV/Excel export for further processing",
      "Tornado diagrams, spider charts, comparison matrices",
    ],
    category: "Reporting",
    priority: 3,
  },
  {
    id: "custom-criteria",
    title: "Custom Criteria",
    icon: "🧮",
    description: "Define bespoke criteria tailored to your specific decisions",
    bullets: [
      "Define bespoke criteria tailored to your decisions",
      "Templates for common trade study types",
      "Custom scoring rubrics and thresholds",
      "Support for quantitative and qualitative assessments",
    ],
    category: "Customization",
    priority: 4,
  },
  {
    id: "version-history",
    title: "Version History",
    icon: "🕒",
    description: "Track every design iteration and decision point with complete history",
    bullets: [
      "Track every design iteration and decision point",
      "Compare alternatives side-by-side with visual diffs",
      "Roll back to previous versions or explore branches",
      "Essential for design reviews and compliance audits",
    ],
    category: "Collaboration",
    priority: 5,
  },
  {
    id: "team-collaboration",
    title: "Team Collaboration",
    icon: "👥",
    description: "Share studies and collaborate with team members in real-time",
    bullets: [
      "Share studies with team members and stakeholders",
      "Comment inline on specific criteria or components",
      "Capture decision rationale and approval trails",
      "Track who changed what and when",
    ],
    category: "Collaboration",
    priority: 6,
  },
];
