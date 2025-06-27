import BottomNavigation from "@/components/BottomNavigation";

const Plans = () => {
  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-br from-shark-blue to-shark-blue-dark px-6 py-6">
          <h1 className="text-white text-xl font-semibold">Plans</h1>
        </div>

        <div className="px-6 py-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Investment Plans</h2>
          <p className="text-gray-600">
            Detailed investment plans view coming soon...
          </p>
        </div>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default Plans;
