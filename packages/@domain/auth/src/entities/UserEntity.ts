import type { TRole, TUser } from '../schemas';

export type TUserEntity = TUser;

export type TUserProfile = Omit<TUserEntity, 'password'>;

export class UserEntity implements TUserEntity {
  public id: string;
  public role: TRole;
  public email: string;
  public roleId: string;
  public createdAt: Date;
  public updatedAt: Date;
  public password: string | null;
  public lastName: string | null;
  public reputationScore: number;
  public firstName: string | null;
  public displayName: string | null;
  public status: TUserEntity['status'];

  constructor({
    id,
    role,
    email,
    roleId,
    status,
    lastName,
    password,
    createdAt,
    updatedAt,
    firstName,
    displayName,
    reputationScore,
  }: TUserEntity) {
    this.id = id;
    this.role = role;
    this.email = email;
    this.roleId = roleId;
    this.status = status;
    this.lastName = lastName;
    this.password = password;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.firstName = firstName;
    this.displayName = displayName;
    this.reputationScore = reputationScore;
  }

  public static create(params: TUserEntity): UserEntity {
    return new UserEntity(params);
  }

  public isAdmin(): boolean {
    return this.role.name === 'admin';
  }

  public toProfile(): TUserProfile {
    const { password: _, ...profile } = this;

    return profile;
  }
}
