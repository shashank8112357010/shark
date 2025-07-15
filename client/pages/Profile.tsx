import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import BankDetailsModal from "@/components/BankDetailsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CreditCard,
  IndianRupee,
  Download,
  TrendingUp,
  ChevronRight,
  UserPlus,
  Settings,
  Wallet,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  ShoppingCart,
  Eye,
  ExternalLink,
} from "lucide-react";
import { useStateChange } from "@/hooks/useStateChange";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { StatsCardSkeleton } from "@/components/ui/skeleton-components";

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
  const [availableReferralEarnings, setAvailableReferralEarnings] = useState(0);
  const [isReferralExpanded, setIsReferralExpanded] = useState(false);

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
        setTotalRecharge(statsData.totalRecharge || 0); // Use availableRecharge instead of totalRecharge
        // Use the new totalDailyIncome field from wallet stats
        const walletDailyIncome = statsData.totalDailyIncome || 0;
        
        // Use wallet stats for daily income (more accurate)
        setTotalIncome(walletDailyIncome);

        // Fetch referral stats for availableReferralEarnings
        const referralStatsResponse = await fetch(`/api/referral-amount/stats/${userData.phone}`);
        if (referralStatsResponse.ok) {
          const referralStats = await referralStatsResponse.json();
          setAvailableReferralEarnings(referralStats.availableReferralEarnings || 0);
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
        title: "Transfer Not Allowed",
        description: `Minimum transfer amount is ₹1000. Your current referral balance is ₹${referralEarnings}`,
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

      // Calculate cut info for display
      const cutInfo = ` After 15% cut, ₹${data.details.finalAmount.toFixed(2)} has been added to your balance.`;

      toast({
        title: "Transfer Successful!",
        description: `₹${data.details.originalAmount} transferred from referral earnings.${cutInfo}`,
      });

      // Refresh user data to update balance and referral stats
      refreshUserData();
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: error.message || "Something went wrong during transfer",
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
    },
    {
      icon: TrendingUp,
      label: "Income History",
      path: "/income-history",
      isActive: location.pathname === "/income-history",
    },
    {
      icon: Wallet,
      label: "Bank Accounts",
      path: "/bank-accounts",
      isActive: location.pathname === "/bank-accounts",
      isModal: true,
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


  // Display values with proper formatting
  const displayBalance = userData?.balance?.toFixed(2) || "0.00"; // Current wallet balance (includes all transactions)
  const displayRecharge = totalRecharge.toFixed(2); // Only actual recharge amounts (excludes daily income)
  const displayIncome = totalIncome.toFixed(2); // Total daily income from shark investments
  const displayReferralEarnings = availableReferralEarnings.toFixed(2);
  const totalReferralCount = userData?.totalReferralCount || 0;
  const totalReferralEarnings = availableReferralEarnings;

  if (userLoading || loadingStats) {
    return (
      <Layout className="scroll-smooth no-overscroll">
        <div className="px-6 mt-4 relative z-10">
          <div className="grid grid-cols-2 gap-3">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
          
          {/* Loading referral stats */}
          <div className="mt-4 bg-white rounded-xl p-4 card-shadow">
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-8 animate-pulse"></div>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Loading menu items */}
          <div className="mt-8">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="scroll-smooth no-overscroll">
      {/* Stats Cards */}
      <div className="px-4 mt-4 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          {/* Balance Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Balance</p>
                  <p className="text-2xl font-bold text-blue-900">₹{Math.round(parseFloat(displayBalance))}</p>
                </div>
                <IndianRupee className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Recharge Card */}
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Recharge</p>
                  <p className="text-2xl font-bold text-green-900">₹{Math.round(parseFloat(displayRecharge))}</p>
                </div>
                <Download className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Income Card */}
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Income</p>
                  <p className="text-2xl font-bold text-purple-900">₹{Math.round(parseFloat(displayIncome))}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          {/* Referral Earnings Card */}
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Referral Earnings</p>
                  <p className="text-2xl font-bold text-orange-900">₹{Math.round(parseFloat(displayReferralEarnings))}</p>
                </div>
                <UserPlus className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Referral Stats Summary */}
        <Card className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardContent className="px-2 py-2"  onClick={() => setIsReferralExpanded(!isReferralExpanded)}>
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-indigo-600">Successful Referrals</div>
              <div className="flex items-center space-x-2">
                <div className="text-2xl me-2 font-bold text-indigo-900">{totalReferralCount}</div>
              
              </div>
            </div>
            
            {/* Referral Details Dropdown */}
            {isReferralExpanded && (
            <>
               {/* Withdrawal Section */}
            <div className="border-t border-indigo-200 pt-4 mt-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-semibold text-indigo-800">Transfer to Balance</div>
                <div className="text-sm text-indigo-600 font-medium">
                  Available: ₹{Math.round(parseFloat(displayReferralEarnings))}
                </div>
              </div>
              
              {totalReferralEarnings < 1000 ? (
                <div className="text-xs text-red-600 mb-3 p-2 bg-red-50 rounded-lg border border-red-200">
                  Minimum transfer amount is ₹1000
                </div>
              ) : (
                <div className="text-xs text-orange-600 mb-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                  15% cut will be applied: ₹{Math.round(totalReferralEarnings)} → ₹{Math.round(totalReferralEarnings * 0.85)}
                </div>
              )}
              
              <Button
                onClick={handleWithdrawReferralEarnings}
                disabled={totalReferralEarnings < 1000 || withdrawalLoading}
                className={`w-full h-12 text-sm font-semibold rounded-lg transition-all ${
                  totalReferralEarnings < 1000 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl active:scale-95"
                }`}
              >
                {withdrawalLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Transfer to Balance`
                )}
              </Button>
            </div>
            
            <div className="mt-4 text-xs text-indigo-500 text-center font-medium">
              Earn ₹300 for each referral's FIRST shark purchase only!
            </div>
            </>
            )}
            
          
          </CardContent>
        </Card>
      </div>

      {/* My Management Section */}
      <div className="px-4 mt-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          My Management
        </h2>
        <div className="space-y-3">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            
            if (item.isModal) {
              return (
                <BankDetailsModal key={item.path} onDetailsSelected={() => {}}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </BankDetailsModal>
              );
            }
            
            return (
              <Card key={item.path} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(item.path)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="px-4 mt-8 pb-6">
        <Button
          onClick={handleLogout}
          className="w-full h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-lg font-semibold rounded-lg active:scale-95 transition-all shadow-lg hover:shadow-xl"
        >
          Sign Out
        </Button>
      </div>
    </Layout>
  );
};

export default Profile;
