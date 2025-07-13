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
import { useUser } from "@/contexts/UserContext";
import { mockLevelData } from "@/lib/mock-data";

interface Shark {
  id: string;
  title: string;
  image: string;
  price: number;
  total: number;
  daily: number;
  endDay: number;
  isLocked: boolean;
  isPurchased?: boolean; // Add purchased status
}

interface LevelData {
  level: number;
  sharks: Shark[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUserData } = useUser();

  // State for dynamic level data
  const [allLevelData, setAllLevelData] = useState<LevelData[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);

  // Existing states
  const [buyLoading, setBuyLoading] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  // Referral data now comes from UserContext
  const [user, setUser] = useState<any>(null);

  // Fetch real level data with purchase status
  useEffect(() => {
    const fetchLevelData = async () => {
      if (!user?.phone) return;
      
      setLevelsLoading(true);
      try {
        // Try to fetch real data first
        const response = await fetch(`/api/shark/levels/${user.phone}`);
        if (response.ok) {
          const data = await response.json();
          if (data.levels && data.levels.length > 0) {
            setAllLevelData(data.levels);
            setSelectedLevel(data.levels[0].level);
            setLevelsLoading(false);
            return;
          }
        }
        
        // Fallback to mock data if API fails or returns empty
        console.log('Using mock data as fallback');
        setAllLevelData(mockLevelData);
        setSelectedLevel(mockLevelData[0].level);
      } catch (error) {
        console.error('Error fetching level data:', error);
        // Use mock data as fallback
        setAllLevelData(mockLevelData);
        setSelectedLevel(mockLevelData[0].level);
      } finally {
        setLevelsLoading(false);
      }
    };
    
    fetchLevelData();
  }, [user]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
      localStorage.setItem("hasSeenWelcome", "true");
    }

    const u = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(u);
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
          level: selectedLevel,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Purchase failed");

      toast({
        title: "Purchase Successful!",
        description: `You have successfully purchased ${shark.title}.`,
      });
      
      // Refresh user data and level data to show updated purchase status
      try {
        // Refresh user balance
        await refreshUserData();
        
        // Refresh level data
        const response = await fetch(`/api/shark/levels/${user.phone}`);
        if (response.ok) {
          const data = await response.json();
          if (data.levels && data.levels.length > 0) {
            setAllLevelData(data.levels);
          }
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
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
  const currentLevelSharkData = allLevelData.find(
    (level) => level.level === selectedLevel,
  ) || {
    level: 0, // Fallback to selectedLevel if not found, though should ideally match
    sharks: mockLevelData[0].sharks,
  };


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
                {mockLevelData.map((levelInfo) => {
                  const isSelected = selectedLevel === levelInfo.level;
                  return (
                    <button
                      key={levelInfo.level}
                      onClick={() => {
                        setSelectedLevel(levelInfo.level);
                        setBuyLoading(null);
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
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Referrals */}
          {/* <div className="mt-4 bg-white rounded-lg p-3 card-shadow">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 text-readable">
                Current Referrals:
              </span>
              <span className="font-semibold text-shark-blue">
                {currentReferrals}
              </span>
            </div>
          </div> */}

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
                {currentLevelSharkData.sharks.map((shark) => {
                  const isCurrentSharkLoading =
                    buyLoading === `${selectedLevel}-${shark.id}`;
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
                      isLocked={shark.isLocked} // Lock if already purchased
                      onBuy={() => handleBuyLevel(shark)}
                      buyLoading={isCurrentSharkLoading}
                      isPurchased={(shark as any).isPurchased}
                    />
                  );
                })}
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
