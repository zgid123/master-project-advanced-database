import type { TSubstack } from '../schemas';

export type TSubstackEntity = TSubstack;

export class SubstackEntity implements TSubstackEntity {
  public id: string;
  public name: string;
  public slug: string;
  public ownerId: string;
  public createdAt: Date;
  public updatedAt: Date;
  public approved: boolean;
  public deletedAt: Date | null;
  public description: string | null;

  constructor({
    id,
    name,
    slug,
    ownerId,
    approved,
    deletedAt,
    createdAt,
    updatedAt,
    description,
  }: TSubstackEntity) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.ownerId = ownerId;
    this.approved = approved;
    this.deletedAt = deletedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.description = description;
  }

  public static create(params: TSubstackEntity): SubstackEntity {
    return new SubstackEntity(params);
  }
}
