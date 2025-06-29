import { ReactNode } from "react";
import BottomNavigation from "./BottomNavigation";
import { cn } from "@/lib/utils";

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
  return (
    <div className="mobile-container">
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        {header && <div className="flex-shrink-0 text-black relative z-20">{header}</div>}

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
          <div className="flex-shrink-0 relative z-20">
            <BottomNavigation />
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
