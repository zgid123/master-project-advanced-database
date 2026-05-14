import { HonoError } from '@alphacifer/hono/core';
import { ROLE_NOT_FOUND_CODE, ROLE_NOT_FOUND_NAME } from '@domain/auth';
export class RoleError extends HonoError {
    static notFound() {
        return new RoleError({
            status: 404,
            code: ROLE_NOT_FOUND_CODE,
            name: ROLE_NOT_FOUND_NAME,
            message: 'Role not found',
        });
    }
}
