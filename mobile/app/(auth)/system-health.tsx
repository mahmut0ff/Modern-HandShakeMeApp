import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  SystemStatusScreen,
  DiagnosticsScreen,
} from '../../features/health';

type ScreenType = 'status' | 'diagnostics';

export default function SystemHealthPage() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('status');

  const handleBack = () => {
    if (currentScreen === 'status') {
      router.back();
    } else {
      setCurrentScreen('status');
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'status':
        return <SystemStatusScreen onBack={handleBack} />;
      case 'diagnostics':
        return <DiagnosticsScreen onBack={handleBack} />;
      default:
        return null;
    }
  };

  return renderScreen();
}
