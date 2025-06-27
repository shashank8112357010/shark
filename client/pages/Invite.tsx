import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Plus } from "lucide-react";

const Invite = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const inviteLink =
    "https://www.rrplb69-iviesm-onocnc717.com/index/user/register/invite_code/vta8o.html";
  const inviteCode = "vta8o";

  const copyToClipboard = (text: string) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        },
        (err) => {
          console.warn("Clipboard API failed:", err);
          fallbackCopy(text);
        },
      );
    } else {
      // Use fallback for non-secure contexts or unsupported browsers
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      textArea.style.top = "-9999px";
      textArea.setAttribute("readonly", "");

      document.body.appendChild(textArea);

      // Select and copy the text
      textArea.select();
      textArea.setSelectionRange(0, 99999); // For mobile devices

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error("Fallback copy failed");
        // Show user a manual copy message
        alert(`Please copy manually: ${text}`);
      }
    } catch (err) {
      console.error("All copy methods failed:", err);
      // Show user a manual copy message as last resort
      alert(`Please copy manually: ${text}`);
    }
  };

  const handleCopyLink = () => {
    copyToClipboard(inviteLink);
  };

  const handleCopyCode = () => {
    copyToClipboard(inviteCode);
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-shark-blue to-shark-blue-dark px-6 py-6 flex items-center">
          <button onClick={() => navigate(-1)} className="text-white mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-xl font-semibold">Invite</h1>
        </div>

        {/* Hero Image */}
        <div className="px-6 py-6">
          <div className="relative h-48 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-xl overflow-hidden">
            {/* Background water effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-cyan-400/30"></div>

            {/* Shark cans illustration placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-6xl font-bold italic opacity-80">
                SHARK
              </div>
            </div>
          </div>
        </div>

        {/* Invite Link Section */}
        <div className="px-6 space-y-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">
                Invitation link:
              </span>
              <button onClick={handleCopyCode} className="text-shark-blue">
                <Plus size={20} />
              </button>
            </div>
            <div className="text-sm text-gray-600 break-all">{inviteLink}</div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">
                Invitation code:
              </span>
              <button onClick={handleCopyCode} className="text-shark-blue">
                <Plus size={20} />
              </button>
            </div>
            <div className="text-sm text-gray-600">{inviteCode}</div>
          </div>

          {/* Copy Link Button */}
          <Button
            onClick={handleCopyLink}
            className="w-full h-14 bg-shark-blue hover:bg-shark-blue-dark text-white text-lg font-medium rounded-lg"
          >
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>

        {/* Level Progression & Rewards */}
        <div className="px-6 mt-8">
          <h3 className="text-xl font-semibold mb-4">Refer And Level Up</h3>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border-l-4 border-shark-blue">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-lg">Level 1 → Level 2</div>
                  <div className="text-gray-600">10 referrals needed</div>
                </div>
                <div className="text-right">
                  <div className="text-shark-blue font-semibold">₹1,000</div>
                  <div className="text-sm text-gray-600">Unlock Reward</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-shark-blue">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-lg">Level 2 → Level 3</div>
                  <div className="text-gray-600">20 referrals needed</div>
                </div>
                <div className="text-right">
                  <div className="text-shark-blue font-semibold">₹1,000</div>
                  <div className="text-sm text-gray-600">Unlock Reward</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-shark-blue">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-lg">Level 3 → Level 4</div>
                  <div className="text-gray-600">30 referrals needed</div>
                </div>
                <div className="text-right">
                  <div className="text-shark-blue font-semibold">₹1,000</div>
                  <div className="text-sm text-gray-600">Unlock Reward</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-shark-blue">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-lg">Level 4 → Level 5</div>
                  <div className="text-gray-600">50 referrals needed</div>
                </div>
                <div className="text-right">
                  <div className="text-shark-blue font-semibold">₹2,000</div>
                  <div className="text-sm text-gray-600">
                    Final Level Reward
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Level Bonuses */}
          <div className="mt-6 space-y-3">
            <div className="text-shark-blue text-lg font-medium">
              Level 1 Invite Bonus: 25%
            </div>
            <div className="text-shark-blue text-lg font-medium">
              Level 2 Invite Bonus: 3%
            </div>
            <div className="text-shark-blue text-lg font-medium">
              Level 3 Invite Bonus: 2%
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="px-6 mt-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">QR code</h3>
            <div className="bg-white rounded-lg p-6 inline-block">
              {/* QR Code placeholder */}
              <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-gray-500 text-sm text-center">
                  QR Code
                  <br />
                  Placeholder
                </div>
              </div>
            </div>
          </div>
        </div>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default Invite;
