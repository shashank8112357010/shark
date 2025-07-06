import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Search, Filter, Check, X, Eye, RefreshCw, Inbox } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface RechargeRequest {
  _id: string;
  phone: string;
  amount: number;
  utrNumber: string;
  qrCode: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminRechargeRequests = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RechargeRequest | null>(null);
  const [reviewData, setReviewData] = useState({
    status: '',
    adminNotes: '',
    approvedAmount: ''
  });
  
  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, currentPage, location.pathname]);

  // Refetch data when component mounts or becomes visible
  useEffect(() => {
    const handleFocus = () => {
      fetchRequests();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchRequests = async () => {
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

      console.log('Fetching recharge requests with params:', params.toString());
      const response = await fetch(`/api/admin/recharge-requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setRequests(data.rechargeRequests || []);
        setTotalPages(data.pagination?.pages || 1);
        console.log('Successfully loaded', data.rechargeRequests?.length || 0, 'recharge requests');
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
          description: data.error || 'Failed to fetch requests',
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

  const handleReview = async () => {
    if (!selectedRequest || !reviewData.status) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a status',
      });
      return;
    }

    if (reviewData.status === 'approved' && (!reviewData.approvedAmount || isNaN(Number(reviewData.approvedAmount)) || Number(reviewData.approvedAmount) <= 0)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid approved amount',
      });
      return;
    }

    try {
      setProcessingId(selectedRequest._id);
      const token = localStorage.getItem('adminToken');

      const requestBody = {
        status: reviewData.status,
        adminNotes: reviewData.adminNotes,
        ...(reviewData.status === 'approved' && { approvedAmount: Number(reviewData.approvedAmount) })
      };

      const response = await fetch(`/api/admin/recharge-requests/${selectedRequest._id}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Recharge request ${reviewData.status}${reviewData.status === 'approved' ? ` with ₹${reviewData.approvedAmount}` : ''}`,
        });
        
        setSelectedRequest(null);
        setReviewData({ status: '', adminNotes: '', approvedAmount: '' });
        fetchRequests();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to review request',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to review request',
      });
    } finally {
      setProcessingId(null);
    }
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
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const className = statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';

    return (
      <Badge className={className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredRequests = requests.filter(request =>
    request.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.utrNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className=" shadow-sm border-b">
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Recharge Requests</h1>
                <p className="text-sm text-gray-600">
                  Manage and review user recharge requests
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRequests}
                className="flex items-center space-x-2 w-fit"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRequests([])}
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
                    placeholder="Search by phone or UTR..."
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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
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

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Recharge Requests ({filteredRequests.length})
              {process.env.NODE_ENV === 'development' && (
                <span className="text-xs text-gray-500 ml-2">
                  (Total: {requests.length}, Filtered: {filteredRequests.length}, Loading: {loading.toString()})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner size={32} />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <Inbox className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recharge Requests</h3>
                <p className="text-gray-500 text-center max-w-md">
                  {statusFilter || searchTerm 
                    ? "No requests match your current filters. Try adjusting your search criteria."
                    : "There are no recharge requests to review at the moment. New requests will appear here when users submit them."
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
                {filteredRequests.map((request) => (
                  <div key={request._id} className="border rounded-lg p-4 bg-white">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium">{request.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Amount</p>
                            <p className="font-semibold text-lg">{formatCurrency(request.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">UTR Number</p>
                            <p className="font-mono text-sm break-all">{request.utrNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Created</p>
                            <p className="text-sm">{formatDate(request.createdAt)}</p>
                          </div>
                        </div>
                        
                        {request.adminNotes && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600">Admin Notes</p>
                            <p className="text-sm bg-gray-50 p-2 rounded">{request.adminNotes}</p>
                          </div>
                        )}
                        
                        {request.reviewedBy && (
                          <div className="mt-2 text-xs text-gray-500">
                            Reviewed by {request.reviewedBy} on {formatDate(request.reviewedAt!)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 lg:ml-4">
                        <div className="flex items-center justify-between sm:justify-start space-x-3">
                          {getStatusBadge(request.status)}
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">View</span>
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        </div>
                        {/* Direct Approve Button for pending requests */}
                        {request.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setReviewData({ status: 'approved', adminNotes: '', approvedAmount: request.amount.toString() });
                                }}
                              >
                                <Check className="h-4 w-4 sm:mr-1" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Approve Recharge</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="approvedAmount">Approved Amount *</Label>
                                  <Input
                                    id="approvedAmount"
                                    type="number"
                                    placeholder="Enter approved amount"
                                    value={reviewData.approvedAmount}
                                    onChange={(e) => setReviewData({ ...reviewData, approvedAmount: e.target.value })}
                                    className="mt-1"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Requested: ₹{request.amount} - You can approve a different amount if needed
                                  </p>
                                </div>
                                <div>
                                  <Label htmlFor="notes">Admin Notes (Optional)</Label>
                                  <Textarea
                                    id="notes"
                                    placeholder="Add notes about your decision..."
                                    value={reviewData.adminNotes}
                                    onChange={(e) => setReviewData({ ...reviewData, adminNotes: e.target.value })}
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end space-x-3">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedRequest(null);
                                      setReviewData({ status: '', adminNotes: '', approvedAmount: '' });
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={async () => {
                                      if (!reviewData.approvedAmount || isNaN(Number(reviewData.approvedAmount)) || Number(reviewData.approvedAmount) <= 0) {
                                        toast({
                                          variant: 'destructive',
                                          title: 'Error',
                                          description: 'Please enter a valid approved amount',
                                        });
                                        return;
                                      }
                                      setProcessingId(request._id);
                                      const token = localStorage.getItem('adminToken');
                                      const requestBody = {
                                        status: 'approved',
                                        adminNotes: reviewData.adminNotes,
                                        approvedAmount: Number(reviewData.approvedAmount)
                                      };
                                      const response = await fetch(`/api/admin/recharge-requests/${request._id}/review`, {
                                        method: 'POST',
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                          'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(requestBody)
                                      });
                                      const data = await response.json();
                                      if (data.success) {
                                        toast({
                                          title: 'Success',
                                          description: `Recharge request approved with ₹${reviewData.approvedAmount}`,
                                        });
                                        setSelectedRequest(null);
                                        setReviewData({ status: '', adminNotes: '', approvedAmount: '' });
                                        fetchRequests();
                                      } else {
                                        toast({
                                          variant: 'destructive',
                                          title: 'Error',
                                          description: data.error || 'Failed to approve request',
                                        });
                                      }
                                      setProcessingId(null);
                                    }}
                                    disabled={processingId === request._id}
                                  >
                                    {processingId === request._id ? (
                                      <>
                                        <LoadingSpinner size={16} className="mr-2" />
                                        Processing...
                                      </>
                                    ) : (
                                      'Approve'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
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

        {/* Review Dialog */}
        {selectedRequest && (
          <Dialog
            open={!!selectedRequest}
            onOpenChange={() => {
              setSelectedRequest(null);
              setReviewData({ status: '', adminNotes: '', approvedAmount: '' });
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Review Recharge Request</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <p className="font-medium">{selectedRequest.phone}</p>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <p className="font-semibold text-lg">{formatCurrency(selectedRequest.amount)}</p>
                  </div>
                  <div>
                    <Label>UTR Number</Label>
                    <p className="font-mono">{selectedRequest.utrNumber}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>

                <div>
                  <Label>QR Code</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 break-all">{selectedRequest.qrCode}</p>
                  </div>
                </div>

                {selectedRequest.status === 'pending' && (
                  <>
                    <div>
                      <Label htmlFor="status">Decision</Label>
                      <select
                        id="status"
                        className="block w-full mt-1 border rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={reviewData.status}
                        onChange={e => {
                          const value = e.target.value;
                          setReviewData({
                            ...reviewData,
                            status: value,
                            approvedAmount: value === 'approved' ? selectedRequest.amount.toString() : ''
                          });
                        }}
                      >
                        <option value="">Select decision</option>
                        <option value="approved">Approve</option>
                        <option value="rejected">Reject</option>
                      </select>
                    </div>

                    {reviewData.status === 'approved' && (
                      <div>
                        <Label htmlFor="approvedAmount">Approved Amount *</Label>
                        <Input
                          id="approvedAmount"
                          type="number"
                          placeholder="Enter approved amount"
                          value={reviewData.approvedAmount}
                          onChange={(e) => setReviewData({...reviewData, approvedAmount: e.target.value})}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Requested: ₹{selectedRequest.amount} - You can approve a different amount if needed
                        </p>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="notes">Admin Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add notes about your decision..."
                        value={reviewData.adminNotes}
                        onChange={(e) => setReviewData({...reviewData, adminNotes: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(null);
                          setReviewData({ status: '', adminNotes: '', approvedAmount: '' });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleReview}
                        disabled={!reviewData.status || (reviewData.status === 'approved' && !reviewData.approvedAmount) || processingId === selectedRequest._id}
                      >
                        {processingId === selectedRequest._id ? (
                          <>
                            <LoadingSpinner size={16} className="mr-2" />
                            Processing...
                          </>
                        ) : (
                          'Submit Review'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default AdminRechargeRequests;
