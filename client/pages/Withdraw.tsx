import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import UserInfo from "@/components/UserInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, ChevronDown } from "lucide-react";

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
    <Layout
      header={
        <Header
          title="My withdrawal"
          showBackButton
          rightElement={
            <button className="text-black p-1 rounded-lg hover:bg-white/10 transition-colors">
              <FileText size={24} />
            </button>
          }
        >
          <UserInfo balance={23.0} className="mt-4 text-black" />
        </Header>
      }
      className="scroll-smooth no-overscroll"
    >
      <div className="px-6 py-6 space-y-6">
        {/* Bank Card Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-readable">
            Bank cards
          </h3>
          <div className="bg-white rounded-lg p-4 flex items-center justify-between card-shadow cursor-pointer hover:bg-gray-50 transition-colors active:scale-98">
            <div className="flex items-center">
              <div className="w-12 h-8 bg-shark-blue rounded flex items-center justify-center mr-3 flex-shrink-0">
                <div className="text-white text-xs font-bold">BANK</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-readable">Solanke</div>
                <div className="text-sm text-gray-600">6025777****</div>
                <div className="text-sm text-gray-600">MAHB0001802</div>
              </div>
            </div>
            <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
          </div>
        </div>

        {/* Withdrawal Form */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-readable">
            Withdrawals
          </h3>
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
                className="h-14 text-lg border-gray-200 e"
              />
              {showError && (
                <div className="mt-2 px-3 py-2 bg-gray-600 text-white text-sm rounded text-readable">
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
                className="h-14 text-lg border-gray-200 "
              />
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleWithdraw}
          className="w-full h-14 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-medium rounded-lg active:scale-98 transition-transform"
        >
          Confirm withdrawal
        </Button>

        <div className="text-right text-sm text-gray-600 text-readable">
          Tax 10%
        </div>

        {/* Withdrawal Rules */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-readable">
            Withdrawal rules
          </h3>
          <div className="space-y-3 text-sm text-gray-700 text-readable">
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
    </Layout>
  );
};

export default Withdraw;
