interface IGetUserDisplayNameParams {
  email: string;
  lastName: string | null;
  firstName: string | null;
  displayName: string | null;
}

export function getUserDisplayName({
  email,
  lastName,
  firstName,
  displayName,
}: IGetUserDisplayNameParams): string {
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  return displayName ?? (fullName || email);
}
