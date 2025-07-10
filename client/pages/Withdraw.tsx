import { useState, useEffect, useCallback } from "react"; // Added useCallback
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
// import UserInfo from "@/components/UserInfo"; // UserInfo is part of Layout, not directly used here
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react"; // Removed unused icons from here
// import { useStateChange } from "@/hooks/useStateChange"; // This hook was unused here
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
  paymentUtr?: string;
  createdAt ? : string ;
}

const Withdraw = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userData, loading: userLoading } = useUser();
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [limits, setLimits] = useState<WithdrawalLimits | null>(null);
  const [history, setHistory] = useState<WithdrawalHistory[]>([]);
  const [upiId, setUpiId] = useState("");

  // Using useCallback for fetchWithdrawalData in case it's needed by other parts, though primarily for useEffect here.
  const fetchWithdrawalDataCallback = useCallback(async () => {
    if (!userData?.phone) {
      // This case should ideally be handled by the useEffect not running,
      // or by the top-level "Not Logged In" guard in the component's return.
      // However, if called directly, this check is useful.
      setPageLoading(false); // Ensure loading stops if called when no user.
      toast({
          variant: "destructive",
          title: "User Not Available",
          description: "Cannot fetch withdrawal data without user information.",
      });
      return;
    }

    setPageLoading(true);
    try {
      const [limitsRes, historyRes] = await Promise.all([
        fetch(`/api/withdraw/${userData.phone}/limits`),
        fetch(`/api/withdraw/${userData.phone}/history`)
      ]);

      let errorMessages: string[] = [];

      if (!limitsRes.ok) {
        let errData;
        try {
          errData = await limitsRes.json();
        } catch {
          errData = { error: "Server error or not JSON" };
        }
        errorMessages.push(`Limits: ${errData.error || limitsRes.statusText}`);
      }
      if (!historyRes.ok) {
        let errData;
        try {
          errData = await historyRes.json();
        } catch {
          errData = { error: "Server error or not JSON" };
        }
        errorMessages.push(`History: ${errData.error || historyRes.statusText}`);
      }

      if (errorMessages.length > 0) {
        throw new Error(errorMessages.join("; "));
      }

      const limitsData = await limitsRes.json();
      const historyData = await historyRes.json();

      setLimits({
        ...limitsData,
        openTime: limitsData.timeWindow?.start,
        closeTime: limitsData.timeWindow?.end,
      });
      setHistory(historyData.history || []);
      
      // Auto-fill UPI ID if saved
      if (limitsData.savedUpiId && !upiId) {
        setUpiId(limitsData.savedUpiId);
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Loading Withdrawal Page",
        description: error.message || 'Could not load necessary data.',
      });
      setLimits(null);
      setHistory([]);
    } finally {
      setPageLoading(false);
    }
  }, [userData, toast]); // userData dependency ensures it re-runs if user logs in/out


  useEffect(() => {
    if (userData?.phone) {
      // User is logged in, fetch withdrawal data
      fetchWithdrawalDataCallback();
    } else {
      // User context loaded but no user data, stop loading
      setPageLoading(false);
    }
  }, [userData, fetchWithdrawalDataCallback, userLoading]);

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

      if (!upiId || upiId.length < 5) {
        throw new Error("Please enter a valid UPI ID");
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

      const res = await fetch('/api/withdraw/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userData.phone,
          amount: amountNum,
          password,
          upiId
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
      // Don't clear UPI ID as it should be saved for next time
      await fetchWithdrawalDataCallback();
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

  // if (pageLoading || userLoading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <LoadingSpinner size={32} />
  //     </div>
  //   );
  // }

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
        {/* <Header title="Withdraw" /> */}
        {/* Disclaimer for withdrawal window */}
        {/* {!limits?.isTimeValid && (
          <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
            Withdrawals are currently closed. You can withdraw from <b>8:00 AM</b> to <b>10:00 PM IST</b> (Monday to Friday only).
          </div>
        )} */}
        <div className="mt-6">
          <div className=" rounded-lg p-6 card-shadow">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold te mb-4">Withdrawal Details</h3>
                <div className="space-y-4">
                   <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Minimum Amount</span>
                        <span className="font-semibold">₹{limits?.minimumAmount || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tax Rate</span>
                        <span className="font-semibold">15%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Withdrawal Window</span>
                        <span className="font-semibold">{limits?.openTime} - {limits?.closeTime}</span>
                      </div>
                    </>
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
                    <label className="block text-sm font-medium mb-1">UPI ID</label>
                    <Input
                      type="text"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="Enter your UPI ID"
                      disabled={submitLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">Your UPI ID will be saved for future withdrawals</p>
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
                            <span className="text-sm"> {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
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
                          {item.paymentUtr && (
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-sm text-gray-600">UTR Number</span>
                              <span className="text-sm font-mono">{item.paymentUtr}</span>
                            </div>
                          )}
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
