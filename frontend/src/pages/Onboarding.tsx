import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import OnboardingUpload from './Onboarding/OnboardingUpload';

const Onboarding: React.FC = () => {
  return (
    <Routes>
      <Route index element={<OnboardingUpload />} />
      <Route path="upload" element={<OnboardingUpload />} />
      <Route path="*" element={<Navigate to="/onboarding" replace />} />
    </Routes>
  );
};

export default Onboarding;

