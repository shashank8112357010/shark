import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import UserInfo from "@/components/UserInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { CreditCard, Check, AlertCircle, Copy } from "lucide-react";
import qrImage from '/public/qr.jpeg';
import { useStateChange } from "@/hooks/useStateChange";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";

const Recharge = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState("1000");
  const [utrNumber, setUtrNumber] = useState("");
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { userData } = useUser();

  const rechargeMethods = [
    { id: "500", amount: 500, name: "₹500" },
    { id: "1000", amount: 1000, name: "₹1,000" },
    { id: "2000", amount: 2000, name: "₹2,000" },
    { id: "5000", amount: 5000, name: "₹5,000" },
  ];

  const [loading, setLoading] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const handleProceedToPayment = () => {
    if (!amount || isNaN(parseInt(amount)) || parseInt(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount",
      });
      return;
    }
    setShowQRDialog(true);
  };

  const handlePaymentComplete = () => {
    setShowQRDialog(false);
    setShowConfirmDialog(true);
  };

  const handleRecharge = async () => {
    setLoading(true);
    console.log(userData);
    
    try {
      if (!userData?.phone) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User not logged in.",
        });
        setLoading(false);
        return;
      }
      
      const amountValue = parseInt(amount);
      
      if (isNaN(amountValue) || amountValue <= 0 || !utrNumber.trim()) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Please ensure amount and UTR number are filled correctly.",
        });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/wallet/recharge-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: userData.phone, 
          amount: amountValue, 
          utrNumber: utrNumber.trim(), 
          qrCode: qrImage 
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Request failed");
      }

      toast({
        title: "Recharge Request Submitted",
        description: `Your request for ₹${amountValue} has been submitted. Please wait for admin approval.`,
      });
      
      setShowConfirmDialog(false);
      setUtrNumber("");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="scroll-smooth no-overscroll">
      <div className="px-6 py-6 space-y-6">
        {/* Amount Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Recharge Amount</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-16 text-xl text-center border-gray-300 rounded-lg"
              placeholder="Enter amount"
            />
          </CardContent>
        </Card>

     

        {/* Proceed to Payment Button */}
        <Button
          onClick={handleProceedToPayment}
          className="w-full h-14 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-medium rounded-lg"
        >
          <CreditCard className="h-5 w-5 mr-2" />
          Proceed to UPI Payment
        </Button>

        {/* Recharge Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Recharge Rules</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span>Confirm the recharge amount and fill in the UTR number correctly</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span>Payment will be processed after admin verification</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span>For recharge questions, please contact customer service</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span>All transactions are secured and regulated</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Payment Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Scan QR Code to Pay</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* QR Code Display */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                <img 
                  src={qrImage} 
                  alt="QR Code for Payment" 
                  width={192} 
                  height={192} 
                  className="mx-auto" 
                />
                <p className="text-center text-sm text-gray-500 mt-2">Scan to pay ₹{amount}</p>
                <p className="text-center text-sm text-gray-500 mt-2">UPI : paytm.s1mhm4a@pty</p>

              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <Label className="text-sm font-medium">Amount</Label>
                <p className="text-lg font-bold text-green-600">₹{amount}</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Payment Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Open your UPI app (PhonePe, GPay, Paytm, etc.)</li>
                <li>2. Scan the QR code above</li>
                <li>3. Verify the amount ₹{amount}</li>
                <li>4. Complete the payment</li>
                
                <li>5. Note down the UTR/Transaction ID</li>
              </ol>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowQRDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handlePaymentComplete} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Payment Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UTR Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Payment Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Payment Amount</span>
              </div>
              <p className="text-2xl font-bold text-green-600">₹{amount}</p>
            </div>

            <div>
              <Label htmlFor="utr">UTR/Transaction ID *</Label>
              <Input
                id="utr"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="Enter 12-digit UTR number"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can find this in your payment app after successful transaction
              </p>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Your recharge will be processed after admin verification. 
                This usually takes 5-30 minutes during business hours.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)} 
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRecharge} 
                disabled={loading || !utrNumber.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size={16} className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Recharge;

