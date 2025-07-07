import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Settings,
  LockKeyhole,
  Fish,
  DollarSign,
  Calendar,
  TrendingUp
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SharkData {
  id: string;
  title: string;
  image: string;
  price: number;
  totalReturn: number;
  dailyIncome: number;
  durationDays: number;
  isLocked: boolean;
  levelNumber: number;
}

interface LevelData {
  level: number;
  sharks: SharkData[];
}

const AdminManageSharks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [processingLevels, setProcessingLevels] = useState<Set<number>>(new Set());
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
    fetchSharks();
  }, [navigate]);

  const fetchSharks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        navigate('/admin/login');
        return;
      }
      
      const response = await fetch('/api/admin/sharks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setLevels(data.levels);
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminInfo');
          navigate('/admin/login');
          return;
        }
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to fetch sharks',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Failed to connect to server. Please check your connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSharkLock = async (shark: SharkData) => {
    try {
      setProcessingIds(prev => new Set(prev).add(shark.id));
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/sharks/${shark.id}/lock-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isLocked: !shark.isLocked })
      });

      const data = await response.json();

      if (data.success) {
        // Update the shark in the state
        setLevels(prevLevels => 
          prevLevels.map(level => ({
            ...level,
            sharks: level.sharks.map(s => 
              s.id === shark.id 
                ? { ...s, isLocked: !s.isLocked }
                : s
            )
          }))
        );

        toast({
          title: 'Success',
          description: data.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to update shark status',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update shark status',
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(shark.id);
        return newSet;
      });
    }
  };

  const toggleLevelLock = async (levelNumber: number, shouldLock: boolean) => {
    try {
      setProcessingLevels(prev => new Set(prev).add(levelNumber));
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/sharks/level/${levelNumber}/lock-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isLocked: shouldLock })
      });

      const data = await response.json();

      if (data.success) {
        // Update all sharks in this level
        setLevels(prevLevels => 
          prevLevels.map(level => 
            level.level === levelNumber
              ? {
                  ...level,
                  sharks: level.sharks.map(shark => ({ ...shark, isLocked: shouldLock }))
                }
              : level
          )
        );

        toast({
          title: 'Success',
          description: data.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to update level status',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update level status',
      });
    } finally {
      setProcessingLevels(prev => {
        const newSet = new Set(prev);
        newSet.delete(levelNumber);
        return newSet;
      });
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

  const getLevelStats = (level: LevelData) => {
    const total = level.sharks.length;
    const locked = level.sharks.filter(s => s.isLocked).length;
    const unlocked = total - locked;
    return { total, locked, unlocked };
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Sharks</h1>
                <p className="text-sm text-gray-600">
                  Lock or unlock sharks to control user access
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSharks}
                className="flex items-center space-x-2 w-fit"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Levels</p>
                  <p className="text-2xl font-bold text-blue-600">{levels.length}</p>
                </div>
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sharks</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {levels.reduce((sum, level) => sum + level.sharks.length, 0)}
                  </p>
                </div>
                <Fish className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Locked Sharks</p>
                  <p className="text-2xl font-bold text-red-600">
                    {levels.reduce((sum, level) => 
                      sum + level.sharks.filter(s => s.isLocked).length, 0
                    )}
                  </p>
                </div>
                <Lock className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Levels and Sharks */}
        <div className="space-y-8">
          {levels.map((level) => {
            const stats = getLevelStats(level);
            const isProcessingLevel = processingLevels.has(level.level);
            
            return (
              <Card key={level.level}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                    <div>
                      <CardTitle className="text-xl font-bold">
                        Level {level.level}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {stats.total} sharks • {stats.locked} locked • {stats.unlocked} unlocked
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleLevelLock(level.level, false)}
                        disabled={isProcessingLevel || stats.unlocked === stats.total}
                        className="flex items-center space-x-2"
                      >
                        {isProcessingLevel ? (
                          <LoadingSpinner size={16} />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                        <span>Unlock All</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleLevelLock(level.level, true)}
                        disabled={isProcessingLevel || stats.locked === stats.total}
                        className="flex items-center space-x-2"
                      >
                        {isProcessingLevel ? (
                          <LoadingSpinner size={16} />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                        <span>Lock All</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {level.sharks.map((shark) => {
                      const isProcessing = processingIds.has(shark.id);
                      
                      return (
                        <div
                          key={shark.id}
                          className={`border rounded-lg p-4 transition-all ${
                            shark.isLocked 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-green-50 border-green-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{shark.title}</h3>
                              <Badge 
                                className={
                                  shark.isLocked 
                                    ? 'bg-red-100 text-red-800 mt-1' 
                                    : 'bg-green-100 text-green-800 mt-1'
                                }
                              >
                                {shark.isLocked ? 'Locked' : 'Unlocked'}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              {shark.isLocked ? (
                                <LockKeyhole className="h-5 w-5 text-red-500" />
                              ) : (
                                <Unlock className="h-5 w-5 text-green-500" />
                              )}
                              <Switch
                                checked={!shark.isLocked}
                                onCheckedChange={() => toggleSharkLock(shark)}
                                disabled={isProcessing}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                Price:
                              </span>
                              <span className="font-semibold">{formatCurrency(shark.price)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Daily:
                              </span>
                              <span className="font-semibold">{formatCurrency(shark.dailyIncome)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Duration:
                              </span>
                              <span className="font-semibold">{shark.durationDays} days</span>
                            </div>
                          </div>

                          <Button
                            variant={shark.isLocked ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleSharkLock(shark)}
                            disabled={isProcessing}
                            className="w-full mt-3"
                          >
                            {isProcessing ? (
                              <>
                                <LoadingSpinner size={16} className="mr-2" />
                                Processing...
                              </>
                            ) : shark.isLocked ? (
                              <>
                                <Unlock className="h-4 w-4 mr-2" />
                                Unlock Shark
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Lock Shark
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {levels.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Fish className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sharks Found</h3>
              <p className="text-gray-600 mb-4">
                No shark plans have been added to the system yet.
              </p>
              <Button variant="outline" onClick={fetchSharks}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminManageSharks;
