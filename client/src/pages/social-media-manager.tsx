import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Music2, 
  Youtube, 
  Plus, 
  RefreshCw, 
  Trash2, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Platform = "facebook" | "instagram" | "twitter" | "linkedin" | "tiktok" | "youtube";

const platformConfig = {
  facebook: {
    icon: Facebook,
    color: "bg-blue-500",
    name: "Facebook"
  },
  instagram: {
    icon: Instagram,
    color: "bg-pink-500",
    name: "Instagram"
  },
  twitter: {
    icon: Twitter,
    color: "bg-sky-500",
    name: "Twitter/X"
  },
  linkedin: {
    icon: Linkedin,
    color: "bg-blue-700",
    name: "LinkedIn"
  },
  tiktok: {
    icon: Music2,
    color: "bg-black",
    name: "TikTok"
  },
  youtube: {
    icon: Youtube,
    color: "bg-red-600",
    name: "YouTube"
  }
};

const connectAccountSchema = z.object({
  platform: z.enum(["facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube"]),
  accountName: z.string().min(1, "Account name is required"),
  accountId: z.string().optional(),
  accountHandle: z.string().optional(),
  profileImageUrl: z.string().optional(),
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().optional(),
  permissions: z.string().optional(),
  canPublish: z.boolean().default(false),
  canAnalyze: z.boolean().default(true),
});

type ConnectAccountInput = z.infer<typeof connectAccountSchema>;

