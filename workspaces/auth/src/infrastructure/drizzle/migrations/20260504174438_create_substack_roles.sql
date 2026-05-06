CREATE TABLE "substack_roles" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar NOT NULL,
	"substack_id" uuid NOT NULL
);

--> statement-breakpoint
ALTER TABLE
	"substack_roles"
ADD
	CONSTRAINT "substack_roles_substack_id_substacks_id_fk" FOREIGN KEY ("substack_id") REFERENCES "public"."substacks"("id") ON DELETE cascade ON UPDATE cascade;

--> statement-breakpoint
CREATE UNIQUE INDEX "substack_roles_substack_id_name_unique" ON "substack_roles" USING btree ("substack_id", "name");
