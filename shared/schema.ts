import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  pgEnum,
  decimal,
  bigint,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", [
  "hr_admin",
  "branch_manager", 
  "team_lead",
  "employee",
  "logistics_manager",
  "department_head",
  "project_manager",
  "social_media_manager",
  "content_creator",
  "content_editor",
  "social_media_specialist",
  "creative_director"
]);

// User status enum
export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "onboarding",
  "terminated",
  "pending_approval"
]);

// Department enum for structured department management
export const departmentEnum = pgEnum("department_type", [
  "human_resources",
  "information_technology", 
  "finance_accounting",
  "sales_marketing",
  "operations",
  "customer_service",
  "research_development",
  "legal_compliance",
  "executive_management",
  "facilities_maintenance",
  "social_media_content"
]);

// Task status enum
export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "overdue"
]);

// Application status enum
export const applicationStatusEnum = pgEnum("application_status", [
  "submitted",
  "under_review", 
  "interview_scheduled",
  "accepted",
  "rejected",
  "withdrawn"
]);

// Task priority enum
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent"
]);

// Project status enum
export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "active",
  "on_hold",
  "completed",
  "cancelled"
]);

// Subscription status enum
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled", 
  "past_due",
  "unpaid",
  "trialing",
  "incomplete"
]);

// Subscription plan enum
export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "starter",
  "professional", 
  "enterprise"
]);

export const trialStatusEnum = pgEnum("trial_status", [
  "pending",
  "approved", 
  "rejected",
  "expired"
]);

// Permission module enum
export const permissionModuleEnum = pgEnum("permission_module", [
  "employee_management",
  "contract_management",
  "announcements",
  "leave_management"
]);

// Permission level enum
export const permissionLevelEnum = pgEnum("permission_level", [
  "view",
  "manage"
]);

