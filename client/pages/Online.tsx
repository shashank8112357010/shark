import Layout from "@/components/Layout";
import Header from "@/components/Header";

const Online = () => {
  return (
    <Layout
      className="scroll-smooth no-overscroll"
    >
      <div className="px-6 py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-readable">
          Online Support
        </h2>
        <p className="text-gray-600 text-readable">
          Customer support and online help coming soon...
        </p>
      </div>
    </Layout>
  );
};

export default Online;
