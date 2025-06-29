import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import UserInfo from "@/components/UserInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Recharge = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("1000");
  const [selectedMethod, setSelectedMethod] = useState("Recharge X");

  const rechargeMethods = [
    "500",
    "1000",
    "2000",
    "5000",
  ];

  const handleRecharge = () => {
    // Process recharge
    console.log("Processing recharge:", amount, selectedMethod);
    // Navigate to payment gateway or confirmation
  };

  return (
    <Layout 
      header={
        <Header title="Recharge" showBackButton>
          <UserInfo className="text-black" balance={0} />
        </Header>
      }
      className="scroll-smooth no-overscroll"
    >
      <div className="px-6 py-6 space-y-6">
        {/* Amount Input */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-readable">Recharge</h3>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-16 text-xl text-center border-gray-300 rounded-lg "
            placeholder="Enter amount"
          />
        </div>

        {/* Payment Method Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-readable">
            Please choose the pay method
          </h3>
          <div className="space-y-3">
            {rechargeMethods.map((method) => (
              <label
                key={method}
                className="flex items-center justify-between bg-white rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors card-shadow active:scale-98"
              >
                <span className="text-lg text-readable">{method}</span>
                <input
                  type="radio"
                  name="rechargeMethod"
                  value={method}
                  checked={selectedMethod === method}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="w-6 h-6 text-shark-blue border-2 border-gray-300 focus:ring-shark-blue "
                />
              </label>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleRecharge}
          className="w-full h-14 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-medium rounded-lg active:scale-98 transition-transform"
        >
          Confirm Recharge
        </Button>

        {/* Recharge Rules */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-readable">
            Recharge Rules
          </h3>
          <div className="space-y-3 text-sm text-gray-700 text-readable">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
              <span>
                Confirm the recharge amount and fill in the UTR number correctly
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
                All funds for the project are regulated by the Indian government
                bank.
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Recharge;
