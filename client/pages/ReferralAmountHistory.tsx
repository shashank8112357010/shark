import { useState, useEffect } from 'react';
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Calendar, Users, TrendingUp, ShoppingCart } from "lucide-react";

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

const ReferralAmountHistory = () => {
  const { userData, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [referralHistory, setReferralHistory] = useState<ReferralAmountRecord[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!userData?.phone) {
        if (!userLoading) {
          setLoading(false);
          setError("Please log in to view your referral history.");
        }
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Fetch referral amount history
        const historyResponse = await fetch(`/api/referral-amount/history/${userData.phone}`);
        if (!historyResponse.ok) {
          const errorData = await historyResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch referral history");
        }
        const historyData = await historyResponse.json();
        setReferralHistory(historyData.referralHistory || []);

        // Fetch stats
        const statsResponse = await fetch(`/api/referral-amount/stats/${userData.phone}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.success) {
            setTotalEarnings(statsData.totalEarned || 0);
            setTotalReferrals(statsData.totalReferrals || 0);
          }
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
      <Layout className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
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
        <Header title="Referral Earnings History" />
        
        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="text-shark-blue mr-2" size={20} />
                <span className="text-2xl font-bold text-shark-blue">
                  {totalReferrals}
                </span>
              </div>
              <p className="text-sm text-gray-600">Successful Referrals</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <IndianRupee className="text-green-600 mr-1" size={20} />
                <span className="text-2xl font-bold text-green-600">
                  {totalEarnings.toFixed(0)}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral History List */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-readable">
            Earnings from Referral Purchases
          </h2>
          
          {referralHistory.length === 0 ? (
            <div className="text-center py-10">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Referral Earnings Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Earn ₹300 for each referral's first shark purchase only.
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

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How Referral Earnings Work</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Earn ₹300 for each referral's FIRST shark purchase only</li>
            <li>• One-time reward per referral - subsequent purchases don't earn rewards</li>
            <li>• No reward for just registration - only for shark purchases</li>
            <li>• Minimum withdrawal: ₹1000</li>
            <li>• 30% tax if withdrawing less than ₹5000</li>
            <li>• No tax if withdrawing ₹5000 or more</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default ReferralAmountHistory;
