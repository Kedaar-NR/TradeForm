import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Table, FileText, ArrowRight } from 'lucide-react';
import FileUploadCard from '../../components/Onboarding/FileUploadCard';
import { onboardingApi } from '../../services/api';
import { updateLocalStorageOnboardingStatus } from '../../utils/onboardingHelpers';

const OnboardingUpload: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleContinue = async () => {
    try {
      setLoading(true);
      await onboardingApi.updateStatus('completed');
      updateLocalStorageOnboardingStatus('completed');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to update onboarding status:', error);
      // Still update localStorage and navigate even if API call failed
      updateLocalStorageOnboardingStatus('completed');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Document Library
        </h1>
        <p className="text-gray-600 mb-3">
          Upload your existing trade study documents to help TradeForm understand your workflow and preferences. 
          All files are processed securely and used to personalize your experience.
        </p>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <span>
            You can navigate to Dashboard or other pages anytime using the sidebar. Documents can be uploaded now or later.
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Criteria Upload Card */}
        <FileUploadCard
          docType="criteria"
          title="Criteria"
          description="Upload any files that describe how you choose and weight criteria for trade studies. Examples: criteria lists, weighting spreadsheets, requirement specs."
          icon={<CheckSquare className="w-6 h-6" />}
          acceptedTypes=".pdf, .doc, .docx, .xls, .xlsx, .csv"
        />

        {/* Component Ratings Card */}
        <FileUploadCard
          docType="rating_doc"
          title="Component Ratings & Documentation"
          description="Upload past trade study spreadsheets or docs where you rated different components, as well as technical documentation used for evaluation."
          icon={<Table className="w-6 h-6" />}
          acceptedTypes=".pdf, .doc, .docx, .xls, .xlsx, .csv"
        />

        {/* Reports Card */}
        <FileUploadCard
          docType="report_template"
          title="Reports"
          description="Upload final trade study reports so TradeForm can match your preferred format and structure in exports."
          icon={<FileText className="w-6 h-6" />}
          acceptedTypes=".pdf, .doc, .docx"
        />
      </div>

      {/* Info Footer */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <svg 
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              How this helps you
            </h3>
            <p className="text-sm text-blue-800">
              Your uploaded documents help TradeForm's AI understand your specific evaluation methodology, 
              criteria preferences, and reporting style. This allows the system to provide more relevant 
              suggestions and generate reports that match your organization's standards.
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={loading}
          className="btn-primary px-8 py-3 text-base disabled:opacity-50 flex items-center space-x-2"
        >
          <span>{loading ? 'Saving...' : 'Continue to Dashboard'}</span>
          {!loading && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default OnboardingUpload;

