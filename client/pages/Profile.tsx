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
  const { userData, loading: userLoading, error: userError } = useUser();
  const { handleStateChange } = useStateChange();

  const [totalRecharge, setTotalRecharge] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0); // Primarily referral income
  const [loadingStats, setLoadingStats] = useState(false);

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
        // Fetch all stats from the new endpoint
        const statsResponse = await fetch(`/api/wallet/stats/${userData.phone}`);
        if (!statsResponse.ok) {
          const errorData = await statsResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch profile statistics");
        }
        const statsData = await statsResponse.json();

        setTotalRecharge(statsData.totalRecharge || 0);
        // Assuming "Income" on the profile page primarily refers to referral earnings
        setTotalIncome(statsData.totalReferralEarnings || 0);

        // If other types of income need to be summed, adjust here or in backend
        // For example, if there were 'EARNINGS' from plans as a separate transaction type:
        // const otherEarnings = backendTransactions
        //   .filter(tx => tx.type === BackendTransactionType.EARNING) // Assuming an EARNING type
        //   .reduce((sum, tx) => sum + tx.amount, 0);
        // setTotalIncome((statsData.totalReferralEarnings || 0) + otherEarnings);

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
    }
  }, [userData, userLoading, userError, toast]);

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

  return (
    <Layout className="scroll-smooth no-overscroll">
      {/* Stats Cards */}
      <div className="px-6 mt-4 relative z-10">
        <div className="grid grid-cols-3 gap-3">
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
