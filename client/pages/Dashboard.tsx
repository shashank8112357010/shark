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

  const [balance, setBalance] = useState(0);
  const [buyLoading, setBuyLoading] = useState<string | null>(null);
  const [buyError, setBuyError] = useState("");
  const [buySuccess, setBuySuccess] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [currentReferrals, setCurrentReferrals] = useState(0);
  const [user, setUser] = useState(null);

  const levelData: LevelData[] = [
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
        {
          id: "shark-d",
          title: "Shark D",
          image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 3100,
          total: 27900,
          daily: 310,
          endDay: 90,
        },
      ],
    },
    {
      level: 3,
      sharks: [
        {
          id: "shark-e",
          title: "Shark E",
          image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 2000,
          total: 4440,
          daily: 888,
          endDay: 5,
        },
      ],
    },
    {
      level: 4,
      sharks: [
        {
          id: "shark-f",
          title: "Shark F",
          image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 3000,
          total: 4995,
          daily: 999,
          endDay: 5,
        },
      ],
    },
    {
      level: 5,
      sharks: [
        {
          id: "shark-g",
          title: "Shark G",
          image: "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 3000,
          total: 4995,
          daily: 999,
          endDay: 5,
        },
      ],
    },
  ];

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
  const currentLevelData = levelData.find((level) => level.level === selectedLevel) || {
    level: selectedLevel,
    sharks: []
  };

  useEffect(() => {
    console.log("Selected Level:", selectedLevel);
    console.log("Current Level Data:", currentLevelData);
  }, [selectedLevel]);

  return (
    <Layout className="scroll-smooth no-overscroll">
      <div className="px-6 py-6">
        {/* Level Selector */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-readable">
            Investment Levels
          </h2>
          <div className="overflow-x-auto">
            <div className="flex space-x-3 p-2 min-w-max">
              {levelData.map((levelInfo) => {
                const isSelected = selectedLevel === levelInfo.level;

                return (
                  <button
                    key={levelInfo.level}
                    onClick={() => {
                      console.log("Level selected:", levelInfo.level);
                      setSelectedLevel(levelInfo.level);
                      setBuyError("");
                      setBuySuccess("");
                      // Reset loading state when level changes
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
          {buyError && (
            <div className="text-red-600 text-sm mb-2">{buyError}</div>
          )}
          {buySuccess && (
            <div className="text-green-600 text-sm mb-2">{buySuccess}</div>
          )}
          <div className="space-y-4">
            {currentLevelData.sharks.map((shark) => {
              const isCurrentSharkLoading = buyLoading === `${selectedLevel}-${shark.id}`;
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
            })}
          </div>
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
