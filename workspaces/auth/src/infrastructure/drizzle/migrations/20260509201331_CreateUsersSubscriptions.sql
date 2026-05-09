CREATE TABLE "users_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"follower_id" uuid NOT NULL
);

--> statement-breakpoint
ALTER TABLE
	"users_subscriptions"
ADD
	CONSTRAINT "users_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;

--> statement-breakpoint
ALTER TABLE
	"users_subscriptions"
ADD
	CONSTRAINT "users_subscriptions_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;

--> statement-breakpoint
CREATE UNIQUE INDEX "users_subscriptions_user_id_follower_id_unique" ON "users_subscriptions" USING btree ("user_id", "follower_id");