export default function SocialMediaManager() {
  const { toast } = useToast();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedAccountForAnalytics, setSelectedAccountForAnalytics] = useState<number | null>(null);

  // Fetch connected accounts
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<any[]>({
    queryKey: ['/api/social-media/connected-accounts'],
  });

  // Fetch overview stats
  const { data: overviewStats } = useQuery<any>({
    queryKey: ['/api/social-media/overview'],
  });

  // Connect account mutation
  const connectMutation = useMutation({
    mutationFn: async (data: ConnectAccountInput) => {
      return apiRequest('POST', '/api/social-media/connect-account', {
        ...data,
        tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : undefined,
        permissions: data.permissions ? JSON.parse(data.permissions) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/connected-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/overview'] });
      setConnectDialogOpen(false);
      toast({
        title: "Account connected",
        description: "Your social media account has been connected successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Disconnect account mutation
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return apiRequest('DELETE', `/api/social-media/connected-accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/connected-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/overview'] });
      toast({
        title: "Account disconnected",
        description: "The social media account has been disconnected.",
      });
    },
  });

  // Refresh account mutation
  const refreshMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return apiRequest('POST', `/api/social-media/connected-accounts/${accountId}/refresh`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/connected-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/overview'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/analytics'] });
      toast({
        title: "Account refreshed",
        description: "Account data has been refreshed successfully.",
      });
    },
  });

  const form = useForm<ConnectAccountInput>({
    resolver: zodResolver(connectAccountSchema),
    defaultValues: {
      platform: "facebook",
      accountName: "",
      accountId: "",
      accountHandle: "",
      profileImageUrl: "",
      accessToken: "",
      refreshToken: "",
      permissions: "",
      canPublish: false,
      canAnalyze: true,
    },
  });

  const onSubmit = (data: ConnectAccountInput) => {
    connectMutation.mutate(data);
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!connectDialogOpen) {
      form.reset({
        platform: "facebook",
        accountName: "",
        accountId: "",
        accountHandle: "",
        profileImageUrl: "",
        accessToken: "",
        refreshToken: "",
        permissions: "",
        canPublish: false,
        canAnalyze: true,
      });
    }
  }, [connectDialogOpen, form]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>;
      case "expired":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Social Media Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect and manage all your social media accounts in one place
          </p>
        </div>
        
        <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600" data-testid="button-connect-account">
              <Plus className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Connect Social Media Account</DialogTitle>
              <DialogDescription>
                Add your social media account credentials to start tracking analytics and managing content.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "facebook"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-platform">
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(platformConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="h-4 w-4" />
                                {config.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Company Page, Business Account" 
                          {...field} 
                          data-testid="input-account-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account ID (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Platform account ID" 
                            {...field} 
                            data-testid="input-account-id"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Handle (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="@username" 
                            {...field} 
                            data-testid="input-account-handle"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="profileImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/profile.jpg" 
                          {...field} 
                          data-testid="input-profile-image-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accessToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Token</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your API access token" 
                          {...field} 
                          className="font-mono text-sm"
                          data-testid="textarea-access-token"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="refreshToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Refresh Token (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter refresh token if available" 
                          {...field} 
                          className="font-mono text-sm"
                          data-testid="textarea-refresh-token"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tokenExpiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Expiry (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          data-testid="input-token-expiry"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permissions JSON (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='{"read": true, "write": false}' 
                          {...field} 
                          className="font-mono text-sm"
                          data-testid="textarea-permissions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="canPublish"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Publishing</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Allow posting content to this account
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-can-publish"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="canAnalyze"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Analytics</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Fetch analytics data from this account
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-can-analyze"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setConnectDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={connectMutation.isPending}
                    data-testid="button-submit-connect"
                  >
                    {connectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Connect Account
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      {overviewStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewStats.totalFollowers?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Across all platforms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewStats.totalEngagement?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Likes, comments, shares</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewStats.totalPosts?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Engagement Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewStats.avgEngagementRate?.toFixed(2) || 0}%</div>
              <p className="text-xs text-muted-foreground">Across platforms</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Manage your connected social media accounts and view their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No accounts connected yet</p>
              <p className="text-sm">Click "Connect Account" to add your first social media account</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account: any) => {
                const config = platformConfig[account.platform as Platform];
                const Icon = config.icon;
                
                return (
                  <Card key={account.id} className="relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-1 ${config.color}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{account.accountName}</CardTitle>
                            {account.accountHandle && (
                              <p className="text-sm text-muted-foreground">{account.accountHandle}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(account.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {account.followerCount !== null && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Followers</span>
                          <span className="font-medium">{account.followerCount?.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {account.lastSyncAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last synced</span>
                          <span className="font-medium">
                            {formatDistanceToNow(new Date(account.lastSyncAt), { addSuffix: true })}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => refreshMutation.mutate(account.id)}
                          disabled={refreshMutation.isPending}
                          data-testid={`button-refresh-${account.id}`}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAccountForAnalytics(account.id)}
                          data-testid={`button-analytics-${account.id}`}
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Analytics
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Are you sure you want to disconnect ${account.accountName}?`)) {
                              disconnectMutation.mutate(account.id);
                            }
                          }}
                          disabled={disconnectMutation.isPending}
                          data-testid={`button-disconnect-${account.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Modal */}
      {selectedAccountForAnalytics && (
        <AccountAnalyticsDialog
          accountId={selectedAccountForAnalytics}
          onClose={() => setSelectedAccountForAnalytics(null)}
        />
      )}
    </div>
  );
}

// Account Analytics Dialog Component
function AccountAnalyticsDialog({ accountId, onClose }: { accountId: number; onClose: () => void }) {
  const { data: analytics = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/social-media/analytics', accountId],
    queryFn: async () => {
      const res = await fetch(`/api/social-media/analytics/${accountId}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
  });

  const latestAnalytics = analytics[0];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Analytics</DialogTitle>
          <DialogDescription>
            View performance metrics and engagement data for this account
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !latestAnalytics ? (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No analytics data available yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard icon={Users} label="Followers" value={latestAnalytics.followers} />
              <MetricCard icon={Heart} label="Likes" value={latestAnalytics.likes} />
              <MetricCard icon={MessageCircle} label="Comments" value={latestAnalytics.comments} />
              <MetricCard icon={Share2} label="Shares" value={latestAnalytics.shares} />
              <MetricCard icon={Eye} label="Views" value={latestAnalytics.profileViews} />
              <MetricCard icon={TrendingUp} label="Reach" value={latestAnalytics.reach} />
              <MetricCard icon={BarChart3} label="Impressions" value={latestAnalytics.impressions} />
              <MetricCard 
                icon={TrendingUp} 
                label="Engagement Rate" 
                value={`${parseFloat(latestAnalytics.engagementRate || 0).toFixed(2)}%`} 
              />
            </div>

            {/* Recent Analytics History */}
            {analytics.length > 1 && (
              <div>
                <h3 className="font-semibold mb-3">Recent History</h3>
                <div className="space-y-2">
                  {analytics.slice(0, 5).map((data: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm"
                    >
                      <span className="text-muted-foreground">
                        {new Date(data.analyticsDate).toLocaleDateString()}
                      </span>
                      <div className="flex gap-4">
                        <span>{data.followers} followers</span>
                        <span>{data.likes + data.comments + data.shares} engagement</span>
                        <span>{parseFloat(data.engagementRate || 0).toFixed(2)}% rate</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </CardContent>
    </Card>
  );
}
