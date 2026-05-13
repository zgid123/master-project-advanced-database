import { and, eq, isNull } from '@alphacifer/drizzle/core';
import {
  type IApproveSubstackParams,
  type ICountSubstackParams,
  type IDeleteSubstackParams,
  type IFindOneSubstackParams,
  type IFindSubstackParams,
  type ISubstackRepository,
  type IUpdateSubstackParams,
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

  public async update({
    id,
    data,
  }: IUpdateSubstackParams): Promise<SubstackEntity> {
    const [updatedSubstack] = await this.#drizzle
      .update(substacks)
      .set({
        ...data,
        approved: false,
      })
      .where(and(eq(substacks.id, id), isNull(substacks.deletedAt)))
      .returning()
      .execute();

    if (!updatedSubstack) {
      throw SubstackError.notFound();
    }

    return SubstackEntity.create(updatedSubstack);
  }

  public async delete({ id }: IDeleteSubstackParams): Promise<void> {
    const [deletedSubstack] = await this.#drizzle
      .update(substacks)
      .set({
        deletedAt: new Date(),
      })
      .where(and(eq(substacks.id, id), isNull(substacks.deletedAt)))
      .returning()
      .execute();

    if (!deletedSubstack) {
      throw SubstackError.notFound();
    }
  }

  public async count({
    approved,
    includeDeleted = false,
  }: ICountSubstackParams & { includeDeleted?: boolean }): Promise<number> {
    const conditions = [];

    if (!includeDeleted) {
      conditions.push(isNull(substacks.deletedAt));
    }

    if (approved !== undefined) {
      conditions.push(eq(substacks.approved, approved));
    }

    return this.#drizzle.$count(
      substacks,
      conditions.length > 0 ? and(...conditions) : undefined,
    );
  }

  public async find({
    limit,
    ownerId,
    approved,
    includeDeleted = false,
  }: IFindSubstackParams): Promise<SubstackEntity[]> {
    const foundSubstacks = await this.#drizzle.query.substacks.findMany({
      limit,
      where: (fields, { and, eq, isNull }) => {
        const conditions = [];

        if (!includeDeleted) {
          conditions.push(isNull(fields.deletedAt));
        }

        if (approved !== undefined) {
          conditions.push(eq(fields.approved, approved));
        }

        if (ownerId !== undefined) {
          conditions.push(eq(fields.ownerId, ownerId));
        }

        return conditions.length > 0 ? and(...conditions) : undefined;
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
    includeDeleted = false,
  }: IFindOneSubstackParams & {
    includeDeleted?: boolean;
  }): Promise<SubstackEntity | null> {
    const substack = await this.#drizzle.query.substacks.findFirst({
      where: (fields, { and, eq, isNull }) => {
        const conditions = [eq(fields.slug, slug)];

        if (!includeDeleted) {
          conditions.push(isNull(fields.deletedAt));
        }

        if (approved !== undefined) {
          conditions.push(eq(fields.approved, approved));
        }

        return and(...conditions);
      },
    });

    if (!substack) {
      return null;
    }

    return SubstackEntity.create(substack);
  }
}
