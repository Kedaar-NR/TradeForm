import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import api from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });

    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validate email before submitting
    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = new URLSearchParams();
      payload.append('username', formData.email);
      payload.append('password', formData.password);

      const response = await api.post('/api/auth/login', payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = response.data;
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to log in. Please try again.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
          </div>
        </div>
      </nav>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600">
              Log in to your TradeForm account
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  className={`input-field ${emailError ? 'border-red-500' : ''}`}
                  placeholder="you@example.com"
                  required
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input-field"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-black rounded border-gray-300 focus:ring-gray-1000"
                  />
                  <span className="ml-2 text-gray-700">Remember me</span>
                </label>
                <button type="button" className="text-black hover:text-gray-900">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full btn-primary disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </button>
            </form>
            {formError && (
              <p className="mt-4 text-sm text-red-600 text-center">{formError}</p>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="text-black hover:text-gray-900 font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
