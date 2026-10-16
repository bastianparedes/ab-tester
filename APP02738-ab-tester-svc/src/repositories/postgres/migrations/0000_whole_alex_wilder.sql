CREATE TYPE "public"."lifecycle_hook_option_enum" AS ENUM('scriptStart', 'executionGroupStart', 'executionGroupEnd', 'campaignStart', 'campaignEnd', 'variantCampaignStart', 'variantCampaignEnd', 'scriptEnd');--> statement-breakpoint
CREATE TYPE "public"."status_enum" AS ENUM('inactive', 'active');--> statement-breakpoint
CREATE TABLE "audiences" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"requirements" jsonb NOT NULL,
	"tenant_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "audiences_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"execution_group_id" integer,
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"requirements" jsonb NOT NULL,
	"status" "status_enum" DEFAULT 'inactive' NOT NULL,
	"tenant_id" integer NOT NULL,
	"triggers" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"variations" jsonb NOT NULL,
	CONSTRAINT "campaigns_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "execution_groups" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"only_campaigns_previously_executed" boolean NOT NULL,
	"only_one_campaign_per_page_load" boolean NOT NULL,
	"status" "status_enum" DEFAULT 'inactive' NOT NULL,
	"tenant_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"wait_for_every_campaign_to_be_evaluated" boolean NOT NULL,
	CONSTRAINT "execution_groups_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "lifecycle_hooks" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"javascript" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"option" "lifecycle_hook_option_enum" NOT NULL,
	"status" "status_enum" DEFAULT 'inactive' NOT NULL,
	"tenant_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lifecycle_hooks_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "permissions_id_unique" UNIQUE("id"),
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"permission_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"description" varchar(1024) NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "roles_id_unique" UNIQUE("id"),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"description" varchar(1024) NOT NULL,
	"domain" varchar(255) NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "tenants_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "track_events" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"get_data" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"multiple_times" boolean NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "status_enum" DEFAULT 'inactive' NOT NULL,
	"tenant_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "track_events_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"role_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"email" varchar(255) NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"status" "status_enum" DEFAULT 'active' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "audiences" ADD CONSTRAINT "audiences_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "audiences" ADD CONSTRAINT "audiences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "audiences" ADD CONSTRAINT "audiences_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_execution_group_id_execution_groups_id_fk" FOREIGN KEY ("execution_group_id") REFERENCES "public"."execution_groups"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "execution_groups" ADD CONSTRAINT "execution_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "execution_groups" ADD CONSTRAINT "execution_groups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "execution_groups" ADD CONSTRAINT "execution_groups_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "lifecycle_hooks" ADD CONSTRAINT "lifecycle_hooks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "lifecycle_hooks" ADD CONSTRAINT "lifecycle_hooks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_events" ADD CONSTRAINT "track_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "track_events" ADD CONSTRAINT "track_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "track_events" ADD CONSTRAINT "track_events_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;