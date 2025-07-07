import { createContext, useContext, useEffect, useState } from 'react';
import { UserData } from '@/hooks/useUserData';

interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  refreshUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.phone) {
        setLoading(false);
        return;
      }

      // Fetch all data in parallel
      const [balanceRes, referralRes, userRes] = await Promise.all([
        fetch(`/api/wallet/balance/${user.phone}`),
        fetch(`/api/referral/count/${user.phone}`),
        fetch(`/api/auth/user/${user.phone}`)
      ]);

      const [balanceData, referralData, userData] = await Promise.all([
        balanceRes.json(),
        referralRes.json(),
        userRes.json()
      ]);

      // Check for errors
      if (!balanceRes.ok || !referralRes.ok || !userRes.ok) {
        throw new Error('Failed to fetch user data');
      }

      const updatedUserData = {
        ...userData,
        balance: balanceData.balance || 0,
        referrer: userData.referrer || null,
        qrCode: userData.qrCode || null
      };

      setUserData(updatedUserData);
      localStorage.setItem('user', JSON.stringify(updatedUserData));

    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ userData, loading, error, refreshUserData: fetchUserData }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
