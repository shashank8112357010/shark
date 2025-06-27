import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Recharge = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("1000");
  const [selectedMethod, setSelectedMethod] = useState("Recharge X");

  const rechargeMethods = [
    "Recharge X",
    "Recharge C",
    "Recharge N",
    "Recharge-S",
    "Recharge R",
  ];

  const handleRecharge = () => {
    // Process recharge
    console.log("Processing recharge:", amount, selectedMethod);
    // Navigate to payment gateway or confirmation
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-shark-blue to-shark-blue-dark px-6 py-6">
          {/* User Info */}
          <div className="flex items-center">
            <div className="w-12 h-12 bg-shark-blue-dark rounded-lg flex items-center justify-center mr-3">
              <div className="text-white text-lg font-bold italic">S</div>
            </div>
            <div className="text-white">
              <div className="text-lg font-semibold">880****900</div>
              <div className="text-sm opacity-80">₹ 0</div>
              <div className="text-xs opacity-70">Current balance</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Amount Input */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recharge</h3>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-16 text-xl text-center border-gray-300 rounded-lg"
              placeholder="Enter amount"
            />
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Please choose the pay method
            </h3>
            <div className="space-y-3">
              {rechargeMethods.map((method) => (
                <label
                  key={method}
                  className="flex items-center justify-between bg-white rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                >
                  <span className="text-lg">{method}</span>
                  <input
                    type="radio"
                    name="rechargeMethod"
                    value={method}
                    checked={selectedMethod === method}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="w-6 h-6 text-shark-blue border-2 border-gray-300 focus:ring-shark-blue"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleRecharge}
            className="w-full h-14 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-medium rounded-lg"
          >
            Confirm Recharge
          </Button>

          {/* Recharge Rules */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recharge Rules</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span>
                  Confirm the recharge amount and fill in the UTR number
                  correctly
                </span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span>
                  Every time you recharge, you need to re-acquire the receiving
                  account at the cashier.
                </span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span>
                  For recharge questions, please contact onlinecustomer service.
                </span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span>
                  All funds for the project are regulated by the Indian
                  government bank.
                </span>
              </div>
            </div>
          </div>
        </div>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default Recharge;
