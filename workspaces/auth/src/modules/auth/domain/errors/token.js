import { HonoError } from '@alphacifer/hono/core';
import { CANNOT_CREATE_TOKEN_CODE, CANNOT_CREATE_TOKEN_NAME, } from '@domain/auth';
export class TokenError extends HonoError {
    code = CANNOT_CREATE_TOKEN_CODE;
    name = CANNOT_CREATE_TOKEN_NAME;
    static cannotCreate() {
        return new TokenError({
            status: 500,
            code: CANNOT_CREATE_TOKEN_CODE,
            name: CANNOT_CREATE_TOKEN_NAME,
            message: 'Cannot create token',
        });
    }
}
