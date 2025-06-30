import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface UserData {
  phone: string;
  inviteCode: string;
  balance: number;
  referrer?: string;
  qrCode?: string;
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch data when component mounts and on phone number changes
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.phone) {
      fetchUserData(user.phone);
    }
  }, [navigate]);

  // Refresh data periodically
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (userData?.phone) {
      timer = setInterval(() => {
        fetchUserData(userData.phone);
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [userData?.phone]);

  const fetchUserData = async (phone: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all user data in parallel
      const [balanceRes, referralRes, userRes] = await Promise.all([
        fetch(`/api/wallet/balance/${phone}`),
        fetch(`/api/referral/count/${phone}`),
        fetch(`/api/auth/user/${phone}`)
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

      // Update user data
      setUserData({
        phone,
        inviteCode: userData.inviteCode || '',
        balance: balanceData.balance || 0,
        referrer: userData.referrer || null,
        qrCode: userData.qrCode || null
      });

      // Update localStorage with fresh data
      localStorage.setItem('user', JSON.stringify({
        phone,
        inviteCode: userData.inviteCode || '',
        referrer: userData.referrer || null,
        qrCode: userData.qrCode || null
      }));

    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  return { userData, loading, error };
}
