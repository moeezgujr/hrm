import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, CheckCircle, Crown, Star, Shield, Zap, Award, TrendingUp, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Left side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-2 sm:mb-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Q361
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Business Management Platform</p>
            
            {isQanzakTrial && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl sm:rounded-2xl shadow-sm">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mr-1 sm:mr-2" />
                  <span className="font-bold text-amber-900 text-sm sm:text-base">Welcome Qanzak Global!</span>
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 ml-1 sm:ml-2 fill-amber-600" />
                </div>
                <p className="text-xs sm:text-sm text-amber-800">
                  Your 14-day Professional trial is ready.
                </p>
                <div className="mt-2 text-xs font-semibold text-amber-700 bg-white px-3 py-1 rounded-full inline-block shadow-sm">
                  Username: muhammad0lfc
                </div>
              </div>
            )}
          </div>
          
          <Card className="border-0 shadow-xl sm:shadow-2xl bg-white/90 sm:bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-lg sm:text-xl font-bold text-center">
                {isQanzakTrial ? "Trial Access" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-center text-xs sm:text-sm">
                {isQanzakTrial 
                  ? "Enter your trial credentials below."
                  : "Sign in to your account or create a new one."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10 bg-slate-100">
                  <TabsTrigger value="login" className="text-xs sm:text-sm font-semibold">Login</TabsTrigger>
                  <TabsTrigger value="register" className="text-xs sm:text-sm font-semibold">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="mt-3 sm:mt-4">
                  <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-xs sm:text-sm font-semibold text-gray-700">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter username"
                        className="h-9 sm:h-10 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-gray-700">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        className="h-9 sm:h-10 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-9 sm:h-10 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Signing in...
                        </span>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register" className="mt-3 sm:mt-4">
                  <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-xs sm:text-sm font-semibold text-gray-700">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          className="h-9 sm:h-10 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-xs sm:text-sm font-semibold text-gray-700">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          className="h-9 sm:h-10 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={registerForm.lastName}
                          onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-gray-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-9 sm:h-10 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="regUsername" className="text-xs sm:text-sm font-semibold text-gray-700">Username</Label>
                      <Input
                        id="regUsername"
                        type="text"
                        placeholder="Choose username"
                        className="h-9 sm:h-10 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="regPassword" className="text-xs sm:text-sm font-semibold text-gray-700">Password</Label>
                      <Input
                        id="regPassword"
                        type="password"
                        placeholder="Create password"
                        className="h-9 sm:h-10 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-9 sm:h-10 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating...
                        </span>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Trust badges */}
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Fast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Trusted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 xl:p-12 flex-col justify-center text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 xl:w-64 xl:h-64 bg-white/10 rounded-full -mr-24 xl:-mr-32 -mt-24 xl:-mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 xl:w-96 xl:h-96 bg-white/10 rounded-full -ml-32 xl:-ml-48 -mb-32 xl:-mb-48"></div>
        
        <div className="max-w-lg relative z-10">
          <div className="inline-block px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold mb-4 xl:mb-6">
            ✨ Transform Your Business
          </div>
          
          <h2 className="text-3xl xl:text-4xl font-bold mb-4 xl:mb-6 leading-tight">
            All-in-One HR Management
          </h2>
          <p className="text-base xl:text-lg mb-8 xl:mb-10 text-blue-100 leading-relaxed">
            Streamline onboarding, manage teams, and grow your business with our comprehensive HR solution.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 xl:p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 xl:w-12 xl:h-12 rounded-lg xl:rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                <Building2 className="h-5 w-5 xl:h-6 xl:w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm xl:text-base mb-0.5">Automated Onboarding</h3>
                <p className="text-blue-100 text-xs xl:text-sm">Streamlined workflows for better employee experience</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 xl:p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 xl:w-12 xl:h-12 rounded-lg xl:rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <Users className="h-5 w-5 xl:h-6 xl:w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm xl:text-base mb-0.5">Team Management</h3>
                <p className="text-blue-100 text-xs xl:text-sm">Complete lifecycle management with analytics</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 xl:p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 xl:w-12 xl:h-12 rounded-lg xl:rounded-xl bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 xl:h-6 xl:w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm xl:text-base mb-0.5">Performance Tracking</h3>
                <p className="text-blue-100 text-xs xl:text-sm">Advanced analytics to drive productivity</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 xl:mt-10 grid grid-cols-3 gap-4 xl:gap-6">
            <div className="text-center">
              <div className="text-2xl xl:text-3xl font-bold mb-1">10K+</div>
              <div className="text-xs xl:text-sm text-blue-200">Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl xl:text-3xl font-bold mb-1">50+</div>
              <div className="text-xs xl:text-sm text-blue-200">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl xl:text-3xl font-bold mb-1">99.9%</div>
              <div className="text-xs xl:text-sm text-blue-200">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}