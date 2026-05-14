import { HonoError } from '@alphacifer/hono/core';
import { EXPIRED_TOKEN_CODE, EXPIRED_TOKEN_NAME, INVALID_CREDENTIALS_CODE, INVALID_CREDENTIALS_NAME, UNAUTHORIZED_CODE, UNAUTHORIZED_NAME, } from '@domain/auth';
export class AuthError extends HonoError {
    static unauthorized() {
        return new AuthError({
            status: 401,
            code: UNAUTHORIZED_CODE,
            name: UNAUTHORIZED_NAME,
            message: 'Unauthorized',
        });
    }
    static invalidCredentials() {
        return new AuthError({
            status: 401,
            code: INVALID_CREDENTIALS_CODE,
            name: INVALID_CREDENTIALS_NAME,
            message: 'Invalid credentials',
        });
    }
    static tokenExpired() {
        return new AuthError({
            status: 401,
            code: EXPIRED_TOKEN_CODE,
            name: EXPIRED_TOKEN_NAME,
            message: 'Token expired',
        });
    }
}
