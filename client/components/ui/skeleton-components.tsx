import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Referral card skeleton
export const ReferralCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Skeleton className="h-5 w-5 mr-2 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16 ml-2 rounded-full" />
          </div>
          <div className="flex items-center mb-1">
            <Skeleton className="h-4 w-4 mr-1 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-1 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-6 w-16 mb-1" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <Skeleton className="h-4 w-full rounded" />
    </CardContent>
  </Card>
);

// Stats card skeleton
export const StatsCardSkeleton = () => (
  <Card>
    <CardContent className="p-4 text-center">
      <div className="flex items-center justify-center mb-2">
        <Skeleton className="h-6 w-6 mr-2 rounded-full" />
        <Skeleton className="h-8 w-12" />
      </div>
      <Skeleton className="h-4 w-24 mx-auto" />
    </CardContent>
  </Card>
);

// Withdrawal card skeleton
export const WithdrawalCardSkeleton = () => (
  <Card className="overflow-hidden border-blue-200">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center mb-1">
            <Skeleton className="h-4 w-4 mr-1 rounded-full" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="text-right">
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </CardHeader>
  </Card>
);

// Dashboard plan card skeleton
export const PlanCardSkeleton = () => (
  <Card className="overflow-hidden border-2 border-transparent">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-6 w-20 mb-1" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
      <Skeleton className="h-10 w-full mt-4 rounded" />
    </CardContent>
  </Card>
);

// Transaction history skeleton
export const TransactionSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-5 w-16 mb-1" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Loading state with multiple skeletons
export const ReferralHistorySkeletons = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <ReferralCardSkeleton key={i} />
    ))}
  </div>
);

export const StatsSkeletons = () => (
  <div className="grid grid-cols-2 gap-4">
    <StatsCardSkeleton />
    <StatsCardSkeleton />
  </div>
);

export const WithdrawalSkeletons = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <WithdrawalCardSkeleton key={i} />
    ))}
  </div>
);

export const PlanSkeletons = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((level) => (
      <div key={level} className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlanCardSkeleton />
          <PlanCardSkeleton />
        </div>
      </div>
    ))}
  </div>
);

export const TransactionSkeletons = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <TransactionSkeleton key={i} />
    ))}
  </div>
);
