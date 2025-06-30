import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import UserInfo from "@/components/UserInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Clock, DollarSign, History, FileText, ChevronDown } from "lucide-react";
import { useStateChange } from "@/hooks/useStateChange";
import { useUser } from "@/contexts/UserContext";

const Withdraw = () => {
  const navigate = useNavigate();
  const { handleStateChange } = useStateChange();
  const { userData } = useUser();
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [limits, setLimits] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const fetchWithdrawalData = async () => {
      if (!userData?.phone) return;

      try {
        // Fetch withdrawal limits
 
        // Fetch withdrawal history
        const historyRes = await fetch(`/api/withdraw/${userData.phone}/history`);
        const historyData = await historyRes.json();
        setHistory(historyData.history || []);
      } catch (error) {
        console.error('Failed to fetch withdrawal data:', error);
      }
    };

    fetchWithdrawalData();
  }, [userData?.phone]);

  const handleWithdraw = async () => {
    setShowError(false);
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (!userData?.phone) throw new Error("User not logged in");
      
      // Validate amount
      const amountNum = Number(amount);
      if (isNaN(amountNum)) {
        throw new Error("Please enter a valid amount");
      }
      
      if (amountNum < (limits?.minimumAmount || 124)) {
        setShowError(true);
        throw new Error(`Minimum withdrawal amount is ₹${limits?.minimumAmount || 124}`);
      }

      if (amountNum > (limits?.remainingLimit || limits?.maximumAmount)) {
        throw new Error(`Maximum withdrawal amount is ₹${limits?.remainingLimit || limits?.maximumAmount}`);
      }

      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: userData.phone, amount, password }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Withdrawal failed");

      handleStateChange();
      navigate('/dashboard');
    } catch (error) {
      console.error('Withdraw failed:', error);
      setError('Withdraw failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
     
    >
      <div className="px-6 py-4">
        <div className="space-y-4">
          {/* Withdrawal Limits */}
          {limits && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-medium mb-2">Withdrawal Limits</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Minimum Amount</span>
                  <span>₹{limits.minimumAmount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Maximum Amount</span>
                  <span>₹{limits.remainingLimit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Daily Limit</span>
                  <span>₹{limits.dailyLimit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax Rate</span>
                  <span>{limits.taxRate * 100}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Withdrawal Form */}
          <div className="space-y-4">
            {/* Amount Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-14 text-lg border-gray-200 "
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Withdrawal Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter withdrawal password"
                  className="h-14 text-lg border-gray-200 "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            {/* Success Message */}
            {success && (
              <div className="text-green-500 text-sm">{success}</div>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleWithdraw}
              className="w-full h-14 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-medium rounded-lg active:scale-98 transition-transform"
              // disabled={!limits?.isTimeValid}
            >
              {limits?.isTimeValid ? "Confirm withdrawal" : "Withdrawal time window closed"}
            </Button>
          </div>

          {/* Withdrawal History */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Withdrawal History</h3>
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No withdrawal history</div>
            ) : (
              <div className="space-y-4">
                {history.map((withdrawal, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">₹{withdrawal.amount}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(withdrawal.createdAt).toLocaleDateString()} at
                        {new Date(withdrawal.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        withdrawal.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                        withdrawal.status === "APPROVED" ? "bg-green-100 text-green-700" :
                        withdrawal.status === "REJECTED" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {withdrawal.status}
                      </span>
                      <span className="text-sm text-gray-500">Tax: ₹{withdrawal.tax}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Withdraw;
