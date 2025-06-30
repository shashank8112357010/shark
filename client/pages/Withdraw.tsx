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

const Withdraw = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // const { handleStateChange } = useStateChange(); // Unused, can be removed
  const { userData } = useUser();
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false); // Renamed from loading for clarity
  const [pageLoading, setPageLoading] = useState(true); // For initial data load
  // error and success states will be replaced by toasts
  const [limits, setLimits] = useState<any>(null); // Define a proper type later
  const [history, setHistory] = useState<any[]>([]); // Define a proper type later
  // const [showError, setShowError] = useState(false); // Replaced by toasts

  useEffect(() => {
    const fetchWithdrawalData = async () => {
      if (!userData?.phone) {
        setPageLoading(false);
        // Optionally, redirect or show message if user data is essential
        return;
      }
      setPageLoading(true);
      try {
        const limitsRes = await fetch(`/api/withdraw/${userData.phone}/limits`);
        if (!limitsRes.ok) {
          const errorData = await limitsRes.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch withdrawal limits');
        }
        const limitsData = await limitsRes.json();
        // Adapt API response to frontend state if needed, or ensure frontend uses API structure
        // API provides: dailyLimit, dailyWithdrawn, remainingLimit, minimumAmount, maximumAmount (as daily), taxRate, isTimeValid, timeWindow: {start, end}
        // Frontend used: minimumAmount, maximumAmount (as per-tx), dailyLimit, remainingLimit, taxRate, isTimeValid, openTime, closeTime
        // We will use API structure and adapt UI text.
        setLimits({
          ...limitsData,
          // For UI text compatibility if strictly needed, otherwise adapt UI text directly
          openTime: limitsData.timeWindow?.start,
          closeTime: limitsData.timeWindow?.end,
          // maximumAmount from API is daily limit, UI might need a "per transaction max" if different.
          // For now, remainingLimit acts as effective max for validation.
        });

        // Fetch withdrawal history (already using an existing API endpoint)
        // The endpoint in Withdraw.tsx was /api/withdraw/${userData.phone}/history
        // The one in server/routes/withdraw.ts is router.get("/:phone/history", ...)
        // which mounts to /api/withdraw/:phone/history. This is correct.
        const historyRes = await fetch(`/api/withdraw/${userData.phone}/history`);
        if (!historyRes.ok) {
          const errorData = await historyRes.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch withdrawal history');
        }
        const historyData = await historyRes.json();
        setHistory(historyData.history || []); // Assuming historyData.history is the array

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error Loading Page",
          description: error.message || 'Failed to load withdrawal page data.',
        });
        // Set some default/empty state for limits if fetch fails, to prevent UI errors
        setLimits(null);
        setHistory([]);
      } finally {
        setPageLoading(false);
      }
    };

    fetchWithdrawalData();
  }, [userData?.phone, toast]);

  const handleWithdraw = async () => {
    // setShowError(false); // Not needed with toasts
    setSubmitLoading(true);
    try {
      if (!userData?.phone) {
        toast({ variant: "destructive", title: "Error", description: "User not logged in." });
        setSubmitLoading(false);
        return;
      }
      
      const amountNum = Number(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid positive amount." });
        setSubmitLoading(false);
        return;
      }
      
      if (!limits) {
        toast({ variant: "destructive", title: "Error", description: "Withdrawal limits not loaded. Please try again." });
        setSubmitLoading(false);
        return;
      }

      if (amountNum < limits.minimumAmount) {
        toast({ variant: "destructive", title: "Amount Too Low", description: `Minimum withdrawal amount is ₹${limits.minimumAmount}.` });
        setSubmitLoading(false);
        return;
      }

      if (amountNum > limits.remainingLimit) {
        toast({ variant: "destructive", title: "Amount Too High", description: `Maximum withdrawal for now is ₹${limits.remainingLimit}.` });
        setSubmitLoading(false);
        return;
      }

      if (!password) {
        toast({ variant: "destructive", title: "Password Required", description: "Please enter your withdrawal password." });
        setSubmitLoading(false);
        return;
      }

      // TODO: Add check for limits.isTimeValid here if not done by button disabling

      const res = await fetch("/api/wallet/withdraw", { // Ensure this API endpoint is correct
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: userData.phone, amount: amountNum, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Withdrawal failed. Please try again.");
      }

      toast({ title: "Withdrawal Successful", description: `Your request for ₹${amountNum} is being processed.` });

      // Refresh data or navigate
      setAmount("");
      setPassword("");
      // Optionally, refresh limits and history
      // fetchWithdrawalData(); // Or a more targeted refresh
      // const { handleStateChange } = useStateChange(); // This was here, if it updates global state, call it

      // Consider navigating after a short delay or staying on page to show history update
      setTimeout(() => {
         // navigate('/dashboard'); // Or navigate to history or stay
      }, 1500);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Withdrawal Failed", description: error.message || 'An unexpected error occurred.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-6 py-4">
        {pageLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size={48} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Withdrawal Limits */}
            {limits && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-lg mb-3 text-readable">Withdrawal Information</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span>Minimum Amount:</span>
                    <span className="font-medium text-readable">₹{limits.minimumAmount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Max Amount (per transaction):</span>
                    <span className="font-medium text-readable">₹{limits.maximumAmount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Remaining Daily Limit:</span>
                    <span className="font-medium text-shark-blue">₹{limits.remainingLimit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tax Rate:</span>
                    <span className="font-medium text-readable">{limits.taxRate * 100}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Withdrawal Window:</span>
                    <span className={`font-medium ${limits.isTimeValid ? 'text-green-600' : 'text-red-600'}`}>
                      {limits.timeWindow?.start || 'N/A'} - {limits.timeWindow?.end || 'N/A'} {limits.isTimeValid ? '(Open)' : '(Closed)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Withdrawal Form */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 space-y-4">
              <h3 className="font-semibold text-lg mb-3 text-readable">Request Withdrawal</h3>
              {/* Amount Input */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="withdrawAmount">Amount</label>
                <Input
                  id="withdrawAmount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ₹${limits?.minimumAmount || 100}`}
                  className="h-12 text-base border-gray-300 rounded-md focus:ring-shark-blue focus:border-shark-blue"
                  disabled={!limits?.isTimeValid || submitLoading}
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="withdrawPassword">Withdrawal Password</label>
                <div className="relative">
                  <Input
                    id="withdrawPassword"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter withdrawal password"
                    className="h-12 text-base border-gray-300 rounded-md focus:ring-shark-blue focus:border-shark-blue"
                    disabled={!limits?.isTimeValid || submitLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    disabled={!limits?.isTimeValid || submitLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error/Success Messages are now handled by Toasts */}

              {/* Confirm Button */}
              <Button
                onClick={handleWithdraw}
                className="w-full h-12 bg-shark-blue hover:bg-shark-blue-dark text-white text-base font-medium rounded-md active:scale-98 transition-transform flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={!limits?.isTimeValid || submitLoading || !amount || !password}
              >
                {submitLoading ? <LoadingSpinner size={24} /> :
                  (limits && !limits.isTimeValid ? `Window: ${limits.openTime}-${limits.closeTime}` : "Confirm Withdrawal")}
              </Button>
            </div>

            {/* Withdrawal History */}
            <div className="mt-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-readable">Withdrawal History</h3>
              {history.length === 0 ? (
                <div className="text-center py-6 text-gray-500">No withdrawal history found.</div>
              ) : (
                <div className="space-y-3">
                  {history.map((withdrawal, index) => (
                    <div
                      key={index} // Use withdrawal.id if available and unique
                      className="border border-gray-200 rounded-md p-3 flex items-center justify-between text-sm"
                    >
                      <div>
                        <div className="font-semibold text-readable">₹{withdrawal.amount}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(withdrawal.createdAt).toLocaleDateString()} {new Date(withdrawal.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          withdrawal.status === "PENDING" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" :
                          withdrawal.status === "APPROVED" ? "bg-green-100 text-green-800 border border-green-300" :
                          withdrawal.status === "REJECTED" ? "bg-red-100 text-red-800 border border-red-300" :
                          "bg-gray-100 text-gray-800 border border-gray-300"
                        }`}>
                          {withdrawal.status}
                        </span>
                        {withdrawal.tax > 0 && <span className="text-xs text-gray-500">Tax: ₹{withdrawal.tax}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Withdraw;
