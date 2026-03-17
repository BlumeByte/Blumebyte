import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { TwoFactorSetup } from '../components/TwoFactorSetup';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

export default function TwoFactorVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const handleComplete = () => {
    // Redirect to login after successful 2FA setup
    navigate('/login', { 
      replace: true,
      state: { message: '2FA enabled successfully! Please log in again.' }
    });
  };

  const handleSkip = () => {
    // Allow skip for now (can be removed in production)
    navigate('/login', { 
      replace: true,
      state: { message: 'You can enable 2FA later from your profile settings.' }
    });
  };

  if (!email) {
    navigate('/login', { replace: true });
    return null;
  }

  const blumeGradientStyle = () => ({
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={blumeGradientStyle()}>
      {/* Logo */}
      <div className="mb-6">
        <img src={logoImage} alt="Blumebyte" className="h-12" />
      </div>

      {/* 2FA Setup Component */}
      <TwoFactorSetup 
        email={email} 
        onComplete={handleComplete}
        onSkip={handleSkip}
      />

      {/* Footer */}
      <div className="mt-6 text-center text-white text-sm">
        <p>Blumebyte HR Management • Secure & Reliable</p>
      </div>
    </div>
  );
}
