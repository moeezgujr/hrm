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
  Building2,
  Menu,
  X,
  Globe,
  Phone,
  Mail,
  Clock,
  Sparkles,
  Target,
  Award,
  TrendingUp,
  HeadphonesIcon
} from 'lucide-react';
import { Link } from 'wouter';
import { useState } from 'react';
import q361Logo from '@assets/generated_images/q361_professional_business_logo.png';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top Bar - Contact Info */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-300" />
                <span className="text-gray-200">support@q361.qanzakglobal.com</span>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-300" />
                <span className="text-gray-200">+44 7733 300715</span>
              </div>
              <div className="hidden lg:flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-300" />
                <span className="text-gray-200">Open 24/7</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-blue-300" />
                <span className="text-gray-200">hr.themeetingmatters.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-blue-500/25">
                  <img src={q361Logo} alt="Q361 Logo" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                    Q361
                  </span>
                  <span className="text-xs text-gray-500 font-medium -mt-1">by Qanzak Global</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <a href="#features" className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
                Features
              </a>
              <a href="#pricing" className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
                Pricing
              </a>
              <Link href="/subscription-plans">
                <span className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                  Plans
                </span>
              </Link>
              <Link href="/onboarding-hub">
                <span className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                  Onboarding
                </span>
              </Link>
              <Link href="/applicant-portal">
                <span className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                  Careers
                </span>
              </Link>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/auth">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600 font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/subscription-plans">
                <Button className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100">
              <nav className="flex flex-col space-y-2">
                <a href="#features" className="px-4 py-3 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50">Features</a>
                <a href="#pricing" className="px-4 py-3 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50">Pricing</a>
                <Link href="/subscription-plans"><span className="block px-4 py-3 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 cursor-pointer">Plans</span></Link>
                <Link href="/onboarding-hub"><span className="block px-4 py-3 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 cursor-pointer">Onboarding</span></Link>
                <Link href="/applicant-portal"><span className="block px-4 py-3 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 cursor-pointer">Careers</span></Link>
                <div className="pt-4 space-y-2">
                  <Link href="/auth"><Button variant="outline" className="w-full">Sign In</Button></Link>
                  <Link href="/subscription-plans"><Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">Start Free Trial</Button></Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center">
            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0 px-4 py-2 text-sm shadow-lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Enterprise-Grade Platform
              </Badge>
              <Badge variant="outline" className="bg-white/80 border-blue-200 text-blue-700 px-4 py-2 text-sm">
                <Shield className="h-4 w-4 mr-2" />
                Bank-Level Security
              </Badge>
              <Badge variant="outline" className="bg-white/80 border-green-200 text-green-700 px-4 py-2 text-sm">
                <Award className="h-4 w-4 mr-2" />
                ISO 27001 Certified
              </Badge>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Complete Business
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent block mt-2">
                Management System
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-10 leading-relaxed">
              All-in-one platform for <span className="font-semibold text-blue-600">HR</span>, <span className="font-semibold text-indigo-600">CRM</span>, <span className="font-semibold text-purple-600">Project Management</span>, 
              employee lifecycle, psychometric testing, and advanced business analytics.
            </p>

            {/* Key Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="h-5 w-5 text-blue-600" />
                <span><strong className="text-gray-900">10,000+</strong> Active Users</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Building className="h-5 w-5 text-indigo-600" />
                <span><strong className="text-gray-900">500+</strong> Organizations</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span><strong className="text-gray-900">99.9%</strong> Uptime</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <HeadphonesIcon className="h-5 w-5 text-purple-600" />
                <span><strong className="text-gray-900">24/7</strong> Support</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/subscription-plans">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-blue-500/25 px-8 py-6 text-lg">
                  Start 7-Day Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/onboarding-hub">
                <Button size="lg" variant="outline" className="border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 px-8 py-6 text-lg">
                  <Target className="mr-2 h-5 w-5" />
                  Onboarding Hub
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="ghost" className="text-gray-700 hover:text-blue-600 px-8 py-6 text-lg">
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Product by Qanzak Global */}
            <div className="mt-12 pt-8 border-t border-gray-200/50">
              <p className="text-sm text-gray-500 mb-2">A Product by</p>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">Q</span>
                </div>
                <span className="text-lg font-semibold text-gray-700">Qanzak Global</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Business Management
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From employee onboarding to project management, our platform provides all the tools 
              your HR team needs to succeed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Employee Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Employee Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Centralized employee database with role-based access control and comprehensive profiles.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Employee profiles & documents</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Role-based permissions</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Department organization</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Onboarding */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Smart Onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Automated onboarding workflows with checklists, document management, and progress tracking.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Customizable checklists</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Document uploads</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Psychometric testing</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="h-10 w-10 text-purple-600 mb-4" />
                <CardTitle>Project Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Team collaboration tools with task assignment, progress tracking, and project analytics.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Task management</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Team collaboration</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Progress tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>HR Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Comprehensive dashboards and reports for data-driven HR decision making.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Performance metrics</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Custom reports</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Real-time insights</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recognition */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Star className="h-10 w-10 text-yellow-600 mb-4" />
                <CardTitle>Employee Recognition</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Boost morale with peer-to-peer recognition programs and achievement tracking.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Peer nominations</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Achievement badges</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Recognition history</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-10 w-10 text-red-600 mb-4" />
                <CardTitle>Security & Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Enterprise-grade security with role-based access and audit trails.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Secure authentication</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Access controls</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Audit logging</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 bg-gray-50 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Business Management Plan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Flexible pricing plans designed to grow with your organization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Starter Plan */}
            <Card className="relative overflow-hidden hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-6 w-6" />
                    <CardTitle className="text-xl">Starter</CardTitle>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold">$29</div>
                  <div className="text-blue-100">per month</div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Up to 25 Employees</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>5 Active Projects</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Basic Business Management</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Email Support</span>
                  </div>
                </div>
                <Link href="/subscription-plans">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="relative overflow-hidden hover:shadow-xl transition-shadow ring-2 ring-purple-500 scale-105">
              <div className="absolute top-0 left-0 right-0 bg-purple-600 text-white text-center py-1 text-sm font-medium">
                Most Popular
              </div>
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="h-6 w-6" />
                    <CardTitle className="text-xl">Professional</CardTitle>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold">$59</div>
                  <div className="text-purple-100">per month</div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Up to 100 Employees</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Unlimited Projects</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Psychometric Testing</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Advanced Analytics</span>
                  </div>
                </div>
                <Link href="/subscription-plans">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative overflow-hidden hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-6 w-6" />
                    <CardTitle className="text-xl">Enterprise</CardTitle>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold">$99</div>
                  <div className="text-amber-100">per month</div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Unlimited Employees</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>API Access</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>24/7 Support</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Dedicated Manager</span>
                  </div>
                </div>
                <Link href="/subscription-plans">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link href="/subscription-plans">
              <Button variant="outline" size="lg">
                View All Features & Pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Business Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join organizations that trust Q361 for their complete business management needs.
          </p>
          <Link href="/subscription-plans">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              View Pricing Plans
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-lg font-black text-white">Q</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Q361</span>
          </div>
          <p className="text-gray-600">
            Complete Business Management System by Qanzak Global
          </p>
        </div>
      </div>
    </div>
  );
}