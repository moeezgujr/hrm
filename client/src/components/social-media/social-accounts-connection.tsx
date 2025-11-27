import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings,
  Plus,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Eye,
  Users,
  TrendingUp,
  BarChart3,
  Link as LinkIcon,
  Unlink,
  Key,
  CheckCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ConnectedAccount {
  id: number;
  platform: string;
  accountName: string;
  accountHandle: string;
  profileImageUrl: string;
  followerCount: number;
  status: 'connected' | 'disconnected' | 'expired' | 'error';
  connectedAt: string;
  lastSyncAt?: string;
  errorMessage?: string;
}

interface AccountOverview {
  totalAccounts: number;
  connectedAccounts: number;
  totalFollowers: number;
  totalPosts: number;
  averageEngagement: number;
}

const platformConfigs = {
  facebook: {
    name: 'Facebook',
    color: 'bg-blue-600',
    icon: '📘',
    description: 'Connect your Facebook Pages for analytics and posting'
  },
  instagram: {
    name: 'Instagram',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    icon: '📷',
    description: 'Connect Instagram Business accounts for content management'
  },
  twitter: {
    name: 'Twitter/X',
    color: 'bg-black',
    icon: '🐦',
    description: 'Connect your Twitter account for social media analytics'
  },
  linkedin: {
    name: 'LinkedIn',
    color: 'bg-blue-700',
    icon: '💼',
    description: 'Connect LinkedIn for professional content and company pages'
  },
  youtube: {
    name: 'YouTube',
    color: 'bg-red-600',
    icon: '📺',
    description: 'Connect your YouTube channel for video analytics'
  },
  tiktok: {
    name: 'TikTok',
    color: 'bg-black',
    icon: '🎵',
    description: 'Connect TikTok for short-form video content management'
  }
};

