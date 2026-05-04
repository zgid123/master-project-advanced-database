CREATE TABLE "substack_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"substack_role_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);

--> statement-breakpoint
ALTER TABLE
	"substack_role_assignments"
ADD
	CONSTRAINT "substack_role_assignments_substack_role_id_substack_roles_id_fk" FOREIGN KEY ("substack_role_id") REFERENCES "public"."substack_roles"("id") ON DELETE cascade ON UPDATE cascade;

--> statement-breakpoint
ALTER TABLE
	"substack_role_assignments"
ADD
	CONSTRAINT "substack_role_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;

--> statement-breakpoint
CREATE UNIQUE INDEX "substack_role_assignments_role_id_user_id_unique" ON "substack_role_assignments" USING btree ("substack_role_id", "user_id");
