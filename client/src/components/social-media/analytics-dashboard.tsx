import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { 
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share,
  BarChart3,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface AnalyticsData {
  id: number;
  analyticsDate: string;
  followers: number;
  following: number;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  engagementRate: number;
}

interface PostPerformance {
  id: number;
  postId: string;
  postContent: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  engagementRate: number;
}

interface ConnectedAccount {
  id: number;
  platform: string;
  accountName: string;
  accountHandle: string;
  profileImageUrl: string;
  followerCount: number;
  status: 'connected' | 'disconnected' | 'expired' | 'error';
}

const platformConfigs = {
  facebook: { name: 'Facebook', color: 'bg-blue-600', icon: '📘' },
  instagram: { name: 'Instagram', color: 'bg-gradient-to-br from-purple-500 to-pink-500', icon: '📷' },
  twitter: { name: 'Twitter/X', color: 'bg-black', icon: '🐦' },
  linkedin: { name: 'LinkedIn', color: 'bg-blue-700', icon: '💼' },
  youtube: { name: 'YouTube', color: 'bg-red-600', icon: '📺' },
  tiktok: { name: 'TikTok', color: 'bg-black', icon: '🎵' }
};

export function AnalyticsDashboard() {
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{from: Date; to: Date} | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  // Fetch connected accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/social-media/connected-accounts"],
    retry: false
  });

  // Fetch analytics for selected account
  const { data: analytics = [], isLoading: analyticsLoading } = useQuery<AnalyticsData[]>({
    queryKey: ["/api/social-media/analytics", selectedAccount, dateRange],
    queryFn: () => {
      if (!selectedAccount) return [];
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());
      return apiRequest("GET", `/api/social-media/analytics/${selectedAccount}?${params}`);
    },
    enabled: !!selectedAccount,
    retry: false
  });

  // Fetch post performance for selected account
  const { data: posts = [], isLoading: postsLoading } = useQuery<PostPerformance[]>({
    queryKey: ["/api/social-media/posts", selectedAccount, dateRange],
    queryFn: () => {
      if (!selectedAccount) return [];
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());
      return apiRequest("GET", `/api/social-media/posts/${selectedAccount}?${params}`);
    },
    enabled: !!selectedAccount,
    retry: false
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const calculateGrowth = (data: AnalyticsData[], metric: keyof AnalyticsData) => {
    if (data.length < 2) return 0;
    const latest = data[0][metric] as number;
    const previous = data[1][metric] as number;
    if (previous === 0) return 0;
    return ((latest - previous) / previous) * 100;
  };

  const selectedAccountData = accounts.find((acc: ConnectedAccount) => acc.id === selectedAccount);
  const connectedAccounts = accounts.filter((acc: ConnectedAccount) => acc.status === 'connected');

  const chartData = analytics.map(item => ({
    date: format(new Date(item.analyticsDate), 'MMM dd'),
    followers: item.followers,
    engagement: item.engagementRate,
    reach: item.reach,
    impressions: item.impressions
  })).reverse();

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
        <p className="text-gray-500">Connect your social media accounts to view analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Media Analytics</h2>
          <p className="text-gray-600">Track your social media performance across platforms</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={selectedAccount?.toString() || ""}
            onValueChange={(value) => setSelectedAccount(parseInt(value))}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {connectedAccounts.map((account: ConnectedAccount) => {
                const config = platformConfigs[account.platform as keyof typeof platformConfigs];
                return (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <span>{config.icon}</span>
                      <span>{account.accountName}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            Last 30 Days
          </Button>
        </div>
      </div>

      {!selectedAccount ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Account</h3>
          <p className="text-gray-500">Choose a connected social media account to view its analytics.</p>
        </div>
      ) : (
        <>
          {/* Account Overview */}
          {selectedAccountData && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedAccountData.profileImageUrl} alt={selectedAccountData.accountName} />
                    <AvatarFallback className={`${platformConfigs[selectedAccountData.platform as keyof typeof platformConfigs].color} text-white text-xl`}>
                      {platformConfigs[selectedAccountData.platform as keyof typeof platformConfigs].icon}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedAccountData.accountName}</h3>
                    <p className="text-gray-600">{selectedAccountData.accountHandle}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="outline">
                        {platformConfigs[selectedAccountData.platform as keyof typeof platformConfigs].name}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        <Users className="h-4 w-4 inline mr-1" />
                        {formatNumber(selectedAccountData.followerCount)} followers
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metrics Overview */}
          {analytics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Followers</p>
                      <p className="text-2xl font-bold">{formatNumber(analytics[0]?.followers || 0)}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex items-center mt-2">
                    {calculateGrowth(analytics, 'followers') >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${calculateGrowth(analytics, 'followers') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(calculateGrowth(analytics, 'followers')).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                      <p className="text-2xl font-bold">{analytics[0]?.engagementRate.toFixed(2)}%</p>
                    </div>
                    <Heart className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="flex items-center mt-2">
                    {calculateGrowth(analytics, 'engagementRate') >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${calculateGrowth(analytics, 'engagementRate') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(calculateGrowth(analytics, 'engagementRate')).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reach</p>
                      <p className="text-2xl font-bold">{formatNumber(analytics[0]?.reach || 0)}</p>
                    </div>
                    <Eye className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="flex items-center mt-2">
                    {calculateGrowth(analytics, 'reach') >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${calculateGrowth(analytics, 'reach') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(calculateGrowth(analytics, 'reach')).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Impressions</p>
                      <p className="text-2xl font-bold">{formatNumber(analytics[0]?.impressions || 0)}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="flex items-center mt-2">
                    {calculateGrowth(analytics, 'impressions') >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${calculateGrowth(analytics, 'impressions') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(calculateGrowth(analytics, 'impressions')).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Followers Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="followers" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        dot={{ fill: '#EF4444' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Posts */}
          {posts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts.slice(0, 5).map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium truncate">{post.postContent}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(post.publishedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span>{formatNumber(post.likes)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4 text-blue-500" />
                          <span>{formatNumber(post.comments)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Share className="h-4 w-4 text-green-500" />
                          <span>{formatNumber(post.shares)}</span>
                        </div>
                        <div className="font-medium">
                          {post.engagementRate.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading States */}
          {(analyticsLoading || postsLoading) && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading analytics data...</span>
            </div>
          )}

          {/* Empty States */}
          {analytics.length === 0 && !analyticsLoading && (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
              <p className="text-gray-500">No analytics data available for the selected time period.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}