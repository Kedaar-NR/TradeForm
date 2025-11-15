import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navigation: Array<{ name: string; path: string; icon: React.ReactElement; badge?: string; hidden?: boolean }> = [
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
    // Hidden from primary nav - accessible via direct URL for testing
    // {
    //   name: 'Datasheet AI Lab',
    //   path: '/datasheet-lab',
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    //     </svg>
    //   ),
    //   badge: 'Lab',
    //   hidden: true
    // },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isAsking) return;

    setIsAsking(true);
    try {
      const response = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: searchQuery })
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const data = await response.json();
      setAiResponse(data.response);
      setShowAiModal(true);
    } catch (error) {
      console.error('AI chat error:', error);
      setAiResponse('Sorry, I encountered an error. Please try again.');
      setShowAiModal(true);
    } finally {
      setIsAsking(false);
    }
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
                {item.badge && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    {item.badge}
                  </span>
                )}
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
            <form onSubmit={handleAskAI} className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search / AI Ask..."
                className="input-field max-w-md"
                disabled={isAsking}
              />
            </form>
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

      {/* AI Response Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1">
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-500 mb-2">Your Question:</div>
                <div className="text-gray-900 bg-gray-50 p-3 rounded">{searchQuery}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">AI Response:</div>
                <div className="text-gray-900 whitespace-pre-wrap">{aiResponse}</div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAiModal(false);
                  setSearchQuery('');
                }}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowAiModal(false);
                }}
                className="btn-primary"
              >
                Ask Another Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
