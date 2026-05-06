CREATE TABLE "substacks" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"slug" varchar NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"owner_id" uuid NOT NULL,
	CONSTRAINT "substacks_slug_unique" UNIQUE("slug")
);

--> statement-breakpoint
ALTER TABLE
	"substacks"
ADD
	CONSTRAINT "substacks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
