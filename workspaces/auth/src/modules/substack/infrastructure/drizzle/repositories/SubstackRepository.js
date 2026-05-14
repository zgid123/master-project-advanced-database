import { and, eq, isNull } from '@alphacifer/drizzle/core';
import { SubstackEntity, } from '@domain/auth';
import { substacks } from '#/infrastructure/drizzle/schemas/substacks';
import { SubstackError } from '../../../domain/errors';
export class SubstackRepository {
    #drizzle;
    constructor(drizzle) {
        this.#drizzle = drizzle;
    }
    async approve({ slug, }) {
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
    async create(params) {
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
    async update({ id, data, }) {
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
    async delete({ id }) {
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
    async count({ approved, includeDeleted = false, }) {
        const conditions = [];
        if (!includeDeleted) {
            conditions.push(isNull(substacks.deletedAt));
        }
        if (approved !== undefined) {
            conditions.push(eq(substacks.approved, approved));
        }
        return this.#drizzle.$count(substacks, conditions.length > 0 ? and(...conditions) : undefined);
    }
    async find({ limit, ownerId, approved, includeDeleted = false, }) {
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
    async findOne(params) {
        const substack = await this.findPartialOne(params);
        if (!substack) {
            throw SubstackError.notFound();
        }
        return substack;
    }
    async findPartialOne({ slug, approved, includeDeleted = false, }) {
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
