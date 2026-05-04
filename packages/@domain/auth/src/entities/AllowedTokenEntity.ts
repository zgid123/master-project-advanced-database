import type { TAllowedToken } from '../schemas';
import type { UserEntity } from './UserEntity';

type TEntity = Omit<TAllowedToken, 'userId'>;

export type TAllowedTokenEntity = TEntity & {
  user: UserEntity | null;
};

export class AllowedTokenEntity implements TEntity {
  public id: string;
  public createdAt: Date;
  public updatedAt: Date;
  public refreshToken: string;
  public expiresAt: Date | null;
  public user: UserEntity | null;

  constructor({
    id,
    user,
    createdAt,
    expiresAt,
    updatedAt,
    refreshToken,
  }: TAllowedTokenEntity) {
    this.id = id;
    this.user = user;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.expiresAt = expiresAt;
    this.refreshToken = refreshToken;
  }

  public static create(params: TAllowedTokenEntity): AllowedTokenEntity {
    return new AllowedTokenEntity(params);
  }

  public get isExpired(): boolean {
    return !!this.expiresAt && this.expiresAt < new Date();
  }
}
