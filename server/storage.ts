import {
  users,
  userPermissions,
  employees,
  // companies,
  tasks,
  taskUpdates,
  taskRequests,
  announcements,
  recognition,
  logisticsItems,
  logisticsRequests,
  logisticsExpenses,
  logisticsMovements,
  onboardingChecklists,
  documents,
  psychometricTests,
  psychometricQuestions,
  psychometricTestAttempts,
  projects,
  projectMembers,
  projectTasks,
  projectMessages,
  projectNotes,
  projectFiles,
  // projectOverview,
  subscriptionPlans,
  subscriptionHistory,
  trialRequests,
  employmentContracts,
  leaveBalances,
  leaveRequests,
  vacancies,
  crmInquiries,
  type User,
  type Company,
  type UpsertUser,
  type UserPermission,
  type InsertUserPermission,
  type Employee,
  type InsertEmployee,
  type LeaveBalance,
  type InsertLeaveBalance,
  type LeaveRequest,
  type InsertLeaveRequest,
  type Vacancy,
  type InsertVacancy,
  type CrmInquiry,
  type InsertCrmInquiry,
  type Task,
  type InsertTask,
  type TaskRequest,
  type InsertTaskRequest,
  type Announcement,
  type InsertAnnouncement,
  type Recognition,
  type InsertRecognition,
  type LogisticsItem,
  type InsertLogisticsItem,
  type LogisticsRequest,
  type InsertLogisticsRequest,
  type LogisticsExpense,
  type InsertLogisticsExpense,
  type LogisticsMovement,
  type InsertLogisticsMovement,
  type OnboardingChecklist,
  type InsertOnboardingChecklist,
  type Document,
  type InsertDocument,
  type PsychometricTest,
  type InsertPsychometricTest,
  type PsychometricQuestion,
  type InsertPsychometricQuestion,
  type PsychometricTestAttempt,
  type InsertPsychometricTestAttempt,
  type TaskUpdate,
  type InsertTaskUpdate,
  departments,
  type Department,
  type InsertDepartment,
  employeeSubmissions,
  type EmployeeSubmission,
  type InsertEmployeeSubmission,
  registrationRequests,
  type RegistrationRequest,
  type InsertRegistrationRequest,
  type Project,
  type InsertProject,
  type ProjectMember,
  type InsertProjectMember,
  type ProjectTask,
  type InsertProjectTask,
  type ProjectMessage,
  type InsertProjectMessage,
  type ProjectFile,
  type InsertProjectFile,
  type ProjectOverview,
  type InsertProjectOverview,
  type ProjectNote,
  type InsertProjectNote,
  type TrialRequest,
  type InsertTrialRequest,
  customers,
  subscriptions,
  payments,
  billingEvents,
  type Customer,
  type InsertCustomer,
  type Subscription,
  type InsertSubscription,
  type Payment,
  type InsertPayment,
  type BillingEvent,
  type InsertBillingEvent,
  notifications,
  type Notification,
  type InsertNotification,
  socialMediaCampaigns,
  contentCalendar,
  socialMediaProjects,
  socialMediaTasks,
  brandGuidelines,
  type SocialMediaCampaign,
  type InsertSocialMediaCampaign,
  type ContentCalendar,
  type InsertContentCalendar,
  type SocialMediaProject,
  type InsertSocialMediaProject,
  type SocialMediaTask,
  type InsertSocialMediaTask,
  type BrandGuideline,
  connectedSocialAccounts,
  socialMediaAnalytics,
  postPerformance,
  type ConnectedSocialAccount,
  type InsertConnectedSocialAccount,
  type SocialMediaAnalytics,
  type InsertSocialMediaAnalytics,
  type PostPerformance,
  type InsertPostPerformance,
  type InsertBrandGuideline,
  jobApplications,
  type JobApplication,
  type InsertJobApplication,
  type EmploymentContract,
  type InsertEmploymentContract,
  orgUnits,
  orgUnitAssignments,
  type OrgUnit,
  type InsertOrgUnit,
  type OrgUnitAssignment,
  type InsertOrgUnitAssignment,
  studioMeetings,
  meetingAttendees,
  meetingNotes,
  meetingWorkItems,
  meetingLinks,
  creativeBriefs,
  analyticsEntries,
  assetLibrary,
  approvalWorkflows,
  studioReports,
  dashboardSections,
  type StudioMeeting,
  type InsertStudioMeeting,
  type MeetingAttendee,
  type InsertMeetingAttendee,
  type MeetingNote,
  type InsertMeetingNote,
  type MeetingWorkItem,
  type InsertMeetingWorkItem,
  type MeetingLink,
  type InsertMeetingLink,
  type CreativeBrief,
  type InsertCreativeBrief,
  type AnalyticsEntry,
  type InsertAnalyticsEntry,
  type AssetLibrary,
  type InsertAssetLibrary,
  type ApprovalWorkflow,
  type InsertApprovalWorkflow,
  type StudioReport,
  type InsertStudioReport,
  type DashboardSection,
  type InsertDashboardSection,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, gte, lte, lt, like, or, count, sum, isNull, sql, exists, isNotNull, asc, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { HRNotifications } from './hr-notifications';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations for session-based auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(usernameOrEmployeeId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getUserByOnboardingToken(token: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // User permissions operations
  getUserPermissions(userId: number): Promise<UserPermission[]>;
  getUserPermission(userId: number, module: string): Promise<UserPermission | undefined>;
  createUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  revokeUserPermission(userId: number, module: string, revokedBy: number): Promise<void>;
  deleteUserPermission(userId: number, module: string): Promise<void>;
  getAggregatedPermissions(userId: number, userRole: string): Promise<Record<string, string>>;
  
  // Employee operations
  getEmployee(userId: number): Promise<Employee | undefined>;
  getEmployees(organizationId: string, filters?: { role?: string; status?: string; department?: string }): Promise<(Employee & { user: User })[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee>;
  getEmployeesByDepartment(departmentCode: string): Promise<(Employee & { user: User })[]>;
  getEmployeeByUserId(userId: number): Promise<Employee | undefined>;
  getEmployeeById(id: number): Promise<Employee | undefined>;
  
  // Department operations
  getDepartments(): Promise<(Department & { manager?: User })[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department>;
  deleteDepartment(id: number): Promise<void>;
  
  // Employee submissions operations (two-phase onboarding)
  getEmployeeSubmissions(): Promise<EmployeeSubmission[]>;
  getEmployeeSubmission(id: number): Promise<EmployeeSubmission | undefined>;
  createEmployeeSubmission(submission: InsertEmployeeSubmission): Promise<EmployeeSubmission>;
  updateEmployeeSubmission(id: number, submission: Partial<InsertEmployeeSubmission>): Promise<EmployeeSubmission>;
  updateHRStep(submissionId: number, stepId: string, isCompleted: boolean, notes?: string): Promise<EmployeeSubmission>;
  
  // Task operations
  getTasks(filters?: { assignedTo?: string; status?: string; priority?: string }): Promise<(Task & { assignedToUser?: User; assignedByUser?: User })[]>;
  getTask(id: number): Promise<(Task & { assignedToUser?: User; assignedByUser?: User }) | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  
  // Task request operations
  getTaskRequests(filters?: { taskId?: number; requesterId?: string; status?: string }): Promise<any[]>;
  getTaskRequest(id: number): Promise<TaskRequest | undefined>;
  createTaskRequest(request: InsertTaskRequest): Promise<TaskRequest>;
  updateTaskRequest(id: number, request: Partial<InsertTaskRequest>): Promise<TaskRequest>;
  deleteTaskRequest(id: number): Promise<void>;
  
  // Employee-specific task request operations
  getTaskRequestsByUser(userId: number, filters?: { status?: string }): Promise<TaskRequest[]>;
  getAllTaskRequests(filters?: { status?: string; requesterId?: string; requestType?: string }): Promise<(TaskRequest & { requester: User })[]>;
  
  // Announcement operations
  getAnnouncements(userId?: string): Promise<(Announcement & { author: User })[]>;
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<void>;
  
  // Recognition operations
  getRecognitions(filters?: { nomineeId?: string; type?: string }): Promise<(Recognition & { nominee: User; nominator: User })[]>;
  createRecognition(recognition: InsertRecognition): Promise<Recognition>;
  updateRecognition(id: number, recognition: Partial<InsertRecognition>): Promise<Recognition>;
  
  // Logistics operations
  getLogisticsItems(): Promise<LogisticsItem[]>;
  getLogisticsItem(id: number): Promise<LogisticsItem | undefined>;
  createLogisticsItem(item: InsertLogisticsItem): Promise<LogisticsItem>;
  updateLogisticsItem(id: number, item: Partial<InsertLogisticsItem>): Promise<LogisticsItem>;
  deleteLogisticsItem(id: number): Promise<void>;
  
  getLogisticsRequests(filters?: { requesterId?: string; status?: string }): Promise<(LogisticsRequest & { requester: User; item: LogisticsItem })[]>;
  createLogisticsRequest(request: InsertLogisticsRequest): Promise<LogisticsRequest>;
  updateLogisticsRequest(id: number, request: Partial<InsertLogisticsRequest>): Promise<LogisticsRequest>;
  
  // Onboarding operations
  getOnboardingChecklists(employeeId: number): Promise<OnboardingChecklist[]>;
  getAllOnboardingChecklists(): Promise<OnboardingChecklist[]>;
  createOnboardingChecklist(checklist: InsertOnboardingChecklist): Promise<OnboardingChecklist>;
  updateOnboardingChecklist(id: number, checklist: Partial<InsertOnboardingChecklist>): Promise<OnboardingChecklist>;
  deleteOnboardingChecklist(id: number): Promise<void>;
  markOnboardingStepComplete(employeeId: number, stepTitle: string): Promise<void>;
  getOnboardingChecklistItem(id: number): Promise<OnboardingChecklist | undefined>;
  
  // Document operations
  getDocuments(filters?: { uploadedBy?: string; relatedTo?: string; relatedType?: string }): Promise<(Document & { uploader: User })[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Dashboard operations
  getDashboardStats(userId: number): Promise<{
    totalEmployees: number;
    activeOnboarding: number;
    openTasks: number;
    pendingApprovals: number;
    complianceRate: number;
  }>;
  
  getRecentActivities(userId: string, limit?: number): Promise<any[]>;
  getPendingApprovals(userId: string): Promise<any[]>;
  
  // Psychometric test operations
  getPsychometricTests(): Promise<PsychometricTest[]>;
  getPsychometricTest(id: number): Promise<PsychometricTest | undefined>;
  createPsychometricTest(test: InsertPsychometricTest): Promise<PsychometricTest>;
  updatePsychometricTest(id: number, test: Partial<InsertPsychometricTest>): Promise<PsychometricTest>;
  deletePsychometricTest(id: number): Promise<void>;
  
  getPsychometricQuestions(testId: number): Promise<PsychometricQuestion[]>;
  createPsychometricQuestion(question: InsertPsychometricQuestion): Promise<PsychometricQuestion>;
  updatePsychometricQuestion(id: number, question: Partial<InsertPsychometricQuestion>): Promise<PsychometricQuestion>;
  deletePsychometricQuestion(id: number): Promise<void>;
  
  getPsychometricTestAttempts(filters?: { testId?: number; candidateEmail?: string }): Promise<PsychometricTestAttempt[]>;
  getPsychometricTestAttempt(id: number): Promise<PsychometricTestAttempt | undefined>;
  createPsychometricTestAttempt(attempt: InsertPsychometricTestAttempt): Promise<PsychometricTestAttempt>;
  updatePsychometricTestAttempt(id: number, attempt: Partial<InsertPsychometricTestAttempt>): Promise<PsychometricTestAttempt>;

  // Project management operations
  createProject(project: InsertProject): Promise<Project>;
  getProjects(): Promise<(Project & { projectManager: User; memberCount: number })[]>;
  getProjectsForUser(userId: number, userRole: string): Promise<(Project & { projectManager: User; memberCount: number })[]>;
  getProject(id: number): Promise<(Project & { projectManager?: User; managers: (ProjectMember & { user: User })[]; members: (ProjectMember & { user: User })[] }) | undefined>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Project member operations
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  removeProjectMember(projectId: number, userId: number): Promise<void>;
  getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]>;
  getUserProjects(userId: number): Promise<(Project & { projectManager: User })[]>;

  // Project task operations
  createProjectTask(task: InsertProjectTask): Promise<ProjectTask>;
  getProjectTasks(projectId: number): Promise<(ProjectTask & { assignedToUser?: User; assignedByUser?: User })[]>;
  updateProjectTask(id: number, updates: Partial<InsertProjectTask>): Promise<ProjectTask>;
  deleteProjectTask(id: number): Promise<void>;
  getUserProjectTasks(userId: number): Promise<(ProjectTask & { project: Project; assignedByUser?: User })[]>;

  // Project file operations
  getProjectFiles(projectId: number): Promise<(ProjectFile & { uploader: User })[]>;
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  updateProjectFile(id: number, file: Partial<InsertProjectFile>): Promise<ProjectFile>;
  deleteProjectFile(id: number): Promise<void>;
  
  // Project overview operations
  getProjectOverview(projectId: number): Promise<ProjectOverview | undefined>;
  createProjectOverview(overview: InsertProjectOverview): Promise<ProjectOverview>;
  updateProjectOverview(projectId: number, overview: Partial<InsertProjectOverview>): Promise<ProjectOverview>;

  // Registration request operations
  getRegistrationRequests(filters?: { status?: string }): Promise<(RegistrationRequest & { reviewer?: User })[]>;
  getRegistrationRequest(id: number): Promise<RegistrationRequest | undefined>;
  getRegistrationRequestByEmail(email: string): Promise<RegistrationRequest | undefined>;
  createRegistrationRequest(request: InsertRegistrationRequest): Promise<RegistrationRequest>;
  updateRegistrationRequest(id: number, request: Partial<InsertRegistrationRequest>): Promise<RegistrationRequest>;
  approveRegistrationRequest(id: number, reviewerId: number, notes?: string): Promise<User>;
  rejectRegistrationRequest(id: number, reviewerId: number, notes: string): Promise<RegistrationRequest>;

  // Banking Information operations
  getBankingInfo(userId: number): Promise<any>;
  saveBankingInfo(userId: number, bankingData: any): Promise<any>;

  // Subscription operations
  updateUserStripeInfo(userId: number, customerId: string, subscriptionId?: string): Promise<User>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  getSubscriptionPlans(): Promise<any[]>;
  getSubscriptionPlan(planId: string): Promise<any | undefined>;
  createSubscriptionHistory(userId: number, subscriptionData: any): Promise<any>;
  getUserSubscription(userId: number): Promise<User | undefined>;
  updateSubscriptionPlanPriceIds(planId: number, monthlyPriceId?: string, yearlyPriceId?: string): Promise<void>;

  // Trial request operations
  getTrialRequests(filters?: { status?: string }): Promise<TrialRequest[]>;
  getTrialRequest(id: number): Promise<TrialRequest | undefined>;
  createTrialRequest(request: InsertTrialRequest): Promise<TrialRequest>;
  updateTrialRequest(id: number, request: Partial<InsertTrialRequest>): Promise<TrialRequest>;
  approveTrialRequest(id: number, approvedBy: number): Promise<TrialRequest>;
  rejectTrialRequest(id: number, approvedBy: number, reason: string): Promise<TrialRequest>;
  getPendingTrialRequestsCount(): Promise<number>;

  // Super Admin SaaS operations
  getTrialUsers(): Promise<any[]>;
  getSaasStats(): Promise<any>;
  createTrialUser(userData: any): Promise<User>;
  extendTrial(userId: number, days: number): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByStripeId(stripeCustomerId: string): Promise<Customer | undefined>;
  getCustomerByTrialRequest(trialRequestId: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  
  // Subscription operations
  getSubscriptions(): Promise<(Subscription & { customer: Customer })[]>;
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  getCustomerSubscriptions(customerId: number): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription>;
  
  // Payment operations
  getPayments(): Promise<(Payment & { customer: Customer })[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getCustomerPayments(customerId: number): Promise<Payment[]>;
  getSubscriptionPayments(subscriptionId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;
  
  // Billing event operations
  getBillingEvents(customerId?: number): Promise<(BillingEvent & { customer: Customer })[]>;
  createBillingEvent(event: InsertBillingEvent): Promise<BillingEvent>;
  
  // Subscription analytics
  getSubscriptionAnalytics(): Promise<{
    totalRevenue: number;
    monthlyRevenue: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    canceledSubscriptions: number;
    avgRevenuePerCustomer: number;
  }>;

  // Job application operations
  getAllJobApplications(): Promise<JobApplication[]>;
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, application: Partial<InsertJobApplication>): Promise<JobApplication>;
  deleteJobApplication(id: number): Promise<void>;

  // Employment contract operations
  getEmploymentContracts(userId?: number): Promise<EmploymentContract[]>;
  getEmploymentContract(id: number): Promise<EmploymentContract | undefined>;
  getUserPendingContract(userId: number): Promise<EmploymentContract | undefined>;
  createEmploymentContract(contract: InsertEmploymentContract): Promise<EmploymentContract>;
  updateEmploymentContract(id: number, contract: Partial<InsertEmploymentContract>): Promise<EmploymentContract>;
  signEmploymentContract(contractId: number, signature: string, ipAddress: string, userAgent: string): Promise<void>;
  deleteEmploymentContract(id: number): Promise<void>;

  // Leave management operations (Meeting Matters manual section 6.37)
  getLeaveBalance(employeeId: number, year: number): Promise<LeaveBalance | undefined>;
  createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance>;
  updateLeaveBalance(id: number, balance: Partial<InsertLeaveBalance>): Promise<LeaveBalance>;
  
  getLeaveRequests(filters?: { employeeId?: number; status?: string }): Promise<(LeaveRequest & { employee: Employee; requester: User; approver?: User })[]>;
  getLeaveRequest(id: number): Promise<LeaveRequest | undefined>;
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: number, request: Partial<InsertLeaveRequest>): Promise<LeaveRequest>;
  approveLeaveRequest(id: number, approverId: number): Promise<LeaveRequest>;
  rejectLeaveRequest(id: number, approverId: number, reason: string): Promise<LeaveRequest>;
  processLeaveByAdmin(id: number, adminId: number): Promise<LeaveRequest>;
  
  // Vacancy operations for HR visibility
  getVacancies(filters?: { designation?: string; companyId?: number; status?: string }): Promise<Vacancy[]>;
  getVacancy(id: number): Promise<Vacancy | undefined>;
  createVacancy(vacancy: InsertVacancy): Promise<Vacancy>;
  updateVacancy(id: number, vacancy: Partial<InsertVacancy>): Promise<Vacancy>;
  deleteVacancy(id: number): Promise<void>;
  
  // CRM Inquiry operations
  getCrmInquiries(organizationId: string, filters?: { status?: string; attendant?: string; source?: string; dateFrom?: Date; dateTo?: Date }): Promise<(CrmInquiry & { creator: User })[]>;
  getCrmInquiry(id: number): Promise<CrmInquiry | undefined>;
  createCrmInquiry(inquiry: InsertCrmInquiry): Promise<CrmInquiry>;
  updateCrmInquiry(id: number, inquiry: Partial<InsertCrmInquiry>): Promise<CrmInquiry>;
  deleteCrmInquiry(id: number): Promise<void>;
  
  // Organizational Hierarchy operations
  getOrgUnits(organizationId: string, filters?: { companyId?: number; isActive?: boolean }): Promise<OrgUnit[]>;
  getOrgUnit(id: number): Promise<OrgUnit | undefined>;
  createOrgUnit(unit: InsertOrgUnit): Promise<OrgUnit>;
  updateOrgUnit(id: number, unit: Partial<InsertOrgUnit>): Promise<OrgUnit>;
  deleteOrgUnit(id: number): Promise<void>;
  getOrgHierarchy(organizationId: string, companyId?: number): Promise<(OrgUnit & { employees: (Employee & { user: User })[] })[]>;
  assignEmployeeToOrgUnit(assignment: InsertOrgUnitAssignment): Promise<OrgUnitAssignment>;
  getOrgUnitForEmployee(employeeId: number): Promise<(OrgUnitAssignment & { orgUnit: OrgUnit }) | undefined>;
  getEmployeesInOrgUnit(orgUnitId: number): Promise<(OrgUnitAssignment & { employee: Employee & { user: User } })[]>;
  removeEmployeeFromOrgUnit(employeeId: number, orgUnitId: number): Promise<void>;

  // Meeting Matters Studio - Meeting Management
  getStudioMeetings(filters?: { status?: string; startDate?: Date; endDate?: Date; organizerId?: number }): Promise<(StudioMeeting & { organizer: User; attendeeCount: number })[]>;
  getStudioMeeting(id: number): Promise<(StudioMeeting & { organizer: User; attendees: (MeetingAttendee & { user: User })[]; notes: MeetingNote[] }) | undefined>;
  createStudioMeeting(meeting: InsertStudioMeeting): Promise<StudioMeeting>;
  updateStudioMeeting(id: number, meeting: Partial<InsertStudioMeeting>): Promise<StudioMeeting>;
  deleteStudioMeeting(id: number): Promise<void>;
  
  // Meeting Attendees
  addMeetingAttendee(attendee: InsertMeetingAttendee): Promise<MeetingAttendee>;
  updateMeetingAttendee(id: number, attendee: Partial<InsertMeetingAttendee>): Promise<MeetingAttendee>;
  removeMeetingAttendee(id: number): Promise<void>;
  getMeetingAttendees(meetingId: number): Promise<(MeetingAttendee & { user: User })[]>;
  
  // Meeting Notes & Action Items
  createMeetingNote(note: InsertMeetingNote): Promise<MeetingNote>;
  updateMeetingNote(id: number, note: Partial<InsertMeetingNote>): Promise<MeetingNote>;
  deleteMeetingNote(id: number): Promise<void>;
  getMeetingNotes(meetingId: number): Promise<(MeetingNote & { assignedToUser?: User; createdByUser: User })[]>;
  
  // Meeting Work Items - Post-meeting outcomes tracking
  createMeetingWorkItem(workItem: InsertMeetingWorkItem): Promise<MeetingWorkItem>;
  updateMeetingWorkItem(id: number, workItem: Partial<InsertMeetingWorkItem>): Promise<MeetingWorkItem>;
  deleteMeetingWorkItem(id: number): Promise<void>;
  getMeetingWorkItems(meetingId: number): Promise<(MeetingWorkItem & { assignedToUser?: User; createdByUser: User; linkCount: number })[]>;
  getPreviousMeetingWork(meetingId: number): Promise<{ previousMeeting: StudioMeeting | null; workItems: (MeetingWorkItem & { assignedToUser?: User; createdByUser: User })[] }>;
  
  // Meeting Links - Related links and resources
  createMeetingLink(link: InsertMeetingLink): Promise<MeetingLink>;
  updateMeetingLink(id: number, link: Partial<InsertMeetingLink>): Promise<MeetingLink>;
  deleteMeetingLink(id: number): Promise<void>;
  getMeetingLinks(meetingId: number): Promise<(MeetingLink & { createdByUser: User })[]>;
  
  // Creative Briefs
  getCreativeBriefs(filters?: { status?: string; assignedTo?: number; campaignId?: number }): Promise<(CreativeBrief & { creator: User; assignee?: User })[]>;
  getCreativeBrief(id: number): Promise<CreativeBrief | undefined>;
  createCreativeBrief(brief: InsertCreativeBrief): Promise<CreativeBrief>;
  updateCreativeBrief(id: number, brief: Partial<InsertCreativeBrief>): Promise<CreativeBrief>;
  deleteCreativeBrief(id: number): Promise<void>;
  
  // Analytics Entries
  getAnalyticsEntries(filters?: { platform?: string; campaignId?: number }): Promise<AnalyticsEntry[]>;
  getAnalyticsEntry(id: number): Promise<AnalyticsEntry | undefined>;
  createAnalyticsEntry(entry: InsertAnalyticsEntry): Promise<AnalyticsEntry>;
  updateAnalyticsEntry(id: number, entry: Partial<InsertAnalyticsEntry>): Promise<AnalyticsEntry>;
  deleteAnalyticsEntry(id: number): Promise<void>;
  
  // Asset Library
  getAssetLibrary(filters?: { assetType?: string; category?: string; createdBy?: number }): Promise<(AssetLibrary & { creator: User })[]>;
  getAsset(id: number): Promise<AssetLibrary | undefined>;
  createAsset(asset: InsertAssetLibrary): Promise<AssetLibrary>;
  updateAsset(id: number, asset: Partial<InsertAssetLibrary>): Promise<AssetLibrary>;
  deleteAsset(id: number): Promise<void>;
  
  // Approval Workflows
  getApprovalWorkflows(filters?: { status?: string; itemType?: string; requesterId?: number }): Promise<(ApprovalWorkflow & { requester: User; currentApproverUser?: User })[]>;
  getApprovalWorkflow(id: number): Promise<ApprovalWorkflow | undefined>;
  createApprovalWorkflow(workflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow>;
  updateApprovalWorkflow(id: number, workflow: Partial<InsertApprovalWorkflow>): Promise<ApprovalWorkflow>;
  approveWorkflowStep(id: number, approverId: number): Promise<ApprovalWorkflow>;
  rejectWorkflow(id: number, rejectorId: number, reason: string): Promise<ApprovalWorkflow>;
  
  // Studio Reports
  getStudioReports(filters?: { reportType?: string; startDate?: Date; endDate?: Date }): Promise<StudioReport[]>;
  getStudioReport(id: number): Promise<StudioReport | undefined>;
  createStudioReport(report: InsertStudioReport): Promise<StudioReport>;
  updateStudioReport(id: number, report: Partial<InsertStudioReport>): Promise<StudioReport>;
  deleteStudioReport(id: number): Promise<void>;
  generateStudioReport(reportType: string, startDate: Date, endDate: Date, generatedBy?: number): Promise<StudioReport>;
  
  // Dashboard Sections - Customizable dashboard widgets
  getDashboardSections(organizationId: string, visibleOnly?: boolean): Promise<(DashboardSection & { creator?: User })[]>;
  getDashboardSection(id: number): Promise<DashboardSection | undefined>;
  createDashboardSection(section: InsertDashboardSection): Promise<DashboardSection>;
  updateDashboardSection(id: number, section: Partial<InsertDashboardSection>): Promise<DashboardSection>;
  deleteDashboardSection(id: number): Promise<void>;
  reorderDashboardSections(organizationId: string, sectionOrders: { id: number; displayOrder: number }[]): Promise<void>;
  seedDefaultDashboardSections(organizationId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private client: typeof pool;

  constructor() {
    this.client = pool;
  }

  // User operations for session-based auth
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // First try to find by username
    let user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (user.length > 0) {
      return user[0];
    }
    
    // If not found by username, try to find by employee ID
    const employeeResult = await db
      .select()
      .from(users)
      .innerJoin(employees, eq(users.id, employees.userId))
      .where(eq(employees.employeeId, username))
      .limit(1);
    
    if (employeeResult.length > 0) {
      return employeeResult[0].users;
    }
    
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const userList = await db.select().from(users).where(eq(users.role, role));
    return userList;
  }

  async getUserByOnboardingToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.onboardingToken, token));
    return user;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    // Hash password if provided
    const processedData = { ...userData };
    if (processedData.password) {
      const bcrypt = await import('bcrypt');
      processedData.password = await bcrypt.hash(processedData.password, 10);
    }
    
    const [user] = await db
      .insert(users)
      .values(processedData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Hash password if provided
    const processedData = { ...userData };
    if (processedData.password) {
      const bcrypt = await import('bcrypt');
      processedData.password = await bcrypt.hash(processedData.password, 10);
    }
    
    const [user] = await db
      .insert(users)
      .values(processedData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: processedData.firstName,
          lastName: processedData.lastName,
          role: processedData.role,
          department: processedData.department,
          position: processedData.position,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    // Hash password if provided
    const processedData = { ...userData };
    if (processedData.password) {
      const bcrypt = await import('bcrypt');
      processedData.password = await bcrypt.hash(processedData.password, 10);
    }
    
    const [user] = await db
      .update(users)
      .set({ ...processedData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // User permissions operations
  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    const permissions = await db
      .select()
      .from(userPermissions)
      .where(and(
        eq(userPermissions.userId, userId),
        isNull(userPermissions.revokedAt)
      ));
    return permissions;
  }

  async getUserPermission(userId: number, module: string): Promise<UserPermission | undefined> {
    const [permission] = await db
      .select()
      .from(userPermissions)
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.module, module as any),
        isNull(userPermissions.revokedAt)
      ));
    return permission;
  }

  async createUserPermission(permission: InsertUserPermission): Promise<UserPermission> {
    const [newPermission] = await db
      .insert(userPermissions)
      .values(permission)
      .returning();
    return newPermission;
  }

  async revokeUserPermission(userId: number, module: string, revokedBy: number): Promise<void> {
    await db
      .update(userPermissions)
      .set({ revokedAt: new Date() })
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.module, module as any),
        isNull(userPermissions.revokedAt)
      ));
  }

  async deleteUserPermission(userId: number, module: string): Promise<void> {
    await db
      .delete(userPermissions)
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.module, module as any)
      ));
  }

  async getAggregatedPermissions(userId: number, userRole: string): Promise<Record<string, string>> {
    // Default role-based permissions
    const rolePermissions: Record<string, Record<string, string>> = {
      hr_admin: {
        employee_management: 'manage',
        contract_management: 'manage',
        announcements: 'manage',
        leave_management: 'manage',
      },
      branch_manager: {
        employee_management: 'view',
        contract_management: 'view',
        announcements: 'manage',
        leave_management: 'view',
      },
      team_lead: {
        employee_management: 'view',
        contract_management: 'view',
        announcements: 'view',
        leave_management: 'view',
      },
      employee: {
        employee_management: 'view',
        contract_management: 'view',
        announcements: 'view',
        leave_management: 'view',
      },
      logistics_manager: {
        employee_management: 'view',
        contract_management: 'view',
        announcements: 'view',
        leave_management: 'view',
      }
    };

    // Start with role defaults
    const permissions = { ...(rolePermissions[userRole] || {}) };

    // Apply user-specific overrides
    const userOverrides = await this.getUserPermissions(userId);
    userOverrides.forEach(override => {
      permissions[override.module] = override.level;
    });

    return permissions;
  }

  // Employee operations
  async getEmployee(userId: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
    return employee;
  }

  async getEmployeeById(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getEmployees(organizationId: string, filters?: { role?: string; status?: string; department?: string }): Promise<(Employee & { user: User; company?: any })[]> {
    const conditions = [eq(employees.organizationId, organizationId)];

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role as any));
    }
    if (filters?.status) {
      conditions.push(eq(users.status, filters.status as any));
    }
    if (filters?.department) {
      conditions.push(eq(users.department, filters.department));
    }

    const query = db
      .select()
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .leftJoin(companies, eq(employees.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(desc(employees.createdAt));

    const result = await query;

    return result.map(row => ({ 
      ...row.employees, 
      user: row.users,
      company: row.companies || undefined
    }));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    // Auto-generate employee ID if not provided
    let employeeData = { ...employee };
    if (!employeeData.employeeId) {
      const count = await db.select({ count: sql<number>`count(*)` }).from(employees);
      const nextNumber = (count[0]?.count || 0) + 1;
      employeeData.employeeId = `EMP${nextNumber.toString().padStart(3, '0')}`;
    }
    
    const [newEmployee] = await db.insert(employees).values(employeeData).returning();
    
    // Automatically create standard onboarding checklist for the new employee
    await this.createStandardOnboardingChecklist(newEmployee.id);
    
    return newEmployee;
  }

  // Create standard onboarding checklist for new employees
  async createStandardOnboardingChecklist(employeeId: number): Promise<void> {
    const standardChecklistItems = [
      {
        title: 'Complete Personal Profile',
        description: 'Update your personal information, contact details, and emergency contacts',
        order: 1,
        requiresDocument: false,
        requiresPsychometricTest: false,
        dueDaysOffset: 3
      },
      {
        title: 'Upload Profile Picture',
        description: 'Add a professional profile picture to your account',
        order: 2,
        requiresDocument: false,
        requiresPsychometricTest: false,
        dueDaysOffset: 3
      },
      {
        title: 'Complete Emergency Contact Information',
        description: 'Provide emergency contact details for company records',
        order: 3,
        requiresDocument: false,
        requiresPsychometricTest: false,
        dueDaysOffset: 5
      },
      {
        title: 'Personality Assessment Test',
        description: 'Complete the Big Five personality traits assessment',
        order: 4,
        requiresDocument: false,
        requiresPsychometricTest: true,
        dueDaysOffset: 7
      },
      {
        title: 'Cognitive Abilities Assessment Test',
        description: 'Complete the cognitive abilities and logical reasoning test',
        order: 5,
        requiresDocument: false,
        requiresPsychometricTest: true,
        dueDaysOffset: 7
      },
      {
        title: 'Communication Skills Assessment Test',
        description: 'Complete the workplace communication scenarios evaluation',
        order: 6,
        requiresDocument: false,
        requiresPsychometricTest: true,
        dueDaysOffset: 7
      },
      {
        title: 'Technical Skills Assessment Test',
        description: 'Complete the technical aptitude and problem-solving assessment',
        order: 7,
        requiresDocument: false,
        requiresPsychometricTest: true,
        dueDaysOffset: 10
      },
      {
        title: 'Values and Culture Fit Assessment Test',
        description: 'Complete the company values alignment and culture fit evaluation',
        order: 8,
        requiresDocument: false,
        requiresPsychometricTest: true,
        dueDaysOffset: 10
      },
      {
        title: 'Review Company Handbook',
        description: 'Read and acknowledge the company policies and procedures',
        order: 9,
        requiresDocument: true,
        requiresPsychometricTest: false,
        dueDaysOffset: 7
      },
      {
        title: 'Setup IT Equipment',
        description: 'Configure your computer, email, and necessary software tools',
        order: 10,
        requiresDocument: false,
        requiresPsychometricTest: false,
        dueDaysOffset: 10
      },
      {
        title: 'Upload Required Documents',
        description: 'Upload CNIC, educational certificates, experience letters, and other required documents',
        order: 11,
        requiresDocument: true,
        requiresPsychometricTest: false,
        dueDaysOffset: 14
      },
      {
        title: 'Complete Banking Information',
        description: 'Provide bank account details, routing numbers, and salary payment information',
        order: 12,
        requiresDocument: false,
        requiresPsychometricTest: false,
        dueDaysOffset: 14
      }
    ];

    const now = new Date();
    const checklistInserts = standardChecklistItems.map(item => ({
      employeeId,
      itemTitle: item.title,
      description: item.description,
      isCompleted: false,
      dueDate: new Date(now.getTime() + item.dueDaysOffset * 24 * 60 * 60 * 1000),
      order: item.order,
      requiresDocument: item.requiresDocument,
      requiresPsychometricTest: item.requiresPsychometricTest,
      createdAt: now,
      updatedAt: now
    }));

    await db.insert(onboardingChecklists).values(checklistInserts);
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async getEmployeeByUserId(userId: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
    return employee;
  }

  async getEmployeeById(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async deleteEmployee(id: number): Promise<void> {
    try {
      // Get the employee by ID
      const employeeResult = await db.select().from(employees).where(eq(employees.id, id));
      
      if (!employeeResult || employeeResult.length === 0) {
        throw new Error('Employee not found');
      }

      const employeeRecord = employeeResult[0];
      const userId = employeeRecord.userId;

      // Use transaction to ensure all deletions happen atomically
      await db.transaction(async (tx) => {
        // Delete related records in proper order to avoid foreign key constraints
        
        // 1. Delete company handbooks created by this user
        await tx.delete(companyHandbooks).where(eq(companyHandbooks.createdBy, userId));
        
        // 2. Delete onboarding checklists
        await tx.delete(onboardingChecklists).where(eq(onboardingChecklists.employeeId, id));
        
        // 3. Update tasks to remove assignment (set to null)
        await tx.update(tasks).set({ assignedTo: null }).where(eq(tasks.assignedTo, userId));
        
        // 4. Delete task requests created by this user  
        await tx.delete(taskRequests).where(eq(taskRequests.requesterId, userId.toString()));
        
        // 5. Delete logistics requests
        await tx.delete(logisticsRequests).where(eq(logisticsRequests.requesterId, userId.toString()));
        
        // 6. Delete documents uploaded by this user
        await tx.delete(documents).where(eq(documents.uploadedBy, userId.toString()));
        
        // 7. Delete recognition records (both given and received)
        await tx.delete(recognition).where(eq(recognition.nominatedBy, userId.toString()));
        await tx.delete(recognition).where(eq(recognition.nomineeId, userId.toString()));
        
        // 8. Delete psychometric test results
        await tx.delete(psychometricTests).where(eq(psychometricTests.userId, userId.toString()));
        
        // 9. Delete onboarding steps
        await tx.delete(onboardingSteps).where(eq(onboardingSteps.userId, userId.toString()));
        
        // 10. Remove from project assignments
        await tx.delete(projectAssignments).where(eq(projectAssignments.userId, userId));
        
        // 11. Delete employee record
        await tx.delete(employees).where(eq(employees.id, id));
        
        // 12. Finally delete the user account
        await tx.delete(users).where(eq(users.id, userId));
      });
      
    } catch (error) {
      console.error('Error deleting employee:', error);
      
      // Handle foreign key constraint violations with user-friendly messages
      if (error instanceof Error && error.message.includes('23503')) {
        throw new Error('Cannot delete employee: This employee has created content that must be handled first. Please contact system administrator.');
      }
      
      throw new Error(`Failed to delete employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }



  // Task operations
  async getTasks(filters?: { assignedTo?: string; status?: string; priority?: string }): Promise<(Task & { assignedToUser?: User; assignedByUser?: User })[]> {
    const conditions = [];

    if (filters?.assignedTo) {
      conditions.push(eq(tasks.assignedTo, parseInt(filters.assignedTo)));
    }
    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status as any));
    }
    if (filters?.priority) {
      conditions.push(eq(tasks.priority, filters.priority as any));
    }

    const query = db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .orderBy(desc(tasks.createdAt));

    const result = conditions.length > 0 
      ? await query.where(and(...conditions))
      : await query;

    return result.map(row => ({ ...row.tasks, assignedToUser: row.users || undefined }));
  }

  async getTask(id: number): Promise<(Task & { assignedToUser?: User; assignedByUser?: User }) | undefined> {
    const result = await db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.id, id));

    if (result.length === 0) {
      return undefined;
    }

    const row = result[0];
    return { ...row.tasks, assignedToUser: row.users || undefined };
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    // Check if there are any active task requests for this task
    const relatedRequests = await db
      .select()
      .from(taskRequests)
      .where(and(eq(taskRequests.taskId, id), eq(taskRequests.isActive, true)));

    if (relatedRequests.length > 0) {
      throw new Error('Cannot delete task with active requests. Please resolve all task requests first.');
    }

    // Soft delete any inactive task requests first
    await db
      .update(taskRequests)
      .set({ isActive: false })
      .where(eq(taskRequests.taskId, id));

    // Now delete the task
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Task request operations
  async getTaskRequests(filters?: { taskId?: number; requesterId?: string; status?: string; departmentId?: number }): Promise<any[]> {
    const conditions = [eq(taskRequests.isActive, true)];

    if (filters?.taskId) {
      conditions.push(eq(taskRequests.taskId, filters.taskId));
    }
    if (filters?.requesterId) {
      conditions.push(eq(taskRequests.requesterId, filters.requesterId));
    }
    if (filters?.status) {
      conditions.push(eq(taskRequests.status, filters.status));
    }
    if (filters?.departmentId) {
      conditions.push(eq(taskRequests.departmentId, filters.departmentId));
    }

    // Get all task requests first
    const requestsResult = await db
      .select()
      .from(taskRequests)
      .where(and(...conditions))
      .orderBy(desc(taskRequests.createdAt));

    // Get related data for each request
    const enrichedRequests = [];
    for (const request of requestsResult) {
      // Get requester
      const [requesterResult] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          username: users.username
        })
        .from(users)
        .where(eq(users.id, parseInt(request.requesterId)));
      
      const requester = requesterResult ? {
        id: requesterResult.id.toString(),
        firstName: requesterResult.firstName,
        lastName: requesterResult.lastName,
        email: requesterResult.email,
        username: requesterResult.username
      } : undefined;

      // Get task (if exists)
      let task = undefined;
      if (request.taskId) {
        const [taskResult] = await db
          .select()
          .from(tasks)
          .where(eq(tasks.id, request.taskId));
        task = taskResult;
      }

      // Get department (if exists)
      let department = undefined;
      if (request.departmentId) {
        const [departmentResult] = await db
          .select()
          .from(departments)
          .where(eq(departments.id, request.departmentId));
        department = departmentResult;
      }

      // Get assigned employee (if exists)
      let assignedEmployee = undefined;
      if (request.assignedToEmployeeId) {
        const [assignedResult] = await db
          .select()
          .from(users)
          .where(eq(users.id, request.assignedToEmployeeId));
        assignedEmployee = assignedResult;
      }

      // Get responder if exists
      let responder = undefined;
      if (request.respondedBy) {
        const [responderResult] = await db
          .select()
          .from(users)
          .where(eq(users.id, parseInt(request.respondedBy)));
        responder = responderResult;
      }

      enrichedRequests.push({
        ...request,
        requester,
        task,
        department,
        assignedEmployee,
        responder
      });
    }

    return enrichedRequests;
  }

  // Employee-specific task request methods
  async getTaskRequestsByUser(userId: number, filters?: { status?: string }): Promise<TaskRequest[]> {
    const conditions = [eq(taskRequests.requesterId, userId.toString())];
    
    if (filters?.status) {
      conditions.push(eq(taskRequests.status, filters.status));
    }

    const result = await db
      .select()
      .from(taskRequests)
      .where(and(...conditions))
      .orderBy(desc(taskRequests.createdAt));

    return result;
  }

  async getAllTaskRequests(filters?: { status?: string; requesterId?: string; requestType?: string }): Promise<(TaskRequest & { requester: User })[]> {
    const conditions: any[] = [];
    
    if (filters?.status) {
      conditions.push(eq(taskRequests.status, filters.status));
    }
    if (filters?.requesterId) {
      conditions.push(eq(taskRequests.requesterId, filters.requesterId));
    }
    if (filters?.requestType) {
      conditions.push(eq(taskRequests.requestType, filters.requestType));
    }

    const result = await db
      .select({
        taskRequest: taskRequests,
        requester: users
      })
      .from(taskRequests)
      .leftJoin(users, eq(users.id, sql`${taskRequests.requesterId}::integer`))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(taskRequests.createdAt));

    return result.map(row => ({
      ...row.taskRequest,
      requester: row.requester!
    }));
  }

  async getTaskRequest(id: number): Promise<TaskRequest | undefined> {
    const [request] = await db.select().from(taskRequests).where(eq(taskRequests.id, id));
    return request;
  }

  async createTaskRequest(request: InsertTaskRequest): Promise<TaskRequest> {
    const [newRequest] = await db.insert(taskRequests).values(request).returning();
    return newRequest;
  }

  async updateTaskRequest(id: number, request: Partial<InsertTaskRequest>): Promise<TaskRequest> {
    const [updatedRequest] = await db
      .update(taskRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(taskRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteTaskRequest(id: number): Promise<void> {
    await db.update(taskRequests).set({ isActive: false }).where(eq(taskRequests.id, id));
  }

  async assignDepartmentTaskRequest(requestId: number, assignedToEmployeeId: string, responderId: string, responseMessage?: string): Promise<TaskRequest> {
    const [updatedRequest] = await db
      .update(taskRequests)
      .set({
        assignedToEmployeeId,
        respondedBy: responderId,
        responseMessage,
        respondedAt: new Date(),
        status: 'assigned',
        assignedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(taskRequests.id, requestId))
      .returning();
    return updatedRequest;
  }

  // Task update operations
  async getTaskUpdates(taskId: number): Promise<(TaskUpdate & { user: User })[]> {
    const result = await db
      .select()
      .from(taskUpdates)
      .innerJoin(users, eq(taskUpdates.userId, users.id))
      .where(eq(taskUpdates.taskId, taskId))
      .orderBy(desc(taskUpdates.createdAt));

    return result.map(row => ({ ...row.task_updates, user: row.users }));
  }

  async createTaskUpdate(update: InsertTaskUpdate): Promise<TaskUpdate> {
    const [newUpdate] = await db.insert(taskUpdates).values(update).returning();
    return newUpdate;
  }

  async updateTaskUpdate(id: number, update: Partial<InsertTaskUpdate>): Promise<TaskUpdate> {
    const [updatedUpdate] = await db
      .update(taskUpdates)
      .set(update)
      .where(eq(taskUpdates.id, id))
      .returning();
    return updatedUpdate;
  }

  // Announcement operations
  async getAnnouncements(userId?: string): Promise<(Announcement & { author: User })[]> {
    const result = await db
      .select()
      .from(announcements)
      .leftJoin(users, eq(announcements.authorId, users.username))
      .orderBy(desc(announcements.createdAt));

    return result.map(row => ({ ...row.announcements, author: row.users }));
  }

  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement;
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement> {
    const [updatedAnnouncement] = await db
      .update(announcements)
      .set({ ...announcement, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return updatedAnnouncement;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  // Recognition operations
  async getRecognitions(filters?: { nomineeId?: string; type?: string }): Promise<any[]> {
    const conditions = [];

    if (filters?.nomineeId) {
      conditions.push(eq(recognition.nomineeId, filters.nomineeId));
    }
    if (filters?.type) {
      conditions.push(eq(recognition.type, filters.type));
    }

    const query = db
      .select()
      .from(recognition)
      .orderBy(desc(recognition.createdAt));

    const result = conditions.length > 0 
      ? await query.where(and(...conditions))
      : await query;

    return result;
  }

  async createRecognition(recognitionData: InsertRecognition): Promise<Recognition> {
    const [newRecognition] = await db.insert(recognition).values(recognitionData).returning();
    return newRecognition;
  }

  async updateRecognition(id: number, recognitionData: Partial<InsertRecognition>): Promise<Recognition> {
    const [updatedRecognition] = await db
      .update(recognition)
      .set({ ...recognitionData, updatedAt: new Date() })
      .where(eq(recognition.id, id))
      .returning();
    return updatedRecognition;
  }

  // Logistics operations
  async getLogisticsItems(): Promise<LogisticsItem[]> {
    return await db.select().from(logisticsItems).orderBy(desc(logisticsItems.createdAt));
  }

  async getLogisticsItem(id: number): Promise<LogisticsItem | undefined> {
    const [item] = await db.select().from(logisticsItems).where(eq(logisticsItems.id, id));
    return item;
  }

  async createLogisticsItem(item: InsertLogisticsItem): Promise<LogisticsItem> {
    const [newItem] = await db.insert(logisticsItems).values(item).returning();
    return newItem;
  }

  async updateLogisticsItem(id: number, item: Partial<InsertLogisticsItem>): Promise<LogisticsItem> {
    const [updatedItem] = await db
      .update(logisticsItems)
      .set(item)
      .where(eq(logisticsItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteLogisticsItem(id: number): Promise<void> {
    await db.delete(logisticsItems).where(eq(logisticsItems.id, id));
  }

  async getLogisticsRequests(filters?: { requesterId?: string; status?: string }): Promise<(LogisticsRequest & { requester: User; item: LogisticsItem })[]> {
    const conditions = [];

    if (filters?.requesterId) {
      conditions.push(eq(logisticsRequests.requesterId, filters.requesterId));
    }
    if (filters?.status) {
      conditions.push(eq(logisticsRequests.status, filters.status as any));
    }

    const query = db
      .select()
      .from(logisticsRequests)
      .leftJoin(users, eq(logisticsRequests.requesterId, sql`CAST(${users.id} AS VARCHAR)`))
      .leftJoin(logisticsItems, eq(logisticsRequests.itemId, logisticsItems.id))
      .orderBy(desc(logisticsRequests.createdAt));

    const result = conditions.length > 0 
      ? await query.where(and(...conditions))
      : await query;

    return result.map(row => ({ ...row.logistics_requests, requester: row.users, item: row.logistics_items }));
  }

  async createLogisticsRequest(request: InsertLogisticsRequest): Promise<LogisticsRequest> {
    const [newRequest] = await db.insert(logisticsRequests).values(request).returning();
    return newRequest;
  }

  async updateLogisticsRequest(id: number, request: Partial<InsertLogisticsRequest>): Promise<LogisticsRequest> {
    const [updatedRequest] = await db
      .update(logisticsRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(logisticsRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Enhanced Logistics Expense Management
  async getLogisticsExpenses(filters?: { 
    requestId?: number; 
    dateFrom?: string; 
    dateTo?: string; 
    expenseType?: string;
    vendor?: string;
  }): Promise<LogisticsExpense[]> {
    const conditions = [];

    if (filters?.requestId) {
      conditions.push(eq(logisticsExpenses.requestId, filters.requestId));
    }
    if (filters?.expenseType) {
      conditions.push(eq(logisticsExpenses.expenseType, filters.expenseType));
    }
    if (filters?.vendor) {
      conditions.push(eq(logisticsExpenses.vendor, filters.vendor));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(logisticsExpenses.date, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      conditions.push(lte(logisticsExpenses.date, new Date(filters.dateTo)));
    }

    const query = db
      .select()
      .from(logisticsExpenses)
      .orderBy(desc(logisticsExpenses.date));

    return conditions.length > 0 
      ? await query.where(and(...conditions))
      : await query;
  }

  async createLogisticsExpense(expense: InsertLogisticsExpense): Promise<LogisticsExpense> {
    const [newExpense] = await db.insert(logisticsExpenses).values(expense).returning();
    return newExpense;
  }

  async updateLogisticsExpense(id: number, expense: Partial<InsertLogisticsExpense>): Promise<LogisticsExpense> {
    const [updatedExpense] = await db
      .update(logisticsExpenses)
      .set({ ...expense, updatedAt: new Date() })
      .where(eq(logisticsExpenses.id, id))
      .returning();
    return updatedExpense;
  }

  async deleteLogisticsExpense(id: number): Promise<void> {
    await db.delete(logisticsExpenses).where(eq(logisticsExpenses.id, id));
  }

  // Logistics Movement Tracking
  async getLogisticsMovements(itemId?: number): Promise<LogisticsMovement[]> {
    const query = db
      .select()
      .from(logisticsMovements)
      .orderBy(desc(logisticsMovements.createdAt));

    return itemId 
      ? await query.where(eq(logisticsMovements.itemId, itemId))
      : await query;
  }

  async createLogisticsMovement(movement: InsertLogisticsMovement): Promise<LogisticsMovement> {
    const [newMovement] = await db.insert(logisticsMovements).values(movement).returning();
    return newMovement;
  }

  // Advanced Logistics Analytics
  async getMonthlyExpenseReport(year: number, month: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenses = await db
      .select()
      .from(logisticsExpenses)
      .where(and(
        gte(logisticsExpenses.date, startDate),
        lte(logisticsExpenses.date, endDate)
      ))
      .orderBy(desc(logisticsExpenses.date));

    return expenses;
  }

  async getExpensesByCategory(dateFrom?: string, dateTo?: string): Promise<any> {
    let query = db
      .select({
        category: logisticsExpenses.category,
        totalAmount: sql<number>`SUM(${logisticsExpenses.amount})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(logisticsExpenses)
      .groupBy(logisticsExpenses.category)
      .orderBy(desc(sql`SUM(${logisticsExpenses.amount})`));

    if (dateFrom && dateTo) {
      query = query.where(and(
        gte(logisticsExpenses.date, new Date(dateFrom)),
        lte(logisticsExpenses.date, new Date(dateTo))
      ));
    }

    return await query;
  }

  async getVendorExpenseReport(dateFrom?: string, dateTo?: string): Promise<any> {
    let baseQuery = db
      .select({
        vendor: logisticsExpenses.vendor,
        totalAmount: sql<number>`SUM(${logisticsExpenses.amount})`,
        count: sql<number>`COUNT(*)`,
        avgAmount: sql<number>`AVG(${logisticsExpenses.amount})`,
      })
      .from(logisticsExpenses)
      .where(isNotNull(logisticsExpenses.vendor))
      .groupBy(logisticsExpenses.vendor)
      .orderBy(desc(sql`SUM(${logisticsExpenses.amount})`));

    if (dateFrom && dateTo) {
      return await baseQuery.where(and(
        isNotNull(logisticsExpenses.vendor),
        gte(logisticsExpenses.date, new Date(dateFrom)),
        lte(logisticsExpenses.date, new Date(dateTo))
      ));
    }

    return await baseQuery;
  }

  async getLogisticsDashboardStats(): Promise<any> {
    const totalRequests = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(logisticsRequests);

    const pendingRequests = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(logisticsRequests)
      .where(eq(logisticsRequests.status, 'pending'));

    const monthlyExpenses = await db
      .select({ 
        total: sql<number>`SUM(${logisticsExpenses.amount})`,
        count: sql<number>`COUNT(*)`
      })
      .from(logisticsExpenses)
      .where(gte(logisticsExpenses.date, sql`DATE_TRUNC('month', CURRENT_DATE)`));

    const lowStockItems = await db
      .select()
      .from(logisticsItems)
      .where(sql`${logisticsItems.quantity} <= ${logisticsItems.minQuantity}`)
      .orderBy(asc(logisticsItems.quantity));

    return {
      totalRequests: totalRequests[0]?.count || 0,
      pendingRequests: pendingRequests[0]?.count || 0,
      monthlyExpenses: monthlyExpenses[0]?.total || 0,
      monthlyTransactions: monthlyExpenses[0]?.count || 0,
      lowStockItems: lowStockItems
    };
  }

  // Logistics Manager Role Management
  async getLogisticsManagers(): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .where(eq(users.role, 'logistics_manager'))
      .then(rows => rows.map(row => ({
        ...row.employees,
        user: row.users
      })));
  }

  async assignLogisticsManagerRole(employeeId: number): Promise<void> {
    // Get the employee first
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);
    
    if (employee.length > 0) {
      // Update the user's role
      await db
        .update(users)
        .set({ role: 'logistics_manager' })
        .where(eq(users.id, employee[0].userId));
    }
  }

  async removeLogisticsManagerRole(employeeId: number): Promise<void> {
    // Get the employee first
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);
    
    if (employee.length > 0) {
      // Update the user's role back to employee
      await db
        .update(users)
        .set({ role: 'employee' })
        .where(eq(users.id, employee[0].userId));
    }
  }

  // Onboarding operations
  async getOnboardingChecklists(employeeId: number): Promise<OnboardingChecklist[]> {
    return await db.select().from(onboardingChecklists).where(eq(onboardingChecklists.employeeId, employeeId));
  }

  async getAllOnboardingChecklists(): Promise<OnboardingChecklist[]> {
    return await db.select().from(onboardingChecklists).orderBy(desc(onboardingChecklists.createdAt));
  }

  async createOnboardingChecklist(checklist: InsertOnboardingChecklist): Promise<OnboardingChecklist> {
    const [newChecklist] = await db.insert(onboardingChecklists).values(checklist).returning();
    return newChecklist;
  }

  async updateOnboardingChecklist(id: number, checklist: Partial<InsertOnboardingChecklist>): Promise<OnboardingChecklist> {
    const [updatedChecklist] = await db
      .update(onboardingChecklists)
      .set({ ...checklist, updatedAt: new Date() })
      .where(eq(onboardingChecklists.id, id))
      .returning();
    return updatedChecklist;
  }

  async deleteOnboardingChecklist(id: number): Promise<void> {
    await db.delete(onboardingChecklists).where(eq(onboardingChecklists.id, id));
  }

  async markOnboardingStepComplete(employeeId: number, stepTitle: string): Promise<void> {
    await db
      .update(onboardingChecklists)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(onboardingChecklists.employeeId, employeeId),
          eq(onboardingChecklists.itemTitle, stepTitle)
        )
      );
    
    // Automatically update overall onboarding progress
    await this.updateOnboardingProgress(employeeId);
  }

  async updateOnboardingProgress(employeeId: number): Promise<void> {
    // Get all checklist items for this employee
    const items = await this.getOnboardingChecklists(employeeId);
    
    if (items.length === 0) return;
    
    // Calculate progress
    const completedItems = items.filter(item => item.isCompleted).length;
    const totalItems = items.length;
    const progressPercentage = Math.round((completedItems / totalItems) * 100);
    
    // Determine status
    let status = 'not_started';
    if (completedItems > 0 && completedItems < totalItems) {
      status = 'in_progress';
    } else if (completedItems === totalItems) {
      status = 'completed';
    }
    
    // Update employee record
    await db
      .update(employees)
      .set({
        onboardingProgress: progressPercentage,
        onboardingStatus: status,
        updatedAt: new Date()
      })
      .where(eq(employees.id, employeeId));
  }

  async getOnboardingChecklistItem(id: number): Promise<OnboardingChecklist | undefined> {
    const [item] = await db.select().from(onboardingChecklists).where(eq(onboardingChecklists.id, id));
    return item;
  }

  // Document operations
  async getDocuments(filters?: { uploadedBy?: string; relatedTo?: string; relatedType?: string }): Promise<(Document & { uploader: User })[]> {
    const conditions = [];

    if (filters?.uploadedBy) {
      conditions.push(eq(documents.uploadedBy, filters.uploadedBy));
    }
    if (filters?.relatedTo) {
      conditions.push(eq(documents.relatedTo, filters.relatedTo));
    }
    if (filters?.relatedType) {
      conditions.push(eq(documents.relatedType, filters.relatedType));
    }

    const query = db
      .select()
      .from(documents)
      .leftJoin(users, eq(documents.uploadedBy, users.username))
      .orderBy(desc(documents.createdAt));

    const result = conditions.length > 0 
      ? await query.where(and(...conditions))
      : await query;

    return result.map(row => ({ ...row.documents, uploader: row.users }));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set(document)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Dashboard operations
  async getDashboardStats(userId: number): Promise<{
    totalEmployees: number;
    activeOnboarding: number;
    openTasks: number;
    pendingApprovals: number;
    complianceRate: number;
  }> {
    // Simple implementation for now
    const totalEmployees = await db.select().from(employees);
    const openTasks = await db.select().from(tasks).where(eq(tasks.status, 'pending'));
    
    return {
      totalEmployees: totalEmployees.length,
      activeOnboarding: 0,
      openTasks: openTasks.length,
      pendingApprovals: 0,
      complianceRate: 95,
    };
  }

  async getRecentActivities(userId: string, limit = 10): Promise<any[]> {
    const activities: any[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      console.log('Fetching activities with date threshold:', thirtyDaysAgo);
      
      // Get recent employee registrations (last 30 days) - simplified query without join
      const recentEmployees = await db
        .select()
        .from(employees)
        .where(gte(employees.createdAt, thirtyDaysAgo))
        .orderBy(desc(employees.createdAt))
        .limit(5);
        
      console.log('Found recent employees:', recentEmployees.length);
        
      // Get user details separately for each employee
      for (const emp of recentEmployees) {
        const [user] = await db.select().from(users).where(eq(users.id, emp.userId));
        if (user) {
          activities.push({
            id: `emp-${emp.id}`,
            type: 'employee_added',
            title: 'New Employee Added',
            description: `${user.firstName} ${user.lastName} joined as ${user.role}`,
            timestamp: emp.createdAt,
            user: {
              name: `${user.firstName} ${user.lastName}`,
              role: user.role
            },
            metadata: {
              department: user.department,
              position: user.position
            }
          });
        }
      }



      // Get recent registration requests (last 30 days)
      const recentRequests = await db
        .select()
        .from(registrationRequests)
        .where(gte(registrationRequests.createdAt, thirtyDaysAgo))
        .orderBy(desc(registrationRequests.createdAt))
        .limit(3);

      recentRequests.forEach(req => {
        activities.push({
          id: `reg-${req.id}`,
          type: 'registration_request',
          title: 'New Registration Request',
          description: `${req.firstName} ${req.lastName} requested access as ${req.requestedRole}`,
          timestamp: req.createdAt,
          user: {
            name: `${req.firstName} ${req.lastName}`,
            email: req.email
          },
          metadata: {
            status: req.status,
            requestedRole: req.requestedRole
          }
        });
      });

      // Sort all activities by timestamp (most recent first) and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return activities.slice(0, limit);

    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  async getPendingApprovals(userId: string): Promise<any[]> {
    const approvals: any[] = [];
    const userIdNum = parseInt(userId);

    try {
      // Get current user to check role and permissions
      const currentUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1);

      if (currentUser.length === 0) {
        return [];
      }

      const user = currentUser[0];
      const userRole = user.role;

      // Only HR admins and branch managers can see registration approval requests
      if (userRole === 'hr_admin' || userRole === 'branch_manager') {
        // Get pending registration requests
        const pendingRequests = await db
          .select()
          .from(registrationRequests)
          .where(eq(registrationRequests.status, 'pending'))
          .orderBy(desc(registrationRequests.createdAt))
          .limit(5);

        pendingRequests.forEach(req => {
          approvals.push({
            id: `reg-${req.id}`,
            type: 'registration_approval',
            title: 'Registration Request',
            description: `${req.firstName} ${req.lastName} wants to join as ${req.requestedRole}`,
            timestamp: req.createdAt,
            requestor: {
              name: `${req.firstName} ${req.lastName}`,
              email: req.email
            },
            metadata: {
              requestedRole: req.requestedRole,
              requestedDepartment: req.requestedDepartment,
              position: req.position
            },
            actions: ['approve', 'reject']
          });
        });
      }

      // Onboarding notifications filtering based on user role and relationship
      if (userRole === 'hr_admin' || userRole === 'branch_manager') {
        // HR and managers can see all pending onboarding items
        const pendingOnboarding = await db
          .select({
            checklist: onboardingChecklists,
            employee: employees,
            user: users
          })
          .from(onboardingChecklists)
          .leftJoin(employees, eq(onboardingChecklists.employeeId, employees.id))
          .leftJoin(users, eq(employees.userId, users.id))
          .where(eq(onboardingChecklists.isCompleted, false))
          .orderBy(desc(onboardingChecklists.createdAt))
          .limit(3);

        pendingOnboarding.forEach(item => {
          if (item.user) {
            approvals.push({
              id: `onboard-${item.checklist.id}`,
              type: 'onboarding_approval',
              title: 'Onboarding Review',
              description: `${item.user.firstName} ${item.user.lastName} needs onboarding review for "${item.checklist.itemTitle}"`,
              timestamp: item.checklist.createdAt,
              requestor: {
                name: `${item.user.firstName} ${item.user.lastName}`,
                role: item.user.role
              },
              metadata: {
                task: item.checklist.itemTitle,
                description: item.checklist.description
              },
              actions: ['complete', 'review']
            });
          }
        });
      } else if (userRole === 'team_lead') {
        // Team leads can see onboarding items for their team members only
        const pendingOnboarding = await db
          .select({
            checklist: onboardingChecklists,
            employee: employees,
            user: users
          })
          .from(onboardingChecklists)
          .leftJoin(employees, eq(onboardingChecklists.employeeId, employees.id))
          .leftJoin(users, eq(employees.userId, users.id))
          .where(
            and(
              eq(onboardingChecklists.isCompleted, false),
              eq(employees.reportingManager, user.username) // Team lead manages this employee
            )
          )
          .orderBy(desc(onboardingChecklists.createdAt))
          .limit(3);

        pendingOnboarding.forEach(item => {
          if (item.user) {
            approvals.push({
              id: `onboard-${item.checklist.id}`,
              type: 'onboarding_approval',
              title: 'Onboarding Review',
              description: `${item.user.firstName} ${item.user.lastName} needs onboarding review for "${item.checklist.itemTitle}"`,
              timestamp: item.checklist.createdAt,
              requestor: {
                name: `${item.user.firstName} ${item.user.lastName}`,
                role: item.user.role
              },
              metadata: {
                task: item.checklist.itemTitle,
                description: item.checklist.description
              },
              actions: ['complete', 'review']
            });
          }
        });
      } else {
        // Regular employees can only see their own onboarding items
        const pendingOnboarding = await db
          .select({
            checklist: onboardingChecklists,
            employee: employees,
            user: users
          })
          .from(onboardingChecklists)
          .leftJoin(employees, eq(onboardingChecklists.employeeId, employees.id))
          .leftJoin(users, eq(employees.userId, users.id))
          .where(
            and(
              eq(onboardingChecklists.isCompleted, false),
              eq(users.id, userIdNum) // Only their own onboarding items
            )
          )
          .orderBy(desc(onboardingChecklists.createdAt))
          .limit(3);

        pendingOnboarding.forEach(item => {
          if (item.user) {
            approvals.push({
              id: `onboard-${item.checklist.id}`,
              type: 'onboarding_task',
              title: 'Onboarding Task',
              description: `Complete onboarding task: "${item.checklist.itemTitle}"`,
              timestamp: item.checklist.createdAt,
              requestor: {
                name: 'You',
                role: item.user.role
              },
              metadata: {
                task: item.checklist.itemTitle,
                description: item.checklist.description
              },
              actions: ['mark_complete']
            });
          }
        });
      }

      return approvals;

    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  }

  // Psychometric test operations
  async getPsychometricTests(): Promise<PsychometricTest[]> {
    return await db.select().from(psychometricTests).orderBy(desc(psychometricTests.createdAt));
  }

  async getPsychometricTest(id: number): Promise<PsychometricTest | undefined> {
    const [test] = await db.select().from(psychometricTests).where(eq(psychometricTests.id, id));
    return test;
  }

  async createPsychometricTest(test: InsertPsychometricTest): Promise<PsychometricTest> {
    const [newTest] = await db.insert(psychometricTests).values(test).returning();
    return newTest;
  }

  async updatePsychometricTest(id: number, test: Partial<InsertPsychometricTest>): Promise<PsychometricTest> {
    const [updatedTest] = await db
      .update(psychometricTests)
      .set({ ...test, updatedAt: new Date() })
      .where(eq(psychometricTests.id, id))
      .returning();
    return updatedTest;
  }

  async deletePsychometricTest(id: number): Promise<void> {
    await db.delete(psychometricTests).where(eq(psychometricTests.id, id));
  }

  async getPsychometricQuestions(testId: number): Promise<any[]> {
    try {
      // Use pool directly for raw SQL since schema might not match
      const result = await pool.query(`
        SELECT 
          id,
          test_id as "testId",
          question_text as "questionText", 
          question_type as "questionType",
          options,
          correct_answer as "correctAnswer",
          category,
          "order"
        FROM psychometric_questions 
        WHERE test_id = $1 
        ORDER BY "order" ASC
      `, [testId]);

      return result.rows.map((question: any) => ({
        ...question,
        options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
      }));
    } catch (error) {
      console.error('Error fetching psychometric questions:', error);
      return [];
    }
  }

  async createPsychometricQuestion(question: InsertPsychometricQuestion): Promise<PsychometricQuestion> {
    const [newQuestion] = await db.insert(psychometricQuestions).values(question).returning();
    return newQuestion;
  }

  async updatePsychometricQuestion(id: number, question: Partial<InsertPsychometricQuestion>): Promise<PsychometricQuestion> {
    const [updatedQuestion] = await db
      .update(psychometricQuestions)
      .set(question)
      .where(eq(psychometricQuestions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deletePsychometricQuestion(id: number): Promise<void> {
    await db.delete(psychometricQuestions).where(eq(psychometricQuestions.id, id));
  }

  async getPsychometricTestAttempts(filters?: { testId?: number; candidateEmail?: string }): Promise<PsychometricTestAttempt[]> {
    const conditions = [];

    if (filters?.testId) {
      conditions.push(eq(psychometricTestAttempts.testId, filters.testId));
    }
    if (filters?.candidateEmail) {
      conditions.push(eq(psychometricTestAttempts.candidateEmail, filters.candidateEmail));
    }

    return await db
      .select()
      .from(psychometricTestAttempts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(psychometricTestAttempts.startedAt));
  }

  async getAllPsychometricTestAttempts(): Promise<any[]> {
    const attempts = await db
      .select()
      .from(psychometricTestAttempts)
      .innerJoin(psychometricTests, eq(psychometricTestAttempts.testId, psychometricTests.id))
      .orderBy(desc(psychometricTestAttempts.completedAt));
    
    return attempts.map(row => ({
      ...row.psychometric_test_attempts,
      test: row.psychometric_tests
    }));
  }

  async getPsychometricTestAttempt(id: number): Promise<PsychometricTestAttempt | undefined> {
    const [attempt] = await db.select().from(psychometricTestAttempts).where(eq(psychometricTestAttempts.id, id));
    return attempt;
  }

  async createPsychometricTestAttempt(attempt: InsertPsychometricTestAttempt): Promise<PsychometricTestAttempt> {
    // Calculate scores and generate results
    const processedAttempt = await this.processPsychometricTestResults(attempt);
    const [newAttempt] = await db.insert(psychometricTestAttempts).values(processedAttempt).returning();
    return newAttempt;
  }

  async updatePsychometricTestAttempt(id: number, attempt: Partial<InsertPsychometricTestAttempt>): Promise<PsychometricTestAttempt> {
    const [updatedAttempt] = await db
      .update(psychometricTestAttempts)
      .set(attempt)
      .where(eq(psychometricTestAttempts.id, id))
      .returning();
    return updatedAttempt;
  }

  private async processPsychometricTestResults(attempt: InsertPsychometricTestAttempt): Promise<InsertPsychometricTestAttempt> {
    const test = await this.getPsychometricTest(attempt.testId);
    const questions = await this.getPsychometricQuestions(attempt.testId);
    
    if (!test || !questions.length) {
      return attempt;
    }

    let totalScore = 0;
    const categoryScores: Record<string, { total: number; count: number }> = {};
    const results: any = {};

    // Process responses based on test type
    if (Array.isArray(attempt.responses)) {
      for (const response of attempt.responses) {
        const question = questions.find(q => q.id === response.questionId);
        if (!question) continue;

        let score = 0;
        
        // Calculate score based on question type
        if (question.questionType === 'scale') {
          score = parseInt(response.answer) || 0;
        } else if (question.questionType === 'yes_no') {
          score = response.answer === 'yes' ? 5 : 1;
        } else if (question.questionType === 'multiple_choice' && question.correctAnswer) {
          score = response.answer === question.correctAnswer ? 5 : 0;
        }

        totalScore += score;

        // Track category scores for personality/trait analysis
        if (question.category) {
          if (!categoryScores[question.category]) {
            categoryScores[question.category] = { total: 0, count: 0 };
          }
          categoryScores[question.category].total += score;
          categoryScores[question.category].count += 1;
        }
      }
    }

    // Calculate percentage score
    const maxPossibleScore = questions.length * 5; // Assuming max score of 5 per question
    const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);

    // Generate personality traits or cognitive scores based on test type
    if (test.testType === 'personality') {
      results.personalityTraits = {};
      for (const [category, scores] of Object.entries(categoryScores)) {
        results.personalityTraits[category] = Math.round((scores.total / (scores.count * 5)) * 100);
      }
    } else if (test.testType === 'cognitive') {
      results.cognitiveScores = {};
      for (const [category, scores] of Object.entries(categoryScores)) {
        results.cognitiveScores[category] = Math.round((scores.total / (scores.count * 5)) * 100);
      }
    }

    // Generate recommendations based on scores
    results.recommendations = this.generateRecommendations(test.testType, percentageScore, results);

    return {
      ...attempt,
      totalScore,
      percentageScore,
      results,
    };
  }

  private generateRecommendations(testType: string, percentageScore: number, results: any): string[] {
    const recommendations: string[] = [];

    if (testType === 'personality') {
      if (percentageScore >= 80) {
        recommendations.push("Excellent personality fit for the role with strong interpersonal skills.");
        recommendations.push("Consider for leadership development opportunities.");
      } else if (percentageScore >= 60) {
        recommendations.push("Good personality match with potential for growth.");
        recommendations.push("Recommend mentoring and skill development programs.");
      } else {
        recommendations.push("Consider additional personality development training.");
        recommendations.push("May benefit from team-based collaboration exercises.");
      }
    } else if (testType === 'cognitive') {
      if (percentageScore >= 80) {
        recommendations.push("Strong cognitive abilities suitable for complex problem-solving roles.");
        recommendations.push("Consider for analytical and strategic positions.");
      } else if (percentageScore >= 60) {
        recommendations.push("Good cognitive performance with room for improvement.");
        recommendations.push("Recommend continued learning and development opportunities.");
      } else {
        recommendations.push("May benefit from additional training in analytical thinking.");
        recommendations.push("Consider roles that leverage existing strengths.");
      }
    }

    return recommendations;
  }

  // Department management methods
  async getDepartments(): Promise<(Department & { manager?: User })[]> {
    const result = await db
      .select({
        id: departments.id,
        code: departments.code,
        name: departments.name,
        description: departments.description,
        managerId: departments.managerId,
        budgetAllocated: departments.budgetAllocated,
        headcount: departments.headcount,
        location: departments.location,
        isActive: departments.isActive,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
        manager: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(departments)
      .leftJoin(users, eq(departments.managerId, users.id))
      .where(eq(departments.isActive, true))
      .orderBy(departments.name);

    return result.map(row => ({
      ...row,
      manager: row.manager && row.manager.id ? row.manager as User : undefined
    }));
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const result = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);
    
    return result[0];
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const result = await db.insert(departments).values(department).returning();
    return result[0];
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department> {
    const result = await db
      .update(departments)
      .set({ ...department, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Department not found");
    }
    
    return result[0];
  }

  async deleteDepartment(id: number): Promise<void> {
    await db
      .update(departments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(departments.id, id));
  }

  async getEmployeesByDepartment(departmentCode: string): Promise<(Employee & { user: User })[]> {
    const result = await db
      .select({
        id: employees.id,
        userId: employees.userId,
        employeeId: employees.employeeId,
        phoneNumber: employees.phoneNumber,
        address: employees.address,
        emergencyContact: employees.emergencyContact,
        onboardingStatus: employees.onboardingStatus,
        onboardingProgress: employees.onboardingProgress,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          status: users.status,
          department: users.department,
          position: users.position,
          managerId: users.managerId,
          startDate: users.startDate,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .where(eq(users.department, departmentCode))
      .orderBy(users.firstName, users.lastName);

    return result.map(row => ({
      ...row,
      user: row.user as User,
    }));
  }

  // Employee submissions operations (two-phase onboarding)
  async getEmployeeSubmissions(): Promise<EmployeeSubmission[]> {
    return await db.select().from(employeeSubmissions).orderBy(desc(employeeSubmissions.submittedAt));
  }

  async getEmployeeSubmission(id: number): Promise<EmployeeSubmission | undefined> {
    const [submission] = await db.select().from(employeeSubmissions).where(eq(employeeSubmissions.id, id));
    return submission;
  }

  async createEmployeeSubmission(submission: InsertEmployeeSubmission): Promise<EmployeeSubmission> {
    const [newSubmission] = await db.insert(employeeSubmissions).values(submission).returning();
    return newSubmission;
  }

  async updateEmployeeSubmission(id: number, submission: Partial<InsertEmployeeSubmission>): Promise<EmployeeSubmission> {
    const [updatedSubmission] = await db
      .update(employeeSubmissions)
      .set({ ...submission, updatedAt: new Date() })
      .where(eq(employeeSubmissions.id, id))
      .returning();
    return updatedSubmission;
  }

  async updateHRStep(submissionId: number, stepId: string, isCompleted: boolean, notes?: string): Promise<EmployeeSubmission> {
    // Get current submission
    const submission = await this.getEmployeeSubmission(submissionId);
    if (!submission) {
      throw new Error('Employee submission not found');
    }

    // Update steps completed array
    const currentSteps = submission.hrStepsCompleted as string[] || [];
    const currentNotes = submission.hrStepsNotes as Record<string, string> || {};
    
    let updatedSteps: string[];
    if (isCompleted && !currentSteps.includes(stepId)) {
      updatedSteps = [...currentSteps, stepId];
    } else if (!isCompleted && currentSteps.includes(stepId)) {
      updatedSteps = currentSteps.filter(id => id !== stepId);
    } else {
      updatedSteps = currentSteps;
    }

    // Update notes
    const updatedNotes = { ...currentNotes };
    if (notes) {
      updatedNotes[stepId] = notes;
    }

    // Update submission
    return await this.updateEmployeeSubmission(submissionId, {
      hrStepsCompleted: updatedSteps,
      hrStepsNotes: updatedNotes,
      status: updatedSteps.length >= 15 ? 'completed' : 'in_progress' // 15 is total HR steps
    });
  }

  // Project management operations
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProjects(): Promise<(Project & { projectManager: User; memberCount: number })[]> {
    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        projectManagerId: projects.projectManagerId,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        budget: projects.budget,
        priority: projects.priority,
        clientName: projects.clientName,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        projectManager: users,
        memberCount: count(projectMembers.id).as('memberCount')
      })
      .from(projects)
      .innerJoin(users, eq(projects.projectManagerId, users.id))
      .leftJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .groupBy(projects.id, users.id)
      .orderBy(desc(projects.createdAt));

    return result.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      projectManagerId: row.projectManagerId,
      status: row.status,
      startDate: row.startDate,
      endDate: row.endDate,
      budget: row.budget,
      priority: row.priority,
      clientName: row.clientName,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      projectManager: row.projectManager,
      managers: [], // Will be populated by frontend if needed
      memberCount: Number(row.memberCount) || 0
    }));
  }

  // Get projects visible to a specific user based on their role and assignments
  async getProjectsForUser(userId: number, userRole: string): Promise<(Project & { projectManager: User; memberCount: number })[]> {
    // For HR admins, branch managers, and team leads - show all projects
    if (['hr_admin', 'branch_manager', 'team_lead'].includes(userRole)) {
      return this.getProjects();
    }

    // For employees - only show projects where they are:
    // 1. Project manager
    // 2. Project member
    // 3. Assigned to project tasks
    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        projectManagerId: projects.projectManagerId,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        budget: projects.budget,
        priority: projects.priority,
        clientName: projects.clientName,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        projectManager: users,
        memberCount: count(projectMembers.id).as('memberCount')
      })
      .from(projects)
      .innerJoin(users, eq(projects.projectManagerId, users.id))
      .leftJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(
        or(
          // User is the project manager
          eq(projects.projectManagerId, userId),
          // User is a project member
          exists(
            db.select().from(projectMembers)
              .where(
                and(
                  eq(projectMembers.projectId, projects.id),
                  eq(projectMembers.userId, userId)
                )
              )
          ),
          // User is assigned to project tasks
          exists(
            db.select().from(projectTasks)
              .where(
                and(
                  eq(projectTasks.projectId, projects.id),
                  eq(projectTasks.assignedTo, userId)
                )
              )
          )
        )
      )
      .groupBy(projects.id, users.id)
      .orderBy(desc(projects.createdAt));

    return result.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      projectManagerId: row.projectManagerId,
      status: row.status,
      startDate: row.startDate,
      endDate: row.endDate,
      budget: row.budget,
      priority: row.priority,
      clientName: row.clientName,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      projectManager: row.projectManager,
      managers: [], // Will be populated by frontend if needed
      memberCount: Number(row.memberCount) || 0
    }));
  }

  async getProject(id: number): Promise<(Project & { projectManager?: User; managers: (ProjectMember & { user: User })[]; members: (ProjectMember & { user: User })[] }) | undefined> {
    // Get the basic project info
    const [project] = await db
      .select()
      .from(projects)
      .leftJoin(users, eq(projects.projectManagerId, users.id))
      .where(eq(projects.id, id));

    if (!project) return undefined;

    // Get all project members (including managers)
    const allMembers = await db
      .select()
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, id));

    const membersWithDetails = allMembers.map(m => ({ 
      ...m.project_members, 
      user: m.users,
      joinedAt: m.project_members.createdAt // Use createdAt as joinedAt for compatibility
    }));

    // Separate managers from regular members
    const managers = membersWithDetails.filter(m => m.role === 'manager');
    const members = membersWithDetails.filter(m => m.role !== 'manager');

    return {
      ...project.projects,
      projectManager: project.users || undefined, // Legacy single manager (optional)
      managers, // Multiple managers from projectMembers table
      members // Regular team members
    };
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projectTasks).where(eq(projectTasks.projectId, id));
    await db.delete(projectMembers).where(eq(projectMembers.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Helper method to automatically update project status based on task activity
  private async updateProjectStatusBasedOnTasks(projectId: number): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) return;

      const tasks = await this.getProjectTasks(projectId);
      
      if (tasks.length === 0) {
        // No tasks = planning phase
        if (project.status !== 'planning') {
          await this.updateProject(projectId, { status: 'planning' });
        }
      } else {
        const activeTasks = tasks.filter(task => task.status === 'in_progress');
        const completedTasks = tasks.filter(task => task.status === 'completed');
        
        if (completedTasks.length === tasks.length && tasks.length > 0) {
          // All tasks completed = project completed
          if (project.status !== 'completed') {
            await this.updateProject(projectId, { status: 'completed' });
          }
        } else {
          // Has tasks (pending, active, or completed) = project is active
          if (project.status === 'planning') {
            await this.updateProject(projectId, { status: 'active' });
          }
        }
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  }

  // Project member operations
  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const [newMember] = await db.insert(projectMembers).values(member).returning();
    return newMember;
  }

  async removeProjectMember(projectId: number, userId: number): Promise<void> {
    await db.delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  }

  async getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]> {
    const result = await db
      .select()
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));

    return result.map(row => ({ ...row.project_members, user: row.users }));
  }

  async getProjectManagers(projectId: number): Promise<(ProjectMember & { user: User })[]> {
    const result = await db
      .select()
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.role, 'manager')));

    return result.map(row => ({ ...row.project_members, user: row.users }));
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(projects.createdAt);
  }

  async getUserProjects(userId: number): Promise<(Project & { projectManager: User })[]> {
    const managedProjects = await db
      .select()
      .from(projects)
      .innerJoin(users, eq(projects.projectManagerId, users.id))
      .where(eq(projects.projectManagerId, userId));

    const memberProjects = await db
      .select()
      .from(projects)
      .innerJoin(users, eq(projects.projectManagerId, users.id))
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, userId));

    const allProjects = [...managedProjects, ...memberProjects];
    const uniqueProjects = allProjects.reduce((acc, curr) => {
      const existingProject = acc.find(p => p.projects.id === curr.projects.id);
      if (!existingProject) {
        acc.push(curr);
      }
      return acc;
    }, [] as typeof allProjects);

    return uniqueProjects.map(row => ({ ...row.projects, projectManager: row.users }));
  }

  // Project task operations
  async createProjectTask(task: InsertProjectTask): Promise<ProjectTask> {
    const [newTask] = await db.insert(projectTasks).values(task).returning();
    
    // Auto-update project status when first task is created
    if (newTask) {
      await this.updateProjectStatusBasedOnTasks(newTask.projectId);
    }
    
    return newTask;
  }

  async getProjectTasks(projectId: number): Promise<(ProjectTask & { assignedToUser?: User; assignedByUser?: User })[]> {
    const result = await db
      .select({
        task: projectTasks,
        assignedToUser: users,
        assignedByUser: sql`NULL`.as('assigned_by_user')
      })
      .from(projectTasks)
      .leftJoin(users, eq(projectTasks.assignedTo, users.id))
      .where(eq(projectTasks.projectId, projectId))
      .orderBy(projectTasks.createdAt);

    const mappedTasks = result.map(row => ({
      ...row.task,
      assignedToUser: row.assignedToUser || undefined,
      assignedByUser: undefined
    }));
    

    
    return mappedTasks;
  }

  async getProjectTask(id: number): Promise<ProjectTask | undefined> {
    const [task] = await db
      .select()
      .from(projectTasks)
      .where(eq(projectTasks.id, id));
    return task;
  }

  async updateProjectTask(id: number, updates: Partial<InsertProjectTask>): Promise<ProjectTask> {
    const [updatedTask] = await db
      .update(projectTasks)
      .set(updates)
      .where(eq(projectTasks.id, id))
      .returning();

    // Auto-update project status based on task activity
    if (updatedTask) {
      await this.updateProjectStatusBasedOnTasks(updatedTask.projectId);
    }

    return updatedTask;
  }

  async deleteProjectTask(id: number): Promise<void> {
    await db.delete(projectTasks).where(eq(projectTasks.id, id));
  }

  async getUserProjectTasks(userId: number): Promise<(ProjectTask & { project: Project; assignedByUser?: User })[]> {
    const result = await db
      .select()
      .from(projectTasks)
      .innerJoin(projects, eq(projectTasks.projectId, projects.id))
      .leftJoin(users, eq(projectTasks.assignedBy, users.id))
      .where(eq(projectTasks.assignedTo, userId))
      .orderBy(desc(projectTasks.createdAt));

    return result.map(row => ({ 
      ...row.project_tasks, 
      project: row.projects,
      assignedByUser: row.users || undefined
    }));
  }

  // Project file operations
  async getProjectFiles(projectId: number): Promise<(ProjectFile & { uploader: User })[]> {
    const result = await db
      .select()
      .from(projectFiles)
      .innerJoin(users, eq(projectFiles.uploadedBy, users.id))
      .where(eq(projectFiles.projectId, projectId))
      .orderBy(projectFiles.uploadedAt);

    return result.map(row => ({ ...row.project_files, uploader: row.users }));
  }

  async createProjectFile(file: InsertProjectFile): Promise<ProjectFile> {
    const [newFile] = await db.insert(projectFiles).values(file).returning();
    return newFile;
  }

  async updateProjectFile(id: number, file: Partial<InsertProjectFile>): Promise<ProjectFile> {
    const [updatedFile] = await db
      .update(projectFiles)
      .set(file)
      .where(eq(projectFiles.id, id))
      .returning();
    return updatedFile;
  }

  async deleteProjectFile(id: number): Promise<void> {
    await db.delete(projectFiles).where(eq(projectFiles.id, id));
  }

  // Project message operations
  async createProjectMessage(message: InsertProjectMessage): Promise<ProjectMessage> {
    const [newMessage] = await db.insert(projectMessages).values(message).returning();
    return newMessage;
  }

  async getProjectMessages(projectId: number): Promise<(ProjectMessage & { sender: User })[]> {
    const result = await db
      .select()
      .from(projectMessages)
      .innerJoin(users, eq(projectMessages.senderId, users.id))
      .where(eq(projectMessages.projectId, projectId))
      .orderBy(projectMessages.createdAt);

    return result.map(row => ({ ...row.project_messages, sender: row.users }));
  }

  // Project notes operations
  async createProjectNote(note: any): Promise<any> {
    const noteData = {
      projectId: note.projectId,
      authorId: note.authorId,
      type: note.type,
      title: note.title,
      content: note.content,
      noteDate: new Date(), // Automatically add current date
      isPrivate: note.isPrivate || false
    };
    
    const [newNote] = await db.insert(projectNotes).values(noteData).returning();
    return newNote;
  }

  async getProjectNotes(projectId: number): Promise<(ProjectNote & { author: User })[]> {
    const result = await db
      .select({
        id: projectNotes.id,
        projectId: projectNotes.projectId,
        authorId: projectNotes.authorId,
        type: projectNotes.type,
        title: projectNotes.title,
        content: projectNotes.content,
        noteDate: projectNotes.noteDate,
        isPrivate: projectNotes.isPrivate,
        createdAt: projectNotes.createdAt,
        updatedAt: projectNotes.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role
        }
      })
      .from(projectNotes)
      .innerJoin(users, eq(projectNotes.authorId, users.id))
      .where(eq(projectNotes.projectId, projectId))
      .orderBy(desc(projectNotes.createdAt));

    return result as any;
  }

  // Project overview operations
  async getProjectOverview(projectId: number): Promise<ProjectOverview | undefined> {
    const [overview] = await db
      .select()
      .from(projectOverview)
      .where(eq(projectOverview.projectId, projectId));
    return overview;
  }

  async createProjectOverview(overview: InsertProjectOverview): Promise<ProjectOverview> {
    const [newOverview] = await db.insert(projectOverview).values(overview).returning();
    return newOverview;
  }

  async updateProjectOverview(projectId: number, overview: Partial<InsertProjectOverview>): Promise<ProjectOverview> {
    const [updatedOverview] = await db
      .update(projectOverview)
      .set({ ...overview, lastUpdated: new Date() })
      .where(eq(projectOverview.projectId, projectId))
      .returning();
    return updatedOverview;
  }

  async upsertProjectOverview(projectId: number, overview: Partial<InsertProjectOverview>): Promise<ProjectOverview> {
    // Try to get existing overview
    const existing = await this.getProjectOverview(projectId);
    
    if (existing) {
      // Update existing overview
      return this.updateProjectOverview(projectId, overview);
    } else {
      // Create new overview
      return this.createProjectOverview({
        projectId,
        ...overview,
        lastUpdated: new Date()
      } as InsertProjectOverview);
    }
  }

  // Registration request operations
  async getRegistrationRequests(filters?: { status?: string }): Promise<(RegistrationRequest & { reviewer?: User })[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(registrationRequests.status, filters.status));
    }

    const query = db
      .select()
      .from(registrationRequests)
      .leftJoin(users, eq(registrationRequests.reviewedBy, users.id))
      .orderBy(desc(registrationRequests.createdAt));

    const result = conditions.length > 0 
      ? await query.where(and(...conditions))
      : await query;
      
    return result.map(row => ({
      ...row.registration_requests,
      reviewer: row.users || undefined
    }));
  }

  async getRegistrationRequest(id: number): Promise<(RegistrationRequest & { onboardingToken?: string }) | undefined> {
    const [request] = await db.select().from(registrationRequests).where(eq(registrationRequests.id, id));
    
    if (!request) return undefined;
    
    // If the request is approved, try to get the onboarding token from the corresponding user
    if (request.status === 'approved') {
      const [user] = await db
        .select({ onboardingToken: users.onboardingToken })
        .from(users)
        .where(eq(users.email, request.email));
      
      if (user?.onboardingToken) {
        return { ...request, onboardingToken: user.onboardingToken };
      }
    }
    
    return request;
  }

  async getRegistrationRequestByEmail(email: string): Promise<RegistrationRequest | undefined> {
    const [request] = await db.select().from(registrationRequests).where(eq(registrationRequests.email, email));
    return request;
  }

  async createRegistrationRequest(request: InsertRegistrationRequest): Promise<RegistrationRequest> {
    const [newRequest] = await db.insert(registrationRequests).values(request).returning();
    return newRequest;
  }

  async updateRegistrationRequest(id: number, request: Partial<InsertRegistrationRequest>): Promise<RegistrationRequest> {
    const [updatedRequest] = await db
      .update(registrationRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(registrationRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async approveRegistrationRequest(id: number, reviewerId: number, notes?: string): Promise<User> {
    // Get the registration request
    const request = await this.getRegistrationRequest(id);
    if (!request) {
      throw new Error('Registration request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Registration request is not pending');
    }

    // Generate onboarding token
    const onboardingToken = `onb_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Create the user account with active status (they can now log in)
    const newUser = await this.createUser({
      username: request.username,
      email: request.email,
      password: request.password, // Already hashed
      firstName: request.firstName,
      lastName: request.lastName,
      role: request.requestedRole || 'employee',
      status: 'active', // Account is now active for login
      department: request.requestedDepartment,
      position: request.position,
      profileImageUrl: null,
      managerId: null,
      startDate: new Date(),
      onboardingToken: onboardingToken,
      onboardingStatus: 'pending',
      onboardingProgress: 0,
      accountEnabled: true, // Account enabled for login
    });

    // Create default onboarding checklist items
    await this.createDefaultOnboardingChecklist(newUser.id);

    // Update the registration request
    await this.updateRegistrationRequest(id, {
      status: 'approved',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    });

    // Get reviewer info for notification
    const reviewer = await this.getUser(reviewerId);
    if (reviewer) {
      // Send HR notification about user approval
      HRNotifications.userApproved(request, reviewer);
    }

    // Send welcome email to the new employee with login credentials
    await this.sendWelcomeEmail(newUser, request);

    return newUser;
  }

  // Create default onboarding checklist for new employees
  async createDefaultOnboardingChecklist(employeeId: number): Promise<void> {
    const defaultItems = [
      {
        employeeId,
        itemTitle: 'Complete Employee Handbook Review',
        description: 'Read and acknowledge the company employee handbook and policies',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        requiresDocument: false,
        requiresPsychometricTest: false,
        isCompleted: false,
        order: 1,
      },
      {
        employeeId,
        itemTitle: 'Submit Required Documents',
        description: 'Upload government-issued photo ID, proof of eligibility to work, and signed contract',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        requiresDocument: true,
        requiresPsychometricTest: false,
        isCompleted: false,
        order: 2,
      },
      {
        employeeId,
        itemTitle: 'Set Up Direct Deposit',
        description: 'Provide banking information for payroll direct deposit setup',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        requiresDocument: true,
        requiresPsychometricTest: false,
        isCompleted: false,
        order: 3,
      },
      {
        employeeId,
        itemTitle: 'Complete Safety Training',
        description: 'Attend mandatory workplace safety orientation and training session',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        requiresDocument: false,
        requiresPsychometricTest: false,
        isCompleted: false,
        order: 4,
      },
      {
        employeeId,
        itemTitle: 'Complete Personality Assessment',
        description: 'Take the personality and cultural fit assessment test',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        requiresDocument: false,
        requiresPsychometricTest: true,
        isCompleted: false,
        order: 5,
      },
      {
        employeeId,
        itemTitle: 'Set Up IT Equipment',
        description: 'Collect laptop, phone, and other IT equipment, complete setup checklist',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        requiresDocument: false,
        requiresPsychometricTest: false,
        isCompleted: false,
        order: 6,
      }
    ];

    // Insert all checklist items
    for (const item of defaultItems) {
      await this.createOnboardingChecklist(item);
    }
  }

  async rejectRegistrationRequest(id: number, reviewerId: number, notes: string): Promise<RegistrationRequest> {
    return await this.updateRegistrationRequest(id, {
      status: 'rejected',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    });
  }

  // Send welcome email with login credentials
  async sendWelcomeEmail(user: User, originalRequest: RegistrationRequest): Promise<void> {
    try {
      // For development, just log to console
      if (process.env.NODE_ENV === 'development') {
        console.log('\n=== WELCOME EMAIL TO NEW EMPLOYEE ===');
        console.log(`To: ${user.email}`);
        console.log(`Subject: Welcome to Meeting Matters - Your Account is Ready!`);
        console.log(`
Dear ${user.firstName} ${user.lastName},

Congratulations! Your account has been approved and is now active.

Your Login Credentials:
- Username: ${user.username}
- Password: [Use your submitted password]
- Login URL: https://dcbf9f53-7203-4a66-bd9a-6c46b8611eaf-00-75ditd1qwvtw.janeway.replit.dev/auth

Next Steps:
1. Login to the system using the above credentials
2. Complete your onboarding checklist from your employee dashboard
3. Upload any required documents
4. Complete psychometric tests if assigned

Your onboarding checklist is waiting for you in your dashboard. Please complete all items by their due dates.

Welcome to the team!

Best regards,
HR Team - Meeting Matters
        `);
        console.log('========================================\n');
      }
      
      // Here you would send actual email in production
      // await sendEmail({...})
      
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }

  // Handbook Management Methods
  
  async getHandbooks(): Promise<any[]> {
    const result = await this.client.query(`
      SELECT * FROM company_handbooks 
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async createHandbook(handbookData: any): Promise<any> {
    const { title, description, content, version, createdBy } = handbookData;
    const result = await this.client.query(`
      INSERT INTO company_handbooks (title, description, content, version, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [title, description, content, version, createdBy]);
    return result.rows[0];
  }

  async updateHandbook(id: number, handbookData: any): Promise<any> {
    const { title, description, content, version } = handbookData;
    const result = await this.client.query(`
      UPDATE company_handbooks 
      SET title = $1, description = $2, content = $3, version = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [title, description, content, version, id]);
    return result.rows[0];
  }

  async deleteHandbook(id: number): Promise<void> {
    await this.client.query(`DELETE FROM company_handbooks WHERE id = $1`, [id]);
  }

  async getHandbookSections(handbookId: number): Promise<any[]> {
    const result = await this.client.query(`
      SELECT * FROM handbook_sections 
      WHERE handbook_id = $1 
      ORDER BY section_order, created_at
    `, [handbookId]);
    return result.rows;
  }

  async createHandbookSection(handbookId: number, sectionData: any): Promise<any> {
    const { title, content, estimatedReadingTime } = sectionData;
    const result = await this.client.query(`
      INSERT INTO handbook_sections (handbook_id, title, content, estimated_reading_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [handbookId, title, content, estimatedReadingTime]);
    return result.rows[0];
  }

  async getHandbookQuizQuestions(sectionId: number): Promise<any[]> {
    const result = await this.client.query(`
      SELECT * FROM handbook_quizzes 
      WHERE section_id = $1 
      ORDER BY created_at
    `, [sectionId]);
    return result.rows;
  }

  async createHandbookQuizQuestion(questionData: any): Promise<any> {
    const { 
      handbookId, sectionId, question, optionA, optionB, optionC, optionD, 
      correctAnswer, explanation 
    } = questionData;
    
    const result = await this.client.query(`
      INSERT INTO handbook_quizzes (
        handbook_id, section_id, question, option_a, option_b, option_c, option_d, 
        correct_answer, explanation
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      handbookId, sectionId, question, optionA, optionB, optionC, optionD, 
      correctAnswer, explanation
    ]);
    return result.rows[0];
  }

  async recordHandbookProgress(progressData: any): Promise<any> {
    const { employeeId, handbookId, sectionId } = progressData;
    const result = await this.client.query(`
      INSERT INTO employee_handbook_progress (employee_id, handbook_id, section_id, read_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (employee_id, section_id) 
      DO UPDATE SET read_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [employeeId, handbookId, sectionId]);
    return result.rows[0];
  }

  async submitHandbookQuiz(employeeId: number, sectionId: number, answers: Record<number, string>): Promise<any> {
    try {
      // Get quiz questions for this section
      const questionsResult = await this.client.query(`
        SELECT * FROM handbook_quizzes 
        WHERE section_id = $1
      `, [sectionId]);
      
      const questions = questionsResult.rows;
      let correctCount = 0;
      const totalQuestions = questions.length;

      // Check answers
      for (const question of questions) {
        const userAnswer = answers[question.id];
        if (userAnswer === question.correct_answer) {
          correctCount++;
        }
      }

      const score = Math.round((correctCount / totalQuestions) * 100);
      const passed = score >= 70; // 70% passing score

      // Update progress record
      await this.client.query(`
        UPDATE employee_handbook_progress 
        SET quiz_score = $1, quiz_attempts = quiz_attempts + 1, quiz_passed = $2
        WHERE employee_id = $3 AND section_id = $4
      `, [score, passed, employeeId, sectionId]);

      return { score, passed, correctCount, totalQuestions };
    } catch (error) {
      console.error('Error submitting handbook quiz:', error);
      throw error;
    }
  }

  // Team Meeting Management Methods
  
  async getTeamMeetings(): Promise<any[]> {
    const result = await this.client.query(`
      SELECT tm.*, 
             emp_user.first_name, emp_user.last_name, e.position,
             u.first_name as scheduled_by_first_name, u.last_name as scheduled_by_last_name
      FROM team_introduction_meetings tm
      LEFT JOIN employees e ON tm.employee_id = e.id
      LEFT JOIN users emp_user ON e.user_id = emp_user.id
      LEFT JOIN users u ON tm.scheduled_by = u.id
      ORDER BY tm.scheduled_date DESC
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      meetingTitle: row.meeting_title,
      meetingDescription: row.meeting_description,
      scheduledDate: row.scheduled_date,
      meetingLocation: row.meeting_location,
      meetingType: row.meeting_type,
      meetingLink: row.meeting_link,
      scheduledBy: row.scheduled_by,
      status: row.status,
      attendees: row.attendees || [],
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      employee: {
        id: row.employee_id,
        firstName: row.first_name,
        lastName: row.last_name,
        position: row.position
      },
      scheduledByUser: row.scheduled_by ? {
        firstName: row.scheduled_by_first_name,
        lastName: row.scheduled_by_last_name
      } : null
    }));
  }

  async getTeamMeetingForEmployee(employeeId: number): Promise<any> {
    const result = await this.client.query(`
      SELECT tm.*, 
             emp_user.first_name, emp_user.last_name, e.position
      FROM team_introduction_meetings tm
      LEFT JOIN employees e ON tm.employee_id = e.id
      LEFT JOIN users emp_user ON e.user_id = emp_user.id
      WHERE tm.employee_id = $1
      ORDER BY tm.scheduled_date DESC
      LIMIT 1
    `, [employeeId]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id,
      employeeId: row.employee_id,
      meetingTitle: row.meeting_title,
      meetingDescription: row.meeting_description,
      scheduledDate: row.scheduled_date,
      meetingLocation: row.meeting_location,
      meetingType: row.meeting_type,
      meetingLink: row.meeting_link,
      scheduledBy: row.scheduled_by,
      status: row.status,
      attendees: row.attendees || [],
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      employee: {
        id: row.employee_id,
        firstName: row.first_name,
        lastName: row.last_name,
        position: row.position
      }
    };
  }

  async createTeamMeeting(meetingData: any): Promise<any> {
    try {
      const {
        employeeId, meetingTitle, meetingDescription, scheduledDate,
        meetingLocation, meetingType, meetingLink, attendees, notes, scheduledBy
      } = meetingData;

      // Create the meeting
      const result = await this.client.query(`
        INSERT INTO team_introduction_meetings (
          employee_id, meeting_title, meeting_description, scheduled_date,
          meeting_location, meeting_type, meeting_link, scheduled_by,
          attendees, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        employeeId, meetingTitle, meetingDescription, scheduledDate,
        meetingLocation, meetingType, meetingLink, scheduledBy,
        attendees || [], notes
      ]);

      const meeting = result.rows[0];

      // Create notifications for all attendees
      await this.createMeetingNotifications(meeting.id, attendees, 'meeting_scheduled');

      // Add to employee's onboarding checklist if not exists
      await this.addTeamMeetingToOnboardingChecklist(employeeId, meeting.id);

      return meeting;
    } catch (error) {
      console.error('Error creating team meeting:', error);
      throw error;
    }
  }

  async updateTeamMeeting(id: number, updateData: any): Promise<any> {
    const {
      meetingTitle, meetingDescription, scheduledDate,
      meetingLocation, meetingType, meetingLink, attendees, notes
    } = updateData;

    const result = await this.client.query(`
      UPDATE team_introduction_meetings 
      SET meeting_title = $1, meeting_description = $2, scheduled_date = $3,
          meeting_location = $4, meeting_type = $5, meeting_link = $6,
          attendees = $7, notes = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [
      meetingTitle, meetingDescription, scheduledDate,
      meetingLocation, meetingType, meetingLink,
      attendees || [], notes, id
    ]);

    // Create notifications for rescheduled meeting
    if (attendees && attendees.length > 0) {
      await this.createMeetingNotifications(id, attendees, 'meeting_rescheduled');
    }

    return result.rows[0];
  }

  async completeTeamMeeting(id: number): Promise<any> {
    const result = await this.client.query(`
      UPDATE team_introduction_meetings 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    // Mark related onboarding checklist item as complete
    await this.completeTeamMeetingChecklistItem(id);

    return result.rows[0];
  }

  async confirmMeetingAttendance(meetingId: number, employeeId: number): Promise<any> {
    // Mark meeting as confirmed for this employee
    const result = await this.client.query(`
      UPDATE team_introduction_meetings 
      SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND employee_id = $2
      RETURNING *
    `, [meetingId, employeeId]);

    // Mark related onboarding checklist item as complete
    await this.completeTeamMeetingChecklistItem(meetingId);

    return result.rows[0];
  }

  async deleteTeamMeeting(id: number): Promise<void> {
    // Get meeting details before deletion
    const meetingResult = await this.client.query(`
      SELECT attendees FROM team_introduction_meetings WHERE id = $1
    `, [id]);

    if (meetingResult.rows.length > 0) {
      const attendees = meetingResult.rows[0].attendees || [];
      // Create cancellation notifications
      await this.createMeetingNotifications(id, attendees, 'meeting_cancelled');
    }

    await this.client.query(`DELETE FROM team_introduction_meetings WHERE id = $1`, [id]);
  }

  async createMeetingNotifications(meetingId: number, attendees: number[], type: string): Promise<void> {
    if (!attendees || attendees.length === 0) return;

    // Get meeting details for notification message
    const meetingResult = await this.client.query(`
      SELECT meeting_title, scheduled_date, tm.employee_id,
             emp_user.first_name, emp_user.last_name
      FROM team_introduction_meetings tm
      LEFT JOIN employees e ON tm.employee_id = e.id
      LEFT JOIN users emp_user ON e.user_id = emp_user.id
      WHERE tm.id = $1
    `, [meetingId]);

    if (meetingResult.rows.length === 0) return;

    const meeting = meetingResult.rows[0];
    const employeeName = `${meeting.first_name} ${meeting.last_name}`;
    
    let message = '';
    switch (type) {
      case 'meeting_scheduled':
        message = `Team introduction meeting scheduled for ${employeeName} on ${new Date(meeting.scheduled_date).toLocaleDateString()}`;
        break;
      case 'meeting_rescheduled':
        message = `Team introduction meeting for ${employeeName} has been rescheduled to ${new Date(meeting.scheduled_date).toLocaleDateString()}`;
        break;
      case 'meeting_cancelled':
        message = `Team introduction meeting for ${employeeName} has been cancelled`;
        break;
      case 'meeting_reminder':
        message = `Reminder: Team introduction meeting for ${employeeName} is scheduled for today`;
        break;
    }

    // Insert notifications for all attendees
    for (const userId of attendees) {
      try {
        await this.client.query(`
          INSERT INTO meeting_notifications (meeting_id, recipient_id, notification_type, message)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (meeting_id, recipient_id, notification_type) DO NOTHING
        `, [meetingId, userId, type, message]);
      } catch (error) {
        console.error('Error creating notification for user:', userId, error);
      }
    }
  }

  async addTeamMeetingToOnboardingChecklist(employeeId: number, meetingId: number): Promise<void> {
    // Check if team meeting checklist item already exists
    const existingResult = await this.client.query(`
      SELECT id FROM onboarding_checklists 
      WHERE employee_id = $1 AND item_title LIKE '%Team Introduction%'
    `, [employeeId]);

    if (existingResult.rows.length === 0) {
      // Add team meeting to onboarding checklist
      await this.client.query(`
        INSERT INTO onboarding_checklists (
          employee_id, item_title, description, due_date, requires_document, 
          requires_psychometric_test, is_completed, "order"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        employeeId,
        'Attend Team Introduction Meeting',
        'Participate in your scheduled team introduction meeting to meet your colleagues',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        false,
        false,
        false,
        99 // High order to appear at end of list
      ]);
    }
  }

  async completeTeamMeetingChecklistItem(meetingId: number): Promise<void> {
    // Get employee ID from meeting
    const meetingResult = await this.client.query(`
      SELECT employee_id FROM team_introduction_meetings WHERE id = $1
    `, [meetingId]);

    if (meetingResult.rows.length > 0) {
      const employeeId = meetingResult.rows[0].employee_id;
      
      // Mark team meeting checklist item as complete
      await this.client.query(`
        UPDATE onboarding_checklists 
        SET is_completed = true, completed_at = CURRENT_TIMESTAMP
        WHERE employee_id = $1 AND item_title LIKE '%Team Introduction%'
      `, [employeeId]);
    }
  }

  async getMeetingNotifications(userId: number): Promise<any[]> {
    const result = await this.client.query(`
      SELECT mn.*, tm.meeting_title, tm.scheduled_date
      FROM meeting_notifications mn
      LEFT JOIN team_introduction_meetings tm ON mn.meeting_id = tm.id
      WHERE mn.recipient_id = $1
      ORDER BY mn.sent_at DESC
    `, [userId]);

    return result.rows.map(row => ({
      id: row.id,
      meetingId: row.meeting_id,
      recipientId: row.recipient_id,
      notificationType: row.notification_type,
      message: row.message,
      isRead: row.is_read,
      sentAt: row.sent_at,
      meetingTitle: row.meeting_title,
      scheduledDate: row.scheduled_date
    }));
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await this.client.query(`
      UPDATE meeting_notifications 
      SET is_read = true 
      WHERE id = $1
    `, [id]);
  }

  // Psychometric Results Methods for HR Dashboard

  async getAllPsychometricResults(): Promise<any[]> {
    try {
      const result = await this.client.query(`
        SELECT 
          pta.candidate_email,
          pta.candidate_name,
          pta.test_id,
          pta.percentage_score,
          pta.time_spent,
          pta.completed_at,
          pta.responses,
          pta.results,
          pt.test_name,
          pt.test_type,
          pt.description as test_description
        FROM psychometric_test_attempts pta
        LEFT JOIN psychometric_tests pt ON pta.test_id = pt.id
        WHERE pta.completed_at IS NOT NULL AND pta.status = 'completed'
        ORDER BY pta.completed_at DESC
      `);

      return result.rows.map(row => ({
        employeeId: null, // These are pre-employment tests
        testId: row.test_id,
        score: row.percentage_score || 0,
        timeSpent: row.time_spent || 0,
        completedAt: row.completed_at,
        answers: row.responses || [],
        results: row.results || {},
        testName: row.test_name,
        testType: row.test_type,
        testDescription: row.test_description,
        employeeName: row.candidate_name || 'Unknown',
        employeeEmail: row.candidate_email
      }));
    } catch (error) {
      console.error('Error fetching all psychometric results:', error);
      throw error;
    }
  }

  async getPsychometricResult(candidateEmail: string, testId: number): Promise<any> {
    try {
      const result = await this.client.query(`
        SELECT 
          pta.*,
          pt.test_name,
          pt.test_type,
          pt.description as test_description,
          pt.instructions
        FROM psychometric_test_attempts pta
        LEFT JOIN psychometric_tests pt ON pta.test_id = pt.id
        WHERE pta.candidate_email = $1 AND pta.test_id = $2
        AND pta.completed_at IS NOT NULL AND pta.status = 'completed'
      `, [candidateEmail, testId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        employeeId: null,
        testId: row.test_id,
        score: row.percentage_score || 0,
        timeSpent: row.time_spent || 0,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        answers: row.responses || [],
        results: row.results || {},
        testName: row.test_name,
        testType: row.test_type,
        testDescription: row.test_description,
        instructions: row.instructions,
        employeeName: row.candidate_name || 'Unknown',
        employeeEmail: row.candidate_email
      };
    } catch (error) {
      console.error('Error fetching psychometric result:', error);
      throw error;
    }
  }

  async getPsychometricAnalytics(): Promise<any> {
    try {
      // Get overall statistics
      const overallStats = await this.client.query(`
        SELECT 
          COUNT(*) as total_assessments,
          AVG(percentage_score) as average_score,
          COUNT(DISTINCT candidate_email) as unique_candidates,
          COUNT(DISTINCT test_id) as unique_tests
        FROM psychometric_test_attempts 
        WHERE completed_at IS NOT NULL AND percentage_score IS NOT NULL
      `);

      // Get score distribution
      const scoreDistribution = await this.client.query(`
        SELECT 
          CASE 
            WHEN percentage_score >= 80 THEN 'excellent'
            WHEN percentage_score >= 60 THEN 'good'
            ELSE 'needs_improvement'
          END as performance_level,
          COUNT(*) as count
        FROM psychometric_test_attempts 
        WHERE completed_at IS NOT NULL AND percentage_score IS NOT NULL
        GROUP BY performance_level
      `);

      // Get test type breakdown
      const testTypeBreakdown = await this.client.query(`
        SELECT 
          pt.test_type,
          pt.test_name,
          COUNT(pta.id) as completion_count,
          AVG(pta.percentage_score) as average_score
        FROM psychometric_tests pt
        LEFT JOIN psychometric_test_attempts pta ON pt.id = pta.test_id 
          AND pta.completed_at IS NOT NULL AND pta.status = 'completed'
        WHERE pt.is_active = true
        GROUP BY pt.id, pt.test_type, pt.test_name
        ORDER BY completion_count DESC
      `);

      // Get recent completion trends (last 30 days)
      const recentTrends = await this.client.query(`
        SELECT 
          DATE(completed_at) as completion_date,
          COUNT(*) as daily_completions,
          AVG(percentage_score) as daily_avg_score
        FROM psychometric_test_attempts 
        WHERE completed_at >= CURRENT_DATE - INTERVAL '30 days'
          AND completed_at IS NOT NULL AND status = 'completed'
        GROUP BY DATE(completed_at)
        ORDER BY completion_date DESC
      `);

      return {
        overall: overallStats.rows[0] || {
          total_assessments: 0,
          average_score: 0,
          unique_candidates: 0,
          unique_tests: 0
        },
        scoreDistribution: scoreDistribution.rows,
        testTypeBreakdown: testTypeBreakdown.rows,
        recentTrends: recentTrends.rows
      };
    } catch (error) {
      console.error('Error fetching psychometric analytics:', error);
      throw error;
    }
  }

  // Utility function to ensure all employees have onboarding checklists
  async ensureAllEmployeesHaveOnboardingChecklists(): Promise<void> {
    const employeesWithoutChecklists = await db
      .select({ id: employees.id, userId: employees.userId })
      .from(employees)
      .leftJoin(onboardingChecklists, eq(employees.id, onboardingChecklists.employeeId))
      .where(isNull(onboardingChecklists.employeeId))
      .groupBy(employees.id);

    for (const employee of employeesWithoutChecklists) {
      await this.createStandardOnboardingChecklist(employee.id);
    }
  }

  // Banking Information methods
  async getBankingInfo(userId: number): Promise<any> {
    const result = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
    if (result.length === 0) return null;
    
    const employee = result[0];
    return {
      bankName: employee.bankName || '',
      accountHolderName: employee.accountHolderName || '',
      accountNumber: employee.accountNumber || '',
      accountType: employee.accountType || '',
      iban: employee.iban || '',
      routingNumber: employee.routingNumber || '',
      cnicNumber: employee.cnicNumber || '',
      passportNumber: employee.passportNumber || '',
      taxIdNumber: employee.taxIdNumber || ''
    };
  }

  async saveBankingInfo(userId: number, bankingData: any): Promise<any> {
    const existingEmployee = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
    
    if (existingEmployee.length === 0) {
      throw new Error('Employee record not found');
    }

    const result = await db.update(employees)
      .set({
        bankName: bankingData.bankName,
        accountHolderName: bankingData.accountHolderName,
        accountNumber: bankingData.accountNumber,
        accountType: bankingData.accountType,
        iban: bankingData.iban,
        routingNumber: bankingData.routingNumber,
        cnicNumber: bankingData.cnicNumber,
        passportNumber: bankingData.passportNumber,
        taxIdNumber: bankingData.taxIdNumber,
        updatedAt: new Date()
      })
      .where(eq(employees.userId, userId))
      .returning();

    return result[0];
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getUserNotifications(userId: number, filters?: { isRead?: boolean; limit?: number }): Promise<Notification[]> {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    if (filters?.isRead !== undefined) {
      query = query.where(and(eq(notifications.userId, userId), eq(notifications.isRead, filters.isRead)));
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async markNotificationAsRead(notificationId: number): Promise<Notification> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notifications.id, notificationId))
      .returning();
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async deleteNotification(notificationId: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result[0]?.count || 0;
  }

  // Helper method to create common notification types
  async createTaskNotification(type: 'task_assigned' | 'task_completed' | 'task_overdue', data: {
    userId: number;
    taskId: number;
    taskTitle: string;
    assignedBy?: string;
    dueDate?: Date;
    assignedToName?: string;
  }): Promise<void> {
    let title: string;
    let message: string;
    let actionRequired = false;
    
    switch (type) {
      case 'task_assigned':
        title = 'New Task Assigned';
        message = `You have been assigned a new task: ${data.taskTitle}`;
        actionRequired = true;
        break;
      case 'task_completed':
        title = 'Task Completed';
        message = `Task "${data.taskTitle}" has been completed`;
        break;
      case 'task_overdue':
        title = 'Task Overdue';
        message = data.assignedToName 
          ? `Task "${data.taskTitle}" assigned to ${data.assignedToName} is overdue (due: ${data.dueDate?.toLocaleDateString()})`
          : `Your task "${data.taskTitle}" is overdue (due: ${data.dueDate?.toLocaleDateString()})`;
        actionRequired = true;
        break;
    }

    const notification: InsertNotification = {
      userId: data.userId,
      type,
      title,
      message,
      data: { taskId: data.taskId, assignedBy: data.assignedBy, dueDate: data.dueDate },
      actionRequired,
      actionUrl: `/tasks/${data.taskId}`,
      relatedEntityType: 'task',
      relatedEntityId: data.taskId,
      priority: type === 'task_overdue' ? 'high' : 'normal'
    };

    await this.createNotification(notification);
  }

  // Check for overdue tasks and send notifications
  async checkAndNotifyOverdueTasks(): Promise<void> {
    try {
      console.log('🔍 Starting overdue task check...');
      const now = new Date();
      
      // First check if there are overdue tasks in the regular tasks table
      const regularTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          dueDate: tasks.dueDate,
          assignedTo: tasks.assignedTo,
          assignedBy: tasks.assignedBy,
          status: tasks.status,
          assignedToUser: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          }
        })
        .from(tasks)
        .leftJoin(users, eq(tasks.assignedTo, users.id));

      console.log(`📋 Found ${regularTasks.length} regular tasks`);
      
      const overdueRegularTasks = regularTasks.filter(task => 
        task.status !== 'completed' && 
        task.dueDate && 
        new Date(task.dueDate) < now
      );

      console.log(`⏰ Found ${overdueRegularTasks.length} overdue regular tasks`);

      for (const task of overdueRegularTasks) {
        console.log(`Processing overdue task: ${task.title} (ID: ${task.id}) - Due: ${task.dueDate}`);
        
        if (task.assignedTo && task.assignedToUser) {
          // Check if we've already sent a notification today
          const todayNotifications = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.relatedEntityId, task.id),
                eq(notifications.relatedEntityType, 'task')
              )
            );

          const today = new Date().toDateString();
          const hasNotificationToday = todayNotifications.some(n => 
            new Date(n.createdAt!).toDateString() === today
          );

          console.log(`Task ${task.id} has notification today: ${hasNotificationToday}`);

          if (!hasNotificationToday) {
            console.log(`📢 Sending overdue notification for task: ${task.title}`);
            
            // Notify the assigned employee
            await this.createNotification({
              userId: task.assignedTo,
              type: 'task_assigned', // Using existing type since task_overdue doesn't exist in enum
              title: 'Task Overdue',
              message: `Your task "${task.title}" is overdue (due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'})`,
              data: { taskId: task.id, dueDate: task.dueDate },
              actionRequired: true,
              actionUrl: `/tasks/${task.id}`,
              relatedEntityType: 'task',
              relatedEntityId: task.id,
              priority: 'high'
            });

            // Notify HR administrators
            const hrAdmins = await db
              .select({ id: users.id, username: users.username })
              .from(users)
              .where(eq(users.role, 'hr_admin'));

            console.log(`👥 Found ${hrAdmins.length} HR admins to notify`);

            for (const admin of hrAdmins) {
              await this.createNotification({
                userId: admin.id,
                type: 'task_assigned',
                title: 'Employee Task Overdue',
                message: `Task "${task.title}" assigned to ${task.assignedToUser.firstName} ${task.assignedToUser.lastName} is overdue (due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'})`,
                data: { taskId: task.id, assignedToName: `${task.assignedToUser.firstName} ${task.assignedToUser.lastName}`, dueDate: task.dueDate },
                actionRequired: true,
                actionUrl: `/tasks/${task.id}`,
                relatedEntityType: 'task',
                relatedEntityId: task.id,
                priority: 'high'
              });
            }
            
            console.log(`✅ Notifications sent for task ${task.id}`);
          }
        }
      }
      
      console.log('🎯 Overdue task check completed successfully');
    } catch (error) {
      console.error('❌ Error checking overdue tasks:', error);
    }
  }

  // Get all project tasks with user information
  async getAllProjectTasks(): Promise<any[]> {
    const result = await db
      .select({
        id: projectTasks.id,
        title: projectTasks.title,
        description: projectTasks.description,
        status: projectTasks.status,
        priority: projectTasks.priority,
        dueDate: projectTasks.dueDate,
        assignedTo: projectTasks.assignedTo,
        assignedBy: projectTasks.assignedBy,
        projectId: projectTasks.projectId,
        assignedToUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(projectTasks)
      .leftJoin(users, eq(projectTasks.assignedTo, users.id));

    return result;
  }

  // Submit explanation for overdue task (store in notification for now)
  async submitOverdueTaskExplanation(taskId: number, explanation: string): Promise<void> {
    const task = await this.getProjectTask(taskId);
    if (task && task.assignedBy) {
      // Create a notification to the task creator with the explanation
      await this.createNotification({
        userId: task.assignedBy,
        type: 'task_explanation',
        title: 'Task Overdue Explanation',
        message: `Employee provided explanation for overdue task "${task.title}": ${explanation}`,
        data: { taskId, explanation },
        actionRequired: true,
        actionUrl: `/tasks/${taskId}`,
        relatedEntityType: 'task',
        relatedEntityId: taskId,
        priority: 'normal'
      });
    }
  }

  // Extend task due date (HR Admin only)
  async extendTaskDueDate(taskId: number, newDueDate: Date, reason: string, extendedBy: number): Promise<void> {
    const task = await this.getProjectTask(taskId);
    if (task) {
      // Update the due date
      await db
        .update(projectTasks)
        .set({ dueDate: newDueDate })
        .where(eq(projectTasks.id, taskId));

      // Notify the assigned employee about the extension
      if (task.assignedTo) {
        await this.createNotification({
          userId: task.assignedTo,
          type: 'task_updated' as any,
          title: 'Task Due Date Extended',
          message: `Your task "${task.title}" due date has been extended to ${newDueDate.toLocaleDateString()}. Reason: ${reason}`,
          data: { taskId, newDueDate, reason, extendedBy },
          actionRequired: false,
          actionUrl: `/tasks/${taskId}`,
          relatedEntityType: 'task',
          relatedEntityId: taskId,
          priority: 'normal'
        });
      }
    }
  }

  async createProjectNotification(type: 'project_assigned' | 'project_updated', data: {
    userId: number;
    projectId: number;
    projectName: string;
    updatedBy?: string;
  }): Promise<void> {
    const notification: InsertNotification = {
      userId: data.userId,
      type,
      title: type === 'project_assigned' ? 'Added to Project' : 'Project Updated',
      message: type === 'project_assigned' 
        ? `You have been added to project: ${data.projectName}`
        : `Project "${data.projectName}" has been updated`,
      data: { projectId: data.projectId, updatedBy: data.updatedBy },
      actionRequired: type === 'project_assigned',
      actionUrl: `/projects/${data.projectId}`,
      relatedEntityType: 'project',
      relatedEntityId: data.projectId,
      priority: 'normal'
    };

    await this.createNotification(notification);
  }

  async createOnboardingNotification(type: 'onboarding_step' | 'onboarding_review', data: {
    userId: number;
    title: string;
    message: string;
    actionUrl?: string;
  }): Promise<void> {
    const notification: InsertNotification = {
      userId: data.userId,
      type,
      title: data.title,
      message: data.message,
      actionRequired: true,
      actionUrl: data.actionUrl || '/onboarding',
      relatedEntityType: 'onboarding',
      priority: 'high'
    };

    await this.createNotification(notification);
  }

  // Social Media & Content Management Methods
  
  // Social Media Campaigns
  async getSocialMediaCampaigns(): Promise<SocialMediaCampaign[]> {
    return await db
      .select()
      .from(socialMediaCampaigns)
      .orderBy(desc(socialMediaCampaigns.createdAt));
  }

  async createSocialMediaCampaign(campaign: InsertSocialMediaCampaign): Promise<SocialMediaCampaign> {
    const [newCampaign] = await db
      .insert(socialMediaCampaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateSocialMediaCampaign(id: number, updateData: Partial<InsertSocialMediaCampaign>): Promise<SocialMediaCampaign> {
    const [updatedCampaign] = await db
      .update(socialMediaCampaigns)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(socialMediaCampaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteSocialMediaCampaign(id: number): Promise<void> {
    await db.delete(socialMediaCampaigns).where(eq(socialMediaCampaigns.id, id));
  }

  async getContentByDateRange(startDate: Date, endDate: Date): Promise<ContentCalendarItem[]> {
    return await db
      .select()
      .from(contentCalendar)
      .where(and(
        gte(contentCalendar.scheduledDate, startDate),
        lte(contentCalendar.scheduledDate, endDate)
      ))
      .orderBy(asc(contentCalendar.scheduledDate));
  }

  // Content Calendar
  async getContentCalendar(): Promise<ContentCalendar[]> {
    return await db
      .select()
      .from(contentCalendar)
      .orderBy(desc(contentCalendar.scheduledDate));
  }

  async createContentCalendarItem(content: InsertContentCalendar): Promise<ContentCalendar> {
    const [newContent] = await db
      .insert(contentCalendar)
      .values(content)
      .returning();
    return newContent;
  }

  async updateContentCalendarItem(id: number, updateData: Partial<InsertContentCalendar>): Promise<ContentCalendar> {
    const [updatedContent] = await db
      .update(contentCalendar)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(contentCalendar.id, id))
      .returning();
    return updatedContent;
  }

  async deleteContentCalendarItem(id: number): Promise<void> {
    await db.delete(contentCalendar).where(eq(contentCalendar.id, id));
  }

  // Social Media Projects
  async getSocialMediaProjects(): Promise<SocialMediaProject[]> {
    return await db
      .select()
      .from(socialMediaProjects)
      .orderBy(desc(socialMediaProjects.createdAt));
  }

  async createSocialMediaProject(project: InsertSocialMediaProject): Promise<SocialMediaProject> {
    const [newProject] = await db
      .insert(socialMediaProjects)
      .values(project)
      .returning();
    return newProject;
  }

  // Social Media Tasks
  async getSocialMediaTasks(): Promise<SocialMediaTask[]> {
    return await db
      .select()
      .from(socialMediaTasks)
      .orderBy(desc(socialMediaTasks.createdAt));
  }

  async createSocialMediaTask(task: InsertSocialMediaTask): Promise<SocialMediaTask> {
    const [newTask] = await db
      .insert(socialMediaTasks)
      .values(task)
      .returning();
    return newTask;
  }

  // Brand Guidelines
  async getBrandGuidelines(): Promise<BrandGuideline[]> {
    return await db
      .select()
      .from(brandGuidelines)
      .orderBy(desc(brandGuidelines.createdAt));
  }

  async createBrandGuideline(guideline: InsertBrandGuideline): Promise<BrandGuideline> {
    const [newGuideline] = await db
      .insert(brandGuidelines)
      .values(guideline)
      .returning();
    return newGuideline;
  }

  // Social Media Account Connection Methods
  async getConnectedSocialAccounts(userId: number): Promise<ConnectedSocialAccount[]> {
    return await db
      .select()
      .from(connectedSocialAccounts)
      .where(eq(connectedSocialAccounts.userId, userId))
      .orderBy(desc(connectedSocialAccounts.connectedAt));
  }

  async connectSocialAccount(accountData: InsertConnectedSocialAccount): Promise<ConnectedSocialAccount> {
    const [newAccount] = await db
      .insert(connectedSocialAccounts)
      .values(accountData)
      .returning();
    return newAccount;
  }

  async disconnectSocialAccount(accountId: number): Promise<void> {
    await db
      .update(connectedSocialAccounts)
      .set({ 
        status: 'disconnected',
        updatedAt: new Date()
      })
      .where(eq(connectedSocialAccounts.id, accountId));
  }

  async deleteSocialAccount(accountId: number): Promise<void> {
    await db.delete(connectedSocialAccounts).where(eq(connectedSocialAccounts.id, accountId));
  }

  async refreshSocialAccount(accountId: number, updateData: Partial<InsertConnectedSocialAccount>): Promise<ConnectedSocialAccount> {
    const [updatedAccount] = await db
      .update(connectedSocialAccounts)
      .set({ 
        ...updateData, 
        lastSyncAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(connectedSocialAccounts.id, accountId))
      .returning();
    return updatedAccount;
  }

  async updateSocialAccountStatus(accountId: number, status: 'connected' | 'disconnected' | 'expired' | 'error', errorMessage?: string): Promise<ConnectedSocialAccount> {
    const [updatedAccount] = await db
      .update(connectedSocialAccounts)
      .set({ 
        status,
        errorMessage,
        updatedAt: new Date()
      })
      .where(eq(connectedSocialAccounts.id, accountId))
      .returning();
    return updatedAccount;
  }

  // Social Media Analytics Methods
  async getSocialMediaAnalytics(accountId: number, dateRange?: { startDate: Date; endDate: Date }): Promise<SocialMediaAnalytics[]> {
    let query = db
      .select()
      .from(socialMediaAnalytics)
      .where(eq(socialMediaAnalytics.accountId, accountId))
      .orderBy(desc(socialMediaAnalytics.analyticsDate));

    if (dateRange) {
      query = query.where(
        and(
          eq(socialMediaAnalytics.accountId, accountId),
          gte(socialMediaAnalytics.analyticsDate, dateRange.startDate),
          lte(socialMediaAnalytics.analyticsDate, dateRange.endDate)
        )
      );
    }

    return await query;
  }

  async createSocialMediaAnalytics(analyticsData: InsertSocialMediaAnalytics): Promise<SocialMediaAnalytics> {
    const [newAnalytics] = await db
      .insert(socialMediaAnalytics)
      .values(analyticsData)
      .returning();
    return newAnalytics;
  }

  async getLatestAnalytics(accountId: number): Promise<SocialMediaAnalytics | undefined> {
    const [latest] = await db
      .select()
      .from(socialMediaAnalytics)
      .where(eq(socialMediaAnalytics.accountId, accountId))
      .orderBy(desc(socialMediaAnalytics.analyticsDate))
      .limit(1);
    return latest;
  }

  // Post Performance Methods
  async getPostPerformance(accountId: number, dateRange?: { startDate: Date; endDate: Date }): Promise<PostPerformance[]> {
    let query = db
      .select()
      .from(postPerformance)
      .where(eq(postPerformance.accountId, accountId))
      .orderBy(desc(postPerformance.publishedAt));

    if (dateRange) {
      query = query.where(
        and(
          eq(postPerformance.accountId, accountId),
          gte(postPerformance.publishedAt, dateRange.startDate),
          lte(postPerformance.publishedAt, dateRange.endDate)
        )
      );
    }

    return await query;
  }

  async createPostPerformance(performanceData: InsertPostPerformance): Promise<PostPerformance> {
    const [newPerformance] = await db
      .insert(postPerformance)
      .values(performanceData)
      .returning();
    return newPerformance;
  }

  async updatePostPerformance(id: number, updateData: Partial<InsertPostPerformance>): Promise<PostPerformance> {
    const [updatedPerformance] = await db
      .update(postPerformance)
      .set({ ...updateData, lastUpdated: new Date() })
      .where(eq(postPerformance.id, id))
      .returning();
    return updatedPerformance;
  }

  // Aggregate Analytics Methods
  async getAccountOverview(userId: number): Promise<{
    totalAccounts: number;
    connectedAccounts: number;
    totalFollowers: number;
    totalPosts: number;
    averageEngagement: number;
  }> {
    const accounts = await this.getConnectedSocialAccounts(userId);
    const connectedAccounts = accounts.filter(acc => acc.status === 'connected');
    
    const totalFollowers = accounts.reduce((sum, acc) => sum + acc.followerCount, 0);
    
    // Get recent analytics for engagement calculation
    const recentAnalytics = await Promise.all(
      connectedAccounts.map(acc => this.getLatestAnalytics(acc.id))
    );
    
    const validAnalytics = recentAnalytics.filter(Boolean) as SocialMediaAnalytics[];
    const totalPosts = validAnalytics.reduce((sum, analytics) => sum + analytics.posts, 0);
    const averageEngagement = validAnalytics.length > 0 
      ? validAnalytics.reduce((sum, analytics) => sum + Number(analytics.engagementRate), 0) / validAnalytics.length
      : 0;

    return {
      totalAccounts: accounts.length,
      connectedAccounts: connectedAccounts.length,
      totalFollowers,
      totalPosts,
      averageEngagement: Math.round(averageEngagement * 100) / 100
    };
  }

  // Subscription operations
  async updateUserStripeInfo(userId: number, customerId: string, subscriptionId?: string): Promise<User> {
    const updates: any = {
      stripeCustomerId: customerId,
      updatedAt: new Date()
    };
    
    if (subscriptionId) {
      updates.stripeSubscriptionId = subscriptionId;
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        stripeCustomerId: customerId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getSubscriptionPlans(): Promise<any[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.monthlyPrice);
  }

  async getSubscriptionPlan(planId: string): Promise<any | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.planId, planId as any))
      .limit(1);
    return plan;
  }

  async createSubscriptionHistory(userId: number, subscriptionData: any): Promise<any> {
    const [history] = await db
      .insert(subscriptionHistory)
      .values({
        userId,
        subscriptionId: subscriptionData.subscriptionId,
        planId: subscriptionData.planId,
        status: subscriptionData.status,
        startDate: subscriptionData.startDate,
        endDate: subscriptionData.endDate,
        amount: subscriptionData.amount,
        billingCycle: subscriptionData.billingCycle,
        cancelReason: subscriptionData.cancelReason
      })
      .returning();
    return history;
  }

  async getUserSubscription(userId: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user;
  }

  async updateSubscriptionPlanPriceIds(planId: number, monthlyPriceId?: string, yearlyPriceId?: string): Promise<void> {
    const updates: any = {};
    if (monthlyPriceId !== undefined) {
      updates.stripePriceIdMonthly = monthlyPriceId;
    }
    if (yearlyPriceId !== undefined) {
      updates.stripePriceIdYearly = yearlyPriceId;
    }
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db
        .update(subscriptionPlans)
        .set(updates)
        .where(eq(subscriptionPlans.id, planId));
    }
  }

  // Trial request operations
  async getTrialRequests(filters?: { status?: string }): Promise<TrialRequest[]> {
    let query = db.select().from(trialRequests);
    
    if (filters?.status) {
      query = query.where(eq(trialRequests.status, filters.status as any));
    }
    
    return await query.orderBy(desc(trialRequests.createdAt));
  }

  async getTrialRequest(id: number): Promise<TrialRequest | undefined> {
    const [request] = await db.select().from(trialRequests).where(eq(trialRequests.id, id));
    return request;
  }

  async createTrialRequest(request: InsertTrialRequest): Promise<TrialRequest> {
    const [created] = await db.insert(trialRequests).values(request).returning();
    return created;
  }

  async updateTrialRequest(id: number, request: Partial<InsertTrialRequest>): Promise<TrialRequest> {
    const [updated] = await db
      .update(trialRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(trialRequests.id, id))
      .returning();
    return updated;
  }

  async approveTrialRequest(id: number, approvedBy: number): Promise<TrialRequest> {
    const trialDuration = 14; // 14 days
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + trialDuration * 24 * 60 * 60 * 1000);
    
    const [approved] = await db
      .update(trialRequests)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        trialStartDate: startDate,
        trialEndDate: endDate,
        updatedAt: new Date()
      })
      .where(eq(trialRequests.id, id))
      .returning();
    return approved;
  }

  async rejectTrialRequest(id: number, approvedBy: number, reason: string): Promise<TrialRequest> {
    const [rejected] = await db
      .update(trialRequests)
      .set({
        status: 'rejected',
        approvedBy,
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(trialRequests.id, id))
      .returning();
    return rejected;
  }

  async getPendingTrialRequestsCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(trialRequests)
      .where(eq(trialRequests.status, 'pending'));
    return result[0]?.count || 0;
  }

  // Super Admin SaaS operations
  async getTrialUsers(): Promise<any[]> {
    const trialUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        accountEnabled: users.accountEnabled,
        trialEndDate: users.trialEndDate,
        companyName: users.companyName,
        createdAt: users.createdAt
      })
      .from(users)
      .where(isNotNull(users.trialEndDate))
      .orderBy(desc(users.createdAt));

    return trialUsers.map(user => ({
      ...user,
      daysLeft: user.trialEndDate ? Math.max(0, Math.ceil((user.trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0
    }));
  }

  async getSaasStats(): Promise<any> {
    try {
      const [activeTrialsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          isNotNull(users.trialEndDate),
          eq(users.accountEnabled, true),
          sql`trial_end_date > NOW()`
        ));

      const [paidSubscriptionsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          isNotNull(users.stripeSubscriptionId),
          eq(users.accountEnabled, true)
        ));

      const [pendingRequestsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(trialRequests)
        .where(eq(trialRequests.status, 'pending'));

      const activeTrials = activeTrialsResult?.count || 0;
      const paidSubscriptions = paidSubscriptionsResult?.count || 0;
      const pendingRequests = pendingRequestsResult?.count || 0;
      
      const conversionRate = activeTrials > 0 ? Math.round((paidSubscriptions / (activeTrials + paidSubscriptions)) * 100) : 0;

      return {
        activeTrials,
        paidSubscriptions,
        pendingRequests,
        conversionRate
      };
    } catch (error) {
      console.error('Error fetching SaaS stats:', error);
      return {
        activeTrials: 0,
        paidSubscriptions: 0,
        pendingRequests: 0,
        conversionRate: 0
      };
    }
  }

  async createTrialUser(userData: any): Promise<User> {
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async extendTrial(userId: number, days: number): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentEndDate = user.trialEndDate || new Date();
    const newEndDate = new Date(currentEndDate.getTime() + (days * 24 * 60 * 60 * 1000));

    const [updatedUser] = await db
      .update(users)
      .set({ 
        trialEndDate: newEndDate,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async getUserById(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return undefined;
    }
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByStripeId(stripeCustomerId: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.stripeCustomerId, stripeCustomerId));
    return customer;
  }

  async getCustomerByTrialRequest(trialRequestId: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.trialRequestId, trialRequestId));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  // Subscription operations
  async getSubscriptions(): Promise<(Subscription & { customer: Customer })[]> {
    return await db
      .select({
        id: subscriptions.id,
        customerId: subscriptions.customerId,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        planId: subscriptions.planId,
        status: subscriptions.status,
        billingCycle: subscriptions.billingCycle,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        trialStart: subscriptions.trialStart,
        trialEnd: subscriptions.trialEnd,
        canceledAt: subscriptions.canceledAt,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        amount: subscriptions.amount,
        currency: subscriptions.currency,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        customer: customers,
      })
      .from(subscriptions)
      .leftJoin(customers, eq(subscriptions.customerId, customers.id))
      .orderBy(desc(subscriptions.createdAt));
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return subscription;
  }

  async getCustomerSubscriptions(customerId: number): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.customerId, customerId)).orderBy(desc(subscriptions.createdAt));
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [created] = await db.insert(subscriptions).values(subscription).returning();
    return created;
  }

  async updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  // Payment operations
  async getPayments(): Promise<(Payment & { customer: Customer })[]> {
    return await db
      .select({
        id: payments.id,
        customerId: payments.customerId,
        subscriptionId: payments.subscriptionId,
        stripePaymentIntentId: payments.stripePaymentIntentId,
        stripeInvoiceId: payments.stripeInvoiceId,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        description: payments.description,
        paidAt: payments.paidAt,
        failureReason: payments.failureReason,
        refundedAmount: payments.refundedAmount,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        customer: customers,
      })
      .from(payments)
      .leftJoin(customers, eq(payments.customerId, customers.id))
      .orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getCustomerPayments(customerId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.customerId, customerId)).orderBy(desc(payments.createdAt));
  }

  async getSubscriptionPayments(subscriptionId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.subscriptionId, subscriptionId)).orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  // Billing event operations
  async getBillingEvents(customerId?: number): Promise<(BillingEvent & { customer: Customer })[]> {
    let query = db
      .select({
        id: billingEvents.id,
        customerId: billingEvents.customerId,
        subscriptionId: billingEvents.subscriptionId,
        paymentId: billingEvents.paymentId,
        eventType: billingEvents.eventType,
        eventData: billingEvents.eventData,
        description: billingEvents.description,
        createdAt: billingEvents.createdAt,
        customer: customers,
      })
      .from(billingEvents)
      .leftJoin(customers, eq(billingEvents.customerId, customers.id));

    if (customerId) {
      query = query.where(eq(billingEvents.customerId, customerId));
    }

    return await query.orderBy(desc(billingEvents.createdAt));
  }

  async createBillingEvent(event: InsertBillingEvent): Promise<BillingEvent> {
    const [created] = await db.insert(billingEvents).values(event).returning();
    return created;
  }

  // Subscription analytics
  async getSubscriptionAnalytics(): Promise<{
    totalRevenue: number;
    monthlyRevenue: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    canceledSubscriptions: number;
    avgRevenuePerCustomer: number;
  }> {
    // Total revenue from all successful payments
    const totalRevenueResult = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
      .from(payments)
      .where(eq(payments.status, 'succeeded'));

    // Monthly revenue (current month)
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthlyRevenueResult = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
      .from(payments)
      .where(and(
        eq(payments.status, 'succeeded'),
        sql`${payments.paidAt} >= ${firstDayOfMonth}`
      ));

    // Subscription counts by status
    const subscriptionStats = await db
      .select({ 
        status: subscriptions.status,
        count: sql<number>`count(*)` 
      })
      .from(subscriptions)
      .groupBy(subscriptions.status);

    // Active customers count for avg revenue calculation
    const activeCustomersResult = await db
      .select({ count: sql<number>`count(DISTINCT customer_id)` })
      .from(payments)
      .where(eq(payments.status, 'succeeded'));

    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;
    const activeCustomersCount = activeCustomersResult[0]?.count || 1;

    let activeSubscriptions = 0;
    let trialSubscriptions = 0;
    let canceledSubscriptions = 0;

    subscriptionStats.forEach(stat => {
      switch (stat.status) {
        case 'active':
          activeSubscriptions = stat.count;
          break;
        case 'trialing':
          trialSubscriptions = stat.count;
          break;
        case 'canceled':
          canceledSubscriptions = stat.count;
          break;
      }
    });

    return {
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions,
      trialSubscriptions,
      canceledSubscriptions,
      avgRevenuePerCustomer: totalRevenue / activeCustomersCount,
    };
  }

  // Job application operations - optimized for list view (excludes large file data)
  async getAllJobApplications(): Promise<JobApplication[]> {
    console.log('🔍 Starting getAllJobApplications query (excluding large files)...');
    const startTime = Date.now();
    
    try {
      // Select essential fields + voice introduction, exclude only large file attachments for performance
      const applications = await db
        .select({
          id: jobApplications.id,
          firstName: jobApplications.firstName,
          lastName: jobApplications.lastName,
          email: jobApplications.email,
          positionAppliedFor: jobApplications.positionAppliedFor,
          phone: jobApplications.phone,
          address: jobApplications.address,
          dateOfBirth: jobApplications.dateOfBirth,
          department: jobApplications.department,
          expectedSalary: jobApplications.expectedSalary,
          availableStartDate: jobApplications.availableStartDate,
          education: jobApplications.education,
          experience: jobApplications.experience,
          skills: jobApplications.skills,
          references: jobApplications.references,
          coverLetter: jobApplications.coverLetter,
          whyJoinUs: jobApplications.whyJoinUs,
          // voiceIntroduction: jobApplications.voiceIntroduction, // Excluded for performance - large audio files
          status: jobApplications.status,
          psychometricCompleted: jobApplications.psychometricCompleted,
          createdAt: jobApplications.createdAt,
          reviewedBy: jobApplications.reviewedBy,
          reviewNotes: jobApplications.reviewNotes,
          // Only exclude large file attachments: resumeFile, certificatesFile
          // These will be loaded only when viewing individual applications
        })
        .from(jobApplications)
        .orderBy(desc(jobApplications.createdAt));
      
      const endTime = Date.now();
      console.log(`✅ getAllJobApplications completed in ${endTime - startTime}ms, found ${applications.length} applications (large files excluded for performance)`);
      
      return applications as JobApplication[];
    } catch (error) {
      const endTime = Date.now();
      console.error(`❌ getAllJobApplications failed after ${endTime - startTime}ms:`, error);
      throw error;
    }
  }

  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    const [application] = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, id));
    return application;
  }

  async createJobApplication(applicationData: InsertJobApplication): Promise<JobApplication> {
    // Remove reviewedBy from insert data as it should be null initially
    const { reviewedBy, ...insertData } = applicationData as any;
    
    const [application] = await db
      .insert(jobApplications)
      .values(insertData)
      .returning();

    // Generate comprehensive psychometric report if test results exist
    if (application.psychometricCompleted) {
      await this.generatePsychometricReport(application.id, application.email);
    }
    
    return application;
  }

  async updateJobApplication(id: number, applicationData: Partial<InsertJobApplication>): Promise<JobApplication> {
    const [application] = await db
      .update(jobApplications)
      .set({ ...applicationData, updatedAt: new Date() })
      .where(eq(jobApplications.id, id))
      .returning();
    return application;
  }

  async deleteJobApplication(id: number): Promise<void> {
    await db.delete(jobApplications).where(eq(jobApplications.id, id));
  }

  // Generate comprehensive psychometric assessment report
  async generatePsychometricReport(applicationId: number, candidateEmail: string): Promise<void> {
    try {
      // Get all psychometric test attempts for this candidate
      const testAttempts = await db
        .select()
        .from(psychometricTestAttempts)
        .innerJoin(psychometricTests, eq(psychometricTestAttempts.testId, psychometricTests.id))
        .where(eq(psychometricTestAttempts.candidateEmail, candidateEmail))
        .orderBy(psychometricTestAttempts.testId);

      if (testAttempts.length === 0) {
        console.log(`No psychometric test attempts found for ${candidateEmail}`);
        return;
      }

      const comprehensiveReport = {
        generatedAt: new Date().toISOString(),
        candidateEmail,
        totalAssessments: testAttempts.length,
        assessments: [] as any[]
      };

      // Process each test attempt
      for (const attempt of testAttempts) {
        const testData = attempt.psychometric_tests;
        const attemptData = attempt.psychometric_test_attempts;
        
        // Get questions for this test
        const questions = await db
          .select()
          .from(psychometricQuestions)
          .where(eq(psychometricQuestions.testId, testData.id))
          .orderBy(psychometricQuestions.orderIndex);

        const assessmentReport = {
          testId: testData.id,
          testName: testData.testName,
          testType: testData.testType,
          description: testData.description,
          completedAt: attemptData.completedAt,
          timeSpent: attemptData.timeSpent,
          status: attemptData.status,
          score: attemptData.score,
          categoryScores: attemptData.categoryScores,
          totalQuestions: questions.length,
          questionsAndAnswers: [] as any[]
        };

        // Map responses to questions with detailed answers
        const responses = attemptData.responses as any[];
        
        for (const question of questions) {
          const response = Array.isArray(responses) 
            ? responses.find((r: any) => r.questionId === question.id)
            : null;

          const questionDetail = {
            questionId: question.id,
            questionText: question.questionText,
            questionType: question.questionType,
            category: question.category,
            options: question.options,
            candidateAnswer: response?.selectedAnswer || 'No answer provided',
            answerIndex: response?.answerIndex,
            correctAnswer: question.correctAnswer,
            isCorrect: question.correctAnswer !== undefined ? 
              (response?.answerIndex === question.correctAnswer) : null,
            timeSpent: response?.timeSpent,
            confidence: response?.confidence
          };

          // Add interpretation for scale-based questions
          if (question.questionType === 'scale' && response?.selectedAnswer) {
            const scaleValue = question.options?.indexOf(response.selectedAnswer) + 1;
            questionDetail.scaleValue = scaleValue;
            questionDetail.interpretation = this.getScaleInterpretation(scaleValue, question.category);
          }

          assessmentReport.questionsAndAnswers.push(questionDetail);
        }

        // Add assessment summary
        assessmentReport.summary = this.generateAssessmentSummary(
          testData.testType, 
          assessmentReport.questionsAndAnswers,
          attemptData.categoryScores
        );

        comprehensiveReport.assessments.push(assessmentReport);
      }

      // Generate overall candidate profile
      comprehensiveReport.overallProfile = this.generateOverallProfile(comprehensiveReport.assessments);

      // Update job application with comprehensive report
      await db
        .update(jobApplications)
        .set({ 
          testResults: comprehensiveReport,
          updatedAt: new Date()
        })
        .where(eq(jobApplications.id, applicationId));

      console.log(`Comprehensive psychometric report generated for application ${applicationId}`);
    } catch (error) {
      console.error(`Error generating psychometric report for application ${applicationId}:`, error);
    }
  }

  // Generate comprehensive candidate evaluation report
  async generateCandidateEvaluationReport(candidateName: string, position: string, testResults: any[]): Promise<string> {
    // Analyze each assessment area and generate scores
    const personalityScore = this.analyzePersonalityAssessment(testResults);
    const cognitiveScore = this.analyzeCognitiveAssessment(testResults);
    const communicationScore = this.analyzeCommunicationAssessment(testResults);
    const technicalScore = this.analyzeTechnicalAssessment(testResults);
    const culturalFitScore = this.analyzeCulturalFitAssessment(testResults);
    const positionSpecificScore = this.analyzePositionSpecificAssessment(testResults, position);

    // Calculate overall fit score
    const overallFitScore = Math.round((personalityScore + cognitiveScore + communicationScore + technicalScore + culturalFitScore + positionSpecificScore) / 6);

    // Determine recommendation
    let recommendation = "Not a Fit";
    if (overallFitScore >= 80) recommendation = "Strong Fit";
    else if (overallFitScore >= 60) recommendation = "Moderate Fit";

    // Generate HR summary
    const hrSummary = this.generateHRSummary(candidateName, position, testResults, overallFitScore, recommendation);

    // Format the complete report
    const report = `======================
Candidate Report
Name: ${candidateName}
Position: ${position}

Category Scores:
- Personality: ${personalityScore}/100
- Cognitive: ${cognitiveScore}/100
- Communication: ${communicationScore}/100
- Technical: ${technicalScore}/100
- Cultural Fit: ${culturalFitScore}/100
- Position-Specific: ${positionSpecificScore}/100

Overall Fit Score: ${overallFitScore}/100  
Recommendation: ${recommendation}

HR Summary:
${hrSummary}
======================`;

    return report;
  }

  private analyzePersonalityAssessment(testResults: any[]): number {
    const personalityTest = testResults.find(test => test.testId === 1);
    if (!personalityTest || !personalityTest.results?.responses) return 0;

    const responses = personalityTest.results.responses;
    let totalScore = 0;
    let responseCount = 0;

    // Convert string responses to numeric scores (1-5 scale)
    Object.values(responses).forEach((response: any) => {
      const numericValue = parseInt(response as string);
      if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
        totalScore += numericValue;
        responseCount++;
      }
    });

    if (responseCount === 0) return 0;
    
    // Convert to 0-100 scale
    const averageScore = totalScore / responseCount;
    return Math.round((averageScore / 5) * 100);
  }

  private analyzeCognitiveAssessment(testResults: any[]): number {
    const cognitiveTest = testResults.find(test => test.testId === 2);
    if (!cognitiveTest || !cognitiveTest.results?.responses) return 0;

    const responses = cognitiveTest.results.responses;
    let correctAnswers = 0;
    let totalQuestions = Object.keys(responses).length;

    // Define correct answers for cognitive test
    const correctAnswersMap: { [key: string]: string } = {
      "1": "1 minute",
      "2": "30", 
      "3": "10 years",
      "4": "Carrot",
      "5": "Some roses are red",
      "6": "30",
      "7": "3",
      "8": "All of these",
      "9": "80",
      "10": "36"
    };

    Object.entries(responses).forEach(([questionId, answer]: [string, any]) => {
      if (correctAnswersMap[questionId] === answer) {
        correctAnswers++;
      }
    });

    return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  }

  private analyzeCommunicationAssessment(testResults: any[]): number {
    const emotionalTest = testResults.find(test => test.testId === 3);
    if (!emotionalTest || !emotionalTest.results?.responses) return 70; // Default score

    const responses = emotionalTest.results.responses;
    let totalScore = 0;
    let responseCount = 0;

    Object.values(responses).forEach((response: any) => {
      const numericValue = parseInt(response as string);
      if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
        totalScore += numericValue;
        responseCount++;
      }
    });

    if (responseCount === 0) return 70;
    
    const averageScore = totalScore / responseCount;
    return Math.round((averageScore / 5) * 100);
  }

  private analyzeTechnicalAssessment(testResults: any[]): number {
    const technicalTest = testResults.find(test => test.testId === 5);
    if (!technicalTest || !technicalTest.results?.responses) return 75; // Default score

    const responses = technicalTest.results.responses;
    let totalScore = 0;
    let responseCount = 0;

    Object.values(responses).forEach((response: any) => {
      const numericValue = parseInt(response as string);
      if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
        totalScore += numericValue;
        responseCount++;
      }
    });

    if (responseCount === 0) return 75;
    
    const averageScore = totalScore / responseCount;
    return Math.round((averageScore / 5) * 100);
  }

  private analyzeCulturalFitAssessment(testResults: any[]): number {
    const culturalTest = testResults.find(test => test.testId === 6);
    if (!culturalTest || !culturalTest.results?.responses) return 80; // Default score

    const responses = culturalTest.results.responses;
    let totalScore = 0;
    let responseCount = 0;

    Object.values(responses).forEach((response: any) => {
      const numericValue = parseInt(response as string);
      if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
        totalScore += numericValue;
        responseCount++;
      }
    });

    if (responseCount === 0) return 80;
    
    const averageScore = totalScore / responseCount;
    return Math.round((averageScore / 5) * 100);
  }

  private analyzePositionSpecificAssessment(testResults: any[], position: string): number {
    const integrityTest = testResults.find(test => test.testId === 4);
    if (!integrityTest || !integrityTest.results?.responses) return 85; // Default score

    const responses = integrityTest.results.responses;
    let totalScore = 0;
    let responseCount = 0;

    Object.values(responses).forEach((response: any) => {
      const numericValue = parseInt(response as string);
      if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
        totalScore += numericValue;
        responseCount++;
      }
    });

    if (responseCount === 0) return 85;
    
    const averageScore = totalScore / responseCount;
    let baseScore = Math.round((averageScore / 5) * 100);

    // Adjust score based on position requirements
    if (position.toLowerCase().includes('manager') || position.toLowerCase().includes('lead')) {
      baseScore = Math.min(100, baseScore + 5); // Boost for leadership roles
    }

    return baseScore;
  }

  private generateHRSummary(candidateName: string, position: string, testResults: any[], overallScore: number, recommendation: string): string {
    const personalityTest = testResults.find(test => test.testId === 1);
    const cognitiveTest = testResults.find(test => test.testId === 2);
    const emotionalTest = testResults.find(test => test.testId === 3);
    
    let summary = "";

    if (recommendation === "Strong Fit") {
      summary = `${candidateName} demonstrates exceptional potential for the ${position} role with an overall fit score of ${overallScore}/100. `;
      
      if (cognitiveTest && cognitiveTest.results?.responses) {
        const cognitiveResponses = Object.values(cognitiveTest.results.responses);
        summary += `Their cognitive assessment reveals strong analytical thinking and problem-solving capabilities, particularly evident in their logical reasoning responses. `;
      }

      if (personalityTest && personalityTest.results?.responses) {
        summary += `Personality assessment indicates a well-balanced profile with strong interpersonal skills and emotional stability. `;
      }

      summary += `Based on their comprehensive assessment performance, ${candidateName} shows excellent alignment with our organizational values and demonstrates the competencies required for success in this position. I strongly recommend proceeding with the next interview stages.`;

    } else if (recommendation === "Moderate Fit") {
      summary = `${candidateName} presents a moderate fit for the ${position} position with an overall score of ${overallScore}/100. `;
      
      summary += `While showing competency in several key areas, there are some considerations that merit further evaluation. `;

      if (cognitiveTest) {
        summary += `Their cognitive performance suggests adequate problem-solving abilities, though additional technical assessment may be beneficial. `;
      }

      summary += `The candidate demonstrates potential but may require additional support or development in certain areas. I recommend proceeding with a structured interview to better assess their practical application of skills and cultural alignment.`;

    } else {
      summary = `${candidateName} scored ${overallScore}/100 overall, indicating limited alignment with the ${position} role requirements. `;
      
      summary += `The assessment results suggest significant gaps in key competency areas that would impact job performance. `;
      
      summary += `While the candidate may have potential, the current skill set and assessment responses indicate they may not be the optimal fit for this specific role at this time. I recommend exploring alternative positions that might better match their current competency profile or considering them for future opportunities with appropriate development.`;
    }

    return summary;
  }

  private getScaleInterpretation(value: number, category: string): string {
    const interpretations: any = {
      extraversion: {
        1: 'Very introverted - Prefers solitary activities',
        2: 'Introverted - Comfortable in small groups',
        3: 'Balanced - Adaptable to different social situations',
        4: 'Extraverted - Energized by social interactions',
        5: 'Very extraverted - Thrives in large groups and social settings'
      },
      agreeableness: {
        1: 'Very competitive - Direct and challenging',
        2: 'Somewhat competitive - Balances cooperation with assertiveness',
        3: 'Balanced - Adapts approach based on situation',
        4: 'Cooperative - Values harmony and teamwork',
        5: 'Very cooperative - Highly empathetic and supportive'
      },
      conscientiousness: {
        1: 'Very flexible - Spontaneous and adaptable',
        2: 'Somewhat flexible - Balances structure with adaptability',
        3: 'Balanced - Organized when needed',
        4: 'Organized - Values structure and planning',
        5: 'Very organized - Highly disciplined and detail-oriented'
      },
      neuroticism: {
        1: 'Very emotionally stable - Calm under pressure',
        2: 'Emotionally stable - Generally composed',
        3: 'Balanced emotional responses',
        4: 'Somewhat sensitive - May be affected by stress',
        5: 'Very sensitive - Highly reactive to stress'
      },
      openness: {
        1: 'Very traditional - Prefers established methods',
        2: 'Somewhat traditional - Open to proven approaches',
        3: 'Balanced - Open to new ideas when appropriate',
        4: 'Creative - Enjoys exploring new concepts',
        5: 'Very creative - Highly innovative and imaginative'
      }
    };

    return interpretations[category]?.[value] || `Scale value: ${value}/5`;
  }

  private generateAssessmentSummary(testType: string, questionsAndAnswers: any[], categoryScores: any): any {
    const summary = {
      testType,
      strengths: [] as string[],
      developmentAreas: [] as string[],
      keyInsights: [] as string[]
    };

    if (testType === 'personality') {
      // Analyze personality traits
      const traits = ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness'];
      for (const trait of traits) {
        const traitQuestions = questionsAndAnswers.filter(q => q.category === trait);
        if (traitQuestions.length > 0) {
          const avgScore = traitQuestions.reduce((sum, q) => sum + (q.scaleValue || 3), 0) / traitQuestions.length;
          
          if (avgScore >= 4) {
            summary.strengths.push(`High ${trait}: ${this.getTraitDescription(trait, 'high')}`);
          } else if (avgScore <= 2) {
            summary.developmentAreas.push(`Lower ${trait}: ${this.getTraitDescription(trait, 'low')}`);
          }
        }
      }
    } else if (testType === 'cognitive') {
      // Analyze cognitive performance
      const correctAnswers = questionsAndAnswers.filter(q => q.isCorrect === true).length;
      const totalAnswers = questionsAndAnswers.length;
      const accuracy = (correctAnswers / totalAnswers) * 100;
      
      summary.keyInsights.push(`Cognitive accuracy: ${accuracy.toFixed(1)}% (${correctAnswers}/${totalAnswers})`);
      
      if (accuracy >= 80) {
        summary.strengths.push('Strong analytical and problem-solving abilities');
      } else if (accuracy <= 50) {
        summary.developmentAreas.push('May benefit from additional cognitive skill development');
      }
    }

    return summary;
  }

  private getTraitDescription(trait: string, level: string): string {
    const descriptions: any = {
      extraversion: {
        high: 'Energetic, sociable, and thrives in team environments',
        low: 'Thoughtful, independent, and works well with focused tasks'
      },
      agreeableness: {
        high: 'Collaborative, empathetic, and excellent team player',
        low: 'Direct communicator, comfortable with challenging decisions'
      },
      conscientiousness: {
        high: 'Highly organized, reliable, and detail-oriented',
        low: 'Flexible, adaptable, and comfortable with ambiguity'
      },
      neuroticism: {
        high: 'May be sensitive to stress, benefits from supportive environment',
        low: 'Emotionally stable, calm under pressure'
      },
      openness: {
        high: 'Creative, innovative, and embraces new challenges',
        low: 'Practical, prefers proven methods and stability'
      }
    };

    return descriptions[trait]?.[level] || `${level} ${trait}`;
  }

  private generateOverallProfile(assessments: any[]): any {
    const profile = {
      assessmentsSummary: {} as any,
      recommendedRole: '',
      overallStrengths: [] as string[],
      developmentRecommendations: [] as string[],
      fitScore: 0
    };

    // Calculate overall fit score based on completed assessments
    let totalScore = 0;
    let scoredAssessments = 0;

    assessments.forEach(assessment => {
      profile.assessmentsSummary[assessment.testType] = {
        completed: true,
        score: assessment.score,
        status: assessment.status
      };

      if (assessment.score && typeof assessment.score === 'number') {
        totalScore += assessment.score;
        scoredAssessments++;
      }

      // Collect strengths
      if (assessment.summary?.strengths) {
        profile.overallStrengths.push(...assessment.summary.strengths);
      }

      // Collect development areas
      if (assessment.summary?.developmentAreas) {
        profile.developmentRecommendations.push(...assessment.summary.developmentAreas);
      }
    });

    // Calculate overall fit score
    if (scoredAssessments > 0) {
      profile.fitScore = Math.round((totalScore / scoredAssessments) * 10) / 10;
    }

    // Generate role recommendations based on assessment results
    profile.recommendedRole = this.generateRoleRecommendation(assessments);

    return profile;
  }

  private generateRoleRecommendation(assessments: any[]): string {
    // Simple logic to recommend roles based on assessment patterns
    const personalityAssessment = assessments.find(a => a.testType === 'personality');
    const cognitiveAssessment = assessments.find(a => a.testType === 'cognitive');
    
    let recommendation = 'Suitable for various roles based on assessment results';

    if (personalityAssessment && cognitiveAssessment) {
      const hasHighExtraversion = personalityAssessment.summary?.strengths?.some((s: string) => s.includes('extraversion'));
      const hasHighCognitive = cognitiveAssessment.summary?.strengths?.some((s: string) => s.includes('analytical'));

      if (hasHighExtraversion && hasHighCognitive) {
        recommendation = 'Well-suited for leadership, client-facing, or strategic roles';
      } else if (hasHighCognitive) {
        recommendation = 'Strong candidate for analytical, technical, or research-focused positions';
      } else if (hasHighExtraversion) {
        recommendation = 'Excellent fit for sales, marketing, or team coordination roles';
      }
    }

    return recommendation;
  }

  // Employment contract operations
  async getEmploymentContracts(userId?: number): Promise<EmploymentContract[]> {
    let query = db.select().from(employmentContracts);
    
    if (userId) {
      query = query.where(eq(employmentContracts.userId, userId));
    }
    
    return await query.orderBy(desc(employmentContracts.createdAt));
  }

  async getEmploymentContract(id: number): Promise<EmploymentContract | undefined> {
    const [contract] = await db
      .select()
      .from(employmentContracts)
      .where(eq(employmentContracts.id, id));
    return contract;
  }

  async getUserPendingContract(userId: number): Promise<EmploymentContract | undefined> {
    const [contract] = await db
      .select()
      .from(employmentContracts)
      .where(and(
        eq(employmentContracts.userId, userId),
        eq(employmentContracts.status, 'pending')
      ))
      .orderBy(desc(employmentContracts.createdAt))
      .limit(1);
    return contract;
  }

  async createEmploymentContract(contractData: InsertEmploymentContract): Promise<EmploymentContract> {
    const [contract] = await db
      .insert(employmentContracts)
      .values(contractData)
      .returning();
    return contract;
  }

  async updateEmploymentContract(id: number, contractData: Partial<InsertEmploymentContract>): Promise<EmploymentContract> {
    const [contract] = await db
      .update(employmentContracts)
      .set({ ...contractData, updatedAt: new Date() })
      .where(eq(employmentContracts.id, id))
      .returning();
    return contract;
  }

  async signEmploymentContract(contractId: number, signature: string, ipAddress: string, userAgent: string): Promise<void> {
    await db
      .update(employmentContracts)
      .set({
        status: 'signed',
        signedAt: new Date(),
        digitalSignature: signature,
        ipAddress,
        userAgent,
        updatedAt: new Date()
      })
      .where(eq(employmentContracts.id, contractId));

    // Also update the user's contract status
    const contract = await this.getEmploymentContract(contractId);
    if (contract) {
      await db
        .update(users)
        .set({
          contractSigned: true,
          contractSignedAt: new Date(),
          contractVersion: `contract_${contractId}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, contract.userId));
    }
  }

  async getAllEmploymentContracts(): Promise<Array<EmploymentContract & { username: string; email: string }>> {
    const contracts = await db
      .select({
        id: employmentContracts.id,
        userId: employmentContracts.userId,
        username: users.username,
        email: users.email,
        jobTitle: employmentContracts.jobTitle,
        contractContent: employmentContracts.contractContent,
        contractType: employmentContracts.contractType,
        department: employmentContracts.department,
        salary: employmentContracts.salary,
        currency: employmentContracts.currency,
        startDate: employmentContracts.startDate,
        contractPdf: employmentContracts.contractPdf,
        status: employmentContracts.status,
        digitalSignature: employmentContracts.digitalSignature,
        signedAt: employmentContracts.signedAt,
        ipAddress: employmentContracts.ipAddress,
        userAgent: employmentContracts.userAgent,
        contractDuration: employmentContracts.contractDuration,
        workingHours: employmentContracts.workingHours,
        benefits: employmentContracts.benefits,
        createdAt: employmentContracts.createdAt,
        updatedAt: employmentContracts.updatedAt,
      })
      .from(employmentContracts)
      .leftJoin(users, eq(employmentContracts.userId, users.id))
      .orderBy(employmentContracts.createdAt);
    
    return contracts;
  }

  async deleteEmploymentContract(id: number): Promise<void> {
    await db.delete(employmentContracts).where(eq(employmentContracts.id, id));
  }

  async getUserContracts(userId: number): Promise<EmploymentContract[]> {
    return await db
      .select()
      .from(employmentContracts)
      .where(eq(employmentContracts.userId, userId))
      .orderBy(desc(employmentContracts.createdAt));
  }

  // Leave management operations (Meeting Matters manual section 6.37)
  async getLeaveBalance(employeeId: number, year: number): Promise<LeaveBalance | undefined> {
    const [balance] = await db
      .select()
      .from(leaveBalances)
      .where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year)));
    return balance;
  }

  async createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance> {
    const [created] = await db.insert(leaveBalances).values(balance).returning();
    return created;
  }

  async updateLeaveBalance(id: number, balance: Partial<InsertLeaveBalance>): Promise<LeaveBalance> {
    const [updated] = await db
      .update(leaveBalances)
      .set({ ...balance, updatedAt: new Date() })
      .where(eq(leaveBalances.id, id))
      .returning();
    return updated;
  }

  async getLeaveRequests(filters?: { employeeId?: number; status?: string }): Promise<(LeaveRequest & { employee: Employee; requester: User; approver?: User })[]> {
    const conditions = [];
    
    if (filters?.employeeId) {
      conditions.push(eq(leaveRequests.employeeId, filters.employeeId));
    }
    if (filters?.status) {
      conditions.push(eq(leaveRequests.status, filters.status as any));
    }

    const requests = await db
      .select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        requesterId: leaveRequests.requesterId,
        leaveType: leaveRequests.leaveType,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        totalDays: leaveRequests.totalDays,
        reason: leaveRequests.reason,
        coveringEmployeeId: leaveRequests.coveringEmployeeId,
        coveringEmployeeName: sql<string | null>`CASE WHEN ${leaveRequests.coveringEmployeeId} IS NOT NULL THEN (SELECT COALESCE(ce.preferred_name, u.first_name || ' ' || u.last_name) FROM employees ce INNER JOIN users u ON ce.user_id = u.id WHERE ce.id = ${leaveRequests.coveringEmployeeId}) ELSE NULL END`.as('covering_employee_name'),
        medicalCertificate: leaveRequests.medicalCertificate,
        medicalCertificateFilename: leaveRequests.medicalCertificateFilename,
        status: leaveRequests.status,
        approvedBy: leaveRequests.approvedBy,
        approvedAt: leaveRequests.approvedAt,
        rejectionReason: leaveRequests.rejectionReason,
        adminProcessed: leaveRequests.adminProcessed,
        adminProcessedBy: leaveRequests.adminProcessedBy,
        adminProcessedAt: leaveRequests.adminProcessedAt,
        bdmNotified: leaveRequests.bdmNotified,
        crmNotified: leaveRequests.crmNotified,
        approvalScreenshot: leaveRequests.approvalScreenshot,
        createdAt: leaveRequests.createdAt,
        updatedAt: leaveRequests.updatedAt,
        employee: employees,
        requester: users,
        employeeName: sql<string>`COALESCE(${employees.preferredName}, ${users.firstName} || ' ' || ${users.lastName})`.as('employee_name'),
        requesterName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('requester_name'),
        approver: sql<User | null>`CASE WHEN ${leaveRequests.approvedBy} IS NOT NULL THEN (SELECT row_to_json(u) FROM users u WHERE u.id = ${leaveRequests.approvedBy}) ELSE NULL END`.as('approver'),
      })
      .from(leaveRequests)
      .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
      .innerJoin(users, eq(leaveRequests.requesterId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(leaveRequests.createdAt));

    return requests as any;
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request;
  }

  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const [created] = await db.insert(leaveRequests).values(request).returning();
    return created;
  }

  async updateLeaveRequest(id: number, request: Partial<InsertLeaveRequest>): Promise<LeaveRequest> {
    const [updated] = await db
      .update(leaveRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(leaveRequests.id, id))
      .returning();
    return updated;
  }

  async approveLeaveRequest(id: number, approverId: number): Promise<LeaveRequest> {
    // Wrap entire approval flow in transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Get the leave request details
      const [leaveRequest] = await tx
        .select()
        .from(leaveRequests)
        .where(eq(leaveRequests.id, id));
        
      if (!leaveRequest) {
        throw new Error('Leave request not found');
      }

      // Get the employee's leave balance for the current year
      const currentYear = new Date().getFullYear();
      let [balance] = await tx
        .select()
        .from(leaveBalances)
        .where(and(
          eq(leaveBalances.employeeId, leaveRequest.employeeId),
          eq(leaveBalances.year, currentYear)
        ));
      
      // Create balance record if it doesn't exist
      if (!balance) {
        [balance] = await tx
          .insert(leaveBalances)
          .values({
            employeeId: leaveRequest.employeeId,
            year: currentYear,
          })
          .returning();
      }

      // Calculate days and verify balance availability
      const totalDays = leaveRequest.totalDays;
      
      // Determine which balance to update based on leave type
      let updatedBalance: Partial<typeof balance> = {};
      
      switch (leaveRequest.leaveType) {
        case 'sick_leave':
          const sickPaidRemaining = balance.sickLeavePaidTotal - balance.sickLeavePaidUsed;
          if (sickPaidRemaining >= totalDays) {
            updatedBalance.sickLeavePaidUsed = balance.sickLeavePaidUsed + totalDays;
          } else {
            const unpaidDays = totalDays - sickPaidRemaining;
            const sickUnpaidRemaining = balance.sickLeaveUnpaidTotal - balance.sickLeaveUnpaidUsed;
            if (unpaidDays > sickUnpaidRemaining) {
              throw new Error(`Insufficient sick leave balance. Remaining: ${sickPaidRemaining} paid, ${sickUnpaidRemaining} unpaid days`);
            }
            updatedBalance.sickLeavePaidUsed = balance.sickLeavePaidTotal;
            updatedBalance.sickLeaveUnpaidUsed = balance.sickLeaveUnpaidUsed + unpaidDays;
          }
          break;
          
        case 'casual_leave':
          const casualPaidRemaining = balance.casualLeavePaidTotal - balance.casualLeavePaidUsed;
          if (casualPaidRemaining >= totalDays) {
            updatedBalance.casualLeavePaidUsed = balance.casualLeavePaidUsed + totalDays;
          } else {
            const unpaidDays = totalDays - casualPaidRemaining;
            updatedBalance.casualLeavePaidUsed = balance.casualLeavePaidTotal;
            updatedBalance.casualLeaveUnpaidUsed = balance.casualLeaveUnpaidUsed + unpaidDays;
          }
          break;
          
        case 'bereavement_leave':
          updatedBalance.bereavementLeaveUsed = balance.bereavementLeaveUsed + totalDays;
          break;
          
        case 'public_holiday':
          updatedBalance.publicHolidaysUsed = balance.publicHolidaysUsed + totalDays;
          break;
          
        case 'unpaid_leave':
          updatedBalance.unpaidLeaveUsed = balance.unpaidLeaveUsed + totalDays;
          break;
      }

      // Update leave balance within transaction
      await tx
        .update(leaveBalances)
        .set({ ...updatedBalance, updatedAt: new Date() })
        .where(eq(leaveBalances.id, balance.id));
      
      // Approve request within same transaction
      const [updated] = await tx
        .update(leaveRequests)
        .set({
          status: 'approved' as any,
          approvedBy: approverId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leaveRequests.id, id))
        .returning();
      
      return updated;
    });
  }

  async rejectLeaveRequest(id: number, approverId: number, reason: string): Promise<LeaveRequest> {
    const [updated] = await db
      .update(leaveRequests)
      .set({
        status: 'rejected' as any,
        approvedBy: approverId,
        approvedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return updated;
  }

  async processLeaveByAdmin(id: number, adminId: number): Promise<LeaveRequest> {
    const [updated] = await db
      .update(leaveRequests)
      .set({
        adminProcessed: true,
        adminProcessedBy: adminId,
        adminProcessedAt: new Date(),
        bdmNotified: true,
        crmNotified: true,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return updated;
  }

  // Vacancy operations for HR visibility
  async getVacancies(filters?: { designation?: string; companyId?: number; status?: string }): Promise<Vacancy[]> {
    const conditions = [];
    
    if (filters?.designation) {
      conditions.push(eq(vacancies.designation, filters.designation as any));
    }
    if (filters?.companyId) {
      conditions.push(eq(vacancies.companyId, filters.companyId));
    }
    if (filters?.status) {
      conditions.push(eq(vacancies.status, filters.status));
    }

    return await db
      .select()
      .from(vacancies)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vacancies.postedDate));
  }

  async getVacancy(id: number): Promise<Vacancy | undefined> {
    const [vacancy] = await db.select().from(vacancies).where(eq(vacancies.id, id));
    return vacancy;
  }

  async createVacancy(vacancy: InsertVacancy): Promise<Vacancy> {
    const [created] = await db.insert(vacancies).values(vacancy).returning();
    return created;
  }

  async updateVacancy(id: number, vacancy: Partial<InsertVacancy>): Promise<Vacancy> {
    const [updated] = await db
      .update(vacancies)
      .set({ ...vacancy, updatedAt: new Date() })
      .where(eq(vacancies.id, id))
      .returning();
    return updated;
  }

  async deleteVacancy(id: number): Promise<void> {
    await db.delete(vacancies).where(eq(vacancies.id, id));
  }

  // CRM Inquiry operations
  async getCrmInquiries(organizationId: string, filters?: { status?: string; attendant?: string; source?: string; dateFrom?: Date; dateTo?: Date }): Promise<(CrmInquiry & { creator: User })[]> {
    const conditions = [eq(crmInquiries.organizationId, organizationId)];
    
    if (filters?.status) {
      conditions.push(eq(crmInquiries.status, filters.status as any));
    }
    if (filters?.attendant) {
      conditions.push(eq(crmInquiries.attendant, filters.attendant));
    }
    if (filters?.source) {
      conditions.push(eq(crmInquiries.inquirySource, filters.source as any));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(crmInquiries.inquiryTime, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(crmInquiries.inquiryTime, filters.dateTo));
    }

    const result = await db
      .select()
      .from(crmInquiries)
      .leftJoin(users, eq(crmInquiries.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(crmInquiries.inquiryTime));

    return result.map(row => ({
      ...row.crm_inquiries,
      creator: row.users!,
    }));
  }

  async getCrmInquiry(id: number): Promise<CrmInquiry | undefined> {
    const [inquiry] = await db.select().from(crmInquiries).where(eq(crmInquiries.id, id));
    return inquiry;
  }

  async createCrmInquiry(inquiry: InsertCrmInquiry): Promise<CrmInquiry> {
    const [created] = await db.insert(crmInquiries).values(inquiry).returning();
    return created;
  }

  async updateCrmInquiry(id: number, inquiry: Partial<InsertCrmInquiry>): Promise<CrmInquiry> {
    const [updated] = await db
      .update(crmInquiries)
      .set({ ...inquiry, updatedAt: new Date() })
      .where(eq(crmInquiries.id, id))
      .returning();
    return updated;
  }

  async deleteCrmInquiry(id: number): Promise<void> {
    await db.delete(crmInquiries).where(eq(crmInquiries.id, id));
  }

  // Organizational Hierarchy operations
  async getOrgUnits(organizationId: string, filters?: { companyId?: number; isActive?: boolean }): Promise<OrgUnit[]> {
    const conditions = [eq(orgUnits.organizationId, organizationId)];
    
    if (filters?.companyId !== undefined) {
      conditions.push(eq(orgUnits.companyId, filters.companyId));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(orgUnits.isActive, filters.isActive));
    }

    return await db
      .select()
      .from(orgUnits)
      .where(and(...conditions))
      .orderBy(orgUnits.orderIndex);
  }

  async getOrgUnit(id: number): Promise<OrgUnit | undefined> {
    const [unit] = await db.select().from(orgUnits).where(eq(orgUnits.id, id));
    return unit;
  }

  async createOrgUnit(unit: InsertOrgUnit): Promise<OrgUnit> {
    const [created] = await db.insert(orgUnits).values(unit).returning();
    return created;
  }

  async updateOrgUnit(id: number, unit: Partial<InsertOrgUnit>): Promise<OrgUnit> {
    const [updated] = await db
      .update(orgUnits)
      .set({ ...unit, updatedAt: new Date() })
      .where(eq(orgUnits.id, id))
      .returning();
    return updated;
  }

  async deleteOrgUnit(id: number): Promise<void> {
    await db.delete(orgUnits).where(eq(orgUnits.id, id));
  }

  async getOrgHierarchy(organizationId: string, companyId?: number): Promise<(OrgUnit & { employees: (Employee & { user: User })[] })[]> {
    const conditions = [eq(orgUnits.organizationId, organizationId), eq(orgUnits.isActive, true)];
    
    if (companyId !== undefined) {
      conditions.push(eq(orgUnits.companyId, companyId));
    }

    const units = await db
      .select()
      .from(orgUnits)
      .where(and(...conditions))
      .orderBy(orgUnits.orderIndex);

    // Get all employees for these units
    const unitIds = units.map(u => u.id);
    const assignments = unitIds.length > 0 ? await db
      .select()
      .from(orgUnitAssignments)
      .leftJoin(employees, eq(orgUnitAssignments.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .where(
        and(
          inArray(orgUnitAssignments.orgUnitId, unitIds),
          eq(orgUnitAssignments.isPrimary, true),
          or(
            isNull(orgUnitAssignments.effectiveTo),
            gte(orgUnitAssignments.effectiveTo, new Date())
          )
        )
      ) : [];

    // Map employees to their units
    const result = units.map(unit => {
      const unitEmployees = assignments
        .filter(a => a.org_unit_assignments?.orgUnitId === unit.id)
        .map(a => ({
          ...a.employees!,
          user: a.users!,
        }));

      return {
        ...unit,
        employees: unitEmployees,
      };
    });

    return result;
  }

  async assignEmployeeToOrgUnit(assignment: InsertOrgUnitAssignment): Promise<OrgUnitAssignment> {
    // If this is a primary assignment, clear any existing primary assignments for this employee
    if (assignment.isPrimary) {
      await db
        .update(orgUnitAssignments)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(
          and(
            eq(orgUnitAssignments.employeeId, assignment.employeeId),
            eq(orgUnitAssignments.isPrimary, true)
          )
        );
    }

    const [created] = await db.insert(orgUnitAssignments).values(assignment).returning();
    return created;
  }

  async getOrgUnitForEmployee(employeeId: number): Promise<(OrgUnitAssignment & { orgUnit: OrgUnit }) | undefined> {
    const result = await db
      .select()
      .from(orgUnitAssignments)
      .leftJoin(orgUnits, eq(orgUnitAssignments.orgUnitId, orgUnits.id))
      .where(
        and(
          eq(orgUnitAssignments.employeeId, employeeId),
          eq(orgUnitAssignments.isPrimary, true),
          or(
            isNull(orgUnitAssignments.effectiveTo),
            gte(orgUnitAssignments.effectiveTo, new Date())
          )
        )
      );

    if (result.length === 0 || !result[0].org_units) return undefined;

    return {
      ...result[0].org_unit_assignments,
      orgUnit: result[0].org_units,
    };
  }

  async getEmployeesInOrgUnit(orgUnitId: number): Promise<(OrgUnitAssignment & { employee: Employee & { user: User } })[]> {
    const result = await db
      .select()
      .from(orgUnitAssignments)
      .leftJoin(employees, eq(orgUnitAssignments.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .where(
        and(
          eq(orgUnitAssignments.orgUnitId, orgUnitId),
          or(
            isNull(orgUnitAssignments.effectiveTo),
            gte(orgUnitAssignments.effectiveTo, new Date())
          )
        )
      )
      .orderBy(orgUnitAssignments.effectiveFrom);

    return result.map(row => ({
      ...row.org_unit_assignments,
      employee: {
        ...row.employees!,
        user: row.users!,
      },
    }));
  }

  async removeEmployeeFromOrgUnit(employeeId: number, orgUnitId: number): Promise<void> {
    await db
      .update(orgUnitAssignments)
      .set({ effectiveTo: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(orgUnitAssignments.employeeId, employeeId),
          eq(orgUnitAssignments.orgUnitId, orgUnitId)
        )
      );
  }

  // ===== MEETING MATTERS STUDIO IMPLEMENTATIONS =====

  // Studio Meetings
  async getStudioMeetings(filters?: { status?: string; startDate?: Date; endDate?: Date; organizerId?: number }): Promise<(StudioMeeting & { organizer: User; attendeeCount: number })[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(studioMeetings.status, filters.status as any));
    if (filters?.startDate) conditions.push(gte(studioMeetings.scheduledStartTime, filters.startDate));
    if (filters?.endDate) conditions.push(lte(studioMeetings.scheduledStartTime, filters.endDate));
    if (filters?.organizerId) conditions.push(eq(studioMeetings.organizerId, filters.organizerId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const meetings = await db
      .select({
        meeting: studioMeetings,
        organizer: users,
      })
      .from(studioMeetings)
      .leftJoin(users, eq(studioMeetings.organizerId, users.id))
      .where(whereClause)
      .orderBy(desc(studioMeetings.scheduledStartTime));

    const meetingsWithCounts = await Promise.all(
      meetings.map(async ({ meeting, organizer }) => {
        const attendees = await db
          .select()
          .from(meetingAttendees)
          .where(eq(meetingAttendees.meetingId, meeting.id));

        return {
          ...meeting,
          organizer: organizer!,
          attendeeCount: attendees.length,
        };
      })
    );

    return meetingsWithCounts;
  }

  async getStudioMeeting(id: number): Promise<(StudioMeeting & { organizer: User; attendees: (MeetingAttendee & { user: User })[]; notes: MeetingNote[] }) | undefined> {
    const [result] = await db
      .select({
        meeting: studioMeetings,
        organizer: users,
      })
      .from(studioMeetings)
      .leftJoin(users, eq(studioMeetings.organizerId, users.id))
      .where(eq(studioMeetings.id, id));

    if (!result || !result.organizer) return undefined;

    const attendees = await this.getMeetingAttendees(id);
    const notes = await this.getMeetingNotes(id);

    return {
      ...result.meeting,
      organizer: result.organizer,
      attendees,
      notes,
    };
  }

  async createStudioMeeting(meeting: InsertStudioMeeting): Promise<StudioMeeting> {
    const [created] = await db.insert(studioMeetings).values(meeting).returning();
    return created;
  }

  async updateStudioMeeting(id: number, meeting: Partial<InsertStudioMeeting>): Promise<StudioMeeting> {
    const [updated] = await db
      .update(studioMeetings)
      .set({ ...meeting, updatedAt: new Date() })
      .where(eq(studioMeetings.id, id))
      .returning();
    return updated;
  }

  async deleteStudioMeeting(id: number): Promise<void> {
    await db.delete(studioMeetings).where(eq(studioMeetings.id, id));
  }

  // Meeting Attendees
  async addMeetingAttendee(attendee: InsertMeetingAttendee): Promise<MeetingAttendee> {
    const [created] = await db.insert(meetingAttendees).values(attendee).returning();
    return created;
  }

  async updateMeetingAttendee(id: number, attendee: Partial<InsertMeetingAttendee>): Promise<MeetingAttendee> {
    const [updated] = await db
      .update(meetingAttendees)
      .set({ ...attendee, updatedAt: new Date() })
      .where(eq(meetingAttendees.id, id))
      .returning();
    return updated;
  }

  async removeMeetingAttendee(id: number): Promise<void> {
    await db.delete(meetingAttendees).where(eq(meetingAttendees.id, id));
  }

  async getMeetingAttendees(meetingId: number): Promise<(MeetingAttendee & { user: User })[]> {
    const results = await db
      .select({
        attendee: meetingAttendees,
        user: users,
      })
      .from(meetingAttendees)
      .leftJoin(users, eq(meetingAttendees.userId, users.id))
      .where(eq(meetingAttendees.meetingId, meetingId));

    return results.map(r => ({ ...r.attendee, user: r.user! }));
  }

  // Meeting Notes & Action Items
  async createMeetingNote(note: InsertMeetingNote): Promise<MeetingNote> {
    const [created] = await db.insert(meetingNotes).values(note).returning();
    return created;
  }

  async updateMeetingNote(id: number, note: Partial<InsertMeetingNote>): Promise<MeetingNote> {
    const [updated] = await db
      .update(meetingNotes)
      .set({ ...note, updatedAt: new Date() })
      .where(eq(meetingNotes.id, id))
      .returning();
    return updated;
  }

  async deleteMeetingNote(id: number): Promise<void> {
    await db.delete(meetingNotes).where(eq(meetingNotes.id, id));
  }

  async getMeetingNotes(meetingId: number): Promise<(MeetingNote & { assignedToUser?: User; createdByUser: User })[]> {
    const results = await db
      .select({
        note: meetingNotes,
        assignedToUser: users,
        createdByUser: users,
      })
      .from(meetingNotes)
      .leftJoin(users, eq(meetingNotes.assignedTo, users.id))
      .where(eq(meetingNotes.meetingId, meetingId));

    // Need to fetch createdByUser separately
    const notesWithCreators = await Promise.all(
      results.map(async (r) => {
        const [creator] = await db.select().from(users).where(eq(users.id, r.note.createdBy));
        return {
          ...r.note,
          assignedToUser: r.assignedToUser || undefined,
          createdByUser: creator,
        };
      })
    );

    return notesWithCreators;
  }

  // Meeting Work Items - Post-meeting outcomes tracking
  async createMeetingWorkItem(workItem: InsertMeetingWorkItem): Promise<MeetingWorkItem> {
    const [created] = await db.insert(meetingWorkItems).values(workItem).returning();
    return created;
  }

  async updateMeetingWorkItem(id: number, workItem: Partial<InsertMeetingWorkItem>): Promise<MeetingWorkItem> {
    const [updated] = await db
      .update(meetingWorkItems)
      .set({ ...workItem, updatedAt: new Date() })
      .where(eq(meetingWorkItems.id, id))
      .returning();
    return updated;
  }

  async deleteMeetingWorkItem(id: number): Promise<void> {
    await db.delete(meetingWorkItems).where(eq(meetingWorkItems.id, id));
  }

  async getMeetingWorkItems(meetingId: number): Promise<(MeetingWorkItem & { assignedToUser?: User; createdByUser: User; linkCount: number })[]> {
    const items = await db
      .select()
      .from(meetingWorkItems)
      .where(eq(meetingWorkItems.meetingId, meetingId))
      .orderBy(desc(meetingWorkItems.createdAt));

    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const [creator] = await db.select().from(users).where(eq(users.id, item.createdBy));
        let assignedToUser = undefined;
        if (item.assignedTo) {
          const [assigned] = await db.select().from(users).where(eq(users.id, item.assignedTo));
          assignedToUser = assigned;
        }
        
        const linkCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(meetingLinks)
          .where(eq(meetingLinks.workItemId, item.id));

        return {
          ...item,
          createdByUser: creator,
          assignedToUser,
          linkCount: Number(linkCount[0]?.count || 0),
        };
      })
    );

    return itemsWithDetails;
  }

  async getPreviousMeetingWork(meetingId: number): Promise<{ previousMeeting: StudioMeeting | null; workItems: (MeetingWorkItem & { assignedToUser?: User; createdByUser: User })[] }> {
    // First, get the current meeting with its organizer's organizationId
    const currentMeetingWithOrg = await db
      .select({
        meeting: studioMeetings,
        organizationId: users.organizationId,
      })
      .from(studioMeetings)
      .innerJoin(users, eq(studioMeetings.organizerId, users.id))
      .where(eq(studioMeetings.id, meetingId))
      .limit(1);

    if (currentMeetingWithOrg.length === 0 || !currentMeetingWithOrg[0].organizationId) {
      return { previousMeeting: null, workItems: [] };
    }

    const currentMeeting = currentMeetingWithOrg[0].meeting;
    const currentOrgId = currentMeetingWithOrg[0].organizationId;

    // Find the previous meeting (chronologically earlier, same organization, same campaign/project if applicable)
    const previousMeetingsWithOrg = await db
      .select({
        meeting: studioMeetings,
      })
      .from(studioMeetings)
      .innerJoin(users, eq(studioMeetings.organizerId, users.id))
      .where(
        and(
          lt(studioMeetings.scheduledStartTime, currentMeeting.scheduledStartTime),
          eq(users.organizationId, currentOrgId), // CRITICAL: Organization isolation
          // Match campaign/project context if set
          currentMeeting.campaignId ? eq(studioMeetings.campaignId, currentMeeting.campaignId) : undefined,
          currentMeeting.projectId ? eq(studioMeetings.projectId, currentMeeting.projectId) : undefined
        )
      )
      .orderBy(desc(studioMeetings.scheduledStartTime))
      .limit(1);

    const previousMeeting = previousMeetingsWithOrg.length > 0 ? previousMeetingsWithOrg[0].meeting : null;

    if (!previousMeeting) {
      return { previousMeeting: null, workItems: [] };
    }

    // Fetch completed work items from the previous meeting
    const items = await db
      .select()
      .from(meetingWorkItems)
      .where(
        and(
          eq(meetingWorkItems.meetingId, previousMeeting.id),
          eq(meetingWorkItems.status, 'completed')
        )
      )
      .orderBy(desc(meetingWorkItems.completionDate));

    // Add user details to work items
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const [creator] = await db.select().from(users).where(eq(users.id, item.createdBy));
        let assignedToUser = undefined;
        if (item.assignedTo) {
          const [assigned] = await db.select().from(users).where(eq(users.id, item.assignedTo));
          assignedToUser = assigned;
        }

        return {
          ...item,
          createdByUser: creator,
          assignedToUser,
        };
      })
    );

    return {
      previousMeeting,
      workItems: itemsWithDetails,
    };
  }

  // Meeting Links - Related links and resources
  async createMeetingLink(link: InsertMeetingLink): Promise<MeetingLink> {
    const [created] = await db.insert(meetingLinks).values(link).returning();
    return created;
  }

  async updateMeetingLink(id: number, link: Partial<InsertMeetingLink>): Promise<MeetingLink> {
    const [updated] = await db
      .update(meetingLinks)
      .set({ ...link, updatedAt: new Date() })
      .where(eq(meetingLinks.id, id))
      .returning();
    return updated;
  }

  async deleteMeetingLink(id: number): Promise<void> {
    await db.delete(meetingLinks).where(eq(meetingLinks.id, id));
  }

  async getMeetingLinks(meetingId: number): Promise<(MeetingLink & { createdByUser: User })[]> {
    const links = await db
      .select()
      .from(meetingLinks)
      .where(eq(meetingLinks.meetingId, meetingId))
      .orderBy(desc(meetingLinks.createdAt));

    const linksWithCreators = await Promise.all(
      links.map(async (link) => {
        const [creator] = await db.select().from(users).where(eq(users.id, link.createdBy));
        return {
          ...link,
          createdByUser: creator,
        };
      })
    );

    return linksWithCreators;
  }

  // Creative Briefs
  async getCreativeBriefs(filters?: { status?: string; assignedTo?: number; campaignId?: number }): Promise<(CreativeBrief & { creator: User; assignee?: User })[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(creativeBriefs.status, filters.status as any));
    if (filters?.assignedTo) conditions.push(eq(creativeBriefs.assignedTo, filters.assignedTo));
    if (filters?.campaignId) conditions.push(eq(creativeBriefs.campaignId, filters.campaignId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        brief: creativeBriefs,
        creator: users,
      })
      .from(creativeBriefs)
      .leftJoin(users, eq(creativeBriefs.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(creativeBriefs.createdAt));

    const briefsWithAssignees = await Promise.all(
      results.map(async (r) => {
        let assignee = undefined;
        if (r.brief.assignedTo) {
          const [user] = await db.select().from(users).where(eq(users.id, r.brief.assignedTo));
          assignee = user;
        }
        return {
          ...r.brief,
          creator: r.creator!,
          assignee,
        };
      })
    );

    return briefsWithAssignees;
  }

  async getCreativeBrief(id: number): Promise<CreativeBrief | undefined> {
    const [brief] = await db.select().from(creativeBriefs).where(eq(creativeBriefs.id, id));
    return brief;
  }

  async createCreativeBrief(brief: InsertCreativeBrief): Promise<CreativeBrief> {
    const [created] = await db.insert(creativeBriefs).values(brief).returning();
    return created;
  }

  async updateCreativeBrief(id: number, brief: Partial<InsertCreativeBrief>): Promise<CreativeBrief> {
    const [updated] = await db
      .update(creativeBriefs)
      .set({ ...brief, updatedAt: new Date() })
      .where(eq(creativeBriefs.id, id))
      .returning();
    return updated;
  }

  async deleteCreativeBrief(id: number): Promise<void> {
    await db.delete(creativeBriefs).where(eq(creativeBriefs.id, id));
  }

  // Analytics Entries
  async getAnalyticsEntries(filters?: { platform?: string; campaignId?: number }): Promise<AnalyticsEntry[]> {
    const conditions = [];
    if (filters?.platform) conditions.push(eq(analyticsEntries.platform, filters.platform as any));
    if (filters?.campaignId) conditions.push(eq(analyticsEntries.campaignId, filters.campaignId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const entries = await db
      .select()
      .from(analyticsEntries)
      .where(whereClause)
      .orderBy(desc(analyticsEntries.postDate));

    return entries;
  }

  async getAnalyticsEntry(id: number): Promise<AnalyticsEntry | undefined> {
    const [entry] = await db.select().from(analyticsEntries).where(eq(analyticsEntries.id, id));
    return entry;
  }

  async createAnalyticsEntry(entry: InsertAnalyticsEntry): Promise<AnalyticsEntry> {
    const [created] = await db.insert(analyticsEntries).values(entry).returning();
    return created;
  }

  async updateAnalyticsEntry(id: number, entry: Partial<InsertAnalyticsEntry>): Promise<AnalyticsEntry> {
    const [updated] = await db
      .update(analyticsEntries)
      .set({ ...entry, updatedAt: new Date() })
      .where(eq(analyticsEntries.id, id))
      .returning();
    return updated;
  }

  async deleteAnalyticsEntry(id: number): Promise<void> {
    await db.delete(analyticsEntries).where(eq(analyticsEntries.id, id));
  }

  // Asset Library
  async getAssetLibrary(filters?: { assetType?: string; category?: string; createdBy?: number }): Promise<(AssetLibrary & { creator: User })[]> {
    const conditions = [];
    if (filters?.assetType) conditions.push(eq(assetLibrary.assetType, filters.assetType as any));
    if (filters?.category) conditions.push(eq(assetLibrary.category, filters.category));
    if (filters?.createdBy) conditions.push(eq(assetLibrary.createdBy, filters.createdBy));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        asset: assetLibrary,
        creator: users,
      })
      .from(assetLibrary)
      .leftJoin(users, eq(assetLibrary.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(assetLibrary.createdAt));

    return results.map(r => ({ ...r.asset, creator: r.creator! }));
  }

  async getAsset(id: number): Promise<AssetLibrary | undefined> {
    const [asset] = await db.select().from(assetLibrary).where(eq(assetLibrary.id, id));
    return asset;
  }

  async createAsset(asset: InsertAssetLibrary): Promise<AssetLibrary> {
    const [created] = await db.insert(assetLibrary).values(asset).returning();
    return created;
  }

  async updateAsset(id: number, asset: Partial<InsertAssetLibrary>): Promise<AssetLibrary> {
    const [updated] = await db
      .update(assetLibrary)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(assetLibrary.id, id))
      .returning();
    return updated;
  }

  async deleteAsset(id: number): Promise<void> {
    await db.delete(assetLibrary).where(eq(assetLibrary.id, id));
  }

  // Approval Workflows
  async getApprovalWorkflows(filters?: { status?: string; itemType?: string; requesterId?: number }): Promise<(ApprovalWorkflow & { requester: User; currentApproverUser?: User })[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(approvalWorkflows.status, filters.status as any));
    if (filters?.itemType) conditions.push(eq(approvalWorkflows.itemType, filters.itemType));
    if (filters?.requesterId) conditions.push(eq(approvalWorkflows.requester, filters.requesterId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        workflow: approvalWorkflows,
        requester: users,
      })
      .from(approvalWorkflows)
      .leftJoin(users, eq(approvalWorkflows.requester, users.id))
      .where(whereClause)
      .orderBy(desc(approvalWorkflows.createdAt));

    const workflowsWithApprovers = await Promise.all(
      results.map(async (r) => {
        let currentApproverUser = undefined;
        if (r.workflow.currentApprover) {
          const [user] = await db.select().from(users).where(eq(users.id, r.workflow.currentApprover));
          currentApproverUser = user;
        }
        return {
          ...r.workflow,
          requester: r.requester!,
          currentApproverUser,
        };
      })
    );

    return workflowsWithApprovers;
  }

  async getApprovalWorkflow(id: number): Promise<ApprovalWorkflow | undefined> {
    const [workflow] = await db.select().from(approvalWorkflows).where(eq(approvalWorkflows.id, id));
    return workflow;
  }

  async createApprovalWorkflow(workflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow> {
    const [created] = await db.insert(approvalWorkflows).values(workflow).returning();
    return created;
  }

  async updateApprovalWorkflow(id: number, workflow: Partial<InsertApprovalWorkflow>): Promise<ApprovalWorkflow> {
    const [updated] = await db
      .update(approvalWorkflows)
      .set({ ...workflow, updatedAt: new Date() })
      .where(eq(approvalWorkflows.id, id))
      .returning();
    return updated;
  }

  async approveWorkflowStep(id: number, approverId: number): Promise<ApprovalWorkflow> {
    const workflow = await this.getApprovalWorkflow(id);
    if (!workflow) throw new Error('Workflow not found');

    const approvedBy = workflow.approvedBy as any[] || [];
    approvedBy.push({ approverId, timestamp: new Date() });

    const nextStep = workflow.currentStep + 1;
    const isCompleted = nextStep > workflow.totalSteps;

    const [updated] = await db
      .update(approvalWorkflows)
      .set({
        approvedBy,
        currentStep: nextStep,
        status: isCompleted ? 'approved' : 'pending',
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(approvalWorkflows.id, id))
      .returning();

    return updated;
  }

  async rejectWorkflow(id: number, rejectorId: number, reason: string): Promise<ApprovalWorkflow> {
    const [updated] = await db
      .update(approvalWorkflows)
      .set({
        status: 'rejected',
        rejectedBy: rejectorId,
        rejectionReason: reason,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(approvalWorkflows.id, id))
      .returning();

    return updated;
  }

  // Studio Reports
  async getStudioReports(filters?: { reportType?: string; startDate?: Date; endDate?: Date }): Promise<StudioReport[]> {
    const conditions = [];
    if (filters?.reportType) conditions.push(eq(studioReports.reportType, filters.reportType));
    if (filters?.startDate) conditions.push(gte(studioReports.startDate, filters.startDate));
    if (filters?.endDate) conditions.push(lte(studioReports.endDate, filters.endDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(studioReports)
      .where(whereClause)
      .orderBy(desc(studioReports.createdAt));
  }

  async getStudioReport(id: number): Promise<StudioReport | undefined> {
    const [report] = await db.select().from(studioReports).where(eq(studioReports.id, id));
    return report;
  }

  async createStudioReport(report: InsertStudioReport): Promise<StudioReport> {
    const [created] = await db.insert(studioReports).values(report).returning();
    return created;
  }

  async updateStudioReport(id: number, report: Partial<InsertStudioReport>): Promise<StudioReport> {
    const [updated] = await db
      .update(studioReports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(studioReports.id, id))
      .returning();
    return updated;
  }

  async deleteStudioReport(id: number): Promise<void> {
    await db.delete(studioReports).where(eq(studioReports.id, id));
  }

  async generateStudioReport(reportType: string, startDate: Date, endDate: Date, generatedBy?: number): Promise<StudioReport> {
    // Get all relevant data for the reporting period
    const [campaigns, meetings, content, briefs, assets] = await Promise.all([
      db.select().from(socialMediaCampaigns)
        .where(and(
          gte(socialMediaCampaigns.createdAt, startDate),
          lte(socialMediaCampaigns.createdAt, endDate)
        )),
      db.select().from(studioMeetings)
        .where(and(
          gte(studioMeetings.scheduledStartTime, startDate),
          lte(studioMeetings.scheduledStartTime, endDate)
        )),
      db.select().from(contentCalendar)
        .where(and(
          gte(contentCalendar.scheduledDate, startDate),
          lte(contentCalendar.scheduledDate, endDate)
        )),
      db.select().from(creativeBriefs)
        .where(and(
          gte(creativeBriefs.createdAt, startDate),
          lte(creativeBriefs.createdAt, endDate)
        )),
      db.select().from(assetLibrary)
        .where(and(
          gte(assetLibrary.createdAt, startDate),
          lte(assetLibrary.createdAt, endDate)
        ))
    ]);

    // Calculate statistics
    const reportData: InsertStudioReport = {
      reportType,
      reportPeriod: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      startDate,
      endDate,
      totalCampaigns: campaigns.length,
      totalContent: content.length,
      totalMeetings: meetings.length,
      totalBriefsCreated: briefs.length,
      totalBriefsCompleted: briefs.filter(b => b.status === 'completed').length,
      totalAssetsCreated: assets.length,
      contentPublished: content.filter(c => c.status === 'published').length,
      contentInReview: content.filter(c => c.status === 'in_review').length,
      contentDrafts: content.filter(c => c.status === 'draft').length,
      generatedBy,
      generatedAt: new Date(),
    };

    const [created] = await db.insert(studioReports).values(reportData).returning();
    return created;
  }

  // Dashboard Sections - Customizable dashboard widgets
  async getDashboardSections(organizationId: string, visibleOnly = false): Promise<(DashboardSection & { creator?: User })[]> {
    let query = db
      .select({
        dashboardSection: dashboardSections,
        creator: users,
      })
      .from(dashboardSections)
      .leftJoin(users, eq(dashboardSections.createdBy, users.id))
      .where(eq(dashboardSections.organizationId, organizationId))
      .orderBy(asc(dashboardSections.displayOrder));

    if (visibleOnly) {
      query = query.where(and(
        eq(dashboardSections.organizationId, organizationId),
        eq(dashboardSections.isVisible, true)
      )) as any;
    }

    const results = await query;
    
    return results.map(row => ({
      ...row.dashboardSection,
      creator: row.creator || undefined,
    }));
  }

  async getDashboardSection(id: number): Promise<DashboardSection | undefined> {
    const [section] = await db
      .select()
      .from(dashboardSections)
      .where(eq(dashboardSections.id, id));
    return section;
  }

  async createDashboardSection(section: InsertDashboardSection): Promise<DashboardSection> {
    const [created] = await db
      .insert(dashboardSections)
      .values(section)
      .returning();
    return created;
  }

  async updateDashboardSection(id: number, section: Partial<InsertDashboardSection>): Promise<DashboardSection> {
    const [updated] = await db
      .update(dashboardSections)
      .set({ ...section, updatedAt: new Date() })
      .where(eq(dashboardSections.id, id))
      .returning();
    return updated;
  }

  async deleteDashboardSection(id: number): Promise<void> {
    await db
      .delete(dashboardSections)
      .where(eq(dashboardSections.id, id));
  }

  async reorderDashboardSections(organizationId: string, sectionOrders: { id: number; displayOrder: number }[]): Promise<void> {
    // Update each section's display order in a transaction
    await Promise.all(
      sectionOrders.map(({ id, displayOrder }) =>
        db
          .update(dashboardSections)
          .set({ displayOrder, updatedAt: new Date() })
          .where(and(
            eq(dashboardSections.id, id),
            eq(dashboardSections.organizationId, organizationId)
          ))
      )
    );
  }

  async seedDefaultDashboardSections(organizationId: string): Promise<void> {
    // Check if sections already exist for this organization
    const existingSections = await this.getDashboardSections(organizationId);
    if (existingSections.length > 0) {
      return; // Already seeded
    }

    // Create three default sections
    const defaultSections: InsertDashboardSection[] = [
      {
        title: "Upcoming Video Shoots",
        description: "Video content scheduled for production in the next 7 days",
        layout: "timeline",
        dataSource: "content_calendar",
        queryConfig: {
          contentType: "video",
          dateRange: "next_7_days",
          sortBy: "scheduledDate",
          limit: 10
        },
        presentationConfig: {
          fields: ["title", "scheduledDate", "platform", "assignedTo"],
          showTimeline: true
        },
        organizationId,
        displayOrder: 0,
        isVisible: true,
      },
      {
        title: "Active Campaigns",
        description: "Currently running and planned marketing campaigns",
        layout: "cards",
        dataSource: "campaigns",
        queryConfig: {
          status: ["active", "planning"],
          sortBy: "startDate",
          limit: 10
        },
        presentationConfig: {
          fields: ["name", "status", "objective", "platforms", "startDate", "endDate"],
          showStatusBadge: true
        },
        organizationId,
        displayOrder: 1,
        isVisible: true,
      },
      {
        title: "Campaign Performance",
        description: "Key metrics and analytics for campaigns",
        layout: "table",
        dataSource: "analytics",
        queryConfig: {
          sortBy: "impressions",
          sortOrder: "desc",
          limit: 5
        },
        presentationConfig: {
          fields: ["campaignName", "impressions", "engagements", "engagementRate", "clickThroughRate", "conversions"],
          showMetrics: true,
          calculateRates: true
        },
        organizationId,
        displayOrder: 2,
        isVisible: true,
      }
    ];

    // Insert all default sections
    await Promise.all(
      defaultSections.map(section => this.createDashboardSection(section))
    );
  }
}

// Initialize session store
export let sessionStore: any;
if (process.env.DATABASE_URL) {
  sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
}

export const storage = new DatabaseStorage();