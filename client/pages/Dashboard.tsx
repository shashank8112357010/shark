import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import LevelCard from "@/components/LevelCard";
import WelcomeModal from "@/components/WelcomeModal";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  Download,
  Send,
  RotateCcw,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Shark {
  id: string;
  title: string;
  image: string;
  price: number;
  total: number;
  daily: number;
  endDay: number;
}

interface LevelData {
  level: number;
  sharks: Shark[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for dynamic level data
  const [allLevelData, setAllLevelData] = useState<LevelData[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [levelsError, setLevelsError] = useState<string | null>(null);

  // Existing states
  const [balance, setBalance] = useState(0); // This might be from UserContext eventually
  const [buyLoading, setBuyLoading] = useState<string | null>(null);
  const [buyError, setBuyError] = useState(""); // Consider replacing with toast for buy errors
  const [buySuccess, setBuySuccess] = useState(""); // Consider replacing with toast for buy success
  const [selectedLevel, setSelectedLevel] = useState(1); // Default selected level
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [currentReferrals, setCurrentReferrals] = useState(0);
  const [user, setUser] = useState<any>(null); // Define user type if available


  // Mock data for initial load, to be replaced by API call
  const mockLevelData: LevelData[] = [
        {
      level: 1,
      sharks: [
        {
          id: "shark-a",
          title: "Shark A (Fetched)",
          image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 500,
          total: 5400,
          daily: 60,
          endDay: 90,
        },
        {
          id: "shark-b",
          title: "Shark B (Fetched)",
          image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 1100,
          total: 10800,
          daily: 120,
          endDay: 90,
        },
      ],
    },
    {
      level: 2,
      sharks: [
        {
          id: "shark-c",
          title: "Shark C (Fetched)",
          image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 2100,
          total: 21600,
          daily: 240,
          endDay: 90,
        },
      ],
    },
  ];

  // Effect to fetch level data
  useEffect(() => {
    const fetchLevelData = async () => {
      setLevelsLoading(true);
      setLevelsError(null);
      try {
        const response = await fetch('/api/shark/levels'); // Actual API call
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); // Try to get error message
          throw new Error(errorData.error || 'Failed to fetch investment levels');
        }
        const data = await response.json();
        const fetchedLevels = data.levels || [];
        setAllLevelData(fetchedLevels);

        // If data is successfully fetched and not empty, set selectedLevel to the first available level
        // or keep current selectedLevel if it exists in fetched data
        if (fetchedLevels.length > 0) {
          const currentLevelExists = fetchedLevels.some((l: LevelData) => l.level === selectedLevel);
          if (!currentLevelExists) {
            setSelectedLevel(fetchedLevels[0].level);
          }
        } else {
          // Handle case where no levels are fetched (e.g., set selectedLevel to a default or indicate no levels)
           setSelectedLevel(1); // Or null, or handle appropriately
        }

      } catch (error: any) {
        setLevelsError(error.message || 'An unknown error occurred fetching levels');
        toast({
          variant: "destructive",
          title: "Error fetching levels",
          description: error.message || "Could not load investment levels.",
        });
        setAllLevelData([]); // Set to empty on error
      } finally {
        setLevelsLoading(false);
      }
    };

    fetchLevelData();
  }, [toast]); // Removed selectedLevel from deps to avoid re-fetching on level select

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
      localStorage.setItem("hasSeenWelcome", "true");
    }

    const u = JSON.parse(localStorage.getItem("user") || '{}');
    setUser(u);
    if (u.phone) {
      fetch(`/api/referral/count/${u.phone}`)
        .then((res) => res.json())
        .then((data) => setCurrentReferrals(data.count || 0));
    }
  }, []);

  const handleBuyLevel = async (shark: Shark) => {
    const loadingKey = `${selectedLevel}-${shark.id}`;
    setBuyLoading(loadingKey);
    try {
      if (!user?.phone) throw new Error("User not logged in");
      const res = await fetch("/api/shark/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: user.phone,
          shark: shark.title,
          price: shark.price,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Purchase failed");
     
    } catch (err) {
      setBuyError(err.message || "Something went wrong");
    } finally {
      setBuyLoading(null);
    }
  };

  // Get current level data
  const currentLevelSharkData = allLevelData.find((level) => level.level === selectedLevel) || {
    level: selectedLevel, // Fallback to selectedLevel if not found, though should ideally match
    sharks: []
  };

  useEffect(() => {
    // This effect is for logging, can be kept or removed
    console.log("Selected Level:", selectedLevel);
    console.log("Current Sharks Data:", currentLevelSharkData);
  }, [selectedLevel, currentLevelSharkData]);

  // Handle buy success/error with toasts
  useEffect(() => {
    if (buySuccess) {
      toast({ title: "Purchase Successful!", description: buySuccess });
      setBuySuccess(""); // Reset after showing toast
    }
    if (buyError) {
      toast({ variant: "destructive", title: "Purchase Failed", description: buyError });
      setBuyError(""); // Reset after showing toast
    }
  }, [buySuccess, buyError, toast]);


  return (
    <Layout className="scroll-smooth no-overscroll">
      <div className="px-6 py-6">
        {/* Level Selector */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-readable">
            Investment Levels
          </h2>
          {levelsLoading ? (
            <div className="flex justify-center items-center py-10">
              <LoadingSpinner size={32} />
            </div>
          ) : levelsError ? (
            <div className="text-center py-10 text-red-500">
              Error: {levelsError}
            </div>
          ) : allLevelData.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No investment levels available at the moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex space-x-3 p-2 min-w-max">
                {allLevelData.map((levelInfo) => {
                  const isSelected = selectedLevel === levelInfo.level;
                  return (
                    <button
                      key={levelInfo.level}
                      onClick={() => {
                        setSelectedLevel(levelInfo.level);
                        setBuyError("");    // Clear previous buy errors on level change
                        setBuySuccess("");  // Clear previous buy success on level change
                        setBuyLoading(null); // Reset buy loading state
                      }}
                      className={`relative flex-shrink-0 px-4 py-1 cursor-pointer rounded-lg border-2 transition-all active:scale-95 focus-visible ${
                        isSelected
                          ? "border-shark-blue bg-shark-blue text-white"
                          : "border-shark-blue text-shark-blue bg-white hover:bg-shark-blue hover:text-white"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          Level {levelInfo.level}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Referrals */}
          <div className="mt-4 bg-white rounded-lg p-3 card-shadow">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 text-readable">
                Current Referrals:
              </span>
              <span className="font-semibold text-shark-blue">
                {currentReferrals}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Level Sharks */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-readable">
            Level {selectedLevel} Sharks
          </h3>
          {/* buyError and buySuccess are now handled by toasts */}
          {levelsLoading ? (
            <div className="flex justify-center items-center py-10"><LoadingSpinner /></div>
          ) : currentLevelSharkData && currentLevelSharkData.sharks.length > 0 ? (
            <div className="space-y-4">
              {currentLevelSharkData.sharks.map((shark) => {
                const isCurrentSharkLoading = buyLoading === `${selectedLevel}-${shark.id}`;
                return (
                  <LevelCard
                    key={shark.id}
                    level={selectedLevel} // or shark.level if it exists and is reliable
                    title={shark.title}
                    image={shark.image}
                    price={shark.price}
                    total={shark.total}
                    daily={shark.daily}
                    endDay={shark.endDay}
                    onBuy={() => handleBuyLevel(shark)}
                    buyLoading={isCurrentSharkLoading}
                  />
                );
              })}
            </div>
          ) : !levelsError ? ( // Only show "no sharks" if not already showing a general levelsError
            <div className="text-center py-10 text-gray-500">
              No sharks available for this level.
            </div>
          ) : null}
        </div>
      </div>

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </Layout>
  );
};

export default Dashboard;
