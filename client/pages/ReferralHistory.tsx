import { useState, useEffect } from 'react';
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { Copy, Share2, Users, TrendingUp } from "lucide-react";

const ReferralHistory = () => {
  const { userData, loading } = useUser();
  const [referralHistory, setReferralHistory] = useState<any[]>([]);
  const [totalRewards, setTotalRewards] = useState(0);

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!userData?.phone) return;

      try {
        // Fetch referral history
        const historyRes = await fetch(`/api/referral/history/${userData.phone}`);
        const historyData = await historyRes.json();
        setReferralHistory(historyData.referrals || []);

        // Fetch total rewards
        const rewardsRes = await fetch(`/api/referral/rewards/${userData.phone}`);
        const rewardsData = await rewardsRes.json();
        setTotalRewards(rewardsData.totalReward || 0);
      } catch (error) {
        console.error('Failed to fetch referral data:', error);
      }
    };

    fetchReferralData();
  }, [userData?.phone]);

  const handleCopyInvite = () => {
    if (userData?.inviteCode) {
      navigator.clipboard.writeText(userData.inviteCode);
      alert('Invite code copied to clipboard!');
    }
  };

  return (
    <Layout
     
    >
      <div className="px-6 py-4">
        <div className="text-lg font-semibold mb-4">Referral History</div>
        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg">
                  <div className="h-8 w-8 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : referralHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No referral history found
            </div>
          ) : (
            referralHistory.map((referral, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-white rounded-lg"
              >
                <div className="w-8 h-8 bg-shark-blue rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{referral.referred}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">₹{referral.reward.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">Status: {referral.status}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReferralHistory;
