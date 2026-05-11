import { and, eq, isNull } from '@alphacifer/drizzle/core';
import {
  type IApproveSubstackParams,
  type ICountSubstackParams,
  type IFindOneSubstackParams,
  type IFindSubstackParams,
  type ISubstackRepository,
  SubstackEntity,
  type TCreateSubstack,
} from '@domain/auth';

import type { TDrizzle } from '#/infrastructure/drizzle/config';
import { substacks } from '#/infrastructure/drizzle/schemas/substacks';

import { SubstackError } from '../../../domain/errors';

export class SubstackRepository implements ISubstackRepository {
  readonly #drizzle: TDrizzle;

  constructor(drizzle: TDrizzle) {
    this.#drizzle = drizzle;
  }

  public async approve({
    slug,
  }: IApproveSubstackParams): Promise<SubstackEntity> {
    const [approvedSubstack] = await this.#drizzle
      .update(substacks)
      .set({
        approved: true,
      })
      .where(and(eq(substacks.slug, slug), isNull(substacks.deletedAt)))
      .returning()
      .execute();

    if (!approvedSubstack) {
      throw SubstackError.notFound();
    }

    return SubstackEntity.create(approvedSubstack);
  }

  public async create(params: TCreateSubstack): Promise<SubstackEntity> {
    const [createdSubstack] = await this.#drizzle
      .insert(substacks)
      .values(params)
      .returning()
      .execute();

    if (!createdSubstack) {
      throw SubstackError.cannotCreate();
    }

    return SubstackEntity.create(createdSubstack);
  }

  public async count({ approved }: ICountSubstackParams): Promise<number> {
    return this.#drizzle.$count(
      substacks,
      approved === undefined
        ? isNull(substacks.deletedAt)
        : and(eq(substacks.approved, approved), isNull(substacks.deletedAt)),
    );
  }

  public async find({
    limit,
    approved,
  }: IFindSubstackParams): Promise<SubstackEntity[]> {
    const foundSubstacks = await this.#drizzle.query.substacks.findMany({
      limit,
      where: (substacks, { and, eq, isNull }) => {
        if (approved === undefined) {
          return isNull(substacks.deletedAt);
        }

        return and(
          eq(substacks.approved, approved),
          isNull(substacks.deletedAt),
        );
      },
    });

    return foundSubstacks.map((substack) => {
      return SubstackEntity.create(substack);
    });
  }

  public async findOne(
    params: IFindOneSubstackParams,
  ): Promise<SubstackEntity> {
    const substack = await this.findPartialOne(params);

    if (!substack) {
      throw SubstackError.notFound();
    }

    return substack;
  }

  public async findPartialOne({
    slug,
    approved,
  }: IFindOneSubstackParams): Promise<SubstackEntity | null> {
    const substack = await this.#drizzle.query.substacks.findFirst({
      where: (substacks, { and, eq, isNull }) => {
        if (approved === undefined) {
          return and(eq(substacks.slug, slug), isNull(substacks.deletedAt));
        }

        return and(
          eq(substacks.slug, slug),
          eq(substacks.approved, approved),
          isNull(substacks.deletedAt),
        );
      },
    });

    if (!substack) {
      return null;
    }

    return SubstackEntity.create(substack);
  }
}
