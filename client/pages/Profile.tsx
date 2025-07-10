import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CreditCard,
  IndianRupee,
  Download,
  TrendingUp,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { useStateChange } from "@/hooks/useStateChange";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner"; // Optional: for loading states on cards

// From server/models/Transaction.ts - simplified for this component's needs
enum BackendTransactionType {
  PURCHASE = 'purchase',
  REFERRAL = 'referral',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit'
}
interface BackendTransaction {
  _id: string;
  type: BackendTransactionType;
  amount: number;
  // other fields not strictly needed for sum
}


const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { userData, loading: userLoading, error: userError, refreshUserData } = useUser();
  const { handleStateChange } = useStateChange();

  const [totalRecharge, setTotalRecharge] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0); // Total shark income from daily earnings
  // Referral data now comes from UserContext
  const [loadingStats, setLoadingStats] = useState(false);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);

  useEffect(() => {
    const fetchProfileStats = async () => {
      if (!userData?.phone) {
        if (!userLoading && userError) { // If user context itself had an error
             toast({ variant: "destructive", title: "User Error", description: "Could not load user data for profile." });
        }
        return;
      }

      setLoadingStats(true);
      try {
        // Fetch wallet stats for recharge data
        const statsResponse = await fetch(`/api/wallet/stats/${userData.phone}`);
        if (!statsResponse.ok) {
          const errorData = await statsResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch profile statistics");
        }
        const statsData = await statsResponse.json();
        setTotalRecharge(statsData.totalRecharge || 0);

        // Fetch total income from shark investments (separate from balance)
        const incomeResponse = await fetch(`/api/income/total/${userData.phone}`);
        if (incomeResponse.ok) {
          const incomeData = await incomeResponse.json();
          if (incomeData.success) {
            // Set total shark income (exclusive of balance)
            setTotalIncome(incomeData.totalIncome || 0);
            console.log(`📊 Total shark income loaded: ₹${incomeData.totalIncome} from ${incomeData.totalRecords} records`);
          } else {
            console.warn('Income API returned success=false:', incomeData);
            setTotalIncome(0);
          }
        } else {
          // Fallback to referral earnings if income API is not available
          console.warn('Income API not available, using referral earnings as fallback');
          setTotalIncome(statsData.totalReferralEarnings || 0);
        }

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error Fetching Profile Stats",
          description: error.message || "Could not load all profile statistics.",
        });
      } finally {
        setLoadingStats(false);
      }
    };

    if (!userLoading) { // Ensure userData is settled before fetching dependent stats
        fetchProfileStats();
    };
  }, [userData, userLoading, userError, toast]);

  // Handle referral earnings withdrawal
  const handleWithdrawReferralEarnings = async () => {
    if (!userData?.phone) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not logged in"
      });
      return;
    }

    // Check minimum amount
    const referralEarnings = userData.totalReferralEarnings || 0;
    if (referralEarnings < 1000) {
      toast({
        variant: "destructive",
        title: "Withdrawal Not Allowed",
        description: `Minimum withdrawal amount is ₹1000. Your current referral balance is ₹${referralEarnings}`,
      });
      return;
    }

    setWithdrawalLoading(true);
    try {
      const response = await fetch('/api/referral-amount/withdraw-to-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: userData.phone }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process withdrawal');
      }

      // Calculate tax info for display
      const taxInfo = data.details.taxAmount > 0 
        ? ` After ${data.details.taxRate}% tax deduction, ₹${data.details.finalAmount.toFixed(2)} has been added to your balance.`
        : ` Full amount of ₹${data.details.finalAmount.toFixed(2)} has been added to your balance (no tax applied).`;

      toast({
        title: "Withdrawal Successful!",
        description: `₹${data.details.originalAmount} withdrawn from referral earnings.${taxInfo}`,
      });

      // Refresh user data to update balance and referral stats
      refreshUserData();
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: error.message || "Something went wrong during withdrawal",
      });
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const menuItems = [
    {
      icon: FileText,
      label: "Account Record",
      path: "/account-records",
      isActive: location.pathname === "/account-records",
    },
    {
      icon: CreditCard,
      label: "Shark History",
      path: "/shark-history",
      isActive: location.pathname === "/shark-history",
    },
    {
      icon: FileText,
      label: "Invite Code",
      path: "/invite",
      isActive: location.pathname === "/invite",
    },
    {
      icon: UserPlus,
      label: "Referral History",
      path: "/referral-history",
      isActive: location.pathname === "/referral-history",
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    handleStateChange();
    navigate("/");
  };

  // Dynamic invite link and QR code
  const inviteCode = userData?.inviteCode;
  const inviteLink = `${window.location.origin}/register?invite_code=${inviteCode}`;

  // Fetch referrals
  const [referrals, setReferrals] = useState([]);
useEffect(() => {
    if (inviteCode) {
      fetch(`/api/referrals?referrer=${inviteCode}`)
        .then(res => res.json())
        .then(data => setReferrals(data.referred || []))
        .catch(() => setReferrals([]));
    }
  }, [inviteCode]);

  const displayBalance = userData?.balance?.toFixed(2) || "0.00";
  const displayRecharge = totalRecharge.toFixed(2);
  const displayIncome = totalIncome.toFixed(2);
  const displayReferralEarnings = (userData?.totalReferralEarnings || 0).toFixed(2);
  const totalReferralCount = userData?.totalReferralCount || 0;
  const totalReferralEarnings = userData?.totalReferralEarnings || 0;

  return (
    <Layout className="scroll-smooth no-overscroll">
      {/* Stats Cards */}
      <div className="px-6 mt-4 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          {/* Balance Card */}
          <div className="bg-white rounded-xl p-4 card-shadow text-center">
            <div className="flex items-center justify-center mb-2">
              <IndianRupee size={20} className="text-shark-blue" />
              {userLoading ? <LoadingSpinner size={16} className="ml-1" /> : <span className="text-shark-blue font-semibold">{displayBalance}</span>}
            </div>
            <div className="text-gray-600 text-sm text-readable">Balance</div>
          </div>

          {/* Recharge Card */}
          <div className="bg-white rounded-xl p-4 card-shadow text-center">
            <div className="flex items-center justify-center mb-2">
              <Download size={20} className="text-shark-blue" />
              {loadingStats ? <LoadingSpinner size={16} className="ml-1" /> : <span className="text-shark-blue font-semibold">{displayRecharge}</span>}
            </div>
            <div className="text-gray-600 text-sm text-readable">Recharge</div>
          </div>

          {/* Income Card */}
          <div className="bg-white rounded-xl p-4 card-shadow text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp size={20} className="text-shark-blue" />
              {loadingStats ? <LoadingSpinner size={16} className="ml-1" /> : <span className="text-shark-blue font-semibold">{displayIncome}</span>}
            </div>
            <div className="text-gray-600 text-sm text-readable">Income</div>
          </div>
          
          {/* Referral Earnings Card */}
          <div className="bg-white rounded-xl p-4 card-shadow text-center">
            <div className="flex items-center justify-center mb-2">
              <UserPlus size={20} className="text-green-600" />
              {loadingStats ? <LoadingSpinner size={16} className="ml-1" /> : <span className="text-green-600 font-semibold">{displayReferralEarnings}</span>}
            </div>
            <div className="text-gray-600 text-sm text-readable">Referral Earnings</div>
          </div>
        </div>
        
        {/* Referral Stats Summary */}
        <div className="mt-4 bg-white rounded-xl p-4 card-shadow">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">Successful Referrals</div>
            <div className="text-lg font-semibold text-shark-blue">{totalReferralCount}</div>
          </div>
          
          {/* Withdrawal Section */}
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-700">Withdraw to Balance</div>
              <div className="text-sm text-gray-600">
                Available: ₹{displayReferralEarnings}
              </div>
            </div>
            
            {totalReferralEarnings < 1000 ? (
              <div className="text-xs text-red-500 mb-2">
                Minimum withdrawal amount is ₹1000
              </div>
            ) : totalReferralEarnings < 5000 ? (
              <div className="text-xs text-orange-500 mb-2">
                30% tax will be deducted (amount &lt; ₹5000)
              </div>
            ) : (
              <div className="text-xs text-green-600 mb-2">
                No tax (amount ≥ ₹5000)
              </div>
            )}
            
            <Button
              onClick={handleWithdrawReferralEarnings}
              disabled={totalReferralEarnings < 1000 || withdrawalLoading}
              className={`w-full h-10 text-sm font-medium rounded-lg transition-all ${
                totalReferralEarnings < 1000 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white active:scale-98"
              }`}
            >
              {withdrawalLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Withdraw ₹${displayReferralEarnings}`
              )}
            </Button>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Earn ₹300 for each referral's FIRST shark purchase only!
          </div>
        </div>
      </div>

      {/* My Management Section */}
      <div className="px-6 mt-8">
        <h2 className="text-lg font-semibold mb-4 text-readable">
          My management
        </h2>
        <div className="space-y-2 mt-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon; // Renamed to avoid conflict
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full bg-white my-5 rounded-lg p-4 mt-2 flex items-center justify-between 
                  ${item.isActive ? "bg-gray-100" : "hover:bg-gray-50"}
                  transition-colors active:scale-98 card-shadow focus-visible`}
              >
                <div className="flex items-center">
                  <IconComponent // Use renamed component
                    size={24}
                    className={
                      item.isActive ? "text-shark-blue" : "text-gray-500"
                    }
                  />
                  <span
                    className={`ml-3 font-medium text-readable ${
                      item.isActive ? "text-shark-blue" : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="px-6 mt-8 pb-6">
        <Button
          onClick={handleLogout}
          className="w-full h-14 bg-red-400 hover:bg-shark-red-500 text-white text-lg font-medium rounded-lg active:scale-98 transition-transform focus-visible"
        >
          Sign Out
        </Button>
      </div>
    </Layout>
  );
};

export default Profile;
