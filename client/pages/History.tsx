import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';

// Matches backend TransactionType and TransactionStatus (assuming they are strings)
// If backend enums are numeric, mapping will be needed.
// For now, assuming string values like 'RECHARGE', 'COMPLETED' etc. from backend.
type TransactionTypeBE = 'RECHARGE' | 'WITHDRAWAL' | 'PURCHASE' | 'REFERRAL' | 'EARNING'; // From server/models/Transaction.ts TransactionType
type TransactionStatusBE = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'; // From server/models/Transaction.ts TransactionStatus


interface TransactionFE { // Frontend Transaction structure
  id: string; // from MongoDB _id
  type: TransactionTypeBE; // Will be capitalized from backend
  amount: number;
  status: TransactionStatusBE; // Will be capitalized
  date: string; // from MongoDB createdAt
  description: string;
  // Add other fields if needed, e.g. transactionId
  transactionId?: string;
}


const HistoryPage = () => {
  const { userData } = useUser();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<TransactionFE[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userData?.phone) {
        setLoading(false);
        // Consider showing a message or redirecting if phone is required and not available
        toast({ title: "User not found", description: "Please log in to view history.", variant: "destructive" });
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`/api/shark/history/${userData.phone}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch transaction history');
        }
        const data = await response.json();

        // Map backend transaction structure to frontend structure
        const formattedTransactions: TransactionFE[] = (data.transactions || []).map((tx: any) => ({
          id: tx._id, // map _id to id
          type: tx.type.toUpperCase() as TransactionTypeBE, // Assuming type is a string and needs to be uppercase
          amount: tx.amount,
          status: tx.status.toUpperCase() as TransactionStatusBE, // Assuming status is a string and needs to be uppercase
          date: tx.createdAt, // Use createdAt directly
          description: tx.description || 'N/A',
          transactionId: tx.transactionId
        }));
        setTransactions(formattedTransactions);

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error Fetching History",
          description: error.message || "Could not retrieve transaction records.",
        });
        setTransactions([]); // Clear transactions on error
      } finally {
        setLoading(false);
      }
    };

    if (userData) { // Only fetch if userData is available
      fetchHistory();
    } else {
      setLoading(false); // If no userData, stop loading
      // Optionally, show a message that user needs to be logged in
    }
  }, [userData, toast]);

  const getStatusColor = (status: TransactionStatusBE) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600';
      case 'PENDING': return 'text-yellow-600';
      case 'FAILED': return 'text-red-600';
      case 'CANCELLED': return 'text-gray-500';
      default: return 'text-gray-700';
    }
  };

  return (
    <Layout hideBottomNav={false} className="scroll-smooth no-overscroll">
      <div className="px-6 py-6">
        <h2 className="text-2xl font-semibold mb-6 text-readable">Transaction History</h2>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size={48} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No transaction history found.
          </div>
        ) : (
          <Table>
            <TableCaption>A list of your recent transactions.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium capitalize">{transaction.type.toLowerCase()}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className={getStatusColor(transaction.status) + " capitalize"}>
                    {transaction.status.toLowerCase()}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${
                    transaction.type === 'RECHARGE' || transaction.type === 'EARNING' || transaction.type === 'REFERRAL'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'RECHARGE' || transaction.type === 'EARNING' || transaction.type === 'REFERRAL' ? '+' : '-'}
                    ₹{transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;
