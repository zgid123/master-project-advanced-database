import type {
  ISubstackRepository,
  ISubstackRoleAssignmentRepository,
  ISubstackRoleRepository,
  SubstackEntity,
  TCreateSubstack,
} from '@domain/auth';
import type { ICommand } from '@domain/core';
import { slugify } from '@node/utils';

import { SubstackError } from '../../../../domain/errors';

const DEFAULT_SUBSTACK_ROLE_NAMES = ['admin', 'moderator'] as const;

export class CreateSubstackCommand
  implements ICommand<Omit<TCreateSubstack, 'slug'>, SubstackEntity>
{
  readonly #substackRepository: ISubstackRepository;
  readonly #substackRoleRepository: ISubstackRoleRepository;
  readonly #substackRoleAssignmentRepository: ISubstackRoleAssignmentRepository;

  constructor(
    substackRepository: ISubstackRepository,
    substackRoleRepository: ISubstackRoleRepository,
    substackRoleAssignmentRepository: ISubstackRoleAssignmentRepository,
  ) {
    this.#substackRepository = substackRepository;
    this.#substackRoleRepository = substackRoleRepository;
    this.#substackRoleAssignmentRepository = substackRoleAssignmentRepository;
  }

  public async exec({
    name,
    ownerId,
    description,
  }: Omit<TCreateSubstack, 'slug'>): Promise<SubstackEntity> {
    const slug = slugify(name);

    const existingSubstack = await this.#substackRepository.findPartialOne({
      slug,
    });

    if (existingSubstack) {
      throw SubstackError.alreadyExists('name');
    }

    try {
      const substack = await this.#substackRepository.create({
        name,
        slug,
        ownerId,
        description: description ?? null,
      });

      const [adminRole] = await Promise.all(
        DEFAULT_SUBSTACK_ROLE_NAMES.map((roleName) => {
          return this.#substackRoleRepository.create({
            name: roleName,
            substackId: substack.id,
          });
        }),
      );

      if (!adminRole) {
        throw SubstackError.cannotCreate();
      }

      await this.#substackRoleAssignmentRepository.create({
        userId: ownerId,
        substackRoleId: adminRole.id,
      });

      return substack;
    } catch {
      throw SubstackError.cannotCreate();
    }
  }
}
