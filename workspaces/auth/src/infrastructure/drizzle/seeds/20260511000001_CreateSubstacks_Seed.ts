import type { TDrizzle } from '../config';
import { substackRoleAssignments } from '../schemas/substackRoleAssignments';
import { substackRoles } from '../schemas/substackRoles';
import { substacks } from '../schemas/substacks';

const DEFAULT_SUBSTACK_ROLE_NAMES = ['admin', 'moderator'] as const;

const DEFAULT_SUBSTACKS = [
  {
    name: 'Backend Architecture',
    slug: 'backend-architecture',
    description:
      'API design, service boundaries, observability, and production backend patterns.',
    ownerEmail: 'user001@solvit.local',
  },
  {
    name: 'Database Design',
    slug: 'database-design',
    description:
      'Schema modeling, indexing, transactions, query tuning, and data integrity.',
    ownerEmail: 'user002@solvit.local',
  },
  {
    name: 'Frontend Engineering',
    slug: 'frontend-engineering',
    description:
      'React, routing, forms, accessibility, performance, and maintainable UI systems.',
    ownerEmail: 'user003@solvit.local',
  },
  {
    name: 'DevOps and Reliability',
    slug: 'devops-reliability',
    description:
      'Deployment pipelines, infrastructure, monitoring, incident response, and uptime.',
    ownerEmail: 'user004@solvit.local',
  },
  {
    name: 'Security Review',
    slug: 'security-review',
    description:
      'Authentication, authorization, secrets, threat modeling, and secure coding practices.',
    ownerEmail: 'user005@solvit.local',
  },
  {
    name: 'Machine Learning Lab',
    slug: 'machine-learning-lab',
    description:
      'Model training, evaluation, inference, data pipelines, and applied AI engineering.',
    ownerEmail: 'user006@solvit.local',
  },
  {
    name: 'Career and Interviews',
    slug: 'career-interviews',
    description:
      'Technical interviews, portfolio reviews, career growth, and engineering leadership.',
    ownerEmail: 'user007@solvit.local',
  },
  {
    name: 'Open Source Maintainers',
    slug: 'open-source-maintainers',
    description:
      'Maintainer workflows, issue triage, releases, contribution guides, and community health.',
    ownerEmail: 'user008@solvit.local',
  },
  {
    name: 'Cloud Native Systems',
    slug: 'cloud-native-systems',
    description:
      'Containers, Kubernetes, serverless, distributed systems, and cloud platform tradeoffs.',
    ownerEmail: 'user009@solvit.local',
  },
  {
    name: 'Product Engineering',
    slug: 'product-engineering',
    description:
      'Turning user problems into product decisions, experiments, metrics, and delivery plans.',
    ownerEmail: 'user010@solvit.local',
  },
] as const;

export async function createSubstacks(drizzle: TDrizzle): Promise<void> {
  for (const seedSubstack of DEFAULT_SUBSTACKS) {
    const owner = await drizzle.query.users.findFirst({
      where: (users, { eq }) => {
        return eq(users.email, seedSubstack.ownerEmail);
      },
    });

    if (!owner) {
      throw new Error(
        `Owner ${seedSubstack.ownerEmail} must exist before substack seed.`,
      );
    }

    const existingSubstack = await drizzle.query.substacks.findFirst({
      where: (substacks, { eq }) => {
        return eq(substacks.slug, seedSubstack.slug);
      },
    });

    const substack =
      existingSubstack ??
      (
        await drizzle
          .insert(substacks)
          .values({
            name: seedSubstack.name,
            slug: seedSubstack.slug,
            description: seedSubstack.description,
            ownerId: owner.id,
            approved: true,
          })
          .returning()
          .execute()
      )[0];

    if (!substack) {
      throw new Error(`Cannot seed substack ${seedSubstack.slug}.`);
    }

    const [adminRole] = await Promise.all(
      DEFAULT_SUBSTACK_ROLE_NAMES.map(async (roleName) => {
        const existingRole = await drizzle.query.substackRoles.findFirst({
          where: (substackRoles, { and, eq }) => {
            return and(
              eq(substackRoles.substackId, substack.id),
              eq(substackRoles.name, roleName),
            );
          },
        });

        if (existingRole) {
          return existingRole;
        }

        const [createdRole] = await drizzle
          .insert(substackRoles)
          .values({
            name: roleName,
            substackId: substack.id,
          })
          .returning()
          .execute();

        return createdRole;
      }),
    );

    if (!adminRole) {
      throw new Error(`Cannot seed admin role for ${seedSubstack.slug}.`);
    }

    const existingAssignment =
      await drizzle.query.substackRoleAssignments.findFirst({
        where: (substackRoleAssignments, operators) => {
          return operators.and(
            operators.eq(substackRoleAssignments.substackRoleId, adminRole.id),
            operators.eq(substackRoleAssignments.userId, owner.id),
          );
        },
      });

    if (!existingAssignment) {
      await drizzle
        .insert(substackRoleAssignments)
        .values({
          substackRoleId: adminRole.id,
          userId: owner.id,
        })
        .execute();
    }
  }
}
