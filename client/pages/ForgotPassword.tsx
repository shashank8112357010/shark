import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Lock, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import  LoadingSpinner  from "@/components/ui/LoadingSpinner";


const ForgotPassword = () => {
  const navigate = useNavigate();
  const [forgotPasswordData, setForgotPasswordData] = useState({
    phone: "",
    withdrawalPin: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForgotPasswordData({
      ...forgotPasswordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmNewPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: forgotPasswordData.phone,
          withdrawalPin: forgotPasswordData.withdrawalPin,
          newPassword: forgotPasswordData.newPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Password reset failed");
      
      toast({
        title: "Success",
        description: "Password reset successfully",
      });
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container relative" style={{zIndex: 1}}>
 
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden relative" style={{zIndex: 1}}>
     <div>
          <video
            src="/shark.mp4"
            autoPlay
            loop
            muted
            className=" w-full h-50 object-cover"
          />
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth no-overscroll">
          <div className="px-6 py-6 space-y-6 min-h-full flex flex-col">
            <div>
              <label className="block text-gray-800 text-sm font-medium mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-shark-blue" size={18} />
                <Input
                  type="tel"
                  name="phone"
                  value={forgotPasswordData.phone}
                  onChange={handleInputChange}
                  className="h-12 pl-10 pr-4 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-shark-blue focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-800 text-sm font-medium mb-2">
                Withdrawal PIN
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-shark-blue" size={18} />
                <Input
                  type="password"
                  name="withdrawalPin"
                  value={forgotPasswordData.withdrawalPin}
                  onChange={handleInputChange}
                  className="h-12 pl-10 pr-4 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-shark-blue focus:border-transparent"
                  placeholder="Enter withdrawal PIN"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-800 text-sm font-medium mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-shark-blue" size={18} />
                <Input
                  type="password"
                  name="newPassword"
                  value={forgotPasswordData.newPassword}
                  onChange={handleInputChange}
                  className="h-12 pl-10 pr-4 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-shark-blue focus:border-transparent"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-800 text-sm font-medium mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-shark-blue" size={18} />
                <Input
                  type="password"
                  name="confirmNewPassword"
                  value={forgotPasswordData.confirmNewPassword}
                  onChange={handleInputChange}
                  className="h-12 pl-10 pr-4 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-shark-blue focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="space-y-4 mt-8 pb-6 safe-area-bottom">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-14 bg-shark-blue text-white text-lg font-medium"
              >
                {loading ? <LoadingSpinner /> : "Reset Password"}
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
