import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useStateChange } from "@/hooks/useStateChange";
import { useUser } from "@/contexts/UserContext";

const Invite = () => {
  const navigate = useNavigate();
  const { handleStateChange } = useStateChange();
  const { userData } = useUser();
  const [copied, setCopied] = useState(false);

    // Get registration domain from env or fallback
  const registrationDomain = import.meta.env.VITE_REGISTRATION_DOMAIN || "theshark.in";
  const inviteCode = "vta8o";
  // Build invite link
  const inviteLink = `https://${registrationDomain}/index/user/register/invite_code/${inviteCode}.html`;

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
        handleStateChange();
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
    <Layout
      className="scroll-smooth no-overscroll text-readable"
    >
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

      {/* Scan & Register Section */}
      <div className="px-6 mt-8 pb-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4 text-readable">Scan & Register</h3>
          <div className="bg-white rounded-lg p-6 inline-block card-shadow">
            <div className="w-48 h-48 flex items-center justify-center mx-auto">
              <QRCodeCanvas value={inviteLink} size={192} />
            </div>
            <div className="mt-4">
              <a
                href={inviteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-shark-blue underline text-base break-all"
              >
                {inviteLink}
              </a>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Or share this link/QR with your friends to register
            </div>
            <div className="mt-2 text-green-600 text-sm font-semibold">
              Earn ₹150 for every friend who registers and completes onboarding!
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Invite;
