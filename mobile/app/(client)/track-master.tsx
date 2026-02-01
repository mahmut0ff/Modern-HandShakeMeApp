import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ClientTrackingScreen } from '../../features/location-tracking';

export default function TrackMasterPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const bookingId = params.bookingId as string | undefined;
  const projectId = params.projectId as string | undefined;
  const masterId = params.masterId as string | undefined;

  return (
    <ClientTrackingScreen
      bookingId={bookingId}
      projectId={projectId}
      masterId={masterId}
      onBack={() => router.back()}
    />
  );
}
