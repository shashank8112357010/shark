import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Users,
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  LogOut,
  Settings,
  RefreshCw
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface DashboardStats {
  users: {
    total: number;
  };
  recharges: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  withdrawals: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
  };
  wallets: {
    totalBalance: number;
    avgBalance: number;
    minBalance: number;
    maxBalance: number;
  };
  recent: {
    recharges: Array<{
      _id: string;
      phone: string;
      amount: number;
      utrNumber: string;
      status: string;
      createdAt: string;
    }>;
    withdrawals: Array<{
      _id: string;
      phone: string;
      amount: number;
      status: string;
      createdAt: string;
    }>;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<any>(null);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    const info = localStorage.getItem('adminInfo');
    
    if (!token || !info) {
      navigate('/admin/login');
      return;
    }

    setAdminInfo(JSON.parse(info));
    fetchStats();
  }, [navigate]);

  // Refetch stats when component becomes visible again (e.g., after navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats();
      }
    };

    const handleFocus = () => {
      fetchStats();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.log('No admin token found, redirecting to login');
        navigate('/admin/login');
        return;
      }
      
      console.log('Fetching admin dashboard stats');
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Stats response status:', response.status);
      const data = await response.json();
      console.log('Stats response data:', data);

      if (data.success) {
        setStats(data.stats);
        console.log('Successfully loaded dashboard stats');
      } else {
        if (response.status === 401) {
          console.log('Authentication failed, logging out');
          handleLogout();
          return;
        }
        console.error('Stats API error:', data.error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to fetch stats',
        });
      }
    } catch (error) {
      console.error('Stats network error:', error);
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Failed to connect to server. Please check your connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/admin/login');
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

  const getStatusBadge = (status: string, type: 'recharge' | 'withdrawal') => {
    const statusConfig = {
      recharge: {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
      },
      withdrawal: {
        PENDING: 'bg-yellow-100 text-yellow-800',
        APPROVED: 'bg-blue-100 text-blue-800',
        COMPLETED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
      }
    };

    const config = type === 'recharge' ? statusConfig.recharge : statusConfig.withdrawal;
    const className = config[status as keyof typeof config] || 'bg-gray-100 text-gray-800';

    return (
      <Badge className={className}>
        {status.toLowerCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {adminInfo?.name}
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/admin/recharge-requests')}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recharge Requests</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {stats?.recharges.pending || 0}
                  </p>
                  <p className="text-xs text-gray-500">Pending approval</p>
                </div>
                <ArrowDownToLine className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/admin/withdrawals')}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Withdrawal Requests</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {stats?.withdrawals.pending || 0}
                  </p>
                  <p className="text-xs text-gray-500">Pending approval</p>
                </div>
                <ArrowUpFromLine className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {stats?.users.total || 0}
                  </p>
                  <p className="text-xs text-gray-500">Registered users</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Balance</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">
                    {formatCurrency(stats?.wallets.totalBalance || 0)}
                  </p>
                  <p className="text-xs text-gray-500">In all wallets</p>
                </div>
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Profit</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                    {formatCurrency(stats?.wallets.totalBalance * 0.1 || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Platform earnings</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Loss</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {formatCurrency(stats?.withdrawals.completed * 50 || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Transaction costs</p>
                </div>
                <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recharge Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="font-semibold">{stats?.recharges.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <Badge className="bg-yellow-100 text-yellow-800">{stats?.recharges.pending || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <Badge className="bg-green-100 text-green-800">{stats?.recharges.approved || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rejected</span>
                  <Badge className="bg-red-100 text-red-800">{stats?.recharges.rejected || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Withdrawal Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="font-semibold">{stats?.withdrawals.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <Badge className="bg-yellow-100 text-yellow-800">{stats?.withdrawals.pending || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <Badge className="bg-blue-100 text-blue-800">{stats?.withdrawals.approved || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <Badge className="bg-green-100 text-green-800">{stats?.withdrawals.completed || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Recharge Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recent.recharges.length ? (
                  stats.recent.recharges.map((recharge) => (
                    <div key={recharge._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{recharge.phone}</p>
                        <p className="text-xs text-gray-600">UTR: {recharge.utrNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(recharge.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(recharge.amount)}</p>
                        {getStatusBadge(recharge.status, 'recharge')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent recharge requests</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recent.withdrawals.length ? (
                  stats.recent.withdrawals.map((withdrawal) => (
                    <div key={withdrawal._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{withdrawal.phone}</p>
                        <p className="text-xs text-gray-500">{formatDate(withdrawal.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(withdrawal.amount)}</p>
                        {getStatusBadge(withdrawal.status, 'withdrawal')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent withdrawal requests</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
