CREATE TABLE "site_settings" (
	"id" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"agency_name" text NOT NULL,
	"tagline" text,
	"logo_url" text,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp_number" text NOT NULL,
	"address" text,
	"facebook_url" text,
	"instagram_url" text,
	"tiktok_url" text,
	"x_url" text,
	"tripadvisor_url" text,
	"safaribookings_url" text,
	"default_currency" "currency" DEFAULT 'USD' NOT NULL,
	"deposit_percentage" integer DEFAULT 30 NOT NULL,
	"booking_terms" text,
	"cancellation_policy" text,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_single_row" CHECK ("site_settings"."id"),
	CONSTRAINT "site_settings_deposit_range" CHECK ("site_settings"."deposit_percentage" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;