import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import OnboardingHub from "@/pages/onboarding-hub";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import EmployeeDetails from "@/pages/employee-details";
import Onboarding from "@/pages/onboarding";
import EmployeeOnboardingPortal from "@/pages/employee-onboarding-portal";
import PsychometricTest from "@/pages/psychometric-test";
import TestResults from "@/pages/test-results";
import PsychometricAdmin from "@/pages/psychometric-admin";
import PsychometricReport from "@/pages/psychometric-report";
import DetailedResponses from "@/pages/detailed-responses";
import AllPsychometricResponses from "@/pages/all-psychometric-responses";

import Tasks from "@/pages/tasks";
import TaskDetail from "@/pages/task-detail";
import TaskRequests from "@/pages/task-requests";
import Announcements from "@/pages/announcements";
import Recognition from "@/pages/recognition";
import Logistics from "@/pages/logistics";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import EmployeeDashboard from "@/pages/employee-dashboard";
import Departments from "@/pages/departments";
import DepartmentManagement from "@/pages/department-management";
import DepartmentIsolation from "@/pages/department-isolation";
import ProjectsPage from "@/pages/projects-page";
import OnboardingTestsPage from "@/pages/onboarding-tests";
import RegistrationApprovalsPage from "@/pages/registration-approvals";
import OnboardingChecklistManager from "@/pages/onboarding-checklist-manager";
import OnboardingChecklistViewer from "@/pages/onboarding-checklist-viewer";
import EmployeeOnboardingStep1 from "@/pages/employee-onboarding-step1";
import EmployeeOnboardingChecklist from "@/pages/employee-onboarding-checklist";
import HROnboardingStep2 from "@/pages/hr-onboarding-step2";
import BankingInformation from "@/pages/banking-information";
import BankingOverview from "@/pages/banking-overview";
import EmployeeOnboardingPDFExport from "@/components/employee-onboarding-pdf-export";
import LogisticsPDFExport from "@/components/logistics-pdf-export";
import HandbookManagement from "@/pages/handbook-management";
import SocialMediaDashboard from "@/pages/social-media-dashboard";
import SocialMediaManager from "@/pages/social-media-manager";
import LogisticsDashboard from "@/pages/logistics-dashboard";
import LogisticsEmployeeView from "@/pages/logistics-employee-view";
import HRLogisticsApprovals from "@/pages/hr-logistics-approvals";
import SubscriptionPlans from "@/pages/subscription-plans";
import Subscribe from "@/pages/subscribe";
import SubscriptionSuccess from "@/pages/subscription-success";
import TrialRequests from "@/pages/admin/TrialRequests";
import SubscriptionManagement from "@/pages/admin/SubscriptionManagement";
import GenerateSubscriptionPDF from "@/pages/generate-subscription-pdf";
import EmailTestCenter from "@/pages/email-test";
import DownloadPDF from "@/pages/download-pdf";
import SuperAdmin from "@/pages/super-admin";
import MainLayout from "@/components/layout/main-layout";
import AuthPage from "@/pages/auth-page";
import ContractSigning from "@/pages/contract-signing";
import ContractManagement from "@/pages/contract-management";
import DailyReports from "@/pages/daily-reports";
import LeaveManagement from "@/pages/leave-management";
import CrmInquiries from "@/pages/crm-inquiries";
import CrmAccessManagement from "@/pages/crm-access-management";
import JobApplicationsAccessManagement from "@/pages/job-applications-access-management";
import Organization from "@/pages/organization";
import CrmDailyLog from "@/pages/crm-daily-log";
import CrmManagementDashboard from "@/pages/crm-management-dashboard";
import CeoCrmMeeting from "@/pages/ceo-crm-meeting";

