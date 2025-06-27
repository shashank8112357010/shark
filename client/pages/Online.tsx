import BottomNavigation from "@/components/BottomNavigation";

const Online = () => {
  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-br from-shark-blue to-shark-blue-dark px-6 py-6">
          <h1 className="text-white text-xl font-semibold">Online</h1>
        </div>

        <div className="px-6 py-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Online Support</h2>
          <p className="text-gray-600">
            Customer support and online help coming soon...
          </p>
        </div>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default Online;
