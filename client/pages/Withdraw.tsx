import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileText, ChevronDown } from "lucide-react";

const Withdraw = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) < 124) {
      setShowError(true);
      return;
    }
    // Process withdrawal
    console.log("Processing withdrawal:", amount);
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-shark-blue to-shark-blue-dark px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => navigate(-1)} className="text-white mr-4">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-white text-xl font-semibold">Mywithdrawal</h1>
            </div>
            <button className="text-white">
              <FileText size={24} />
            </button>
          </div>

          {/* User Info */}
          <div className="mt-6 flex items-center">
            <div className="w-12 h-12 bg-shark-blue-dark rounded-lg flex items-center justify-center mr-3">
              <div className="text-white text-lg font-bold italic">S</div>
            </div>
            <div className="text-white">
              <div className="text-lg font-semibold">880****900</div>
              <div className="text-sm opacity-80">₹ 23.00</div>
              <div className="text-xs opacity-70">Current balance</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Bank Card Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Bank cards</h3>
            <div className="bg-white rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-8 bg-shark-blue rounded flex items-center justify-center mr-3">
                  <div className="text-white text-xs font-bold">BANK</div>
                </div>
                <div>
                  <div className="font-medium">Solanke</div>
                  <div className="text-sm text-gray-600">6025777****</div>
                  <div className="text-sm text-gray-600">MAHB0001802</div>
                </div>
              </div>
              <ChevronDown size={20} className="text-gray-400" />
            </div>
          </div>

          {/* Withdrawal Form */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Withdrawals</h3>
            <div className="space-y-4">
              <div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setShowError(false);
                  }}
                  placeholder="Enter amount"
                  className="h-14 text-lg border-gray-200"
                />
                {showError && (
                  <div className="mt-2 px-3 py-2 bg-gray-600 text-white text-sm rounded">
                    Not within the withdrawal time
                  </div>
                )}
              </div>

              <div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="h-14 text-lg border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleWithdraw}
            className="w-full h-14 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-medium rounded-lg"
          >
            Confirm withdrawal
          </Button>

          <div className="text-right text-sm text-gray-600">Tax 10%</div>

          {/* Withdrawal Rules */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Withdrawal rules</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex">
                <span className="font-medium mr-2">1:</span>
                <span>Withdrawal time is 00:30 - 17:00</span>
              </div>
              <div className="flex">
                <span className="font-medium mr-2">2:</span>
                <span>The minimum withdrawal amount is 124.00 rupees</span>
              </div>
              <div className="flex">
                <span className="font-medium mr-2">3:</span>
                <span>
                  Withdrawal on the same day, the money will be credited to the
                  bank card on the same day
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-4">
                (Withdrawals are available every day from Monday to Sunday)
              </div>
            </div>
          </div>
        </div>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default Withdraw;