function Router() {
  const { user, isLoading, error } = useAuth();
  const isAuthenticated = !!user;

  // Show loading only for initial auth check, with timeout
  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <Switch>
        {/* Public psychometric test - MUST BE FIRST to avoid conflicts */}
        <Route path="/psychometric-test">
          <PsychometricTest />
        </Route>
        <Route path="/test-results">
          <TestResults />
        </Route>

        {/* Public onboarding portal - accessible without authentication */}
        <Route path="/onboarding-hub" component={OnboardingHub} />
        <Route path="/applicant-portal" component={lazy(() => import("@/pages/applicant-portal"))} />
        <Route path="/onboarding-portal" component={EmployeeOnboardingPortal} />
        <Route path="/employee-onboarding" component={EmployeeOnboardingChecklist} />
        <Route path="/employee-onboarding-legacy" component={EmployeeOnboardingStep1} />
        
        {/* Public subscription routes */}
        <Route path="/subscription-plans" component={SubscriptionPlans} />
        <Route path="/subscribe" component={Subscribe} />
        <Route path="/subscription-success" component={SubscriptionSuccess} />
        <Route path="/generate-pdf" component={GenerateSubscriptionPDF} />
        <Route path="/download-pdf" component={DownloadPDF} />
        
        {!isAuthenticated ? (
          <>
            <Route path="/auth" component={AuthPage} />
            <Route path="/" component={Landing} />
            {/* Fallback for any authenticated route when not logged in */}
            <Route>
              <Landing />
            </Route>
          </>
        ) : (
          <>
            <MainLayout>
              <Route path="/">
                {user?.role === 'employee' ? <EmployeeDashboard /> : 
                 user?.role === 'logistics_manager' ? <LogisticsDashboard /> : 
                 <Dashboard />}
              </Route>
            <Route path="/employee" component={EmployeeDashboard} />
            <Route path="/employees" component={Employees} />
            <Route path="/employees/:id" component={EmployeeDetails} />
            <Route path="/contract-management" component={ContractManagement} />
            <Route path="/my-contracts" component={lazy(() => import("@/pages/employee-contracts"))} />
            <Route path="/job-applications" component={lazy(() => import("@/pages/job-applications"))} />
            <Route path="/departments" component={Departments} />
            <Route path="/department-management" component={DepartmentManagement} />
            <Route path="/department-isolation" component={DepartmentIsolation} />
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/onboarding-checklist-manager" component={OnboardingChecklistManager} />
          <Route path="/onboarding-checklist-viewer" component={OnboardingChecklistViewer} />
            <Route path="/hr-onboarding" component={HROnboardingStep2} />
            <Route path="/banking-information" component={BankingInformation} />
            <Route path="/banking-overview" component={BankingOverview} />
            <Route path="/onboarding-pdf-export" component={EmployeeOnboardingPDFExport} />
            <Route path="/logistics-pdf-export" component={LogisticsPDFExport} />
            <Route path="/psychometric-admin" component={PsychometricAdmin} />
            <Route path="/psychometric-report/:email" component={PsychometricReport} />
            <Route path="/detailed-responses/:attemptId" component={DetailedResponses} />
            <Route path="/all-psychometric-responses" component={AllPsychometricResponses} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/tasks/:id" component={TaskDetail} />
            <Route path="/leave-management" component={LeaveManagement} />
            <Route path="/crm-inquiries" component={CrmInquiries} />
            <Route path="/crm-access-management" component={CrmAccessManagement} />
            <Route path="/crm-daily-log" component={CrmDailyLog} />
            <Route path="/crm-management-dashboard" component={CrmManagementDashboard} />
            <Route path="/ceo-crm-meeting" component={CeoCrmMeeting} />
            <Route path="/job-applications-access-management" component={JobApplicationsAccessManagement} />
            <Route path="/organization" component={Organization} />
            <Route path="/projects" component={ProjectsPage} />
            <Route path="/onboarding-tests" component={OnboardingTestsPage} />
            <Route path="/task-requests" component={TaskRequests} />
            <Route path="/registration-approvals" component={RegistrationApprovalsPage} />
            <Route path="/admin/trial-requests" component={TrialRequests} />
            <Route path="/admin/subscription-management" component={SubscriptionManagement} />
            <Route path="/announcements" component={Announcements} />
            <Route path="/recognition" component={Recognition} />
            <Route path="/logistics" component={LogisticsDashboard} />
            <Route path="/logistics/my-requests" component={LogisticsEmployeeView} />
            <Route path="/hr-logistics-approvals" component={HRLogisticsApprovals} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/handbook-management" component={HandbookManagement} />
            <Route path="/team-meetings" component={lazy(() => import('./pages/team-meetings'))} />
            <Route path="/psychometric-results" component={lazy(() => import('./pages/psychometric-results-dashboard'))} />
            <Route path="/social-media" component={SocialMediaDashboard} />
            <Route path="/social-media-manager" component={SocialMediaManager} />
            <Route path="/daily-reports" component={DailyReports} />
            <Route path="/email-test" component={EmailTestCenter} />
            <Route path="/super-admin" component={SuperAdmin} />
            <Route path="/settings" component={Settings} />
          </MainLayout>
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
