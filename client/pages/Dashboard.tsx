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

const Dashboard = () => {
  const navigate = useNavigate();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [currentReferrals, setCurrentReferrals] = useState(35); // Mock referral count
  const [selectedLevel, setSelectedLevel] = useState(1); // Currently selected level

  useEffect(() => {
    // Show welcome modal on first visit
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
      localStorage.setItem("hasSeenWelcome", "true");
    }
  }, []);

  const navigationItems = [
    { icon: IndianRupee, label: "Recharge", path: "/recharge" },
    { icon: Download, label: "Withdraw", path: "/withdraw" },
    { icon: MessageCircle, label: "Channel", path: "/channel" },
    { icon: RotateCcw, label: "Online", path: "/online" },
    { icon: UserPlus, label: "Invite", path: "/invite" },
  ];

  const levelData = [
    {
      level: 1,
      referralsNeeded: 0, // Always unlocked
      reward: 0, // No reward for level 1
      sharks: [
        {
          title: "Premium Shark",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 500,
          total: 5400,
          daily: 60,
          endDay: 90,
        },
      ],
    },
    {
      level: 2,
      referralsNeeded: 10,
      reward: 1000,
      sharks: [
        {
          title: "Shark C",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 2100,
          total: 21600,
          daily: 240,
          endDay: 90,
        },
        {
          title: "Shark D",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 3100,
          total: 27900,
          daily: 310,
          endDay: 90,
        },
      ],
    },
    {
      level: 3,
      referralsNeeded: 20,
      reward: 1000,
      sharks: [
        {
          title: "Shark E",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 2000,
          total: 4440,
          daily: 888,
          endDay: 5,
        },
      ],
    },
    {
      level: 4,
      referralsNeeded: 30,
      reward: 1000,
      sharks: [
        {
          title: "Shark F",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 3000,
          total: 4995,
          daily: 999,
          endDay: 5,
        },
      ],
    },
    {
      level: 5,
      referralsNeeded: 50,
      reward: 2000, // Special reward for final level
      sharks: [
        {
          title: "Shark G",
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F01a259d5bb5845f29797ea6857fc598b%2Fb915896bfba24472a9e1c592ba472dcc?format=webp&width=800",
          price: 3000,
          total: 4995,
          daily: 999,
          endDay: 5,
        },
      ],
    },
  ];

  const isLevelUnlocked = (level: number, referralsNeeded: number) => {
    return level <= 4; // Unlock levels 1-4, keep level 5 locked
  };

  const handleBuyLevel = (level: any) => {
    console.log("Buying level:", level);
  };

  const handleViewRequirements = (level: any) => {
    navigate("/invite");
  };

  const getSelectedLevelData = () => {
    return (
      levelData.find((level) => level.level === selectedLevel) || levelData[0]
    );
  };

  const currentLevelData = getSelectedLevelData();

  return (
    <Layout
      header={
        <div className="relative h-48 bg-gradient-to-br from-shark-blue to-shark-blue-dark overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20"></div>

          {/* Shark branding */}
          <div className="absolute bottom-6 left-6">
            <div className="text-white text-4xl font-bold italic">Shark</div>
            <div className="text-white/80 text-base">Ocean Investment</div>
          </div>
        </div>
      }
      className="scroll-smooth no-overscroll"
    >
      {/* Fixed Navigation Grid */}
      <div className="px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-xl p-3 card-shadow-lg">
          <div className="grid grid-cols-5 gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-all active:scale-95 focus-visible"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                    <Icon size={14} className="text-gray-700" />
                  </div>
                  <span className="text-xs text-gray-700 text-center text-readable">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="px-6 pb-6">
        {/* Level Selector */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-readable">
            Investment Levels
          </h2>
          <div className="overflow-x-auto">
            <div className="flex space-x-3 pb-2 min-w-max">
              {levelData.map((levelInfo) => {
                const isUnlocked = isLevelUnlocked(
                  levelInfo.level,
                  levelInfo.referralsNeeded,
                );
                const isSelected = selectedLevel === levelInfo.level;

                return (
                  <button
                    key={levelInfo.level}
                    onClick={() => setSelectedLevel(levelInfo.level)}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all active:scale-95 focus-visible ${
                      isSelected
                        ? "border-shark-blue bg-shark-blue text-white"
                        : isUnlocked
                          ? "border-shark-blue text-shark-blue bg-white hover:bg-shark-blue hover:text-white"
                          : "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                    }`}
                    disabled={!isUnlocked}
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium text-readable">
                        Level {levelInfo.level}
                      </div>
                      <div className="text-xs mt-1">
                        {isUnlocked ? "✓" : "🔒"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Referrals Display */}
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
          <div className="space-y-4">
            {currentLevelData.sharks.map((shark, index) => (
              <LevelCard
                key={index}
                level={selectedLevel}
                title={shark.title}
                image={shark.image}
                price={shark.price}
                total={shark.total}
                daily={shark.daily}
                endDay={shark.endDay}
                isUnlocked={isLevelUnlocked(
                  selectedLevel,
                  currentLevelData.referralsNeeded,
                )}
                referralsNeeded={currentLevelData.referralsNeeded}
                currentReferrals={currentReferrals}
                reward={currentLevelData.reward}
                onBuy={() => handleBuyLevel(shark)}
                onViewRequirements={() =>
                  handleViewRequirements(currentLevelData)
                }
              />
            ))}
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
