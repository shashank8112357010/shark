import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import BankDetailsModal from "@/components/BankDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Eye, 
  EyeOff, 
  Wallet, 
  Clock, 
  DollarSign, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  CreditCard, 
  Smartphone, 
  QrCode, 
  Plus 
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { 
  StatsSkeletons, 
  TransactionSkeletons 
} from "@/components/ui/skeleton-components";

interface WithdrawalLimits {
  dailyLimit: number;
  dailyWithdrawn: number;
  remainingLimit: number;
  minimumAmount: number;
  maximumAmount: number;
  taxRate: number;
  isTimeValid: boolean;
  timeWindow: {
    start: string;
    end: string;
  };
  openTime: string;
  closeTime: string;
}

interface WithdrawalHistory {
  amount: number;
  date: string;
  status: 'success' | 'pending' | 'failed';
  tax: number;
  paymentUtr?: string;
  createdAt ? : string ;
}

const Withdraw = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userData, loading: userLoading } = useUser();
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [limits, setLimits] = useState<WithdrawalLimits | null>(null);
  const [history, setHistory] = useState<WithdrawalHistory[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);

  // Using useCallback for fetchWithdrawalData in case it's needed by other parts, though primarily for useEffect here.
  const fetchWithdrawalDataCallback = useCallback(async () => {
    if (!userData?.phone) {
      // This case should ideally be handled by the useEffect not running,
      // or by the top-level "Not Logged In" guard in the component's return.
      // However, if called directly, this check is useful.
      setPageLoading(false); // Ensure loading stops if called when no user.
      toast({
          variant: "destructive",
          title: "User Not Available",
          description: "Cannot fetch withdrawal data without user information.",
      });
      return;
    }

    setPageLoading(true);
    try {
      const [limitsRes, historyRes] = await Promise.all([
        fetch(`/api/withdraw/${userData.phone}/limits`),
        fetch(`/api/withdraw/${userData.phone}/history`)
      ]);

      let errorMessages: string[] = [];

      if (!limitsRes.ok) {
        let errData;
        try {
          errData = await limitsRes.json();
        } catch {
          errData = { error: "Server error or not JSON" };
        }
        errorMessages.push(`Limits: ${errData.error || limitsRes.statusText}`);
      }
      if (!historyRes.ok) {
        let errData;
        try {
          errData = await historyRes.json();
        } catch {
          errData = { error: "Server error or not JSON" };
        }
        errorMessages.push(`History: ${errData.error || historyRes.statusText}`);
      }

      if (errorMessages.length > 0) {
        throw new Error(errorMessages.join("; "));
      }

      const limitsData = await limitsRes.json();
      const historyData = await historyRes.json();

      setLimits({
        ...limitsData,
        openTime: limitsData.timeWindow?.start,
        closeTime: limitsData.timeWindow?.end,
      });
      setHistory(historyData.history || []);
      
      // Fetch saved accounts
      const accountsResponse = await fetch(`/api/bank-details/${userData.phone}`);
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        setSavedAccounts(accountsData.bankDetails || []);
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Loading Withdrawal Page",
        description: error.message || 'Could not load necessary data.',
      });
      setLimits(null);
      setHistory([]);
    } finally {
      setPageLoading(false);
    }
  }, [userData, toast]); // userData dependency ensures it re-runs if user logs in/out


  useEffect(() => {
    if (userData?.phone) {
      // User is logged in, fetch withdrawal data
      fetchWithdrawalDataCallback();
    } else {
      // User context loaded but no user data, stop loading
      setPageLoading(false);
    }
  }, [userData, fetchWithdrawalDataCallback, userLoading]);

  const handleWithdraw = async () => {
    setSubmitLoading(true);
    try {
      if (!userData?.phone) {
        throw new Error("User not logged in");
      }

      const amountNum = Number(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Please enter a valid positive amount");
      }

      if (!selectedAccount) {
        throw new Error("Please select a withdrawal account");
      }

      if (!password) {
        throw new Error("Please enter your password");
      }

      if (!limits) {
        throw new Error("Please wait for page to load completely");
      }

      if (!limits.isTimeValid) {
        throw new Error(`Withdrawals can only be made between ${limits.openTime} and ${limits.closeTime}`);
      }

      if (amountNum < limits.minimumAmount) {
        throw new Error(`Minimum withdrawal amount is ₹${limits.minimumAmount}`);
      }

      if (amountNum > limits.remainingLimit) {
        throw new Error(`You can withdraw up to ₹${limits.remainingLimit} today`);
      }

      // Find selected account details
      const selectedAccountDetails = savedAccounts.find(acc => acc.id === selectedAccount);
      if (!selectedAccountDetails) {
        throw new Error("Selected account not found");
      }

      const res = await fetch('/api/withdraw/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userData.phone,
          amount: amountNum,
          password,
          accountDetails: selectedAccountDetails
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Withdrawal failed');
      }

      toast({
        title: "Success",
        description: `Withdrawal of ₹${amountNum} initiated successfully.`
      });
      setAmount("");
      setPassword("");
      setSelectedAccount("");
      await fetchWithdrawalDataCallback();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: err.message || 'Failed to process withdrawal.'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // if (pageLoading || userLoading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <LoadingSpinner size={32} />
  //     </div>
  //   );
  // }

  // Bank details state
  const [selectedBankDetails, setSelectedBankDetails] = useState<any>(null);

  const handleBankDetailsSelected = (details: any) => {
    setSelectedBankDetails(details);
    setSelectedAccount(details.id || '');
    // Refresh accounts after selection
    fetchWithdrawalDataCallback();
  };

  if (pageLoading || userLoading) {
    return (
      <Layout className="scroll-smooth no-overscroll">
        <div className="px-6 py-6">
          <Header title="Withdraw" />
          
          {/* Loading Stats */}
          <div className="mt-6">
            <StatsSkeletons />
          </div>
          
          {/* Loading Form */}
          <div className="mt-8 space-y-6">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          
          {/* Loading History */}
          <div className="mt-8">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
            <TransactionSkeletons />
          </div>
        </div>
      </Layout>
    );
  }

  if (!userData?.phone) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Not Logged In</h2>
            <p className="text-gray-600 mb-4">Please login to access withdrawal features.</p>
            <Button onClick={() => navigate('/')}>Login</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="scroll-smooth no-overscroll">
      <div className="px-6 py-6">
        {/* Header */}

        
        {/* Withdrawal Window Alert */}
        {!limits?.isTimeValid && (
          <Alert className="mt-4 border-yellow-300 bg-yellow-50">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Withdrawal Window Closed:</strong> You can withdraw from <strong>8:00 AM</strong> to <strong>10:00 PM IST</strong> (Monday to Friday only).
            </AlertDescription>
          </Alert>
        )}

        {/* Balance Overview */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Available Balance</p>
                  <p className="text-2xl font-bold text-green-900">
                    ₹{Math.round(parseFloat(userData?.balance?.toFixed(2) || "0"))}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Daily Limit</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ₹{Math.round(limits?.remainingLimit || 0)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Form */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Withdrawal Request</span>
                <Badge variant={limits?.isTimeValid ? "default" : "secondary"}>
                  {limits?.isTimeValid ? "Open" : "Closed"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                        setAmount(value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pl-10"
                    placeholder="Enter amount"
                    disabled={submitLoading || !limits?.isTimeValid}
                    min="0"
                    step="0.01"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                </div>
                {limits && (
                  <div className="mt-2 text-xs text-gray-500">
                    Min: ₹{limits.minimumAmount} • Max: ₹{Math.round(limits.remainingLimit)} • Tax: 15%
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Payment Method</label>
                  <BankDetailsModal onDetailsSelected={handleBankDetailsSelected}>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Saved Methods
                    </Button>
                  </BankDetailsModal>
                </div>
                
                {selectedBankDetails && (
                  <Alert className="mb-4 border-blue-200 bg-blue-50">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Using saved method: <strong>{selectedBankDetails.name}</strong>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Withdrawal Account</label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a saved account" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedAccounts.map((account) => {
                          const getIcon = () => {
                            switch (account.type) {
                              case 'upi': return <Smartphone className="h-4 w-4" />;
                              case 'bank': return <CreditCard className="h-4 w-4" />;
                              case 'qr': return <QrCode className="h-4 w-4" />;
                              default: return <CreditCard className="h-4 w-4" />;
                            }
                          };
                          
                          const getDisplayText = () => {
                            switch (account.type) {
                              case 'upi': return account.details.upiId;
                              case 'bank': return `****${account.details.accountNumber?.slice(-4)}`;
                              case 'qr': return 'QR Code Payment';
                              default: return account.name;
                            }
                          };
                          
                          return (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex items-center space-x-2">
                                {getIcon()}
                                <span>{account.name}</span>
                                <span className="text-gray-500">({getDisplayText()})</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    
                    {savedAccounts.length === 0 && (
                      <div className="text-center py-8">
                        <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium mb-2">No Bank Accounts Found</p>
                        <p className="text-sm text-gray-500 mb-4">
                          You need to add a bank account before making withdrawals.
                        </p>
                        <BankDetailsModal onDetailsSelected={handleBankDetailsSelected}>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Bank Account
                          </Button>
                        </BankDetailsModal>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    placeholder="Enter your password"
                    disabled={submitLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleWithdraw}
                disabled={submitLoading || !limits?.isTimeValid}
                className="w-full"
                size="lg"
              >
                {submitLoading ? (
                  <>
                    <LoadingSpinner size={16} className="mr-2" />
                    Processing...
                  </>
                ) : (
                  "Submit Withdrawal Request"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal History */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Withdrawal History</h2>
          {history.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Wallet size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No Withdrawals Yet
                </h3>
                <p className="text-gray-500">
                  Your withdrawal history will appear here once you make your first withdrawal.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          item.status === 'success' ? 'bg-green-100' :
                          item.status === 'pending' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          {item.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : item.status === 'pending' ? (
                            <Clock className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">₹{Math.round(item.amount)}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(item.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={item.status === 'success' ? 'default' : item.status === 'pending' ? 'secondary' : 'destructive'}>
                          {item.status}
                        </Badge>
                        {item.paymentUtr && (
                          <p className="text-xs text-gray-500 mt-1">
                            UTR: {item.paymentUtr}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Withdrawal Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Withdrawals are processed within 24-48 hours</li>
            <li>• 15% tax is deducted from all withdrawals</li>
            <li>• Minimum withdrawal amount: ₹{limits?.minimumAmount || 0}</li>
            <li>• Available during business hours: 8:00 AM - 10:00 PM IST</li>
            <li>• All withdrawals are subject to verification</li>
          </ul>
        </div>
      </div>
      
      {/* Floating Button */}
      <div className="fixed bottom-20 right-6 z-50">
        <BankDetailsModal onDetailsSelected={handleBankDetailsSelected}>
          <Button className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg">
            <Plus size={24} />
          </Button>
        </BankDetailsModal>
      </div>
    </Layout>
  );
};

export default Withdraw;
