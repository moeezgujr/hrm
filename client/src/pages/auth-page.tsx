import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Building2, Users, CheckCircle, Crown, Star } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [isQanzakTrial, setIsQanzakTrial] = useState(false);

  // Check for Qanzak trial cookie
  useEffect(() => {
    const qanzakCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('qanzak_trial='));
    setIsQanzakTrial(!!qanzakCookie);
  }, []);

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Left side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Meeting Matters</h1>
            <p className="text-gray-600 mt-2">Business Management System</p>
            {isQanzakTrial && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Crown className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-semibold text-blue-800">Welcome Qanzak Global!</span>
                  <Star className="h-5 w-5 text-yellow-600 ml-2" />
                </div>
                <p className="text-sm text-blue-700">
                  Your 14-day Professional trial is ready. Use your credentials to explore all features.
                </p>
                <div className="mt-2 text-xs text-blue-600 bg-white px-3 py-1 rounded-full inline-block">
                  Username: muhammad0lfc
                </div>
              </div>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{isQanzakTrial ? "Qanzak Global Trial Access" : "Welcome"}</CardTitle>
              <CardDescription>
                {isQanzakTrial 
                  ? "Enter your trial credentials to access your 14-day Professional plan demo."
                  : "Sign in to your account or create a new one to get started."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={registerForm.lastName}
                          onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regUsername">Username</Label>
                      <Input
                        id="regUsername"
                        type="text"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regPassword">Password</Label>
                      <Input
                        id="regPassword"
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-center text-white">
        <div className="max-w-lg">
          <h2 className="text-4xl font-bold mb-6">
            Streamline Your Business Operations
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Complete HR management solution with onboarding, task management, 
            employee recognition, and psychometric testing.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Building2 className="h-8 w-8 text-blue-200" />
              <div>
                <h3 className="font-semibold">Automated Onboarding</h3>
                <p className="text-blue-100">Streamlined employee onboarding workflows</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-blue-200" />
              <div>
                <h3 className="font-semibold">Team Management</h3>
                <p className="text-blue-100">Comprehensive employee lifecycle management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-blue-200" />
              <div>
                <h3 className="font-semibold">Task Tracking</h3>
                <p className="text-blue-100">Advanced task management and progress tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}