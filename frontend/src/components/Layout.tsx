import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Templates',
      path: '/templates',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2-2h6l2 2h4v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
      )
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div onClick={() => navigate('/dashboard')}>
              <Logo />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`sidebar-link w-full ${
                  isActive(item.path) ? 'sidebar-link-active' : ''
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200 space-y-2">
            <button
              onClick={() => navigate('/new-project')}
              className="w-full btn-primary"
            >
              Start New Study
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-sm text-gray-600 hover:text-gray-900 py-2"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search or ask..."
                className="input-field max-w-md"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/documentation")}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Documentation
              </button>
              <button
                onClick={() => navigate("/help")}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Help
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
