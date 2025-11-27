import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Crown, Settings, Users, CreditCard, Mail, Shield, Plus, Eye, UserPlus, Link } from "lucide-react";

export default function SuperAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'employee' as const,
    companyName: '',
    trialDays: 14
  });

  // Check if user is admin
  if (!user || user.role !== 'hr_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Super Admin access required</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Fetch trial users
  const { data: trialUsers, isLoading } = useQuery({
    queryKey: ['/api/super-admin/trial-users'],
    queryFn: () => apiRequest('GET', '/api/super-admin/trial-users'),
  });

  // Fetch subscription stats
  const { data: saasStats } = useQuery({
    queryKey: ['/api/super-admin/saas-stats'],
    queryFn: () => apiRequest('GET', '/api/super-admin/saas-stats'),
  });

  // Create trial user mutation
  const createTrialUserMutation = useMutation({
    mutationFn: (userData: typeof newUserForm) => 
      apiRequest('POST', '/api/super-admin/create-trial-user', userData),
    onSuccess: () => {
      toast({
        title: "Trial Organization Created",
        description: "Trial organization account has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/trial-users'] });
      setNewUserForm({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'hr_admin',
        companyName: '',
        trialDays: 14
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Extend trial mutation
  const extendTrialMutation = useMutation({
    mutationFn: ({ userId, days }: { userId: number; days: number }) =>
      apiRequest('POST', `/api/super-admin/extend-trial/${userId}`, { days }),
    onSuccess: () => {
      toast({
        title: "Trial Extended",
        description: "Trial period has been extended successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/trial-users'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send login credentials mutation
  const sendCredentialsMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest('POST', `/api/super-admin/send-credentials/${userId}`),
    onSuccess: () => {
      toast({
        title: "Credentials Sent",
        description: "Login credentials have been sent via email.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTrialUser = (e: React.FormEvent) => {
    e.preventDefault();
    createTrialUserMutation.mutate(newUserForm);
  };

  const generateAccessUrl = (username: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/trial-access/${username}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Crown className="h-8 w-8 text-yellow-600" />
        <div>
          <h1 className="text-3xl font-bold">Super Admin Panel</h1>
          <p className="text-gray-600">SaaS Management & Trial Control Center</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{saasStats?.activeTrials || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{saasStats?.paidSubscriptions || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Requests</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{saasStats?.pendingRequests || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{saasStats?.conversionRate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trial-users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trial-users">Trial Users</TabsTrigger>
          <TabsTrigger value="create-trial">Create Trial</TabsTrigger>
          <TabsTrigger value="saas-settings">SaaS Settings</TabsTrigger>
        </TabsList>

        {/* Trial Users Tab */}
        <TabsContent value="trial-users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Trial Users</CardTitle>
              <CardDescription>
                Manage and monitor trial user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading trial users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead>Access URL</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(trialUsers) && trialUsers.length > 0 ? trialUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.companyName || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.accountEnabled ? "default" : "secondary"}>
                            {user.accountEnabled ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.daysLeft > 5 ? "default" : "destructive"}>
                            {user.daysLeft || 0} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              /trial-access/{user.username}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(generateAccessUrl(user.username))}
                            >
                              <Link className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Settings className="h-3 w-3 mr-1" />
                                  Extend
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Extend Trial</DialogTitle>
                                  <DialogDescription>
                                    Extend trial period for {user.firstName} {user.lastName}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Additional Days</Label>
                                    <Select onValueChange={(value) => {
                                      extendTrialMutation.mutate({ 
                                        userId: user.id, 
                                        days: parseInt(value) 
                                      });
                                    }}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select days to extend" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="7">7 days</SelectItem>
                                        <SelectItem value="14">14 days</SelectItem>
                                        <SelectItem value="30">30 days</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendCredentialsMutation.mutate(user.id)}
                              disabled={sendCredentialsMutation.isPending}
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Send Login
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {isLoading ? "Loading trial users..." : "No trial users found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Trial Tab */}
        <TabsContent value="create-trial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Trial User</CardTitle>
              <CardDescription>
                Create a new trial account with custom access URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTrialUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUserForm.firstName}
                      onChange={(e) => setNewUserForm({...newUserForm, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUserForm.lastName}
                      onChange={(e) => setNewUserForm({...newUserForm, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={newUserForm.companyName}
                      onChange={(e) => setNewUserForm({...newUserForm, companyName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="trialDays">Trial Duration (days)</Label>
                    <Input
                      id="trialDays"
                      type="number"
                      value={newUserForm.trialDays}
                      onChange={(e) => setNewUserForm({...newUserForm, trialDays: parseInt(e.target.value)})}
                      min="1"
                      max="90"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createTrialUserMutation.isPending}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {createTrialUserMutation.isPending ? "Creating..." : "Create Trial User"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SaaS Settings Tab */}
        <TabsContent value="saas-settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SaaS Configuration</CardTitle>
              <CardDescription>
                Configure SaaS settings and subscription management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Trial Settings</h3>
                  <p className="text-sm text-gray-600 mb-4">Configure default trial parameters</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Default Trial Duration</Label>
                      <Select defaultValue="14">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Auto-approval</Label>
                      <Select defaultValue="manual">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Automatic</SelectItem>
                          <SelectItem value="manual">Manual Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Email Templates</h3>
                  <p className="text-sm text-gray-600 mb-4">Customize email notifications</p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      <Mail className="h-3 w-3 mr-1" />
                      Edit Welcome Email
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="h-3 w-3 mr-1" />
                      Edit Trial Expiry Email
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}