import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowUpRight, ArrowDownLeft, RotateCcw } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Matches backend TransactionType and TransactionStatus (assuming they are strings)
// From server/models/Transaction.ts
enum BackendTransactionType {
  PURCHASE = 'purchase',
  REFERRAL = 'referral',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit'
}

enum BackendTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

interface BackendTransaction {
  _id: string;
  type: BackendTransactionType;
  amount: number;
  status: BackendTransactionStatus;
  description: string;
  createdAt: string; // Assuming ISO string date from backend
  // Add other fields if they exist and are needed, e.g. metadata
}

interface FormattedTransaction {
  id: string;
  type: string; // User-friendly type
  status: string; // User-friendly status
  amount: string; // Formatted amount string e.g. "+₹100.00"
  date: string; // Formatted date string
  isPositive: boolean;
  originalType: BackendTransactionType; // Keep original type for filtering
}

const AccountRecords = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userData } = useUser();
  const [activeTab, setActiveTab] = useState("ALL");
  const [transactions, setTransactions] = useState<FormattedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userData?.phone) {
        setLoading(false);
        setError("User not logged in. Cannot fetch records.");
        // toast({ variant: "destructive", title: "Error", description: "User not logged in." });
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/shark/history/${userData.phone}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch transaction records");
        }
        const data = await response.json();

        const backendTransactions: BackendTransaction[] = data.transactions || [];

        const formatted = backendTransactions.map((tx): FormattedTransaction => {
          let displayType = tx.type.toUpperCase();
          let isPositive = false;

          switch (tx.type) {
            case BackendTransactionType.DEPOSIT:
              displayType = "Recharge";
              isPositive = true;
              break;
            case BackendTransactionType.WITHDRAWAL:
              displayType = "Withdrawal";
              isPositive = false;
              break;
            case BackendTransactionType.REFERRAL:
              displayType = "Referral Bonus";
              isPositive = true;
              break;
            case BackendTransactionType.PURCHASE:
              displayType = "Plan Purchase";
              isPositive = false; // Typically a debit
              break;
            default:
              // Keep original type if not mapped, or handle as needed
              break;
          }

          return {
            id: tx._id,
            type: displayType,
            status: tx.status.charAt(0).toUpperCase() + tx.status.slice(1), // Capitalize
            amount: `${isPositive ? "+" : "-"}₹${tx.amount.toFixed(2)}`,
            date: new Date(tx.createdAt).toLocaleString('en-IN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }).replace(',', ''),
            isPositive,
            originalType: tx.type,
          };
        });
        setTransactions(formatted);

      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
        toast({
          variant: "destructive",
          title: "Error Fetching Records",
          description: err.message || "Could not retrieve transaction records.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userData, toast]);

  const getFilteredTransactions = () => {
    if (activeTab === "WITHDRAWALS") {
      return transactions.filter((t) => t.originalType === BackendTransactionType.WITHDRAWAL);
    }
    if (activeTab === "RECHARGE") {
      return transactions.filter((t) => t.originalType === BackendTransactionType.DEPOSIT);
    }
    // Add more filters if needed, e.g., for "Income" which could be "REFERRAL"
    // if (activeTab === "INCOME") {
    //   return transactions.filter((t) => t.originalType === BackendTransactionType.REFERRAL);
    // }
    return transactions;
  };

  const getTransactionIcon = (type: BackendTransactionType | string) => { // Accept original or formatted type
    switch (type) {
      case BackendTransactionType.DEPOSIT:
      case "Recharge":
        return <ArrowDownLeft size={24} className="text-gray-600" />; // Deposit to user is like an inflow arrow
      case BackendTransactionType.WITHDRAWAL:
      case "Withdrawal":
        return <ArrowUpRight size={24} className="text-gray-600" />; // Withdrawal from user is like an outflow arrow
      case BackendTransactionType.REFERRAL:
      case "Referral Bonus":
        return <ArrowDownLeft size={24} className="text-gray-600" />; // Income
      case BackendTransactionType.PURCHASE:
      case "Plan Purchase":
        return <ArrowUpRight size={24} className="text-gray-600" />; // Purchase is an outflow
      default:
        return <RotateCcw size={24} className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Layout className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </Layout>
    );
  }

  if (error && !transactions.length) { // Show error prominently if no data and error
    return (
      <Layout className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <h2 className="text-xl font-semibold text-red-500 mb-2">Failed to Load Records</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()} // Simple refresh, or could re-trigger fetch
          className="px-4 py-2 bg-shark-blue text-white rounded-lg hover:bg-shark-blue-dark"
        >
          Try Again
        </button>
      </Layout>
    );
  }


  return (
    <Layout
      className="scroll-smooth no-overscroll"
    >
      {/* Filter Tabs */}
      <div className="px-6 mt-6">
        <div className="flex bg-white rounded-lg overflow-hidden card-shadow">
          {["ALL", "WITHDRAWALS", "RECHARGE"].map((tab) => ( // Consider adding "INCOME" if a filter for it is implemented
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 text-center font-bold font-sm text-xs transition-all active:scale-98  ${
                activeTab === tab
                  ? "bg-white text-shark-blue border-b-2 border-shark-blue"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      {getFilteredTransactions().length === 0 && !loading && (
         <div className="px-6 mt-10 text-center text-gray-500">
           No records found for the selected filter.
         </div>
      )}
      <div className="px-6 mt-6 space-y-3 pb-6">
        {getFilteredTransactions().map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white rounded-lg p-4 flex items-center justify-between card-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                {getTransactionIcon(transaction.originalType)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 text-readable">
                  {transaction.type}
                </div>
                <div className="text-sm text-gray-600 text-readable">
                  {transaction.status}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {transaction.date}
                </div>
              </div>
            </div>
            <div
              className={`text-lg font-semibold ${
                transaction.isPositive ? "text-shark-blue" : "text-red-500"
              }`}
            >
              {transaction.amount}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default AccountRecords;
