import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { authApi } from '../services/api';

const WorkOsCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Completing Single Sign-On...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      setStatus('Missing authorization parameters from WorkOS.');
      return;
    }

    const completeSso = async () => {
      try {
        const response = await authApi.finishSso(code, state);
        const data = response.data;
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        setStatus('Success! Redirecting to dashboard...');
        setTimeout(() => navigate('/dashboard', { replace: true }), 750);
      } catch (error: any) {
        console.error('WorkOS SSO callback error:', error);
        const message =
          error?.response?.data?.detail ||
          error?.message ||
          'Failed to finalize SSO login. Please try again.';
        setStatus(message);
      }
    };

    void completeSso();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">Single Sign-On</h1>
          <p className="text-gray-700">{status}</p>
        </div>
      </div>
    </div>
  );
};

export default WorkOsCallback;
