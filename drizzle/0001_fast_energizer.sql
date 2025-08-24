CREATE TYPE "public"."activity_type" AS ENUM('login', 'logout', 'document_upload', 'message_sent', 'note_created', 'subscription_change', 'profile_updated');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TABLE "billing_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"payment_method" varchar(50),
	"payment_status" "payment_status" NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"razorpay_payment_id" varchar(255),
	"plan_id" varchar(50) NOT NULL,
	"plan_name" varchar(100) NOT NULL,
	"billing_period_start" timestamp NOT NULL,
	"billing_period_end" timestamp NOT NULL,
	"invoice_url" text,
	"invoice_number" varchar(100),
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"description" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"session_id" varchar(255),
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"sidebar_collapsed" boolean DEFAULT false NOT NULL,
	"panel_sizes" json,
	"enable_real_time_sync" boolean DEFAULT true NOT NULL,
	"enable_usage_warnings" boolean DEFAULT true NOT NULL,
	"enable_email_digest" boolean DEFAULT false NOT NULL,
	"enable_analytics" boolean DEFAULT true NOT NULL,
	"enable_crash_reporting" boolean DEFAULT true NOT NULL,
	"default_export_format" varchar(10) DEFAULT 'pdf',
	"advanced_settings" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription_start_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_reset_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "type" varchar(50) DEFAULT 'summary';--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "metadata" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organization" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "job_title" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "website" varchar(200);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "location" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "razorpay_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "razorpay_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "storage_used_bytes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "api_calls_today" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferences" json;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_completed_onboarding" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;