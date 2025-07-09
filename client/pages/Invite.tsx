import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useStateChange } from "@/hooks/useStateChange";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";


const Invite = () => {
  const { toast } = useToast(); // Initialize toast
  const { handleStateChange } = useStateChange();
  const { userData, loading: userLoading } = useUser();
  const [copied, setCopied] = useState(false);
  const [referralBonus, setReferralBonus] = useState<number | null>(200);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    const fetchReferralConfig = async () => {
      setConfigLoading(true);
      try {
        const response = await fetch("/api/referral/config");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch referral configuration");
        }
        const data = await response.json();
        setReferralBonus(data.referralBonusAmount);
      } catch (error: any) {
        console.error("Error fetching referral config:", error);
        toast({
          variant: "destructive",
          title: "Could not load referral bonus",
          description: error.message,
        });
        setReferralBonus(200); // Fallback to a default if API fails, or null to hide message
      } finally {
        setConfigLoading(false);
      }
    };
    fetchReferralConfig();
  }, [toast]);

  // Get registration domain from env or fallback
  const registrationDomain = import.meta.env.VITE_REGISTRATION_DOMAIN || "theshark.in";

  // Use invite code from userData, fallback to a default or empty if not available
  const inviteCode = userData?.inviteCode || "";

  // Build invite link, ensure it's dynamically updated if inviteCode changes
  // Using query parameter for a more standard approach.
  const inviteLink = inviteCode
    ? `https://${registrationDomain}/?invite_code=${inviteCode}`
    : "";

  // Logging for debugging referral link generation
  useEffect(() => {
    console.log("[Invite.tsx] UserData Invite Code:", userData?.inviteCode);
    console.log("[Invite.tsx] Registration Domain:", registrationDomain);
    console.log("[Invite.tsx] Generated Invite Link:", inviteLink);
  }, [userData?.inviteCode, registrationDomain, inviteLink]);

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
    <Layout className="scroll-smooth no-overscroll text-readable">
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
              {inviteLink ? (
                <a
                  href={inviteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-shark-blue underline text-base break-all"
                >
                  {inviteLink}
                </a>
              ) : (
                <span className="text-red-500 text-base">Invite link unavailable. Please check your account or contact support.</span>
              )}
            </div>
            <div className="mt-2 flex justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
                className="mr-2"
                disabled={!inviteLink}
              >
                Copy Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                disabled={!inviteCode}
              >
                Copy Code
              </Button>
            </div>
            {!inviteLink && (
              <div className="mt-2 text-xs text-red-500 text-center">
                Your invite link is not available. Please ensure your account is fully registered and try again.
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500 text-center">
              Or share this link/QR with your friends to register
            </div>
            {(referralBonus !== null && referralBonus > 0) && (
              <div className="mt-2 text-green-600 text-sm font-semibold">
                {configLoading ? "Loading bonus info..." : `Earn ₹ 200  for every friend who registers and completes onboarding!`}
              </div>
            )}
            {(referralBonus === 0 && !configLoading) && (
                <div className="mt-2 text-gray-600 text-sm font-semibold">
                    Referral program details are currently unavailable.
                </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Invite;
