import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner"; // Import spinner
import { Lock } from "lucide-react";

interface LevelCardProps {
  level: number;
  title: string;
  image: string;
  price: number;
  total: number;
  daily: number;
  endDay: number;
  onBuy: () => void;
  buyLoading?: boolean;
}

const LevelCard = ({
  level,
  title,
  image,
  price,
  total,
  daily,
  endDay,
  onBuy,
  buyLoading = false,
}: LevelCardProps) => {
  console.log("hey 1 " +  price);
  
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 relative group">
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-all duration-700 z-10"></div>
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

        <Button
          onClick={onBuy}
          disabled={buyLoading}
          className="w-full h-10 bg-shark-blue hover:bg-shark-blue-dark text-white font-medium rounded-md text-sm flex items-center justify-center"
        >
          {buyLoading ? <LoadingSpinner size={20} /> : "Buy now"}
        </Button>
      </div>
    </div>
  );
};

export default LevelCard;
  