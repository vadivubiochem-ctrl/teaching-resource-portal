import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [manualOffline, setManualOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const effectiveOnline = !manualOffline && isOnline;

  const toggleSimulatedOffline = () => {
    setManualOffline((prev) => !prev);
  };

  return {
    isOnline: effectiveOnline,
    rawOnline: isOnline,
    manualOffline,
    toggleSimulatedOffline,
  };
}
