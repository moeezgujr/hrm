import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Briefcase, Shield, ArrowRight, Users, Building } from "lucide-react";
import { Link } from "wouter";

export default function OnboardingHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Q361
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Your comprehensive Business Management System. Choose your pathway to get started with the platform.
          </p>
        </div>

        {/* Onboarding Pathways */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          {/* Applicant Portal */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-blue-500">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4 mx-auto group-hover:bg-green-500 transition-colors">
                <UserPlus className="w-8 h-8 text-green-600 dark:text-green-400 group-hover:text-white" />
              </div>
              <CardTitle className="text-xl text-green-600 dark:text-green-400">Job Applicant</CardTitle>
              <CardDescription>
                Apply for positions and complete pre-employment screening
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Submit job applications</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Upload resume and documents</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Complete psychometric assessments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Track application status</span>
                </div>
              </div>
              <Link href="/applicant-portal">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white group">
                  Apply Now
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Employee Onboarding */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-blue-500">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 mx-auto group-hover:bg-blue-500 transition-colors">
                <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-white" />
              </div>
              <CardTitle className="text-xl text-blue-600 dark:text-blue-400">New Employee</CardTitle>
              <CardDescription>
                Complete your onboarding process as a new team member
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Complete personal profile</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Submit required documents</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Complete training modules</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Setup banking information</span>
                </div>
              </div>
              <Link href="/employee-onboarding">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white group">
                  Start Onboarding
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* HR/Admin Portal */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-purple-500">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4 mx-auto group-hover:bg-purple-500 transition-colors">
                <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400 group-hover:text-white" />
              </div>
              <CardTitle className="text-xl text-purple-600 dark:text-purple-400">HR Administrator</CardTitle>
              <CardDescription>
                Manage organization setup and employee onboarding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Review job applications</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Manage employee onboarding</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Setup organization structure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Configure system settings</span>
                </div>
              </div>
              <Link href="/login">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white group">
                  Admin Login
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-6 h-6" />
                <span>For Job Seekers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-100 mb-4">
                Our comprehensive application process ensures we find the right fit for both candidates and our organization. 
                Complete psychometric assessments, submit your documents, and track your application progress.
              </p>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>• Professional application portal</li>
                <li>• Comprehensive skill assessments</li>
                <li>• Real-time application tracking</li>
                <li>• Streamlined interview process</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-6 h-6" />
                <span>For Organizations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-100 mb-4">
                Q361 provides a complete business management solution with advanced HR capabilities, 
                project management, logistics tracking, and comprehensive employee lifecycle management.
              </p>
              <ul className="text-sm text-green-100 space-y-1">
                <li>• End-to-end employee onboarding</li>
                <li>• Advanced project management</li>
                <li>• Logistics and inventory tracking</li>
                <li>• Performance analytics and reporting</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@meetingmatters.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              support@q361.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}