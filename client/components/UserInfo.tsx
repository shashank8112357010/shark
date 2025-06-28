interface UserInfoProps {
  phoneNumber?: string;
  balance?: number;
  avatarText?: string;
  className?: string;
}

const UserInfo = ({
  phoneNumber = "880****900",
  balance = 0,
  avatarText = "S",
  className = "",
}: UserInfoProps) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="w-12 h-12 bg-shark-blue-dark rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
        <div className="text-white text-lg font-bold italic">{avatarText}</div>
      </div>
      <div className="text-white min-w-0 flex-1">
        <div className="text-lg font-semibold truncate">{phoneNumber}</div>
        <div className="text-sm opacity-90">
          ₹ {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
        <div className="text-xs opacity-70">Current balance</div>
      </div>
    </div>
  );
};

export default UserInfo;
