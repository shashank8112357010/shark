import { useState, useEffect, useMemo } from 'react';
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/contexts/UserContext";
import { 
  Search, 
  Filter, 
  Users, 
  TrendingUp, 
  Calendar, 
  Phone, 
  Award,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  Share2,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface ReferralEntry {
  _id: string;
  referred: string;
  reward: number;
  date: string;
  status: 'pending' | 'successful' | 'rejected';
  inviteCode?: string;
}

interface ReferralWithdrawal {
  _id: string;
  amount: number;
  netAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  upiId: string;
  paymentUtr?: string;
}

const ReferralHistory = () => {
  const { userData, loading } = useUser();
  const [referralHistory, setReferralHistory] = useState<ReferralEntry[]>([]);
  const [referralWithdrawals, setReferralWithdrawals] = useState<ReferralWithdrawal[]>([]);
  const [totalRewards, setTotalRewards] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'referrals' | 'withdrawals'>('referrals');
  const [showDummyData, setShowDummyData] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, [userData?.phone]);

  // Dummy data for demonstration
  const dummyReferrals: ReferralEntry[] = [
    {
      _id: '1',
      referred: '9876543210',
      reward: 200,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'successful',
      inviteCode: userData?.inviteCode
    },
    {
      _id: '2',
      referred: '8765432109',
      reward: 0,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      inviteCode: userData?.inviteCode
    },
    {
      _id: '3',
      referred: '7654321098',
      reward: 200,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'successful',
      inviteCode: userData?.inviteCode
    }
  ];

  const dummyWithdrawals: ReferralWithdrawal[] = [
    {
      _id: '1',
      amount: 400,
      netAmount: 340,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      upiId: 'user@upi',
      paymentUtr: 'UTR123456789'
    },
    {
      _id: '2',
      amount: 200,
      netAmount: 170,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      upiId: 'user@upi'
    }
  ];

  const fetchReferralData = async () => {
    if (!userData?.phone) return;

    setLoadingData(true);
    try {
      // Fetch referral history
      const historyRes = await fetch(`/api/referral/history/${userData.phone}`);
      const historyData = await historyRes.json();
      
      // Transform data to include status and invite code
      const transformedReferrals = (historyData.referrals || []).map((referral: any) => ({
        _id: referral._id,
        referred: referral.referred,
        reward: referral.reward || 0,
        date: referral.date || referral.createdAt,
        status: referral.reward > 0 ? 'successful' : 'pending',
        inviteCode: userData.inviteCode
      }));
      
      setReferralHistory(transformedReferrals);

      // Fetch total rewards
      const rewardsRes = await fetch(`/api/referral/rewards/${userData.phone}`);
      const rewardsData = await rewardsRes.json();
      setTotalRewards(rewardsData.totalReward || 0);

      // Fetch referral withdrawals (filtered from all withdrawals)
      const withdrawalsRes = await fetch(`/api/withdrawals/${userData.phone}/history`);
      const withdrawalsData = await withdrawalsRes.json();
      
      // Filter withdrawals that are referral-related
      const referralWithdrawals = (withdrawalsData.history || []).filter((withdrawal: any) => 
        withdrawal.transactionId?.type === 'referral' || 
        (withdrawal.amount <= 1000 && withdrawal.transactionId?.description?.toLowerCase().includes('referral'))
      );
      
      setReferralWithdrawals(referralWithdrawals);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Use dummy data if enabled and no real data
  const effectiveReferrals = showDummyData && referralHistory.length === 0 ? dummyReferrals : referralHistory;
  const effectiveWithdrawals = showDummyData && referralWithdrawals.length === 0 ? dummyWithdrawals : referralWithdrawals;

  // Filter and search logic
  const filteredReferrals = useMemo(() => {
    let filtered = effectiveReferrals;

    // Search by contact number
    if (searchTerm) {
      filtered = filtered.filter(referral => 
        referral.referred.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(referral => referral.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(referral => {
        const referralDate = new Date(referral.date);
        switch (dateFilter) {
          case 'today':
            return referralDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return referralDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return referralDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [referralHistory, searchTerm, statusFilter, dateFilter]);

  const filteredWithdrawals = useMemo(() => {
    let filtered = effectiveWithdrawals;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(withdrawal => 
        withdrawal.status.toLowerCase() === statusFilter
      );
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(withdrawal => {
        const withdrawalDate = new Date(withdrawal.createdAt);
        switch (dateFilter) {
          case 'today':
            return withdrawalDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return withdrawalDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return withdrawalDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [referralWithdrawals, statusFilter, dateFilter]);

  // Pagination logic
  const totalPages = Math.ceil(
    (activeTab === 'referrals' ? filteredReferrals.length : filteredWithdrawals.length) / itemsPerPage
  );
  
  const paginatedData = useMemo(() => {
    const data = activeTab === 'referrals' ? filteredReferrals : filteredWithdrawals;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [activeTab, filteredReferrals, filteredWithdrawals, currentPage, itemsPerPage]);

  const handleCopyInvite = () => {
    if (userData?.inviteCode) {
      navigator.clipboard.writeText(userData.inviteCode);
      // You might want to add a toast notification here
      alert('Invite code copied to clipboard!');
    }
  };

  const getStatusBadge = (status: string, type: 'referral' | 'withdrawal') => {
    const statusMap = {
      referral: {
        pending: { variant: 'secondary' as const, icon: Clock, text: 'Pending' },
        successful: { variant: 'default' as const, icon: CheckCircle, text: 'Successful' },
        rejected: { variant: 'destructive' as const, icon: XCircle, text: 'Rejected' }
      },
      withdrawal: {
        PENDING: { variant: 'secondary' as const, icon: Clock, text: 'Processing' },
        APPROVED: { variant: 'default' as const, icon: CheckCircle, text: 'Approved' },
        COMPLETED: { variant: 'default' as const, icon: CheckCircle, text: 'Completed' },
        REJECTED: { variant: 'destructive' as const, icon: XCircle, text: 'Rejected' }
      }
    };

    const config = type === 'referral' 
      ? statusMap.referral[status as keyof typeof statusMap.referral]
      : statusMap.withdrawal[status as keyof typeof statusMap.withdrawal];

    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPhone = (phone: string) => {
    // Mask the middle digits for privacy
    if (phone.length >= 10) {
      return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-6 space-y-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Referral History</h1>
              {showDummyData && (
                <Badge variant="secondary" className="text-xs">
                  Demo Mode
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReferralData}
                disabled={loadingData}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {showDummyData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDummyData(false)}
                  className="flex items-center gap-2"
                >
                  Clear Demo
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Referrals</p>
                    <p className="text-2xl font-bold text-blue-900">{effectiveReferrals.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Rewards</p>
                    <p className="text-2xl font-bold text-green-900">₹{totalRewards.toFixed(2)}</p>
                  </div>
                  <Award className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Your Code</p>
                    <p className="text-lg font-bold text-purple-900">{userData?.inviteCode || 'N/A'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyInvite}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={activeTab === 'referrals' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setActiveTab('referrals');
              setCurrentPage(1);
            }}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-2" />
            Referrals
          </Button>
          <Button
            variant={activeTab === 'withdrawals' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setActiveTab('withdrawals');
              setCurrentPage(1);
            }}
            className="flex-1"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Withdrawals
          </Button>
        </div>

        {/* Search and Filter Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={activeTab === 'referrals' ? "Search by contact number..." : "Search withdrawals..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {activeTab === 'referrals' ? (
                  <>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="successful">Successful</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="PENDING">Processing</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4">
          {loadingData ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : paginatedData.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  {activeTab === 'referrals' ? (
                    <>
                      <Users className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">No referrals found</h3>
                                                 <p className="text-gray-500">
                           {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                             ? 'Try adjusting your search or filters'
                             : 'Start referring friends to see your referral history here'}
                         </p>
                         {!showDummyData && (
                           <Button
                             variant="outline"
                             onClick={() => setShowDummyData(true)}
                             className="mt-4"
                           >
                             Load Demo Data
                           </Button>
                         )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">No withdrawals found</h3>
                                                 <p className="text-gray-500">
                           {statusFilter !== 'all' || dateFilter !== 'all'
                             ? 'Try adjusting your filters'
                             : 'No referral bonus withdrawals yet'}
                         </p>
                         {!showDummyData && (
                           <Button
                             variant="outline"
                             onClick={() => setShowDummyData(true)}
                             className="mt-4"
                           >
                             Load Demo Data
                           </Button>
                         )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Data List */}
              <div className="space-y-3">
                {paginatedData.map((item) => (
                  <Card key={item._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {activeTab === 'referrals' ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Phone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {formatPhone((item as ReferralEntry).referred)}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate((item as ReferralEntry).date)}</span>
                                {userData?.inviteCode && (
                                  <>
                                    <span>•</span>
                                    <span>Code: {userData.inviteCode}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              ₹{(item as ReferralEntry).reward.toFixed(2)}
                            </p>
                            {getStatusBadge((item as ReferralEntry).status, 'referral')}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Wallet className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                ₹{(item as ReferralWithdrawal).amount.toFixed(2)}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate((item as ReferralWithdrawal).createdAt)}</span>
                                {(item as ReferralWithdrawal).paymentUtr && (
                                  <>
                                    <span>•</span>
                                    <span>UTR: {(item as ReferralWithdrawal).paymentUtr}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              Net: ₹{(item as ReferralWithdrawal).netAmount.toFixed(2)}
                            </p>
                            {getStatusBadge((item as ReferralWithdrawal).status, 'withdrawal')}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, activeTab === 'referrals' ? filteredReferrals.length : filteredWithdrawals.length)} of{' '}
                    {activeTab === 'referrals' ? filteredReferrals.length : filteredWithdrawals.length} results
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReferralHistory;
