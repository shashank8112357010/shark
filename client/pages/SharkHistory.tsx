import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Calendar, TrendingUp, CheckCircle } from "lucide-react";

interface PurchasedShark {
  id: string;
  shark: string;
  level: number;
  price: number;
  date: string;
  transactionId: string;
  status: string;
}

const SharkHistory = () => {
  const { userData, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<PurchasedShark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchasedSharks = async () => {
      if (!userData?.phone) {
        if (!userLoading) {
          setLoading(false);
          setError("Please log in to view your shark history.");
        }
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log('=== FETCHING SHARK HISTORY ===');
        console.log('User phone:', userData.phone);
        const response = await fetch(`/api/shark/purchased/${userData.phone}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', errorData);
          throw new Error(errorData.error || "Failed to fetch shark history");
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (data.success) {
          console.log('Setting purchases:', data.purchases);
          setPurchases(data.purchases || []);
        } else {
          console.error('API returned success=false:', data.error);
          throw new Error(data.error || "Failed to fetch shark history");
        }
      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
        toast({
          variant: "destructive",
          title: "Error Fetching Shark History",
          description: err.message || "Could not retrieve your shark purchase history.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedSharks();
  }, [userData, userLoading, toast]);

  if (loading || userLoading) {
    return (
      <Layout className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </Layout>
    );
  }

  if (error && !purchases.length) {
    return (
      <Layout>
        <div className="px-6 py-6">
          
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h2 className="text-xl font-semibold text-red-500 mb-2">
              Failed to Load Shark History
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
      
        
        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="text-shark-blue mr-2" size={20} />
                <span className="text-2xl font-bold text-shark-blue">
                  {purchases.length}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Sharks</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <IndianRupee className="text-green-600 mr-1" size={20} />
                <span className="text-2xl font-bold text-green-600">
                  {purchases.reduce((sum, p) => sum + p.price, 0).toFixed(0)}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Invested</p>
            </CardContent>
          </Card>
        </div>

        {/* Purchases List */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-readable">
            Your Purchased Sharks
          </h2>
          
          {purchases.length === 0 ? (
            <div className="text-center py-10">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Shark Purchases Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start investing in sharks to see your purchase history here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <Card key={purchase.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          {purchase.shark}
                          <span className="ml-2 px-2 py-1 bg-shark-blue text-white text-xs rounded-full">
                            Level {purchase.level}
                          </span>
                        </CardTitle>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <Calendar size={14} className="mr-1" />
                          {new Date(purchase.date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-shark-blue font-semibold">
                          <IndianRupee size={16} className="mr-1" />
                          {purchase.price.toFixed(2)}
                        </div>
                        <div className="flex items-center mt-1 text-green-600 text-sm">
                          <CheckCircle size={14} className="mr-1" />
                          Completed
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      Transaction ID: {purchase.transactionId}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SharkHistory;
