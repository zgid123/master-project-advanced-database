import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
export const DEFAULT_AUDIENCE = 'solvit';
export function extractJWT({ token, secretKey = '' }, options = {}) {
    const { audience = DEFAULT_AUDIENCE, ...restOptions } = options;
    return jwt.verify(token, secretKey || process.env.JWT_SECRET, {
        ...restOptions,
        audience,
    });
}
export async function genToken({ exp, jti, payload, secretKey, algorithm = 'HS256', aud = DEFAULT_AUDIENCE, }) {
    exp ||= 60 * 60;
    jti ||= nanoid(20);
    return jwt.sign({
        ...payload,
        jti,
        aud,
    }, secretKey || process.env.JWT_SECRET, {
        algorithm,
        expiresIn: exp,
    });
}
