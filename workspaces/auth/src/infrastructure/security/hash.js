import { genSalt, hashSync } from 'bcrypt';
export function generateSalt(characterNumber = 10) {
    return genSalt(characterNumber);
}
export async function bcryptHash({ salt, source, }) {
    salt = salt || (await generateSalt());
    return {
        salt,
        hash: hashSync(source, salt),
    };
}
