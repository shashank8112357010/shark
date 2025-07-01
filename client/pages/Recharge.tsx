import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import UserInfo from "@/components/UserInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/LoadingSpinner"; // Import spinner
import { FileText, ChevronDown } from "lucide-react";
import { useStateChange } from "@/hooks/useStateChange";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast"; // Import useToast

const Recharge = () => {
  const navigate = useNavigate();
  const { toast } = useToast(); // Initialize useToast
  const [amount, setAmount] = useState("1000");
  // const [selectedMethod, setSelectedMethod] = useState("Recharge X"); // This state was unused.
  // const { handleStateChange } = useStateChange(); // This hook was unused in this component.
  const { userData } = useUser();

  const rechargeMethods = [
    { id: "500", amount: 500, name: "₹500" },
    { id: "1000", amount: 1000, name: "₹1,000" },
    { id: "2000", amount: 2000, name: "₹2,000" },
    { id: "5000", amount: 5000, name: "₹5,000" },
  ];

  const [loading, setLoading] = useState(false);
  // Removed error and success states, will use toasts instead

  const handleRecharge = async () => {
    setLoading(true);
    try {
      if (!userData?.phone) {
        // This should ideally be handled by routing/auth guards
        toast({
          variant: "destructive",
          title: "Error",
          description: "User not logged in.",
        });
        setLoading(false);
        return;
      }
      
      const amountValue = parseInt(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid Amount",
          description: "Please enter a valid positive amount.",
        });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: userData.phone, amount: amountValue }),
      });

      const data = await res.json(); // Try to parse JSON regardless of res.ok to get error messages

      if (!res.ok) {
        throw new Error(data.error || "Recharge failed due to server error");
      }

      if (!data.success) {
        // This case might be redundant if !res.ok already covers it
        throw new Error(data.error || "Recharge processing failed");
      }

      toast({
        title: "Recharge Successful!",
        description: `₹${amountValue} has been added to your account.`,
      });
      // Potentially update user balance in context here
      // Example: refreshUserData();

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500); // Slightly longer timeout for toast visibility
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Recharge Failed",
        description: err.message || "Something went wrong during recharge.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout 
      className="scroll-smooth no-overscroll"
    >
      <div className="px-6 py-6 space-y-6">
        {/* Amount Input */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-readable">Recharge</h3>
          <Input
            type="number"
            value={amount}
            onChange={(e) => {
              console.log(e.target.value);
              
              setAmount(e.target.value)
            }}
            className="h-16 text-xl text-center border-gray-300 rounded-lg "
            placeholder="Enter amount"
          />
        </div>

        {/* Payment Method Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-readable">
            Please choose the pay method
          </h3>
          <div className="space-y-3">
            {rechargeMethods.map((method) => (
              <label
                key={method.id}
                className="flex items-center justify-between bg-white rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors card-shadow active:scale-98"
              >
                <span className="text-lg text-readable">{method.name}</span>
                <input
                  type="radio"
                  name="rechargeMethod" // Name should be consistent for radio group behavior
                  value={method.id} // Value could be method.amount for simplicity if id is just amount
                  checked={amount === method.amount.toString()} // Check against amount state
                  onChange={(e) => {
                    // setSelectedMethod(e.target.value); // Keep if selectedMethod state is used elsewhere
                    setAmount(method.amount.toString());
                  }}
                  className="w-6 h-6 text-shark-blue border-2 border-gray-300 focus:ring-shark-blue "
                />
              </label>
            ))}
          </div>
        </div>

        {/* Error/Success Messages are now handled by Toasts */}
        {/* Confirm Button */}
        <Button
          onClick={handleRecharge}
          disabled={loading}
           className="w-full h-14 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-medium rounded-lg active:scale-98 transition-transform flex items-center justify-center"
        >
           {loading ? <LoadingSpinner size={28} /> : "Confirm Recharge"}
        </Button>

        {/* Recharge Rules */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-readable">
            Recharge Rules
          </h3>
          <div className="space-y-3 text-sm text-gray-700 text-readable">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
              <span>
                Confirm the recharge amount and fill in the UTR number correctly
              </span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
              <span>
                Every time you recharge, you need to re-acquire the receiving
                account at the cashier.
              </span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
              <span>
                For recharge questions, please contact onlinecustomer service.
              </span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
              <span>
                All funds for the project are regulated by the Indian government
                bank.
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Recharge;

