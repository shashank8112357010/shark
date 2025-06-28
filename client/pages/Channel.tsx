import Layout from "@/components/Layout";
import Header from "@/components/Header";

const Channel = () => {
  return (
    <Layout
      header={<Header title="Channel" />}
      className="scroll-smooth no-overscroll"
    >
      <div className="px-6 py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-readable">
          Communication Channel
        </h2>
        <p className="text-gray-600 text-readable">
          Telegram and support channels coming soon...
        </p>
      </div>
    </Layout>
  );
};

export default Channel;
