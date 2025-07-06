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
  isLocked : boolean
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
  const [levelsLoading, setLevelsLoading] = useState(false);
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
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 499,
          total: 10800,
          daily: 90,
          endDay: 120,
          isLocked : false
        },
        {
          id: "shark-b",
          title: "Shark B",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 1990,
          total: 37400,
          daily: 340,
          endDay: 110,
          isLocked : false
        }
       
      ],
    },
    {
      level: 2,
      sharks: [
        {
          id: "shark-c",
          title: "Shark C",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 4980,
          total: 13830,
          daily: 1383,
          endDay: 100,
          isLocked : true
        },
        {
          id: "shark-d",
          title: "Shark D",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 16890,
          total: 496700,
          daily: 4967,
          endDay: 100,
          isLocked : true
        },
        {
          id: "shark-vip-1",
          title: "Shark VIP 1",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 5000,
          total: 9000,
          daily: 3000,
          endDay: 3,
          isLocked : true
        },
      ],
    },
    {
      level: 3,
      sharks: [
        {
          id: "shark-e",
          title: "Shark E",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 29800,
          total: 838080,
          daily: 9312,
          endDay: 90,
          isLocked : true
        },
        {
          id: "shark-f",
          title: "Shark F",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 46800,
          total: 1290960,
          daily: 16137,
          endDay: 80,
          isLocked : true
        },
        {
          id: "shark-vip-2",
          title: "Shark VIP 2",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 10000,
          total: 18000,
          daily: 6000,
          endDay: 3,
          isLocked : true
        },
      ],
    },
    {
      level: 4,
      sharks: [
        {
          id: "shark-g",
          title: "Shark G",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 79800,
          total: 2234400,
          daily: 31920,
          endDay: 70,
          isLocked : true
        },
        {
          id: "shark-h",
          title: "Shark H",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 129800,
          total: 1947000,
          daily: 64900,
          endDay: 30,
          isLocked : true
        },
        {
          id: "shark-vip-3",
          title: "Shark VIP 3",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 20000,
          total: 36000,
          daily: 12000,
          endDay: 3,
          isLocked : true
        },
      ],
    },
    {
      level: 5,
      sharks: [
        {
          id: "shark-i",
          title: "Shark I",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 158000,
          total: 21066600,
          daily: 105333,
          endDay: 200,
          isLocked : true
        },
        
        {
          id: "shark-vip-4",
          title: "Shark VIP 4",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 30000,
          total: 54000,
          daily: 18000,
          endDay: 3,
          isLocked : true
        },
      ],
    },
  ];

  // Always use mockLevelData for level data
  useEffect(() => {
    setLevelsLoading(true);
    setAllLevelData(mockLevelData);
    setLevelsLoading(false);
    if (mockLevelData.length > 0) {
      setLevelsLoading(false);
      setSelectedLevel(mockLevelData[0].level);
    }
  }, []);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
      localStorage.setItem("hasSeenWelcome", "true");
    }

    const u = JSON.parse(localStorage.getItem("user") || "{}");
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
  const currentLevelSharkData = allLevelData.find(
    (level) => level.level === selectedLevel,
  ) || {
    level: 0, // Fallback to selectedLevel if not found, though should ideally match
    sharks: mockLevelData[0].sharks,
  };

  useEffect(() => {
    // This effect is for logging, can be kept or removed
    console.log("Selected Level:", selectedLevel);
    console.log("Current Sharks Data:", JSON.stringify(currentLevelSharkData));
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
                {mockLevelData.map((levelInfo) => {
                  console.log("Level info", JSON.stringify(levelInfo));

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
                      isLocked={shark.isLocked}
                      onBuy={() => handleBuyLevel(shark)}
                      buyLoading={isCurrentSharkLoading}
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
