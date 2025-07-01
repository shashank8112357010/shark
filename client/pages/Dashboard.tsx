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
  const [selectedLevel, setSelectedLevel] = useState(1);

  // Existing states
  const [balance, setBalance] = useState(0);
  const [buyLoading, setBuyLoading] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [currentReferrals, setCurrentReferrals] = useState(0);
  const [user, setUser] = useState<any>(null);

  // Mock data for initial load
  const mockLevelData: LevelData[] = [
    {
      level: 1,
      sharks: [
        {
          id: "shark-a",
          title: "Shark A",
          image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 500,
          total: 5400,
          daily: 60,
          endDay: 90,
        },
        {
          id: "shark-b",
          title: "Shark B",
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
          title: "Shark C",
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
      let useMock = false; // Flag to decide if we need to use mock data

      try {
        const response = await fetch('/api/shark/levels');
        if (!response.ok) {
          // API responded with an error (4xx, 5xx)
          const errorData = await response.json().catch(() => ({ message: "Unknown API error" }));
          setLevelsError(errorData.error || errorData.message || "Failed to fetch levels from API.");
          console.error('API Error fetching levels:', errorData);
          useMock = true; // Mark to use mock data due to API error
        } else {
          // API responded successfully
          const data = await response.json();
          const fetchedLevels = data.levels || [];

          if (fetchedLevels.length > 0) {
            setAllLevelData(fetchedLevels);
            if (fetchedLevels.find(level => level.level === selectedLevel)) {
              // Keep current selectedLevel if it exists in new data
            } else {
              setSelectedLevel(fetchedLevels[0].level); // Set to first level from API
            }
            // Successfully loaded live data
          } else {
            // API success, but no levels returned (e.g., DB is empty)
            setLevelsError("No investment levels found from the server."); // Informative message
            console.log('No levels from API, will use mock data as fallback.');
            useMock = true; // Mark to use mock data as live data is empty
          }
        }
      } catch (error: any) {
        // Network error or other fetch-related error
        setLevelsError(error.message || "Could not connect to fetch levels.");
        console.error('Network or other error fetching levels:', error);
        useMock = true; // Mark to use mock data due to fetch error
      } finally {
        if (useMock) {
          toast({
            variant: "default", // Or "destructive" if preferred
            title: "Displaying Example Data",
            description: levelsError || "Could not fetch live investment data. Showing example plans.",
          });
          setAllLevelData(mockLevelData); // Set mock data
          if (mockLevelData.length > 0) {
            // Ensure selectedLevel is valid for mockData
             if (mockLevelData.find(level => level.level === selectedLevel)) {
              // Keep current selectedLevel if it exists in mock data
            } else {
              setSelectedLevel(mockLevelData[0].level); // Set selected level from mock data
            }
          } else {
            setSelectedLevel(1); // Fallback if mock data is also empty
            setAllLevelData([]); // Ensure allLevelData is empty if mock is empty
            setLevelsError(levelsError || "No example plans available either.");
          }
        }
        setLevelsLoading(false);
      }
    };

    fetchLevelData();
  }, [toast]); // Removed levelsError from dependency array to prevent re-fetch loops on error

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

      toast({
        title: "Purchase Successful!",
        description: `You have successfully purchased ${shark.title}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: err.message || "Something went wrong",
      });
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
                        setBuyLoading(null);
                      }}
                      className={`relative flex-shrink-0 px-4 py-1 cursor-pointer rounded-lg border-2 transition-all active:scale-95 focus-visible ${isSelected
                          ? "border-shark-blue bg-shark-blue text-white"
                          : "border-shark-blue text-shark-blue bg-white hover:bg-shark-blue hover:text-white"
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          Level {levelInfo.level}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* Selected Level Sharks */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-readable">
              Level {selectedLevel} Sharks
            </h3>
            {levelsLoading ? (
              <div className="flex justify-center items-center py-10">
                <LoadingSpinner size={32} />
              </div>
            ) : (
              <div className="space-y-4">
                
                {allLevelData
                  .find((level) => level.level === selectedLevel)
                  ?.sharks.map((shark) => {
                    console.log(shark , "shark");
                    
                    const isCurrentSharkLoading = buyLoading === `${selectedLevel}-${shark.id}`;
                    console.log(allLevelData ," allLevelData");
                    
                    return (
                      <LevelCard
                        key={shark.id}
                        level={selectedLevel}
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
                  })
                }
              </div>
            )}
          </div>

          <WelcomeModal
            isOpen={showWelcomeModal}
            onClose={() => setShowWelcomeModal(false)}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
