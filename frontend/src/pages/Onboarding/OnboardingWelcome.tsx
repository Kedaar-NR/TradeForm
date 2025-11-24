import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, SkipForward } from 'lucide-react';
import { onboardingApi } from '../../services/api';
import { updateLocalStorageOnboardingStatus } from '../../utils/onboardingHelpers';

const OnboardingWelcome: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleStart = () => {
    navigate('/onboarding/upload');
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      await onboardingApi.updateStatus('skipped');
      updateLocalStorageOnboardingStatus('skipped');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      // Still update localStorage even if API call failed (navigate anyway)
      updateLocalStorageOnboardingStatus('skipped');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Set up TradeForm with your existing trade studies
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Upload your existing criteria, spreadsheets, and reports so our AI can match 
            your workflow from day one. This helps TradeForm understand your specific 
            evaluation methodology and report format preferences.
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What you can upload:
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Criteria Documents</p>
                <p className="text-sm text-gray-600">
                  Past criteria lists, weighting spreadsheets, or requirement specs
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-sm font-bold text-blue-600">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Component Ratings & Documentation</p>
                <p className="text-sm text-gray-600">
                  Previous trade study spreadsheets or technical evaluation documents
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-sm font-bold text-blue-600">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Final Reports</p>
                <p className="text-sm text-gray-600">
                  Trade study reports that show your preferred format and structure
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleStart}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 py-4 text-lg"
          >
            <span>Start Setup</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-lg"
          >
            <SkipForward className="w-5 h-5" />
            <span>Skip for now</span>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          You can always add more files later in Settings
        </p>
      </div>
    </div>
  );
};

export default OnboardingWelcome;

