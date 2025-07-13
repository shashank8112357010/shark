import { Home, Smartphone, Wallet, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/recharge", icon: Smartphone, label: "Recharge" },
    { path: "/withdraw", icon: Wallet, label: "Withdraw" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="bg-white border-t  border-gray-200 px-2 pt-2 z-50 flex-shrink-0 safe-area-bottom">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex cursor-pointer flex-col items-center  px-3 rounded-lg transition-all active:scale-95 ",
                "min-h-9 min-w-9", // Ensure 44px+ touch target
                isActive
                  ? "text-shark-blue"
                  : "text-gray-600 hover:text-gray-800",
              )}
            >
              <Icon size={16} />
              <span className="text-xs mt-1 p-0 text-readable">{item.label}</span>
              {isActive && (
                <div className="w-4  font-bold bg-shark-blue rounded-full mt-1"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
