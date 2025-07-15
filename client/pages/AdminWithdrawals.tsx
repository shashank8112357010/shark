import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Search, Filter, Check, X, Eye, RefreshCw, Upload, FileImage, Inbox } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface WithdrawalRequest {
  _id: string;
  phone: string;
  amount: number;
  tax: number;
  netAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  paymentUtr?: string;
  upiId?: string;
  bankAccount?: string;
  ifsc?: string;
  accountHolder?: string;
  qrImage?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminWithdrawals = () => {
  // ...existing state
  const [qrDialogImage, setQrDialogImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [approvalData, setApprovalData] = useState({
    paymentUtr: '',
    adminNotes: ''
  });
  const [rejectionData, setRejectionData] = useState({
    adminNotes: ''
  });
  const [dialogMode, setDialogMode] = useState<'view' | 'approve' | 'reject'>('view');
  
  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter, currentPage, location.pathname]);

  // Refetch data when component mounts or becomes visible
  useEffect(() => {
    const handleFocus = () => {
      fetchWithdrawals();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.log('No admin token found, redirecting to login');
        navigate('/admin/login');
        return;
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      console.log('Fetching withdrawals with params:', params.toString());
      const response = await fetch(`/api/admin/withdrawals?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setWithdrawals(data.withdrawals || []);
        setTotalPages(data.pagination?.pages || 1);
        console.log('Successfully loaded', data.withdrawals?.length || 0, 'withdrawals');
      } else {
        if (response.status === 401) {
          console.log('Authentication failed, redirecting to login');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminInfo');
          navigate('/admin/login');
          return;
        }
        console.error('API error:', data.error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to fetch withdrawals',
        });
      }
    } catch (error) {
      console.error('Network error:', error);
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Failed to connect to server. Please check your connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal || !approvalData.paymentUtr) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Payment UTR is required',
      });
      return;
    }

    try {
      setProcessingId(selectedWithdrawal._id);
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal._id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(approvalData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Withdrawal approved and completed',
        });
        
        closeDialog();
        fetchWithdrawals();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to approve withdrawal',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve withdrawal',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;

    try {
      setProcessingId(selectedWithdrawal._id);
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal._id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rejectionData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Withdrawal rejected and amount refunded',
        });
        
        closeDialog();
        fetchWithdrawals();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to reject withdrawal',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject withdrawal',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const closeDialog = () => {
    setSelectedWithdrawal(null);
    setDialogMode('view');
    setApprovalData({paymentUtr: '', adminNotes: '' });
    setRejectionData({ adminNotes: '' });
    setQrDialogImage(null);
    setQrLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };

    const className = statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';

    return (
      <Badge className={className}>
        {status.toLowerCase()}
      </Badge>
    );
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal =>
    withdrawal.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to get the correct QR image src
  const getQrImageSrc = (qrImage?: string) => {
    if (!qrImage) return '';
    if (qrImage.startsWith('http') || qrImage.startsWith('data:')) {
      return qrImage;
    }
    // Assume it's a filename or relative path
    return `/uploads/${qrImage}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center space-x-2 w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
                <p className="text-sm text-gray-600">
                  Manage and process user withdrawal requests
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchWithdrawals}
                className="flex items-center space-x-2 w-fit"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawals([])}
                  className="text-xs"
                >
                  Test Empty
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Status Filter</Label>
                <select
                  id="status"
                  className="block w-full mt-1 border rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('');
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Clear Filters</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawals List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Withdrawal Requests ({filteredWithdrawals.length})
              {process.env.NODE_ENV === 'development' && (
                <span className="text-xs text-gray-500 ml-2">
                  (Total: {withdrawals.length}, Filtered: {filteredWithdrawals.length}, Loading: {loading.toString()})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner size={32} />
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <Inbox className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Withdrawal Requests</h3>
                <p className="text-gray-500 text-center max-w-md">
                  {statusFilter || searchTerm 
                    ? "No requests match your current filters. Try adjusting your search criteria."
                    : "There are no withdrawal requests to process at the moment. New requests will appear here when users submit them."
                  }
                </p>
                {(statusFilter || searchTerm) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter('');
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWithdrawals.map((withdrawal) => (
                  <div key={withdrawal._id} className="border rounded-lg p-4 bg-white">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium">{withdrawal.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Amount</p>
                            <p className="font-semibold text-lg">{formatCurrency(withdrawal.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">UPI ID</p>
                            <p className="font-semibold text-sm">{withdrawal?.upiId || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Bank Account</p>
                            <p className="font-semibold text-xs">{withdrawal?.bankAccount || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">IFSC</p>
                            <p className="font-semibold text-xs">{withdrawal?.ifsc || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Account Holder</p>
                            <p className="font-semibold text-xs">{withdrawal?.accountHolder || '-'}</p>
                          </div>
                          {/* QR Image removed from list for performance */}
                          <div>
                            <p className="text-sm text-gray-600">Tax</p>
                            <p className="text-sm text-red-600">{formatCurrency(withdrawal.tax)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Net Amount</p>
                            <p className="font-semibold text-green-600">{formatCurrency(withdrawal.netAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Created</p>
                            <p className="text-sm">{formatDate(withdrawal.createdAt)}</p>
                          </div>
                        </div>
                        
                        {withdrawal.adminNotes && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600">Admin Notes</p>
                            <p className="text-sm bg-gray-50 p-2 rounded">{withdrawal.adminNotes}</p>
                          </div>
                        )}
                        
                        {withdrawal.paymentUtr && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600">Payment UTR</p>
                            <p className="text-sm font-mono bg-gray-50 p-2 rounded">{withdrawal.paymentUtr}</p>
                          </div>
                        )}
                        
                        {withdrawal.reviewedBy && (
                          <div className="mt-2 text-xs text-gray-500">
                            Reviewed by {withdrawal.reviewedBy} on {formatDate(withdrawal.reviewedAt!)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 lg:ml-4">
                        <div className="flex items-center justify-between sm:justify-start space-x-3">
                          {getStatusBadge(withdrawal.status)}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setDialogMode('view');
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </div>

                        {withdrawal.status === 'PENDING' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setDialogMode('approve');
                              }}
                              disabled={processingId === withdrawal._id}
                              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                            >
                              <Check className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Approve</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setDialogMode('reject');
                              }}
                              disabled={processingId === withdrawal._id}
                              className="flex-1 sm:flex-none"
                            >
                              <X className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Reject</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        {selectedWithdrawal && (
          <Dialog open={!!selectedWithdrawal} onOpenChange={() => closeDialog()}>
            {/* Fetch QR image on dialog open if present */}
            {selectedWithdrawal.qrImage && !qrDialogImage && !qrLoading && (
              (() => {
                setQrLoading(true);
                fetch(`/api/admin/withdrawals/${selectedWithdrawal._id}/qr`, {
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
                })
                  .then(res => res.json())
                  .then(data => {
                    setQrDialogImage(data.qrImage || null);
                  })
                  .catch(() => setQrDialogImage(null))
                  .finally(() => setQrLoading(false));
                return null;
              })()
            )}

            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {dialogMode === 'view' && 'Withdrawal Details'}
                  {dialogMode === 'approve' && 'Approve Withdrawal'}
                  {dialogMode === 'reject' && 'Reject Withdrawal'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <p className="font-medium">{selectedWithdrawal.phone}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    {getStatusBadge(selectedWithdrawal.status)}
                  </div>
                  {/* <div>
                    <Label>UPI ID</Label>
                    {selectedWithdrawal.upiId}
                  </div> */}
                  <div>
                    <Label>Amount</Label>
                    <p className="font-semibold text-lg">{formatCurrency(selectedWithdrawal.amount)}</p>
                  </div>
                  <div>
                    <Label>Tax</Label>
                    <p className="text-red-600">{formatCurrency(selectedWithdrawal.tax)}</p>
                  </div>
                  <div>
                    <Label>Net Amount</Label>
                    <p className="font-semibold text-green-600">{formatCurrency(selectedWithdrawal.netAmount)}</p>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p className="text-sm">{formatDate(selectedWithdrawal.createdAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>UPI ID</Label>
                    <p className="font-mono text-sm">{selectedWithdrawal.upiId || '-'}</p>
                  </div>
                  <div>
                    <Label>Bank Account</Label>
                    <p className="text-xs">{selectedWithdrawal.bankAccount || '-'}</p>
                  </div>
                  <div>
                    <Label>IFSC</Label>
                    <p className="text-xs">{selectedWithdrawal.ifsc || '-'}</p>
                  </div>
                  <div>
                    <Label>Account Holder</Label>
                    <p className="text-xs">{selectedWithdrawal.accountHolder || '-'}</p>
                  </div>
                  <div>
                    <Label>QR Image</Label>
                    {qrLoading ? (
                      <LoadingSpinner size={24} />
                    ) : qrDialogImage ? (
                      <img
                        src={getQrImageSrc(qrDialogImage)}
                        alt="QR"
                        className="w-32 h-32 object-contain border rounded"
                      />
                    ) : (
                      <span className="text-xs">-</span>
                    )}
                  </div>
                </div>

                {dialogMode === 'approve' && (
                  <>
                  

                    <div>
                      <Label htmlFor="utr">Payment UTR Number *</Label>
                      <Input
                        id="utr"
                        placeholder="Enter UTR number from bank transaction"
                        value={approvalData.paymentUtr}
                        onChange={(e) => setApprovalData({...approvalData, paymentUtr: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Admin Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add notes about the payment..."
                        value={approvalData.adminNotes}
                        onChange={(e) => setApprovalData({...approvalData, adminNotes: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={closeDialog}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleApprove}
                        disabled={ !approvalData.paymentUtr || processingId === selectedWithdrawal._id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingId === selectedWithdrawal._id ? (
                          <>
                            <LoadingSpinner size={16} className="mr-2" />
                            Processing...
                          </>
                        ) : (
                          'Approve & Complete'
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {dialogMode === 'reject' && (
                  <>
                    <div>
                      <Label htmlFor="rejectionNotes">Reason for Rejection *</Label>
                      <Textarea
                        id="rejectionNotes"
                        placeholder="Explain why this withdrawal is being rejected..."
                        value={rejectionData.adminNotes}
                        onChange={(e) => setRejectionData({...rejectionData, adminNotes: e.target.value})}
                        rows={4}
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={closeDialog}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={!rejectionData.adminNotes || processingId === selectedWithdrawal._id}
                      >
                        {processingId === selectedWithdrawal._id ? (
                          <>
                            <LoadingSpinner size={16} className="mr-2" />
                            Processing...
                          </>
                        ) : (
                          'Reject Withdrawal'
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {dialogMode === 'view' && (
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={closeDialog}>
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default AdminWithdrawals;