// Users table for session-based authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("employee").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  department: varchar("department"),
  position: varchar("position"),
  managerId: integer("manager_id"),
  companyId: integer("company_id"), // Links to company (Qanzak Global or Meeting Matters Clinic)
  startDate: timestamp("start_date"),
  onboardingToken: varchar("onboarding_token"),
  onboardingStatus: varchar("onboarding_status").default("pending"),
  onboardingProgress: integer("onboarding_progress").default(0),
  contractSigned: boolean("contract_signed").default(false),
  contractSignedAt: timestamp("contract_signed_at"),
  contractVersion: varchar("contract_version"),
  accountEnabled: boolean("account_enabled").default(false),
  // CRM Access Control
  hasCrmAccess: boolean("has_crm_access").default(false),
  // Job Applications Access Control
  hasJobApplicationsAccess: boolean("has_job_applications_access").default(false),
  // Organization isolation for multi-tenancy
  organizationId: varchar("organization_id"), // Links user to their organization
  // Stripe subscription fields
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  // Trial fields for SaaS functionality
  trialEndDate: timestamp("trial_end_date"),
  companyName: varchar("company_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Permissions table - for granular module access control
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  module: permissionModuleEnum("module").notNull(),
  level: permissionLevelEnum("level").notNull(),
  grantedBy: integer("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  projectManagerId: integer("project_manager_id").references(() => users.id), // Made optional to support multiple managers via projectMembers
  status: projectStatusEnum("status").default("planning").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: decimal("budget"),
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  clientName: varchar("client_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project member roles enum
export const projectMemberRoleEnum = pgEnum("project_member_role", [
  "member",
  "manager",
  "lead", 
  "coordinator",
  "developer",
  "designer",
  "tester",
  "analyst"
]);

// Project members table (many-to-many relationship)
export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: varchar("role").default("member").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project tasks table (extending the existing tasks table with project context)
export const projectTasks = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to").references(() => users.id),
  assignedBy: integer("assigned_by").references(() => users.id),
  status: taskStatusEnum("status").default("pending").notNull(),
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  startDate: timestamp("start_date", { mode: 'string' }),
  dueDate: timestamp("due_date", { mode: 'string' }),
  completedAt: timestamp("completed_at", { mode: 'string' }),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  overdueExplanation: text("overdue_explanation"),
  overdueNotificationSent: timestamp("overdue_notification_sent"),
  dueDateExtended: timestamp("due_date_extended"),
  extensionReason: text("extension_reason"),
  extensionGrantedBy: integer("extension_granted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Companies table for managing multiple companies within an organization
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  logo: varchar("logo"),
  industry: varchar("industry"),
  website: varchar("website"),
  address: text("address"),
  phone: varchar("phone"),
  email: varchar("email"),
  organizationId: varchar("organization_id"), // Links to parent organization for multi-tenancy
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Departments table for department management
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  code: varchar("code").unique().notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  managerId: integer("manager_id").references(() => users.id),
  budgetAllocated: decimal("budget_allocated"),
  headcount: integer("headcount").default(0),
  location: varchar("location"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Designations enum for organizational hierarchy (from Meeting Matters manual)
export const designationEnum = pgEnum("designation", [
  "ceo",
  "clinic_director",
  "business_development_manager",
  "administrative_manager",
  "administrative_assistant",
  "client_relation_manager",
  "accounts_manager",
  "it_manager",
  "hr_manager",
  "documentation_manager",
  "psychologist",
  "therapist",
  "counsellor"
]);

// Leave types enum (from Meeting Matters manual section 6.37)
export const leaveTypeEnum = pgEnum("leave_type", [
  "sick_leave",
  "casual_leave",
  "public_holiday",
  "bereavement_leave",
  "unpaid_leave"
]);

// Leave status enum
export const leaveStatusEnum = pgEnum("leave_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled"
]);

// Employees table for additional employee data
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organizationId: varchar("organization_id").notNull(), // Multi-tenant isolation
  companyId: integer("company_id"), // Links to company (Qanzak Global or Meeting Matters Clinic)
  employeeId: varchar("employee_id").notNull(),
  phoneNumber: varchar("phone_number"),
  address: text("address"),
  emergencyContact: jsonb("emergency_contact"),
  onboardingStatus: varchar("onboarding_status").default("not_started"),
  onboardingProgress: integer("onboarding_progress").default(0),
  onboardingLink: varchar("onboarding_link"),
  
  // Organizational structure (Meeting Matters hierarchy)
  designation: designationEnum("designation"),
  responsibilities: text("responsibilities"), // Job responsibilities and duties
  responsibilityDocuments: jsonb("responsibility_documents"), // Array of uploaded documents {filename, url, type, size, uploadedAt}
  
  // Extended personal profile fields
  preferredName: varchar("preferred_name"),
  dateOfBirth: varchar("date_of_birth"),
  gender: varchar("gender"), // 'male', 'female', 'other', 'prefer_not_to_say'
  maritalStatus: varchar("marital_status"), // 'single', 'married', 'divorced', 'widowed', 'separated'
  nationality: varchar("nationality"),
  personalEmail: varchar("personal_email"),
  alternatePhone: varchar("alternate_phone"),
  
  // Address details
  currentAddress: text("current_address"),
  permanentAddress: text("permanent_address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  country: varchar("country"),
  
  // Emergency contact details
  emergencyContactName: varchar("emergency_contact_name"),
  emergencyContactRelation: varchar("emergency_contact_relation"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  emergencyContactAddress: text("emergency_contact_address"),
  
  // Employment information
  position: varchar("position"),
  department: varchar("department"),
  startDate: varchar("start_date"),
  employmentType: varchar("employment_type"), // 'full_time', 'part_time', 'contract', 'internship'
  workLocation: varchar("work_location"), // 'office', 'remote', 'hybrid'
  reportingManager: varchar("reporting_manager"),
  
  // Education and skills
  highestEducation: varchar("highest_education"), // 'high_school', 'associate', 'bachelor', 'master', 'phd', 'other'
  university: varchar("university"),
  graduationYear: varchar("graduation_year"),
  majorSubject: varchar("major_subject"),
  skills: text("skills"),
  certifications: text("certifications"),
  languagesSpoken: varchar("languages_spoken"),
  
  // Experience and interests
  previousExperience: text("previous_experience"),
  hobbies: text("hobbies"),
  
  // Banking and Payroll Information
  bankName: varchar("bank_name"),
  accountHolderName: varchar("account_holder_name"),
  accountNumber: varchar("account_number"),
  accountType: varchar("account_type"), // 'savings', 'checking', 'current'
  routingNumber: varchar("routing_number"),
  iban: varchar("iban"),
  swiftCode: varchar("swift_code"),
  
  // Government and Legal Documents
  cnicNumber: varchar("cnic_number"), // National ID/CNIC
  passportNumber: varchar("passport_number"),
  drivingLicenseNumber: varchar("driving_license_number"),
  socialSecurityNumber: varchar("social_security_number"),
  taxIdNumber: varchar("tax_id_number"),
  
  // Document Storage (Base64 encoded or file URLs)
  cvDocument: text("cv_document"), // CV/Resume document
  cnicDocument: text("cnic_document"), // CNIC/ID document  
  educationCertificates: text("education_certificates"), // Education certificates
  experienceLetters: text("experience_letters"), // Experience letters
  profilePicture: text("profile_picture"), // Profile picture
  additionalDocuments: jsonb("additional_documents"), // Array of additional documents
  
  // Legal consents and agreements
  privacyPolicyAgreed: boolean("privacy_policy_agreed").default(false),
  termsAndConditionsAgreed: boolean("terms_and_conditions_agreed").default(false),
  backgroundCheckConsent: boolean("background_check_consent").default(false),
  dataProcessingConsent: boolean("data_processing_consent").default(false),
  
  // Profile completion tracking
  personalProfileCompleted: boolean("personal_profile_completed").default(false),
  personalProfileCompletedAt: timestamp("personal_profile_completed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leave Balances table (tracks employee leave entitlements from Meeting Matters manual)
export const leaveBalances = pgTable("leave_balances", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  year: integer("year").notNull(), // Fiscal year for leave tracking
  
  // Sick leave (15 paid + 15 unpaid per year from manual section 6.37)
  sickLeavePaidTotal: integer("sick_leave_paid_total").default(15),
  sickLeavePaidUsed: integer("sick_leave_paid_used").default(0),
  sickLeaveUnpaidTotal: integer("sick_leave_unpaid_total").default(15),
  sickLeaveUnpaidUsed: integer("sick_leave_unpaid_used").default(0),
  
  // Casual leave (5 paid max per year from manual)
  casualLeavePaidTotal: integer("casual_leave_paid_total").default(5),
  casualLeavePaidUsed: integer("casual_leave_paid_used").default(0),
  casualLeaveUnpaidUsed: integer("casual_leave_unpaid_used").default(0),
  
  // Bereavement leave (tracked separately, flexible approval)
  bereavementLeaveUsed: integer("bereavement_leave_used").default(0),
  
  // Unpaid leave (additional unpaid days beyond quotas)
  unpaidLeaveUsed: integer("unpaid_leave_used").default(0),
  
  // Public holidays taken
  publicHolidaysUsed: integer("public_holidays_used").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leave Requests table (implements approval workflow from manual section 6.37)
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  
  // Leave details
  leaveType: leaveTypeEnum("leave_type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalDays: integer("total_days").notNull(),
  reason: text("reason").notNull(),
  coveringEmployeeId: integer("covering_employee_id").references(() => employees.id), // Employee covering duties during leave
  
  // Medical certificate for sick leave (required for severe conditions per manual)
  medicalCertificate: text("medical_certificate"), // Base64 encoded or URL
  medicalCertificateFilename: varchar("medical_certificate_filename"),
  
  // Approval workflow (Employee → CEO → Admin Manager per manual)
  status: leaveStatusEnum("status").default("pending").notNull(),
  approvedBy: integer("approved_by").references(() => users.id), // CEO approval
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  
  // Admin Manager coordination (updates attendance sheet per manual)
  adminProcessed: boolean("admin_processed").default(false),
  adminProcessedBy: integer("admin_processed_by").references(() => users.id),
  adminProcessedAt: timestamp("admin_processed_at"),
  
  // BDM and CRM coordination notification (for smooth operations per manual)
  bdmNotified: boolean("bdm_notified").default(false),
  crmNotified: boolean("crm_notified").default(false),
  
  // Screenshot evidence (per manual workflow requirement)
  approvalScreenshot: text("approval_screenshot"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vacancies table for HR visibility of open positions
export const vacancies = pgTable("vacancies", {
  id: serial("id").primaryKey(),
  designation: designationEnum("designation").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  numberOfOpenings: integer("number_of_openings").default(1),
  description: text("description"),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  status: varchar("status").default("open"), // open, filled, closed
  postedDate: timestamp("posted_date").defaultNow(),
  filledDate: timestamp("filled_date"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to").references(() => users.id),
  assignedBy: integer("assigned_by").references(() => users.id),
  status: taskStatusEnum("status").default("pending").notNull(),
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task updates table for daily progress tracking
export const taskUpdates = pgTable("task_updates", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  updateText: text("update_text").notNull(),
  progressPercentage: integer("progress_percentage").default(0),
  hoursWorked: decimal("hours_worked").default("0"),
  challenges: text("challenges"),
  nextSteps: text("next_steps"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id),
  isPublished: boolean("is_published").default(false),
  targetRoles: jsonb("target_roles"), // Array of roles this announcement is for
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recognition table
export const recognition = pgTable("recognition", {
  id: serial("id").primaryKey(),
  nomineeId: integer("nominee_id").references(() => users.id),
  nominatedBy: integer("nominated_by").references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  type: varchar("type").notNull(), // "employee_of_month", "achievement", "milestone"
  isApproved: boolean("is_approved").default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Logistics items table
export const logisticsItems = pgTable("logistics_items", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  quantity: integer("quantity").default(0),
  minQuantity: integer("min_quantity").default(0),
  maxQuantity: integer("max_quantity"),
  unitCost: decimal("unit_cost"),
  location: varchar("location"),
  supplier: varchar("supplier"),
  barcode: varchar("barcode"),
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Logistics requests table
export const logisticsRequests = pgTable("logistics_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").references(() => users.id),
  itemId: integer("item_id").references(() => logisticsItems.id),
  itemName: varchar("item_name"), // For requests without existing items
  description: text("description"), // Item description for new items
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  status: varchar("status").default("pending"), // pending, approved, rejected, purchased, delivered, completed
  priority: varchar("priority").default("medium"), // low, medium, high, urgent
  estimatedCost: decimal("estimated_cost"),
  actualCost: decimal("actual_cost"),
  vendor: varchar("vendor"),
  purchaseDate: timestamp("purchase_date"),
  deliveryDate: timestamp("delivery_date"),
  receiptUrl: varchar("receipt_url"),
  receiptFilename: varchar("receipt_filename"),
  notes: text("notes"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  category: varchar("category"), // office_supplies, equipment, software, maintenance, etc
  department: varchar("department"),
  costCenter: varchar("cost_center"),
  budgetCode: varchar("budget_code"),
  taxAmount: decimal("tax_amount"),
  shippingCost: decimal("shipping_cost"),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: varchar("recurring_frequency"), // monthly, quarterly, yearly
  nextRecurringDate: timestamp("next_recurring_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Logistics expenses for detailed expense tracking
export const logisticsExpenses = pgTable("logistics_expenses", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => logisticsRequests.id),
  expenseType: varchar("expense_type").notNull(), // purchase, shipping, maintenance, return, etc
  amount: decimal("amount").notNull(),
  currency: varchar("currency").default("USD"),
  description: text("description"),
  date: timestamp("date").notNull(),
  vendor: varchar("vendor"),
  invoiceNumber: varchar("invoice_number"),
  receiptUrl: varchar("receipt_url"),
  paymentMethod: varchar("payment_method"), // credit_card, bank_transfer, cash, check
  paymentStatus: varchar("payment_status").default("pending"), // pending, paid, overdue, cancelled
  approvedBy: integer("approved_by").references(() => users.id),
  recordedBy: integer("recorded_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Logistics inventory movements for tracking stock changes
export const logisticsMovements = pgTable("logistics_movements", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => logisticsItems.id).notNull(),
  movementType: varchar("movement_type").notNull(), // in, out, adjustment, transfer
  quantity: integer("quantity").notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  reason: text("reason"),
  location: varchar("location"),
  referenceId: integer("reference_id"), // Reference to request or other transaction
  referenceType: varchar("reference_type"), // request, purchase, adjustment, etc
  performedBy: integer("performed_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Onboarding checklists table
export const onboardingChecklists = pgTable("onboarding_checklists", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  itemTitle: varchar("item_title").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").default(false),
  completedBy: integer("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date"),
  order: integer("order").default(0),
  requiresDocument: boolean("requires_document").default(false),
  documentType: varchar("document_type"), // 'image', 'pdf', 'any'
  documentUrl: varchar("document_url"),
  documentName: varchar("document_name"),
  isDocumentVerified: boolean("is_document_verified").default(false),
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  verificationNotes: text("verification_notes"),
  // Psychometric test integration
  requiresPsychometricTest: boolean("requires_psychometric_test").default(false),
  psychometricTestId: integer("psychometric_test_id").references(() => psychometricTests.id),
  psychometricTestAttemptId: integer("psychometric_test_attempt_id").references(() => psychometricTestAttempts.id),
  psychometricTestCompleted: boolean("psychometric_test_completed").default(false),
  psychometricTestScore: integer("psychometric_test_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task requests table (for time extensions, documents, help, and department head task requests)
export const taskRequests = pgTable("task_requests", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  requestType: varchar("request_type").notNull(), // 'time_extension', 'document_request', 'help_request', 'clarification', 'department_task_request', 'hr_task_request'
  requestTitle: varchar("request_title").notNull(),
  requestDescription: text("request_description").notNull(),
  requestedExtension: integer("requested_extension"), // in days
  urgencyLevel: varchar("urgency_level").default('medium'), // 'low', 'medium', 'high', 'urgent'
  status: varchar("status").default('pending'), // 'pending', 'approved', 'rejected', 'in_review', 'assigned'
  responseMessage: text("response_message"),
  respondedBy: integer("responded_by").references(() => users.id),
  respondedAt: timestamp("responded_at", { mode: 'string' }),
  attachmentUrl: varchar("attachment_url"),
  attachmentName: varchar("attachment_name"),
  // Department head task request specific fields
  departmentId: integer("department_id").references(() => departments.id),
  assignedToEmployeeId: integer("assigned_to_employee_id").references(() => users.id),
  estimatedHours: integer("estimated_hours"),
  dueDate: timestamp("due_date", { mode: 'string' }),
  assignedAt: timestamp("assigned_at", { mode: 'string' }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document uploads table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  relatedTo: varchar("related_to"), // employee_id, task_id, etc.
  relatedType: varchar("related_type"), // "employee", "task", "logistics"
  isApproved: boolean("is_approved").default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  employees: many(employees),
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  announcements: many(announcements),
  recognitionGiven: many(recognition, { relationName: "recognitionGiven" }),
  recognitionReceived: many(recognition, { relationName: "recognitionReceived" }),
  logisticsRequests: many(logisticsRequests),
  documents: many(documents),
  managedProjects: many(projects),
  projectMemberships: many(projectMembers),
  assignedProjectTasks: many(projectTasks, { relationName: "assignedProjectTasks" }),
  createdProjectTasks: many(projectTasks, { relationName: "createdProjectTasks" }),
  manager: one(users, { 
    fields: [users.managerId],
    references: [users.id],
    relationName: "managerSubordinate"
  }),
  subordinates: many(users, { relationName: "managerSubordinate" }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  onboardingChecklists: many(onboardingChecklists),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignedToUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "assignedTasks"
  }),
  assignedByUser: one(users, {
    fields: [tasks.assignedBy],
    references: [users.id],
    relationName: "createdTasks"
  }),
  taskRequests: many(taskRequests),
  taskUpdates: many(taskUpdates),
}));

export const taskRequestsRelations = relations(taskRequests, ({ one }) => ({
  task: one(tasks, {
    fields: [taskRequests.taskId],
    references: [tasks.id],
  }),
  requester: one(users, {
    fields: [taskRequests.requesterId],
    references: [users.id],
    relationName: "taskRequestRequester"
  }),
  responder: one(users, {
    fields: [taskRequests.respondedBy],
    references: [users.id],
    relationName: "taskRequestResponder"
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
}));

export const recognitionRelations = relations(recognition, ({ one }) => ({
  nominee: one(users, {
    fields: [recognition.nomineeId],
    references: [users.id],
    relationName: "recognitionReceived"
  }),
  nominator: one(users, {
    fields: [recognition.nominatedBy],
    references: [users.id],
    relationName: "recognitionGiven"
  }),
  approver: one(users, {
    fields: [recognition.approvedBy],
    references: [users.id],
  }),
}));

export const logisticsRequestsRelations = relations(logisticsRequests, ({ one }) => ({
  requester: one(users, {
    fields: [logisticsRequests.requesterId],
    references: [users.id],
  }),
  item: one(logisticsItems, {
    fields: [logisticsRequests.itemId],
    references: [logisticsItems.id],
  }),
  approver: one(users, {
    fields: [logisticsRequests.approvedBy],
    references: [users.id],
  }),
}));

export const onboardingChecklistsRelations = relations(onboardingChecklists, ({ one }) => ({
  employee: one(employees, {
    fields: [onboardingChecklists.employeeId],
    references: [employees.id],
  }),
  completedByUser: one(users, {
    fields: [onboardingChecklists.completedBy],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [documents.approvedBy],
    references: [users.id],
  }),
}));

// Project relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  projectManager: one(users, {
    fields: [projects.projectManagerId],
    references: [users.id],
  }),
  members: many(projectMembers),
  tasks: many(projectTasks),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const projectTasksRelations = relations(projectTasks, ({ one }) => ({
  project: one(projects, {
    fields: [projectTasks.projectId],
    references: [projects.id],
  }),
  assignedToUser: one(users, {
    fields: [projectTasks.assignedTo],
    references: [users.id],
    relationName: "assignedProjectTasks"
  }),
  assignedByUser: one(users, {
    fields: [projectTasks.assignedBy],
    references: [users.id],
    relationName: "createdProjectTasks"
  }),
}));

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // "Starter", "Professional", "Enterprise"
  planId: subscriptionPlanEnum("plan_id").notNull().unique(), // starter, professional, enterprise
  description: text("description"),
  monthlyPrice: decimal("monthly_price").notNull(),
  yearlyPrice: decimal("yearly_price").notNull(),
  features: jsonb("features").notNull(), // Array of feature strings
  maxEmployees: integer("max_employees"), // null for unlimited
  maxProjects: integer("max_projects"), // null for unlimited
  maxStorage: integer("max_storage"), // GB, null for unlimited
  isActive: boolean("is_active").default(true),
  stripePriceIdMonthly: varchar("stripe_price_id_monthly"),
  stripePriceIdYearly: varchar("stripe_price_id_yearly"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription history table for tracking changes
export const subscriptionHistory = pgTable("subscription_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  subscriptionId: varchar("subscription_id"), // Stripe subscription ID
  planId: subscriptionPlanEnum("plan_id").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  amount: decimal("amount").notNull(),
  billingCycle: varchar("billing_cycle").notNull(), // "monthly" or "yearly"
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trial requests table for managing free trial applications
export const trialRequests = pgTable("trial_requests", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  company: varchar("company").notNull(),
  phone: varchar("phone"),
  jobTitle: varchar("job_title").notNull(),
  teamSize: varchar("team_size").notNull(),
  planId: subscriptionPlanEnum("plan_id").notNull(),
  billingCycle: varchar("billing_cycle").notNull(),
  status: trialStatusEnum("status").default("pending"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  createdUserId: integer("created_user_id").references(() => users.id), // User created for this trial
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer subscription management
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  trialRequestId: integer("trial_request_id").references(() => trialRequests.id),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  status: varchar("status", { length: 20 }).notNull().default('trial'), // trial, active, suspended, cancelled
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  planId: subscriptionPlanEnum("plan_id").notNull(),
  billingCycle: varchar("billing_cycle", { length: 20 }).notNull(), // monthly, yearly
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription records
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  planId: subscriptionPlanEnum("plan_id").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // active, trialing, past_due, canceled, unpaid
  billingCycle: varchar("billing_cycle", { length: 20 }).notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  canceledAt: timestamp("canceled_at"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('usd'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment records
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).unique(),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('usd'),
  status: varchar("status", { length: 20 }).notNull(), // succeeded, pending, failed, canceled, refunded
  paymentMethod: varchar("payment_method", { length: 50 }), // card, bank_transfer, etc.
  description: text("description"),
  paidAt: timestamp("paid_at"),
  failureReason: text("failure_reason"),
  refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job applications table for pre-employment screening
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  // Personal Information
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  address: text("address").notNull(),
  dateOfBirth: varchar("date_of_birth").notNull(),
  
  // Position Information
  positionAppliedFor: varchar("position_applied_for").notNull(),
  department: varchar("department").notNull(),
  expectedSalary: varchar("expected_salary"),
  availableStartDate: varchar("available_start_date").notNull(),
  
  // Experience & Education
  education: text("education").notNull(),
  experience: text("experience").notNull(),
  skills: text("skills").notNull(),
  references: text("references"),
  
  // Additional Information
  coverLetter: text("cover_letter").notNull(),
  whyJoinUs: text("why_join_us").notNull(),
  voiceIntroduction: text("voice_introduction"), // Base64 encoded audio file
  
  // Documents (base64 encoded)
  resumeFile: text("resume_file"),
  certificatesFile: text("certificates_file"),
  
  // Psychometric Test Results
  psychometricCompleted: boolean("psychometric_completed").default(false),
  testResults: jsonb("test_results"),
  
  // Application Status
  status: applicationStatusEnum("status").default("submitted"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  rejectionReason: text("rejection_reason"),
  
  // Interview Details
  interviewDate: timestamp("interview_date"),
  interviewTime: varchar("interview_time"),
  interviewType: varchar("interview_type"), // in-person, video, phone
  interviewLocation: text("interview_location"),
  interviewNotes: text("interview_notes"),
  interviewScheduledBy: integer("interview_scheduled_by").references(() => users.id),
  interviewScheduledAt: timestamp("interview_scheduled_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employment contract status enum
export const contractStatusEnum = pgEnum("contract_status", [
  "pending",
  "signed",
  "declined",
  "expired"
]);

// Employment contracts table for contract management
export const employmentContracts = pgTable("employment_contracts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contractType: varchar("contract_type").notNull().default("employment_offer"), // employment_offer, promotion, amendment
  jobTitle: varchar("job_title").notNull(),
  department: varchar("department").notNull(),
  salary: decimal("salary", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("PKR").notNull(),
  startDate: timestamp("start_date").notNull(),
  contractDuration: varchar("contract_duration"), // "permanent", "6 months", "1 year", etc.
  workingHours: varchar("working_hours").default("40 hours/week"),
  probationPeriod: varchar("probation_period").default("3 months"),
  benefits: text("benefits"), // JSON string of benefits
  
  // Contract document
  contractContent: text("contract_content").notNull(), // Full contract text/HTML
  contractPdf: text("contract_pdf"), // Base64 encoded PDF if available
  
  // Signing details
  status: contractStatusEnum("status").default("pending").notNull(),
  signedAt: timestamp("signed_at"),
  digitalSignature: text("digital_signature"), // Employee's digital signature
  ipAddress: varchar("ip_address"), // IP address when signed
  userAgent: text("user_agent"), // Browser info when signed
  
  // HR/Admin details
  createdBy: integer("created_by").references(() => users.id).notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  expiresAt: timestamp("expires_at"), // Auto-expire if not signed within timeframe
  notes: text("notes"), // Internal HR notes
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Billing events and audit trail
export const billingEvents = pgTable("billing_events", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  paymentId: integer("payment_id").references(() => payments.id),
  eventType: varchar("event_type", { length: 50 }).notNull(), // trial_started, trial_ended, subscription_created, payment_succeeded, etc.
  eventData: jsonb("event_data"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({ id: true, createdAt: true });
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertSubscriptionHistorySchema = createInsertSchema(subscriptionHistory);
export const insertEmployeeSchema = createInsertSchema(employees).extend({
  userId: z.union([z.string(), z.number()]).transform(val => {
    return typeof val === 'string' ? parseInt(val) : val;
  }),
});
export const insertLeaveBalanceSchema = createInsertSchema(leaveBalances);
export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).extend({
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  approvedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  adminProcessedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});
export const insertVacancySchema = createInsertSchema(vacancies);
export const insertTaskSchema = createInsertSchema(tasks).extend({
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  assignedTo: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === 'unassigned' || val === '' || val == null) return undefined;
    return typeof val === 'string' ? parseInt(val) : val;
  }),
  assignedBy: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val == null) return undefined;
    return typeof val === 'string' ? parseInt(val) : val;
  }),
});
export const insertTaskUpdateSchema = createInsertSchema(taskUpdates);
export const insertAnnouncementSchema = createInsertSchema(announcements);
export const insertRecognitionSchema = createInsertSchema(recognition);
export const insertLogisticsItemSchema = createInsertSchema(logisticsItems);
export const insertLogisticsRequestSchema = createInsertSchema(logisticsRequests);
export const insertOnboardingChecklistSchema = createInsertSchema(onboardingChecklists);
export const insertDocumentSchema = createInsertSchema(documents);
export const insertTaskRequestSchema = createInsertSchema(taskRequests).extend({
  respondedAt: z.string().optional(),
  dueDate: z.string().optional(),
  assignedAt: z.string().optional(),
});
export const insertCompanySchema = createInsertSchema(companies);
export const insertDepartmentSchema = createInsertSchema(departments);
export const insertProjectSchema = createInsertSchema(projects).extend({
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});
export const insertProjectMemberSchema = createInsertSchema(projectMembers);
export const insertProjectTaskSchema = createInsertSchema(projectTasks).extend({
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});
export const insertTrialRequestSchema = createInsertSchema(trialRequests);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertBillingEventSchema = createInsertSchema(billingEvents);
export const insertJobApplicationSchema = createInsertSchema(jobApplications);
export const insertEmploymentContractSchema = createInsertSchema(employmentContracts).extend({
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

// Separate schema for updates that handles partial data correctly
export const updateEmploymentContractSchema = z.object({
  userId: z.coerce.number().optional(),
  contractType: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  salary: z.coerce.number().optional(),
  currency: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  contractDuration: z.string().optional(),
  workingHours: z.string().optional(),
  probationPeriod: z.string().optional(),
  benefits: z.string().optional(),
  contractContent: z.string().optional(),
  contractPdf: z.string().optional(),
  status: z.enum(['pending', 'signed', 'expired']).optional(),
  signedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  digitalSignature: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdBy: z.coerce.number().optional(),
  approvedBy: z.coerce.number().optional(),
  approvedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  notes: z.string().optional(),
});

// Project notes table for daily/weekly/monthly tracking
export const projectNoteTypeEnum = pgEnum("project_note_type", [
  "daily",
  "weekly", 
  "monthly",
  "milestone",
  "general"
]);

export const projectNotes = pgTable("project_notes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  type: projectNoteTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  noteDate: timestamp("note_date").defaultNow(),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project communication/chat table
export const projectMessages = pgTable("project_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  messageType: varchar("message_type").default("text"), // text, file, announcement
  replyToId: integer("reply_to_id").references((): any => projectMessages.id),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project overview table for comprehensive project documentation
export const projectOverview = pgTable("project_overview", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }).unique(),
  overview: text("overview"),
  objectives: text("objectives").array(),
  deliverables: text("deliverables").array(),
  milestones: text("milestones").array(),
  risks: text("risks").array(),
  resources: text("resources").array(),
  timeline: text("timeline"),
  budget: text("budget"),
  stakeholders: text("stakeholders").array(),
  successCriteria: text("success_criteria").array(),
  dependencies: text("dependencies").array(),
  assumptions: text("assumptions").array(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  updatedBy: integer("updated_by").notNull().references(() => users.id),
});

// Project file attachments
export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size"),
  fileType: varchar("file_type"),
  fileContent: text("file_content"), // base64 encoded
  description: text("description"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  // Link files to specific content types
  linkedToTask: integer("linked_to_task").references(() => projectTasks.id),
  linkedToNote: integer("linked_to_note").references(() => projectNotes.id),
  linkedToMessage: integer("linked_to_message").references(() => projectMessages.id),
});

// Insert schemas for new tables
export const insertProjectNoteSchema = createInsertSchema(projectNotes).extend({
  noteDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});
export const insertProjectMessageSchema = createInsertSchema(projectMessages);
export const insertProjectFileSchema = createInsertSchema(projectFiles);
export const insertProjectOverviewSchema = createInsertSchema(projectOverview);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;
export type TaskRequest = typeof taskRequests.$inferSelect;
export type InsertTaskRequest = typeof taskRequests.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;
export type ProjectTask = typeof projectTasks.$inferSelect;
export type InsertProjectTask = typeof projectTasks.$inferInsert;
export type ProjectNote = typeof projectNotes.$inferSelect;
export type InsertProjectNote = typeof projectNotes.$inferInsert;
export type ProjectMessage = typeof projectMessages.$inferSelect;
export type InsertProjectMessage = typeof projectMessages.$inferInsert;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = typeof jobApplications.$inferInsert;
export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = typeof projectFiles.$inferInsert;
export type ProjectOverview = typeof projectOverview.$inferSelect;
export type InsertProjectOverview = typeof projectOverview.$inferInsert;
export type TrialRequest = typeof trialRequests.$inferSelect;
export type InsertTrialRequest = typeof trialRequests.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type BillingEvent = typeof billingEvents.$inferSelect;
export type InsertBillingEvent = typeof billingEvents.$inferInsert;
export type EmploymentContract = typeof employmentContracts.$inferSelect;
export type InsertEmploymentContract = typeof employmentContracts.$inferInsert;

// Relations for new project tables
export const projectNotesRelations = relations(projectNotes, ({ one }) => ({
  project: one(projects, {
    fields: [projectNotes.projectId],
    references: [projects.id],
  }),
  author: one(users, {
    fields: [projectNotes.authorId],
    references: [users.id],
  }),
}));

export const projectMessagesRelations = relations(projectMessages, ({ one }) => ({
  project: one(projects, {
    fields: [projectMessages.projectId],
    references: [projects.id],
  }),
  sender: one(users, {
    fields: [projectMessages.senderId],
    references: [users.id],
  }),
  replyTo: one(projectMessages, {
    fields: [projectMessages.replyToId],
    references: [projectMessages.id],
  }),
}));

export const projectFilesRelations = relations(projectFiles, ({ one }) => ({
  project: one(projects, {
    fields: [projectFiles.projectId],
    references: [projects.id],
  }),
  uploader: one(users, {
    fields: [projectFiles.uploadedBy],
    references: [users.id],
  }),
}));

export const projectOverviewRelations = relations(projectOverview, ({ one }) => ({
  project: one(projects, {
    fields: [projectOverview.projectId],
    references: [projects.id],
  }),
  updater: one(users, {
    fields: [projectOverview.updatedBy],
    references: [users.id],
  }),
}));

// Billing relations
export const customersRelations = relations(customers, ({ one, many }) => ({
  trialRequest: one(trialRequests, {
    fields: [customers.trialRequestId],
    references: [trialRequests.id],
  }),
  subscriptions: many(subscriptions),
  payments: many(payments),
  billingEvents: many(billingEvents),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  customer: one(customers, {
    fields: [subscriptions.customerId],
    references: [customers.id],
  }),
  payments: many(payments),
  billingEvents: many(billingEvents),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const billingEventsRelations = relations(billingEvents, ({ one }) => ({
  customer: one(customers, {
    fields: [billingEvents.customerId],
    references: [customers.id],
  }),
  subscription: one(subscriptions, {
    fields: [billingEvents.subscriptionId],
    references: [subscriptions.id],
  }),
  payment: one(payments, {
    fields: [billingEvents.paymentId],
    references: [payments.id],
  }),
}));

// Psychometric test schemas
export const psychometricTests = pgTable("psychometric_tests", {
  id: serial("id").primaryKey(),
  testName: varchar("test_name", { length: 100 }).notNull(),
  testType: varchar("test_type", { length: 50 }).notNull(), // personality, cognitive, aptitude, emotional_intelligence
  description: text("description"),
  instructions: text("instructions"),
  timeLimit: integer("time_limit"), // in minutes
  totalQuestions: integer("total_questions").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const psychometricQuestions = pgTable("psychometric_questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").references(() => psychometricTests.id).notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(), // multiple_choice, scale, yes_no
  options: jsonb("options"), // For multiple choice questions
  correctAnswer: varchar("correct_answer", { length: 255 }), // For cognitive tests
  category: varchar("category", { length: 100 }), // personality trait, cognitive domain
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const psychometricTestAttempts = pgTable("psychometric_test_attempts", {
  id: serial("id").primaryKey(),
  candidateEmail: varchar("candidate_email", { length: 255 }).notNull(),
  candidateName: varchar("candidate_name", { length: 255 }).notNull(),
  testId: integer("test_id").references(() => psychometricTests.id).notNull(),
  responses: jsonb("responses").notNull(), // Array of question responses
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  timeSpent: integer("time_spent"), // in seconds
  totalScore: integer("total_score"),
  percentageScore: integer("percentage_score"),
  results: jsonb("results"), // Detailed scoring breakdown
  status: varchar("status", { length: 50 }).default("in_progress"), // in_progress, completed, abandoned
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
});

export const psychometricTestRelations = relations(psychometricTests, ({ many }) => ({
  questions: many(psychometricQuestions),
  attempts: many(psychometricTestAttempts),
}));

export const psychometricQuestionRelations = relations(psychometricQuestions, ({ one }) => ({
  test: one(psychometricTests, {
    fields: [psychometricQuestions.testId],
    references: [psychometricTests.id],
  }),
}));

export const psychometricTestAttemptRelations = relations(psychometricTestAttempts, ({ one }) => ({
  test: one(psychometricTests, {
    fields: [psychometricTestAttempts.testId],
    references: [psychometricTests.id],
  }),
}));

export type PsychometricTest = typeof psychometricTests.$inferSelect;
export type InsertPsychometricTest = typeof psychometricTests.$inferInsert;
export type PsychometricQuestion = typeof psychometricQuestions.$inferSelect;
export type InsertPsychometricQuestion = typeof psychometricQuestions.$inferInsert;
export type PsychometricTestAttempt = typeof psychometricTestAttempts.$inferSelect;
export type InsertPsychometricTestAttempt = typeof psychometricTestAttempts.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type InsertLeaveBalance = typeof leaveBalances.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;
export type Vacancy = typeof vacancies.$inferSelect;
export type InsertVacancy = typeof vacancies.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;
export type Recognition = typeof recognition.$inferSelect;
export type InsertRecognition = typeof recognition.$inferInsert;
export type LogisticsItem = typeof logisticsItems.$inferSelect;
export type InsertLogisticsItem = typeof logisticsItems.$inferInsert;
export type LogisticsRequest = typeof logisticsRequests.$inferSelect;
export type InsertLogisticsRequest = typeof logisticsRequests.$inferInsert;
export type LogisticsExpense = typeof logisticsExpenses.$inferSelect;
export type InsertLogisticsExpense = typeof logisticsExpenses.$inferInsert;
export type LogisticsMovement = typeof logisticsMovements.$inferSelect;
export type InsertLogisticsMovement = typeof logisticsMovements.$inferInsert;
export type OnboardingChecklist = typeof onboardingChecklists.$inferSelect;
export type InsertOnboardingChecklist = typeof onboardingChecklists.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type TaskUpdate = typeof taskUpdates.$inferSelect;
export type InsertTaskUpdate = typeof taskUpdates.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

// Employee submissions table for two-phase onboarding
export const employeeSubmissions = pgTable("employee_submissions", {
  id: serial("id").primaryKey(),
  // Personal Information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  maritalStatus: text("marital_status"),
  nationality: text("nationality"),
  
  // Contact Information
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  alternatePhone: text("alternate_phone"),
  
  // Address Information
  currentAddress: text("current_address").notNull(),
  permanentAddress: text("permanent_address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
  
  // Employment Information
  position: text("position").notNull(),
  department: text("department").notNull(),
  startDate: text("start_date").notNull(),
  employmentType: text("employment_type"),
  workLocation: text("work_location"),
  reportingManager: text("reporting_manager"),
  
  // Educational Background
  highestEducation: text("highest_education"),
  university: text("university"),
  graduationYear: text("graduation_year"),
  majorSubject: text("major_subject"),
  
  // Emergency Contact
  emergencyContactName: text("emergency_contact_name").notNull(),
  emergencyContactRelation: text("emergency_contact_relation"),
  emergencyContactPhone: text("emergency_contact_phone").notNull(),
  emergencyContactAddress: text("emergency_contact_address"),
  
  // Additional Information
  skills: text("skills"),
  previousExperience: text("previous_experience"),
  languagesSpoken: text("languages_spoken"),
  hobbies: text("hobbies"),
  
  // Banking and Payroll Information
  bankName: text("bank_name"),
  accountHolderName: text("account_holder_name"),
  accountNumber: text("account_number"),
  accountType: text("account_type"),
  routingNumber: text("routing_number"),
  iban: text("iban"),
  
  // Government Documents
  cnicNumber: text("cnic_number"),
  passportNumber: text("passport_number"),
  taxIdNumber: text("tax_id_number"),
  
  // Document Uploads (Base64 encoded)
  cvDocument: text("cv_document"),
  cnicDocument: text("cnic_document"),
  profilePicture: text("profile_picture"),
  
  // Acknowledgments
  privacyPolicyAgreed: boolean("privacy_policy_agreed").default(false),
  termsAndConditionsAgreed: boolean("terms_conditions_agreed").default(false),
  backgroundCheckConsent: boolean("background_check_consent").default(false),
  
  // Status and tracking
  status: text("status").default("pending"), // pending, in_progress, completed
  submittedAt: timestamp("submitted_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  assignedHR: text("assigned_hr"),
  
  // HR Steps tracking
  hrStepsCompleted: jsonb("hr_steps_completed").default([]), // Array of completed step IDs
  hrStepsNotes: jsonb("hr_steps_notes").default({}), // Object with step ID as key and notes as value
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmployeeSubmissionSchema = createInsertSchema(employeeSubmissions);
export type InsertEmployeeSubmission = z.infer<typeof insertEmployeeSubmissionSchema>;
export type EmployeeSubmission = typeof employeeSubmissions.$inferSelect;

// Registration requests table for approval workflow
export const registrationRequests = pgTable("registration_requests", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Hashed password stored temporarily
  requestedRole: userRoleEnum("requested_role").default("employee"),
  requestedDepartment: departmentEnum("requested_department"),
  position: text("position"),
  phoneNumber: text("phone_number"),
  
  // Status tracking
  status: text("status").default("pending"), // pending, approved, rejected
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  // Onboarding tracking
  onboardingStarted: boolean("onboarding_started").default(false),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const registrationRequestsRelations = relations(registrationRequests, ({ one }) => ({
  reviewer: one(users, {
    fields: [registrationRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const insertRegistrationRequestSchema = createInsertSchema(registrationRequests);
export type InsertRegistrationRequest = typeof registrationRequests.$inferInsert;
export type RegistrationRequest = typeof registrationRequests.$inferSelect;

// Additional types for components that need them
export interface Activity {
  type: string;
  id: number;
  title: string;
  timestamp: Date;
  status: string;
}

export interface Approval {
  type: string;
  id: number;
  title: string;
  requester: string;
  timestamp: Date;
}

export interface DashboardStats {
  totalEmployees: number;
  activeOnboarding: number;
  openTasks: number;
  pendingApprovals: number;
  complianceRate: number;
}

// Notification types enum
export const notificationTypeEnum = pgEnum("notification_type", [
  "task_assigned",
  "task_completed", 
  "task_explanation",
  "task_overdue",
  "project_assigned",
  "project_updated",
  "project_started",
  "approval_request",
  "approval_decision",
  "onboarding_step",
  "onboarding_review",
  "meeting_scheduled",
  "meeting_reminder",
  "document_uploaded",
  "document_reviewed",
  "recognition_received",
  "recognition_nominated",
  "system_announcement",
  "profile_updated"
]);

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data").default({}), // Additional data like IDs, links, etc.
  
  // Status tracking
  isRead: boolean("is_read").default(false),
  actionRequired: boolean("action_required").default(false),
  actionUrl: text("action_url"), // URL to perform action
  
  // Related entities
  relatedEntityType: text("related_entity_type"), // "project", "task", "approval", etc.
  relatedEntityId: integer("related_entity_id"),
  
  // Metadata
  priority: text("priority").default("normal"), // low, normal, high, urgent
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications);
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Content types enum for Social Media & Content team
export const contentTypeEnum = pgEnum("content_type", [
  "social_media_post",
  "blog_article",
  "video_content",
  "graphic_design",
  "campaign_material",
  "newsletter",
  "website_content",
  "advertisement"
]);

// Content status enum
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "in_review",
  "approved",
  "published",
  "archived",
  "rejected"
]);

// Social Media Campaigns table
export const socialMediaCampaigns = pgTable("social_media_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  objective: text("objective"), // awareness, engagement, conversion, etc.
  
  // Campaign details
  targetAudience: text("target_audience"),
  platforms: jsonb("platforms").default([]), // ["facebook", "instagram", "twitter", etc.]
  budget: decimal("budget", { precision: 10, scale: 2 }),
  
  // Timeline
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  
  // Status and tracking
  status: text("status").default("planning"), // planning, active, paused, completed
  createdBy: integer("created_by").references(() => users.id).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  
  // Metrics
  impressions: integer("impressions").default(0),
  engagements: integer("engagements").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content Calendar table
export const contentCalendar = pgTable("content_calendar", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  contentType: contentTypeEnum("content_type").notNull(),
  
  // Content details
  content: text("content"), // The actual content/copy
  mediaUrls: jsonb("media_urls").default([]), // Array of image/video URLs
  hashtags: text("hashtags"),
  mentions: text("mentions"),
  
  // Publishing details
  platform: text("platform"), // facebook, instagram, twitter, linkedin, etc.
  scheduledDate: timestamp("scheduled_date"),
  publishedDate: timestamp("published_date"),
  
  // Campaign association
  campaignId: integer("campaign_id").references(() => socialMediaCampaigns.id),
  
  // Status and approval
  status: contentStatusEnum("status").default("draft"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Engagement metrics
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  comments: integer("comments").default(0),
  reach: integer("reach").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social Media Projects table (separate from main projects)
export const socialMediaProjects = pgTable("social_media_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Project details
  clientBrand: text("client_brand"), // If working with external brands
  projectType: text("project_type"), // "content_creation", "campaign", "brand_awareness", etc.
  priority: text("priority").default("medium"), // low, medium, high, urgent
  
  // Timeline
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  deadline: timestamp("deadline"),
  
  // Team assignment
  projectManager: integer("project_manager").references(() => users.id),
  creativeDirector: integer("creative_director").references(() => users.id),
  contentCreators: jsonb("content_creators").default([]), // Array of user IDs
  
  // Status tracking
  status: projectStatusEnum("status").default("planning"),
  progress: integer("progress").default(0), // 0-100
  
  // Budget and resources
  budget: decimal("budget", { precision: 10, scale: 2 }),
  resourcesRequired: jsonb("resources_required").default([]),
  
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social Media Tasks table (separate from main tasks)
export const socialMediaTasks = pgTable("social_media_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  
  // Task details
  taskType: text("task_type"), // "content_creation", "design", "copywriting", "scheduling", etc.
  priority: taskPriorityEnum("priority").default("medium"),
  estimatedHours: decimal("estimated_hours", { precision: 4, scale: 2 }),
  
  // Assignment
  assignedTo: integer("assigned_to").references(() => users.id),
  assignedBy: integer("assigned_by").references(() => users.id).notNull(),
  
  // Project association
  projectId: integer("project_id").references(() => socialMediaProjects.id),
  campaignId: integer("campaign_id").references(() => socialMediaCampaigns.id),
  contentId: integer("content_id").references(() => contentCalendar.id),
  
  // Timeline
  dueDate: timestamp("due_date"),
  startDate: timestamp("start_date"),
  completedDate: timestamp("completed_date"),
  
  // Status
  status: taskStatusEnum("status").default("pending"),
  
  // File attachments
  attachments: jsonb("attachments").default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Brand Guidelines table
export const brandGuidelines = pgTable("brand_guidelines", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull(),
  description: text("description"),
  
  // Visual identity
  colorPalette: jsonb("color_palette").default([]),
  fonts: jsonb("fonts").default([]),
  logoUrls: jsonb("logo_urls").default([]),
  
  // Content guidelines
  toneOfVoice: text("tone_of_voice"),
  messagingPillars: jsonb("messaging_pillars").default([]),
  doAndDonts: jsonb("do_and_donts").default({}),
  
  // Assets
  templateUrls: jsonb("template_urls").default([]),
  assetLibraryUrls: jsonb("asset_library_urls").default([]),
  
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for Social Media tables
export const socialMediaCampaignsRelations = relations(socialMediaCampaigns, ({ one, many }) => ({
  creator: one(users, {
    fields: [socialMediaCampaigns.createdBy],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [socialMediaCampaigns.assignedTo],
    references: [users.id],
  }),
  contentItems: many(contentCalendar),
}));

export const contentCalendarRelations = relations(contentCalendar, ({ one }) => ({
  creator: one(users, {
    fields: [contentCalendar.createdBy],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [contentCalendar.assignedTo],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [contentCalendar.approvedBy],
    references: [users.id],
  }),
  campaign: one(socialMediaCampaigns, {
    fields: [contentCalendar.campaignId],
    references: [socialMediaCampaigns.id],
  }),
}));

export const socialMediaProjectsRelations = relations(socialMediaProjects, ({ one, many }) => ({
  creator: one(users, {
    fields: [socialMediaProjects.createdBy],
    references: [users.id],
  }),
  manager: one(users, {
    fields: [socialMediaProjects.projectManager],
    references: [users.id],
  }),
  director: one(users, {
    fields: [socialMediaProjects.creativeDirector],
    references: [users.id],
  }),
  tasks: many(socialMediaTasks),
}));

export const socialMediaTasksRelations = relations(socialMediaTasks, ({ one }) => ({
  assignee: one(users, {
    fields: [socialMediaTasks.assignedTo],
    references: [users.id],
  }),
  assigner: one(users, {
    fields: [socialMediaTasks.assignedBy],
    references: [users.id],
  }),
  project: one(socialMediaProjects, {
    fields: [socialMediaTasks.projectId],
    references: [socialMediaProjects.id],
  }),
  campaign: one(socialMediaCampaigns, {
    fields: [socialMediaTasks.campaignId],
    references: [socialMediaCampaigns.id],
  }),
  content: one(contentCalendar, {
    fields: [socialMediaTasks.contentId],
    references: [contentCalendar.id],
  }),
}));

export const brandGuidelinesRelations = relations(brandGuidelines, ({ one }) => ({
  creator: one(users, {
    fields: [brandGuidelines.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas for Social Media tables
export const insertSocialMediaCampaignSchema = createInsertSchema(socialMediaCampaigns);
export type InsertSocialMediaCampaign = z.infer<typeof insertSocialMediaCampaignSchema>;
export type SocialMediaCampaign = typeof socialMediaCampaigns.$inferSelect;

export const insertContentCalendarSchema = createInsertSchema(contentCalendar);
export type InsertContentCalendar = z.infer<typeof insertContentCalendarSchema>;
export type ContentCalendar = typeof contentCalendar.$inferSelect;

export const insertSocialMediaProjectSchema = createInsertSchema(socialMediaProjects);
export type InsertSocialMediaProject = z.infer<typeof insertSocialMediaProjectSchema>;
export type SocialMediaProject = typeof socialMediaProjects.$inferSelect;

export const insertSocialMediaTaskSchema = createInsertSchema(socialMediaTasks);
export type InsertSocialMediaTask = z.infer<typeof insertSocialMediaTaskSchema>;
export type SocialMediaTask = typeof socialMediaTasks.$inferSelect;

export const insertBrandGuidelineSchema = createInsertSchema(brandGuidelines);
export type InsertBrandGuideline = z.infer<typeof insertBrandGuidelineSchema>;
export type BrandGuideline = typeof brandGuidelines.$inferSelect;

// Social Media Account Connection Status
export const connectionStatusEnum = pgEnum("connection_status", [
  "connected",
  "disconnected",
  "expired",
  "error"
]);

// Connected Social Media Accounts
export const connectedSocialAccounts = pgTable("connected_social_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // facebook, instagram, twitter, linkedin, etc.
  accountId: varchar("account_id", { length: 255 }).notNull(), // Platform-specific account ID
  accountName: varchar("account_name", { length: 255 }).notNull(), // Display name/username
  accountHandle: varchar("account_handle", { length: 255 }), // @username
  profileImageUrl: text("profile_image_url"),
  followerCount: integer("follower_count").default(0),
  
  // Authentication tokens (encrypted)
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  
  // Connection status
  status: connectionStatusEnum("status").default("connected").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  errorMessage: text("error_message"),
  
  // Platform-specific settings
  permissions: jsonb("permissions"), // Scope of permissions granted
  settings: jsonb("settings"), // Platform-specific configuration
  
  // Timestamps
  connectedAt: timestamp("connected_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social Media Analytics Data
export const socialMediaAnalytics = pgTable("social_media_analytics", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => connectedSocialAccounts.id).notNull(),
  
  // Date for analytics (daily aggregation)
  analyticsDate: timestamp("analytics_date").notNull(),
  
  // Engagement metrics
  followers: integer("followers").default(0),
  following: integer("following").default(0),
  posts: integer("posts").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  saves: integer("saves").default(0),
  
  // Reach and impressions
  reach: integer("reach").default(0),
  impressions: integer("impressions").default(0),
  profileViews: integer("profile_views").default(0),
  
  // Engagement rates (stored as percentages)
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default('0'),
  clickThroughRate: decimal("click_through_rate", { precision: 5, scale: 2 }).default('0'),
  
  // Platform-specific metrics
  platformMetrics: jsonb("platform_metrics"), // Additional platform-specific data
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post Performance Tracking
export const postPerformance = pgTable("post_performance", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => connectedSocialAccounts.id).notNull(),
  contentId: integer("content_id").references(() => contentCalendar.id), // Link to scheduled content
  
  // Post identification
  platformPostId: varchar("platform_post_id", { length: 255 }).notNull(), // Platform's post ID
  postUrl: text("post_url"),
  postType: varchar("post_type", { length: 50 }), // image, video, carousel, story, etc.
  
  // Performance metrics
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  saves: integer("saves").default(0),
  clicks: integer("clicks").default(0),
  reach: integer("reach").default(0),
  impressions: integer("impressions").default(0),
  
  // Engagement calculations
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default('0'),
  
  // Post details
  caption: text("caption"),
  hashtags: text("hashtags"),
  mentions: text("mentions"),
  
  // Platform-specific data
  platformData: jsonb("platform_data"),
  
  // Timestamps
  publishedAt: timestamp("published_at"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for Social Media Connections
export const connectedSocialAccountsRelations = relations(connectedSocialAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [connectedSocialAccounts.userId],
    references: [users.id],
  }),
  analytics: many(socialMediaAnalytics),
  posts: many(postPerformance),
}));

export const socialMediaAnalyticsRelations = relations(socialMediaAnalytics, ({ one }) => ({
  account: one(connectedSocialAccounts, {
    fields: [socialMediaAnalytics.accountId],
    references: [connectedSocialAccounts.id],
  }),
}));

export const postPerformanceRelations = relations(postPerformance, ({ one }) => ({
  account: one(connectedSocialAccounts, {
    fields: [postPerformance.accountId],
    references: [connectedSocialAccounts.id],
  }),
  content: one(contentCalendar, {
    fields: [postPerformance.contentId],
    references: [contentCalendar.id],
  }),
}));

// Insert schemas for Social Media Connections
export const insertConnectedSocialAccountSchema = createInsertSchema(connectedSocialAccounts);
export type InsertConnectedSocialAccount = z.infer<typeof insertConnectedSocialAccountSchema>;
export type ConnectedSocialAccount = typeof connectedSocialAccounts.$inferSelect;

export const insertSocialMediaAnalyticsSchema = createInsertSchema(socialMediaAnalytics);
export type InsertSocialMediaAnalytics = z.infer<typeof insertSocialMediaAnalyticsSchema>;
export type SocialMediaAnalytics = typeof socialMediaAnalytics.$inferSelect;

export const insertPostPerformanceSchema = createInsertSchema(postPerformance);
export type InsertPostPerformance = z.infer<typeof insertPostPerformanceSchema>;
export type PostPerformance = typeof postPerformance.$inferSelect;

// ============================================================================
// MEETING MATTERS STUDIO - Comprehensive Content Creation & Marketing Platform
// ============================================================================

// Studio Meeting Type enum
export const meetingTypeEnum = pgEnum("meeting_type", [
  "campaign_planning",
  "creative_brainstorm",
  "content_review",
  "client_presentation",
  "team_standup",
  "strategy_session",
  "performance_review",
  "training",
  "planning",
  "other"
]);

// Studio Meeting Status enum
export const meetingStatusEnum = pgEnum("meeting_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
  "rescheduled"
]);

// Creative Brief Status enum
export const briefStatusEnum = pgEnum("brief_status", [
  "draft",
  "submitted",
  "in_review",
  "approved",
  "in_production",
  "completed",
  "rejected"
]);

// Approval Status enum
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "needs_revision"
]);

// Social Media Platform enum - for analytics entries
export const socialPlatformEnum = pgEnum("social_platform", [
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "tiktok",
  "youtube",
  "other"
]);

// Work Item Category enum - for post-meeting work tracking
export const workItemCategoryEnum = pgEnum("work_item_category", [
  "feature",
  "bug_fix",
  "content",
  "design",
  "marketing",
  "research",
  "documentation",
  "optimization",
  "testing",
  "other"
]);

// Work Item Status enum
export const workItemStatusEnum = pgEnum("work_item_status", [
  "in_progress",
  "completed",
  "blocked",
  "cancelled"
]);

// Link Type enum - for categorizing links
export const linkTypeEnum = pgEnum("link_type", [
  "demo",
  "documentation",
  "analytics",
  "design",
  "repository",
  "campaign",
  "social_post",
  "landing_page",
  "report",
  "presentation",
  "other"
]);

// Asset Type enum
export const assetTypeEnum = pgEnum("asset_type", [
  "image",
  "video",
  "audio",
  "document",
  "template",
  "logo",
  "icon",
  "font",
  "other"
]);

// Dashboard Section Layout enum
export const dashboardLayoutEnum = pgEnum("dashboard_layout", [
  "cards",
  "timeline",
  "table",
  "stats"
]);

// Dashboard Data Source enum
export const dashboardDataSourceEnum = pgEnum("dashboard_data_source", [
  "campaigns",
  "content_calendar",
  "analytics",
  "briefs",
  "assets"
]);

// Studio Meetings table - Manage all marketing team meetings
export const studioMeetings = pgTable("studio_meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  meetingType: meetingTypeEnum("meeting_type").notNull(),
  
  // Meeting details
  agenda: text("agenda"),
  location: text("location"), // Physical location or video link
  meetingLink: text("meeting_link"), // Zoom/Meet/Teams link
  
  // Timeline
  scheduledStartTime: timestamp("scheduled_start_time").notNull(),
  scheduledEndTime: timestamp("scheduled_end_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  
  // Organization
  organizerId: integer("organizer_id").references(() => users.id).notNull(),
  campaignId: integer("campaign_id").references(() => socialMediaCampaigns.id),
  projectId: integer("project_id").references(() => socialMediaProjects.id),
  
  // Status and tracking
  status: meetingStatusEnum("status").default("scheduled").notNull(),
  recordingUrl: text("recording_url"),
  transcriptUrl: text("transcript_url"),
  
  // Presentation & CEO Update Fields
  previousWeekAccomplishments: text("previous_week_accomplishments"), // What was done last week
  nextWeekPlans: text("next_week_plans"), // Plans for upcoming week
  keyDiscussionPoints: text("key_discussion_points"), // Main talking points
  meetingSummary: text("meeting_summary"), // Overall meeting summary
  challenges: text("challenges"), // Challenges faced
  solutions: text("solutions"), // Solutions discussed
  teamFeedback: text("team_feedback"), // Team member feedback
  presentationNotes: text("presentation_notes"), // Notes for CEO presentation
  
  // Recurring meetings support
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: text("recurrence_pattern"), // daily, weekly, monthly, custom
  recurrenceInterval: integer("recurrence_interval").default(1), // Every X days/weeks/months
  recurrenceEndDate: timestamp("recurrence_end_date"),
  recurrenceCount: integer("recurrence_count"), // Number of occurrences
  parentMeetingId: integer("parent_meeting_id"), // Reference to parent if this is a recurring instance
  
  // Reminders
  reminderEnabled: boolean("reminder_enabled").default(true),
  reminderMinutesBefore: integer("reminder_minutes_before").default(15), // 15 min before
  reminderSent: boolean("reminder_sent").default(false),
  
  // Metadata
  tags: jsonb("tags").default([]),
  attachments: jsonb("attachments").default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meeting Attendees table
export const meetingAttendees = pgTable("meeting_attendees", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => studioMeetings.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Attendance tracking
  inviteStatus: text("invite_status").default("pending"), // pending, accepted, declined, maybe
  attended: boolean("attended").default(false),
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  
  // Participant details
  role: text("role"), // presenter, facilitator, note-taker, attendee
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meeting Notes & Action Items table
export const meetingNotes = pgTable("meeting_notes", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => studioMeetings.id).notNull(),
  
  // Note content
  noteType: text("note_type").default("note"), // note, action_item, decision, question
  content: text("content").notNull(),
  
  // Action item specific fields
  assignedTo: integer("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  
  // Organization
  priority: taskPriorityEnum("priority").default("medium"),
  tags: jsonb("tags").default([]),
  
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meeting Work Items table - Track work completed after meetings
export const meetingWorkItems = pgTable("meeting_work_items", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => studioMeetings.id, { onDelete: "cascade" }).notNull(),
  
  // Work item details
  title: text("title").notNull(),
  description: text("description"),
  category: workItemCategoryEnum("category").notNull(),
  
  // Progress tracking
  status: workItemStatusEnum("status").default("in_progress").notNull(),
  progressPercentage: integer("progress_percentage").default(0),
  
  // Metrics
  hoursSpent: decimal("hours_spent"),
  completionDate: timestamp("completion_date"),
  
  // Analytics metrics (JSONB validated at API level for known keys)
  impactMetrics: jsonb("impact_metrics").default(sql`'{}'::jsonb`), // views, engagement, conversions, etc.
  
  // Assignment
  assignedTo: integer("assigned_to").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meeting Links table - Store relevant links for work done after meetings
export const meetingLinks = pgTable("meeting_links", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => studioMeetings.id, { onDelete: "cascade" }).notNull(),
  workItemId: integer("work_item_id").references(() => meetingWorkItems.id, { onDelete: "set null" }), // Optional link to specific work item
  
  // Link details
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  linkType: linkTypeEnum("link_type").notNull(),
  
  // Analytics/Metrics from the link (JSONB validated at API level)
  metrics: jsonb("metrics").default(sql`'{}'::jsonb`), // views, clicks, performance data, etc.
  
  // Organization
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Creative Briefs table - Comprehensive project briefs
export const creativeBriefs = pgTable("creative_briefs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  
  // Brief details
  objective: text("objective").notNull(), // What we want to achieve
  targetAudience: text("target_audience"),
  keyMessage: text("key_message"),
  toneAndStyle: text("tone_and_style"),
  
  // Project scope
  deliverables: jsonb("deliverables").default([]), // List of expected deliverables
  specifications: jsonb("specifications").default({}), // Technical specifications
  inspirationReferences: jsonb("inspiration_references").default([]), // Reference images/links
  
  // Timeline and budget
  deadline: timestamp("deadline"),
  estimatedHours: decimal("estimated_hours", { precision: 6, scale: 2 }),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  
  // Assignment
  createdBy: integer("created_by").references(() => users.id).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  creativeDirector: integer("creative_director").references(() => users.id),
  
  // Project association
  campaignId: integer("campaign_id").references(() => socialMediaCampaigns.id),
  projectId: integer("project_id").references(() => socialMediaProjects.id),
  
  // Status
  status: briefStatusEnum("status").default("draft").notNull(),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  
  // Collaboration
  collaborators: jsonb("collaborators").default([]), // Array of user IDs
  feedback: jsonb("feedback").default([]), // Array of feedback objects
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics Entries table - Manual analytics data entry
export const analyticsEntries = pgTable("analytics_entries", {
  id: serial("id").primaryKey(),
  
  // Platform and post details
  platform: socialPlatformEnum("platform").notNull(),
  postTitle: text("post_title").notNull(),
  postDescription: text("post_description"),
  postUrl: text("post_url"),
  postDate: timestamp("post_date").notNull(),
  
  // Performance metrics
  reach: integer("reach").default(0),
  impressions: integer("impressions").default(0),
  engagement: integer("engagement").default(0), // Total engagement (likes + comments + shares)
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  clicks: integer("clicks").default(0),
  videoViews: integer("video_views").default(0),
  
  // Additional metrics
  saves: integer("saves").default(0),
  profileVisits: integer("profile_visits").default(0),
  followers: integer("followers").default(0), // Follower count at time of post
  
  // Association
  campaignId: integer("campaign_id").references(() => socialMediaCampaigns.id),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  
  // Metadata
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Library table - Centralized media and template storage
export const assetLibrary = pgTable("asset_library", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Asset details
  assetType: assetTypeEnum("asset_type").notNull(),
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  
  // File information
  fileName: text("file_name").notNull(),
  fileSize: bigint("file_size", { mode: "number" }), // in bytes
  mimeType: text("mime_type"),
  dimensions: jsonb("dimensions"), // { width: 1920, height: 1080 }
  duration: integer("duration"), // for video/audio in seconds
  
  // Organization
  category: text("category"), // logos, templates, stock_photos, etc.
  tags: jsonb("tags").default([]),
  brandId: integer("brand_id").references(() => brandGuidelines.id),
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  // Access control
  isPublic: boolean("is_public").default(false),
  allowedUsers: jsonb("allowed_users").default([]), // Array of user IDs who can access
  allowedRoles: jsonb("allowed_roles").default([]), // Array of roles who can access
  
  // Metadata
  createdBy: integer("created_by").references(() => users.id).notNull(),
  license: text("license"), // Usage rights information
  source: text("source"), // Where the asset came from
  expiresAt: timestamp("expires_at"), // For time-limited assets
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Approval Workflows table - Multi-level content approval system
export const approvalWorkflows = pgTable("approval_workflows", {
  id: serial("id").primaryKey(),
  
  // What's being approved
  itemType: text("item_type").notNull(), // content, campaign, creative_brief, asset, etc.
  itemId: integer("item_id").notNull(), // ID of the item being approved
  itemTitle: text("item_title"),
  
  // Approval process
  requester: integer("requester").references(() => users.id).notNull(),
  currentApprover: integer("current_approver").references(() => users.id),
  approvalChain: jsonb("approval_chain").default([]), // Array of user IDs in approval order
  currentStep: integer("current_step").default(1),
  totalSteps: integer("total_steps").notNull(),
  
  // Status
  status: approvalStatusEnum("status").default("pending").notNull(),
  priority: taskPriorityEnum("priority").default("medium"),
  
  // Decision details
  approvedBy: jsonb("approved_by").default([]), // Array of {userId, approvedAt, comments}
  rejectedBy: integer("rejected_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  revisionNotes: text("revision_notes"),
  
  // Timeline
  requestedAt: timestamp("requested_at").defaultNow(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  
  // Attachments and context
  attachments: jsonb("attachments").default([]),
  context: text("context"), // Additional context for reviewers
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dashboard Sections table - Configurable dashboard widgets for Studio Overview
export const dashboardSections = pgTable("dashboard_sections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  
  // Display configuration
  layout: dashboardLayoutEnum("layout").notNull(), // How to display: cards, timeline, table, stats
  dataSource: dashboardDataSourceEnum("data_source").notNull(), // Where data comes from
  
  // Query configuration (JSON object defining filters, sorting, limits)
  // Examples:
  // - { "status": "active", "sortBy": "startDate", "limit": 10 }
  // - { "dateRange": "next_7_days", "contentType": "video", "sortBy": "scheduledDate" }
  queryConfig: jsonb("query_config").default({}),
  
  // Presentation configuration (JSON object defining which fields to show, aggregations)
  // Examples:
  // - { "fields": ["title", "platform", "scheduledDate"], "showStats": true }
  // - { "aggregations": ["impressions", "engagements"], "calculateRates": true }
  presentationConfig: jsonb("presentation_config").default({}),
  
  // Organization and ordering
  organizationId: text("organization_id").notNull(), // Multi-tenancy support
  displayOrder: integer("display_order").default(0).notNull(), // Order on dashboard
  isVisible: boolean("is_visible").default(true).notNull(), // Can be toggled on/off
  
  // Metadata
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Studio Performance Reports table - Analytics for admin/HR
export const studioReports = pgTable("studio_reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(), // daily, weekly, monthly, campaign, project, team
  reportPeriod: text("report_period").notNull(), // e.g., "2025-01", "2025-W10", "Q1-2025"
  
  // Time range
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Team performance metrics
  totalCampaigns: integer("total_campaigns").default(0),
  totalContent: integer("total_content").default(0),
  totalProjects: integer("total_projects").default(0),
  totalMeetings: integer("total_meetings").default(0),
  
  // Content metrics
  contentPublished: integer("content_published").default(0),
  contentInReview: integer("content_in_review").default(0),
  contentDrafts: integer("content_drafts").default(0),
  contentRejected: integer("content_rejected").default(0),
  
  // Engagement metrics (aggregated from social media)
  totalImpressions: integer("total_impressions").default(0),
  totalEngagements: integer("total_engagements").default(0),
  totalReach: integer("total_reach").default(0),
  averageEngagementRate: decimal("average_engagement_rate", { precision: 5, scale: 2 }).default('0'),
  
  // Team productivity
  totalTasksCompleted: integer("total_tasks_completed").default(0),
  totalTasksOverdue: integer("total_tasks_overdue").default(0),
  averageTaskCompletionTime: decimal("average_task_completion_time", { precision: 6, scale: 2 }), // in hours
  
  // Creative production metrics
  totalBriefsCreated: integer("total_briefs_created").default(0),
  totalBriefsCompleted: integer("total_briefs_completed").default(0),
  totalAssetsCreated: integer("total_assets_created").default(0),
  totalApprovalsProcessed: integer("total_approvals_processed").default(0),
  
  // Time and budget tracking
  totalHoursLogged: decimal("total_hours_logged", { precision: 8, scale: 2 }).default('0'),
  totalBudgetSpent: decimal("total_budget_spent", { precision: 12, scale: 2 }).default('0'),
  
  // Team member breakdown
  teamMemberStats: jsonb("team_member_stats").default([]), // Detailed per-member statistics
  campaignStats: jsonb("campaign_stats").default([]), // Detailed per-campaign statistics
  platformStats: jsonb("platform_stats").default([]), // Detailed per-platform statistics
  
  // Additional insights
  topPerformingContent: jsonb("top_performing_content").default([]),
  topPerformingTeamMembers: jsonb("top_performing_team_members").default([]),
  insights: text("insights"), // AI-generated or manual insights
  recommendations: text("recommendations"), // Suggested improvements
  
  // Report metadata
  generatedBy: integer("generated_by").references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for Meeting Matters Studio tables
export const studioMeetingsRelations = relations(studioMeetings, ({ one, many }) => ({
  organizer: one(users, {
    fields: [studioMeetings.organizerId],
    references: [users.id],
  }),
  campaign: one(socialMediaCampaigns, {
    fields: [studioMeetings.campaignId],
    references: [socialMediaCampaigns.id],
  }),
  project: one(socialMediaProjects, {
    fields: [studioMeetings.projectId],
    references: [socialMediaProjects.id],
  }),
  attendees: many(meetingAttendees),
  notes: many(meetingNotes),
  workItems: many(meetingWorkItems),
  links: many(meetingLinks),
}));

export const meetingAttendeesRelations = relations(meetingAttendees, ({ one }) => ({
  meeting: one(studioMeetings, {
    fields: [meetingAttendees.meetingId],
    references: [studioMeetings.id],
  }),
  user: one(users, {
    fields: [meetingAttendees.userId],
    references: [users.id],
  }),
}));

export const meetingNotesRelations = relations(meetingNotes, ({ one }) => ({
  meeting: one(studioMeetings, {
    fields: [meetingNotes.meetingId],
    references: [studioMeetings.id],
  }),
  assignee: one(users, {
    fields: [meetingNotes.assignedTo],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [meetingNotes.createdBy],
    references: [users.id],
  }),
}));

export const meetingWorkItemsRelations = relations(meetingWorkItems, ({ one, many }) => ({
  meeting: one(studioMeetings, {
    fields: [meetingWorkItems.meetingId],
    references: [studioMeetings.id],
  }),
  assignee: one(users, {
    fields: [meetingWorkItems.assignedTo],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [meetingWorkItems.createdBy],
    references: [users.id],
  }),
  links: many(meetingLinks),
}));

export const meetingLinksRelations = relations(meetingLinks, ({ one }) => ({
  meeting: one(studioMeetings, {
    fields: [meetingLinks.meetingId],
    references: [studioMeetings.id],
  }),
  workItem: one(meetingWorkItems, {
    fields: [meetingLinks.workItemId],
    references: [meetingWorkItems.id],
  }),
  creator: one(users, {
    fields: [meetingLinks.createdBy],
    references: [users.id],
  }),
}));

export const creativeBriefsRelations = relations(creativeBriefs, ({ one }) => ({
  creator: one(users, {
    fields: [creativeBriefs.createdBy],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [creativeBriefs.assignedTo],
    references: [users.id],
  }),
  director: one(users, {
    fields: [creativeBriefs.creativeDirector],
    references: [users.id],
  }),
  campaign: one(socialMediaCampaigns, {
    fields: [creativeBriefs.campaignId],
    references: [socialMediaCampaigns.id],
  }),
  project: one(socialMediaProjects, {
    fields: [creativeBriefs.projectId],
    references: [socialMediaProjects.id],
  }),
}));

export const assetLibraryRelations = relations(assetLibrary, ({ one }) => ({
  creator: one(users, {
    fields: [assetLibrary.createdBy],
    references: [users.id],
  }),
  brand: one(brandGuidelines, {
    fields: [assetLibrary.brandId],
    references: [brandGuidelines.id],
  }),
}));

export const approvalWorkflowsRelations = relations(approvalWorkflows, ({ one }) => ({
  requesterUser: one(users, {
    fields: [approvalWorkflows.requester],
    references: [users.id],
  }),
  currentApproverUser: one(users, {
    fields: [approvalWorkflows.currentApprover],
    references: [users.id],
  }),
  rejectedByUser: one(users, {
    fields: [approvalWorkflows.rejectedBy],
    references: [users.id],
  }),
}));

export const studioReportsRelations = relations(studioReports, ({ one }) => ({
  generator: one(users, {
    fields: [studioReports.generatedBy],
    references: [users.id],
  }),
}));

export const dashboardSectionsRelations = relations(dashboardSections, ({ one }) => ({
  creator: one(users, {
    fields: [dashboardSections.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas for Meeting Matters Studio tables
export const insertStudioMeetingSchema = createInsertSchema(studioMeetings);
export type InsertStudioMeeting = z.infer<typeof insertStudioMeetingSchema>;
export type StudioMeeting = typeof studioMeetings.$inferSelect;

export const insertMeetingAttendeeSchema = createInsertSchema(meetingAttendees);
export type InsertMeetingAttendee = z.infer<typeof insertMeetingAttendeeSchema>;
export type MeetingAttendee = typeof meetingAttendees.$inferSelect;

export const insertMeetingNoteSchema = createInsertSchema(meetingNotes);
export type InsertMeetingNote = z.infer<typeof insertMeetingNoteSchema>;
export type MeetingNote = typeof meetingNotes.$inferSelect;

export const insertMeetingWorkItemSchema = createInsertSchema(meetingWorkItems).omit({ id: true });
export type InsertMeetingWorkItem = z.infer<typeof insertMeetingWorkItemSchema>;
export type MeetingWorkItem = typeof meetingWorkItems.$inferSelect;

export const insertMeetingLinkSchema = createInsertSchema(meetingLinks).omit({ id: true });
export type InsertMeetingLink = z.infer<typeof insertMeetingLinkSchema>;
export type MeetingLink = typeof meetingLinks.$inferSelect;

export const insertCreativeBriefSchema = createInsertSchema(creativeBriefs);
export type InsertCreativeBrief = z.infer<typeof insertCreativeBriefSchema>;
export type CreativeBrief = typeof creativeBriefs.$inferSelect;

export const insertAnalyticsEntrySchema = createInsertSchema(analyticsEntries).omit({ id: true });
export type InsertAnalyticsEntry = z.infer<typeof insertAnalyticsEntrySchema>;
export type AnalyticsEntry = typeof analyticsEntries.$inferSelect;

export const insertAssetLibrarySchema = createInsertSchema(assetLibrary);
export type InsertAssetLibrary = z.infer<typeof insertAssetLibrarySchema>;
export type AssetLibrary = typeof assetLibrary.$inferSelect;

export const insertApprovalWorkflowSchema = createInsertSchema(approvalWorkflows);
export type InsertApprovalWorkflow = z.infer<typeof insertApprovalWorkflowSchema>;
export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;

export const insertStudioReportSchema = createInsertSchema(studioReports);
export type InsertStudioReport = z.infer<typeof insertStudioReportSchema>;
export type StudioReport = typeof studioReports.$inferSelect;

export const insertDashboardSectionSchema = createInsertSchema(dashboardSections).omit({ id: true });
export type InsertDashboardSection = z.infer<typeof insertDashboardSectionSchema>;
export type DashboardSection = typeof dashboardSections.$inferSelect;

// CRM Inquiry Source enum
export const inquirySourceEnum = pgEnum("inquiry_source", [
  "whatsapp_message",
  "whatsapp_call",
  "email",
  "call",
  "walk_in",
  "job_portal",
  "website",
  "social_media",
  "referral",
  "other"
]);

// CRM Inquiry Status enum
export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "positive",
  "negative",
  "no_response",
  "in_progress",
  "applied",
  "booked",
  "converted",
  "lost",
  "follow_up_required"
]);

// CRM Inquiries Table
export const crmInquiries = pgTable("crm_inquiries", {
  id: serial("id").primaryKey(),
  
  // Basic inquiry information
  name: text("name").notNull(),
  contact: text("contact").notNull(), // Phone number or email
  
  // Time tracking
  inquiryTime: timestamp("inquiry_time").notNull(),
  responseTime: timestamp("response_time"),
  callDuration: varchar("call_duration", { length: 50 }), // e.g., "3 min 21 sec"
  
  // Inquiry details
  attendant: text("attendant").notNull(), // Who handled the inquiry
  inquirySource: inquirySourceEnum("inquiry_source").notNull(),
  inquiryType: text("inquiry_type").notNull(), // session, session inquiry, consultation, etc.
  status: inquiryStatusEnum("status").default("in_progress").notNull(),
  
  // Additional information
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  
  // Multi-tenant support
  organizationId: varchar("organization_id").notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for CRM Inquiries
export const insertCrmInquirySchema = createInsertSchema(crmInquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCrmInquiry = z.infer<typeof insertCrmInquirySchema>;
export type CrmInquiry = typeof crmInquiries.$inferSelect;

// Organizational Units Table (Hierarchy Structure)
export const orgUnits = pgTable("org_units", {
  id: serial("id").primaryKey(),
  organizationId: varchar("organization_id").notNull(),
  companyId: integer("company_id"),
  
  // Unit details
  title: text("title").notNull(),
  description: text("description"),
  
  // Hierarchy
  parentUnitId: integer("parent_unit_id"),
  orderIndex: integer("order_index").default(0),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  
  // Metadata
  responsibilities: text("responsibilities"),
  location: varchar("location"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizational Unit Assignments (Employee to Org Unit mapping)
export const orgUnitAssignments = pgTable("org_unit_assignments", {
  id: serial("id").primaryKey(),
  orgUnitId: integer("org_unit_id").notNull().references(() => orgUnits.id),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  
  // Assignment details
  isPrimary: boolean("is_primary").default(true).notNull(),
  effectiveFrom: timestamp("effective_from").defaultNow(),
  effectiveTo: timestamp("effective_to"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for Organizational Units
export const orgUnitsRelations = relations(orgUnits, ({ one, many }) => ({
  parent: one(orgUnits, {
    fields: [orgUnits.parentUnitId],
    references: [orgUnits.id],
  }),
  children: many(orgUnits),
  assignments: many(orgUnitAssignments),
  company: one(companies, {
    fields: [orgUnits.companyId],
    references: [companies.id],
  }),
}));

export const orgUnitAssignmentsRelations = relations(orgUnitAssignments, ({ one }) => ({
  orgUnit: one(orgUnits, {
    fields: [orgUnitAssignments.orgUnitId],
    references: [orgUnits.id],
  }),
  employee: one(employees, {
    fields: [orgUnitAssignments.employeeId],
    references: [employees.id],
  }),
}));

// Zod schemas for Organizational Units
export const insertOrgUnitSchema = createInsertSchema(orgUnits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrgUnit = z.infer<typeof insertOrgUnitSchema>;
export type OrgUnit = typeof orgUnits.$inferSelect;

export const insertOrgUnitAssignmentSchema = createInsertSchema(orgUnitAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrgUnitAssignment = z.infer<typeof insertOrgUnitAssignmentSchema>;
export type OrgUnitAssignment = typeof orgUnitAssignments.$inferSelect;
