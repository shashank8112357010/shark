import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import UserInfo from "@/components/UserInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Clock, DollarSign, History, FileText, ChevronDown } from "lucide-react";
import { useStateChange } from "@/hooks/useStateChange"; // This hook seems unused here
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface WithdrawalLimits {
  dailyLimit: number;
  dailyWithdrawn: number;
  remainingLimit: number;
  minimumAmount: number;
  maximumAmount: number;
  taxRate: number;
  isTimeValid: boolean;
  timeWindow: {
    start: string;
    end: string;
  };
  openTime: string;
  closeTime: string;
}

interface WithdrawalHistory {
  amount: number;
  date: string;
  status: 'success' | 'pending' | 'failed';
  tax: number;
}

const Withdraw = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userData } = useUser();
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [limits, setLimits] = useState<WithdrawalLimits | null>(null);
  const [history, setHistory] = useState<WithdrawalHistory[]>([]);

  const fetchWithdrawalData = async () => {
    setPageLoading(true);
    try {
      if (!userData?.phone) {
        throw new Error("User not logged in");
      }

      const [limitsRes, historyRes] = await Promise.all([
        fetch(`/api/withdraw/${userData.phone}/limits`),
        fetch(`/api/withdraw/${userData.phone}/history`)
      ]);

      if (!limitsRes.ok || !historyRes.ok) {
        const errorData = await limitsRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch withdrawal data');
      }

      const [limitsData, historyData] = await Promise.all([
        limitsRes.json(),
        historyRes.json()
      ]);

      setLimits({
        ...limitsData,
        openTime: limitsData.timeWindow?.start,
        closeTime: limitsData.timeWindow?.end
      });
      setHistory(historyData.history || []);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Loading Page",
        description: error.message || 'Failed to load withdrawal page data.',
      });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawalData();
  }, [userData?.phone, toast]);

  const handleWithdraw = async () => {
    setSubmitLoading(true);
    try {
      if (!userData?.phone) {
        throw new Error("User not logged in");
      }

      const amountNum = Number(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Please enter a valid positive amount");
      }

      if (!password) {
        throw new Error("Please enter your password");
      }

      if (!limits) {
        throw new Error("Please wait for page to load completely");
      }

      if (!limits.isTimeValid) {
        throw new Error(`Withdrawals can only be made between ${limits.openTime} and ${limits.closeTime}`);
      }

      if (amountNum < limits.minimumAmount) {
        throw new Error(`Minimum withdrawal amount is ₹${limits.minimumAmount}`);
      }

      if (amountNum > limits.remainingLimit) {
        throw new Error(`You can withdraw up to ₹${limits.remainingLimit} today`);
      }

      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userData.phone,
          amount: amountNum,
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Withdrawal failed');
      }

      toast({
        title: "Success",
        description: `Withdrawal of ₹${amountNum} initiated successfully.`
      });
      setAmount("");
      setPassword("");
      await fetchWithdrawalData();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: err.message || 'Failed to process withdrawal.'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!userData?.phone) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Not Logged In</h2>
          <p className="text-gray-600 mb-4">Please login to access withdrawal features.</p>
          <Button onClick={() => navigate('/')}>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="px-6 py-6">
        <Header title="Withdraw" />
        <div className="mt-6">
          <div className="bg-white rounded-lg p-6 card-shadow">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Withdrawal Details</h3>
                <div className="space-y-4">
                  {limits && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Available Balance</span>
                        <span className="font-semibold">₹{userData.balance}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Daily Limit</span>
                        <span className="font-semibold">₹{limits.dailyLimit}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Withdrawn Today</span>
                        <span className="font-semibold">₹{limits.dailyWithdrawn}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Remaining Limit</span>
                        <span className="font-semibold">₹{limits.remainingLimit}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Minimum Amount</span>
                        <span className="font-semibold">₹{limits.minimumAmount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tax Rate</span>
                        <span className="font-semibold">{limits.taxRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Withdrawal Window</span>
                        <span className="font-semibold">{limits.openTime} - {limits.closeTime}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Withdrawal Form</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                            setAmount(value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-shark-blue focus:border-shark-blue pl-10"
                        placeholder="Enter amount"
                        disabled={submitLoading || (!limits?.isTimeValid && !pageLoading)}
                        min="0"
                        step="0.01"
                      />
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        placeholder="Enter password"
                        disabled={submitLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={handleWithdraw}
                    disabled={submitLoading}
                    className="w-full"
                  >
                    {submitLoading ? (
                      <>
                        <LoadingSpinner size={16} className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      "Withdraw"
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Withdrawal History</h3>
                <div className="space-y-4">
                  {history.length === 0 ? (
                    <p className="text-gray-500 text-center">No withdrawal history yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-4 rounded-lg"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Amount</span>
                            <span className="font-medium">₹{item.amount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Date</span>
                            <span className="text-sm">{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Status</span>
                            <span className={`px-2 py-1 rounded-full text-sm ${
                              item.status === 'success' ? 'bg-green-100 text-green-800' :
                              item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Withdraw;
