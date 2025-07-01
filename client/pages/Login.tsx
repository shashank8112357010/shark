import { useState, useEffect } from "react"; // Import useEffect
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
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
    invitationCode: "1a6jd", // withdrawalPin will be mapped to withdrawalPassword
  });

  const location = useLocation(); // Get location object

  useEffect(() => {
    // Check for invite_code in URL query parameters when component mounts
    const queryParams = new URLSearchParams(location.search);
    const inviteCodeFromUrl = queryParams.get("invite_code");

    if (inviteCodeFromUrl) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        invitationCode: inviteCodeFromUrl,
      }));
      setIsLogin(false); // Switch to registration form
      console.log("[Login.tsx] Prefilled invitation code from URL:", inviteCodeFromUrl);

      // Optional: Remove the query parameter from URL after reading it, for cleaner URL
      // navigate(location.pathname, { replace: true });
      // Be cautious with this if there are other useful query params or page relies on them.
    }
  }, [location.search, navigate]); // Rerun if search params change (though typically only on load)


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        // LOGIN
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
        navigate("/dashboard");
      } else {
        // REGISTER
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        // Special logic: first account (admin) must use phone 9999857892 and any invite code is accepted
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
            withdrawalPassword: formData.withdrawalPin, // <-- send as withdrawalPassword
            inviteCode,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Registration failed");
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsLogin(true);
        setError("");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
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
          <div className="px-6 py-6 space-y-6 min-h-full flex flex-col">
            {/* Phone Number */}
            <div>
              <label className="block text-gray-800 text-base font-semibold mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-shark-blue"
                  size={20}
                />
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="h-14 pl-12 pr-4 bg-white border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:border-shark-blue focus:ring-2 focus:ring-shark-blue transition-all"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Login Password */}
            <div>
              <label className="block text-gray-800 text-base font-semibold mb-2">
                Enter Login Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-shark-blue"
                  size={20}
                />
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="h-14 pl-12 pr-4 bg-white border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:border-shark-blue focus:ring-2 focus:ring-shark-blue transition-all"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {/* Confirm Password (only for registration) */}
            {!isLogin && (
              <div>
                <label className="block text-gray-800 text-base font-semibold mb-2">
                  Confirm The Login Pass
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-shark-blue"
                    size={20}
                  />
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="h-14 pl-12 pr-4 bg-white border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:border-shark-blue focus:ring-2 focus:ring-shark-blue transition-all"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            )}

            {/* Withdrawal PIN (only for registration) */}
            {!isLogin && (
              <div>
                <label className="block text-gray-800 text-base font-semibold mb-2">
                  Enter The Withdrawal PIN
                </label>
                <div className="relative">
                  <Key
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-shark-blue"
                    size={20}
                  />
                  <Input
                    type="password"
                    name="withdrawalPin"
                    value={formData.withdrawalPin}
                    onChange={handleInputChange}
                    className="h-14 pl-12 pr-4 bg-white border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:border-shark-blue focus:ring-2 focus:ring-shark-blue transition-all"
                    placeholder="Enter withdrawal PIN"
                  />
                </div>
              </div>
            )}

            {/* Invitation Code (only for registration) */}
            {!isLogin && (
              <div>
                <label className="block text-gray-800 text-base font-semibold mb-2">
                  Invitation Code
                </label>
                <div className="relative">
                  <Users
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-shark-blue"
                    size={20}
                  />
                  <Input
                    type="text"
                    name="invitationCode"
                    value={formData.invitationCode}
                    onChange={handleInputChange}
                    className="h-14 pl-12 pr-4 bg-white border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:border-shark-blue focus:ring-2 focus:ring-shark-blue transition-all"
                    placeholder="Invitation code"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-center text-sm mb-2">{error}</div>
            )}
            {/* Action Buttons */}
            <div className="space-y-4 mt-8 pb-6 safe-area-bottom">
              {!isLogin ? (
                <>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full h-14 mt-4 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-bold rounded-lg shadow-md transition-all"
                  >
                    {loading ? "Registering..." : "REGISTER"}
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
                    disabled={loading}
                    className="w-full h-14 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-medium rounded-xl active:scale-98 transition-transform focus-visible"
                  >
                    {loading ? "Logging in..." : "LOGIN"}
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
