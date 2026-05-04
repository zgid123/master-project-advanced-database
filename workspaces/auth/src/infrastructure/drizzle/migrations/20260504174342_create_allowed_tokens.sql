CREATE TABLE "allowed_tokens" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" date,
	"user_id" uuid NOT NULL
);

--> statement-breakpoint
ALTER TABLE
	"allowed_tokens"
ADD
	CONSTRAINT "allowed_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
