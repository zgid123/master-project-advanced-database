CREATE TABLE "substacks_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"substack_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);

--> statement-breakpoint
ALTER TABLE
	"substacks_subscriptions"
ADD
	CONSTRAINT "substacks_subscriptions_substack_id_substacks_id_fk" FOREIGN KEY ("substack_id") REFERENCES "public"."substacks"("id") ON DELETE cascade ON UPDATE cascade;

--> statement-breakpoint
ALTER TABLE
	"substacks_subscriptions"
ADD
	CONSTRAINT "substacks_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;

--> statement-breakpoint
CREATE UNIQUE INDEX "substacks_subscriptions_substack_id_user_id_unique" ON "substacks_subscriptions" USING btree ("substack_id", "user_id");
