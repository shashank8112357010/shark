import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import {
  Building2,
  FileText,
  Package,
  CreditCard,
  IndianRupee,
  Download,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: Building2,
      label: "Company Profile",
      path: "/company-profile",
      active: true,
    },
    { icon: FileText, label: "Account Record", path: "/account-records" },
    { icon: Package, label: "My Collection", path: "/my-collection" },
    { icon: CreditCard, label: "My bank and password", path: "/bank-info" },
  ];

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-shark-blue to-shark-blue-dark px-6 py-8">
          {/* Shark Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-shark-blue-dark rounded-xl flex items-center justify-center">
              <div className="text-white text-2xl font-bold italic">S</div>
            </div>
          </div>

          {/* User ID */}
          <div className="text-center">
            <div className="text-white text-lg font-medium">LV2:8800738900</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 -mt-4 relative z-10">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="flex items-center justify-center mb-2">
                <IndianRupee size={20} className="text-shark-blue" />
                <span className="text-shark-blue font-semibold">23.00</span>
              </div>
              <div className="text-gray-600 text-sm">Balance</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="flex items-center justify-center mb-2">
                <Download size={20} className="text-shark-blue" />
                <span className="text-shark-blue font-semibold">1990</span>
              </div>
              <div className="text-gray-600 text-sm">Recharge</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp size={20} className="text-shark-blue" />
                <span className="text-shark-blue font-semibold">523</span>
              </div>
              <div className="text-gray-600 text-sm">Income</div>
            </div>
          </div>
        </div>

        {/* My Management Section */}
        <div className="px-6 mt-8">
          <h2 className="text-lg font-semibold mb-4">My management</h2>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full bg-white rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Icon
                      size={24}
                      className={
                        item.active ? "text-shark-blue" : "text-gray-500"
                      }
                    />
                    <span
                      className={`ml-3 font-medium ${
                        item.active ? "text-shark-blue" : "text-gray-700"
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
        <div className="px-6 mt-8">
          <Button
            onClick={handleLogout}
            className="w-full h-14 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-medium rounded-lg"
          >
            Sign Out
          </Button>
        </div>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default Profile;
