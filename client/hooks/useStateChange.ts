import { useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';

export function useStateChange() {
  const { refreshUserData } = useUser();

  const handleStateChange = useCallback(() => {
    refreshUserData();
  }, [refreshUserData]);

  return { handleStateChange };
}
