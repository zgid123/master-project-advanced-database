export function getUserDisplayName({ email, lastName, firstName, displayName, }) {
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    return displayName ?? (fullName || email);
}
