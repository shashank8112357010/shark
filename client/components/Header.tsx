import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  children?: ReactNode;
  showBackButton?: boolean;
  rightElement?: ReactNode;
  className?: string;
}

const Header = ({
  title,
  children,
  showBackButton = false,
  rightElement,
  className,
}: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-shark-blue to-shark-blue-dark",
        "px-6 py-6 text-white",
        className,
      )}
    >
      {/* Top Row with Navigation */}
      {(title || showBackButton || rightElement) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="text-white mr-4 p-1 -ml-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            {title && <h1 className="text-xl font-semibold">{title}</h1>}
          </div>
          {rightElement && <div className="text-white">{rightElement}</div>}
        </div>
      )}

      {/* Custom Header Content */}
      {children}
    </div>
  );
};

export default Header;
