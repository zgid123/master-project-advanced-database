CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);

--> statement-breakpoint
ALTER TABLE
	"users"
ADD
	COLUMN "role_id" uuid NOT NULL;

--> statement-breakpoint
ALTER TABLE
	"users"
ADD
	CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE cascade;
