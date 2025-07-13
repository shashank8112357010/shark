import { useState, useEffect } from 'react';
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Calendar, Users, TrendingUp, ShoppingCart } from "lucide-react";

interface IncomeRecord {
  _id: string;
  date: string;
  sharkTitle: string;
  sharkLevel: number;
  dailyIncomeAmount: number;
}

const IncomeHistory = () => {
  const { userData, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [incomeHistory, setIncomeHistory] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncomeHistory = async () => {
      if (!userData?.phone) {
        if (!userLoading) {
          setLoading(false);
          setError("Please log in to view your income history.");
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/income/history/${userData.phone}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch income history");
        }
        const data = await response.json();
        setIncomeHistory(data.incomeHistory || []);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
        toast({
          variant: "destructive",
          title: "Error Fetching Income History",
          description: err.message || "Could not retrieve your income history.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIncomeHistory();
  }, [userData, userLoading, toast]);

  if (loading || userLoading) {
    return (
      <Layout className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="px-6 py-6">
          <Header title="Income History" />
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h2 className="text-xl font-semibold text-red-500 mb-2">
              Failed to Load Income History
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-shark-blue text-white rounded-lg hover:bg-shark-blue-dark"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="scroll-smooth no-overscroll">
      <div className="px-6 py-6">
        <Header title="Income History" />

        <div className="mt-8">
          {incomeHistory.length === 0 ? (
            <div className="text-center py-10">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Income History Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Your daily income from shark investments will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomeHistory.map((record) => (
                <Card key={record._id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <Users size={18} className="mr-2 text-shark-blue" />
                          {record.sharkTitle} (Level {record.sharkLevel})
                        </CardTitle>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <Calendar size={14} className="mr-1" />
                          {new Date(record.date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-green-600 font-semibold text-lg">
                          <IndianRupee size={16} className="mr-1" />
                          {record.dailyIncomeAmount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">Income</div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default IncomeHistory;