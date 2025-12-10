import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, type ReactNode } from "react";
import Logo from "./Logo";
import FloatingAIAssistant from "./FloatingAIAssistant";
import GlobalSearch from "./GlobalSearch";
import { projectGroupsApi } from "../services/api";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6B7280");
  const [isCreating, setIsCreating] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const COLORS = [
    { name: "gray", value: "#6B7280" },
    { name: "blue", value: "#3B82F6" },
    { name: "green", value: "#10B981" },
    { name: "purple", value: "#8B5CF6" },
    { name: "pink", value: "#EC4899" },
    { name: "orange", value: "#F59E0B" },
    { name: "red", value: "#EF4444" },
    { name: "teal", value: "#14B8A6" },
  ];

  // Close profile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  // Treat a path as active if it matches exactly or if it's a nested route under it
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const navigation: Array<{
    name: string;
    path: string;
    icon: ReactNode;
    badge?: string;
    hidden?: boolean;
  }> = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: "Suppliers",
      path: "/suppliers",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 21H7a2 2 0 01-2-2V9a2 2 0 012-2h3l2-2h3a2 2 0 012 2v12a2 2 0 01-2 2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6M9 16h3"
          />
        </svg>
      ),
    },
    {
      name: "Scheduler",
      path: "/scheduler",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V5m8 2V5m-9 8h2m3 0h2m-9 4h6m3 0h2M5 9h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z"
          />
        </svg>
      ),
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    try {
      setIsCreating(true);
      const response = await projectGroupsApi.create({
        name: projectName,
        description: projectDescription,
        icon: "folder",
        color: selectedColor,
      });

      // Navigate to the new project
      navigate(`/project-group/${response.data.id}`);

      // Reset form
      setShowCreateProjectModal(false);
      setProjectName("");
      setProjectDescription("");
      setSelectedColor("#6B7280");
    } catch (error: any) {
      console.error("Failed to create project:", error);
      alert(
        `Failed to create project: ${
          error.response?.data?.detail || error.message
        }`
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-48"
        } bg-white border-r border-gray-200 flex-shrink-0 fixed h-screen flex flex-col transition-all duration-300 ease-in-out`}
      >
        <div className="h-full flex flex-col">
          {/* Logo and Toggle */}
          <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
            <div
              onClick={() => navigate("/dashboard")}
              className="cursor-pointer"
            >
              <Logo showText={!isCollapsed} />
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                />
              </svg>
            </button>
          </div>

          {/* Navigation - Scrollable if needed */}
          <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto min-h-0 flex flex-col">
            {navigation.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`sidebar-link ${
                  isActive(item.path) ? "sidebar-link-active" : ""
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.name : undefined}
              >
                {item.icon}
                {!isCollapsed && <span>{item.name}</span>}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "ml-20" : "ml-48"
        }`}
      >
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            {/* Global Search - always visible */}
            <GlobalSearch />
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/documentation")}
                className="text-sm text-gray-600 hover:text-gray-900 whitespace-nowrap"
              >
                Documentation
              </button>
              {/* Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileMenu(!showProfileMenu);
                  }}
                  className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-sm hover:bg-gray-800 transition-all shadow-sm overflow-hidden"
                >
                  {(() => {
                    const user = localStorage.getItem("currentUser");
                    if (user) {
                      try {
                        const parsed = JSON.parse(user);
                        const avatar =
                          parsed.photo_url ||
                          parsed.photoUrl ||
                          parsed.picture ||
                          parsed.image ||
                          parsed.avatar;
                        if (avatar) {
                          return (
                            <img
                              src={avatar}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          );
                        }
                        return (
                          (parsed.name?.[0] ||
                            parsed.email?.[0] ||
                            "U") as string
                        ).toUpperCase();
                      } catch {
                        return "U";
                      }
                    }
                    return "U";
                  })()}
                </button>
                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/onboarding/upload");
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      View Profile
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-md px-4 py-2 shadow-sm hover:bg-gray-100 hover:border-gray-400 transition-colors whitespace-nowrap"
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto pl-8 pr-6 py-6">{children}</div>
        </main>
      </div>

      {/* Floating AI Assistant - Always visible */}
      <FloatingAIAssistant />

      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Create New Project
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Q4 Power Supply Studies"
                  className="input-field w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief description of this project..."
                  className="input-field w-full h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.value)}
                      type="button"
                      className={`h-10 rounded-lg border-2 transition-all ${
                        selectedColor === color.value
                          ? "border-black"
                          : "border-gray-200"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateProjectModal(false);
                  setProjectName("");
                  setProjectDescription("");
                  setSelectedColor("#6B7280");
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="btn-primary"
                disabled={isCreating || !projectName.trim()}
              >
                {isCreating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
