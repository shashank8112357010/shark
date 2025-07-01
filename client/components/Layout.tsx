import { ReactNode, memo } from "react";
import BottomNavigation from "./BottomNavigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import UserInfo from "@/components/UserInfo";

interface LayoutProps {
  children: ReactNode;
  header?: ReactNode;
  hideBottomNav?: boolean;
  className?: string;
}

const Layout = ({
  children,
  header,
  hideBottomNav = false,
  className,
}: LayoutProps) => {
  const { userData, loading, refreshUserData } = useUser();
  const user = userData || null;
  const balance = userData?.balance || 0;
  const currentReferrals = userData?.referrer ? 1 : 0;


  return (
    <div className="mobile-container">
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 text-black relative z-30">
          <div className="relative h-48 bg-gradient-to-br from-shark-blue to-shark-blue-dark overflow-hidden">
            {/* Background video */}
            <video
              className="absolute inset-0 w-full h-full object-cover z-0"
              src="/shark.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
            {/* Background pattern overlays video */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-cyan-400/50 z-10"></div>

            {/* Shark branding */}
            <div className="absolute bottom-6 left-6 z-20">
              <div className="text-white text-4xl font-bold italic">Shark</div>
              <div className="text-white/80 text-base">Ocean Investment</div>
            </div>
            {/* User Info */}
            <div className="absolute top-6 right-6 z-20">
              {userData && <UserInfo
                phone={userData.phone.replace(/^[\d]{2}(\d{6})\d{2}$/, '$1****$3')}
                balance={balance}
                referrals={currentReferrals}
                loading={loading}
              />}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden",
            "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
            className,
          )}
        >
          <div className="min-h-full">{children}</div>
        </div>

        {/* Fixed Bottom Navigation */}
        {!hideBottomNav && (
          <div className="flex-shrink-0 relative z-10">
            <BottomNavigation />
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout
