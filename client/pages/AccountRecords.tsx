import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
} from "lucide-react";

const AccountRecords = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ALL");

  const transactions = [
    {
      id: 1,
      type: "Recharge",
      status: "Success",
      amount: "+₹1990.00",
      date: "25-06-2025 16:19:26",
      isPositive: true,
    },
    {
      id: 2,
      type: "Withdrawal",
      status: "Success",
      amount: "-₹450",
      date: "26-06-2025 09:21:39",
      isPositive: false,
    },
    {
      id: 3,
      type: "Income",
      status: "Success",
      amount: "+₹523.00",
      date: "26-06-2025 00:01:06",
      isPositive: true,
    },
    {
      id: 4,
      type: "Plan amount",
      status: "Success",
      amount: "-₹1990.00",
      date: "25-06-2025 17:31:29",
      isPositive: false,
    },
  ];

  const getFilteredTransactions = () => {
    if (activeTab === "WITHDRAWALS") {
      return transactions.filter((t) => t.type === "Withdrawal");
    }
    if (activeTab === "RECHARGE") {
      return transactions.filter((t) => t.type === "Recharge");
    }
    return transactions;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "Recharge":
        return <ArrowDownLeft size={24} className="text-gray-600" />;
      case "Withdrawal":
        return <ArrowUpRight size={24} className="text-gray-600" />;
      case "Income":
        return <ArrowDownLeft size={24} className="text-gray-600" />;
      case "Plan amount":
        return <ArrowUpRight size={24} className="text-gray-600" />;
      default:
        return <RotateCcw size={24} className="text-gray-600" />;
    }
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-shark-blue to-shark-blue-dark px-6 py-6">
          <div className="flex items-center mb-6">
            <button onClick={() => navigate(-1)} className="text-white mr-4">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-white text-xl font-semibold">
              Account records
            </h1>
          </div>

          {/* Balance Info */}
          <div className="flex items-center bg-white/10 rounded-lg p-3">
            <div className="w-12 h-12 bg-shark-blue-dark rounded-lg flex items-center justify-center mr-3">
              <div className="text-white text-lg font-bold italic">S</div>
            </div>
            <div className="text-white">
              <div className="text-sm opacity-80">Balance:</div>
              <div className="text-lg font-semibold">23.00</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 mt-6">
          <div className="flex bg-white rounded-lg overflow-hidden shadow-sm">
            {["ALL", "WITHDRAWALS", "RECHARGE"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center font-medium text-sm ${
                  activeTab === tab
                    ? "bg-white text-shark-blue border-b-2 border-shark-blue"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="px-6 mt-6 space-y-3">
          {getFilteredTransactions().map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {transaction.type}
                  </div>
                  <div className="text-sm text-gray-600">
                    {transaction.status}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {transaction.date}
                  </div>
                </div>
              </div>
              <div
                className={`text-lg font-semibold ${
                  transaction.isPositive ? "text-shark-blue" : "text-red-500"
                }`}
              >
                {transaction.amount}
              </div>
            </div>
          ))}
        </div>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default AccountRecords;
