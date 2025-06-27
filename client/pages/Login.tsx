import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Lock, Key, Users } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    confirmPassword: "",
    withdrawalPin: "",
    invitationCode: "1a6jd",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    // Mock login/register logic
    navigate("/dashboard");
  };

  return (
    <div className="mobile-container">
      <div className="h-screen bg-gray-50 overflow-hidden">
        {/* Header with Shark branding */}
        <div className="bg-gradient-to-br from-shark-blue to-shark-blue-dark px-4 py-6 rounded-b-2xl">
          <div className="text-center">
            <div className="bg-shark-blue-dark px-4 py-2 rounded-lg inline-block mb-2">
              <div className="text-white text-3xl font-bold italic">Shark</div>
            </div>
            <div className="text-white/80 text-sm">Dive Deep, Earn More</div>
          </div>
        </div>

        <div className="px-4 py-3 space-y-3 flex-1 max-h-[calc(100vh-120px)]">
          {/* Phone Number */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-shark-blue"
                size={16}
              />
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="pl-10 h-10 bg-gray-100 border-0 rounded-lg text-sm"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {/* Login Password */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Enter Login Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-shark-blue"
                size={16}
              />
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 h-10 bg-gray-100 border-0 rounded-lg text-sm"
                placeholder="Enter password"
              />
            </div>
          </div>

          {/* Confirm Password (only for registration) */}
          {!isLogin && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Confirm The Login Pass
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-shark-blue"
                  size={16}
                />
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 h-10 bg-gray-100 border-0 rounded-lg text-sm"
                  placeholder="Confirm password"
                />
              </div>
            </div>
          )}

          {/* Withdrawal PIN (only for registration) */}
          {!isLogin && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Enter The Withdrawal PIN
              </label>
              <div className="relative">
                <Key
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-shark-blue"
                  size={16}
                />
                <Input
                  type="password"
                  name="withdrawalPin"
                  value={formData.withdrawalPin}
                  onChange={handleInputChange}
                  className="pl-10 h-10 bg-gray-100 border-0 rounded-lg text-sm"
                  placeholder="Enter withdrawal PIN"
                />
              </div>
            </div>
          )}

          {/* Invitation Code */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Invitation Code
            </label>
            <div className="relative">
              <Users
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-shark-blue"
                size={16}
              />
              <Input
                type="text"
                name="invitationCode"
                value={formData.invitationCode}
                onChange={handleInputChange}
                className="pl-10 h-10 bg-gray-100 border-0 rounded-lg text-sm"
                placeholder="Invitation code"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-6">
            {!isLogin ? (
              <>
                <Button
                  onClick={handleSubmit}
                  className="w-full h-10 bg-shark-blue hover:bg-shark-blue-dark text-white text-sm font-medium rounded-lg"
                >
                  REGISTER
                </Button>
                <button
                  onClick={() => setIsLogin(true)}
                  className="w-full text-shark-blue text-sm font-medium"
                >
                  LOGIN
                </button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSubmit}
                  className="w-full h-10 bg-shark-blue hover:bg-shark-blue-dark text-white text-sm font-medium rounded-lg"
                >
                  LOGIN
                </Button>
                <button
                  onClick={() => setIsLogin(false)}
                  className="w-full text-shark-blue text-sm font-medium"
                >
                  REGISTER
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
