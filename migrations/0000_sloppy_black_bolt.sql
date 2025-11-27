CREATE TYPE "public"."department_type" AS ENUM('human_resources', 'information_technology', 'finance_accounting', 'sales_marketing', 'operations', 'customer_service', 'research_development', 'legal_compliance', 'executive_management', 'facilities_maintenance');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('hr_admin', 'branch_manager', 'team_lead', 'employee', 'logistics_manager');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'onboarding', 'terminated');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"author_id" varchar,
	"is_published" boolean DEFAULT false,
	"target_roles" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"manager_id" integer,
	"budget_allocated" numeric,
	"headcount" integer DEFAULT 0,
	"location" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar NOT NULL,
	"original_name" varchar NOT NULL,
	"mime_type" varchar NOT NULL,
	"size" integer NOT NULL,
	"uploaded_by" varchar,
	"related_to" varchar,
	"related_type" varchar,
	"is_approved" boolean DEFAULT false,
	"approved_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"date_of_birth" text,
	"gender" text,
	"marital_status" text,
	"nationality" text,
	"email" text NOT NULL,
	"phone_number" text NOT NULL,
	"alternate_phone" text,
	"current_address" text NOT NULL,
	"permanent_address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text,
	"position" text NOT NULL,
	"department" text NOT NULL,
	"start_date" text NOT NULL,
	"employment_type" text,
	"work_location" text,
	"reporting_manager" text,
	"highest_education" text,
	"university" text,
	"graduation_year" text,
	"major_subject" text,
	"emergency_contact_name" text NOT NULL,
	"emergency_contact_relation" text,
	"emergency_contact_phone" text NOT NULL,
	"emergency_contact_address" text,
	"skills" text,
	"previous_experience" text,
	"languages_spoken" text,
	"hobbies" text,
	"privacy_policy_agreed" boolean DEFAULT false,
	"terms_conditions_agreed" boolean DEFAULT false,
	"background_check_consent" boolean DEFAULT false,
	"status" text DEFAULT 'pending',
	"submitted_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"assigned_hr" text,
	"hr_steps_completed" jsonb DEFAULT '[]'::jsonb,
	"hr_steps_notes" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"employee_id" varchar NOT NULL,
	"phone_number" varchar,
	"address" text,
	"emergency_contact" jsonb,
	"onboarding_status" varchar DEFAULT 'not_started',
	"onboarding_progress" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "logistics_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" varchar NOT NULL,
	"quantity" integer DEFAULT 0,
	"min_quantity" integer DEFAULT 0,
	"location" varchar,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "logistics_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_id" varchar,
	"item_id" integer,
	"item_name" varchar,
	"description" text,
	"quantity" integer NOT NULL,
	"reason" text,
	"status" varchar DEFAULT 'pending',
	"priority" varchar DEFAULT 'medium',
	"estimated_cost" numeric,
	"actual_cost" numeric,
	"vendor" varchar,
	"purchase_date" timestamp,
	"receipt_url" varchar,
	"receipt_filename" varchar,
	"notes" text,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"item_title" varchar NOT NULL,
	"description" text,
	"is_completed" boolean DEFAULT false,
	"completed_by" varchar,
	"due_date" timestamp,
	"order" integer DEFAULT 0,
	"requires_document" boolean DEFAULT false,
	"document_type" varchar,
	"document_url" varchar,
	"document_name" varchar,
	"is_document_verified" boolean DEFAULT false,
	"verified_by" varchar,
	"verified_at" timestamp,
	"verification_notes" text,
	"requires_psychometric_test" boolean DEFAULT false,
	"psychometric_test_id" integer,
	"psychometric_test_attempt_id" integer,
	"psychometric_test_completed" boolean DEFAULT false,
	"psychometric_test_score" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "psychometric_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"question_type" varchar(50) NOT NULL,
	"options" jsonb,
	"correct_answer" varchar(255),
	"category" varchar(100),
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "psychometric_test_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_email" varchar(255) NOT NULL,
	"candidate_name" varchar(255) NOT NULL,
	"test_id" integer NOT NULL,
	"responses" jsonb NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"time_spent" integer,
	"total_score" integer,
	"percentage_score" integer,
	"results" jsonb,
	"status" varchar(50) DEFAULT 'in_progress',
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "psychometric_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_name" varchar(100) NOT NULL,
	"test_type" varchar(50) NOT NULL,
	"description" text,
	"instructions" text,
	"time_limit" integer,
	"total_questions" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recognition" (
	"id" serial PRIMARY KEY NOT NULL,
	"nominee_id" varchar,
	"nominated_by" varchar,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"type" varchar NOT NULL,
	"is_approved" boolean DEFAULT false,
	"approved_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer,
	"requester_id" varchar NOT NULL,
	"request_type" varchar NOT NULL,
	"request_title" varchar NOT NULL,
	"request_description" text NOT NULL,
	"requested_extension" integer,
	"urgency_level" varchar DEFAULT 'medium',
	"status" varchar DEFAULT 'pending',
	"response_message" text,
	"responded_by" varchar,
	"responded_at" timestamp,
	"attachment_url" varchar,
	"attachment_name" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"update_text" text NOT NULL,
	"progress_percentage" integer DEFAULT 0,
	"hours_worked" numeric DEFAULT '0',
	"challenges" text,
	"next_steps" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"assigned_to" integer,
	"assigned_by" integer,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "user_role" DEFAULT 'employee' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"department" varchar,
	"position" varchar,
	"manager_id" integer,
	"start_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD CONSTRAINT "logistics_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD CONSTRAINT "logistics_requests_item_id_logistics_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."logistics_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD CONSTRAINT "logistics_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "onboarding_checklists_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "onboarding_checklists_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "onboarding_checklists_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "onboarding_checklists_psychometric_test_id_psychometric_tests_id_fk" FOREIGN KEY ("psychometric_test_id") REFERENCES "public"."psychometric_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "onboarding_checklists_psychometric_test_attempt_id_psychometric_test_attempts_id_fk" FOREIGN KEY ("psychometric_test_attempt_id") REFERENCES "public"."psychometric_test_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychometric_questions" ADD CONSTRAINT "psychometric_questions_test_id_psychometric_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."psychometric_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychometric_test_attempts" ADD CONSTRAINT "psychometric_test_attempts_test_id_psychometric_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."psychometric_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition" ADD CONSTRAINT "recognition_nominee_id_users_id_fk" FOREIGN KEY ("nominee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition" ADD CONSTRAINT "recognition_nominated_by_users_id_fk" FOREIGN KEY ("nominated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition" ADD CONSTRAINT "recognition_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_requests" ADD CONSTRAINT "task_requests_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_requests" ADD CONSTRAINT "task_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_requests" ADD CONSTRAINT "task_requests_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_updates" ADD CONSTRAINT "task_updates_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_updates" ADD CONSTRAINT "task_updates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");