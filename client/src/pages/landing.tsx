import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckCircle, 
  BarChart3, 
  FileText, 
  Calendar,
  Shield,
  ArrowRight,
  Star,
  Building,
  Zap,
  TrendingUp,
  Clock,
  Target,
  Briefcase,
  Award,
  Globe,
  Rocket
} from 'lucide-react';
import { Link } from 'wouter';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Q361
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Testimonials</a>
              <Link href="/auth">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-32 pb-24">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 bg-blue-100 text-blue-700 border-blue-200">
              <Rocket className="w-4 h-4 inline mr-2" />
              Modern Business Management Platform
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Transform Your
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Business Operations
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              All-in-one HR platform with intelligent onboarding, project management, 
              workforce analytics, and automation that scales with your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/subscription-plans">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/onboarding-hub">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-2 hover:bg-gray-50">
                  Watch Demo
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-12 border-t border-gray-200">
              <div>
                <div className="text-3xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">50+</div>
                <div className="text-sm text-gray-600">Companies</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Manage Your Workforce
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From hiring to retirement, Q361 streamlines every aspect of your HR operations 
              with powerful automation and intelligent insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Employee Management */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-200 hover:-translate-y-1">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Employee Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Centralized employee database with comprehensive profiles, document management, and role-based access control.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Complete employee profiles</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Department organization</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Permission management</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Onboarding */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-200 hover:-translate-y-1">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Automated workflows that guide new hires from offer acceptance to their first day and beyond.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Customizable checklists</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Digital document signing</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Progress tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Management */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-green-200 hover:-translate-y-1">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Project Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Powerful collaboration tools with task tracking, team coordination, and deadline management.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Task assignment & tracking</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Team collaboration</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Progress dashboards</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics & Insights */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-orange-200 hover:-translate-y-1">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Analytics & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Real-time dashboards and reports that help you make data-driven HR decisions.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Performance metrics</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Custom reports</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Predictive insights</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recognition */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-yellow-200 hover:-translate-y-1">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Award className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Employee Recognition</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Build a culture of appreciation with peer recognition and achievement tracking.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Peer-to-peer recognition</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Achievement badges</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Recognition feeds</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-red-200 hover:-translate-y-1">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Security & Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Enterprise-grade security with encryption, access controls, and comprehensive audit trails.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>End-to-end encryption</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Role-based access</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Compliance reporting</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See what our customers say about transforming their HR operations with Q361.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "Q361 transformed our onboarding process. What used to take weeks now takes days. 
                  The automation and tracking features are game-changers."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    SK
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sarah Khan</div>
                    <div className="text-sm text-gray-600">HR Director, Tech Corp</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "The analytics dashboard gives us insights we never had before. We can now make 
                  data-driven decisions about our workforce."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    MA
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Michael Anderson</div>
                    <div className="text-sm text-gray-600">CEO, Growth Solutions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "Best HR platform we've used. The support team is incredible, and the features 
                  keep getting better with each update."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    LP
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Lisa Patel</div>
                    <div className="text-sm text-gray-600">Operations Manager</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose the perfect plan for your organization. All plans include our core features, 
              with additional capabilities as you scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Starter Plan */}
            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:scale-105">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <CardHeader className="pt-8 pb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">$29</span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Perfect for small teams</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Up to 25 Employees</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>5 Active Projects</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Basic HR Features</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Email Support</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Basic Analytics</span>
                  </div>
                </div>
                <Link href="/subscription-plans">
                  <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-purple-500 scale-105 z-10">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-semibold">
                MOST POPULAR
              </div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
              <CardHeader className="pt-12 pb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">$59</span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">For growing companies</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="font-medium">Up to 100 Employees</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="font-medium">Unlimited Projects</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="font-medium">Psychometric Testing</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="font-medium">Advanced Analytics</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="font-medium">Priority Support</span>
                  </div>
                </div>
                <Link href="/subscription-plans">
                  <Button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:scale-105">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
              <CardHeader className="pt-8 pb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Building className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">$99</span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">For large organizations</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Unlimited Employees</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Custom Integrations</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>API Access</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>24/7 Phone Support</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Dedicated Account Manager</span>
                  </div>
                </div>
                <Link href="/subscription-plans">
                  <Button className="w-full mt-6 bg-amber-600 hover:bg-amber-700">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">All plans include 14-day free trial • No credit card required</p>
            <Link href="/subscription-plans">
              <Button variant="outline" size="lg" className="border-2">
                Compare All Features
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your HR Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Join thousands of companies that trust Q361 for their business management needs. 
            Start your free 14-day trial today—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/subscription-plans">
              <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg shadow-xl">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/onboarding-hub">
              <Button size="lg" variant="outline" className="border-2 border-white text-white bg-white/10 px-8 py-6 text-lg">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-12 bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">Q</span>
              </div>
              <div>
                <div className="text-xl font-bold text-white">Q361</div>
                <div className="text-sm text-gray-400">Business Management Platform</div>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
              <Link href="/auth">
                <span className="hover:text-white transition-colors cursor-pointer">Sign In</span>
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            <p>© 2025 Q361. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}