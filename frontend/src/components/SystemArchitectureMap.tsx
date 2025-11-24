import React from "react";
import { useNavigate } from "react-router-dom";
import { Project } from "../types";

interface SystemArchitectureMapProps {
  projectGroupId: string;
  projectGroupName: string;
  projects: Project[];
}

interface LayerDefinition {
  name: string;
  keywords: string[];
  icon: string;
  accent?: string;
}

const SystemArchitectureMap: React.FC<SystemArchitectureMapProps> = ({
  projectGroupId,
  projectGroupName,
  projects,
}) => {
  const navigate = useNavigate();

  // Get the system category to determine layout
  const getSystemCategory = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes("rocket")) return "rocket";
    if (lower.includes("satellite")) return "satellite";
    if (lower.includes("drone")) return "drone";
    if (lower.includes("aircraft")) return "aircraft";
    return "generic";
  };

  const category = getSystemCategory(projectGroupName);

  const categorizeStudies = (definitions: LayerDefinition[]) => {
    const assigned = new Set<string>();
    const normalize = (value?: string) => (value || "").toLowerCase();

    const layers = definitions.map((def) => {
      const studies = projects.filter((p) => {
        if (assigned.has(p.id)) return false;
        const type = normalize(p.componentType);
        return def.keywords.some((k) => type.includes(k));
      });
      studies.forEach((s) => assigned.add(s.id));
      return { ...def, studies };
    });

    const remaining = projects.filter((p) => !assigned.has(p.id));
    if (remaining.length > 0) {
      layers.push({
        name: "Other Systems",
        keywords: [],
        icon: "🧩",
        accent: "bg-gray-100 text-gray-800",
        studies: remaining,
      });
    }

    return layers.filter((layer) => layer.studies.length > 0);
  };

  // Define architecture layouts for different system types
  const getArchitectureLayout = () => {
    switch (category) {
      case "rocket":
        return {
          title: "Rocket System Architecture",
          centerNode: "Rocket Assembly",
          layers: categorizeStudies([
            {
              name: "Propulsion & Feed",
              icon: "🚀",
              keywords: ["booster", "engine", "turbopump", "nozzle", "ignition", "tvc", "thrust"],
            },
            {
              name: "Structures & Payload",
              icon: "🛰️",
              keywords: ["fairing", "payload", "separation", "tank"],
            },
            {
              name: "Guidance & Avionics",
              icon: "🧭",
              keywords: ["avionics", "guidance", "imu", "sensor"],
            },
            {
              name: "Recovery & Operations",
              icon: "🪂",
              keywords: ["recovery", "parachute", "reusability"],
            },
          ]),
        };
      case "satellite":
        return {
          title: "Satellite System Architecture",
          centerNode: "Satellite Bus",
          layers: categorizeStudies([
            {
              name: "Power & Thermal",
              icon: "⚡",
              keywords: ["solar", "battery", "power", "radiator", "thermal"],
            },
            {
              name: "Communications & Payload",
              icon: "📡",
              keywords: ["antenna", "communication", "payload", "instrument"],
            },
            {
              name: "Attitude & Navigation",
              icon: "🛰️",
              keywords: ["reaction", "wheel", "gyro", "star", "tracker", "imu"],
            },
            {
              name: "Bus & Computing",
              icon: "💻",
              keywords: ["computer", "flight", "controller"],
            },
            {
              name: "Propulsion",
              icon: "🧲",
              keywords: ["thruster", "propulsion", "ion"],
            },
          ]),
        };
      case "drone":
        return {
          title: "Drone System Architecture",
          centerNode: "Drone Platform",
          layers: categorizeStudies([
            { name: "Propulsion", icon: "⚙️", keywords: ["motor", "propeller", "esc", "engine"] },
            { name: "Power", icon: "🔋", keywords: ["battery", "power"] },
            { name: "Sensors & Payload", icon: "🎥", keywords: ["camera", "sensor", "gimbal", "fpv"] },
            { name: "Control & Navigation", icon: "🧭", keywords: ["controller", "gps"] },
          ]),
        };
      case "aircraft":
        return {
          title: "Aircraft System Architecture",
          centerNode: "Aircraft Platform",
          layers: categorizeStudies([
            { name: "Propulsion", icon: "✈️", keywords: ["engine", "turbine", "propulsion"] },
            { name: "Avionics & Flight Control", icon: "🖥️", keywords: ["computer", "flight", "radar", "control"] },
            { name: "Structures", icon: "🛠️", keywords: ["wing", "spar", "fuselage", "composite"] },
            { name: "Power & Systems", icon: "🔌", keywords: ["power", "battery"] },
          ]),
        };
      default:
        return {
          title: "System Architecture",
          centerNode: "System",
          layers: categorizeStudies([
            { name: "Trade Studies", icon: "📊", keywords: [""] },
          ]),
        };
    }
  };

  const layout = getArchitectureLayout();

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="card p-6 bg-gradient-to-b from-gray-50 via-white to-gray-100 border border-gray-200 shadow-sm relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-10 -top-16 h-32 w-32 bg-black/5 rounded-full blur-3xl"></div>
        <div className="absolute right-0 bottom-0 h-40 w-40 bg-gray-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Core node */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-black text-white px-6 py-3 rounded-lg font-semibold text-sm shadow-md">
            {layout.centerNode}
          </div>
          <div className="text-xs text-gray-500">Top-down view of subsystems and trade studies</div>
        </div>

        {/* Connector */}
        <div className="w-px h-10 bg-gray-300"></div>

        {/* Lanes */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {layout.layers.map((layer, idx) => (
            <div
              key={idx}
              className="relative bg-white/95 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 h-6 w-px bg-gray-300" />
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {layer.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {layer.studies.length} trade {layer.studies.length === 1 ? "study" : "studies"}
                  </div>
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Lane {idx + 1}</div>
              </div>

              <div className="space-y-2">
                {layer.studies.map((study) => (
                  <button
                    key={study.id}
                    onClick={() => navigate(`/project/${study.id}`, { state: { projectGroupId } })}
                    className="w-full bg-white border border-gray-200 hover:border-black hover:shadow-sm transition-all px-3 py-2 rounded-lg text-left group flex items-start gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-1"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-black truncate">
                        {study.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {study.componentType}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemArchitectureMap;
