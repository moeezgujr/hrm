CREATE TYPE "public"."content_status" AS ENUM('draft', 'in_review', 'approved', 'published', 'archived', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('social_media_post', 'blog_article', 'video_content', 'graphic_design', 'campaign_material', 'newsletter', 'website_content', 'advertisement');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('task_assigned', 'task_completed', 'task_explanation', 'task_overdue', 'project_assigned', 'project_updated', 'approval_request', 'approval_decision', 'onboarding_step', 'onboarding_review', 'meeting_scheduled', 'meeting_reminder', 'document_uploaded', 'document_reviewed', 'recognition_received', 'recognition_nominated', 'system_announcement', 'profile_updated');--> statement-breakpoint
CREATE TYPE "public"."project_member_role" AS ENUM('member', 'lead', 'coordinator', 'developer', 'designer', 'tester', 'analyst');--> statement-breakpoint
CREATE TYPE "public"."project_note_type" AS ENUM('daily', 'weekly', 'monthly', 'milestone', 'general');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."trial_status" AS ENUM('pending', 'approved', 'rejected', 'expired');--> statement-breakpoint
ALTER TYPE "public"."department_type" ADD VALUE 'social_media_content';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'department_head';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'project_manager';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'social_media_manager';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'content_creator';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'content_editor';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'social_media_specialist';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'creative_director';--> statement-breakpoint
ALTER TYPE "public"."user_status" ADD VALUE 'pending_approval';--> statement-breakpoint
CREATE TABLE "billing_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"subscription_id" integer,
	"payment_id" integer,
	"event_type" varchar(50) NOT NULL,
	"event_data" jsonb,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "brand_guidelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_name" text NOT NULL,
	"description" text,
	"color_palette" jsonb DEFAULT '[]'::jsonb,
	"fonts" jsonb DEFAULT '[]'::jsonb,
	"logo_urls" jsonb DEFAULT '[]'::jsonb,
	"tone_of_voice" text,
	"messaging_pillars" jsonb DEFAULT '[]'::jsonb,
	"do_and_donts" jsonb DEFAULT '{}'::jsonb,
	"template_urls" jsonb DEFAULT '[]'::jsonb,
	"asset_library_urls" jsonb DEFAULT '[]'::jsonb,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_calendar" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content_type" "content_type" NOT NULL,
	"content" text,
	"media_urls" jsonb DEFAULT '[]'::jsonb,
	"hashtags" text,
	"mentions" text,
	"platform" text,
	"scheduled_date" timestamp,
	"published_date" timestamp,
	"campaign_id" integer,
	"status" "content_status" DEFAULT 'draft',
	"created_by" integer NOT NULL,
	"assigned_to" integer,
	"approved_by" integer,
	"approved_at" timestamp,
	"likes" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"reach" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"trial_request_id" integer,
	"stripe_customer_id" varchar(255),
	"company_name" varchar(255) NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"address" text,
	"status" varchar(20) DEFAULT 'trial' NOT NULL,
	"trial_start_date" timestamp,
	"trial_end_date" timestamp,
	"subscription_start_date" timestamp,
	"plan_id" "subscription_plan" NOT NULL,
	"billing_cycle" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "logistics_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer,
	"expense_type" varchar NOT NULL,
	"amount" numeric NOT NULL,
	"currency" varchar DEFAULT 'USD',
	"description" text,
	"date" timestamp NOT NULL,
	"vendor" varchar,
	"invoice_number" varchar,
	"receipt_url" varchar,
	"payment_method" varchar,
	"payment_status" varchar DEFAULT 'pending',
	"approved_by" varchar,
	"recorded_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "logistics_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"movement_type" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"previous_quantity" integer NOT NULL,
	"new_quantity" integer NOT NULL,
	"reason" text,
	"location" varchar,
	"reference_id" integer,
	"reference_type" varchar,
	"performed_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"is_read" boolean DEFAULT false,
	"action_required" boolean DEFAULT false,
	"action_url" text,
	"related_entity_type" text,
	"related_entity_id" integer,
	"priority" text DEFAULT 'normal',
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"subscription_id" integer,
	"stripe_payment_intent_id" varchar(255),
	"stripe_invoice_id" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'usd' NOT NULL,
	"status" varchar(20) NOT NULL,
	"payment_method" varchar(50),
	"description" text,
	"paid_at" timestamp,
	"failure_reason" text,
	"refunded_amount" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "project_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"uploaded_by" integer NOT NULL,
	"file_name" varchar NOT NULL,
	"file_size" integer,
	"file_type" varchar,
	"file_content" text,
	"description" text,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"message" text NOT NULL,
	"message_type" varchar DEFAULT 'text',
	"reply_to_id" integer,
	"is_edited" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"type" "project_note_type" NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"note_date" timestamp DEFAULT now(),
	"is_private" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_overview" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"overview" text,
	"objectives" text[],
	"deliverables" text[],
	"milestones" text[],
	"risks" text[],
	"resources" text[],
	"timeline" text,
	"budget" text,
	"stakeholders" text[],
	"success_criteria" text[],
	"dependencies" text[],
	"assumptions" text[],
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "project_overview_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "project_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"assigned_to" integer,
	"assigned_by" integer,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"estimated_hours" integer,
	"actual_hours" integer,
	"overdue_explanation" text,
	"overdue_notification_sent" timestamp,
	"due_date_extended" timestamp,
	"extension_reason" text,
	"extension_granted_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"project_manager_id" integer NOT NULL,
	"status" "project_status" DEFAULT 'planning' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"budget" numeric,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"client_name" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "registration_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"requested_role" "user_role" DEFAULT 'employee',
	"requested_department" "department_type",
	"position" text,
	"phone_number" text,
	"status" text DEFAULT 'pending',
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"review_notes" text,
	"onboarding_started" boolean DEFAULT false,
	"onboarding_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "registration_requests_email_unique" UNIQUE("email"),
	CONSTRAINT "registration_requests_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "social_media_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"objective" text,
	"target_audience" text,
	"platforms" jsonb DEFAULT '[]'::jsonb,
	"budget" numeric(10, 2),
	"start_date" timestamp,
	"end_date" timestamp,
	"status" text DEFAULT 'planning',
	"created_by" integer NOT NULL,
	"assigned_to" integer,
	"impressions" integer DEFAULT 0,
	"engagements" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_media_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"client_brand" text,
	"project_type" text,
	"priority" text DEFAULT 'medium',
	"start_date" timestamp,
	"end_date" timestamp,
	"deadline" timestamp,
	"project_manager" integer,
	"creative_director" integer,
	"content_creators" jsonb DEFAULT '[]'::jsonb,
	"status" "project_status" DEFAULT 'planning',
	"progress" integer DEFAULT 0,
	"budget" numeric(10, 2),
	"resources_required" jsonb DEFAULT '[]'::jsonb,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_media_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"task_type" text,
	"priority" "task_priority" DEFAULT 'medium',
	"estimated_hours" numeric(4, 2),
	"assigned_to" integer,
	"assigned_by" integer NOT NULL,
	"project_id" integer,
	"campaign_id" integer,
	"content_id" integer,
	"due_date" timestamp,
	"start_date" timestamp,
	"completed_date" timestamp,
	"status" "task_status" DEFAULT 'pending',
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"subscription_id" varchar,
	"plan_id" "subscription_plan" NOT NULL,
	"status" "subscription_status" NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"amount" numeric NOT NULL,
	"billing_cycle" varchar NOT NULL,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"plan_id" "subscription_plan" NOT NULL,
	"description" text,
	"monthly_price" numeric NOT NULL,
	"yearly_price" numeric NOT NULL,
	"features" jsonb NOT NULL,
	"max_employees" integer,
	"max_projects" integer,
	"max_storage" integer,
	"is_active" boolean DEFAULT true,
	"stripe_price_id_monthly" varchar,
	"stripe_price_id_yearly" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscription_plans_plan_id_unique" UNIQUE("plan_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"stripe_subscription_id" varchar(255),
	"plan_id" "subscription_plan" NOT NULL,
	"status" varchar(20) NOT NULL,
	"billing_cycle" varchar(20) NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"canceled_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'usd' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "trial_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"company" varchar NOT NULL,
	"phone" varchar,
	"job_title" varchar NOT NULL,
	"team_size" varchar NOT NULL,
	"plan_id" "subscription_plan" NOT NULL,
	"billing_cycle" varchar NOT NULL,
	"status" "trial_status" DEFAULT 'pending',
	"approved_by" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"trial_start_date" timestamp,
	"trial_end_date" timestamp,
	"created_user_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "employee_submissions" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "employee_submissions" ADD COLUMN "account_holder_name" text;--> statement-breakpoint
ALTER TABLE "employee_submissions" ADD COLUMN "account_number" text;--> statement-breakpoint
ALTER TABLE "employee_submissions" ADD COLUMN "account_type" text;--> statement-breakpoint
ALTER TABLE "employee_submissions" ADD COLUMN "routing_number" text;--> statement-breakpoint
ALTER TABLE "employee_submissions" ADD COLUMN "iban" text;--> statement-breakpoint
ALTER TABLE "employee_submissions" ADD COLUMN "cnic_number" text;--> statement-breakpoint
ALTER TABLE "employee_submissions" ADD COLUMN "passport_number" text;--> statement-breakpoint
ALTER TABLE "employee_submissions" ADD COLUMN "tax_id_number" text;--> statement-breakpoint
ALTER TABLE "employee_submissions" ADD COLUMN "cv_document" text;--> statement-breakpoint
ALTER TABLE "employee_submissions" ADD COLUMN "cnic_document" text;--> statement-breakpoint
ALTER TABLE "employee_submissions" ADD COLUMN "profile_picture" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "onboarding_link" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "preferred_name" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "date_of_birth" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "gender" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "marital_status" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "nationality" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "personal_email" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "alternate_phone" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "current_address" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "permanent_address" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "city" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "state" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "zip_code" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "country" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "emergency_contact_name" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "emergency_contact_relation" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "emergency_contact_phone" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "emergency_contact_address" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "position" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "department" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "start_date" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employment_type" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "work_location" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "reporting_manager" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "highest_education" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "university" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "graduation_year" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "major_subject" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "skills" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "certifications" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "languages_spoken" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "previous_experience" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "hobbies" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_name" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "account_holder_name" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "account_number" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "account_type" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "routing_number" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "iban" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "swift_code" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "cnic_number" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "passport_number" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "driving_license_number" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "social_security_number" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "tax_id_number" varchar;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "cv_document" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "cnic_document" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "education_certificates" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "experience_letters" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "profile_picture" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "additional_documents" jsonb;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "privacy_policy_agreed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "terms_and_conditions_agreed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "background_check_consent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "data_processing_consent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "personal_profile_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "personal_profile_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "logistics_items" ADD COLUMN "max_quantity" integer;--> statement-breakpoint
ALTER TABLE "logistics_items" ADD COLUMN "unit_cost" numeric;--> statement-breakpoint
ALTER TABLE "logistics_items" ADD COLUMN "supplier" varchar;--> statement-breakpoint
ALTER TABLE "logistics_items" ADD COLUMN "barcode" varchar;--> statement-breakpoint
ALTER TABLE "logistics_items" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD COLUMN "delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD COLUMN "category" varchar;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD COLUMN "department" varchar;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD COLUMN "cost_center" varchar;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD COLUMN "budget_code" varchar;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD COLUMN "tax_amount" numeric;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD COLUMN "shipping_cost" numeric;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD COLUMN "is_recurring" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD COLUMN "recurring_frequency" varchar;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD COLUMN "next_recurring_date" timestamp;--> statement-breakpoint
ALTER TABLE "onboarding_checklists" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "task_requests" ADD COLUMN "department_id" integer;--> statement-breakpoint
ALTER TABLE "task_requests" ADD COLUMN "assigned_to_employee_id" varchar;--> statement-breakpoint
ALTER TABLE "task_requests" ADD COLUMN "estimated_hours" integer;--> statement-breakpoint
ALTER TABLE "task_requests" ADD COLUMN "due_date" timestamp;--> statement-breakpoint
ALTER TABLE "task_requests" ADD COLUMN "assigned_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_token" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_status" varchar DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_progress" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_status" "subscription_status";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_plan" "subscription_plan";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_guidelines" ADD CONSTRAINT "brand_guidelines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_calendar" ADD CONSTRAINT "content_calendar_campaign_id_social_media_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."social_media_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_calendar" ADD CONSTRAINT "content_calendar_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_calendar" ADD CONSTRAINT "content_calendar_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_calendar" ADD CONSTRAINT "content_calendar_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_trial_request_id_trial_requests_id_fk" FOREIGN KEY ("trial_request_id") REFERENCES "public"."trial_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_expenses" ADD CONSTRAINT "logistics_expenses_request_id_logistics_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."logistics_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_expenses" ADD CONSTRAINT "logistics_expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_expenses" ADD CONSTRAINT "logistics_expenses_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_movements" ADD CONSTRAINT "logistics_movements_item_id_logistics_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."logistics_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_movements" ADD CONSTRAINT "logistics_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_messages" ADD CONSTRAINT "project_messages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_messages" ADD CONSTRAINT "project_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_overview" ADD CONSTRAINT "project_overview_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_overview" ADD CONSTRAINT "project_overview_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_extension_granted_by_users_id_fk" FOREIGN KEY ("extension_granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_manager_id_users_id_fk" FOREIGN KEY ("project_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_campaigns" ADD CONSTRAINT "social_media_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_campaigns" ADD CONSTRAINT "social_media_campaigns_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_projects" ADD CONSTRAINT "social_media_projects_project_manager_users_id_fk" FOREIGN KEY ("project_manager") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_projects" ADD CONSTRAINT "social_media_projects_creative_director_users_id_fk" FOREIGN KEY ("creative_director") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_projects" ADD CONSTRAINT "social_media_projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_tasks" ADD CONSTRAINT "social_media_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_tasks" ADD CONSTRAINT "social_media_tasks_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_tasks" ADD CONSTRAINT "social_media_tasks_project_id_social_media_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."social_media_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_tasks" ADD CONSTRAINT "social_media_tasks_campaign_id_social_media_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."social_media_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_tasks" ADD CONSTRAINT "social_media_tasks_content_id_content_calendar_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_calendar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_requests" ADD CONSTRAINT "trial_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_requests" ADD CONSTRAINT "trial_requests_created_user_id_users_id_fk" FOREIGN KEY ("created_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_requests" ADD CONSTRAINT "task_requests_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_requests" ADD CONSTRAINT "task_requests_assigned_to_employee_id_users_id_fk" FOREIGN KEY ("assigned_to_employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;