export function SocialAccountsConnection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState<string | null>(null);

  // Fetch connected accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/social-media/connected-accounts"],
    retry: false
  });

  // Fetch account overview
  const { data: overview } = useQuery<AccountOverview>({
    queryKey: ["/api/social-media/overview"],
    retry: false
  });

  // Connect account mutation
  const connectAccountMutation = useMutation({
    mutationFn: async (platform: string) => {
      return await apiRequest("POST", "/api/social-media/connect-account", { platform });
    },
    onSuccess: (data, platform) => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-media/connected-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social-media/overview"] });
      setConnectingPlatform(null);
      toast({
        title: "Account Connected",
        description: `Successfully connected your ${platformConfigs[platform as keyof typeof platformConfigs]?.name} account`,
      });
    },
    onError: (error, platform) => {
      setConnectingPlatform(null);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect account",
        variant: "destructive"
      });
    }
  });

  // Refresh account mutation
  const refreshAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return await apiRequest("POST", `/api/social-media/connected-accounts/${accountId}/refresh`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-media/connected-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social-media/overview"] });
      toast({
        title: "Account Refreshed",
        description: "Successfully refreshed account data",
      });
    },
    onError: (error) => {
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh account",
        variant: "destructive"
      });
    }
  });

  // Disconnect account mutation
  const disconnectAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return await apiRequest("DELETE", `/api/social-media/connected-accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-media/connected-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social-media/overview"] });
      toast({
        title: "Account Disconnected",
        description: "Account has been disconnected successfully",
        variant: "destructive"
      });
    },
    onError: (error) => {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect account",
        variant: "destructive"
      });
    }
  });

  const handleConnectAccount = (platform: string) => {
    setShowConnectionDialog(platform);
  };

  const handleDemoConnection = (platform: string) => {
    setConnectingPlatform(platform);
    setShowConnectionDialog(null);
    connectAccountMutation.mutate(platform);
  };

  const handleRealConnection = (platform: string) => {
    setShowConnectionDialog(null);
    toast({
      title: "OAuth Setup Required",
      description: `To connect your real ${platformConfigs[platform as keyof typeof platformConfigs]?.name} account, you need to configure OAuth credentials. See SOCIAL_MEDIA_OAUTH_SETUP.md for detailed instructions.`,
      variant: "default",
    });
  };

  const handleRefreshAccount = (accountId: number) => {
    refreshAccountMutation.mutate(accountId);
  };

  const handleDisconnectAccount = (accountId: number) => {
    disconnectAccountMutation.mutate(accountId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "text-green-600 bg-green-100";
      case "expired": return "text-yellow-600 bg-yellow-100";
      case "error": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected": return <CheckCircle className="h-4 w-4" />;
      case "expired": 
      case "error": return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const connectedPlatforms = accounts.map((acc: ConnectedAccount) => acc.platform);
  const availableToConnect = Object.keys(platformConfigs).filter(
    platform => !connectedPlatforms.includes(platform)
  );

  if (accountsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <LinkIcon className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Accounts</p>
                  <p className="text-2xl font-bold">{overview.totalAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Connected</p>
                  <p className="text-2xl font-bold">{overview.connectedAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Total Followers</p>
                  <p className="text-2xl font-bold">{formatNumber(overview.totalFollowers)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Total Posts</p>
                  <p className="text-2xl font-bold">{overview.totalPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Avg Engagement</p>
                  <p className="text-2xl font-bold">{overview.averageEngagement}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connected Accounts</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Connect Social Media Account</DialogTitle>
                  <DialogDescription>
                    Connect your real social media accounts for authentic analytics. Click any platform below to see setup instructions.
                  </DialogDescription>
                </DialogHeader>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">📱 Real Account Integration</h4>
                  <p className="text-sm text-blue-700">
                    This system supports connecting your actual social media accounts using OAuth. 
                    Each platform requires developer app credentials to be configured.
                  </p>
                </div>
                <div className="grid gap-4 py-4">
                  {availableToConnect.map((platform) => {
                    const config = platformConfigs[platform as keyof typeof platformConfigs];
                    return (
                      <Button
                        key={platform}
                        variant="outline"
                        className="justify-start h-auto p-4"
                        onClick={() => handleConnectAccount(platform)}
                        disabled={connectingPlatform === platform}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded ${config.color} text-white text-lg`}>
                            {config.icon}
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{config.name}</div>
                            <div className="text-sm text-gray-500">{config.description}</div>
                          </div>
                        </div>
                        {connectingPlatform === platform && (
                          <RefreshCw className="h-4 w-4 ml-auto animate-spin" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>

            {/* Connection Options Dialog */}
            {showConnectionDialog && (
              <Dialog open={!!showConnectionDialog} onOpenChange={() => setShowConnectionDialog(null)}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Connect {platformConfigs[showConnectionDialog as keyof typeof platformConfigs]?.name}</DialogTitle>
                    <DialogDescription>
                      Choose how you'd like to connect your {platformConfigs[showConnectionDialog as keyof typeof platformConfigs]?.name} account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">🚀 Demo Mode</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Quick testing with sample data. Perfect for exploring features and UI.
                      </p>
                      <Button 
                        onClick={() => handleDemoConnection(showConnectionDialog)}
                        className="w-full"
                        disabled={connectingPlatform === showConnectionDialog}
                      >
                        {connectingPlatform === showConnectionDialog ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Connect Demo Account
                      </Button>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">🔗 Real OAuth Connection</h4>
                      <p className="text-sm text-green-700 mb-3">
                        Connect your actual {platformConfigs[showConnectionDialog as keyof typeof platformConfigs]?.name} account with real analytics data. Requires OAuth setup.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => handleRealConnection(showConnectionDialog)}
                        className="w-full"
                      >
                        Setup Real Connection
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts connected</h3>
              <p className="text-gray-500 mb-4">Connect your social media accounts to start tracking analytics and managing content.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account: ConnectedAccount) => {
                const config = platformConfigs[account.platform as keyof typeof platformConfigs];
                return (
                  <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={account.profileImageUrl} alt={account.accountName} />
                        <AvatarFallback className={`${config.color} text-white`}>
                          {config.icon}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{account.accountName}</h3>
                          <Badge className={`${getStatusColor(account.status)} text-xs`}>
                            {getStatusIcon(account.status)}
                            <span className="ml-1 capitalize">{account.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{account.accountHandle}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            <Users className="h-3 w-3 inline mr-1" />
                            {formatNumber(account.followerCount)} followers
                          </span>
                          {account.lastSyncAt && (
                            <span className="text-sm text-gray-500">
                              Last sync: {formatLastSync(account.lastSyncAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshAccount(account.id)}
                        disabled={refreshAccountMutation.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshAccountMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnectAccount(account.id)}
                        disabled={disconnectAccountMutation.isPending}
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}