import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  GDPRInfoScreen,
  ExportDataScreen,
  DeleteAccountScreen,
  ConsentManagementScreen,
} from '../../features/gdpr';

type ScreenType = 'info' | 'export' | 'delete' | 'consents';

export default function GDPRPage() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('info');

  const handleBack = () => {
    if (currentScreen === 'info') {
      router.back();
    } else {
      setCurrentScreen('info');
    }
  };

  const handleAccountDeleted = () => {
    // Navigate to login/welcome screen after account deletion
    router.replace('/');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'info':
        return (
          <GDPRInfoScreen
            onBack={handleBack}
            onNavigateToExport={() => setCurrentScreen('export')}
            onNavigateToDelete={() => setCurrentScreen('delete')}
            onNavigateToConsents={() => setCurrentScreen('consents')}
          />
        );
      case 'export':
        return <ExportDataScreen onBack={handleBack} />;
      case 'delete':
        return (
          <DeleteAccountScreen
            onBack={handleBack}
            onDeleted={handleAccountDeleted}
          />
        );
      case 'consents':
        return <ConsentManagementScreen onBack={handleBack} />;
      default:
        return null;
    }
  };

  return renderScreen();
}
