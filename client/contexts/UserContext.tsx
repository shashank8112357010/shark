import { createContext, useContext, useEffect, useState } from 'react';
import { UserData } from '@/hooks/useUserData';

interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  refreshUserData: () => void;
  setUserData: (userData: UserData | null) => void;
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
      const [balanceRes, referralAmountRes, userRes] = await Promise.all([
        fetch(`/api/wallet/balance/${user.phone}`),
        fetch(`/api/referral-amount/stats/${user.phone}`),
        fetch(`/api/auth/user/${user.phone}`)
      ]);

      const [balanceData, referralAmountData, userData] = await Promise.all([
        balanceRes.json(),
        referralAmountRes.json(),
        userRes.json()
      ]);

      // Check for errors
      if (!balanceRes.ok || !userRes.ok) {
        throw new Error('Failed to fetch user data');
      }


      console.warn(referralAmountData.allTimeReferrals , "referralAmountData");
      
      // Extract referral stats (don't fail if API is not available)
      const referralStats = referralAmountRes.ok && referralAmountData.success
        ? {
            totalReferralEarnings: referralAmountData.totalEarned || 0,
            totalReferralCount: referralAmountData.totalReferrals || 0,
            allTimeReferralEarnings: referralAmountData.allTimeEarned || 0,
            allTimeReferralCount: referralAmountData.allTimeReferrals || 0
          }
        : {
            totalReferralEarnings: 0,
            totalReferralCount: 0,
            allTimeReferralEarnings: 0,
            allTimeReferralCount: 0
          };

      const updatedUserData = {
        ...userData,
        balance: balanceData.balance || 0,
        qrCode: userData.qrCode || null,
        ...referralStats
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
    <UserContext.Provider value={{ userData, loading, error, setUserData , refreshUserData: fetchUserData }}>
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
