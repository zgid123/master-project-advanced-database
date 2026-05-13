import type {
  ISubstackRepository,
  SubstackEntity,
  TNewSubstack,
  TUpdateSubstack,
} from '@domain/auth';
import type { ICommand } from '@domain/core';
import { slugify } from '@node/utils';

import { SubstackError } from '../../../../domain/errors';

export interface IUpdateSubstackInput {
  slug: string;
  ownerId: string;
  data: TNewSubstack;
}

export class UpdateSubstackCommand
  implements ICommand<IUpdateSubstackInput, SubstackEntity>
{
  readonly #substackRepository: ISubstackRepository;

  constructor(substackRepository: ISubstackRepository) {
    this.#substackRepository = substackRepository;
  }

  public async exec({
    slug: rawSlug,
    data,
    ownerId,
  }: IUpdateSubstackInput): Promise<SubstackEntity> {
    const slug = rawSlug.toLowerCase();
    const substack = await this.#substackRepository.findOne({
      slug,
    });

    if (substack.ownerId !== ownerId) {
      throw SubstackError.forbidden();
    }

    const newSlug = slugify(data.name);

    if (newSlug !== slug) {
      const existingSubstack = await this.#substackRepository.findPartialOne({
        slug: newSlug,
      });

      if (existingSubstack) {
        throw SubstackError.alreadyExists('name');
      }
    }

    try {
      const updatedSubstack = await this.#substackRepository.update({
        id: substack.id,
        slug,
        data: {
          name: data.name,
          description: data.description || null,
          slug: newSlug,
        } satisfies TUpdateSubstack,
      });

      return updatedSubstack;
    } catch (error) {
      if (error instanceof SubstackError) {
        throw error;
      }

      throw SubstackError.cannotUpdate();
    }
  }
}
