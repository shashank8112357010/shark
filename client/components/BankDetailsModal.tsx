import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";
import { 
  CreditCard, 
  Smartphone, 
  QrCode, 
  Plus, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  X,
  Save,
  Trash2
} from "lucide-react";

interface BankDetails {
  id?: string;
  type: 'upi' | 'bank' | 'qr';
  name: string;
  details: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    qrCodeUrl?: string;
  };
  isDefault: boolean;
  createdAt?: string;
}

interface BankDetailsModalProps {
  children: React.ReactNode;
  onDetailsSelected?: (details: BankDetails) => void;
}

const BankDetailsModal = ({ children, onDetailsSelected }: BankDetailsModalProps) => {
  const { userData } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    upiId: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    qrFile: null as File | null,
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (open && userData?.phone) {
      fetchBankDetails();
    }
  }, [open, userData?.phone]);

  const fetchBankDetails = async () => {
    if (!userData?.phone) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/bank-details/${userData.phone}`);
      if (response.ok) {
        const data = await response.json();
        setBankDetails(data.bankDetails || []);
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (type: 'upi' | 'bank' | 'qr') => {
    if (!userData?.phone) return;

    setLoading(true);
    try {
      let qrCodeUrl = '';
      if (type === 'qr' && formData.qrFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.qrFile);
        const uploadResponse = await fetch('/api/upload/qr', {
          method: 'POST',
          body: formDataUpload,
        });
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          qrCodeUrl = uploadData.url;
        }
      }

      const newDetails: BankDetails = {
        id: editingId || undefined,
        type,
        name: formData.name,
        details: {
          ...(type === 'upi' && { upiId: formData.upiId }),
          ...(type === 'bank' && {
            accountNumber: formData.accountNumber,
            ifscCode: formData.ifscCode,
            accountHolderName: formData.accountHolderName,
          }),
          ...(type === 'qr' && { qrCodeUrl }),
        },
        isDefault: bankDetails.length === 0,
      };

      const response = await fetch(`/api/bank-details/${userData.phone}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDetails),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${type.toUpperCase()} details ${editingId ? 'updated' : 'saved'} successfully`,
        });
        
        // Reset form
        setFormData({
          name: '',
          upiId: '',
          accountNumber: '',
          ifscCode: '',
          accountHolderName: '',
          qrFile: null,
        });
        setEditingId(null);
        setActiveTab('list');
        fetchBankDetails();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save details');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save bank details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userData?.phone) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/bank-details/${userData.phone}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Bank details deleted successfully',
        });
        fetchBankDetails();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete bank details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!userData?.phone) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/bank-details/${userData.phone}/${id}/default`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Default payment method updated',
        });
        fetchBankDetails();
      } else {
        throw new Error('Failed to update default');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update default payment method',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (details: BankDetails) => {
    onDetailsSelected?.(details);
    setOpen(false);
  };

  const getIcon = (type: 'upi' | 'bank' | 'qr') => {
    switch (type) {
      case 'upi':
        return <Smartphone className="h-5 w-5" />;
      case 'bank':
        return <CreditCard className="h-5 w-5" />;
      case 'qr':
        return <QrCode className="h-5 w-5" />;
    }
  };

  const getDisplayText = (details: BankDetails) => {
    switch (details.type) {
      case 'upi':
        return details.details.upiId;
      case 'bank':
        return `****${details.details.accountNumber?.slice(-4)}`;
      case 'qr':
        return 'QR Code Payment';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Bank Details Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Saved Details</TabsTrigger>
            <TabsTrigger value="add">Add New</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <div className="space-y-4">
              {bankDetails.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No bank details saved yet. Add your first payment method to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                bankDetails.map((details) => (
                  <Card key={details.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-full">
                            {getIcon(details.type)}
                          </div>
                          <div>
                            <p className="font-medium">{details.name}</p>
                            <p className="text-sm text-gray-600">{getDisplayText(details)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {details.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelect(details)}
                          >
                            Select
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="add" className="mt-4">
            <Tabs defaultValue="upi">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upi">UPI</TabsTrigger>
                <TabsTrigger value="bank">Bank</TabsTrigger>
                <TabsTrigger value="qr">QR Code</TabsTrigger>
              </TabsList>

              <TabsContent value="upi" className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="upi-name">Display Name</Label>
                  <Input
                    id="upi-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., My UPI"
                  />
                </div>
                <div>
                  <Label htmlFor="upi-id">UPI ID</Label>
                  <Input
                    id="upi-id"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="yourname@upi"
                  />
                </div>
                <Button 
                  onClick={() => handleSave('upi')} 
                  disabled={loading || !formData.name || !formData.upiId}
                  className="w-full"
                >
                  {loading ? 'Saving...' : 'Save UPI Details'}
                </Button>
              </TabsContent>

              <TabsContent value="bank" className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="bank-name">Display Name</Label>
                  <Input
                    id="bank-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., My Bank Account"
                  />
                </div>
                <div>
                  <Label htmlFor="account-number">Account Number</Label>
                  <Input
                    id="account-number"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <Label htmlFor="ifsc">IFSC Code</Label>
                  <Input
                    id="ifsc"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                    placeholder="Enter IFSC code"
                  />
                </div>
                <div>
                  <Label htmlFor="account-holder">Account Holder Name</Label>
                  <Input
                    id="account-holder"
                    value={formData.accountHolderName}
                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                    placeholder="Enter account holder name"
                  />
                </div>
                <Button 
                  onClick={() => handleSave('bank')} 
                  disabled={loading || !formData.name || !formData.accountNumber || !formData.ifscCode || !formData.accountHolderName}
                  className="w-full"
                >
                  {loading ? 'Saving...' : 'Save Bank Details'}
                </Button>
              </TabsContent>

              <TabsContent value="qr" className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="qr-name">Display Name</Label>
                  <Input
                    id="qr-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., My QR Code"
                  />
                </div>
                <div>
                  <Label htmlFor="qr-file">QR Code Image</Label>
                  <Input
                    id="qr-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, qrFile: e.target.files?.[0] || null })}
                  />
                </div>
                <Button 
                  onClick={() => handleSave('qr')} 
                  disabled={loading || !formData.name || !formData.qrFile}
                  className="w-full"
                >
                  {loading ? 'Saving...' : 'Save QR Code'}
                </Button>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BankDetailsModal;
