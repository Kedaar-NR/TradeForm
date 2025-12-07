export type FeatureHighlight = {
  title: string;
  description: string;
};

export type Feature = {
  id: string;
  title: string;
  icon: string;
  description: string;
  tagline?: string;
  bullets: string[];
  highlights?: FeatureHighlight[];
  stats?: { value: string; label: string }[];
  category?: string;
  priority: number;
  layout?: "hero" | "split" | "stacked" | "grid";
  videoSrc?: string;
  videoPosition?: "left" | "right" | "background";
};

export const FEATURES: Feature[] = [
  {
    id: "automated-scoring",
    title: "Automated Scoring",
    icon: "⚙️",
    tagline: "Data-driven decisions at the speed of thought",
    description:
      "Score and rank components against weighted criteria with instant updates. Our intelligent scoring engine evaluates alternatives across multiple dimensions simultaneously, giving you objective insights in real-time.",
    bullets: [
      "Score and rank components against weighted criteria automatically",
      "Adjust weights in real-time and see instant ranking updates across all alternatives",
      "Multi-dimensional evaluation across performance, cost, reliability, and custom metrics",
      "Objective, data-backed decision support that eliminates subjective bias",
      "Automated normalization and scaling for fair comparisons",
      "Configure scoring algorithms to match your decision-making methodology",
      "Visual ranking indicators show relative performance at a glance",
      "Export scoring rationale for stakeholder review and audit trails",
    ],
    highlights: [
      {
        title: "Real-Time Rankings",
        description:
          "Watch alternatives re-rank automatically as you adjust criteria weights. No manual recalculation needed.",
      },
      {
        title: "Multi-Criteria Analysis",
        description:
          "Evaluate up to 50+ criteria simultaneously with weighted importance scoring.",
      },
      {
        title: "Smart Normalization",
        description:
          "Automatically normalize different units and scales for fair apple-to-apple comparisons.",
      },
    ],
    stats: [
      { value: "80%", label: "Faster Decision Making" },
      { value: "50+", label: "Criteria Supported" },
      { value: "100%", label: "Objective Scoring" },
    ],
    category: "Evaluation",
    priority: 1,
    layout: "hero",
    videoSrc: "/videos/31772-388253161_small.mp4",
  },
  {
    id: "fast-results",
    title: "Fast Results",
    icon: "⚡",
    tagline: "From requirements to recommendations in minutes, not weeks",
    description:
      "Complete comprehensive trade studies in minutes instead of weeks with AI-assisted automation. Our parallel processing engine discovers components, gathers specifications, and scores alternatives simultaneously.",
    bullets: [
      "Complete trade studies in minutes instead of weeks of manual research",
      "Parallel AI-assisted component discovery across multiple databases",
      "Automated technical specification gathering from datasheets and catalogs",
      "Simultaneous scoring across all alternatives as data arrives",
      "Intelligent caching reduces redundant lookups and speeds up iterations",
      "Batch processing for evaluating dozens of alternatives at once",
      "Background processing keeps you productive while analysis runs",
      "Progressive results display shows findings as they're discovered",
      "Export intermediate results for early stakeholder feedback",
      "Resume interrupted studies without losing progress",
    ],
    highlights: [
      {
        title: "AI-Powered Discovery",
        description:
          "Our AI scans thousands of components to find exact matches for your requirements.",
      },
      {
        title: "Parallel Processing",
        description:
          "Evaluate multiple alternatives simultaneously with distributed processing.",
      },
      {
        title: "Progressive Updates",
        description:
          "See results as they arrive—no waiting for the entire analysis to complete.",
      },
    ],
    stats: [
      { value: "10x", label: "Faster Than Manual" },
      { value: "1000+", label: "Components/Hour" },
      { value: "24/7", label: "Always Available" },
    ],
    category: "Automation",
    priority: 2,
    layout: "split",
    videoSrc: "/videos/854255-hd_1920_1080_30fps.mp4",
    videoPosition: "right",
  },
  {
    id: "reports-exports",
    title: "Reports & Exports",
    icon: "📊",
    tagline: "Presentation-ready insights that tell your story",
    description:
      "Generate presentation-ready reports with professional visualizations in seconds. From executive summaries to detailed technical appendices, our reporting engine creates documents that communicate your findings clearly and persuasively.",
    bullets: [
      "Presentation-ready reports with professional charts and graphics",
      "Sensitivity analysis shows how changes in criteria weights affect rankings",
      "Trade-off visualizations reveal the relationships between competing objectives",
      "CSV/Excel export for further processing in your existing workflows",
      "Tornado diagrams identify which criteria have the most impact on decisions",
      "Spider charts compare alternatives across multiple dimensions visually",
      "Comparison matrices provide detailed side-by-side specifications",
      "Customizable report templates match your organization's branding",
      "One-click export to PDF, PowerPoint, Word, and Excel formats",
      "Automated executive summaries highlight key findings and recommendations",
    ],
    highlights: [
      {
        title: "Rich Visualizations",
        description:
          "Beautiful charts that make complex trade-offs easy to understand for any audience.",
      },
      {
        title: "Sensitivity Analysis",
        description:
          "Understand how robust your decision is by testing different weight scenarios.",
      },
      {
        title: "Multi-Format Export",
        description:
          "Share findings in whatever format your stakeholders prefer—PDF, Excel, PowerPoint, or Word.",
      },
    ],
    stats: [
      { value: "10+", label: "Chart Types" },
      { value: "5", label: "Export Formats" },
      { value: "<30s", label: "Report Generation" },
    ],
    category: "Reporting",
    priority: 3,
    layout: "grid",
    videoSrc: "/videos/1046-142621379.mp4",
  },
  {
    id: "custom-criteria",
    title: "Custom Criteria",
    icon: "🧮",
    tagline: "Your decisions, your rules, your criteria",
    description:
      "Define bespoke criteria tailored to your specific decisions. Whether you're evaluating spacecraft components or software vendors, create custom scoring rubrics that reflect what truly matters to your project.",
    bullets: [
      "Define unlimited custom criteria tailored to your specific decision context",
      "Pre-built templates for common trade study types (aerospace, hardware, software, vendors)",
      "Custom scoring rubrics with configurable scales and thresholds",
      "Support for both quantitative metrics and qualitative assessments",
      "Hierarchical criteria structures for complex decision frameworks",
      "Criteria libraries let you reuse definitions across multiple studies",
      "Conditional criteria that apply only when certain conditions are met",
      "Rich text descriptions and guidance for consistent scoring",
      "Validation rules ensure data quality and completeness",
    ],
    highlights: [
      {
        title: "Flexible Frameworks",
        description:
          "Build criteria frameworks as simple or complex as your decision requires.",
      },
      {
        title: "Template Library",
        description:
          "Start with proven templates and customize them to your needs.",
      },
      {
        title: "Reusable Definitions",
        description:
          "Build your organization's criteria library and maintain consistency across projects.",
      },
    ],
    category: "Customization",
    priority: 4,
    layout: "stacked",
    videoSrc: "/videos/854261-hd_1920_1080_30fps.mp4",
    videoPosition: "left",
  },
  {
    id: "version-history",
    title: "Version History",
    icon: "🕒",
    tagline: "Every decision, every iteration, fully documented",
    description:
      "Track every design iteration and decision point with complete history. Never lose track of why you made a choice or what alternatives you considered. Essential for design reviews, compliance audits, and institutional knowledge preservation.",
    bullets: [
      "Track every design iteration and decision point with automatic versioning",
      "Compare alternatives side-by-side with visual diffs showing what changed",
      "Roll back to previous versions or explore alternative decision branches",
      "Essential audit trail for design reviews and compliance documentation",
      "Annotate versions with decision rationale and supporting documentation",
      "Branch and merge capability for exploring 'what-if' scenarios",
      "Timeline view shows the evolution of your study over time",
      "Restore deleted alternatives or criteria if you change your mind",
      "Export complete history for regulatory submissions",
    ],
    highlights: [
      {
        title: "Complete Audit Trail",
        description:
          "Every change is timestamped and attributed—perfect for compliance requirements.",
      },
      {
        title: "Visual Diffs",
        description:
          "Instantly see what changed between versions with side-by-side comparisons.",
      },
      {
        title: "Branch & Merge",
        description:
          "Explore alternative scenarios without affecting your main study.",
      },
    ],
    category: "Collaboration",
    priority: 5,
    layout: "split",
    videoSrc: "/videos/14856367_3840_2160_30fps.mp4",
    videoPosition: "left",
  },
  {
    id: "team-collaboration",
    title: "Team Collaboration",
    icon: "👥",
    tagline: "Better decisions through collective intelligence",
    description:
      "Share studies with team members and stakeholders for real-time collaboration. Capture institutional knowledge, build consensus, and make better decisions together with inline comments, approval workflows, and activity tracking.",
    bullets: [
      "Share studies with unlimited team members and external stakeholders",
      "Comment inline on specific criteria, components, or scoring decisions",
      "Capture decision rationale and approval trails for documentation",
      "Track who changed what and when with detailed activity logs",
      "Role-based permissions control who can view, edit, or approve",
      "@mention teammates to bring their attention to specific items",
      "Real-time notifications keep everyone informed of important updates",
      "Discussion threads preserve the context of decisions",
      "Stakeholder review mode provides read-only access with commenting",
      "Integration with Slack, Teams, and email for seamless communication",
    ],
    highlights: [
      {
        title: "Real-Time Collaboration",
        description:
          "Multiple team members can work on the same study simultaneously without conflicts.",
      },
      {
        title: "Approval Workflows",
        description:
          "Route studies through your organization's review and approval process.",
      },
      {
        title: "Institutional Knowledge",
        description:
          "Capture the 'why' behind decisions so future teams can learn from your work.",
      },
    ],
    stats: [
      { value: "Unlimited", label: "Team Members" },
      { value: "Real-Time", label: "Updates" },
      { value: "Full", label: "Audit Trail" },
    ],
    category: "Collaboration",
    priority: 6,
    layout: "hero",
    videoSrc: "/videos/192281-892475127.mp4",
  },
];
