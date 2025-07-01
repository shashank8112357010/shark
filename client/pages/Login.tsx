import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Lock, Key, Users } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    confirmPassword: "",
    withdrawalPin: "",
    invitationCode: "", // No dummy invite code
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Get invite_code from URL if present and update formData
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const inviteCodeFromUrl = queryParams.get("invite") || queryParams.get("invite_code");

    if (inviteCodeFromUrl && inviteCodeFromUrl !== formData.invitationCode) {
      setFormData((prev) => ({
        ...prev,
        invitationCode: inviteCodeFromUrl,
      }));
      setIsLogin(false); // Switch to register mode
      // Optional: clean the URL
      navigate(location.pathname, { replace: true });
    }
  }, [location.search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setError("");
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
        navigate("/dashboard");
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
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

        <div className="flex-1 overflow-y-auto scroll-smooth no-overscroll">
          <div className="px-6 py-6 space-y-6 min-h-full flex flex-col">
            <div>
              <label className="block text-gray-800 text-base font-semibold mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-shark-blue" size={20} />
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="h-14 pl-12 pr-4 bg-white border border-gray-300 rounded-lg"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-800 text-base font-semibold mb-2">
                Enter Login Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-shark-blue" size={20} />
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="h-14 pl-12 pr-4 bg-white border border-gray-300 rounded-lg"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-gray-800 text-base font-semibold mb-2">
                    Confirm The Login Pass
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-shark-blue" size={20} />
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="h-14 pl-12 pr-4 bg-white border border-gray-300 rounded-lg"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 text-base font-semibold mb-2">
                    Enter The Withdrawal PIN
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-shark-blue" size={20} />
                    <Input
                      type="password"
                      name="withdrawalPin"
                      value={formData.withdrawalPin}
                      onChange={handleInputChange}
                      className="h-14 pl-12 pr-4 bg-white border border-gray-300 rounded-lg"
                      placeholder="Enter withdrawal PIN"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 text-base font-semibold mb-2">
                    Invitation Code
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-shark-blue" size={20} />
                    <Input
                      type="text"
                      name="invitationCode"
                      value={formData.invitationCode}
                      onChange={handleInputChange}
                      className="h-14 pl-12 pr-4 bg-white border border-gray-300 rounded-lg"
                      placeholder="Invitation code"
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="text-red-600 text-center text-sm mb-2">{error}</div>
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
    </div>
  );
};

export default Login;
