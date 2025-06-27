import { Home, Smartphone, Share2, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/invite", icon: Share2, label: "Invite" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="bg-white border-t border-gray-200 px-2 py-1 z-50 flex-shrink-0">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center py-1 px-1 rounded-lg transition-all",
                isActive
                  ? "text-shark-blue"
                  : "text-gray-600 hover:text-gray-800",
              )}
            >
              <Icon size={14} />
              <span className="text-xs mt-0.5">{item.label}</span>
              {isActive && (
                <div className="w-4 h-0.5 bg-shark-blue rounded-full mt-0.5"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
