import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal = ({ isOpen, onClose }: WelcomeModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-white rounded-2xl p-6">
        <DialogTitle className="text-2xl font-bold text-center">
          Shark
        </DialogTitle>
        <div className="text-center space-y-4">
          {/* Welcome Text */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-shark-blue">
              Welcome to join Shark APP!
            </h2>
            <div className="text-sm text-shark-blue space-y-1">
              <div>Minimum deposit: 500 rupees</div>
              <div>Minimum withdrawal: 124 rupees</div>
              <div>Withdrawal time: 0:30 am - 17:00 pm</div>
              <div>Invite friends to join, the highest</div>
              <div>team commission: 30%.</div>
            </div>
          </div>

          {/* Image placeholder */}
          <div className="h-32 bg-gradient-to-r from-shark-blue to-shark-blue-dark rounded-lg flex items-center justify-center">
            <div className="text-white text-xl font-bold">SHARK OCEAN</div>
          </div>

          {/* Join Telegram Button */}
          <Button
            onClick={onClose}
            className="w-full h-12 bg-shark-blue hover:bg-shark-blue-dark text-white font-medium rounded-lg"
          >
            JOIN TELEGRAM CHANNEL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
