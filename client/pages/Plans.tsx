import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Using ShadCN Card
import { IndianRupee } from "lucide-react";

// Interfaces matching the structure from /api/shark/levels
interface Shark {
  id: string;
  title: string;
  image: string; // Although not used in this view, it's part of the data
  price: number;
  total: number;
  daily: number;
  endDay: number;
}

interface LevelData {
  level: number;
  sharks: Shark[];
}

const Plans = () => {
  const { toast } = useToast();
  const [allLevelData, setAllLevelData] = useState<LevelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/shark/levels");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Failed to fetch investment plans"
          );
        }
        const data = await response.json();
        const fetchedLevels = data.levels || [];

        if (fetchedLevels.length > 0) {
          setAllLevelData(fetchedLevels);
        } else {
          // If API returns empty levels but is successful, treat as no plans available
          setAllLevelData([]);
        }
      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
        toast({
          variant: "destructive",
          title: "Error Fetching Plans",
          description: err.message || "Could not retrieve investment plans.",
        });
        setAllLevelData([]); // Ensure data is cleared on error
      } finally {
        setLoading(false);
      }
    };

    fetchPlanData();
  }, [toast]);

  if (loading) {
    return (
      <Layout className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <h2 className="text-xl font-semibold text-red-500 mb-2">
          Failed to Load Plans
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-shark-blue text-white rounded-lg hover:bg-shark-blue-dark"
        >
          Try Again
        </button>
      </Layout>
    );
  }

  return (
    <Layout className="scroll-smooth no-overscroll">
      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-shark-blue text-readable">
          Our Investment Plans
        </h1>

        {allLevelData.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-10">
            <p className="text-lg">No investment plans currently available.</p>
            <p className="text-sm">Please check back later.</p>
          </div>
        )}

        <div className="space-y-8">
          {allLevelData.map((level) => (
            <div key={level.level}>
              <h2 className="text-2xl font-semibold mb-6 text-gray-700 text-readable border-b-2 border-shark-blue pb-2">
                Level {level.level}
              </h2>
              {level.sharks.length === 0 ? (
                <p className="text-gray-500">No plans available for this level.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {level.sharks.map((shark) => (
                    <Card key={shark.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardHeader className="bg-shark-blue text-white">
                        <CardTitle className="text-xl flex items-center">
                           {shark.title}
                        </CardTitle>
                        <CardDescription className="text-shark-blue-light text-sm">
                          Investment Plan
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-semibold text-shark-blue flex items-center">
                            <IndianRupee size={16} className="mr-1"/> {shark.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Daily Income:</span>
                          <span className="font-semibold text-green-600 flex items-center">
                            <IndianRupee size={16} className="mr-1"/> {shark.daily.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Return:</span>
                          <span className="font-semibold text-shark-blue flex items-center">
                           <IndianRupee size={16} className="mr-1"/> {shark.total.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-semibold">{shark.endDay} days</span>
                        </div>
                         {/* Optionally, add an image if desired for this view */}
                         {/* {shark.image && <img src={shark.image} alt={shark.title} className="mt-4 rounded-lg h-32 w-full object-cover"/>} */}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Plans;
