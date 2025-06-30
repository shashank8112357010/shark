import { memo } from "react";

interface UserInfoProps {
  phone: string;
  balance: number;
  referrals: number;
  loading: boolean;
  className?: string;
}

const UserInfo = ({
  phone,
  balance,
  referrals,
  loading,
  className = "",
}: UserInfoProps) => {
  return (
    <div className={`bg-white/80 rounded-lg px-3 py-1 text-black text-xs font-semibold ${className}`}>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {phone.replace(/^\d{2}(\d{6})\d{2}$/, '$1****$3')} | ₹{balance}
          <div className="text-gray-400 text-xs">Referrals: {referrals}</div>
        </>
      )}
    </div>
  );
};

export default memo(UserInfo, (prevProps, nextProps) => {
  return (
    prevProps.phone === nextProps.phone &&
    prevProps.balance === nextProps.balance &&
    prevProps.referrals === nextProps.referrals &&
    prevProps.loading === nextProps.loading &&
    prevProps.className === nextProps.className
  );
});
