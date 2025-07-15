import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Lock, Key, Users, Eye, EyeOff } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

interface LoginProps {
  forceRegister?: boolean;
  prefillInvite?: string;
}

const Login = ({ forceRegister = false, prefillInvite = "" }: LoginProps) => {
  const navigate = useNavigate();
  const { userData, refreshUserData } = useUser();
  const location = useLocation();

    const [isLogin, setIsLogin] = useState(!forceRegister);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    confirmPassword: "",
    withdrawalPin: "",
    invitationCode: prefillInvite || "",
  });

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showWithdrawalPin, setShowWithdrawalPin] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: formData.phone,
            password: formData.password,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Login failed");
        localStorage.setItem("user", JSON.stringify(data.user));
        refreshUserData();
        navigate("/dashboard");
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        let inviteCode = formData.invitationCode;
        if (formData.phone === "9999857892") {
          inviteCode = inviteCode || "admincode";
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: formData.phone,
            password: formData.password,
            withdrawalPassword: formData.withdrawalPin,
            inviteCode,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Registration failed");
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsLogin(true);
      }
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
    <div className="mobile-container relative">
      <div className="flex-1 overflow-y-auto scroll-smooth no-overscroll">
        <div>
          <video
            src="/shark.mp4"
            autoPlay
            loop
            muted
            className=" w-full h-50 object-cover"
          />
        </div>
        <div className="px-6 py-6 space-y-6 min-h-full flex flex-col">
          <div>
            <label className="block text-gray-800 text-sm font-medium mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-shark-blue"
                size={18}
              />
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="h-12 pl-10 pr-4 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-shark-blue focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-800 text-sm font-medium mb-2">
              Enter Login Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-shark-blue"
                size={18}
              />
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="h-12 pl-10 pr-12 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-shark-blue focus:border-transparent"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-shark-blue"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-shark-blue text-sm font-medium hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-gray-800 text-sm font-medium mb-2">
                  Confirm The Login Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-shark-blue"
                    size={18}
                  />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="h-12 pl-10 pr-12 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-shark-blue focus:border-transparent"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-shark-blue"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-800 text-sm font-medium mb-2">
                  Enter The Withdrawal PIN
                </label>
                <div className="relative">
                  <Key
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-shark-blue"
                    size={18}
                  />
                  <Input
                    type={showWithdrawalPin ? "text" : "password"}
                    name="withdrawalPin"
                    value={formData.withdrawalPin}
                    onChange={handleInputChange}
                    className="h-12 pl-10 pr-12 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-shark-blue focus:border-transparent"
                    placeholder="Enter withdrawal PIN"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWithdrawalPin(!showWithdrawalPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-shark-blue"
                  >
                    {showWithdrawalPin ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-800 text-sm font-medium mb-2">
                  Invitation Code
                </label>
                <div className="relative">
                  <Users
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-shark-blue"
                    size={18}
                  />
                  <Input
                    type="text"
                    name="invitationCode"
                    value={formData.invitationCode}
                    onChange={handleInputChange}
                    className="h-12 pl-10 pr-4 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-shark-blue focus:border-transparent"
                    placeholder="Invitation code"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-4 mt-8 pb-6 safe-area-bottom">
            {isLogin ? (
              <>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-14 bg-shark-blue text-white text-lg font-medium"
                >
                  {loading ? "Logging in..." : "LOGIN"}
                </Button>
                <button
                  onClick={() => setIsLogin(false)}
                  className="w-full text-shark-blue text-base font-medium py-3"
                >
                  Don’t have an account? REGISTER
                </button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-14 bg-shark-blue text-white text-lg font-medium"
                >
                  {loading ? "Registering..." : "REGISTER"}
                </Button>
                <button
                  onClick={() => setIsLogin(true)}
                  className="w-full text-shark-blue text-base font-medium py-3"
                >
                  Already have an account? LOGIN
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
