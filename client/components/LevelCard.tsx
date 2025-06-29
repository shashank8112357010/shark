import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface LevelCardProps {
  level: number;
  title: string;
  image: string;
  price: number;
  total: number;
  daily: number;
  endDay: number;
  isUnlocked: boolean;
  referralsNeeded?: number;
  currentReferrals?: number;
  reward: number;
  onBuy: () => void;
  onViewRequirements: () => void;
}

const LevelCard = ({
  level,
  title,
  image,
  price,
  total,
  daily,
  endDay,
  isUnlocked,
  referralsNeeded = 0,
  currentReferrals = 0,
  reward,
  onBuy,
  onViewRequirements,
}: LevelCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 relative group">
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-all duration-700 z-10"></div>

      {/* Lock Overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center rounded-lg">
          <div className="text-center text-white p-3">
            <Lock size={24} className="mx-auto mb-2" />
            <div className="text-sm font-semibold mb-1">
              Level {level} Locked
            </div>
            <div className="text-xs mb-1">Need {referralsNeeded} referrals</div>
            <div className="text-xs">
              Current: {currentReferrals}/{referralsNeeded}
            </div>
            <div className="text-xs font-medium text-yellow-400 mt-1">
              Unlock: ₹{reward}
            </div>
          </div>
        </div>
      )}

      <div className="p-3">
        <h3 className="text-base font-semibold text-center mb-3">{title}</h3>

        {/* Shark Image */}
        <div className="relative mb-3">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fe36160fc8bd54c9783cfff90fa384ec7?format=webp&width=800"
            alt="Shark"
            className="w-full h-32 object-cover rounded-md"
          />
        </div>

        {/* Plan Details */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-gray-600 text-xs">Price:</div>
            <div className="text-sm font-semibold">₹{price}</div>
          </div>
          <div>
            <div className="text-gray-600 text-xs">Total:</div>
            <div className="text-sm font-semibold">₹{total}</div>
          </div>
          <div>
            <div className="text-gray-600 text-xs">Daily:</div>
            <div className="text-sm font-semibold">₹{daily}</div>
          </div>
          <div>
            <div className="text-gray-600 text-xs">End day:</div>
            <div className="text-sm font-semibold">{endDay} day</div>
          </div>
        </div>

        {/* Action Button */}
        {/* For Level 5, show disabled locked button */}
        {level === 5 ? (
          <Button
            disabled
            className="w-full h-10 bg-gray-400 text-white font-medium rounded-md text-sm opacity-70 cursor-not-allowed"
          >
            Locked
          </Button>
        ) : isUnlocked ? (
          <Button
            onClick={onBuy}
            className="w-full h-10 bg-shark-blue hover:bg-shark-blue-dark text-white font-medium rounded-md text-sm"
          >
            Buy now
          </Button>
        ) : (
          <Button
            onClick={onViewRequirements}
            variant="outline"
            className="w-full h-10 border-shark-blue text-shark-blue hover:bg-shark-blue hover:text-white font-medium rounded-md text-sm"
          >
            View Requirements
          </Button>
        )}
      </div>
    </div>
  );
};

export default LevelCard;
