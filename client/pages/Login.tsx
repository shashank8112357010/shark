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
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Header with Shark branding - Fixed */}
        <div className="bg-gradient-to-br from-shark-blue to-shark-blue-dark px-6 py-8 flex-shrink-0 safe-area-top">
          <div className="text-center">
            <div className="bg-shark-blue-dark px-6 py-3 rounded-xl inline-block mb-3">
              <div className="text-white text-4xl font-bold italic">Shark</div>
            </div>
            <div className="text-white/90 text-base font-medium">
              Dive Deep, Earn More
            </div>
          </div>
        </div>

        {/* Scrollable Form Container */}
        <div className="flex-1 overflow-y-auto scroll-smooth no-overscroll">
          <div className="px-6 py-6 space-y-5 min-h-full flex flex-col">
            {/* Phone Number */}
            <div>
              <label className="block text-gray-700 text-base font-medium mb-3 text-readable">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-shark-blue"
                  size={18}
                />
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-12 h-14 bg-white border border-gray-200 rounded-xl text-base focus-visible"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Login Password */}
            <div>
              <label className="block text-gray-700 text-base font-medium mb-3 text-readable">
                Enter Login Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-shark-blue"
                  size={18}
                />
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-12 h-14 bg-white border border-gray-200 rounded-xl text-base focus-visible"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {/* Confirm Password (only for registration) */}
            {!isLogin && (
              <div>
                <label className="block text-gray-700 text-base font-medium mb-3 text-readable">
                  Confirm The Login Pass
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-shark-blue"
                    size={18}
                  />
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-12 h-14 bg-white border border-gray-200 rounded-xl text-base focus-visible"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            )}

            {/* Withdrawal PIN (only for registration) */}
            {!isLogin && (
              <div>
                <label className="block text-gray-700 text-base font-medium mb-3 text-readable">
                  Enter The Withdrawal PIN
                </label>
                <div className="relative">
                  <Key
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-shark-blue"
                    size={18}
                  />
                  <Input
                    type="password"
                    name="withdrawalPin"
                    value={formData.withdrawalPin}
                    onChange={handleInputChange}
                    className="pl-12 h-14 bg-white border border-gray-200 rounded-xl text-base focus-visible"
                    placeholder="Enter withdrawal PIN"
                  />
                </div>
              </div>
            )}

            {/* Invitation Code (only for registration) */}
            {!isLogin && (
              <div>
                <label className="block text-gray-700 text-base font-medium mb-3 text-readable">
                  Invitation Code
                </label>
                <div className="relative">
                  <Users
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-shark-blue"
                    size={18}
                  />
                  <Input
                    type="text"
                    name="invitationCode"
                    value={formData.invitationCode}
                    onChange={handleInputChange}
                    className="pl-12 h-14 bg-white border border-gray-200 rounded-xl text-base focus-visible"
                    placeholder="Invitation code"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4 mt-8 pb-6 safe-area-bottom">
              {!isLogin ? (
                <>
                  <Button
                    onClick={handleSubmit}
                    className="w-full h-14 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-medium rounded-xl active:scale-98 transition-transform focus-visible"
                  >
                    REGISTER
                  </Button>
                  <button
                    onClick={() => setIsLogin(true)}
                    className="w-full text-shark-blue text-base font-medium py-3 hover:bg-shark-blue/10 rounded-xl transition-colors active:scale-98 focus-visible"
                  >
                    Already have an account? LOGIN
                  </button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSubmit}
                    className="w-full h-14 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-medium rounded-xl active:scale-98 transition-transform focus-visible"
                  >
                    LOGIN
                  </Button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className="w-full text-shark-blue text-base font-medium py-3 hover:bg-shark-blue/10 rounded-xl transition-colors active:scale-98 focus-visible"
                  >
                    Don't have an account? REGISTER
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
