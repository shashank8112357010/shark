import { Button } from "@/components/ui/button";

interface PlanCardProps {
  title: string;
  image: string;
  price: number;
  total: number;
  daily: number;
  endDay: number;
  isVip?: boolean;
  onBuy: () => void;
}

const PlanCard = ({
  title,
  image,
  price,
  total,
  daily,
  endDay,
  isVip = false,
  onBuy,
}: PlanCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>

        {/* Plan Image */}
        <div className="relative mb-4">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>

        {/* Plan Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-gray-600 text-sm">Price:</div>
            <div className="text-lg font-semibold">₹{price}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm">Total:</div>
            <div className="text-lg font-semibold">₹{total}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm">Daily:</div>
            <div className="text-lg font-semibold">₹{daily}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm">End day:</div>
            <div className="text-lg font-semibold">{endDay} day</div>
          </div>
        </div>

        {/* Buy Button */}
        <Button
          onClick={onBuy}
          className={`w-full h-12 text-white font-medium rounded-lg ${
            isVip
              ? "bg-shark-blue-dark hover:bg-shark-blue"
              : "bg-shark-blue hover:bg-shark-blue-dark"
          }`}
        >
          {isVip ? "Pre-sale" : "Buy now"}
        </Button>
      </div>
    </div>
  );
};

export default PlanCard;
