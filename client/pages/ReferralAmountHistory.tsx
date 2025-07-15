import { useState, useEffect } from 'react';
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  IndianRupee, 
  Calendar, 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  Wallet, 
  Gift, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Clock,
  Target
} from "lucide-react";
import { 
  StatsSkeletons, 
  ReferralHistorySkeletons, 
  WithdrawalSkeletons 
} from "@/components/ui/skeleton-components";

interface ReferralAmountRecord {
  _id: string;
  referrer: string;
  referred: string;
  referralTransactionId: string;
  rewardAmount: number;
  status: string;
  dateEarned: string;
  referredPurchaseAmount: number;
  rewardTransactionId?: string;
  withdrawalTransactionId?: string;
  withdrawalDate?: string;
}

interface ReferralWithdrawalRecord {
  _id: string;
  amount: number;
  createdAt: string;
  metadata?: {
    originalAmount?: number;
    cutAmount?: number;
    finalAmount?: number;
    cutRate?: number;
  };
}

function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout = 10000) {
  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeout)
    )
  ]);
}

const ReferralAmountHistory = () => {
  const { userData, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [referralHistory, setReferralHistory] = useState<ReferralAmountRecord[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<ReferralWithdrawalRecord[]>([]);

  useEffect(() => {
    const fetchReferralData = async () => {
      console.log('DEBUG: userData.phone for referral history:', userData?.phone);
      if (!userData?.phone) {
        if (!userLoading) {
          setLoading(false);
          setError("Please log in to view your referral history. (No phone number found)");
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log('Fetching referral history...');
        const historyResponse = await fetchWithTimeout(`/api/referral-amount/history/${userData.phone}`);
        console.log('Fetched referral history');
        const contentType = historyResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response. Please try again or check your connection.');
        }
        if (!historyResponse.ok) {
          const errorData = await historyResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch referral history");
        }
        const historyData = await historyResponse.json();
        setReferralHistory(historyData.referralHistory || []);

        console.log('Fetching referral stats...');
        const statsResponse = await fetchWithTimeout(`/api/referral-amount/stats/${userData.phone}`);
        console.log('Fetched referral stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.success) {
            setTotalEarnings(statsData.totalEarned || 0);
            setTotalReferrals(statsData.totalReferrals || 0);
          }
        }

        console.log('Fetching referral withdrawals...');
        const withdrawalResponse = await fetchWithTimeout(`/api/wallet/transactions?type=deposit&source=referral_withdrawal&phone=${userData.phone}`);
        console.log('Fetched referral withdrawals');
        if (withdrawalResponse.ok) {
          const withdrawalData = await withdrawalResponse.json();
          setWithdrawals(withdrawalData.transactions || []);
        }
      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
        toast({
          variant: "destructive",
          title: "Error Fetching Referral History",
          description: err.message || "Could not retrieve your referral history.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [userData, userLoading, toast]);

  if (loading || userLoading) {
    return (
      <Layout className="scroll-smooth no-overscroll">
        <div className="px-6 py-6">
          <Header title="Referral History" />
          
          {/* Loading Stats */}
          <div className="mt-6">
            <StatsSkeletons />
          </div>
          
          {/* Loading Referral History */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <ReferralHistorySkeletons />
          </div>
          
          {/* Loading Withdrawals */}
          <div className="mt-8">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
            <WithdrawalSkeletons />
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !referralHistory.length) {
    return (
      <Layout>
        <div className="px-6 py-6">
          <Header title="Referral History" />
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h2 className="text-xl font-semibold text-red-500 mb-2">
              Failed to Load Referral History
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-shark-blue text-white rounded-lg hover:bg-shark-blue-dark"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="scroll-smooth no-overscroll">
      <div className="px-6 py-6">
    
        
        {/* Header with Progress */}
        <div className="mt-6">
          {/* <Header title="Referral Earnings" /> */}
          
          {/* Progress towards withdrawal */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Progress to Withdrawal</span>
              <span className="text-sm font-bold text-blue-800">
                ₹{totalEarnings} / ₹1500
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((totalEarnings / 1500) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              {totalEarnings >= 1500 ? 
                "🎉 You can withdraw your earnings now!" : 
                `${Math.ceil((1500 - totalEarnings) / 300)} more referrals needed`
              }
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
                  <p className="text-2xl font-bold text-blue-600">{totalReferrals}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Earned</p>
                  <div className="flex items-center">
                    <IndianRupee className="text-green-600 mr-1" size={16} />
                    <span className="text-2xl font-bold text-green-600">
                      {totalEarnings.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Gift className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Rewards */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-readable">
            Referral Rewards
          </h2>
          {/* Rewards Section */}
          {referralHistory.length === 0 ? (
            <div className="text-center py-10">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Referral Earnings Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Earn ₹500 for each referral's first shark purchase only.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referralHistory.map((record) => (
                <Card key={record._id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <Users size={18} className="mr-2 text-shark-blue" />
                          {record.referred}
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            record.status === 'completed' ? 'bg-green-100 text-green-800' :
                            record.status === 'withdrawn' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status === 'withdrawn' ? 'Withdrawn' : 'Available'}
                          </span>
                        </CardTitle>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <Calendar size={14} className="mr-1" />
                          {new Date(record.dateEarned).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <ShoppingCart size={14} className="mr-1" />
                          Purchase: ₹{record.referredPurchaseAmount.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-green-600 font-semibold text-lg">
                          <IndianRupee size={16} className="mr-1" />
                          {record.rewardAmount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">Reward</div>
                        {record.withdrawalDate && (
                          <div className="text-xs text-blue-600 mt-1">
                            Withdrawn: {new Date(record.withdrawalDate).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      Transaction ID: {record.referralTransactionId}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawals Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-readable">
            Referral Withdrawals
          </h2>
          {withdrawals.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No referral withdrawals yet.
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((w) => (
                <Card key={w._id} className="overflow-hidden border-blue-200">
                  <CardHeader className="pb-2 flex flex-row justify-between items-center">
                    <div>
                      <div className="flex items-center text-blue-700 font-semibold text-lg">
                        <IndianRupee size={16} className="mr-1" />
                        {w.metadata?.finalAmount?.toFixed(2) || w.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Withdrawn on: {new Date(w.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">
                        Original: ₹{w.metadata?.originalAmount?.toFixed(2) || w.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-orange-600">
                        15% Cut: ₹{w.metadata?.cutAmount?.toFixed(2) || ((w.metadata?.originalAmount || w.amount) * 0.15).toFixed(2)}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How Referral Earnings Work</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Earn ₹300 for each referral's registration (immediate reward)</li>
            <li>• One-time reward per referral - no additional rewards for purchases</li>
            <li>• Reward given instantly when someone signs up with your code</li>
            <li>• Minimum transfer: ₹1500</li>
            <li>• 15% cut applied when transferring to balance</li>
            <li>• Example: ₹1500 referral earnings → ₹1275 in balance</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default ReferralAmountHistory;
