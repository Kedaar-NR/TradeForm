import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Table, FileText } from 'lucide-react';
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
      // Still update localStorage even if API call failed (navigate anyway)
      updateLocalStorageOnboardingStatus('completed');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Your Trade Study Documents
          </h1>
          <p className="text-gray-600">
            Help us understand your workflow by uploading existing documents. All files are processed securely.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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

        {/* Footer */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              You can always add more files later in Settings
            </p>
            <button
              onClick={handleContinue}
              disabled={loading}
              className="btn-primary px-8 py-3 text-base disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue to dashboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingUpload;

